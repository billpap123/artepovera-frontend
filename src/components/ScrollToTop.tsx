// src/components/ScrollToTop.tsx

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  // Get the current URL pathname (e.g., "/profile", "/home")
  const { pathname } = useLocation();

  // This `useEffect` hook will run every time the pathname changes
  useEffect(() => {
    // This command scrolls the window to the top left corner (0, 0)
    window.scrollTo(0, 0);
  }, [pathname]); // The effect depends on the pathname

  // This component doesn't render any HTML, it just performs an action
  return null;
};

export default ScrollToTop;