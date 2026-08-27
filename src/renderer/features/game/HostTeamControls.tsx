import type { HostGameView } from '../../../shared/game/types';
import { createTranslator } from '../../i18n';

interface HostTeamControlsProps {
  view: HostGameView;
  onLock(teamId: string): void;
}

export function HostTeamControls({ view, onLock }: HostTeamControlsProps) {
  const { state } = view;
  const t = createTranslator(state.config.language);
  const lockable = ['ordinary-clue', 'daily-double-clue', 'tiebreaker'].includes(state.phase)
    && state.timer.status === 'running' && state.activeClue?.lockedTeamId === null;
  return <section aria-label={t('host.teamControls')} className="host-teams">
    {state.config.teams.map((team) => {
      const excluded = state.activeClue?.lockedOutTeamIds.includes(team.id) ?? false;
      const phaseEligible = state.phase === 'daily-double-clue'
        ? team.id === state.controllingTeamId
        : state.phase === 'tiebreaker' ? state.tiebreakerTeamIds.includes(team.id) : true;
      return <button key={team.id} type="button" aria-label={t('host.lock', { team: team.name })} disabled={!lockable || excluded || !phaseEligible} onClick={() => onLock(team.id)}>
        {t('host.lock', { team: team.name })}
      </button>;
    })}
  </section>;
}
