'use client';

import React from 'react';
import type { UserProfile } from './CollaborationFinderScreen';
import type { FinderFilters } from './CollaborationFinderScreen';
import UserCard from './UserCard';

interface UserCardGridProps {
  users: UserProfile[];
  onViewProfile: (u: UserProfile) => void;
  onInvite: (u: UserProfile) => void;
  filters: FinderFilters;
  onClearFilters: () => void;
}

export default function UserCardGrid({ users, onViewProfile, onInvite, filters, onClearFilters }: UserCardGridProps) {
  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 animate-fade-in">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: '#F0ECFF' }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6C47FF" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
            <path d="M11 8v6M8 11h6" />
          </svg>
        </div>
        <div className="text-center">
          <h3 className="text-base font-semibold mb-1" style={{ color: '#1A1730' }}>
            No collaborators found
          </h3>
          <p className="text-sm max-w-[360px]" style={{ color: '#8B87A0' }}>
            No UCA students or tutors match your current filters. Try adjusting your skill selection or campus filter.
          </p>
        </div>
        <button onClick={onClearFilters} className="btn-primary py-2 px-5">
          Clear all filters
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-5">
      {users.map((user) => (
        <UserCard
          key={`user-card-${user.id}`}
          user={user}
          onViewProfile={() => onViewProfile(user)}
          onInvite={() => onInvite(user)}
        />
      ))}
    </div>
  );
}