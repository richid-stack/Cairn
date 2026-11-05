import {
  authProviderCatalog,
  errorBody,
  modelProviderCatalog,
  type Approval,
  type CairnEvent,
  type Message,
  type Thread,
} from '@cairn/contract';
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';

export interface MockOptions {
  /** Pause between streamed events, so the UI can be developed against realistic timing. */
  streamDelayMs?: number;
  /** A fixed clock makes every response repeatable. */
  now?: () => Date;
  /**
   * Adds POST /__test/reset, which empties the mock. For browser tests only, so it is off
   * unless asked for. It is not part of the API contract.
   */
  testRoutes?: boolean;
}

interface ThreadState {
  thread: Thread;
  messages: Message[];
  events: CairnEvent[];
  runs: number;
}

type Stored = { status: number; body: unknown };

const terminal = new Set(['run.completed', 'run.failed', 'run.cancelled']);

/**
 * The mock behaves like the real API will, with scripted agent replies.
 * Say `/approve-demo` in a message to get a reply that waits for an approval.
 */
export function createMockServer(options: MockOptions = {}): FastifyInstance {
  const now = options.now ?? (() => new Date());
  const delay = options.streamDelayMs ?? 0;
  const app = Fastify({ logger: false });

  const threads = new Map<string, ThreadState>();
  const order: string[] = [];
  const approvals = new Map<string, { approval: Approval; threadId: string }>();
  const keys = new Map<string, { last4: string; updatedAt: string }>();
  const idempotent = new Map<string, Stored>();
  const counters = { thr: 0, msg: 0, run: 0, apr: 0 };
  const nextId = (kind: keyof typeof counters) => `${kind}_${++counters[kind]}`;
  const iso = () => now().toISOString();

  const send = (reply: FastifyReply, status: number, body: unknown) =>
    reply.code(status).type('application/json').send(body);
  const fail = (
    request: FastifyRequest,
    reply: FastifyReply,
    status: number,
    code: string,
    message: string,
    fix?: string,
  ) => send(reply, status, errorBody(code, message, request.id, fix));

  /** Run a handler once per Idempotency-Key and replay the stored answer on a retry. */
  const once = (request: FastifyRequest, reply: FastifyReply, work: () => Stored): FastifyReply => {
    const key = request.headers['idempotency-key'];
    const id = typeof key === 'string' ? `${request.method} ${request.url} ${key}` : undefined;
    const stored = id ? idempotent.get(id) : undefined;
    if (stored) return send(reply, stored.status, stored.body);
    const result = work();
    if (id && result.status < 400) idempotent.set(id, result);
    return send(reply, result.status, result.body);
  };

  const emit = (state: ThreadState, type: CairnEvent['type'], data: unknown): CairnEvent => {
    const event = {
      id: String(state.events.length + 1),
      type,
      threadId: state.thread.id,
      at: iso(),
      data,
    } as CairnEvent;
    state.events.push(event);
    return event;
  };

  const finishReply = (state: ThreadState, runId: string, text: string) => {
    const words = text.split(' ');
    const messageId = nextId('msg');
    const chunks = [words.slice(0, 4), words.slice(4, 8), words.slice(8)]
      .map((part) => part.join(' '))
      .filter(Boolean);
    chunks.forEach((chunk, index) =>
      emit(state, 'message.delta', { messageId, text: index === 0 ? chunk : ` ${chunk}` }),
    );
    const message: Message = {
      id: messageId,
      threadId: state.thread.id,
      role: 'agent',
      text,
      createdAt: iso(),
    };
    state.messages.push(message);
    emit(state, 'message.complete', { message });
    emit(state, 'run.completed', { runId });
  };

  const scriptRun = (state: ThreadState, text: string): string => {
    const runId = nextId('run');
    state.runs += 1;
    emit(state, 'run.started', { runId });
    emit(state, 'status.update', { runId, text: 'Reading your request' });
    if (text.includes('/approve-demo')) {
      const approval: Approval = {
        id: nextId('apr'),
        runId,
        summary: 'Send the booking request to the restaurant from your email.',
        risk: 2,
        status: 'pending',
        answeredAt: null,
      };
      approvals.set(approval.id, { approval, threadId: state.thread.id });
      emit(state, 'run.waiting_approval', { runId, approval });
      return runId;
    }
    emit(state, 'run.step', {
      runId,
      step: {
        id: `${runId}_s1`,
        kind: 'tool',
        title: 'Checked your calendar',
        status: 'succeeded',
      },
    });
    finishReply(state, runId, 'Friday evening looks free, so I can book that table for two.');
    return runId;
  };

  const thread = (id: string) => threads.get(id);
  const page = <T>(items: T[], query: { cursor?: string; limit?: string }) => {
    const start = Math.max(0, Number(query.cursor ?? 0) || 0);
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 25) || 25));
    const slice = items.slice(start, start + limit);
    const next = start + limit < items.length ? String(start + limit) : null;
    return { items: slice, nextCursor: next };
  };

  app.setNotFoundHandler((request, reply) =>
    fail(request, reply, 404, 'not_found', 'There is no such route.', 'Check the address.'),
  );
  app.setErrorHandler((error, request, reply) => {
    const status = (error as { statusCode?: number }).statusCode ?? 500;
    if (status >= 500) {
      return fail(
        request,
        reply,
        500,
        'internal',
        'Something went wrong on our side.',
        'Try again.',
      );
    }
    return fail(request, reply, status, 'invalid_request', 'The request could not be read.');
  });

  app.get('/v1/health', (_request, reply) =>
    send(reply, 200, { status: 'ok', version: 'mock', time: iso() }),
  );

  app.get('/v1/auth/providers', (_request, reply) =>
    send(reply, 200, { providers: authProviderCatalog }),
  );

  app.get('/v1/model-providers', (_request, reply) =>
    send(reply, 200, { providers: modelProviderCatalog }),
  );

  app.put<{ Params: { providerId: string }; Body: { apiKey?: unknown } }>(
    '/v1/model-keys/:providerId',
    (request, reply) => {
      const provider = modelProviderCatalog.find((p) => p.id === request.params.providerId);
      if (!provider) {
        return fail(request, reply, 404, 'not_found', 'That model provider is not supported.');
      }
      const apiKey = request.body?.apiKey;
      if (typeof apiKey !== 'string' || apiKey.length < 8) {
        return fail(
          request,
          reply,
          422,
          'invalid_key',
          'That key looks too short to be real.',
          'Copy the full key from the provider and paste it again.',
        );
      }
      return once(request, reply, () => {
        const record = { last4: apiKey.slice(-4), updatedAt: iso() };
        keys.set(provider.id, record);
        return {
          status: 200,
          body: {
            providerId: provider.id,
            last4: record.last4,
            status: 'unchecked',
            updatedAt: record.updatedAt,
          },
        };
      });
    },
  );

  app.delete<{ Params: { providerId: string } }>('/v1/model-keys/:providerId', (request, reply) => {
    if (!modelProviderCatalog.some((p) => p.id === request.params.providerId)) {
      return fail(request, reply, 404, 'not_found', 'That model provider is not supported.');
    }
    keys.delete(request.params.providerId);
    return reply.code(204).send();
  });

  app.get<{ Querystring: { cursor?: string; limit?: string } }>('/v1/threads', (request, reply) => {
    const all = [...order].reverse().flatMap((id) => (thread(id) ? [thread(id)!.thread] : []));
    return send(reply, 200, page(all, request.query));
  });

  app.post<{ Body: { title?: string } | undefined }>('/v1/threads', (request, reply) =>
    once(request, reply, () => {
      const id = nextId('thr');
      const created: Thread = {
        id,
        title: request.body?.title?.trim() || 'New conversation',
        createdAt: iso(),
        updatedAt: iso(),
      };
      threads.set(id, { thread: created, messages: [], events: [], runs: 0 });
      order.push(id);
      return { status: 201, body: created };
    }),
  );

  app.get<{ Params: { threadId: string } }>('/v1/threads/:threadId', (request, reply) => {
    const state = thread(request.params.threadId);
    if (!state) return fail(request, reply, 404, 'not_found', 'That conversation does not exist.');
    return send(reply, 200, state.thread);
  });

  app.get<{ Params: { threadId: string }; Querystring: { cursor?: string; limit?: string } }>(
    '/v1/threads/:threadId/messages',
    (request, reply) => {
      const state = thread(request.params.threadId);
      if (!state)
        return fail(request, reply, 404, 'not_found', 'That conversation does not exist.');
      return send(reply, 200, page(state.messages, request.query));
    },
  );

  app.post<{ Params: { threadId: string }; Body: { text?: unknown } }>(
    '/v1/threads/:threadId/messages',
    (request, reply) => {
      const state = thread(request.params.threadId);
      if (!state)
        return fail(request, reply, 404, 'not_found', 'That conversation does not exist.');
      const text = request.body?.text;
      if (typeof text !== 'string' || text.length < 1 || text.length > 20000) {
        return fail(
          request,
          reply,
          422,
          'invalid_message',
          'A message needs between 1 and 20,000 characters.',
          'Write something and send again.',
        );
      }
      return once(request, reply, () => {
        const message: Message = {
          id: nextId('msg'),
          threadId: state.thread.id,
          role: 'user',
          text,
          createdAt: iso(),
        };
        state.messages.push(message);
        state.thread.updatedAt = iso();
        const runId = scriptRun(state, text);
        return { status: 202, body: { message, runId } };
      });
    },
  );

  app.get<{ Params: { threadId: string } }>(
    '/v1/threads/:threadId/events',
    async (request, reply) => {
      const state = thread(request.params.threadId);
      if (!state)
        return fail(request, reply, 404, 'not_found', 'That conversation does not exist.');
      const after = Number(request.headers['last-event-id'] ?? 0) || 0;
      reply.hijack();
      const res = reply.raw;
      res.writeHead(200, {
        'content-type': 'text/event-stream',
        'cache-control': 'no-cache',
        connection: 'keep-alive',
      });
      let sent = after;
      for (;;) {
        const next = state.events.filter((event) => Number(event.id) > sent);
        for (const event of next) {
          res.write(`id: ${event.id}\ndata: ${JSON.stringify(event)}\n\n`);
          sent = Number(event.id);
          if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
        }
        const last = state.events.at(-1);
        // End when the latest run is over or is waiting on the user; the client reconnects after answering.
        if (!last || sent >= Number(last.id)) {
          if (!last || terminal.has(last.type) || last.type === 'run.waiting_approval') break;
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
      }
      res.end();
    },
  );

  app.post<{ Params: { approvalId: string }; Body: { decision?: unknown } }>(
    '/v1/approvals/:approvalId/answer',
    (request, reply) => {
      const entry = approvals.get(request.params.approvalId);
      if (!entry) return fail(request, reply, 404, 'not_found', 'That approval does not exist.');
      const decision = request.body?.decision;
      if (decision !== 'approve' && decision !== 'deny') {
        return fail(request, reply, 422, 'invalid_decision', 'Choose approve or deny.');
      }
      if (entry.approval.status !== 'pending') {
        return fail(
          request,
          reply,
          409,
          'already_answered',
          'This approval was already answered.',
          'Refresh to see the result.',
        );
      }
      return once(request, reply, () => {
        const state = thread(entry.threadId)!;
        const approved = decision === 'approve';
        entry.approval = {
          ...entry.approval,
          status: approved ? 'approved' : 'denied',
          answeredAt: iso(),
        };
        const runId = entry.approval.runId;
        emit(state, 'run.resumed', { runId });
        finishReply(
          state,
          runId,
          approved
            ? 'Done. I sent the request and added it to your activity log.'
            : 'Okay, I did not send it.',
        );
        return { status: 200, body: entry.approval };
      });
    },
  );

  if (options.testRoutes) {
    app.post('/__test/reset', (_request, reply) => {
      threads.clear();
      order.length = 0;
      approvals.clear();
      keys.clear();
      idempotent.clear();
      counters.thr = counters.msg = counters.run = counters.apr = 0;
      return reply.code(204).send();
    });
  }

  return app;
}
