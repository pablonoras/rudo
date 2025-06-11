import { ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface MenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  className?: string;
}

interface MenuPortalProps {
  items: MenuItem[];
  anchorEl: HTMLElement | null;
  onClose: () => void;
  [key: string]: any; // For additional attributes
}

export function MenuPortal({ items, anchorEl, onClose, ...otherProps }: MenuPortalProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const portalRoot = document.getElementById('portal-root') || document.body;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !anchorEl?.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    function positionMenu() {
      if (!menuRef.current || !anchorEl) return;

      const trigger = anchorEl.getBoundingClientRect();
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
  }, [anchorEl, onClose]);

  if (!anchorEl || !items.length) return null;

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-50 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1"
      style={{ position: 'absolute' }}
      {...otherProps}
    >
      {items.map((item) => (
        <button
          key={item.id}
          onClick={item.onClick}
          className={`w-full px-2 py-1.5 text-left flex items-center ${item.className || ''}`}
        >
          {item.icon && <span className="mr-1.5">{item.icon}</span>}
          <span>{item.label}</span>
        </button>
      ))}
    </div>,
    portalRoot
  );
}