import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '@/features/auth/AuthProvider'
import { navigationItems } from '@/app/router/routes'
import type { UserRole } from '@/services/supabase/database.types'
import { MobileMoreDrawer } from './MobileMoreDrawer'

function getCurrentItem(pathname: string) {
  return navigationItems.find((item) => (item.path === '/' ? pathname === '/' : pathname.startsWith(item.path)))
}

function hasAccess(requiredRoles: UserRole[] | undefined, role: UserRole | undefined): boolean {
  if (!requiredRoles || requiredRoles.length === 0) return true
  return role !== undefined && requiredRoles.includes(role)
}

const roleLabel: Record<UserRole, string> = {
  admin: 'Admin',
  manager: 'Manager',
  staff: 'Staff',
  driver: 'Tài xế',
  viewer: 'Viewer',
  sale: 'Sale',
}

export function AppShell() {
  const { pathname } = useLocation()
  const { profile, signOut } = useAuth()
  const [showMore, setShowMore] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const currentItem = getCurrentItem(pathname)

  const userRole = profile?.role
  const visibleNavItems = navigationItems.filter((item) => hasAccess(item.requiredRoles, userRole))
  const primaryItems = visibleNavItems.filter((item) => item.primaryMobile)
  const secondaryItems = visibleNavItems.filter((item) => !item.primaryMobile)
  const isSecondaryActive = secondaryItems.some((item) =>
    item.path === '/' ? pathname === '/' : pathname.startsWith(item.path)
  )

  // Close user menu on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }
    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showUserMenu])

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <div className="shell-layout">
      <aside className="sidebar-nav">
        <div className="brand-block">
          <p className="eyebrow">Vinh Phát App V2</p>
          <h1>Vận hành dệt may mobile-first</h1>
          <p className="brand-copy">
            React, TypeScript, Supabase và route skeleton theo feature cho MVP V2.
          </p>
        </div>

        <nav className="nav-stack" aria-label="Main navigation">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}
              end={item.path === '/'}
            >
              <span className="nav-link-title">{item.label}</span>
              <span className="nav-link-meta">{item.shortLabel}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="content-shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">{currentItem?.shortLabel ?? 'MVP V2'}</p>
            <h2>{currentItem?.label ?? 'Dashboard'}</h2>
            <p className="topbar-subtitle">{currentItem?.description ?? 'Scaffold cho nghiep vu va trai nghiem mobile-first.'}</p>
          </div>
          <div className="topbar-actions" ref={userMenuRef}>
            {profile && (
              <button
                type="button"
                className="user-trigger"
                onClick={() => setShowUserMenu((v) => !v)}
                aria-expanded={showUserMenu}
                aria-haspopup="true"
              >
                <span className="user-avatar">{initials}</span>
                <span className="user-name">{profile.full_name || profile.id}</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}

            {showUserMenu && profile && (
              <div className="user-dropdown" role="menu">
                <div className="user-dropdown-header">
                  <span className="user-dropdown-name">{profile.full_name || profile.id}</span>
                  <span className="status-pill">{roleLabel[profile.role] ?? profile.role}</span>
                </div>
                <div className="user-dropdown-divider" />
                <button
                  type="button"
                  className="user-dropdown-item"
                  role="menuitem"
                  onClick={() => { setShowUserMenu(false); signOut() }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M6 14H3.333A1.333 1.333 0 012 12.667V3.333A1.333 1.333 0 013.333 2H6M10.667 11.333L14 8m0 0l-3.333-3.333M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="route-content">
          <Outlet />
        </main>
      </div>

      <nav className="mobile-nav" aria-label="Bottom navigation">
        {primaryItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `mobile-nav-link${isActive ? ' is-active' : ''}`}
            end={item.path === '/'}
          >
            <span>{item.shortLabel}</span>
          </NavLink>
        ))}
        <button
          type="button"
          className={`mobile-nav-link mobile-more-btn${isSecondaryActive ? ' is-active' : ''}`}
          onClick={() => setShowMore(true)}
          aria-label="Xem thêm module"
        >
          <span>···</span>
        </button>
      </nav>

      {showMore && (
        <MobileMoreDrawer items={secondaryItems} onClose={() => setShowMore(false)} />
      )}
    </div>
  )
}
