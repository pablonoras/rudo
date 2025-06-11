import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export function useStandaloneRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari
    (window.navigator as any).standalone === true;

  useEffect(() => {
    if (isStandalone && location.pathname === '/') {
      navigate('/login/athlete', { replace: true });
    }
  }, [isStandalone, location.pathname, navigate]);
} 