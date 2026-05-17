'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { firebaseSignup, getUCARoleFromEmail, getFriendlyFirebaseError } from '@/lib/firebaseAuth';

interface SignupValues {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'student' | 'tutor';
  campus: string;
  course: string;
  portfolioUrl: string;
  githubUrl: string;
  available: boolean;
  terms: boolean;
}

const COURSES = [
  'Animation', 'Architecture', 'Creative Computing', 'Fashion Design',
  'Film & TV Production', 'Fine Art', 'Games Design', 'Graphic Design',
  'Illustration', 'Interior Design', 'Music', 'Photography',
  'Product Design', 'UI/UX Design',
];

const SKILLS = [
  'Animation', 'After Effects', 'Blender', 'C++', 'Character Design',
  'Cinema 4D', 'Creative Writing', 'CSS', 'Figma', 'Film Editing',
  'Game Development', 'Graphic Design', 'HTML', 'Illustration',
  'JavaScript', 'Motion Graphics', 'Photography', 'Premiere Pro',
  'Python', 'React', 'Storyboarding', 'Three.js', 'TypeScript',
  'UI/UX Design', 'Unity', 'Unreal Engine', 'Video Production',
  'WebGL', 'XR/AR/VR',
];

interface SignupFormProps {
  onSwitchToLogin: () => void;
}

