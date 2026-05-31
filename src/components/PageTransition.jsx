import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export default function PageTransition({ children }) {
  const location = useLocation();
  const [visible, setVisible] = useState(true);
  const prevPath = useRef(location.pathname);

  useEffect(() => {
    if (prevPath.current !== location.pathname) {
      setVisible(false);
      prevPath.current = location.pathname;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
    }
  }, [location.pathname]);

  return (
    <div
      className="transition-all duration-200 ease-out"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
      }}
    >
      {children}
    </div>
  );
}
