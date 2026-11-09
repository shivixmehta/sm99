import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import type { SectionConfig } from '../sections/types';

export function SectionCard({ section }: { section: SectionConfig }) {
  return (
    <Link to={`/s/${section.id}`} className="section-card" style={{ '--accent': section.colour } as CSSProperties}>
      <span className="section-card__icon" aria-hidden>{section.icon}</span>
      <span className="section-card__name">{section.name}</span>
      <span className="section-card__daily">{section.dailyActivity.name}</span>
    </Link>
  );
}
