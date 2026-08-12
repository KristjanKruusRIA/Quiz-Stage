interface ValidationPanelProps { issues: readonly string[] }

export function ValidationPanel({ issues }: ValidationPanelProps) {
  const { t } = useI18n();
  if (issues.length === 0) return null;
  return (
    <section className="validation-panel" aria-labelledby="content-validation-title">
      <h2 id="content-validation-title">{t('validation.title')}</h2>
      <ul role="alert">
        {issues.map((issue) => <li key={issue}>{issue}</li>)}
      </ul>
    </section>
  );
}
import { useI18n } from '../../i18n';
