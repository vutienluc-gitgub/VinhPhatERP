import { NavLink } from 'react-router-dom'

import type { NavigationItem } from '@/app/router/routes'

type Props = {
  items: NavigationItem[]
  onClose: () => void
}

export function MobileMoreDrawer({ items, onClose }: Props) {
  return (
    <>
      <div className="drawer-overlay" onClick={onClose} aria-hidden="true" />
      <div className="drawer-sheet" role="dialog" aria-modal="true" aria-label="Tất cả module">
        <div className="drawer-handle" />
        <p className="drawer-title">Tất cả module</p>
        <div className="drawer-grid">
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `drawer-item${isActive ? ' is-active' : ''}`}
              onClick={onClose}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>
    </>
  )
}
