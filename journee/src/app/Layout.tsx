import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

const NAV = [
  { to: '/', label: 'Today', icon: '☀️', end: true },
  { to: '/s/my-day', label: 'My Day', icon: '🌅' },
  { to: '/s/langue', label: 'Langue', icon: '🇫🇷' },
  { to: '/sections', label: 'Sections', icon: '🧭' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

export function Layout() {
  const { pathname } = useLocation();
  // Braces matter: an effect must not return scrollTo()’s value (newer browsers return a Promise, which React would call as cleanup).
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="app">
      <main className="app-main">
        <Outlet />
      </main>
      <nav className="bottom-nav" aria-label="Main">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className="bottom-nav__item">
            <span className="bottom-nav__icon" aria-hidden>{n.icon}</span>
            <span className="bottom-nav__label">{n.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
