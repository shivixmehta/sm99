import type { SectionConfig } from '../types';
import { SectionOverview } from '../SectionOverview';

/** Placeholder until Phase 6 builds this Section's activities. */
export default function Screen({ section }: { section: SectionConfig }) {
  return <SectionOverview section={section} comingInPhase={6} />;
}
