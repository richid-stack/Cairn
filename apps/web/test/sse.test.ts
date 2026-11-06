// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { parseSse, type SseMessage } from '../lib/sse';

function streamOf(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
}

async function collect(chunks: string[]): Promise<SseMessage[]> {
  const out: SseMessage[] = [];
  for await (const message of parseSse(streamOf(chunks))) out.push(message);
  return out;
}

describe('parseSse', () => {
  it('reads id and data', async () => {
    expect(await collect(['id: 1\ndata: {"a":1}\n\n'])).toEqual([{ id: '1', data: '{"a":1}' }]);
  });

  it('puts back together a message split anywhere across chunks', async () => {
    const whole = 'id: 7\ndata: hello world\n\nid: 8\ndata: next\n\n';
    for (let cut = 1; cut < whole.length; cut += 1) {
      const result = await collect([whole.slice(0, cut), whole.slice(cut)]);
      expect(result).toEqual([
        { id: '7', data: 'hello world' },
        { id: '8', data: 'next' },
      ]);
    }
  });

  it('handles CRLF, even when the pair is split between chunks', async () => {
    expect(await collect(['id: 1\r\ndata: a\r', '\n\r\n'])).toEqual([{ id: '1', data: 'a' }]);
  });

  it('joins several data lines with a newline', async () => {
    expect(await collect(['data: one\ndata: two\n\n'])).toEqual([{ data: 'one\ntwo' }]);
  });

  it('skips comments and keep-alives, and messages with no data', async () => {
    expect(await collect([': ping\n\nid: 3\n\ndata: x\n\n'])).toEqual([{ data: 'x' }]);
  });

  it('drops a message cut off before its blank line', async () => {
    expect(await collect(['data: whole\n\ndata: half'])).toEqual([{ data: 'whole' }]);
  });

  it('keeps multi-byte characters that are split between chunks', async () => {
    const bytes = new TextEncoder().encode('data: Akwaaba, ɛyɛ 👋\n\n');
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes.slice(0, 15));
        controller.enqueue(bytes.slice(15));
        controller.close();
      },
    });
    const out: SseMessage[] = [];
    for await (const m of parseSse(stream)) out.push(m);
    expect(out).toEqual([{ data: 'Akwaaba, ɛyɛ 👋' }]);
  });
});
