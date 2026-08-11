import type { HostGameView } from '../../../shared/game/types';

interface HostTeamControlsProps {
  view: HostGameView;
  onLock(teamId: string): void;
}

export function HostTeamControls({ view, onLock }: HostTeamControlsProps) {
  const { state } = view;
  const lockable = ['ordinary-clue', 'daily-double-clue', 'tiebreaker'].includes(state.phase)
    && state.timer.status === 'running' && state.activeClue?.lockedTeamId === null;
  return <section aria-label="Team controls" className="host-teams">
    {state.config.teams.map((team, index) => {
      const excluded = state.activeClue?.lockedOutTeamIds.includes(team.id) ?? false;
      const phaseEligible = state.phase === 'daily-double-clue'
        ? team.id === state.controllingTeamId
        : state.phase === 'tiebreaker' ? state.tiebreakerTeamIds.includes(team.id) : true;
      return <button key={team.id} type="button" aria-label={`Lock ${team.name}`} disabled={!lockable || excluded || !phaseEligible} onClick={() => onLock(team.id)}>
        Lock {team.name}<span className="shortcut"> {index + 1}</span>
      </button>;
    })}
  </section>;
}
