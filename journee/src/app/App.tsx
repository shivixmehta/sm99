import { Suspense } from 'react';
import { Route, Routes, useParams } from 'react-router-dom';
import { Layout } from './Layout';
import { Today } from './Today';
import { SectionsIndex } from './SectionsIndex';
import { Settings } from '../settings/Settings';
import { screenFor, useSection } from '../sections/registry';
import { SectionOverview } from '../sections/SectionOverview';
import { useApplyTheme } from './theme';

function SectionRoute() {
  const { id } = useParams();
  const section = useSection(id);
  if (!section) return <NotFound />;
  const Screen = screenFor(section.id);
  if (!Screen) return <SectionOverview section={section} />;
  return (
    <Suspense fallback={<p className="muted center">Loading…</p>}>
      <Screen section={section} />
    </Suspense>
  );
}

function NotFound() {
  return <p className="muted center">Nothing here, yet.</p>;
}

export default function App() {
  useApplyTheme();
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Today />} />
        <Route path="sections" element={<SectionsIndex />} />
        <Route path="s/:id" element={<SectionRoute />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
