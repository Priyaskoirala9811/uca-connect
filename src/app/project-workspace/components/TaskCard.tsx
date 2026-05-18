'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import type { StoredUser } from '@/lib/storage';
import type { FirestoreTask } from '@/lib/firestoreService';

interface TaskCardProps {
  task: FirestoreTask;
  assignee?: StoredUser;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onMove: (taskId: string, newStatus: 'todo' | 'inprogress' | 'done') => void;
  onEdit: (task: FirestoreTask) => void;
  onDelete: (taskId: string) => void;
  columns: { id: 'todo' | 'inprogress' | 'done'; label: string }[];
}

const PRIORITY_CONFIG = {
  high: { label: 'High', bg: '#FFF0F0', color: '#FF6B6B', dot: '#FF6B6B' },
  medium: { label: 'Medium', bg: '#FFFBEB', color: '#D97706', dot: '#F59E0B' },
  low: { label: 'Low', bg: '#F1F5F9', color: '#475569', dot: '#94A3B8' },
};

export default function TaskCard({ task, assignee, isExpanded, onToggleExpand, onMove, onEdit, onDelete, columns }: TaskCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const priority = PRIORITY_CONFIG[task.priority];
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
  const otherColumns = columns.filter((c) => c.id !== task.status);
  const assigneeInitials = assignee ? assignee.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2) : '';

  return (
    <div className="task-card animate-fade-in relative">
      <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full" style={{ background: priority.dot }} />

      <div className="pl-2">
        <div className="flex items-start justify-between gap-2 mb-2">
          <p
            className="text-sm font-semibold leading-snug cursor-pointer hover:text-[#6C47FF] transition-colors"
            style={{ color: '#1A1730' }}
            onClick={onToggleExpand}
          >
            {task.title}
          </p>
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              title="Task options"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B87A0" strokeWidth="2">
                <circle cx="12" cy="5" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>
            {showMenu && (
              <div className="absolute right-0 top-7 z-20 rounded-xl border shadow-dropdown bg-white py-1 min-w-[150px] animate-slide-up" style={{ borderColor: '#E8E6F0' }}>
                <button
                  onClick={() => { setShowMenu(false); onEdit(task); }}
                  className="w-full text-left px-3 py-2 text-xs font-medium hover:bg-gray-50 transition-colors"
                  style={{ color: '#4A4665' }}
                >
                  ✏️ Edit task
                </button>
                {otherColumns.map((col) => (
                  <button
                    key={`move-${task.id}-${col.id}`}
                    onClick={() => { onMove(task.id, col.id); setShowMenu(false); toast.success(`Moved to ${col.label}`); }}
                    className="w-full text-left px-3 py-2 text-xs font-medium hover:bg-gray-50 transition-colors"
                    style={{ color: '#4A4665' }}
                  >
                    → {col.label}
                  </button>
                ))}
                <button
                  onClick={() => { setShowMenu(false); onDelete(task.id); }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-red-50 transition-colors"
                  style={{ color: '#EF4444' }}
                >
                  🗑️ Delete task
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mb-2.5">
          {(task.tags || []).map((tag) => (
            <span key={`tag-${task.id}-${tag}`} className="badge badge-violet" style={{ fontSize: '10px', padding: '1px 8px' }}>{tag}</span>
          ))}
        </div>

        {isExpanded && task.description && (
          <p className="text-xs mb-2.5 leading-relaxed" style={{ color: '#8B87A0' }}>{task.description}</p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: priority.bg, color: priority.color }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: priority.dot }} />
              {priority.label}
            </span>
            {task.dueDate && (
              <span className="text-xs font-medium" style={{ color: isOverdue ? '#EF4444' : '#8B87A0' }}>
                {isOverdue && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="inline mr-0.5">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4M12 16h.01" />
                  </svg>
                )}
                {new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </span>
            )}
          </div>
          {assignee && (
            <div className="avatar w-6 h-6 text-xs" style={{ background: assignee.avatarColor }} title={assignee.fullName}>
              <span style={{ fontSize: '9px' }}>{assigneeInitials}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
