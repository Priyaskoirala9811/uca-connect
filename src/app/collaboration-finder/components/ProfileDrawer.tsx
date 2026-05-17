'use client';

import React, { useEffect } from 'react';
import type { UserProfile } from './CollaborationFinderScreen';

interface ProfileDrawerProps {
  profile: UserProfile;
  onClose: () => void;
  onInvite: (p: UserProfile) => void;
}

const CAMPUS_COLORS: Record<string, { bg: string; color: string }> = {
  Farnham: { bg: '#F0ECFF', color: '#6C47FF' },
  Epsom: { bg: '#EFF6FF', color: '#2563EB' },
  Canterbury: { bg: '#FFFBEB', color: '#D97706' },
  Rochester: { bg: '#F0FDF4', color: '#16A34A' },
};

export default function ProfileDrawer({ profile, onClose, onInvite }: ProfileDrawerProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const campusStyle = CAMPUS_COLORS[profile.campus] || { bg: '#F1F5F9', color: '#475569' };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/30 animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed right-0 top-0 bottom-0 z-50 flex flex-col bg-white shadow-modal animate-slide-right overflow-hidden"
        style={{ width: '420px', maxWidth: '100vw', borderLeft: '1px solid #E8E6F0' }}
      >
        {/* Header */}
        <div
          className="flex-shrink-0 border-b px-6 py-4 flex items-center justify-between"
          style={{ borderColor: '#E8E6F0' }}
        >
          <span className="text-sm font-semibold" style={{ color: '#1A1730' }}>Profile</span>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B87A0" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {/* Hero section */}
          <div
            className="px-6 py-8 flex flex-col items-center text-center"
            style={{ background: 'linear-gradient(180deg, #F8F7FF 0%, #FFFFFF 100%)' }}
          >
            <div className="relative mb-4">
              <div
                className="avatar w-20 h-20 text-2xl"
                style={{ background: profile.avatarColor }}
              >
                <span>{profile.initials}</span>
              </div>
              <div
                className="absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white"
                style={{ background: profile.available ? '#22C55E' : '#F59E0B' }}
              />
            </div>

            <h2 className="text-xl font-bold mb-1" style={{ color: '#1A1730' }}>{profile.name}</h2>

            <div className="flex items-center gap-2 flex-wrap justify-center mb-3">
              <span className={`badge ${profile.role === 'tutor' ? 'badge-coral' : 'badge-slate'}`}>
                {profile.role === 'tutor' ? '👩‍🏫 Tutor' : '🎓 Student'}
              </span>
              <span
                className="badge"
                style={{ background: campusStyle.bg, color: campusStyle.color }}
              >
                {profile.campus}
              </span>
              <div className="flex items-center gap-1.5">
                <div className={profile.available ? 'available-dot' : 'busy-dot'} />
                <span className="text-xs font-medium" style={{ color: profile.available ? '#16A34A' : '#D97706' }}>
                  {profile.available ? 'Available' : 'Busy'}
                </span>
              </div>
            </div>

            <p className="text-sm font-medium mb-1" style={{ color: '#4A4665' }}>{profile.course}</p>
            {profile.yearOfStudy && (
              <p className="text-xs" style={{ color: '#8B87A0' }}>{profile.yearOfStudy} · UCA {profile.campus}</p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-8 mt-4 pt-4 border-t w-full justify-center" style={{ borderColor: '#E8E6F0' }}>
              <div className="text-center">
                <p className="text-xl font-bold tabular-nums" style={{ color: '#1A1730' }}>{profile.projectCount}</p>
                <p className="text-xs" style={{ color: '#8B87A0' }}>Projects</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold tabular-nums" style={{ color: '#1A1730' }}>{profile.connectionCount}</p>
                <p className="text-xs" style={{ color: '#8B87A0' }}>Connections</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 flex flex-col gap-5">
            {/* Bio */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#8B87A0' }}>About</p>
              <p className="text-sm leading-relaxed" style={{ color: '#4A4665' }}>{profile.bio}</p>
            </div>

            {/* Skills */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2.5" style={{ color: '#8B87A0' }}>
                Skills ({profile.skills.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.map((skill) => (
                  <span key={`drawer-skill-${profile.id}-${skill}`} className="badge badge-violet">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Interests */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2.5" style={{ color: '#8B87A0' }}>Interests</p>
              <div className="flex flex-wrap gap-1.5">
                {profile.interests.map((interest) => (
                  <span key={`drawer-interest-${profile.id}-${interest}`} className="badge badge-slate">
                    {interest}
                  </span>
                ))}
              </div>
            </div>

            {/* Links */}
            {(profile.portfolioUrl || profile.githubUrl || profile.behanceUrl) && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2.5" style={{ color: '#8B87A0' }}>Links</p>
                <div className="flex flex-col gap-2">
                  {profile.portfolioUrl && (
                    <a
                      href={profile.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl border transition-all hover:border-[#6C47FF] hover:bg-[#FAFAFF] group"
                      style={{ borderColor: '#E8E6F0' }}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#F0ECFF' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6C47FF" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold group-hover:text-[#6C47FF] transition-colors" style={{ color: '#1A1730' }}>Portfolio</p>
                        <p className="text-xs truncate" style={{ color: '#8B87A0' }}>{profile.portfolioUrl}</p>
                      </div>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8B87A0" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </a>
                  )}
                  {profile.githubUrl && (
                    <a
                      href={profile.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl border transition-all hover:border-[#6C47FF] hover:bg-[#FAFAFF] group"
                      style={{ borderColor: '#E8E6F0' }}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#F1F5F9' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#1A1730">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold group-hover:text-[#6C47FF] transition-colors" style={{ color: '#1A1730' }}>GitHub</p>
                        <p className="text-xs truncate" style={{ color: '#8B87A0' }}>{profile.githubUrl}</p>
                      </div>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8B87A0" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </a>
                  )}
                  {profile.behanceUrl && (
                    <a
                      href={profile.behanceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl border transition-all hover:border-[#6C47FF] hover:bg-[#FAFAFF] group"
                      style={{ borderColor: '#E8E6F0' }}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#EFF6FF' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#2563EB">
                          <path d="M22 7h-7V5h7v2zm1.726 10c-.442 1.297-2.029 3-5.101 3-3.074 0-5.564-1.729-5.564-5.675 0-3.91 2.325-5.92 5.466-5.92 3.082 0 4.964 1.782 5.375 4.426.078.506.109 1.188.095 2.14H15.97c.13 1.202.715 1.99 1.865 1.99.524 0 .982-.218 1.302-.646l2.59.685zm-5.333-4.223c-.108-.984-.615-1.494-1.59-1.494-.968 0-1.516.554-1.659 1.494h3.249zM8.878 7.75c.894.147 1.538.694 1.538 1.672 0 1.202-.892 2.114-2.604 2.114H3V5.5h4.39c1.621 0 2.488.7 2.488 2.25zm-3.878 1.99h1.978c.568 0 .907-.295.907-.749 0-.463-.36-.726-.907-.726H5v1.475zm0 2.74h2.082c.62 0 .985-.308.985-.822 0-.504-.365-.801-.985-.801H5V12.48z"/>
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold group-hover:text-[#6C47FF] transition-colors" style={{ color: '#1A1730' }}>Behance</p>
                        <p className="text-xs truncate" style={{ color: '#8B87A0' }}>{profile.behanceUrl}</p>
                      </div>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8B87A0" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div
          className="flex-shrink-0 border-t px-6 py-4 flex gap-3"
          style={{ borderColor: '#E8E6F0', background: '#FAFAF8' }}
        >
          <button
            onClick={onClose}
            className="btn-secondary flex-1 py-2.5 font-semibold"
          >
            Close
          </button>
          <button
            onClick={() => onInvite(profile)}
            disabled={!profile.available}
            className="btn-primary flex-1 py-2.5 font-semibold"
            style={{ opacity: profile.available ? 1 : 0.55 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            {profile.available ? 'Invite to Project' : 'Currently Busy'}
          </button>
        </div>
      </div>
    </>
  );
}