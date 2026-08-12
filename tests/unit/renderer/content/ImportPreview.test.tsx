import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ImportPreview } from '../../../../src/renderer/features/content/ImportPreview';
import { CSV_COLUMNS, CSV_VALIDATION_ISSUE_CODES } from '../../../../src/shared/content/csvColumns';
import { I18nProvider } from '../../../../src/renderer/i18n';

describe('ImportPreview', () => {
  it.each(['en', 'et'] as const)('renders every emitted diagnostic and column safely in %s', (locale) => {
    const issues = [
      ...CSV_VALIDATION_ISSUE_CODES.map((code, index) => ({
        code,
        message: `RAW ${code}`,
        row: index + 1,
        column: CSV_COLUMNS[index % CSV_COLUMNS.length],
      })),
      { code: '<img src=x onerror=alert(1)>', message: 'RAW HOSTILE MESSAGE', row: 99,
        column: '<script>developer_column</script>' as never },
    ];
    render(<I18nProvider locale={locale}><ImportPreview preview={{
      cancelled: false, valid: false, packId: null, packName: null, rowCount: issues.length,
      conflict: false, issues,
    }} onCommit={vi.fn()} onCancel={vi.fn()} /></I18nProvider>);

    const rows = screen.getAllByRole('listitem');
    expect(rows).toHaveLength(issues.length);
    expect(document.querySelector('img')).toBeNull();
    for (const [index, issue] of issues.entries()) {
      expect(document.body).not.toHaveTextContent(issue.message);
      expect(rows[index]).not.toHaveTextContent(issue.code);
      if (issue.column !== undefined && issue.column.includes('_')) {
        expect(rows[index]).not.toHaveTextContent(issue.column);
      }
    }
    expect(rows.every((row) => (row.textContent ?? '').trim().length > 0)).toBe(true);
  });

  it('renders every row issue and blocks commit until validation succeeds', async () => {
    const commit = vi.fn();
    render(<ImportPreview preview={{
      cancelled: false, valid: false, packId: 'pack', packName: 'Pack', rowCount: 5, conflict: false,
      issues: [
        { code: 'missing', message: 'clue is required', row: 2, column: 'clue_en' },
        { code: 'url', message: 'source URL is invalid', row: 4, column: 'source_url' },
      ],
    }} onCommit={commit} onCancel={vi.fn()} />);

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText(/Row 2.*could not be described safely/)).toBeInTheDocument();
    expect(screen.getByText(/Row 4.*could not be described safely/)).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(/\(missing\)|\(url\)/);
    expect(screen.queryByText(/clue is required|source URL is invalid/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Import pack' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel import' }));
    expect(commit).not.toHaveBeenCalled();
  });
});
