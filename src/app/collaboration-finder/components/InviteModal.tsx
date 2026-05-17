'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { UserProfile } from './CollaborationFinderScreen';
import {
  getFirestoreProjects,
  createFirestoreProject,
  sendFirestoreInvite,
  getFirestoreUser,
  type FirestoreProject,
} from '@/lib/firestoreService';

interface InviteModalProps {
  target: UserProfile;
  currentUid: string;
  onClose: () => void;
}

type ProjectType = 'coding' | 'presentation' | 'design' | 'general';

const PROJECT_TYPES: { value: ProjectType; label: string; emoji: string }[] = [
  { value: 'coding', label: 'Coding', emoji: '💻' },
  { value: 'presentation', label: 'Presentation', emoji: '📊' },
  { value: 'design', label: 'Design', emoji: '🎨' },
  { value: 'general', label: 'General', emoji: '🤝' },
];

export default function InviteModal({ target, currentUid, onClose }: InviteModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [myProjects, setMyProjects] = useState<FirestoreProject[]>([]);
  const [useNewProject, setUseNewProject] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectType, setNewProjectType] = useState<ProjectType>('general');
  const [message, setMessage] = useState(
    `Hi ${target.name.split(' ')[0]}, I'd love to have you collaborate on our project! Your skills in ${target.skills.slice(0, 2).join(' and ')} would be a great fit.`
  );
  const [currentUserName, setCurrentUserName] = useState('');

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);

    // Load current user name and projects
    (async () => {
      const [user, projects] = await Promise.all([
        getFirestoreUser(currentUid),
        getFirestoreProjects(currentUid),
      ]);
      if (user) setCurrentUserName(user.fullName);
      setMyProjects(projects);
      if (projects.length === 0) setUseNewProject(true);
      if (projects.length > 0) setSelectedProjectId(projects[0].id);
    })();

    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose, currentUid]);

  const handleSend = async () => {
    if (!message.trim() || message.trim().length < 10) {
      toast.error('Please add a message (at least 10 characters)');
      return;
    }
    setIsLoading(true);
    try {
      let projectId = selectedProjectId;
      let projectTitle = '';

      if (useNewProject) {
        if (!newProjectTitle.trim()) {
          toast.error('Please enter a project title');
          setIsLoading(false);
          return;
        }
        const newProject = await createFirestoreProject({
          title: newProjectTitle.trim(),
          description: '',
          type: newProjectType,
          ownerId: currentUid,
          ownerName: currentUserName,
        });
        projectId = newProject.id;
        projectTitle = newProject.title;
      } else {
        const project = myProjects.find((p) => p.id === projectId);
        if (!project) {
          toast.error('Please select a project');
          setIsLoading(false);
          return;
        }
        projectTitle = project.title;
      }

      await sendFirestoreInvite({
        fromUserId: currentUid,
        fromUserName: currentUserName,
        toUserId: target.id,
        toUserName: target.name,
        projectId,
        projectTitle,
        message: message.trim(),
      });

      toast.success('Invite sent successfully.');
      setSent(true);
      setTimeout(onClose, 1500);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(26,23,48,0.5)' }}
      onClick={onClose}
    >
      <div
        className="card w-full max-w-[480px] shadow-modal animate-slide-up max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10" style={{ borderColor: '#E8E6F0' }}>
          <h3 className="text-base font-bold" style={{ color: '#1A1730' }}>Invite to Project</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B87A0" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5">
          {/* Target user preview */}
          <div className="flex items-center gap-3 p-3 rounded-xl border mb-5" style={{ borderColor: '#E8E6F0', background: '#F8F7FF' }}>
            <div className="avatar w-10 h-10 text-sm flex-shrink-0" style={{ background: target.avatarColor }}>
              <span>{target.initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: '#1A1730' }}>{target.name}</p>
              <p className="text-xs truncate" style={{ color: '#8B87A0' }}>{target.course} · {target.campus}</p>
            </div>
            {target.available && (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <div className="available-dot" />
                <span className="text-xs font-medium" style={{ color: '#16A34A' }}>Available</span>
              </div>
            )}
          </div>

          {sent ? (
            <div className="flex flex-col items-center gap-3 py-6 animate-fade-in">
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: '#F0FDF4' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <p className="text-base font-semibold" style={{ color: '#1A1730' }}>Invite sent successfully.</p>
              <p className="text-sm text-center" style={{ color: '#8B87A0' }}>
                {target.name.split(' ')[0]} will see the invite in their notifications.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Project selector */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium" style={{ color: '#4A4665' }}>Select Project</label>

                {myProjects.length > 0 && (
                  <div className="flex gap-2 mb-1">
                    <button
                      type="button"
                      onClick={() => setUseNewProject(false)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${!useNewProject ? 'border-[#6C47FF] bg-[#F0ECFF] text-[#6C47FF]' : 'border-[#E8E6F0] text-[#8B87A0]'}`}
                    >
                      Existing Project
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseNewProject(true)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${useNewProject ? 'border-[#6C47FF] bg-[#F0ECFF] text-[#6C47FF]' : 'border-[#E8E6F0] text-[#8B87A0]'}`}
                    >
                      + New Project
                    </button>
                  </div>
                )}

                {!useNewProject && myProjects.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {myProjects.map((project) => (
                      <label
                        key={`project-opt-${project.id}`}
                        className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-150"
                        style={{
                          borderColor: selectedProjectId === project.id ? '#6C47FF' : '#E8E6F0',
                          background: selectedProjectId === project.id ? '#F8F7FF' : 'white',
                        }}
                      >
                        <input
                          type="radio"
                          name="projectId"
                          value={project.id}
                          checked={selectedProjectId === project.id}
                          onChange={() => setSelectedProjectId(project.id)}
                          className="filter-checkbox"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: '#1A1730' }}>{project.title}</p>
                          <p className="text-xs capitalize" style={{ color: '#8B87A0' }}>{project.type}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <input
                      className="input-field"
                      placeholder="Project title…"
                      value={newProjectTitle}
                      onChange={(e) => setNewProjectTitle(e.target.value)}
                    />
                    <div>
                      <p className="text-xs font-medium mb-2" style={{ color: '#4A4665' }}>Project Type</p>
                      <div className="grid grid-cols-2 gap-2">
                        {PROJECT_TYPES.map((pt) => (
                          <label
                            key={pt.value}
                            className="flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all"
                            style={{
                              borderColor: newProjectType === pt.value ? '#6C47FF' : '#E8E6F0',
                              background: newProjectType === pt.value ? '#F0ECFF' : 'white',
                            }}
                          >
                            <input
                              type="radio"
                              name="newProjectType"
                              value={pt.value}
                              checked={newProjectType === pt.value}
                              onChange={() => setNewProjectType(pt.value)}
                              className="filter-checkbox"
                            />
                            <span className="text-base">{pt.emoji}</span>
                            <span className="text-xs font-medium" style={{ color: '#1A1730' }}>{pt.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Message */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" style={{ color: '#4A4665' }}>Personal Message</label>
                <textarea
                  className="input-field resize-none"
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={onClose} className="btn-secondary flex-1 py-2.5">Cancel</button>
                <button
                  onClick={handleSend}
                  disabled={isLoading}
                  className="btn-primary flex-1 py-2.5 font-semibold"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending…
                    </span>
                  ) : 'Send Invite'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}