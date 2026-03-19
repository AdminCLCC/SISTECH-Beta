export function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card">
      <div className="section-head">
        <div>
          <h2 className="h2">{title}</h2>
          {subtitle ? <div className="muted small">{subtitle}</div> : null}
        </div>
      </div>
      {children}
    </section>
  );
}
