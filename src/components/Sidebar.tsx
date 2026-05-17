'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppLogo from './ui/AppLogo';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { firebaseLogout } from '@/lib/firebaseAuth';
import { subscribeToInvites } from '@/lib/firestoreService';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  currentPath: string;
}

const navItems = [
  {
    key: 'nav-dashboard',
    label: 'Dashboard',
    href: '/project-workspace',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    key: 'nav-finder',
    label: 'Collaboration Finder',
    href: '/collaboration-finder',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
        <path d="M11 8v6M8 11h6" />
      </svg>
    ),
  },
  {
    key: 'nav-projects',
    label: 'My Projects',
    href: '/project-workspace',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 7a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z" />
      </svg>
    ),
  },
  {
    key: 'nav-library',
    label: 'Student Library',
    href: '/student-library',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
];

export default function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onMobileClose,
  currentPath,
}: SidebarProps) {
  const router = useRouter();
  const [currentUid, setCurrentUid] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [notifCount, setNotifCount] = useState(0);
  const sidebarWidth = collapsed ? '72px' : '240px';

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUid(user.uid);
        setDisplayName(user.displayName || user.email?.split('@')[0] || 'User');
        setUserEmail(user.email || '');
      } else {
        setCurrentUid(null);
        setDisplayName('');
        setUserEmail('');
        setNotifCount(0);
      }
    });
    return () => unsub();
  }, []);

  // Subscribe to pending invites for notification badge
  useEffect(() => {
    if (!currentUid) return;
    const unsub = subscribeToInvites(currentUid, (invites) => {
      setNotifCount(invites.filter((i) => i.status === 'pending').length);
    });
    return () => unsub();
  }, [currentUid]);

  const handleLogout = async () => {
    try { await firebaseLogout(); } catch { /* ignore */ }
    router.push('/sign-up-login-screen');
  };

  const initials = displayName
    ? displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-white transition-all duration-300
        lg:relative lg:translate-x-0
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
      style={{ width: sidebarWidth, borderColor: '#E8E6F0', minHeight: '100vh' }}
    >
      {/* Logo */}
      <div
        className={`flex items-center gap-3 px-4 py-5 border-b flex-shrink-0 ${collapsed ? 'justify-center px-2' : ''}`}
        style={{ borderColor: '#E8E6F0' }}
      >
        <div className="flex items-center gap-2 flex-shrink-0">
          <AppLogo size={32} />
          {!collapsed && (
            <span className="font-semibold text-base tracking-tight" style={{ color: '#1A1730' }}>UCA Connect</span>
          )}
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-2 flex flex-col gap-1">
        {!collapsed && (
          <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: '#8B87A0' }}>Main</p>
        )}
        {navItems.map((item) => {
          const isActive = currentPath === item.href;
          return (
            <Link
              key={item.key}
              href={item.href}
              onClick={onMobileClose}
              className={`sidebar-item group relative ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
            </Link>
          );
        })}

        <div className="my-3 border-t" style={{ borderColor: '#E8E6F0' }} />

        {!collapsed && (
          <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: '#8B87A0' }}>Account</p>
        )}

        {/* My Profile link with notification badge */}
        <Link
          href="/profile"
          onClick={onMobileClose}
          className={`sidebar-item relative ${currentPath === '/profile' ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`}
          title={collapsed ? 'My Profile' : undefined}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
          {!collapsed && (
            <>
              <span className="flex-1 truncate">My Profile</span>
              {notifCount > 0 && (
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full" style={{ background: '#FEF2F2', color: '#EF4444' }}>
                  {notifCount}
                </span>
              )}
            </>
          )}
          {collapsed && notifCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 text-xs flex items-center justify-center rounded-full text-white font-bold" style={{ background: '#EF4444', fontSize: '9px' }}>
              {notifCount}
            </span>
          )}
        </Link>
      </nav>

      {/* Bottom: user info + collapse + logout */}
      <div className="flex-shrink-0 border-t px-2 py-3" style={{ borderColor: '#E8E6F0' }}>
        {!collapsed && displayName && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl mb-2 hover:bg-gray-50 cursor-pointer transition-colors">
            <div
              className="avatar w-8 h-8 text-xs flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #6C47FF, #FF6B6B)' }}
            >
              <span>{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: '#1A1730' }}>{displayName}</p>
              <p className="text-xs truncate" style={{ color: '#8B87A0' }}>{userEmail}</p>
            </div>
          </div>
        )}

        {!collapsed && (
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 hover:bg-red-50 mb-1"
            style={{ color: '#EF4444' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign Out
          </button>
        )}

        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium transition-all duration-150 hover:bg-gray-50"
          style={{ color: '#8B87A0' }}
        >
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}