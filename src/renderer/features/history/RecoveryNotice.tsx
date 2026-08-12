import type { RecoveryIssue } from '../../../shared/game/types';
import { useI18n } from '../../i18n';

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
  const { t } = useI18n();
  return <p role="status" className="recovery-notice">
    {t('recovery.recovered', { sequence: recoveredFromSnapshotSequence })}
    {skippedInvalidSnapshotSequences.length === 0
      ? null
      : ` ${t('recovery.skipped', { sequences: skippedInvalidSnapshotSequences.join(', ') })}`}
    {replayIssue === null ? null : ` ${t('recovery.stopped', { sequence: replayIssue.sequence })}`}
  </p>;
}
