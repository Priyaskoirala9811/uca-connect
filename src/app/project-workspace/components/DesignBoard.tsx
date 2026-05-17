'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import type { StoredFile } from '@/lib/storage';

interface DesignBoardProps {
  projectId: string;
  files: StoredFile[];
  onAddFile: (file: Omit<StoredFile, 'id'>) => void;
  currentUserId: string;
}

export default function DesignBoard({ projectId, files, onAddFile, currentUserId }: DesignBoardProps) {
  const [showAddResource, setShowAddResource] = useState(false);
  const [newResource, setNewResource] = useState({ name: '', url: '', type: 'figma' as StoredFile['type'], notes: '' });
  const [designNotes, setDesignNotes] = useState('');

  const designFiles = files.filter((f) => ['figma', 'link', 'pdf'].includes(f.type));

  const handleAddResource = () => {
    if (!newResource.name.trim() || !newResource.url.trim()) {
      toast.error('Please fill in name and URL');
      return;
    }
    onAddFile({
      projectId,
      name: newResource.name.trim(),
      type: newResource.type,
      url: newResource.url.trim(),
      uploadedById: currentUserId,
      uploadedAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    });
    setNewResource({ name: '', url: '', type: 'figma', notes: '' });
    setShowAddResource(false);
  };

  const RESOURCE_ICONS: Record<string, { icon: string; color: string; bg: string }> = {
    figma: { icon: '🎨', color: '#6C47FF', bg: '#F0ECFF' },
    link: { icon: '🔗', color: '#22C55E', bg: '#F0FDF4' },
    pdf: { icon: '📄', color: '#EF4444', bg: '#FFF5F5' },
    github: { icon: '⚡', color: '#1A1730', bg: '#F1F5F9' },
    slides: { icon: '📊', color: '#F59E0B', bg: '#FFFBEB' },
    video: { icon: '🎬', color: '#0EA5E9', bg: '#EFF6FF' },
  };

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold" style={{ color: '#1A1730' }}>🎨 Design Resource Board</h2>
            <p className="text-sm mt-0.5" style={{ color: '#8B87A0' }}>Figma files, references, images, and design notes</p>
          </div>
          <button onClick={() => setShowAddResource(true)} className="btn-primary py-2 px-4 text-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add Resource
          </button>
        </div>

        {/* Resources grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {designFiles.length === 0 ? (
            <div className="col-span-full text-center py-12 rounded-2xl border-2 border-dashed" style={{ borderColor: '#E8E6F0' }}>
              <div className="text-4xl mb-3">🎨</div>
              <p className="text-sm font-medium mb-1" style={{ color: '#4A4665' }}>No design resources yet</p>
              <p className="text-xs" style={{ color: '#8B87A0' }}>Add Figma links, references, or design files</p>
            </div>
          ) : (
            designFiles.map((file) => {
              const config = RESOURCE_ICONS[file.type] || RESOURCE_ICONS.link;
              return (
                <a
                  key={file.id}
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card p-4 flex items-start gap-3 hover:border-[#6C47FF] transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: config.bg }}>
                    {config.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate group-hover:text-[#6C47FF] transition-colors" style={{ color: '#1A1730' }}>{file.name}</p>
                    <p className="text-xs truncate mt-0.5" style={{ color: '#8B87A0' }}>{file.url}</p>
                    <p className="text-xs mt-1" style={{ color: '#C4C0D4' }}>{file.uploadedAt}</p>
                  </div>
                </a>
              );
            })
          )}
        </div>

        {/* Design notes */}
        <div className="card p-5">
          <h3 className="text-sm font-bold mb-3" style={{ color: '#1A1730' }}>Design Notes</h3>
          <textarea
            className="input-field resize-none w-full"
            rows={5}
            placeholder="Add design notes, colour palette, typography choices, references…"
            value={designNotes}
            onChange={(e) => setDesignNotes(e.target.value)}
          />
          <button
            onClick={() => toast.success('Notes saved!')}
            className="btn-primary py-2 px-4 text-sm mt-3"
          >
            Save Notes
          </button>
        </div>
      </div>

      {/* Add Resource Modal */}
      {showAddResource && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(26,23,48,0.5)' }}
          onClick={() => setShowAddResource(false)}
        >
          <div className="card w-full max-w-[400px] shadow-modal" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#E8E6F0' }}>
              <h3 className="text-sm font-bold" style={{ color: '#1A1730' }}>Add Design Resource</h3>
              <button onClick={() => setShowAddResource(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B87A0" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-5 py-4 flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium" style={{ color: '#4A4665' }}>Resource Name</label>
                <input className="input-field" placeholder="e.g. Main Figma File" value={newResource.name} onChange={(e) => setNewResource({ ...newResource, name: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium" style={{ color: '#4A4665' }}>URL</label>
                <input className="input-field" type="url" placeholder="https://figma.com/..." value={newResource.url} onChange={(e) => setNewResource({ ...newResource, url: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium" style={{ color: '#4A4665' }}>Type</label>
                <select className="input-field" value={newResource.type} onChange={(e) => setNewResource({ ...newResource, type: e.target.value as StoredFile['type'] })}>
                  <option value="figma">Figma</option>
                  <option value="link">Link / Reference</option>
                  <option value="pdf">PDF</option>
                  <option value="github">GitHub</option>
                  <option value="slides">Slides</option>
                </select>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setShowAddResource(false)} className="btn-secondary flex-1 py-2 text-sm">Cancel</button>
                <button onClick={handleAddResource} className="btn-primary flex-1 py-2 text-sm">Add Resource</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
