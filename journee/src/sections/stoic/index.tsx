import type { SectionConfig } from '../types';
import { SectionOverview } from '../SectionOverview';
import { Chat } from '../../ai/Chat';

/** Stoic & Growth. Phase 2 adds the Socratic coach; Phase 8 builds the rest. */
export default function Screen({ section }: { section: SectionConfig }) {
  return (
    <>
      <SectionOverview section={section} comingInPhase={8} ready={['coach']} />
      <h3 className="list-title">Socratic coach</h3>
      <Chat
        section={section}
        greeting="What’s on your mind today? A worry, a decision, or a question about Stoicism; we can think it through together."
        placeholder="What’s on your mind?"
      />
    </>
  );
}
