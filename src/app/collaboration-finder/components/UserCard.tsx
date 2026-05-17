'use client';

import React from 'react';
import type { UserProfile } from './CollaborationFinderScreen';

interface UserCardProps {
  user: UserProfile;
  onViewProfile: () => void;
  onInvite: () => void;
}

const CAMPUS_COLORS: Record<string, string> = {
  Farnham: 'badge-violet',
  Epsom: 'badge-blue',
  Canterbury: 'badge-amber',
  Rochester: 'badge-green',
};

export default function UserCard({ user, onViewProfile, onInvite }: UserCardProps) {
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
              style={{ background: user.available ? '#22C55E' : '#F59E0B' }}
              title={user.available ? 'Available for collaboration' : 'Currently busy'}
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: '#1A1730' }}>{user.name}</p>
            <p className="text-xs truncate mt-0.5" style={{ color: '#8B87A0' }}>{user.course}</p>
          </div>
        </div>

        {/* Role badge */}
        <span className={`badge flex-shrink-0 ${user.role === 'tutor' ? 'badge-coral' : 'badge-slate'}`}>
          {user.role === 'tutor' ? '👩‍🏫 Tutor' : '🎓 Student'}
        </span>
      </div>

      {/* Campus + availability */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`badge ${CAMPUS_COLORS[user.campus] || 'badge-slate'}`}>
          {user.campus}
        </span>
        <div className="flex items-center gap-1.5">
          <div className={user.available ? 'available-dot' : 'busy-dot'} />
          <span className="text-xs font-medium" style={{ color: user.available ? '#16A34A' : '#D97706' }}>
            {user.available ? 'Available' : 'Busy'}
          </span>
        </div>
      </div>

      {/* Bio */}
      <p className="text-xs leading-relaxed line-clamp-2" style={{ color: '#8B87A0' }}>
        {user.bio}
      </p>

      {/* Skills */}
      <div className="flex flex-wrap gap-1.5">
        {visibleSkills.map((skill) => (
          <span key={`card-skill-${user.id}-${skill}`} className="badge badge-violet" style={{ fontSize: '10px' }}>
            {skill}
          </span>
        ))}
        {extraSkillCount > 0 && (
          <span className="badge badge-slate" style={{ fontSize: '10px' }}>
            +{extraSkillCount} more
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs" style={{ color: '#8B87A0' }}>
        <span>
          <span className="font-semibold tabular-nums" style={{ color: '#1A1730' }}>{user.projectCount}</span> projects
        </span>
        <span>
          <span className="font-semibold tabular-nums" style={{ color: '#1A1730' }}>{user.connectionCount}</span> connections
        </span>
      </div>

      {/* Portfolio links */}
      {(user.portfolioUrl || user.githubUrl || user.behanceUrl) && (
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
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
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
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
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
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22 7h-7V5h7v2zm1.726 10c-.442 1.297-2.029 3-5.101 3-3.074 0-5.564-1.729-5.564-5.675 0-3.91 2.325-5.92 5.466-5.92 3.082 0 4.964 1.782 5.375 4.426.078.506.109 1.188.095 2.14H15.97c.13 1.202.715 1.99 1.865 1.99.524 0 .982-.218 1.302-.646l2.59.685zm-5.333-4.223c-.108-.984-.615-1.494-1.59-1.494-.968 0-1.516.554-1.659 1.494h3.249zM8.878 7.75c.894.147 1.538.694 1.538 1.672 0 1.202-.892 2.114-2.604 2.114H3V5.5h4.39c1.621 0 2.488.7 2.488 2.25zm-3.878 1.99h1.978c.568 0 .907-.295.907-.749 0-.463-.36-.726-.907-.726H5v1.475zm0 2.74h2.082c.62 0 .985-.308.985-.822 0-.504-.365-.801-.985-.801H5V12.48z"/>
              </svg>
              Behance
            </a>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1 border-t" style={{ borderColor: '#F0ECFF' }}>
        <button
          onClick={(e) => { e.stopPropagation(); onViewProfile(); }}
          className="flex-1 py-2 rounded-xl text-xs font-medium transition-all duration-150 hover:bg-[#F0ECFF] active:scale-95 border"
          style={{ borderColor: '#E8E6F0', color: '#4A4665' }}
        >
          View Profile
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onInvite(); }}
          className="flex-1 btn-primary py-2 text-xs"
          disabled={!user.available}
          style={{ opacity: user.available ? 1 : 0.5 }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
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