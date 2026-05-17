'use client';

import React, { useState } from 'react';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import CredentialsPanel from './CredentialsPanel';

export default function AuthScreen() {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

  const handleSwitchTab = (tab: 'login' | 'signup') => setActiveTab(tab);

  return (
    <div className="min-h-screen flex" style={{ background: '#F8F7FF' }}>
      {/* Left brand panel */}
      <div
        className="hidden lg:flex lg:w-[480px] xl:w-[540px] flex-col relative overflow-hidden flex-shrink-0"
        style={{
          background: 'linear-gradient(145deg, #6C47FF 0%, #4A25DD 55%, #2D1A8F 100%)',
        }}
      >
        {/* Background decoration */}
        <div
          className="absolute top-[-80px] right-[-80px] w-[360px] h-[360px] rounded-full opacity-10"
          style={{ background: '#FF6B6B' }}
        />
        <div
          className="absolute bottom-[-60px] left-[-60px] w-[280px] h-[280px] rounded-full opacity-10"
          style={{ background: '#FFFFFF' }}
        />
        <div
          className="absolute top-[40%] left-[50%] w-[200px] h-[200px] rounded-full opacity-5"
          style={{ background: '#FF6B6B', transform: 'translate(-50%, -50%)' }}
        />

        <div className="relative z-10 flex flex-col h-full p-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.2)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="9" cy="9" r="5" stroke="white" strokeWidth="2" />
                <circle cx="15" cy="15" r="5" stroke="#FF6B6B" strokeWidth="2" />
              </svg>
            </div>
            <div>
              <p className="text-white font-semibold text-lg leading-tight">UCA Connect</p>
              <p className="text-white/60 text-xs">University for the Creative Arts</p>
            </div>
          </div>

          {/* Hero copy */}
          <div className="flex-1 flex flex-col justify-center">
            <h1 className="text-4xl font-bold text-white leading-tight mb-4">
              Where creative<br />
              students <span style={{ color: '#FF6B6B' }}>connect</span> &<br />
              collaborate.
            </h1>
            <p className="text-white/70 text-base leading-relaxed mb-10">
              Find teammates across Farnham, Epsom, Canterbury and Rochester. Build real projects. Graduate with a portfolio that speaks.
            </p>

            {/* Feature bullets */}
            <div className="flex flex-col gap-4">
              {[
                { icon: '🎨', label: 'Collaboration Finder', desc: 'Discover students by skill, course & campus' },
                { icon: '📋', label: 'Project Workspaces', desc: 'Kanban boards, chat & file sharing in one place' },
                { icon: '🎓', label: 'Tutor-Guided Projects', desc: 'Get mentorship from UCA tutors on live briefs' },
              ].map((f) => (
                <div key={`feature-${f.icon}`} className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                    style={{ background: 'rgba(255,255,255,0.12)' }}
                  >
                    {f.icon}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{f.label}</p>
                    <p className="text-white/60 text-xs mt-0.5">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Campus badges */}
          <div className="mt-10">
            <p className="text-white/50 text-xs mb-3 uppercase tracking-wider font-medium">UCA Campuses</p>
            <div className="flex flex-wrap gap-2">
              {['Farnham', 'Epsom', 'Canterbury', 'Rochester'].map((c) => (
                <span
                  key={`campus-${c}`}
                  className="px-3 py-1 rounded-full text-xs font-medium text-white"
                  style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col overflow-y-auto scrollbar-thin">
        <div className="flex-1 flex items-start justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-[480px]">
            {/* Mobile logo */}
            <div className="flex items-center gap-2 mb-8 lg:hidden">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: '#6C47FF' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="9" cy="9" r="5" stroke="white" strokeWidth="2" />
                  <circle cx="15" cy="15" r="5" stroke="#FF6B6B" strokeWidth="2" />
                </svg>
              </div>
              <span className="font-semibold text-base" style={{ color: '#1A1730' }}>UCA Connect</span>
            </div>

            {/* Tabs */}
            <div
              className="flex gap-1 p-1 rounded-xl mb-8"
              style={{ background: '#F0ECFF' }}
            >
              <button
                onClick={() => handleSwitchTab('login')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
                  activeTab === 'login' ?'bg-white text-[#6C47FF] shadow-sm' :'text-[#8B87A0] hover:text-[#4A4665]'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => handleSwitchTab('signup')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
                  activeTab === 'signup' ?'bg-white text-[#6C47FF] shadow-sm' :'text-[#8B87A0] hover:text-[#4A4665]'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Form */}
            <div className="animate-fade-in">
              {activeTab === 'login' ? (
                <LoginForm onSwitchToSignup={() => handleSwitchTab('signup')} />
              ) : (
                <SignupForm onSwitchToLogin={() => handleSwitchTab('login')} />
              )}
            </div>

            {/* Demo credentials */}
            <div className="mt-8">
              <CredentialsPanel activeTab={activeTab} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}