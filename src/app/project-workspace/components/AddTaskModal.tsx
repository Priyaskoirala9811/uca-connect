'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { StoredUser } from '@/lib/storage';
import type { FirestoreTask } from '@/lib/firestoreService';

interface AddTaskModalProps {
  column: 'todo' | 'inprogress' | 'done';
  projectId: string;
  currentUserId: string;
  members: StoredUser[];
  onAdd: (task: Omit<FirestoreTask, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onClose: () => void;
}

interface TaskFormValues {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  assigneeId: string;
  dueDate: string;
  tags: string;
}

export default function AddTaskModal({ column, projectId, currentUserId, members, onAdd, onClose }: AddTaskModalProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<TaskFormValues>({
    defaultValues: { priority: 'medium', assigneeId: currentUserId },
  });

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const onSubmit = (data: TaskFormValues) => {
    onAdd({
      projectId,
      title: data.title,
      description: data.description,
      status: column,
      priority: data.priority,
      assigneeId: data.assigneeId,
      dueDate: data.dueDate,
      tags: data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      createdBy: currentUserId,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" style={{ background: 'rgba(26,23,48,0.5)' }}>
      <div className="card w-full max-w-[480px] p-6 shadow-modal animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold" style={{ color: '#1A1730' }}>Add New Task</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B87A0" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: '#4A4665' }} htmlFor="task-title">Task Title</label>
            <input
              id="task-title"
              className={`input-field ${errors.title ? 'error' : ''}`}
              placeholder="e.g. Design login screen wireframes"
              {...register('title', { required: 'Title is required' })}
            />
            {errors.title && <p className="text-xs" style={{ color: '#EF4444' }}>{errors.title.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: '#4A4665' }} htmlFor="task-desc">Description</label>
            <textarea
              id="task-desc"
              className="input-field resize-none"
              rows={3}
              placeholder="What needs to be done?"
              {...register('description')}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: '#4A4665' }}>Priority</label>
              <select className="input-field" {...register('priority')}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: '#4A4665' }}>Assign to</label>
              <select className="input-field" {...register('assigneeId')}>
                {members.map((m) => (
                  <option key={`assignee-opt-${m.id}`} value={m.id}>{m.fullName}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: '#4A4665' }}>Due Date</label>
              <input
                type="date"
                className={`input-field ${errors.dueDate ? 'error' : ''}`}
                {...register('dueDate', { required: 'Due date is required' })}
              />
              {errors.dueDate && <p className="text-xs" style={{ color: '#EF4444' }}>{errors.dueDate.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: '#4A4665' }}>Tags <span className="text-xs font-normal" style={{ color: '#8B87A0' }}>(comma-separated)</span></label>
              <input className="input-field" placeholder="React, Figma" {...register('tags')} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5">Cancel</button>
            <button type="submit" className="btn-primary flex-1 py-2.5 font-semibold">Add Task</button>
          </div>
        </form>
      </div>
    </div>
  );
}