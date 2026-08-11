export const IPC_CHANNELS = {
  dispatch: 'quiz-stage:dispatch',
  hostState: 'quiz-stage:state:host',
  publicState: 'quiz-stage:state:public',
  hostReady: 'quiz-stage:ready:host',
  publicReady: 'quiz-stage:ready:public',
} as const;
