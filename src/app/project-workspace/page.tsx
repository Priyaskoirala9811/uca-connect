'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Toaster, toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import AppLayout from '@/components/AppLayout';
import {
  getFirestoreProjects,
  createFirestoreProject,
  getFirestoreUser,
  subscribeToMessages,
  subscribeToProjectTasks,
  addFirestoreTask,
  updateFirestoreTask,
  subscribeToProjectFiles,
  uploadProjectResourceFile,
  sendFirestoreMessageWithOptionalFile,
  updateFirestoreMessage,
  deleteFirestoreMessage,
  deleteFirestoreTask,
  type FirestoreProject,
  type FirestoreMessage,
  type FirestoreUser,
  type FirestoreTask,
  type FirestoreResourceFile,
} from '@/lib/firestoreService';
import type { ProjectType } from '@/lib/storage';
import KanbanBoard from './components/KanbanBoard';
import AddTaskModal from './components/AddTaskModal';
import CodeWorkspace from './components/CodeWorkspace';
import PresentationWorkspace from './components/PresentationWorkspace';
import DesignBoard from './components/DesignBoard';

const PROJECT_TYPE_CONFIG: Record<string, { label: string; emoji: string; color: string }> = {
  coding: { label: 'Coding', emoji: '💻', color: '#0EA5E9' },
  presentation: { label: 'Presentation', emoji: '📊', color: '#F59E0B' },
  design: { label: 'Design', emoji: '🎨', color: '#EC4899' },
  general: { label: 'General', emoji: '🤝', color: '#22C55E' },
};

type WorkspaceTab = 'board' | 'workspace' | 'chat' | 'files' | 'members';

const FILE_ICONS: Record<string, { icon: string; color: string; bg: string }> = {
  pdf: { icon: '📄', color: '#EF4444', bg: '#FFF5F5' },
  figma: { icon: '🎨', color: '#6C47FF', bg: '#F0ECFF' },
  github: { icon: '⚡', color: '#1A1730', bg: '#F1F5F9' },
  slides: { icon: '📊', color: '#F59E0B', bg: '#FFFBEB' },
  video: { icon: '🎬', color: '#0EA5E9', bg: '#EFF6FF' },
  link: { icon: '🔗', color: '#22C55E', bg: '#F0FDF4' },
  image: { icon: '🖼️', color: '#0EA5E9', bg: '#EFF6FF' },
  document: { icon: '📝', color: '#6C47FF', bg: '#F0ECFF' },
  other: { icon: '📦', color: '#64748B', bg: '#F1F5F9' },
};

