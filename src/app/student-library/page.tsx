'use client';

import React, { useState } from 'react';
import { Toaster, toast } from 'sonner';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { submitLibraryRequest } from '@/lib/firestoreService';
import AppLayout from '@/components/AppLayout';
import { useEffect } from 'react';

const REQUEST_TYPES = [
  { value: 'Book request', emoji: '📚' },
  { value: 'Study room help', emoji: '🏫' },
  { value: 'Research support', emoji: '🔬' },
  { value: 'Printing help', emoji: '🖨️' },
  { value: 'Library access issue', emoji: '🔑' },
  { value: 'Other', emoji: '💬' },
];

const CAMPUSES = ['Farnham', 'Epsom', 'Canterbury', 'Rochester'];

interface FormState {
  studentName: string;
  email: string;
  campus: string;
  requestType: string;
  message: string;
  urgency: 'low' | 'normal' | 'high';
}

export default function StudentLibraryPage() {
  const [form, setForm] = useState<FormState>({
    studentName: '',
    email: '',
    campus: '',
    requestType: '',
    message: '',
    urgency: 'normal',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<FormState>>({});

  // Pre-fill from Firebase auth if logged in
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user?.email) {
        setForm((prev) => ({ ...prev, email: user.email || '' }));
      }
    });
    return () => unsub();
  }, []);

  const validate = (): boolean => {
    const newErrors: Partial<FormState> = {};
    if (!form.studentName.trim()) newErrors.studentName = 'Name is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    if (!form.campus) newErrors.campus = 'Please select a campus';
    if (!form.requestType) newErrors.requestType = 'Please select a request type';
    if (!form.message.trim() || form.message.trim().length < 10) newErrors.message = 'Please describe your request (at least 10 characters)';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await submitLibraryRequest({
        studentName: form.studentName.trim(),
        email: form.email.trim(),
        campus: form.campus,
        requestType: form.requestType,
        message: form.message.trim(),
        urgency: form.urgency,
      });
      setSubmitted(true);
      toast.success('Request submitted.');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm({ studentName: '', email: '', campus: '', requestType: '', message: '', urgency: 'normal' });
    setErrors({});
    setSubmitted(false);
  };

  return (
    <AppLayout currentPath="/student-library">
      <Toaster position="bottom-right" richColors />
      <div className="p-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: '#F0ECFF' }}>
              📚
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#1A1730' }}>Student Library</h1>
              <p className="text-sm" style={{ color: '#8B87A0' }}>Request support or resources from library administration</p>
            </div>
          </div>
        </div>

        {submitted ? (
          <div className="card p-10 flex flex-col items-center text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: '#F0FDF4' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: '#1A1730' }}>Request Submitted!</h2>
            <p className="text-sm mb-1" style={{ color: '#4A4665' }}>
              Your library request has been sent to the administration team.
            </p>
            <p className="text-sm mb-6" style={{ color: '#8B87A0' }}>
              They will review your request and get back to you at <strong>{form.email}</strong>.
            </p>
            <div className="p-4 rounded-xl w-full mb-6 text-left" style={{ background: '#F8F7FF', border: '1px solid #E8E6F0' }}>
              <p className="text-xs font-semibold mb-2" style={{ color: '#6C47FF' }}>Request Summary</p>
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span style={{ color: '#8B87A0' }}>Type</span>
                  <span className="font-medium" style={{ color: '#1A1730' }}>{form.requestType}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: '#8B87A0' }}>Campus</span>
                  <span className="font-medium" style={{ color: '#1A1730' }}>{form.campus}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: '#8B87A0' }}>Urgency</span>
                  <span className="font-medium capitalize" style={{ color: '#1A1730' }}>{form.urgency}</span>
                </div>
              </div>
            </div>
            <button onClick={handleReset} className="btn-primary py-2.5 px-8">
              Submit Another Request
            </button>
          </div>
        ) : (
          <div className="card p-6">
            <h2 className="text-base font-bold mb-1" style={{ color: '#1A1730' }}>Library Request Form</h2>
            <p className="text-sm mb-6" style={{ color: '#8B87A0' }}>Fill in the details below and we&apos;ll get back to you as soon as possible.</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Student Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" style={{ color: '#4A4665' }}>
                  Student Name <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  className="input-field"
                  placeholder="Your full name"
                  value={form.studentName}
                  onChange={(e) => setForm({ ...form, studentName: e.target.value })}
                />
                {errors.studentName && <p className="text-xs" style={{ color: '#EF4444' }}>{errors.studentName}</p>}
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" style={{ color: '#4A4665' }}>
                  Email Address <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  className="input-field"
                  type="email"
                  placeholder="your.email@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                {errors.email && <p className="text-xs" style={{ color: '#EF4444' }}>{errors.email}</p>}
              </div>

              {/* Campus */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" style={{ color: '#4A4665' }}>
                  Campus <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <select
                  className="input-field"
                  value={form.campus}
                  onChange={(e) => setForm({ ...form, campus: e.target.value })}
                >
                  <option value="">Select your campus…</option>
                  {CAMPUSES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.campus && <p className="text-xs" style={{ color: '#EF4444' }}>{errors.campus}</p>}
              </div>

              {/* Request Type */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" style={{ color: '#4A4665' }}>
                  Request Type <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {REQUEST_TYPES.map((rt) => (
                    <label
                      key={rt.value}
                      className="flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all"
                      style={{
                        borderColor: form.requestType === rt.value ? '#6C47FF' : '#E8E6F0',
                        background: form.requestType === rt.value ? '#F0ECFF' : 'white',
                      }}
                    >
                      <input
                        type="radio"
                        name="requestType"
                        value={rt.value}
                        checked={form.requestType === rt.value}
                        onChange={() => setForm({ ...form, requestType: rt.value })}
                        className="sr-only"
                      />
                      <span className="text-base">{rt.emoji}</span>
                      <span className="text-xs font-medium" style={{ color: form.requestType === rt.value ? '#6C47FF' : '#1A1730' }}>
                        {rt.value}
                      </span>
                    </label>
                  ))}
                </div>
                {errors.requestType && <p className="text-xs" style={{ color: '#EF4444' }}>{errors.requestType}</p>}
              </div>

              {/* Urgency */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" style={{ color: '#4A4665' }}>Urgency</label>
                <div className="flex gap-2">
                  {(['low', 'normal', 'high'] as const).map((level) => {
                    const colors = {
                      low: { active: '#F0FDF4', text: '#16A34A', border: '#16A34A' },
                      normal: { active: '#F0ECFF', text: '#6C47FF', border: '#6C47FF' },
                      high: { active: '#FEF2F2', text: '#EF4444', border: '#EF4444' },
                    };
                    const isActive = form.urgency === level;
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setForm({ ...form, urgency: level })}
                        className="flex-1 py-2 rounded-xl text-xs font-semibold border capitalize transition-all"
                        style={{
                          borderColor: isActive ? colors[level].border : '#E8E6F0',
                          background: isActive ? colors[level].active : 'white',
                          color: isActive ? colors[level].text : '#8B87A0',
                        }}
                      >
                        {level === 'low' ? '🟢' : level === 'normal' ? '🟡' : '🔴'} {level}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Message */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" style={{ color: '#4A4665' }}>
                  Message / Details <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <textarea
                  className="input-field resize-none"
                  rows={4}
                  placeholder="Please describe what you need in detail…"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                />
                {errors.message && <p className="text-xs" style={{ color: '#EF4444' }}>{errors.message}</p>}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary py-3 text-sm font-semibold"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting…
                  </span>
                ) : 'Submit Request'}
              </button>
            </form>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
