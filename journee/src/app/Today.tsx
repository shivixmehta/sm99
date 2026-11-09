import { longDate, partOfDay } from '../lib/time';
import { useSections } from '../sections/registry';
import { SectionCard } from './SectionCard';

const GREETING = { morning: 'Bonjour', afternoon: 'Bon après-midi', evening: 'Bonsoir', night: 'Bonne nuit' } as const;

export function Today() {
  const sections = useSections();
  return (
    <div className="page">
      <header className="page-header">
        <p className="eyebrow">{longDate()}</p>
        <h1>{GREETING[partOfDay()]}.</h1>
      </header>

      <div className="card card--soft">
        <p className="eyebrow">Your brief</p>
        <p>
          Each day, this space will hold a short brief written for you: your plan, a Stoic thought, a French phrase,
          a food idea, a culture card and a Mind Gym challenge.
        </p>
        <p className="muted small">Arrives in a later build phase, once the AI and memory are connected.</p>
      </div>

      <h3 className="list-title">Your sections</h3>
      <div className="section-grid">
        {sections.map((s) => (
          <SectionCard key={s.id} section={s} />
        ))}
      </div>
    </div>
  );
}
