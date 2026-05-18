'use client';

import React from 'react';
import type { UserProfile } from './CollaborationFinderScreen';

interface UserCardProps {
  user: UserProfile;
  onViewProfile: () => void;
  onInvite: () => void;
  onMessage: () => void;
}

const CAMPUS_COLORS: Record<string, string> = {
  Farnham: 'badge-violet',
  Epsom: 'badge-blue',
  Canterbury: 'badge-amber',
  Rochester: 'badge-green',
};

export default function UserCard({
  user,
  onViewProfile,
  onInvite,
  onMessage,
}: UserCardProps) {
  const visibleSkills = user.skills.slice(0, 4);
  const extraSkillCount = user.skills.length - visibleSkills.length;

  return (
    <div className="user-card" onClick={onViewProfile}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <div
              className="avatar w-12 h-12 text-sm"
              style={{ background: user.avatarColor }}
            >
              <span>{user.initials}</span>
            </div>

            <div
              className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white"
              style={{
                background: user.available ? '#22C55E' : '#F59E0B',
              }}
              title={
                user.available
                  ? 'Available for collaboration'
                  : 'Currently busy'
              }
            />
          </div>

          <div className="min-w-0">
            <p
              className="text-sm font-semibold truncate"
              style={{ color: '#1A1730' }}
            >
              {user.name}
            </p>

            <p
              className="text-xs truncate mt-0.5"
              style={{ color: '#8B87A0' }}
            >
              {user.course}
            </p>
          </div>
        </div>

        {/* Role badge */}
        <span
          className={`badge flex-shrink-0 ${
            user.role === 'tutor'
              ? 'badge-coral'
              : 'badge-slate'
          }`}
        >
          {user.role === 'tutor'
            ? '👩‍🏫 Tutor'
            : '🎓 Student'}
        </span>
      </div>

      {/* Campus + availability */}
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={`badge ${
            CAMPUS_COLORS[user.campus] || 'badge-slate'
          }`}
        >
          {user.campus}
        </span>

        <div className="flex items-center gap-1.5">
          <div
            className={
              user.available
                ? 'available-dot'
                : 'busy-dot'
            }
          />

          <span
            className="text-xs font-medium"
            style={{
              color: user.available
                ? '#16A34A'
                : '#D97706',
            }}
          >
            {user.available ? 'Available' : 'Busy'}
          </span>
        </div>
      </div>

      {/* Bio */}
      <p
        className="text-xs leading-relaxed line-clamp-2"
        style={{ color: '#8B87A0' }}
      >
        {user.bio}
      </p>

      {/* Skills */}
      <div className="flex flex-wrap gap-1.5">
        {visibleSkills.map((skill) => (
          <span
            key={`card-skill-${user.id}-${skill}`}
            className="badge badge-violet"
            style={{ fontSize: '10px' }}
          >
            {skill}
          </span>
        ))}

        {extraSkillCount > 0 && (
          <span
            className="badge badge-slate"
            style={{ fontSize: '10px' }}
          >
            +{extraSkillCount} more
          </span>
        )}
      </div>

      {/* Stats */}
      <div
        className="flex items-center gap-4 text-xs"
        style={{ color: '#8B87A0' }}
      >
        <span>
          <span
            className="font-semibold tabular-nums"
            style={{ color: '#1A1730' }}
          >
            {user.projectCount}
          </span>{' '}
          projects
        </span>

        <span>
          <span
            className="font-semibold tabular-nums"
            style={{ color: '#1A1730' }}
          >
            {user.connectionCount}
          </span>{' '}
          connections
        </span>
      </div>

      {/* Portfolio links */}
      {(user.portfolioUrl ||
        user.githubUrl ||
        user.behanceUrl) && (
        <div className="flex items-center gap-2">
          {user.portfolioUrl && (
            <a
              href={user.portfolioUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-xs font-medium transition-colors hover:text-[#6C47FF]"
              style={{ color: '#8B87A0' }}
            >
              Portfolio
            </a>
          )}

          {user.githubUrl && (
            <a
              href={user.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-xs font-medium transition-colors hover:text-[#6C47FF]"
              style={{ color: '#8B87A0' }}
            >
              GitHub
            </a>
          )}

          {user.behanceUrl && (
            <a
              href={user.behanceUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-xs font-medium transition-colors hover:text-[#6C47FF]"
              style={{ color: '#8B87A0' }}
            >
              Behance
            </a>
          )}
        </div>
      )}

      {/* Actions */}
      <div
        className="flex gap-2 pt-1 border-t"
        style={{ borderColor: '#F0ECFF' }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewProfile();
          }}
          className="flex-1 py-2 rounded-xl text-xs font-medium transition-all duration-150 hover:bg-[#F0ECFF] active:scale-95 border"
          style={{
            borderColor: '#E8E6F0',
            color: '#4A4665',
          }}
        >
          View Profile
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onMessage();
          }}
          className="flex-1 py-2 rounded-xl text-xs font-medium transition-all duration-150 hover:bg-[#F0ECFF] active:scale-95 border"
          style={{
            borderColor: '#E8E6F0',
            color: '#4A4665',
          }}
        >
          Message
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onInvite();
          }}
          className="flex-1 btn-primary py-2 text-xs flex items-center justify-center gap-1"
          disabled={!user.available}
          style={{
            opacity: user.available ? 1 : 0.5,
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>

          Invite
        </button>
      </div>
    </div>
  );
}