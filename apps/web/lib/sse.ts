/** One server-sent event: the `id:` line, the `event:` line if any, and the joined `data:` lines. */
export interface SseMessage {
  id?: string;
  event?: string;
  data: string;
}

/**
 * Reads server-sent events from a response body. Handles messages split across network chunks,
 * CRLF or LF line endings, comment lines (keep-alives) and multi-line data. A message with no
 * data is skipped, as the format says.
 */
export async function* parseSse(body: ReadableStream<Uint8Array>): AsyncGenerator<SseMessage> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let id: string | undefined;
  let event: string | undefined;
  let data: string[] = [];

  const flush = (): SseMessage | undefined => {
    const message: SseMessage | undefined = data.length > 0 ? { data: data.join('\n') } : undefined;
    if (message && id !== undefined) message.id = id;
    if (message && event !== undefined) message.event = event;
    id = undefined;
    event = undefined;
    data = [];
    return message;
  };

  try {
    for (;;) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      // A "\r" at the very end could be half of "\r\n", so wait for the next chunk to know.
      const held = !done && buffer.endsWith('\r') ? '\r' : '';
      const lines = buffer.slice(0, buffer.length - held.length).split(/\r\n|\n|\r/);
      // The last piece may be half a line. Keep it unless the stream is over.
      buffer = done ? '' : (lines.pop() ?? '') + held;
      for (const line of lines) {
        if (line === '') {
          const message = flush();
          if (message) yield message;
          continue;
        }
        if (line.startsWith(':')) continue;
        const colon = line.indexOf(':');
        const field = colon === -1 ? line : line.slice(0, colon);
        let content = colon === -1 ? '' : line.slice(colon + 1);
        if (content.startsWith(' ')) content = content.slice(1);
        if (field === 'data') data.push(content);
        else if (field === 'id') id = content;
        else if (field === 'event') event = content;
      }
      if (done) break;
    }
  } finally {
    reader.releaseLock();
  }
  // A message cut off before its blank line is incomplete, so it is dropped.
}
