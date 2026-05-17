/**
 * Firebase Authentication Service — UCA Connect
 *
 * Handles: signup, login, logout, email verification, resend verification,
 * UCA domain validation, role detection, and Firestore profile storage.
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

// ── UCA Domain Validation ─────────────────────────────────────────────────────

/**
 * Returns the role based on the email domain, or null if the domain is not allowed.
 * @students.uca.ac.uk → 'student' * @uca.ac.uk          →'teacher'  (staff / tutors)
 * anything else       → 'student' (TEMPORARY: domain restriction removed for testing)
 */
export function getUCARoleFromEmail(email: string): 'student' | 'teacher' | null {
  const cleaned = email.trim().toLowerCase();
  if (cleaned.endsWith('@students.uca.ac.uk')) return 'student';
  if (cleaned.endsWith('@uca.ac.uk')) return 'teacher';
  // TEMPORARY: allow any email for testing — default to 'student'
  return 'student';
}

// ── Sign Up ───────────────────────────────────────────────────────────────────

export interface SignupData {
  fullName: string;
  email: string;
  password: string;
  campus: string;
  course: string;
  skills: string[];
  portfolioUrl: string;
  githubUrl: string;
  available: boolean;
}

/**
 * SIGNUP ONLY — Creates a NEW Firebase Auth account using createUserWithEmailAndPassword.
 * Sends a verification email and stores the user profile in Firestore under users/{uid}.
 * This function must NEVER be called from the Sign In flow.
 *
 * Throws a user-friendly error string on failure.
 */
export async function firebaseSignup(data: SignupData): Promise<void> {
  const email = data.email.trim().toLowerCase();

  // TEMPORARY: UCA domain check disabled for testing email verification
  const role = getUCARoleFromEmail(email);

  // Create a NEW Firebase Auth account — uses accounts:signUp endpoint
  const credential = await createUserWithEmailAndPassword(auth, email, data.password);
  const user = credential.user;

  // Send verification email immediately — do NOT wait for anything else first
  await sendEmailVerification(user);

  // Store profile in Firestore: users/{uid}
  // Wrapped in try/catch so a Firestore failure does NOT block signup or cause endless loading
  try {
    await setDoc(doc(db, 'users', user.uid), {
      email,
      role,                          // 'student' or 'teacher'
      verified: false,
      fullName: data.fullName,
      campus: data.campus,
      course: data.course,
      skills: data.skills,
      portfolioUrl: data.portfolioUrl || '',
      githubUrl: data.githubUrl || '',
      available: data.available,
      createdAt: serverTimestamp(),  // Firestore server timestamp
    });
  } catch {
    // Firestore write failed — log silently, do not throw.
    // The Firebase Auth account and verification email were already sent successfully.
    console.warn('Firestore profile write failed after signup. Auth account was created successfully.');
  }

  // Sign the user out after signup so they must verify email before signing in
  await signOut(auth);
}

// ── Login ─────────────────────────────────────────────────────────────────────

/**
 * SIGN IN ONLY — Signs an EXISTING user in using signInWithEmailAndPassword.
 * This function must NEVER call createUserWithEmailAndPassword.
 * Blocks login if the email has not been verified yet.
 * Updates verified: true in Firestore on first verified login.
 *
 * Returns the Firebase User on success.
 * Throws a user-friendly error string on failure.
 */
export async function firebaseLogin(email: string, password: string): Promise<User> {
  const cleanEmail = email.trim().toLowerCase();

  // Sign in an EXISTING account — uses accounts:signInWithPassword endpoint
  const credential = await signInWithEmailAndPassword(auth, cleanEmail, password);
  const user = credential.user;

  // Block access until email is verified
  if (!user.emailVerified) {
    // Sign them back out so they cannot access the app
    await signOut(auth);
    throw new Error('Please verify your email before logging in.');
  }

  // Mark verified: true in Firestore (only updates, does not overwrite other fields)
  await updateDoc(doc(db, 'users', user.uid), { verified: true });

  return user;
}

// ── Logout ────────────────────────────────────────────────────────────────────

/** Signs the user out of Firebase Auth. */
export async function firebaseLogout(): Promise<void> {
  await signOut(auth);
}

// ── Resend Verification Email ─────────────────────────────────────────────────

/**
 * Resends the verification email to an unverified user.
 * Uses signInWithEmailAndPassword temporarily to get the user object.
 * Throws a user-friendly error string on failure.
 */
export async function resendVerificationEmail(email: string, password: string): Promise<void> {
  // Sign in temporarily to get the user object, then send verification
  const credential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
  const user = credential.user;

  if (user.emailVerified) {
    await signOut(auth);
    throw new Error('Your email is already verified. Please sign in normally.');
  }

  await sendEmailVerification(user);
  // Sign back out — they still need to verify before accessing the app
  await signOut(auth);
}

// ── Auth State Observer ───────────────────────────────────────────────────────

/** Subscribe to Firebase auth state changes. Returns the unsubscribe function. */
export function onFirebaseAuthStateChanged(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// ── Firebase Error → Human-Readable Message ───────────────────────────────────

/**
 * Converts Firebase Auth error codes into friendly messages.
 * Call this in catch blocks: getFriendlyFirebaseError(error)
 */
export function getFriendlyFirebaseError(error: unknown): string {
  const code = (error as { code?: string })?.code ?? '';
  const message = (error as { message?: string })?.message ?? 'Something went wrong. Please try again.';

  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Please sign in.';
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 8 characters with a number and uppercase letter.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-not-found': case'auth/wrong-password': case'auth/invalid-credential':
      return 'Invalid email or password. Please check your credentials.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    default:
      // Surface the custom messages we throw ourselves (domain check, verification block)
      if (message.startsWith('Please') || message.startsWith('Your email')) return message;
      return 'Something went wrong. Please try again.';
  }
}
