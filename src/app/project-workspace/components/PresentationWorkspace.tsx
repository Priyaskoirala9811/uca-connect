'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getPresentation, savePresentation, type Slide, type StoredPresentation } from '@/lib/storage';

interface PresentationWorkspaceProps {
  projectId: string;
}

export default function PresentationWorkspace({ projectId }: PresentationWorkspaceProps) {
  const [pres, setPres] = useState<StoredPresentation>({ projectId, slides: [], externalLink: '', lastEdited: '' });
  const [activeSlideId, setActiveSlideId] = useState<string | null>(null);
  const [editingSlide, setEditingSlide] = useState<Slide | null>(null);
  const [showExternalLink, setShowExternalLink] = useState(false);

  useEffect(() => {
    const loaded = getPresentation(projectId);
    setPres(loaded);
    if (loaded.slides.length > 0) {
      setActiveSlideId(loaded.slides[0].id);
      setEditingSlide({ ...loaded.slides[0] });
    }
  }, [projectId]);

  const activeSlide = pres.slides.find((s) => s.id === activeSlideId) || null;

  const handleSelectSlide = (slide: Slide) => {
    // Auto-save current slide edits
    if (editingSlide) saveCurrentSlide(editingSlide);
    setActiveSlideId(slide.id);
    setEditingSlide({ ...slide });
  };

  const saveCurrentSlide = (slide: Slide) => {
    const updated = { ...pres, slides: pres.slides.map((s) => s.id === slide.id ? slide : s) };
    setPres(updated);
    savePresentation(updated);
  };

  const handleAddSlide = () => {
    const newSlide: Slide = {
      id: `slide-${Date.now()}`,
      title: `Slide ${pres.slides.length + 1}`,
      body: '',
      notes: '',
      order: pres.slides.length,
    };
    const updated = { ...pres, slides: [...pres.slides, newSlide] };
    setPres(updated);
    savePresentation(updated);
    setActiveSlideId(newSlide.id);
    setEditingSlide({ ...newSlide });
  };

  const handleDeleteSlide = (slideId: string) => {
    const remaining = pres.slides.filter((s) => s.id !== slideId);
    const updated = { ...pres, slides: remaining };
    setPres(updated);
    savePresentation(updated);
    if (activeSlideId === slideId) {
      if (remaining.length > 0) {
        setActiveSlideId(remaining[0].id);
        setEditingSlide({ ...remaining[0] });
      } else {
        setActiveSlideId(null);
        setEditingSlide(null);
      }
    }
    toast.success('Slide deleted');
  };

  const handleSaveSlide = () => {
    if (!editingSlide) return;
    saveCurrentSlide(editingSlide);
    toast.success('Slide saved!');
  };

  const handleExportJSON = () => {
    const json = JSON.stringify(pres.slides, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'presentation.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported as JSON!');
  };

  const handleExportHTML = () => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Presentation</title>
<style>
  body { font-family: sans-serif; margin: 0; background: #1A1730; }
  .slide { width: 100vw; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 60px; box-sizing: border-box; background: linear-gradient(135deg, #6C47FF, #4A25DD); color: white; page-break-after: always; }
  h1 { font-size: 2.5rem; margin-bottom: 1rem; }
  p { font-size: 1.2rem; max-width: 700px; text-align: center; opacity: 0.85; }
  .notes { font-size: 0.8rem; opacity: 0.5; margin-top: 2rem; font-style: italic; }
</style></head><body>
${pres.slides.map((s, i) => `<div class="slide"><h1>${s.title || `Slide ${i + 1}`}</h1><p>${s.body || ''}</p>${s.notes ? `<p class="notes">Notes: ${s.notes}</p>` : ''}</div>`).join('\n')}
</body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'presentation.html';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported as HTML!');
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Slide list */}
      <div className="w-52 flex-shrink-0 border-r bg-white flex flex-col" style={{ borderColor: '#E8E6F0' }}>
        <div className="px-3 py-3 border-b flex items-center justify-between" style={{ borderColor: '#E8E6F0' }}>
          <span className="text-xs font-bold" style={{ color: '#4A4665' }}>SLIDES ({pres.slides.length})</span>
          <button onClick={handleAddSlide} className="w-6 h-6 rounded flex items-center justify-center hover:bg-[#F0ECFF] transition-colors" style={{ color: '#6C47FF' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2 px-2">
          {pres.slides.length === 0 ? (
            <p className="text-xs text-center py-4 px-3" style={{ color: '#8B87A0' }}>No slides yet</p>
          ) : (
            pres.slides.map((slide, idx) => (
              <div
                key={slide.id}
                onClick={() => handleSelectSlide(slide)}
                className={`group flex items-center gap-2 px-2 py-2.5 rounded-xl mb-1 cursor-pointer transition-all ${activeSlideId === slide.id ? 'bg-[#F0ECFF]' : 'hover:bg-gray-50'}`}
              >
                <div
                  className="w-8 h-6 rounded flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: activeSlideId === slide.id ? '#6C47FF' : '#E8E6F0', color: activeSlideId === slide.id ? 'white' : '#8B87A0' }}
                >
                  {idx + 1}
                </div>
                <p className="text-xs flex-1 truncate font-medium" style={{ color: activeSlideId === slide.id ? '#6C47FF' : '#1A1730' }}>
                  {slide.title || `Slide ${idx + 1}`}
                </p>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteSlide(slide.id); }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-100 transition-all"
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

        {/* Export buttons */}
        <div className="p-3 border-t flex flex-col gap-2" style={{ borderColor: '#E8E6F0' }}>
          <button onClick={handleExportJSON} className="w-full text-xs py-1.5 rounded-lg font-medium border transition-colors hover:bg-[#F0ECFF]" style={{ borderColor: '#E8E6F0', color: '#6C47FF' }}>
            Export JSON
          </button>
          <button onClick={handleExportHTML} className="w-full text-xs py-1.5 rounded-lg font-medium border transition-colors hover:bg-[#F0ECFF]" style={{ borderColor: '#E8E6F0', color: '#6C47FF' }}>
            Export HTML
          </button>
        </div>
      </div>

      {/* Slide editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {editingSlide ? (
          <>
            {/* Toolbar */}
            <div className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0 bg-white" style={{ borderColor: '#E8E6F0' }}>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold" style={{ color: '#1A1730' }}>📊 Presentation Workspace</span>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#F0ECFF', color: '#6C47FF' }}>
                  Slide {pres.slides.findIndex((s) => s.id === activeSlideId) + 1} of {pres.slides.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowExternalLink(!showExternalLink)} className="btn-secondary py-1.5 px-3 text-xs">
                  🔗 External Link
                </button>
                <button onClick={handleSaveSlide} className="btn-primary py-1.5 px-3 text-xs">Save Slide</button>
              </div>
            </div>

            {/* External link bar */}
            {showExternalLink && (
              <div className="px-5 py-3 border-b flex items-center gap-3" style={{ borderColor: '#E8E6F0', background: '#F8F7FF' }}>
                <label className="text-xs font-medium flex-shrink-0" style={{ color: '#4A4665' }}>External Link (PowerPoint/Google Slides/Figma):</label>
                <input
                  className="input-field flex-1 py-1.5 text-xs"
                  placeholder="https://docs.google.com/presentation/..."
                  value={pres.externalLink}
                  onChange={(e) => {
                    const updated = { ...pres, externalLink: e.target.value };
                    setPres(updated);
                    savePresentation(updated);
                  }}
                />
                {pres.externalLink && (
                  <a href={pres.externalLink} target="_blank" rel="noopener noreferrer" className="btn-primary py-1.5 px-3 text-xs">Open</a>
                )}
              </div>
            )}

            {/* Slide preview + edit */}
            <div className="flex-1 overflow-auto p-6 flex gap-6">
              {/* Slide preview */}
              <div className="flex-1 flex flex-col gap-4">
                <div
                  className="w-full rounded-2xl p-8 flex flex-col justify-center items-center text-center min-h-[280px]"
                  style={{ background: 'linear-gradient(135deg, #6C47FF, #4A25DD)', boxShadow: '0 8px 32px rgba(108,71,255,0.3)' }}
                >
                  <h2 className="text-2xl font-bold text-white mb-3">{editingSlide.title || 'Slide Title'}</h2>
                  <p className="text-white/80 text-sm leading-relaxed max-w-lg whitespace-pre-wrap">{editingSlide.body || 'Slide content will appear here…'}</p>
                </div>
                {editingSlide.notes && (
                  <div className="p-3 rounded-xl border" style={{ borderColor: '#E8E6F0', background: '#FFFBEB' }}>
                    <p className="text-xs font-semibold mb-1" style={{ color: '#D97706' }}>Speaker Notes:</p>
                    <p className="text-xs" style={{ color: '#4A4665' }}>{editingSlide.notes}</p>
                  </div>
                )}
              </div>

              {/* Edit form */}
              <div className="w-72 flex-shrink-0 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: '#4A4665' }}>Slide Title</label>
                  <input
                    className="input-field text-sm"
                    placeholder="Enter slide title…"
                    value={editingSlide.title}
                    onChange={(e) => setEditingSlide({ ...editingSlide, title: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: '#4A4665' }}>Content / Body</label>
                  <textarea
                    className="input-field resize-none text-sm"
                    rows={6}
                    placeholder="Slide content…"
                    value={editingSlide.body}
                    onChange={(e) => setEditingSlide({ ...editingSlide, body: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: '#4A4665' }}>Speaker Notes</label>
                  <textarea
                    className="input-field resize-none text-sm"
                    rows={3}
                    placeholder="Notes for the presenter…"
                    value={editingSlide.notes}
                    onChange={(e) => setEditingSlide({ ...editingSlide, notes: e.target.value })}
                  />
                </div>
                <button onClick={handleSaveSlide} className="btn-primary py-2.5 text-sm font-semibold">
                  Save Slide
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
            <div className="text-5xl">📊</div>
            <h3 className="text-lg font-bold" style={{ color: '#1A1730' }}>Presentation Workspace</h3>
            <p className="text-sm text-center max-w-sm" style={{ color: '#8B87A0' }}>
              Create slides with title, content, and speaker notes. Export as JSON or HTML when ready.
            </p>
            <button onClick={handleAddSlide} className="btn-primary py-2.5 px-6">
              + Add First Slide
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
