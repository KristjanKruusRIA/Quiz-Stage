interface ValidationPanelProps { issues: readonly string[] }

export function ValidationPanel({ issues }: ValidationPanelProps) {
  if (issues.length === 0) return null;
  return (
    <section className="validation-panel" aria-labelledby="content-validation-title">
      <h2 id="content-validation-title">Validation</h2>
      <ul role="alert">
        {issues.map((issue) => <li key={issue}>{issue}</li>)}
      </ul>
    </section>
  );
}
