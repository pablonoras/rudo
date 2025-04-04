import { useEffect, useRef, ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface MenuPortalProps {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement>;
}

export function MenuPortal({ children, isOpen, onClose, triggerRef }: MenuPortalProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const portalRoot = document.getElementById('portal-root');

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !triggerRef.current?.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    function positionMenu() {
      if (!menuRef.current || !triggerRef.current) return;

      const trigger = triggerRef.current.getBoundingClientRect();
      const menu = menuRef.current.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      };

      // Default position below and aligned to the right
      let top = trigger.bottom + window.scrollY;
      let left = trigger.right - menu.width + window.scrollX;

      // Check if menu would go off the right edge
      if (trigger.right + menu.width > viewport.width) {
        left = trigger.left + window.scrollX;
      }

      // Check if menu would go off the bottom edge
      if (trigger.bottom + menu.height > viewport.height) {
        top = trigger.top - menu.height + window.scrollY;
      }

      menuRef.current.style.top = `${top}px`;
      menuRef.current.style.left = `${left}px`;
    }

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', positionMenu);
    window.addEventListener('resize', positionMenu);

    // Initial positioning
    requestAnimationFrame(positionMenu);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', positionMenu);
      window.removeEventListener('resize', positionMenu);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen || !portalRoot) return null;

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-50 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1"
      style={{ position: 'absolute' }}
    >
      {children}
    </div>,
    portalRoot
  );
}