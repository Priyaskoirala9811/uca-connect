'use client';

import React from 'react';
import type { UserProfile, FinderFilters } from './CollaborationFinderScreen';
import UserCard from './UserCard';

interface UserCardGridProps {
  users: UserProfile[];
  onViewProfile: (user: UserProfile) => void;
  onInvite: (user: UserProfile) => void;
  onMessage: (user: UserProfile) => void;
  filters: FinderFilters;
  onClearFilters: () => void;
}

export default function UserCardGrid({
  users,
  onViewProfile,
  onInvite,
  onMessage,
  filters,
  onClearFilters,
}: UserCardGridProps) {
  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-5xl mb-4">🔍</div>
        <h3 className="text-lg font-bold mb-2" style={{ color: '#1A1730' }}>
          No matching collaborators
        </h3>
        <p className="text-sm max-w-sm mb-4" style={{ color: '#8B87A0' }}>
          Try changing your filters or search words.
        </p>
        <button onClick={onClearFilters} className="btn-primary px-4 py-2 text-sm">
          Clear filters
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
      {users.map((user) => (
        <UserCard
          key={user.id}
          user={user}
          onViewProfile={() => onViewProfile(user)}
          onInvite={() => onInvite(user)}
          onMessage={() => onMessage(user)}
        />
      ))}
    </div>
  );
}