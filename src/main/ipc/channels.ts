export const IPC_CHANNELS = {
  dispatch: 'quiz-stage:dispatch',
  startMatch: 'quiz-stage:start-match',
  contentAvailability: 'quiz-stage:content-availability',
  setupOptions: 'quiz-stage:setup-options',
  hostState: 'quiz-stage:state:host',
  publicState: 'quiz-stage:state:public',
  hostReady: 'quiz-stage:ready:host',
  publicReady: 'quiz-stage:ready:public',
} as const;
