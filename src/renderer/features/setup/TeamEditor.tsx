import type { Team } from '../../../shared/game/types';
import { translate } from '../../i18n';
import { TEAM_NAME_MAX_LENGTH } from '../../../shared/game/teamNames';

export const TEAM_COLORS = [
  '#E3B341', '#50A7F5', '#57C785', '#F07878',
  '#B28DFF', '#FF9F43', '#45C4B0', '#F368E0',
] as const;

const TEAM_COLOR_KEYS = [
  'team.color.gold', 'team.color.blue', 'team.color.green', 'team.color.red',
  'team.color.purple', 'team.color.orange', 'team.color.teal', 'team.color.pink',
] as const;

interface TeamEditorProps {
  index: number;
  team: Team;
  language: 'en' | 'et';
  canRemove: boolean;
  onChange: (team: Team) => void;
  onRemove: () => void;
}

export function TeamEditor({
  index,
  team,
  language,
  canRemove,
  onChange,
  onRemove,
}: TeamEditorProps) {
  const number = index + 1;
  const teamLabel = translate(language, 'team.label', { number });
  const nameLabel = translate(language, 'team.name', { number });
  const colorLabel = translate(language, 'team.color', { number });
  const removeLabel = translate(language, 'team.removeLabel', { number });

  return (
    <fieldset className="team-editor" aria-label={teamLabel}>
      <legend>{teamLabel}</legend>
      <label>
        <span>{nameLabel}</span>
        <input
          type="text"
          maxLength={TEAM_NAME_MAX_LENGTH}
          value={team.name}
          onChange={(event) => onChange({ ...team, name: event.target.value })}
        />
      </label>
      <label>
        <span>{colorLabel}</span>
        <select
          value={team.color}
          onChange={(event) => onChange({ ...team, color: event.target.value })}
        >
          {TEAM_COLORS.map((color, colorIndex) => (
            <option key={color} value={color}>{translate(language, TEAM_COLOR_KEYS[colorIndex])}</option>
          ))}
        </select>
      </label>
      <span className="team-swatch" style={{ backgroundColor: team.color }} aria-hidden="true" />
      <button type="button" disabled={!canRemove} onClick={onRemove} aria-label={removeLabel}>
        {translate(language, 'team.remove')}
      </button>
    </fieldset>
  );
}