export default function SignupForm({ onSwitchToLogin }: SignupFormProps) {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors },
  } = useForm<SignupValues>({
    defaultValues: { role: 'student', campus: 'Farnham', available: true },
  });

  const password = watch('password');

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleNextStep = async () => {
    const fieldsToValidate: (keyof SignupValues)[] =
      step === 1 ? ['fullName', 'email', 'password', 'confirmPassword'] : ['campus', 'course'];
    const valid = await trigger(fieldsToValidate);
    if (valid) setStep((s) => s + 1);
  };

  const onSubmit = async (data: SignupValues) => {
    if (!data.terms) {
      toast.error('Please accept the Terms of Service to continue');
      return;
    }

    // Validate UCA email domain before calling Firebase
    const email = data.email.trim().toLowerCase();
    const role = getUCARoleFromEmail(email);
    // TEMPORARY: domain restriction removed for testing — any email is accepted

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await firebaseSignup({
        fullName: data.fullName,
        email,
        password: data.password,
        campus: data.campus,
        course: data.course,
        skills: selectedSkills,
        portfolioUrl: data.portfolioUrl || '',
        githubUrl: data.githubUrl || '',
        available: data.available,
      });

      const msg = 'Verification email sent. Please check your inbox and verify your email before signing in.';
      setSuccessMsg(msg);
      toast.success(msg);
      // Do NOT auto-redirect — user must verify email then manually sign in
    } catch (err) {
      const msg = getFriendlyFirebaseError(err);
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const stepLabels = ['Account', 'Profile', 'Skills'];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-bold mb-1" style={{ color: '#1A1730' }}>Create your account</h2>
        <p className="text-sm" style={{ color: '#8B87A0' }}>Join UCA creatives collaborating across campuses</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {stepLabels.map((label, i) => {
          const stepNum = i + 1;
          const isCompleted = step > stepNum;
          const isCurrent = step === stepNum;
          return (
            <React.Fragment key={`step-${stepNum}`}>
              <div className="flex items-center gap-1.5">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200"
                  style={{
                    background: isCompleted ? '#22C55E' : isCurrent ? '#6C47FF' : '#E8E6F0',
                    color: isCompleted || isCurrent ? 'white' : '#8B87A0',
                  }}
                >
                  {isCompleted ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  ) : stepNum}
                </div>
                <span className="text-xs font-medium hidden sm:block" style={{ color: isCurrent ? '#6C47FF' : '#8B87A0' }}>
                  {label}
                </span>
              </div>
              {i < stepLabels.length - 1 && (
                <div
                  className="flex-1 h-0.5 rounded-full transition-all duration-300"
                  style={{ background: step > stepNum ? '#22C55E' : '#E8E6F0' }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Step 1: Account details */}
        {step === 1 && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: '#4A4665' }} htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                type="text"
                className={`input-field ${errors.fullName ? 'error' : ''}`}
                placeholder="e.g. Priya Krishnan"
                {...register('fullName', { required: 'Full name is required', minLength: { value: 2, message: 'Name too short' } })}
              />
              {errors.fullName && <p className="text-xs" style={{ color: '#EF4444' }}>{errors.fullName.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: '#4A4665' }} htmlFor="signup-email">Email Address</label>
              <input
                id="signup-email"
                type="email"
                className={`input-field ${errors.email ? 'error' : ''}`}
                placeholder="your@email.com"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /\S+@\S+\.\S+/, message: 'Enter a valid email' },
                })}
              />
              {errors.email && <p className="text-xs" style={{ color: '#EF4444' }}>{errors.email.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: '#4A4665' }} htmlFor="signup-password">Password</label>
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  className={`input-field pr-11 ${errors.password ? 'error' : ''}`}
                  placeholder="At least 8 characters"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Password must be at least 8 characters' },
                    pattern: { value: /(?=.*[A-Z])(?=.*[0-9])/, message: 'Include at least one uppercase letter and one number' },
                  })}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded">
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B87A0" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B87A0" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="text-xs" style={{ color: '#EF4444' }}>{errors.password.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: '#4A4665' }} htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                className={`input-field ${errors.confirmPassword ? 'error' : ''}`}
                placeholder="Repeat your password"
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (v) => v === password || 'Passwords do not match',
                })}
              />
              {errors.confirmPassword && <p className="text-xs" style={{ color: '#EF4444' }}>{errors.confirmPassword.message}</p>}
            </div>

            <button type="button" onClick={handleNextStep} className="btn-primary w-full py-3 text-base font-semibold mt-2">
              Continue to Profile
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        {/* Step 2: Profile details */}
        {step === 2 && (
          <div className="flex flex-col gap-4 animate-fade-in">
            {/* Role selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: '#4A4665' }}>I am a…</label>
              <div className="flex gap-3">
                {(['student', 'tutor'] as const).map((r) => (
                  <label
                    key={`role-${r}`}
                    className="flex-1 flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all duration-150"
                    style={{
                      borderColor: watch('role') === r ? '#6C47FF' : '#E8E6F0',
                      background: watch('role') === r ? '#F0ECFF' : 'white',
                    }}
                  >
                    <input type="radio" value={r} className="sr-only" {...register('role')} />
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: watch('role') === r ? '#6C47FF' : '#F8F7FF' }}>
                      {r === 'student' ? '🎓' : '👩‍🏫'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold capitalize" style={{ color: '#1A1730' }}>{r}</p>
                      <p className="text-xs" style={{ color: '#8B87A0' }}>{r === 'student' ? 'Looking to collaborate' : 'Guiding projects'}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Campus */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: '#4A4665' }} htmlFor="campus">Campus</label>
              <select id="campus" className="input-field" {...register('campus', { required: true })}>
                {['Farnham', 'Epsom', 'Canterbury', 'Rochester'].map((c) => (
                  <option key={`campus-opt-${c}`} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Course */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: '#4A4665' }} htmlFor="course">Course / Subject Area</label>
              <select id="course" className={`input-field ${errors.course ? 'error' : ''}`} {...register('course', { required: 'Please select your course' })}>
                <option value="">Select your course…</option>
                {COURSES.map((c) => (
                  <option key={`course-opt-${c}`} value={c}>{c}</option>
                ))}
              </select>
              {errors.course && <p className="text-xs" style={{ color: '#EF4444' }}>{errors.course.message}</p>}
            </div>

            {/* Portfolio */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: '#4A4665' }} htmlFor="portfolioUrl">
                Portfolio / Behance URL <span className="ml-1 text-xs font-normal" style={{ color: '#8B87A0' }}>(optional)</span>
              </label>
              <input id="portfolioUrl" type="url" className="input-field" placeholder="https://behance.net/yourname" {...register('portfolioUrl')} />
            </div>

            {/* GitHub */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: '#4A4665' }} htmlFor="githubUrl">
                GitHub Profile URL <span className="ml-1 text-xs font-normal" style={{ color: '#8B87A0' }}>(optional)</span>
              </label>
              <input id="githubUrl" type="url" className="input-field" placeholder="https://github.com/yourhandle" {...register('githubUrl')} />
            </div>

            <div className="flex gap-3 mt-2">
              <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1 py-2.5">Back</button>
              <button type="button" onClick={handleNextStep} className="btn-primary flex-1 py-2.5 font-semibold">Add Skills</button>
            </div>
          </div>
        )}

        {/* Step 3: Skills */}
        {step === 3 && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: '#4A4665' }}>
                Select your skills
                <span className="ml-2 text-xs font-normal" style={{ color: '#8B87A0' }}>({selectedSkills.length} selected)</span>
              </p>
              <p className="text-xs" style={{ color: '#8B87A0' }}>These help other students find you for the right projects</p>
            </div>

            <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto scrollbar-thin p-1">
              {SKILLS.map((skill) => (
                <button
                  key={`skill-opt-${skill}`}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  className={`skill-chip ${selectedSkills.includes(skill) ? 'selected' : ''}`}
                >
                  {selectedSkills.includes(skill) && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                  {skill}
                </button>
              ))}
            </div>

            {/* Availability */}
            <div className="flex items-center justify-between p-4 rounded-xl border" style={{ borderColor: '#E8E6F0', background: '#FAFAF8' }}>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#1A1730' }}>Available for collaboration</p>
                <p className="text-xs mt-0.5" style={{ color: '#8B87A0' }}>Show as available in the Collaboration Finder</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked {...register('available')} />
                <div
                  className="w-11 h-6 rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"
                  style={{ background: watch('available') !== false ? '#6C47FF' : '#D1D5DB' }}
                />
              </label>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2.5">
              <input id="terms" type="checkbox" className="filter-checkbox mt-0.5" {...register('terms', { required: true })} />
              <label htmlFor="terms" className="text-xs leading-relaxed cursor-pointer" style={{ color: '#4A4665' }}>
                I agree to the <span className="font-semibold" style={{ color: '#6C47FF' }}>Terms of Service</span> and{' '}
                <span className="font-semibold" style={{ color: '#6C47FF' }}>Privacy Policy</span>.
              </label>
            </div>
            {errors.terms && <p className="text-xs -mt-2" style={{ color: '#EF4444' }}>You must accept the terms to continue</p>}

            {/* Inline error message — always visible even if toast is not rendered */}
            {errorMsg && (
              <div
                className="p-3 rounded-xl border text-sm"
                style={{ borderColor: '#EF4444', background: '#FEF2F2', color: '#B91C1C' }}
              >
                {errorMsg}
              </div>
            )}

            {/* Inline success message */}
            {successMsg && (
              <div
                className="p-3 rounded-xl border text-sm"
                style={{ borderColor: '#22C55E', background: '#F0FDF4', color: '#15803D' }}
              >
                {successMsg}
              </div>
            )}

            <div className="flex gap-3 mt-2">
              <button type="button" onClick={() => setStep(2)} className="btn-secondary flex-1 py-2.5">Back</button>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary flex-1 py-2.5 font-semibold"
                style={{ background: isLoading ? '#9B87FF' : '#6C47FF' }}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Creating account…
                  </span>
                ) : 'Join UCA Connect 🎨'}
              </button>
            </div>
          </div>
        )}
      </form>

      {step === 1 && (
        <p className="text-center text-sm" style={{ color: '#8B87A0' }}>
          Already have an account?{' '}
          <button type="button" onClick={onSwitchToLogin} className="font-semibold" style={{ color: '#6C47FF' }}>Sign in</button>
        </p>
      )}
    </div>
  );
}