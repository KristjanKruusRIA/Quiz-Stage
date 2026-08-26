export function validateHostSender(senderId: number, hostWebContentsId: number): void {
  if (senderId !== hostWebContentsId) throw new Error('HOST_SENDER_REQUIRED');
}

export function assertIpcPayloadSize(input: unknown): void {
  let payload: string | undefined;
  try {
    payload = JSON.stringify(input);
  } catch {
    throw new Error('INVALID_IPC_PAYLOAD');
  }
  if (payload !== undefined && Buffer.byteLength(payload, 'utf8') > 1_048_576) {
    throw new Error('IPC_PAYLOAD_TOO_LARGE');
  }
}
