'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Toaster } from 'sonner';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getFirestoreUsers, type FirestoreUser } from '@/lib/firestoreService';
import FinderHeader from './FinderHeader';
import FilterSidebar from './FilterSidebar';
import UserCardGrid from './UserCardGrid';
import ProfileDrawer from './ProfileDrawer';
import InviteModal from './InviteModal';
import ChatModal from './chatModal';

export interface UserProfile {
  id: string;
  name: string;
  initials: string;
  role: 'student' | 'tutor';
  campus: string;
  course: string;
  bio: string;
  skills: string[];
  interests: string[];
  available: boolean;
  portfolioUrl?: string;
  githubUrl?: string;
  behanceUrl?: string;
  avatarColor: string;
  yearOfStudy?: string;
  projectCount: number;
  connectionCount: number;
}

export interface FinderFilters {
  search: string;
  skills: string[];
  campuses: string[];
  courses: string[];
  roles: ('student' | 'tutor')[];
  availableOnly: boolean;
}

const AVATAR_COLORS = [
  '#6C47FF', '#FF6B6B', '#F59E0B', '#22C55E',
  '#0EA5E9', '#EC4899', '#8B5CF6', '#14B8A6',
];

function firestoreUserToProfile(u: FirestoreUser): UserProfile {
  const initials = u.fullName
    ? u.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const colorIndex = u.uid.charCodeAt(0) % AVATAR_COLORS.length;

  return {
    id: u.uid,
    name: u.fullName || 'Unknown',
    initials,
    role: u.role === 'teacher' ? 'tutor' : 'student',
    campus: u.campus || '',
    course: u.course || '',
    bio: u.bio || '',
    skills: u.skills || [],
    interests: u.interests || [],
    available: u.available ?? true,
    portfolioUrl: u.portfolioUrl || undefined,
    githubUrl: u.githubUrl || undefined,
    behanceUrl: u.behanceUrl || undefined,
    avatarColor: u.avatarColor || AVATAR_COLORS[colorIndex],
    yearOfStudy: u.yearOfStudy || undefined,
    projectCount: 0,
    connectionCount: 0,
  };
}

export default function CollaborationFinderScreen() {
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUid, setCurrentUid] = useState<string | null>(null);

  const [filters, setFilters] = useState<FinderFilters>({
    search: '',
    skills: [],
    campuses: [],
    courses: [],
    roles: [],
    availableOnly: false,
  });

  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [inviteTarget, setInviteTarget] = useState<UserProfile | null>(null);
  const [messageTarget, setMessageTarget] = useState<UserProfile | null>(null);
  const [filterSidebarOpen, setFilterSidebarOpen] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUid(user.uid);
        setLoading(true);

        const users = await getFirestoreUsers(user.uid);
        setAllUsers(users.map(firestoreUserToProfile));

        setLoading(false);
      } else {
        setCurrentUid(null);
        setAllUsers([]);
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  const filteredUsers = useMemo(() => {
    return allUsers.filter((user) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();

        const matches =
          user.name.toLowerCase().includes(q) ||
          user.course.toLowerCase().includes(q) ||
          user.campus.toLowerCase().includes(q) ||
          user.bio.toLowerCase().includes(q) ||
          user.skills.some((s) => s.toLowerCase().includes(q));

        if (!matches) return false;
      }

      if (filters.skills.length > 0) {
        if (!filters.skills.some((s) => user.skills.includes(s))) return false;
      }

      if (filters.campuses.length > 0 && !filters.campuses.includes(user.campus)) {
        return false;
      }

      if (filters.courses.length > 0 && !filters.courses.includes(user.course)) {
        return false;
      }

      if (filters.roles.length > 0 && !filters.roles.includes(user.role)) {
        return false;
      }

      if (filters.availableOnly && !user.available) {
        return false;
      }

      return true;
    });
  }, [filters, allUsers]);

  const activeFilterCount =
    filters.skills.length +
    filters.campuses.length +
    filters.courses.length +
    filters.roles.length +
    (filters.availableOnly ? 1 : 0);

  const handleClearFilters = () => {
    setFilters({
      search: '',
      skills: [],
      campuses: [],
      courses: [],
      roles: [],
      availableOnly: false,
    });
  };

  return (
    <>
      <Toaster position="bottom-right" richColors />

      <div className="flex flex-col h-full overflow-hidden">
        <FinderHeader
          search={filters.search}
          onSearchChange={(v) => setFilters((f) => ({ ...f, search: v }))}
          resultCount={filteredUsers.length}
          totalCount={allUsers.length}
          activeFilterCount={activeFilterCount}
          onToggleFilterSidebar={() => setFilterSidebarOpen(!filterSidebarOpen)}
          filterSidebarOpen={filterSidebarOpen}
          onClearFilters={handleClearFilters}
        />

        <div className="flex flex-1 overflow-hidden">
          {filterSidebarOpen && (
            <FilterSidebar
              filters={filters}
              onFiltersChange={setFilters}
              onClose={() => setFilterSidebarOpen(false)}
            />
          )}

          <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                <div className="w-10 h-10 rounded-full border-4 border-[#6C47FF] border-t-transparent animate-spin mb-4" />
                <p className="text-sm" style={{ color: '#8B87A0' }}>
                  Loading collaborators…
                </p>
              </div>
            ) : allUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                <div className="text-5xl mb-4">👥</div>
                <h3 className="text-lg font-bold mb-2" style={{ color: '#1A1730' }}>
                  No collaborators yet
                </h3>
                <p className="text-sm max-w-sm" style={{ color: '#8B87A0' }}>
                  When other students create accounts, they&apos;ll appear here.
                  Invite your classmates to join UCA Connect!
                </p>
              </div>
            ) : (
              <UserCardGrid
                users={filteredUsers}
                onViewProfile={setSelectedProfile}
                onInvite={setInviteTarget}
                onMessage={setMessageTarget}
                filters={filters}
                onClearFilters={handleClearFilters}
              />
            )}
          </div>
        </div>
      </div>

      {selectedProfile && (
        <ProfileDrawer
          profile={selectedProfile}
          onClose={() => setSelectedProfile(null)}
          onInvite={(p) => {
            setSelectedProfile(null);
            setInviteTarget(p);
          }}
        />
      )}

      {inviteTarget && currentUid && (
        <InviteModal
          target={inviteTarget}
          currentUid={currentUid}
          onClose={() => setInviteTarget(null)}
        />
      )}

      {messageTarget && currentUid && (
        <ChatModal
          target={messageTarget}
          currentUid={currentUid}
          onClose={() => setMessageTarget(null)}
        />
      )}
    </>
  );
}