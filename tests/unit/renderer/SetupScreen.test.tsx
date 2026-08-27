import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { HostDesktopApi } from '../../../src/renderer/api/desktopApi';
import { SetupScreen } from '../../../src/renderer/features/setup/SetupScreen';
import { hostView } from './game/fixtures';

function configurationPreview(firstRoundOne = 'Round One 1') {
  return {
    draftId: 'draft-1',
    roundOne: Array.from({ length: 6 }, (_, index) => ({
      name: index === 0 ? firstRoundOne : `Round One ${index + 1}`,
      canReroll: true,
    })),
    roundTwo: Array.from({ length: 6 }, (_, index) => ({ name: `Round Two ${index + 1}`, canReroll: true })),
    final: { name: 'Final topic', canReroll: true },
  };
}

function api(overrides: Partial<HostDesktopApi> = {}): HostDesktopApi {
  return {
    surface: 'host',
    getSetupOptions: vi.fn(async () => ({
      packs: [
        { id: 'pack-one', name: 'Pack One', enabled: true, selectedByDefault: true },
        { id: 'pack-two', name: 'Pack Two', enabled: true, selectedByDefault: true },
      ],
      automaticDisplayMode: 'dual' as const,
    })),
    checkContentAvailability: vi.fn(async () => ({ ok: true as const })),
    startMatch: vi.fn(async () => undefined),
    configureMatch: vi.fn(async () => configurationPreview()),
    rerollConfiguredTopic: vi.fn(async () => configurationPreview('Replacement topic')),
    startConfiguredMatch: vi.fn(async () => undefined),
    hasResumableMatch: vi.fn(async () => false),
    resumeMatch: vi.fn(async () => null),
    listHistory: vi.fn(async () => []),
    ...overrides,
    dispatch: overrides.dispatch ?? vi.fn(async () => hostView()),
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

describe('SetupScreen', () => {
  it('leaves Adult opt-in while retaining other available packs by default', async () => {
    const checkContentAvailability = vi.fn(async () => ({ ok: true as const }));
    const desktopApi = api({
      getSetupOptions: vi.fn(async () => ({
        packs: [
          { id: 'built-in-adult', name: 'Adult (Mature) / T\u00e4iskasvanutele', enabled: true, selectedByDefault: false },
          { id: 'built-in-estonia', name: 'Estonia / Eesti', enabled: true, selectedByDefault: true },
          { id: 'built-in-finals', name: 'Finals Pack', enabled: true, selectedByDefault: true },
        ],
        automaticDisplayMode: 'dual' as const,
      })),
      checkContentAvailability,
    });
    const user = userEvent.setup();
    render(<SetupScreen api={desktopApi} onBack={vi.fn()} />);

    const adult = await screen.findByRole('checkbox', { name: 'Adult (Mature) / T\u00e4iskasvanutele' });
    const estonia = screen.getByRole('checkbox', { name: 'Estonia / Eesti' });
    const finals = screen.getByRole('checkbox', { name: 'Finals Pack' });
    expect(adult).not.toBeChecked();
    expect(estonia).toBeChecked();
    expect(finals).toBeChecked();
    await waitFor(() => expect(checkContentAvailability).toHaveBeenLastCalledWith(expect.objectContaining({
      packIds: ['built-in-estonia', 'built-in-finals'],
    })));

    await user.click(adult);
    await waitFor(() => expect(checkContentAvailability).toHaveBeenLastCalledWith(expect.objectContaining({
      packIds: ['built-in-estonia', 'built-in-finals', 'built-in-adult'],
    })));

    await user.click(estonia);
    await waitFor(() => expect(checkContentAvailability).toHaveBeenLastCalledWith(expect.objectContaining({
      packIds: ['built-in-finals', 'built-in-adult'],
    })));

    await user.click(estonia);
    await waitFor(() => expect(checkContentAvailability).toHaveBeenLastCalledWith(expect.objectContaining({
      packIds: ['built-in-finals', 'built-in-adult', 'built-in-estonia'],
    })));
    await user.click(screen.getByRole('button', { name: 'Start match' }));
    await waitFor(() => expect(desktopApi.startMatch).toHaveBeenCalledWith(expect.objectContaining({
      packIds: ['built-in-finals', 'built-in-adult', 'built-in-estonia'],
    })));
  });

  it('opens a preserved full-match topic configuration and starts the displayed draft', async () => {
    const desktopApi = api();
    const onStarted = vi.fn();
    const user = userEvent.setup();
    render(<SetupScreen api={desktopApi} onBack={vi.fn()} onStarted={onStarted} />);
    const teamName = await screen.findByRole('textbox', { name: 'Team 1 name' });
    await user.clear(teamName);
    await user.type(teamName, 'Custom Team');
    const start = screen.getByRole('button', { name: 'Start match' });
    await waitFor(() => expect(start).toBeEnabled());
    const configure = screen.getByRole('button', { name: 'Configure match' });
    expect(start.nextElementSibling).toBe(configure);

    await user.click(configure);

    expect(await screen.findByRole('heading', { name: 'Configure match' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Re-roll / })).toHaveLength(13);
    expect(screen.getByText('Final topic')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByRole('textbox', { name: 'Team 1 name' })).toHaveValue('Custom Team');

    await user.click(screen.getByRole('button', { name: 'Configure match' }));
    await user.click(await screen.findByRole('button', { name: 'Re-roll Round One topic 1: Round One 1' }));
    expect(await screen.findByText('Replacement topic')).toBeInTheDocument();
    expect(desktopApi.rerollConfiguredTopic).toHaveBeenCalledWith({
      draftId: 'draft-1', target: { round: 'round-one', index: 0 },
    });
    await user.click(screen.getByRole('button', { name: 'Start match' }));
    await waitFor(() => expect(desktopApi.startConfiguredMatch).toHaveBeenCalledWith('draft-1'));
    expect(onStarted).toHaveBeenCalledOnce();
  });

  it('constrains authored team names to the shared 32-character layout limit', async () => {
    render(<SetupScreen api={api()} onBack={vi.fn()} />);
    expect(await screen.findByRole('textbox', { name: 'Team 1 name' })).toHaveAttribute('maxlength', '32');
  });
  it('localizes only untouched generated team names across language changes and additions', async () => {
    const desktopApi = api();
    const user = userEvent.setup();
    render(<SetupScreen api={desktopApi} onBack={vi.fn()} />);
    await screen.findByRole('checkbox', { name: 'Pack One' });
    await waitFor(() => expect(desktopApi.checkContentAvailability).toHaveBeenCalled());
    const initialIdentity = vi.mocked(desktopApi.checkContentAvailability).mock.calls.at(-1)![0].teams
      .map(({ id, color }) => ({ id, color }));

    const first = screen.getByRole('textbox', { name: 'Team 1 name' });
    await user.clear(first);
    await user.type(first, 'Team 01 custom');
    await user.click(screen.getByRole('radio', { name: 'Estonian' }));

    expect(screen.getByRole('textbox', { name: 'Võistkonna 1 nimi' })).toHaveValue('Team 01 custom');
    expect(screen.getByRole('textbox', { name: 'Võistkonna 2 nimi' })).toHaveValue('Võistkond 2');
    await waitFor(() => expect(vi.mocked(desktopApi.checkContentAvailability).mock.calls.at(-1)![0].language).toBe('et'));
    expect(vi.mocked(desktopApi.checkContentAvailability).mock.calls.at(-1)![0].teams
      .map(({ id, color }) => ({ id, color }))).toEqual(initialIdentity);
    await user.click(screen.getByRole('button', { name: 'Lisa võistkond' }));
    expect(screen.getByRole('textbox', { name: 'Võistkonna 3 nimi' })).toHaveValue('Võistkond 3');

    await user.click(screen.getByRole('radio', { name: 'Inglise' }));
    expect(screen.getByRole('textbox', { name: 'Team 1 name' })).toHaveValue('Team 01 custom');
    expect(screen.getByRole('textbox', { name: 'Team 2 name' })).toHaveValue('Team 2');
    expect(screen.getByRole('textbox', { name: 'Team 3 name' })).toHaveValue('Team 3');
  });

  it('uses the active locale for initial names when setup is reopened', async () => {
    const { unmount } = render(<SetupScreen api={api()} initialLanguage="et" onBack={vi.fn()} />);
    expect(await screen.findByRole('textbox', { name: 'Võistkonna 1 nimi' })).toHaveValue('Võistkond 1');
    unmount();
    render(<SetupScreen api={api()} initialLanguage="en" onBack={vi.fn()} />);
    expect(await screen.findByRole('textbox', { name: 'Team 1 name' })).toHaveValue('Team 1');
  });

  it('adds and removes teams only within the 2 to 8 team boundary', async () => {
    const user = userEvent.setup();
    render(<SetupScreen api={api()} onBack={vi.fn()} />);
    await screen.findByRole('checkbox', { name: 'Pack One' });

    const add = screen.getByRole('button', { name: 'Add team' });
    for (let index = 0; index < 6; index += 1) await user.click(add);

    expect(screen.getByRole('group', { name: 'Team 8' })).toBeInTheDocument();
    expect(add).toBeDisabled();
    expect(screen.getAllByRole('textbox', { name: /Team \d+ name/ })).toHaveLength(8);

    for (let index = 8; index > 2; index -= 1) {
      await user.click(screen.getByRole('button', { name: `Remove Team ${index}` }));
    }
    expect(screen.getAllByRole('textbox', { name: /Team \d+ name/ })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: /Remove Team/ })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: /Remove Team/ })[0]).toBeDisabled();
  });

  it('uses the first unused color when adding after a middle team is removed', async () => {
    const desktopApi = api();
    const user = userEvent.setup();
    render(<SetupScreen api={desktopApi} onBack={vi.fn()} />);
    const add = await screen.findByRole('button', { name: 'Add team' });

    await user.click(add);
    await user.click(screen.getByRole('button', { name: 'Remove Team 2' }));
    await user.click(add);

    const colors = screen.getAllByRole('combobox', { name: /Team \d+ color/ })
      .map((control) => (control as HTMLSelectElement).value);
    expect(colors).toEqual(['#E3B341', '#57C785', '#50A7F5']);
    expect(new Set(colors).size).toBe(3);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Start match' })).toBeEnabled());
  });

  it('labels team colors with localized color names', async () => {
    const user = userEvent.setup();
    render(<SetupScreen api={api()} onBack={vi.fn()} />);

    const color = await screen.findByRole('combobox', { name: 'Team 1 color' });
    expect(color).toHaveAccessibleName('Team 1 color');
    expect(within(color).getByRole('option', { name: 'Gold' })).toHaveValue('#E3B341');
    expect(within(color).getByRole('option', { name: 'Teal' })).toHaveValue('#45C4B0');

    await user.click(screen.getByRole('radio', { name: 'Estonian' }));
    expect(within(color).getByRole('option', { name: 'Kuldne' })).toHaveValue('#E3B341');
    expect(within(color).getByRole('option', { name: 'Türkiissinine' })).toHaveValue('#45C4B0');
  });

  it('rejects empty and case-insensitive duplicate team names and requires distinct colors', async () => {
    const user = userEvent.setup();
    render(<SetupScreen api={api()} onBack={vi.fn()} />);
    const start = await screen.findByRole('button', { name: 'Start match' });
    await waitFor(() => expect(start).toBeEnabled());

    const firstName = screen.getByRole('textbox', { name: 'Team 1 name' });
    const secondName = screen.getByRole('textbox', { name: 'Team 2 name' });
    await user.clear(firstName);
    expect(start).toBeDisabled();
    expect(screen.getByText('Enter a name for every team.')).toBeInTheDocument();

    await user.type(firstName, 'ALPHA');
    await user.clear(secondName);
    await user.type(secondName, ' alpha ');
    expect(start).toBeDisabled();
    expect(screen.getByText('Team names must be unique.')).toBeInTheDocument();

    await user.clear(secondName);
    await user.type(secondName, 'Beta');
    await user.clear(firstName);
    await user.type(firstName, 'ÕUN');
    await user.clear(secondName);
    await user.type(secondName, 'O\u0303un');
    expect(start).toBeDisabled();
    expect(screen.getByText('Team names must be unique.')).toBeInTheDocument();

    await user.clear(secondName);
    await user.type(secondName, 'Beta');
    await user.selectOptions(screen.getByLabelText('Team 2 color'), '#E3B341');
    expect(start).toBeDisabled();
    expect(screen.getByText('Team colors must be unique.')).toBeInTheDocument();
  });

  it('selects all match fields, resolves Automatic to DisplayMode, and submits one validated config', async () => {
    const desktopApi = api();
    const user = userEvent.setup();
    render(<SetupScreen api={desktopApi} onBack={vi.fn()} />);

    await user.clear(await screen.findByRole('textbox', { name: 'Team 1 name' }));
    await user.type(screen.getByRole('textbox', { name: 'Team 1 name' }), 'Alpha');
    await user.click(screen.getByRole('radio', { name: 'Estonian' }));
    await user.click(screen.getByRole('radio', { name: 'Raske' }));
    await user.selectOptions(screen.getByRole('combobox', { name: 'Vihje aeg' }), '15');
    await user.click(screen.getByRole('checkbox', { name: 'Pack Two' }));
    await user.click(screen.getByRole('radio', { name: 'Automaatne' }));

    const start = screen.getByRole('button', { name: 'Alusta mängu' });
    await waitFor(() => expect(start).toBeEnabled());
    await user.click(start);
    await waitFor(() => expect(desktopApi.startMatch).toHaveBeenCalledOnce());

    expect(desktopApi.startMatch).toHaveBeenCalledWith(expect.objectContaining({
      language: 'et',
      difficulty: 'hard',
      clueSeconds: 15,
      displayMode: 'dual',
      packIds: ['pack-one'],
      teams: expect.arrayContaining([expect.objectContaining({ name: 'Alpha' })]),
    }));
  });

  it('shows the authoritative shortage counts and does not enable Start', async () => {
    const desktopApi = api({
      checkContentAvailability: vi.fn(async () => ({
        ok: false,
        roundOneMissing: 2,
        roundTwoMissing: 1,
        finalMissing: 1 as const,
      })),
    });
    render(<SetupScreen api={desktopApi} onBack={vi.fn()} />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Round One: 2 category sets missing. Round Two: 1 category set missing. Final: unavailable.',
    );
    expect(screen.getByRole('button', { name: 'Start match' })).toBeDisabled();
  });

  it('ignores a stale shortage response after a newer configuration is available', async () => {
    let resolveFirst!: (value: { ok: false; roundOneMissing: number; roundTwoMissing: number; finalMissing: 0 }) => void;
    const first = new Promise<{ ok: false; roundOneMissing: number; roundTwoMissing: number; finalMissing: 0 }>(
      (resolve) => { resolveFirst = resolve; },
    );
    const check = vi.fn()
      .mockImplementationOnce(() => first)
      .mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<SetupScreen api={api({ checkContentAvailability: check })} onBack={vi.fn()} />);

    await screen.findByRole('checkbox', { name: 'Pack One' });
    await user.click(screen.getByRole('radio', { name: 'Hard' }));
    const start = screen.getByRole('button', { name: 'Start match' });
    await waitFor(() => expect(start).toBeEnabled());

    resolveFirst({ ok: false, roundOneMissing: 6, roundTwoMissing: 6, finalMissing: 0 });
    await Promise.resolve();
    expect(start).toBeEnabled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('handles a rejected start, refreshes availability, and leaves the localized form usable', async () => {
    const check = vi.fn().mockResolvedValue({ ok: true });
    const desktopApi = api({
      checkContentAvailability: check,
      startMatch: vi.fn().mockRejectedValue(new Error('database path and internal details')),
    });
    const onStarted = vi.fn();
    const user = userEvent.setup();
    render(<SetupScreen api={desktopApi} onBack={vi.fn()} onStarted={onStarted} />);
    await user.click(await screen.findByRole('radio', { name: 'Estonian' }));
    const start = screen.getByRole('button', { name: 'Alusta mängu' });
    await waitFor(() => expect(start).toBeEnabled());

    await user.click(start);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Mängu ei saanud alustada. Kontrolli seadeid ja proovi uuesti.');
    expect(alert).not.toHaveTextContent('database path');
    expect(onStarted).not.toHaveBeenCalled();
    await waitFor(() => expect(start).toBeEnabled());
    expect(check.mock.calls.length).toBeGreaterThanOrEqual(2);

    await user.click(screen.getByRole('radio', { name: 'Raske' }));
    expect(screen.queryByText('Mängu ei saanud alustada. Kontrolli seadeid ja proovi uuesti.')).not.toBeInTheDocument();
  });

  it('shows refreshed exact shortages when authoritative start re-selection rejects', async () => {
    const shortage = {
      ok: false as const,
      roundOneMissing: 3,
      roundTwoMissing: 2,
      finalMissing: 1 as const,
    };
    const check = vi.fn()
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValue(shortage);
    const desktopApi = api({
      checkContentAvailability: check,
      startMatch: vi.fn().mockRejectedValue(new Error('CONTENT_SHORTAGE:3:2:1')),
    });
    const user = userEvent.setup();
    render(<SetupScreen api={desktopApi} onBack={vi.fn()} onStarted={vi.fn()} />);
    const start = await screen.findByRole('button', { name: 'Start match' });
    await waitFor(() => expect(start).toBeEnabled());

    await user.click(start);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Round One: 3 category sets missing. Round Two: 2 category sets missing. Final: unavailable.',
    );
    expect(start).toBeDisabled();
  });

  it('blocks a synchronous reentrant submit while the first start is in flight', async () => {
    const formRef: { current: HTMLFormElement | null } = { current: null };
    let resolveStart!: () => void;
    const pending = new Promise<void>((resolve) => { resolveStart = resolve; });
    const startMatch = vi.fn(() => {
      if (startMatch.mock.calls.length === 1 && formRef.current !== null) fireEvent.submit(formRef.current);
      return pending;
    });
    const desktopApi = api({ startMatch });
    render(<SetupScreen api={desktopApi} onBack={vi.fn()} />);
    const start = await screen.findByRole('button', { name: 'Start match' });
    await waitFor(() => expect(start).toBeEnabled());
    formRef.current = start.closest('form');

    fireEvent.submit(formRef.current!);

    expect(startMatch).toHaveBeenCalledOnce();
    resolveStart();
    await waitFor(() => expect(start).toBeEnabled());
  });

  it('revalidates the edited config when its availability resolved before the pending start fails', async () => {
    const initial = deferred<{ ok: true }>();
    const edited = deferred<{ ok: true }>();
    const refreshed = deferred<{ ok: true }>();
    const pendingStart = deferred<void>();
    const check = vi.fn()
      .mockImplementationOnce(() => initial.promise)
      .mockImplementationOnce(() => edited.promise)
      .mockImplementationOnce(() => refreshed.promise);
    const desktopApi = api({
      checkContentAvailability: check,
      startMatch: vi.fn(() => pendingStart.promise),
    });
    const user = userEvent.setup();
    render(<SetupScreen api={desktopApi} onBack={vi.fn()} />);
    const start = await screen.findByRole('button', { name: 'Start match' });
    initial.resolve({ ok: true });
    await waitFor(() => expect(start).toBeEnabled());

    await user.click(start);
    await user.click(screen.getByRole('radio', { name: 'Hard' }));
    edited.resolve({ ok: true });
    await waitFor(() => expect(check).toHaveBeenCalledTimes(2));
    pendingStart.reject(new Error('persistence failed'));
    await waitFor(() => expect(check).toHaveBeenCalledTimes(3));
    refreshed.resolve({ ok: true });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Match could not be started. Check your setup and try again.',
    );
    await waitFor(() => expect(start).toBeEnabled());
    expect(check.mock.calls[2][0]).toEqual(expect.objectContaining({ difficulty: 'hard' }));
  });

  it('ignores the superseded edited-config response when the post-failure refresh resolves first', async () => {
    const initial = deferred<{ ok: true }>();
    const superseded = deferred<{
      ok: false;
      roundOneMissing: number;
      roundTwoMissing: number;
      finalMissing: 0;
    }>();
    const refreshed = deferred<{ ok: true }>();
    const pendingStart = deferred<void>();
    const check = vi.fn()
      .mockImplementationOnce(() => initial.promise)
      .mockImplementationOnce(() => superseded.promise)
      .mockImplementationOnce(() => refreshed.promise);
    const user = userEvent.setup();
    render(<SetupScreen
      api={api({ checkContentAvailability: check, startMatch: vi.fn(() => pendingStart.promise) })}
      onBack={vi.fn()}
    />);
    const start = await screen.findByRole('button', { name: 'Start match' });
    initial.resolve({ ok: true });
    await waitFor(() => expect(start).toBeEnabled());

    await user.click(start);
    await user.click(screen.getByRole('radio', { name: 'Hard' }));
    await waitFor(() => expect(check).toHaveBeenCalledTimes(2));
    pendingStart.reject(new Error('persistence failed'));
    await waitFor(() => expect(check).toHaveBeenCalledTimes(3));
    refreshed.resolve({ ok: true });
    await waitFor(() => expect(start).toBeEnabled());
    superseded.resolve({ ok: false, roundOneMissing: 6, roundTwoMissing: 6, finalMissing: 0 });
    await Promise.resolve();

    expect(start).toBeEnabled();
    expect(screen.queryByText(/6 category sets missing/)).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Match could not be started.');
  });
});
