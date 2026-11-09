import type { CSSProperties } from 'react';
import type { SectionConfig } from './types';

/** Shows a Section's description, daily item and activities. Used as a placeholder and for user Sections. */
export function SectionOverview({ section, comingInPhase }: { section: SectionConfig; comingInPhase?: number }) {
  return (
    <div className="section-page" style={{ '--accent': section.colour } as CSSProperties}>
      <header className="section-hero">
        <span className="section-hero__icon" aria-hidden>{section.icon}</span>
        <div>
          <h1>{section.name}</h1>
          <p className="muted">{section.description}</p>
        </div>
      </header>

      <div className="card card--accent">
        <p className="eyebrow">Today</p>
        <h2>{section.dailyActivity.name}</h2>
        <p className="muted">{section.dailyActivity.description}</p>
      </div>

      <h3 className="list-title">Activities</h3>
      <ul className="activity-list">
        {section.activities.map((a) => (
          <li key={a.id} className="activity">
            <div>
              <strong>{a.name}</strong>
              <p className="muted">{a.description}</p>
            </div>
            {comingInPhase && <span className="chip">Soon</span>}
          </li>
        ))}
      </ul>

      {comingInPhase && (
        <p className="muted small center">This Section comes to life in build phase {comingInPhase}.</p>
      )}
    </div>
  );
}