export default function ProjectWorkspacePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<FirestoreUser | null>(null);
  const [currentUid, setCurrentUid] = useState<string | null>(null);
  const [projects, setProjects] = useState<FirestoreProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<FirestoreTask[]>([]);
  const [messages, setMessages] = useState<FirestoreMessage[]>([]);
  const [files, setFiles] = useState<FirestoreResourceFile[]>([]);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('board');
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [addTaskColumn, setAddTaskColumn] = useState<'todo' | 'inprogress' | 'done'>('todo');
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProjectForm, setNewProjectForm] = useState({ title: '', description: '', type: 'general' as ProjectType, tags: '' });
  const [newMessage, setNewMessage] = useState('');
  const [chatFile, setChatFile] = useState<File | null>(null);
  const [uploadingResource, setUploadingResource] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessageText, setEditingMessageText] = useState('');
  const [memberProfiles, setMemberProfiles] = useState<FirestoreUser[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push('/sign-up-login-screen'); return; }
      setCurrentUid(user.uid);
      const profile = await getFirestoreUser(user.uid);
      setCurrentUser(profile);
      await loadProjects(user.uid);
    });
    return () => unsub();
  }, [router]);

  const loadProjects = async (uid: string) => {
    setLoadingProjects(true);
    try {
      const projs = await getFirestoreProjects(uid);
      setProjects(projs);
      if (projs.length > 0) {
        selectProject(projs[0].id, projs[0].members);
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoadingProjects(false);
    }
  };

  const selectProject = useCallback(async (projectId: string, members: string[]) => {
    setActiveProjectId(projectId);
    setTasks([]);
    setFiles([]);
    setActiveTab('board');
    // Load member profiles
    const profiles = await Promise.all(members.map((uid) => getFirestoreUser(uid)));
    setMemberProfiles(profiles.filter(Boolean) as FirestoreUser[]);
  }, []);

  // Subscribe to messages when active project changes
  useEffect(() => {
    if (!activeProjectId) return;
    const unsub = subscribeToMessages(activeProjectId, (msgs) => {
      setMessages(msgs);
    });
    return () => unsub();
  }, [activeProjectId]);

  // Subscribe to shared project tasks so every member sees the same board
  useEffect(() => {
    if (!activeProjectId) return;
    const unsub = subscribeToProjectTasks(activeProjectId, setTasks);
    return () => unsub();
  }, [activeProjectId]);

  // Subscribe to shared resource files
  useEffect(() => {
    if (!activeProjectId) return;
    const unsub = subscribeToProjectFiles(activeProjectId, setFiles);
    return () => unsub();
  }, [activeProjectId]);

  const handleCreateProject = async () => {
    if (!currentUid || !currentUser) return;
    if (!newProjectForm.title.trim()) { toast.error('Please enter a project title'); return; }
    try {
      const project = await createFirestoreProject({
        title: newProjectForm.title.trim(),
        description: newProjectForm.description.trim(),
        type: newProjectForm.type,
        ownerId: currentUid,
        ownerName: currentUser.fullName,
      });
      setShowCreateProject(false);
      setNewProjectForm({ title: '', description: '', type: 'general', tags: '' });
      const updatedProjects = [...projects, project];
      setProjects(updatedProjects);
      selectProject(project.id, project.members);
      toast.success('Project created!');
    } catch {
      toast.error('Something went wrong. Please try again.');
    }
  };

  const handleMoveTask = async (taskId: string, newStatus: 'todo' | 'inprogress' | 'done') => {
    if (!activeProjectId) return;
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: newStatus } : t));
    try {
      await updateFirestoreTask(activeProjectId, taskId, { status: newStatus });
    } catch {
      toast.error('Task could not be updated. Please try again.');
    }
  };

  const handleAddTask = async (taskData: Omit<FirestoreTask, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!activeProjectId || !currentUid) return;
    try {
      await addFirestoreTask(activeProjectId, {
        ...taskData,
        projectId: activeProjectId,
        createdBy: currentUid,
      });
      setShowAddTaskModal(false);
      toast.success('Task added!');
    } catch {
      toast.error('Task could not be saved. Please try again.');
    }
  };

  const handleEditTask = async (task: FirestoreTask) => {
    if (!activeProjectId) return;
    const newTitle = window.prompt('Edit task title:', task.title);
    if (newTitle === null) return;
    const cleanTitle = newTitle.trim();
    if (!cleanTitle) {
      toast.error('Task title cannot be empty.');
      return;
    }

   const newDescription = window.prompt('Edit task description:', task.description || '') ?? (task.description || '');
    try {
      await updateFirestoreTask(activeProjectId, task.id, {
        title: cleanTitle,
        description: newDescription.trim(),
      });
      toast.success('Task updated.');
    } catch {
      toast.error('Task could not be updated. Please try again.');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!activeProjectId) return;
    const sure = window.confirm('Delete this task? This cannot be undone.');
    if (!sure) return;
    try {
      await deleteFirestoreTask(activeProjectId, taskId);
      toast.success('Task deleted.');
    } catch {
      toast.error('Task could not be deleted. Please try again.');
    }
  };

  const handleSendMessage = async () => {
    const trimmed = newMessage.trim();
    if ((!trimmed && !chatFile) || !currentUid || !activeProjectId || !currentUser) return;

    if (chatFile && chatFile.size > 10 * 1024 * 1024) {
      toast.error('File is too large. Maximum size is 10MB.');
      return;
    }

    setSendingMsg(true);
    try {
      await sendFirestoreMessageWithOptionalFile({
        projectId: activeProjectId,
        senderId: currentUid,
        senderName: currentUser.fullName,
        text: trimmed,
        file: chatFile,
      });
      setNewMessage('');
      setChatFile(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Message could not be sent. Please try again.';
      toast.error(message);
    } finally {
      setSendingMsg(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startEditMessage = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditingMessageText(content);
  };

  const cancelEditMessage = () => {
    setEditingMessageId(null);
    setEditingMessageText('');
  };

  const saveEditedMessage = async () => {
    if (!activeProjectId || !editingMessageId) return;
    const cleanText = editingMessageText.trim();
    if (!cleanText) {
      toast.error('Message cannot be empty.');
      return;
    }
    try {
      await updateFirestoreMessage(activeProjectId, editingMessageId, cleanText);
      cancelEditMessage();
      toast.success('Message updated.');
    } catch {
      toast.error('Message could not be edited. Please try again.');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!activeProjectId) return;
    const sure = window.confirm('Delete this message?');
    if (!sure) return;
    try {
      await deleteFirestoreMessage(activeProjectId, messageId);
      toast.success('Message deleted.');
    } catch {
      toast.error('Message could not be deleted. Please try again.');
    }
  };

  const handleResourceUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !activeProjectId || !currentUid || !currentUser) return;

    const allowedTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload PDF, image, Word, or PowerPoint files only.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File is too large. Maximum size is 10MB.');
      return;
    }

    setUploadingResource(true);
    try {
      await uploadProjectResourceFile({
        projectId: activeProjectId,
        file,
        uploadedById: currentUid,
        uploadedByName: currentUser.fullName,
      });
      toast.success('File uploaded!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'File could not be uploaded. Please try again.';
      toast.error(message);
    } finally {
      setUploadingResource(false);
    }
  };

  const activeProject = projects.find((p) => p.id === activeProjectId) || null;
  const taskCounts = {
    todo: tasks.filter((t) => t.status === 'todo').length,
    inprogress: tasks.filter((t) => t.status === 'inprogress').length,
    done: tasks.filter((t) => t.status === 'done').length,
  };
  const typeConfig = activeProject ? PROJECT_TYPE_CONFIG[activeProject.type] : null;
  const workspaceTabLabel = activeProject
    ? activeProject.type === 'coding' ? '💻 Code Workspace'
    : activeProject.type === 'presentation' ? '📊 Presentation Workspace'
    : activeProject.type === 'design' ? '🎨 Design Board'
    : null
    : null;

  // Convert FirestoreUser to StoredUser-like for existing components
  const membersForComponents = memberProfiles.map((m) => ({
    id: m.uid,
    fullName: m.fullName,
    email: m.email,
    role: m.role === 'teacher' ? 'tutor' as const : 'student' as const,
    campus: m.campus,
    course: m.course,
    skills: m.skills || [],
    interests: m.interests || [],
    bio: m.bio || '',
    portfolioUrl: m.portfolioUrl || '',
    githubUrl: m.githubUrl || '',
    behanceUrl: m.behanceUrl || '',
    available: m.available ?? true,
    avatarColor: m.avatarColor || '#6C47FF',
    yearOfStudy: m.yearOfStudy || '',
    createdAt: '',
    passwordHash: '',
  }));

  // Convert FirestoreMessage to StoredMessage-like for chat
  const messagesForChat = messages.map((m) => ({
    id: m.id,
    projectId: activeProjectId || '',
    senderId: m.senderId,
    content: m.text,
    fileUrl: m.fileUrl,
    fileName: m.fileName,
    fileType: m.fileType,
    edited: m.edited,
    timestamp: m.createdAt
      ? new Date((m.createdAt as { toDate?: () => Date }).toDate?.() || Date.now()).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      : '',
  }));

  return (
    <AppLayout currentPath="/project-workspace">
      <Toaster position="bottom-right" richColors />

      <div className="flex h-full overflow-hidden">
        {/* Projects sidebar */}
        <div className="w-64 flex-shrink-0 border-r bg-white flex flex-col" style={{ borderColor: '#E8E6F0' }}>
          <div className="px-4 py-4 border-b flex items-center justify-between" style={{ borderColor: '#E8E6F0' }}>
            <h2 className="text-sm font-bold" style={{ color: '#1A1730' }}>My Projects</h2>
            <button
              onClick={() => setShowCreateProject(true)}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-[#F0ECFF]"
              style={{ color: '#6C47FF' }}
              title="Create new project"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin py-2 px-2">
            {loadingProjects ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 rounded-full border-2 border-[#6C47FF] border-t-transparent animate-spin" />
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-8 px-3">
                <div className="text-3xl mb-2">📁</div>
                <p className="text-xs font-medium mb-1" style={{ color: '#4A4665' }}>No projects yet</p>
                <p className="text-xs" style={{ color: '#8B87A0' }}>Create your first project to get started</p>
              </div>
            ) : (
              projects.map((project) => {
                const config = PROJECT_TYPE_CONFIG[project.type] || PROJECT_TYPE_CONFIG.general;
                const isActive = project.id === activeProjectId;
                return (
                  <button
                    key={project.id}
                    onClick={() => selectProject(project.id, project.members)}
                    className={`w-full text-left px-3 py-3 rounded-xl mb-1 transition-all ${isActive ? 'bg-[#F0ECFF]' : 'hover:bg-gray-50'}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">{config.emoji}</span>
                      <p className="text-xs font-semibold truncate flex-1" style={{ color: isActive ? '#6C47FF' : '#1A1730' }}>
                        {project.title}
                      </p>
                    </div>
                    <p className="text-xs capitalize" style={{ color: '#8B87A0' }}>{config.label}</p>
                  </button>
                );
              })
            )}
          </div>

          <div className="px-3 py-3 border-t" style={{ borderColor: '#E8E6F0' }}>
            <button onClick={() => setShowCreateProject(true)} className="w-full btn-primary py-2 text-xs">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" />
              </svg>
              New Project
            </button>
          </div>
        </div>

        {/* Main workspace */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!activeProject ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
              <div className="text-5xl">🚀</div>
              <h2 className="text-xl font-bold" style={{ color: '#1A1730' }}>Welcome to your workspace</h2>
              <p className="text-sm text-center max-w-sm" style={{ color: '#8B87A0' }}>
                Create a new project or select one from the sidebar to get started.
              </p>
              <button onClick={() => setShowCreateProject(true)} className="btn-primary py-2.5 px-6">
                Create your first project
              </button>
            </div>
          ) : (
            <>
              {/* Project header */}
              <div className="flex-shrink-0 border-b bg-white px-6 py-4" style={{ borderColor: '#E8E6F0' }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <span className="text-xl">{typeConfig?.emoji}</span>
                      <h1 className="text-lg font-bold truncate" style={{ color: '#1A1730' }}>{activeProject.title}</h1>
                      <span className="badge" style={{ background: '#F0FDF4', color: '#16A34A' }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                        Active
                      </span>
                      <span className="badge text-xs capitalize" style={{ background: '#F0ECFF', color: '#6C47FF' }}>
                        {typeConfig?.label}
                      </span>
                    </div>
                    {activeProject.description && (
                      <p className="text-sm line-clamp-1 mb-2" style={{ color: '#8B87A0' }}>{activeProject.description}</p>
                    )}
                    <div className="flex items-center gap-3 max-w-xs">
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#F0ECFF' }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(taskCounts.todo + taskCounts.inprogress + taskCounts.done) > 0 ? Math.round((taskCounts.done / (taskCounts.todo + taskCounts.inprogress + taskCounts.done)) * 100) : 0}%`,
                            background: 'linear-gradient(90deg, #6C47FF, #9B87FF)',
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold" style={{ color: '#6C47FF' }}>
                        {(taskCounts.todo + taskCounts.inprogress + taskCounts.done) > 0
                          ? Math.round((taskCounts.done / (taskCounts.todo + taskCounts.inprogress + taskCounts.done)) * 100)
                          : 0}%
                      </span>
                    </div>
                  </div>

                  <div className="flex -space-x-2 flex-shrink-0">
                    {membersForComponents.slice(0, 4).map((m) => (
                      <div key={m.id} className="avatar w-8 h-8 text-xs border-2 border-white" style={{ background: m.avatarColor }} title={m.fullName}>
                        <span>{m.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}</span>
                      </div>
                    ))}
                    {membersForComponents.length > 4 && (
                      <div className="avatar w-8 h-8 text-xs border-2 border-white" style={{ background: '#E8E6F0', color: '#8B87A0' }}>
                        <span>+{membersForComponents.length - 4}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-1 mt-4 overflow-x-auto">
                  {[
                    { id: 'board', label: '📋 Task Board' },
                    ...(workspaceTabLabel ? [{ id: 'workspace', label: workspaceTabLabel }] : []),
                    { id: 'chat', label: '💬 Chat' },
                    { id: 'files', label: '📎 Resources' },
                    { id: 'members', label: '👥 Members' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as WorkspaceTab)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-[#6C47FF] text-white' : 'text-[#8B87A0] hover:bg-[#F0ECFF] hover:text-[#6C47FF]'}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-hidden">
                {activeTab === 'board' && (
                  <div className="h-full overflow-auto scrollbar-thin p-6">
                    <KanbanBoard
                      tasks={tasks}
                      members={membersForComponents}
                      onMoveTask={handleMoveTask}
                      onAddTask={(col) => { setAddTaskColumn(col); setShowAddTaskModal(true); }}
                      onEditTask={handleEditTask}
                      onDeleteTask={handleDeleteTask}
                    />
                  </div>
                )}

                {activeTab === 'workspace' && activeProject.type === 'coding' && (
                  <CodeWorkspace projectId={activeProject.id} />
                )}
                {activeTab === 'workspace' && activeProject.type === 'presentation' && (
                  <PresentationWorkspace projectId={activeProject.id} />
                )}
                {activeTab === 'workspace' && activeProject.type === 'design' && (
                  <DesignBoard projectId={activeProject.id} files={[]} onAddFile={() => {}} currentUserId={currentUid || ''} />
                )}

                {/* Online Chat */}
                {activeTab === 'chat' && (
                  <div className="flex flex-col h-full bg-white">
                    <div className="flex-1 overflow-y-auto scrollbar-thin p-4 flex flex-col gap-3">
                      {messagesForChat.length === 0 && (
                        <div className="text-center py-12">
                          <div className="text-3xl mb-2">💬</div>
                          <p className="text-sm font-medium mb-1" style={{ color: '#4A4665' }}>No messages yet</p>
                          <p className="text-xs" style={{ color: '#8B87A0' }}>Start the conversation with your team!</p>
                        </div>
                      )}
                      {messagesForChat.map((msg) => {
                        const isCurrentUser = msg.senderId === currentUid;
                        const sender = memberProfiles.find((m) => m.uid === msg.senderId);
                        const senderName = sender?.fullName || 'Unknown';
                        const senderInitials = senderName.split(' ').map((n) => n[0]).join('').slice(0, 2);
                        const avatarColor = sender?.avatarColor || '#6C47FF';
                        return (
                          <div key={`msg-${msg.id}`} className={`flex gap-2.5 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
                            {!isCurrentUser && (
                              <div className="avatar w-7 h-7 text-xs flex-shrink-0 self-end" style={{ background: avatarColor }}>
                                <span style={{ fontSize: '9px' }}>{senderInitials}</span>
                              </div>
                            )}
                            <div className={`flex flex-col gap-0.5 ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                              {!isCurrentUser && (
                                <span className="text-xs font-medium px-1" style={{ color: '#8B87A0' }}>{senderName.split(' ')[0]}</span>
                              )}
                              <div className={isCurrentUser ? 'message-bubble-self' : 'message-bubble-other'}>
                                {editingMessageId === msg.id ? (
                                  <div className="flex flex-col gap-2 min-w-[220px]">
                                    <textarea
                                      value={editingMessageText}
                                      onChange={(e) => setEditingMessageText(e.target.value)}
                                      rows={2}
                                      className="rounded-lg px-2 py-1 text-xs outline-none resize-none"
                                      style={{ color: '#1A1730' }}
                                    />
                                    <div className="flex gap-2 justify-end">
                                      <button onClick={cancelEditMessage} className="text-xs font-semibold opacity-80">Cancel</button>
                                      <button onClick={saveEditedMessage} className="text-xs font-bold underline">Save</button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    {msg.content && <p>{msg.content}</p>}
                                    {msg.fileUrl && (
                                      <a
                                        href={msg.fileUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-2 block rounded-xl px-3 py-2 text-xs font-semibold underline"
                                        style={{ background: isCurrentUser ? 'rgba(255,255,255,0.18)' : '#F0ECFF', color: isCurrentUser ? 'white' : '#6C47FF' }}
                                      >
                                        📎 {msg.fileName || 'Open file'}
                                      </a>
                                    )}
                                  </>
                                )}
                              </div>
                              <div className="flex items-center gap-2 px-1">
                                <span className="text-xs" style={{ color: '#C4C0D4' }}>{msg.timestamp}{msg.edited ? ' · edited' : ''}</span>
                                {isCurrentUser && editingMessageId !== msg.id && (
                                  <>
                                    {msg.content && (
                                      <button onClick={() => startEditMessage(msg.id, msg.content)} className="text-xs font-semibold hover:underline" style={{ color: '#8B87A0' }}>Edit</button>
                                    )}
                                    <button onClick={() => handleDeleteMessage(msg.id)} className="text-xs font-semibold hover:underline" style={{ color: '#EF4444' }}>Delete</button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex-shrink-0 p-3 border-t" style={{ borderColor: '#E8E6F0' }}>
                      <div className="flex items-end gap-2 rounded-xl border p-2" style={{ borderColor: '#E8E6F0', background: '#F8F7FF' }}>
                        <label className="p-2 rounded-lg cursor-pointer hover:bg-white transition-colors flex-shrink-0" title="Attach file">
                          📎
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,image/*,.doc,.docx,.ppt,.pptx"
                            onChange={(e) => setChatFile(e.target.files?.[0] || null)}
                          />
                        </label>
                        <textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={handleKeyDown}
                          rows={1}
                          placeholder="Message the team… (Enter to send)"
                          className="flex-1 bg-transparent text-sm resize-none outline-none leading-relaxed"
                          style={{ color: '#1A1730', maxHeight: '100px', fontFamily: 'DM Sans, sans-serif' }}
                        />
                        <button
                          onClick={handleSendMessage}
                          disabled={(!newMessage.trim() && !chatFile) || sendingMsg}
                          className="p-2 rounded-lg transition-all duration-150 active:scale-95 flex-shrink-0"
                          style={{ background: (newMessage.trim() || chatFile) ? '#6C47FF' : '#E8E6F0', color: (newMessage.trim() || chatFile) ? 'white' : '#8B87A0' }}
                        >
                          {sendingMsg ? (
                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin block" />
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M22 2L11 13" />
                              <path d="M22 2L15 22 11 13 2 9l20-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      {chatFile && (
                        <div className="mt-2 flex items-center justify-between rounded-xl px-3 py-2 text-xs" style={{ background: '#F0ECFF', color: '#6C47FF' }}>
                          <span className="truncate">📎 {chatFile.name}</span>
                          <button onClick={() => setChatFile(null)} className="font-bold">Remove</button>
                        </div>
                      )}
                      <p className="text-xs mt-1.5 text-center" style={{ color: '#C4C0D4' }}>Shift+Enter for new line</p>
                    </div>
                  </div>
                )}

                {activeTab === 'files' && (
                  <div className="flex flex-col h-full bg-white overflow-y-auto scrollbar-thin p-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-semibold" style={{ color: '#4A4665' }}>{files.length} resources</span>
                      <label className="btn-primary py-2 px-4 text-xs cursor-pointer">
                        {uploadingResource ? 'Uploading…' : '+ Upload File'}
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,image/*,.doc,.docx,.ppt,.pptx"
                          disabled={uploadingResource}
                          onChange={handleResourceUpload}
                        />
                      </label>
                    </div>
                    {files.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-3xl mb-2">📎</div>
                        <p className="text-sm font-medium mb-1" style={{ color: '#4A4665' }}>No resources yet</p>
                        <p className="text-xs" style={{ color: '#8B87A0' }}>Add links or files to share with your team</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {files.map((file) => {
                          const fileConfig = FILE_ICONS[file.type] || FILE_ICONS.link;
                          return (
                            <div
                              key={`file-${file.id}`}
                              className="flex items-start gap-3 p-3 rounded-xl border transition-all duration-150 hover:border-[#6C47FF] hover:bg-[#FAFAFF] cursor-pointer"
                              style={{ borderColor: '#E8E6F0' }}
                              onClick={() => window.open(file.url, '_blank')}
                            >
                              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0" style={{ background: fileConfig.bg }}>
                                {fileConfig.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold truncate" style={{ color: '#1A1730' }}>{file.name}</p>
                                <p className="text-xs mt-0.5" style={{ color: '#8B87A0' }}>
                                  {file.size || ''} {file.uploadedByName ? `· ${file.uploadedByName}` : ''}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'members' && (
                  <div className="p-6 overflow-auto h-full">
                    <h3 className="text-sm font-bold mb-4" style={{ color: '#1A1730' }}>
                      Project Members ({membersForComponents.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {membersForComponents.map((m) => (
                        <div key={m.id} className="card p-4 flex items-center gap-3">
                          <div className="avatar w-10 h-10 text-sm flex-shrink-0" style={{ background: m.avatarColor }}>
                            <span>{m.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate" style={{ color: '#1A1730' }}>{m.fullName}</p>
                            <p className="text-xs truncate" style={{ color: '#8B87A0' }}>{m.course} · {m.campus}</p>
                            <span className={`badge text-xs mt-1 ${m.role === 'tutor' ? 'badge-coral' : 'badge-violet'}`}>
                              {m.role === 'tutor' ? '👩‍🏫 Tutor' : '🎓 Student'}
                            </span>
                          </div>
                          {m.id === activeProject.ownerId && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: '#F0ECFF', color: '#6C47FF' }}>Owner</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {showAddTaskModal && activeProject && currentUid && (
        <AddTaskModal
          column={addTaskColumn}
          projectId={activeProject.id}
          currentUserId={currentUid}
          members={membersForComponents}
          onAdd={handleAddTask}
          onClose={() => setShowAddTaskModal(false)}
        />
      )}

      {showCreateProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
          style={{ background: 'rgba(26,23,48,0.5)' }}
          onClick={() => setShowCreateProject(false)}
        >
          <div className="card w-full max-w-[480px] shadow-modal animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#E8E6F0' }}>
              <h3 className="text-base font-bold" style={{ color: '#1A1730' }}>Create New Project</h3>
              <button onClick={() => setShowCreateProject(false)} className="p-2 rounded-xl hover:bg-gray-100">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B87A0" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" style={{ color: '#4A4665' }}>Project Title</label>
                <input
                  className="input-field"
                  placeholder="e.g. AR Campus Wayfinding"
                  value={newProjectForm.title}
                  onChange={(e) => setNewProjectForm({ ...newProjectForm, title: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" style={{ color: '#4A4665' }}>Description <span className="text-xs font-normal" style={{ color: '#8B87A0' }}>(optional)</span></label>
                <textarea
                  className="input-field resize-none"
                  rows={2}
                  placeholder="What is this project about?"
                  value={newProjectForm.description}
                  onChange={(e) => setNewProjectForm({ ...newProjectForm, description: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" style={{ color: '#4A4665' }}>Project Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(PROJECT_TYPE_CONFIG) as [string, typeof PROJECT_TYPE_CONFIG[string]][]).map(([type, config]) => (
                    <label
                      key={type}
                      className="flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all"
                      style={{
                        borderColor: newProjectForm.type === type ? '#6C47FF' : '#E8E6F0',
                        background: newProjectForm.type === type ? '#F0ECFF' : 'white',
                      }}
                    >
                      <input
                        type="radio"
                        name="projectType"
                        value={type}
                        checked={newProjectForm.type === type}
                        onChange={() => setNewProjectForm({ ...newProjectForm, type: type as ProjectType })}
                        className="sr-only"
                      />
                      <span className="text-lg">{config.emoji}</span>
                      <div>
                        <p className="text-xs font-semibold" style={{ color: newProjectForm.type === type ? '#6C47FF' : '#1A1730' }}>{config.label}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowCreateProject(false)} className="btn-secondary flex-1 py-2.5">Cancel</button>
                <button onClick={handleCreateProject} className="btn-primary flex-1 py-2.5 font-semibold">Create Project</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}