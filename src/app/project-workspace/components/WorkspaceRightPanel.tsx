'use client';

import React, { useRef, useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { StoredMessage, StoredFile, StoredUser } from '@/lib/storage';

type Tab = 'chat' | 'files' | 'members';

interface WorkspaceRightPanelProps {
  activeTab: Tab;
  onTabChange?: (tab: Tab) => void;
  messages: StoredMessage[];
  files: StoredFile[];
  members: StoredUser[];
  currentUserId: string;
  onSendMessage: (content: string) => void;
  onAddFile: (file: Omit<StoredFile, 'id'>) => void;
  projectId: string;
  fullWidth?: boolean;
}

const FILE_ICONS: Record<string, { icon: string; color: string; bg: string }> = {
  pdf: { icon: '📄', color: '#EF4444', bg: '#FFF5F5' },
  figma: { icon: '🎨', color: '#6C47FF', bg: '#F0ECFF' },
  github: { icon: '⚡', color: '#1A1730', bg: '#F1F5F9' },
  slides: { icon: '📊', color: '#F59E0B', bg: '#FFFBEB' },
  video: { icon: '🎬', color: '#0EA5E9', bg: '#EFF6FF' },
  link: { icon: '🔗', color: '#22C55E', bg: '#F0FDF4' },
};

export default function WorkspaceRightPanel({
  activeTab,
  onTabChange,
  messages,
  files,
  members,
  currentUserId,
  onSendMessage,
  onAddFile,
  projectId,
  fullWidth = false,
}: WorkspaceRightPanelProps) {
  const [newMessage, setNewMessage] = useState('');
  const [showAddFile, setShowAddFile] = useState(false);
  const [newFile, setNewFile] = useState({ name: '', url: '', type: 'link' as StoredFile['type'] });
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTab]);

  const handleSendMessage = () => {
    const trimmed = newMessage.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setNewMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getMemberById = (id: string) => members.find((m) => m.id === id);

  const handleAddFile = () => {
    if (!newFile.name.trim() || !newFile.url.trim()) { toast.error('Fill in name and URL'); return; }
    onAddFile({
      projectId,
      name: newFile.name.trim(),
      type: newFile.type,
      url: newFile.url.trim(),
      uploadedById: currentUserId,
      uploadedAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    });
    setNewFile({ name: '', url: '', type: 'link' });
    setShowAddFile(false);
  };

  const containerStyle = fullWidth
    ? { width: '100%', height: '100%' }
    : { width: '340px', borderLeft: '1px solid #E8E6F0' };

  return (
    <div className="flex flex-col bg-white" style={{ ...containerStyle, minHeight: 0 }}>
      {/* Tabs — only shown when not fullWidth (embedded mode) */}
      {!fullWidth && onTabChange && (
        <div className="flex items-center gap-1 p-2 border-b flex-shrink-0" style={{ borderColor: '#E8E6F0' }}>
          {(['chat', 'files', 'members'] as Tab[]).map((tab) => (
            <button
              key={`panel-tab-${tab}`}
              onClick={() => onTabChange(tab)}
              className={`tab-btn flex-1 capitalize flex items-center justify-center gap-1.5 ${activeTab === tab ? 'active' : ''}`}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* Chat panel */}
      {activeTab === 'chat' && (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto scrollbar-thin p-4 flex flex-col gap-3">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div className="text-3xl mb-2">💬</div>
                <p className="text-xs" style={{ color: '#8B87A0' }}>No messages yet. Start the conversation!</p>
              </div>
            )}
            {messages.map((msg) => {
              const sender = getMemberById(msg.senderId);
              const isCurrentUser = msg.senderId === currentUserId;
              const senderInitials = sender ? sender.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2) : '?';
              return (
                <div key={`msg-${msg.id}`} className={`flex gap-2.5 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  {!isCurrentUser && sender && (
                    <div className="avatar w-7 h-7 text-xs flex-shrink-0 self-end" style={{ background: sender.avatarColor }} title={sender.fullName}>
                      <span style={{ fontSize: '9px' }}>{senderInitials}</span>
                    </div>
                  )}
                  <div className={`flex flex-col gap-0.5 ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                    {!isCurrentUser && sender && (
                      <span className="text-xs font-medium px-1" style={{ color: '#8B87A0' }}>{sender.fullName.split(' ')[0]}</span>
                    )}
                    <div className={isCurrentUser ? 'message-bubble-self' : 'message-bubble-other'}>{msg.content}</div>
                    <span className="text-xs px-1" style={{ color: '#C4C0D4' }}>{msg.timestamp}</span>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          <div className="flex-shrink-0 p-3 border-t" style={{ borderColor: '#E8E6F0' }}>
            <div className="flex items-end gap-2 rounded-xl border p-2" style={{ borderColor: '#E8E6F0', background: '#F8F7FF' }}>
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
                disabled={!newMessage.trim()}
                className="p-2 rounded-lg transition-all duration-150 active:scale-95 flex-shrink-0"
                style={{ background: newMessage.trim() ? '#6C47FF' : '#E8E6F0', color: newMessage.trim() ? 'white' : '#8B87A0' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M22 2L11 13" />
                  <path d="M22 2L15 22 11 13 2 9l20-7z" />
                </svg>
              </button>
            </div>
            <p className="text-xs mt-1.5 text-center" style={{ color: '#C4C0D4' }}>Shift+Enter for new line</p>
          </div>
        </div>
      )}

      {/* Files panel */}
      {activeTab === 'files' && (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0" style={{ borderColor: '#E8E6F0' }}>
            <span className="text-xs font-semibold" style={{ color: '#4A4665' }}>{files.length} resources</span>
            <button onClick={() => setShowAddFile(true)} className="btn-primary py-1.5 px-3 text-xs">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add file
            </button>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin p-3 flex flex-col gap-2">
            {files.length === 0 && (
              <div className="text-center py-8">
                <div className="text-3xl mb-2">📎</div>
                <p className="text-xs" style={{ color: '#8B87A0' }}>No resources yet. Add links or files!</p>
              </div>
            )}
            {files.map((file) => {
              const fileConfig = FILE_ICONS[file.type] || FILE_ICONS.link;
              const uploader = getMemberById(file.uploadedById);
              return (
                <div
                  key={`file-${file.id}`}
                  className="flex items-start gap-3 p-3 rounded-xl border transition-all duration-150 hover:border-[#6C47FF] hover:bg-[#FAFAFF] cursor-pointer group"
                  style={{ borderColor: '#E8E6F0' }}
                  onClick={() => window.open(file.url, '_blank')}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0" style={{ background: fileConfig.bg }}>
                    {fileConfig.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold leading-snug group-hover:text-[#6C47FF] transition-colors truncate" style={{ color: '#1A1730' }}>{file.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {file.size && <span className="text-xs" style={{ color: '#8B87A0' }}>{file.size}</span>}
                      <span className="text-xs" style={{ color: '#8B87A0' }}>{file.uploadedAt}</span>
                    </div>
                    {uploader && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <div className="avatar w-4 h-4" style={{ background: uploader.avatarColor, fontSize: '8px' }}>
                          <span>{uploader.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}</span>
                        </div>
                        <span className="text-xs" style={{ color: '#8B87A0' }}>{uploader.fullName.split(' ')[0]}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add file modal */}
          {showAddFile && (
            <div className="p-3 border-t" style={{ borderColor: '#E8E6F0', background: '#F8F7FF' }}>
              <p className="text-xs font-semibold mb-2" style={{ color: '#4A4665' }}>Add Resource</p>
              <input className="input-field text-xs mb-2" placeholder="Name" value={newFile.name} onChange={(e) => setNewFile({ ...newFile, name: e.target.value })} />
              <input className="input-field text-xs mb-2" placeholder="URL (https://...)" value={newFile.url} onChange={(e) => setNewFile({ ...newFile, url: e.target.value })} />
              <select className="input-field text-xs mb-2" value={newFile.type} onChange={(e) => setNewFile({ ...newFile, type: e.target.value as StoredFile['type'] })}>
                <option value="link">Link</option>
                <option value="figma">Figma</option>
                <option value="github">GitHub</option>
                <option value="pdf">PDF</option>
                <option value="slides">Slides</option>
                <option value="video">Video</option>
              </select>
              <div className="flex gap-2">
                <button onClick={() => setShowAddFile(false)} className="btn-secondary flex-1 py-1.5 text-xs">Cancel</button>
                <button onClick={handleAddFile} className="btn-primary flex-1 py-1.5 text-xs">Add</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Members panel */}
      {activeTab === 'members' && (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0" style={{ borderColor: '#E8E6F0' }}>
            <span className="text-xs font-semibold" style={{ color: '#4A4665' }}>{members.length} members</span>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin p-3 flex flex-col gap-2">
            {members.map((member) => {
              const memberInitials = member.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2);
              return (
                <div
                  key={`member-panel-${member.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl border transition-all duration-150 hover:border-[#6C47FF] hover:bg-[#FAFAFF]"
                  style={{ borderColor: '#E8E6F0' }}
                >
                  <div className="relative">
                    <div className="avatar w-10 h-10 text-sm" style={{ background: member.avatarColor }}>
                      <span>{memberInitials}</span>
                    </div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white" style={{ background: member.available ? '#22C55E' : '#F59E0B' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate" style={{ color: '#1A1730' }}>{member.fullName}</p>
                      {member.role === 'tutor' && <span className="badge badge-coral text-xs">Tutor</span>}
                    </div>
                    <p className="text-xs truncate mt-0.5" style={{ color: '#8B87A0' }}>{member.course}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="badge badge-slate text-xs">{member.campus}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}