'use client';

import React from 'react';

// Demo credentials panel removed — app now uses real localStorage accounts.
// This component is kept as a placeholder to avoid import errors.

interface CredentialsPanelProps {
  activeTab: 'login' | 'signup';
}

export default function CredentialsPanel({ activeTab }: CredentialsPanelProps) {
  if (activeTab === 'signup') return null;

  return (
    <div
      className="rounded-2xl border p-4 text-center"
      style={{ borderColor: '#E8E6F0', background: '#F8F7FF' }}
    >
      <p className="text-xs" style={{ color: '#8B87A0' }}>
        New to UCA Connect?{' '}
        <span className="font-medium" style={{ color: '#6C47FF' }}>
          Create a free account
        </span>{' '}
        to get started.
      </p>
    </div>
  );
}