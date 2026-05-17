'use client';

// mockData.ts is kept for type compatibility during migration.
// All real data is now stored in localStorage via src/lib/storage.ts

export interface Member {
  id: string;
  name: string;
  initials: string;
  role: 'student' | 'tutor';
  campus: string;
  course: string;
  color: string;
  available: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'inprogress' | 'done';
  priority: 'high' | 'medium' | 'low';
  assigneeId: string;
  dueDate: string;
  tags: string[];
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  isCurrentUser: boolean;
}

export interface FileResource {
  id: string;
  name: string;
  type: 'pdf' | 'figma' | 'github' | 'slides' | 'video' | 'link';
  url: string;
  uploadedById: string;
  uploadedAt: string;
  size?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'archived';
  tags: string[];
  createdAt: string;
  ownerId: string;
}

export const CURRENT_USER_ID = '';
export const PROJECT: Project = { id: '', title: '', description: '', status: 'active', tags: [], createdAt: '', ownerId: '' };
export const MEMBERS: Member[] = [];
export const TASKS: Task[] = [];
export const MESSAGES: Message[] = [];
export const FILES: FileResource[] = [];