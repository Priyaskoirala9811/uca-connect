'use client';

import React, { useState } from 'react';
import type { StoredUser } from '@/lib/storage';
import type { FirestoreTask } from '@/lib/firestoreService';
import TaskCard from './TaskCard';

interface KanbanBoardProps {
  tasks: FirestoreTask[];
  members: StoredUser[];
  onMoveTask: (taskId: string, newStatus: 'todo' | 'inprogress' | 'done') => void;
  onAddTask: (column: 'todo' | 'inprogress' | 'done') => void;
}

const COLUMNS: { id: 'todo' | 'inprogress' | 'done'; label: string; color: string; bg: string; dotColor: string }[] = [
  { id: 'todo', label: 'To Do', color: '#4A4665', bg: '#F8F7FF', dotColor: '#8B87A0' },
  { id: 'inprogress', label: 'In Progress', color: '#D97706', bg: '#FFFBEB', dotColor: '#F59E0B' },
  { id: 'done', label: 'Done', color: '#16A34A', bg: '#F0FDF4', dotColor: '#22C55E' },
];

export default function KanbanBoard({ tasks, members, onMoveTask, onAddTask }: KanbanBoardProps) {
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 min-w-[700px]">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.id);
        return (
          <div key={`col-${col.id}`} className="kanban-col" style={{ background: col.bg }}>
            {/* Column header */}
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: col.dotColor }} />
                <span className="text-sm font-semibold" style={{ color: col.color }}>{col.label}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,0,0,0.06)', color: col.color }}>
                  {colTasks.length}
                </span>
              </div>
              <button
                onClick={() => onAddTask(col.id)}
                className="p-1.5 rounded-lg transition-colors hover:bg-white"
                title={`Add task to ${col.label}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6C47FF" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
            </div>

            {/* Tasks */}
            <div className="flex flex-col gap-2.5">
              {colTasks.map((task) => {
                const assignee = members.find((m) => m.id === task.assigneeId);
                return (
                  <TaskCard
                    key={`task-${task.id}`}
                    task={task}
                    assignee={assignee}
                    isExpanded={expandedTaskId === task.id}
                    onToggleExpand={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                    onMove={onMoveTask}
                    columns={COLUMNS}
                  />
                );
              })}

              {colTasks.length === 0 && (
                <div
                  className="rounded-xl border-2 border-dashed p-6 flex flex-col items-center gap-2 text-center"
                  style={{ borderColor: col.dotColor + '40' }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={col.dotColor} strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="3" />
                    <path d="M12 8v8M8 12h8" />
                  </svg>
                  <p className="text-xs" style={{ color: col.dotColor }}>No tasks here yet</p>
                  <button onClick={() => onAddTask(col.id)} className="text-xs font-medium underline" style={{ color: '#6C47FF' }}>
                    Add first task
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => onAddTask(col.id)}
              className="mt-2 w-full flex items-center gap-2 py-2.5 px-3 rounded-xl text-xs font-medium transition-all duration-150 hover:bg-white border border-dashed"
              style={{ borderColor: col.dotColor + '60', color: col.color }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add task
            </button>
          </div>
        );
      })}
    </div>
  );
}