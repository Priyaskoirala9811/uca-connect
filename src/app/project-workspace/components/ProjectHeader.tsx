'use client';

import React from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import type { Project, Member } from './mockData';

interface ProjectHeaderProps {
  project: Project;
  members: Member[];
  taskCounts: { todo: number; inprogress: number; done: number };
}

export default function ProjectHeader({ project, members, taskCounts }: ProjectHeaderProps) {
  const totalTasks = taskCounts.todo + taskCounts.inprogress + taskCounts.done;
  const completionPct = totalTasks > 0 ? Math.round((taskCounts.done / totalTasks) * 100) : 0;

  return (
    <div
      className="flex-shrink-0 border-b bg-white"
      style={{ borderColor: '#E8E6F0' }}
    >
      {/* Breadcrumb */}
      <div className="px-6 pt-4 pb-0 flex items-center gap-2 text-xs" style={{ color: '#8B87A0' }}>
        <Link href="/project-workspace" className="hover:text-[#6C47FF] transition-colors">My Projects</Link>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18l6-6-6-6" />
        </svg>
        <span style={{ color: '#4A4665' }} className="font-medium truncate max-w-[300px]">{project.title}</span>
      </div>

      <div className="px-6 py-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        {/* Left: title + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h1 className="text-xl font-bold truncate" style={{ color: '#1A1730', maxWidth: '600px' }}>
              {project.title}
            </h1>
            <span className="badge badge-green">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              Active
            </span>
          </div>

          <p className="text-sm mb-3 line-clamp-2" style={{ color: '#8B87A0', maxWidth: '640px' }}>
            {project.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {project.tags.map((tag) => (
              <span key={`tag-${tag}`} className="badge badge-violet text-xs">{tag}</span>
            ))}
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-3 max-w-[360px]">
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#F0ECFF' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${completionPct}%`, background: 'linear-gradient(90deg, #6C47FF, #9B87FF)' }}
              />
            </div>
            <span className="text-xs font-semibold tabular-nums" style={{ color: '#6C47FF' }}>
              {completionPct}% complete
            </span>
          </div>

          {/* Task summary */}
          <div className="flex items-center gap-4 mt-2 text-xs" style={{ color: '#8B87A0' }}>
            <span><span className="font-semibold" style={{ color: '#1A1730' }}>{taskCounts.todo}</span> to do</span>
            <span><span className="font-semibold" style={{ color: '#F59E0B' }}>{taskCounts.inprogress}</span> in progress</span>
            <span><span className="font-semibold" style={{ color: '#22C55E' }}>{taskCounts.done}</span> done</span>
            <span>·</span>
            <span>Started 10 Mar 2026</span>
          </div>
        </div>

        {/* Right: members + actions */}
        <div className="flex flex-col items-end gap-3 flex-shrink-0">
          {/* Member avatars */}
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {members.slice(0, 4).map((m) => (
                <div
                  key={`header-member-${m.id}`}
                  className="avatar w-8 h-8 text-xs border-2 border-white"
                  style={{ background: m.color }}
                  title={`${m.name} — ${m.campus}`}
                >
                  <span>{m.initials}</span>
                </div>
              ))}
              {members.length > 4 && (
                <div
                  className="avatar w-8 h-8 text-xs border-2 border-white"
                  style={{ background: '#E8E6F0', color: '#8B87A0' }}
                >
                  <span>+{members.length - 4}</span>
                </div>
              )}
            </div>
            <span className="text-xs" style={{ color: '#8B87A0' }}>{members.length} members</span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => toast.success('Invite link copied to clipboard')}
              className="btn-secondary py-2 px-3 text-xs"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              Invite
            </button>
            <button
              onClick={() => toast.success('Project settings opened')}
              className="btn-ghost py-2 px-3 text-xs border"
              style={{ borderColor: '#E8E6F0' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}