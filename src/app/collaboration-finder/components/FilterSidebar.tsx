'use client';

import React from 'react';
import type { FinderFilters } from './CollaborationFinderScreen';

const COURSES = [
  'Animation', 'Architecture', 'Creative Computing', 'Fashion Design',
  'Film & TV Production', 'Fine Art', 'Games Design', 'Graphic Design',
  'Illustration', 'Interior Design', 'Music', 'Photography',
  'Product Design', 'UI/UX Design',
];

interface FilterSidebarProps {
  filters: FinderFilters;
  onFiltersChange: (filters: FinderFilters) => void;
  onClose: () => void;
}

const CAMPUSES = ['Farnham', 'Epsom', 'Canterbury', 'Rochester'];
const POPULAR_SKILLS = [
  'Figma', 'React', 'After Effects', 'Blender', 'Unity',
  'Illustration', 'UI/UX Design', 'Three.js', 'Premiere Pro', 'Python',
  'Character Design', 'Photography', 'Game Development', 'Creative Coding',
];

export default function FilterSidebar({ filters, onFiltersChange, onClose }: FilterSidebarProps) {
  const toggle = <T extends string>(arr: T[], value: T): T[] =>
    arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];

  const handleSkillToggle = (skill: string) =>
    onFiltersChange({ ...filters, skills: toggle(filters.skills, skill) });

  const handleCampusToggle = (campus: string) =>
    onFiltersChange({ ...filters, campuses: toggle(filters.campuses, campus) });

  const handleCourseToggle = (course: string) =>
    onFiltersChange({ ...filters, courses: toggle(filters.courses, course) });

  const handleRoleToggle = (role: 'student' | 'tutor') =>
    onFiltersChange({ ...filters, roles: toggle(filters.roles, role) });

  return (
    <div
      className="fixed left-0 top-0 bottom-0 z-40 w-[86vw] max-w-[320px] flex-shrink-0 flex flex-col border-r bg-white overflow-y-auto scrollbar-thin animate-slide-right lg:static lg:z-auto lg:w-[260px] lg:max-w-none"
      style={{ borderColor: '#E8E6F0' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3.5 border-b flex-shrink-0"
        style={{ borderColor: '#E8E6F0' }}
      >
        <span className="text-sm font-semibold" style={{ color: '#1A1730' }}>Filters</span>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B87A0" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-4 flex flex-col gap-5">

        {/* Availability */}
        <div>
          <div
            className="flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-150"
            style={{
              borderColor: filters.availableOnly ? '#6C47FF' : '#E8E6F0',
              background: filters.availableOnly ? '#F0ECFF' : '#FAFAF8',
            }}
            onClick={() => onFiltersChange({ ...filters, availableOnly: !filters.availableOnly })}
          >
            <div className="flex items-center gap-2.5">
              <div className="available-dot" />
              <span className="text-sm font-medium" style={{ color: filters.availableOnly ? '#6C47FF' : '#4A4665' }}>
                Available now only
              </span>
            </div>
            <div
              className="w-10 h-5 rounded-full relative transition-all duration-200"
              style={{ background: filters.availableOnly ? '#6C47FF' : '#D1D5DB' }}
            >
              <div
                className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200 shadow-sm"
                style={{ left: filters.availableOnly ? '22px' : '2px' }}
              />
            </div>
          </div>
        </div>

        {/* Role */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2.5" style={{ color: '#8B87A0' }}>Role</p>
          <div className="flex gap-2">
            {(['student', 'tutor'] as const).map((role) => (
              <button
                key={`role-filter-${role}`}
                onClick={() => handleRoleToggle(role)}
                className="flex-1 py-2 px-3 rounded-xl border text-sm font-medium transition-all duration-150 capitalize"
                style={{
                  borderColor: filters.roles.includes(role) ? '#6C47FF' : '#E8E6F0',
                  background: filters.roles.includes(role) ? '#F0ECFF' : 'white',
                  color: filters.roles.includes(role) ? '#6C47FF' : '#4A4665',
                }}
              >
                {role === 'student' ? '🎓' : '👩‍🏫'} {role}
              </button>
            ))}
          </div>
        </div>

        {/* Campus */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2.5" style={{ color: '#8B87A0' }}>Campus</p>
          <div className="flex flex-col gap-2">
            {CAMPUSES.map((campus) => (
              <label
                key={`campus-filter-${campus}`}
                className="flex items-center gap-2.5 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  className="filter-checkbox"
                  checked={filters.campuses.includes(campus)}
                  onChange={() => handleCampusToggle(campus)}
                />
                <span
                  className="text-sm group-hover:text-[#6C47FF] transition-colors"
                  style={{ color: filters.campuses.includes(campus) ? '#6C47FF' : '#4A4665', fontWeight: filters.campuses.includes(campus) ? 600 : 400 }}
                >
                  {campus}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Skills */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2.5" style={{ color: '#8B87A0' }}>Skills</p>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_SKILLS.map((skill) => (
              <button
                key={`skill-filter-${skill}`}
                onClick={() => handleSkillToggle(skill)}
                className={`skill-chip ${filters.skills.includes(skill) ? 'selected' : ''}`}
              >
                {filters.skills.includes(skill) && (
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )}
                {skill}
              </button>
            ))}
          </div>
          {filters.skills.length > 0 && (
            <button
              onClick={() => onFiltersChange({ ...filters, skills: [] })}
              className="mt-2 text-xs font-medium"
              style={{ color: '#FF6B6B' }}
            >
              Clear skills ({filters.skills.length})
            </button>
          )}
        </div>

        {/* Course */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2.5" style={{ color: '#8B87A0' }}>Course</p>
          <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto scrollbar-thin">
            {COURSES.map((course) => (
              <label
                key={`course-filter-${course}`}
                className="flex items-center gap-2.5 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  className="filter-checkbox"
                  checked={filters.courses.includes(course)}
                  onChange={() => handleCourseToggle(course)}
                />
                <span
                  className="text-sm group-hover:text-[#6C47FF] transition-colors"
                  style={{ color: filters.courses.includes(course) ? '#6C47FF' : '#4A4665', fontWeight: filters.courses.includes(course) ? 600 : 400 }}
                >
                  {course}
                </span>
              </label>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}