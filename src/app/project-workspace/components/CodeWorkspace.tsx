'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getCodeFiles, addCodeFile, saveCodeFile, deleteCodeFile, type CodeFile } from '@/lib/storage';

const LANGUAGES = ['javascript', 'typescript', 'python', 'html', 'css', 'json', 'markdown', 'other'];

interface CodeWorkspaceProps {
  projectId: string;
}

export default function CodeWorkspace({ projectId }: CodeWorkspaceProps) {
  const [files, setFiles] = useState<CodeFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [editingCode, setEditingCode] = useState('');
  const [showNewFile, setShowNewFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileLang, setNewFileLang] = useState('javascript');

  useEffect(() => {
    const codeFiles = getCodeFiles(projectId);
    setFiles(codeFiles);
    if (codeFiles.length > 0) {
      setActiveFileId(codeFiles[0].id);
      setEditingCode(codeFiles[0].content);
    }
  }, [projectId]);

  const activeFile = files.find((f) => f.id === activeFileId) || null;

  const handleSelectFile = (file: CodeFile) => {
    // Save current edits before switching
    if (activeFile) {
      const updated = { ...activeFile, content: editingCode, lastEdited: new Date().toISOString() };
      saveCodeFile(updated);
      setFiles((prev) => prev.map((f) => f.id === updated.id ? updated : f));
    }
    setActiveFileId(file.id);
    setEditingCode(file.content);
  };

  const handleSave = () => {
    if (!activeFile) return;
    const updated = { ...activeFile, content: editingCode, lastEdited: new Date().toISOString() };
    saveCodeFile(updated);
    setFiles((prev) => prev.map((f) => f.id === updated.id ? updated : f));
    toast.success('Code saved!');
  };

  const handleCreateFile = () => {
    if (!newFileName.trim()) { toast.error('Enter a filename'); return; }
    const newFile = addCodeFile({
      projectId,
      filename: newFileName.trim(),
      language: newFileLang,
      content: `// ${newFileName.trim()}\n`,
    });
    setFiles((prev) => [...prev, newFile]);
    setActiveFileId(newFile.id);
    setEditingCode(newFile.content);
    setShowNewFile(false);
    setNewFileName('');
  };

  const handleDeleteFile = (fileId: string) => {
    deleteCodeFile(fileId);
    const remaining = files.filter((f) => f.id !== fileId);
    setFiles(remaining);
    if (activeFileId === fileId) {
      if (remaining.length > 0) {
        setActiveFileId(remaining[0].id);
        setEditingCode(remaining[0].content);
      } else {
        setActiveFileId(null);
        setEditingCode('');
      }
    }
    toast.success('File deleted');
  };

  const LANG_COLORS: Record<string, string> = {
    javascript: '#F59E0B', typescript: '#0EA5E9', python: '#22C55E',
    html: '#EF4444', css: '#8B5CF6', json: '#6C47FF', markdown: '#14B8A6', other: '#8B87A0',
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* File list sidebar */}
      <div className="w-52 flex-shrink-0 border-r bg-white flex flex-col" style={{ borderColor: '#E8E6F0', background: '#1E1E2E' }}>
        <div className="px-3 py-3 flex items-center justify-between border-b" style={{ borderColor: '#2D2D3F' }}>
          <span className="text-xs font-semibold" style={{ color: '#9B87FF' }}>CODE WORKSPACE</span>
          <button
            onClick={() => setShowNewFile(true)}
            className="w-6 h-6 rounded flex items-center justify-center hover:bg-[#2D2D3F] transition-colors"
            style={{ color: '#9B87FF' }}
            title="New file"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-1">
          {files.length === 0 ? (
            <p className="text-xs text-center py-4 px-3" style={{ color: '#6B6B8A' }}>No files yet. Create one!</p>
          ) : (
            files.map((file) => (
              <div
                key={file.id}
                onClick={() => handleSelectFile(file)}
                className={`flex items-center gap-2 px-3 py-2 cursor-pointer group transition-colors ${activeFileId === file.id ? 'bg-[#2D2D3F]' : 'hover:bg-[#252535]'}`}
              >
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: LANG_COLORS[file.language] || '#8B87A0' }} />
                <span className="text-xs flex-1 truncate" style={{ color: activeFileId === file.id ? '#FFFFFF' : '#C4C0D4' }}>
                  {file.filename}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteFile(file.id); }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-500/20 transition-all"
                  style={{ color: '#EF4444' }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        {/* New file form */}
        {showNewFile && (
          <div className="p-3 border-t" style={{ borderColor: '#2D2D3F' }}>
            <input
              className="w-full text-xs px-2 py-1.5 rounded mb-2 outline-none"
              style={{ background: '#2D2D3F', color: '#FFFFFF', border: '1px solid #3D3D5F' }}
              placeholder="filename.js"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFile()}
              autoFocus
            />
            <select
              className="w-full text-xs px-2 py-1.5 rounded mb-2 outline-none"
              style={{ background: '#2D2D3F', color: '#C4C0D4', border: '1px solid #3D3D5F' }}
              value={newFileLang}
              onChange={(e) => setNewFileLang(e.target.value)}
            >
              {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            <div className="flex gap-1">
              <button onClick={handleCreateFile} className="flex-1 text-xs py-1 rounded font-medium" style={{ background: '#6C47FF', color: 'white' }}>Create</button>
              <button onClick={() => setShowNewFile(false)} className="flex-1 text-xs py-1 rounded font-medium" style={{ background: '#2D2D3F', color: '#C4C0D4' }}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Editor area */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ background: '#1E1E2E' }}>
        {activeFile ? (
          <>
            {/* Editor toolbar */}
            <div className="flex items-center justify-between px-4 py-2 border-b flex-shrink-0" style={{ borderColor: '#2D2D3F' }}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: LANG_COLORS[activeFile.language] || '#8B87A0' }} />
                <span className="text-xs font-medium" style={{ color: '#C4C0D4' }}>{activeFile.filename}</span>
                <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#2D2D3F', color: '#6B6B8A' }}>{activeFile.language}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: '#6B6B8A' }}>
                  Last saved: {new Date(activeFile.lastEdited).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <button
                  onClick={handleSave}
                  className="text-xs px-3 py-1 rounded font-medium transition-colors hover:opacity-90"
                  style={{ background: '#6C47FF', color: 'white' }}
                >
                  Save (Ctrl+S)
                </button>
              </div>
            </div>

            {/* Code textarea — VS Code style */}
            <div className="flex-1 overflow-hidden relative">
              <textarea
                className="w-full h-full p-4 text-sm font-mono resize-none outline-none"
                style={{
                  background: '#1E1E2E',
                  color: '#D4D4D4',
                  lineHeight: '1.6',
                  tabSize: 2,
                  fontFamily: '"Fira Code", "Cascadia Code", "Consolas", monospace',
                }}
                value={editingCode}
                onChange={(e) => setEditingCode(e.target.value)}
                onKeyDown={(e) => {
                  // Tab key inserts spaces
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    const start = e.currentTarget.selectionStart;
                    const end = e.currentTarget.selectionEnd;
                    const newVal = editingCode.substring(0, start) + '  ' + editingCode.substring(end);
                    setEditingCode(newVal);
                    setTimeout(() => { e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 2; }, 0);
                  }
                  // Ctrl+S saves
                  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                    e.preventDefault();
                    handleSave();
                  }
                }}
                spellCheck={false}
              />
            </div>

            {/* Status bar */}
            <div className="flex items-center px-4 py-1 flex-shrink-0" style={{ background: '#6C47FF' }}>
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.8)' }}>
                💻 Code Workspace — In-app editor · {editingCode.split('\n').length} lines
              </span>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <div className="text-4xl">💻</div>
            <p className="text-sm font-medium" style={{ color: '#6B6B8A' }}>Create a file to start coding</p>
            <button
              onClick={() => setShowNewFile(true)}
              className="text-xs px-4 py-2 rounded-lg font-medium"
              style={{ background: '#6C47FF', color: 'white' }}
            >
              + New File
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
