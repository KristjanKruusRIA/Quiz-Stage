export type GameCommand =
  | { type: 'SelectClue'; clueId: string }
  | { type: 'LockTeam'; teamId: string; at: number }
  | { type: 'StartNarratedClueTimer'; clueId: string; narrationSequence: number }
  | { type: 'JudgeResponse'; correct: boolean; at: number }
  | { type: 'SubmitDailyDoubleWager'; wager: number }
  | { type: 'SubmitFinalWager'; teamId: string; wager: number }
  | { type: 'RevealFinalTeam'; teamId: string; correct: boolean }
  | { type: 'PauseTimer'; at: number }
  | { type: 'ResumeTimer'; at: number }
  | { type: 'ResetTimer'; at: number }
  | { type: 'RevealResponse' }
  | { type: 'AdvanceAfterReveal' }
  | { type: 'UndoLast' }
  | { type: 'ReopenClue' }
  | { type: 'EndIncompleteMatch' }
  | { type: 'AdjustScore'; teamId: string; score: number; reason: string }
  | { type: 'ReportClue'; clueId: string; reason: string };
