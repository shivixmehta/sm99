import { useSections } from '../sections/registry';
import { SectionCard } from './SectionCard';

export function SectionsIndex() {
  const sections = useSections();
  return (
    <div className="page">
      <header className="page-header">
        <h1>Sections</h1>
        <p className="muted">Every area of Journée. You’ll be able to add your own.</p>
      </header>
      <div className="section-grid">
        {sections.map((s) => (
          <SectionCard key={s.id} section={s} />
        ))}
        <div className="section-card section-card--add" aria-disabled>
          <span className="section-card__icon" aria-hidden>＋</span>
          <span className="section-card__name">Add a Section</span>
          <span className="section-card__daily">Coming soon</span>
        </div>
      </div>
    </div>
  );
}
