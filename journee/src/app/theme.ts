import { useEffect } from 'react';
import { useSetting } from '../db/settings';

/** Applies the theme preference as <html data-theme>. 'system' removes it so the media query decides. */
export function useApplyTheme() {
  const theme = useSetting('theme');
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
  }, [theme]);
}
