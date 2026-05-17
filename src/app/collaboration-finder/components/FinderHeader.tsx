'use client';

import React from 'react';

interface FinderHeaderProps {
  search: string;
  onSearchChange: (v: string) => void;
  resultCount: number;
  totalCount: number;
  activeFilterCount: number;
  onToggleFilterSidebar: () => void;
  filterSidebarOpen: boolean;
  onClearFilters: () => void;
}

export default function FinderHeader({
  search,
  onSearchChange,
  resultCount,
  totalCount,
  activeFilterCount,
  onToggleFilterSidebar,
  filterSidebarOpen,
  onClearFilters,
}: FinderHeaderProps) {
  return (
    <div
      className="flex-shrink-0 border-b bg-white px-6 py-4"
      style={{ borderColor: '#E8E6F0' }}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Title + count */}
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#1A1730' }}>Collaboration Finder</h1>
          <p className="text-sm mt-0.5" style={{ color: '#8B87A0' }}>
            Discover students and tutors across all four UCA campuses
          </p>
        </div>

        {/* Search + controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#8B87A0"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by name, skill, course…"
              className="input-field pl-9 pr-4 py-2 text-sm"
              style={{ width: '280px' }}
            />
            {search && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-gray-100"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8B87A0" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Filter toggle */}
          <button
            onClick={onToggleFilterSidebar}
            className="relative flex items-center gap-2 py-2 px-3.5 rounded-xl border text-sm font-medium transition-all duration-150 hover:bg-[#F0ECFF]"
            style={{
              borderColor: activeFilterCount > 0 ? '#6C47FF' : '#E8E6F0',
              color: activeFilterCount > 0 ? '#6C47FF' : '#4A4665',
              background: filterSidebarOpen ? '#F0ECFF' : 'white',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            Filters
            {activeFilterCount > 0 && (
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: '#6C47FF' }}
              >
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Clear filters */}
          {activeFilterCount > 0 && (
            <button
              onClick={onClearFilters}
              className="text-sm font-medium transition-colors hover:text-red-500"
              style={{ color: '#8B87A0' }}
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Result count */}
      <div className="flex items-center gap-3 mt-3">
        <p className="text-xs" style={{ color: '#8B87A0' }}>
          Showing{' '}
          <span className="font-semibold" style={{ color: '#1A1730' }}>{resultCount}</span>
          {' '}of{' '}
          <span className="font-semibold" style={{ color: '#1A1730' }}>{totalCount}</span>
          {' '}people
          {activeFilterCount > 0 && ' (filtered)'}
        </p>

        {/* Active filter chips */}
        <div className="flex flex-wrap gap-1.5">
          {activeFilterCount > 0 && (
            <span className="badge badge-violet">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
            </span>
          )}
        </div>
      </div>
    </div>
  );
}