import type { RecoveryIssue } from '../../../shared/game/types';

interface RecoveryNoticeProps {
  recoveredFromSnapshotSequence: number;
  skippedInvalidSnapshotSequences: number[];
  replayIssue: RecoveryIssue | null;
}

export function RecoveryNotice({
  recoveredFromSnapshotSequence,
  skippedInvalidSnapshotSequences,
  replayIssue,
}: RecoveryNoticeProps) {
  return <p role="status" className="recovery-notice">
    Recovered from snapshot {recoveredFromSnapshotSequence}.
    {skippedInvalidSnapshotSequences.length === 0
      ? null
      : ` Skipped invalid snapshots ${skippedInvalidSnapshotSequences.join(', ')}.`}
    {replayIssue === null ? null : ` Replay stopped before event ${replayIssue.sequence}.`}
  </p>;
}
