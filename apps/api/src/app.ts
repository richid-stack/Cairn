import { errorBody } from '@cairn/contract';
import { listOperations, loadSpec } from '@cairn/contract/spec';
import Fastify, { type FastifyInstance } from 'fastify';
import type { Config } from './config.js';

/** Operations implemented so far. Everything else in the contract answers 501. */
const implemented = new Set(['getHealth', 'listAuthProviders']);

export function buildApp(config: Config): FastifyInstance {
  const app = Fastify({ logger: false });

  app.setNotFoundHandler((request, reply) =>
    reply
      .code(404)
      .send(errorBody('not_found', 'There is no such route.', request.id, 'Check the address.')),
  );
  app.setErrorHandler((error, request, reply) => {
    const status = (error as { statusCode?: number }).statusCode ?? 500;
    if (status >= 500) {
      return reply
        .code(500)
        .send(errorBody('internal', 'Something went wrong on our side.', request.id, 'Try again.'));
    }
    return reply
      .code(status)
      .send(errorBody('invalid_request', 'The request could not be read.', request.id));
  });

  app.get('/v1/health', (_request, reply) =>
    reply.send({ status: 'ok', version: config.version, time: new Date().toISOString() }),
  );

  app.get('/v1/auth/providers', (_request, reply) =>
    reply.send({ providers: config.authProviders }),
  );

  // Reserve every other route in the contract so clients get a clear answer, not a bare 404.
  for (const operation of listOperations(loadSpec())) {
    if (implemented.has(operation.operationId)) continue;
    const url = operation.path.replace(/\{(\w+)\}/g, ':$1');
    app.route({
      method: operation.method.toUpperCase() as 'GET' | 'POST' | 'PUT' | 'DELETE',
      url,
      handler: (request, reply) =>
        reply
          .code(501)
          .send(
            errorBody(
              'not_implemented',
              'This part of Cairn is not built yet.',
              request.id,
              `It is planned; see the roadmap. Operation: ${operation.operationId}.`,
            ),
          ),
    });
  }

  return app;
}
