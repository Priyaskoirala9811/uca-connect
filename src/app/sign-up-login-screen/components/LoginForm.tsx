'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { firebaseLogin, resendVerificationEmail, getFriendlyFirebaseError } from '@/lib/firebaseAuth';
import { setCurrentUserId } from '@/lib/storage';

interface LoginValues {
  email: string;
  password: string;
  remember: boolean;
}

interface LoginFormProps {
  onSwitchToSignup: () => void;
}

export default function LoginForm({ onSwitchToSignup }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // Track whether to show the "Resend verification email" option
  const [showResend, setShowResend] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<LoginValues>({
    defaultValues: { email: '', password: '', remember: false },
  });

  const onSubmit = async (data: LoginValues) => {
    setIsLoading(true);
    setShowResend(false);
    setErrorMsg(null);

    try {
      // firebaseLogin uses signInWithEmailAndPassword — NEVER createUserWithEmailAndPassword
      const user = await firebaseLogin(data.email.trim().toLowerCase(), data.password);

      // Store Firebase UID as the current session identifier
      setCurrentUserId(user.uid);
      toast.success(`Welcome back!`);
      router.push('/project-workspace');
    } catch (err) {
      const msg = getFriendlyFirebaseError(err);
      setErrorMsg(msg);
      toast.error(msg);

      // Show resend option only when the error is the verification block
      if (msg === 'Please verify your email before logging in.') {
        setShowResend(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    const { email, password } = getValues();
    if (!email || !password) {
      toast.error('Please enter your email and password first.');
      return;
    }
    setIsResending(true);
    try {
      await resendVerificationEmail(email, password);
      toast.success('Verification email resent! Please check your inbox.');
    } catch (err) {
      toast.error(getFriendlyFirebaseError(err));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <form id="login-form" onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-bold mb-1" style={{ color: '#1A1730' }}>Welcome back</h2>
        <p className="text-sm" style={{ color: '#8B87A0' }}>Sign in to your UCA Connect account</p>
      </div>

      {/* Inline error message — always visible even if toast is not rendered */}
      {errorMsg && !showResend && (
        <div
          className="p-3 rounded-xl border text-sm"
          style={{ borderColor: '#EF4444', background: '#FEF2F2', color: '#B91C1C' }}
        >
          {errorMsg}
        </div>
      )}

      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" style={{ color: '#4A4665' }} htmlFor="login-email">
          Email Address
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          className={`input-field ${errors.email ? 'error' : ''}`}
          placeholder="your@uca.ac.uk"
          {...register('email', {
            required: 'Email is required',
            pattern: { value: /\S+@\S+\.\S+/, message: 'Enter a valid email address' },
          })}
        />
        {errors.email && (
          <p className="text-xs mt-0.5" style={{ color: '#EF4444' }}>{errors.email.message}</p>
        )}
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium" style={{ color: '#4A4665' }} htmlFor="login-password">
            Password
          </label>
        </div>
        <div className="relative">
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            className={`input-field pr-11 ${errors.password ? 'error' : ''}`}
            placeholder="Enter your password"
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 6, message: 'Password must be at least 6 characters' },
            })}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-colors hover:bg-gray-100"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
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
        {errors.password && (
          <p className="text-xs mt-0.5" style={{ color: '#EF4444' }}>{errors.password.message}</p>
        )}
      </div>

      {/* Remember me */}
      <div className="flex items-center gap-2">
        <input id="remember" type="checkbox" className="filter-checkbox" {...register('remember')} />
        <label htmlFor="remember" className="text-sm cursor-pointer" style={{ color: '#4A4665' }}>
          Keep me signed in
        </label>
      </div>

      {/* Resend verification email — shown only when login is blocked due to unverified email */}
      {showResend && (
        <div
          className="flex flex-col gap-2 p-3 rounded-xl border text-sm"
          style={{ borderColor: '#F59E0B', background: '#FFFBEB' }}
        >
          <p style={{ color: '#92400E' }}>
            Your email is not yet verified. Please check your inbox and click the verification link.
          </p>
          <button
            type="button"
            onClick={handleResendVerification}
            disabled={isResending}
            className="self-start text-xs font-semibold underline"
            style={{ color: '#D97706' }}
          >
            {isResending ? 'Sending…' : 'Resend verification email'}
          </button>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="btn-primary w-full py-3 text-base font-semibold"
        style={{ background: isLoading ? '#9B87FF' : '#6C47FF' }}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            Signing in…
          </span>
        ) : (
          'Sign In to UCA Connect'
        )}
      </button>

      <p className="text-center text-sm" style={{ color: '#8B87A0' }}>
        Don&apos;t have an account?{' '}
        <button type="button" onClick={onSwitchToSignup} className="font-semibold" style={{ color: '#6C47FF' }}>
          Create one free
        </button>
      </p>
    </form>
  );
}