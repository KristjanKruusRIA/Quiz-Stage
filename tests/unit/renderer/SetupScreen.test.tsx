import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { HostDesktopApi } from '../../../src/renderer/api/desktopApi';
import { SetupScreen } from '../../../src/renderer/features/setup/SetupScreen';

function api(overrides: Partial<HostDesktopApi> = {}): HostDesktopApi {
  return {
    surface: 'host',
    getSetupOptions: vi.fn(async () => ({
      packs: [
        { id: 'pack-one', name: 'Pack One', enabled: true },
        { id: 'pack-two', name: 'Pack Two', enabled: true },
      ],
      automaticDisplayMode: 'dual' as const,
    })),
    checkContentAvailability: vi.fn(async () => ({ ok: true as const })),
    startMatch: vi.fn(async () => undefined),
    ...overrides,
  };
}

describe('SetupScreen', () => {
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
});
