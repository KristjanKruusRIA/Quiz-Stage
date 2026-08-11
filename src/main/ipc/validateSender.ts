export function validateHostSender(senderId: number, hostWebContentsId: number): void {
  if (senderId !== hostWebContentsId) throw new Error('HOST_SENDER_REQUIRED');
}
