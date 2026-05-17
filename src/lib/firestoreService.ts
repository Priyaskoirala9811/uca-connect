/**
 * Firestore Service — UCA Connect
 * All shared data operations: users, projects, invites, messages, library requests.
 * Auth is handled separately by firebaseAuth.ts — do NOT touch auth here.
 */

import { collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where, orderBy, onSnapshot, serverTimestamp, Timestamp, type Unsubscribe,  } from 'firebase/firestore';
import { db } from './firebase';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FirestoreUser {
  uid: string;
  email: string;
  fullName: string;
  role: 'student' | 'teacher';
  campus: string;
  course: string;
  skills: string[];
  portfolioUrl: string;
  githubUrl: string;
  available: boolean;
  bio?: string;
  interests?: string[];
  yearOfStudy?: string;
  behanceUrl?: string;
  avatarColor?: string;
  verified?: boolean;
  createdAt?: Timestamp;
}

export interface FirestoreProject {
  id: string;
  title: string;
  description: string;
  type: 'coding' | 'presentation' | 'design' | 'general';
  ownerId: string;
  ownerName: string;
  members: string[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface FirestoreInvite {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  projectId: string;
  projectTitle: string;
  status: 'pending' | 'accepted' | 'declined';
  message?: string;
  createdAt?: Timestamp;
}

export interface FirestoreMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt?: Timestamp;
}

export interface FirestoreLibraryRequest {
  id?: string;
  studentName: string;
  email: string;
  campus: string;
  requestType: string;
  message: string;
  urgency: 'low' | 'normal' | 'high';
  status: 'pending';
  createdAt?: Timestamp;
}

// ── Users ─────────────────────────────────────────────────────────────────────

/** Fetch all users except the current user */
export async function getFirestoreUsers(currentUid: string): Promise<FirestoreUser[]> {
  try {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs
      .map((d) => ({ uid: d.id, ...d.data() } as FirestoreUser))
      .filter((u) => u.uid !== currentUid);
  } catch {
    return [];
  }
}

/** Get a single user by UID */
export async function getFirestoreUser(uid: string): Promise<FirestoreUser | null> {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    return { uid: snap.id, ...snap.data() } as FirestoreUser;
  } catch {
    return null;
  }
}

/** Update user profile fields */
export async function updateFirestoreUser(uid: string, updates: Partial<FirestoreUser>): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', uid), updates);
  } catch {
    throw new Error('Something went wrong. Please try again.');
  }
}

// ── Projects ──────────────────────────────────────────────────────────────────

/** Get all projects where user is owner or member */
export async function getFirestoreProjects(uid: string): Promise<FirestoreProject[]> {
  try {
    const snap = await getDocs(
      query(collection(db, 'projects'), where('members', 'array-contains', uid))
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreProject));
  } catch {
    return [];
  }
}

/** Create a new project */
export async function createFirestoreProject(data: {
  title: string;
  description: string;
  type: 'coding' | 'presentation' | 'design' | 'general';
  ownerId: string;
  ownerName: string;
}): Promise<FirestoreProject> {
  try {
    const ref = await addDoc(collection(db, 'projects'), {
      title: data.title,
      description: data.description,
      type: data.type,
      ownerId: data.ownerId,
      ownerName: data.ownerName,
      members: [data.ownerId],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return {
      id: ref.id,
      title: data.title,
      description: data.description,
      type: data.type,
      ownerId: data.ownerId,
      ownerName: data.ownerName,
      members: [data.ownerId],
    };
  } catch {
    throw new Error('Something went wrong. Please try again.');
  }
}

/** Add a member to a project */
export async function addMemberToFirestoreProject(projectId: string, userId: string): Promise<void> {
  try {
    const ref = doc(db, 'projects', projectId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const data = snap.data() as FirestoreProject;
    if (!data.members.includes(userId)) {
      await updateDoc(ref, {
        members: [...data.members, userId],
        updatedAt: serverTimestamp(),
      });
    }
  } catch {
    throw new Error('Something went wrong. Please try again.');
  }
}

// ── Invites ───────────────────────────────────────────────────────────────────

/** Send a project invite */
export async function sendFirestoreInvite(data: {
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  projectId: string;
  projectTitle: string;
  message?: string;
}): Promise<void> {
  try {
    await addDoc(collection(db, 'invites'), {
      ...data,
      status: 'pending',
      createdAt: serverTimestamp(),
    });
  } catch {
    throw new Error('Something went wrong. Please try again.');
  }
}

/** Get all pending invites for a user */
export async function getFirestoreInvites(toUserId: string): Promise<FirestoreInvite[]> {
  try {
    const snap = await getDocs(
      query(collection(db, 'invites'), where('toUserId', '==', toUserId))
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreInvite));
  } catch {
    return [];
  }
}

/** Subscribe to invites for a user (real-time) */
export function subscribeToInvites(
  toUserId: string,
  callback: (invites: FirestoreInvite[]) => void
): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'invites'), where('toUserId', '==', toUserId)),
    (snap) => {
      const invites = snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreInvite));
      callback(invites);
    },
    () => callback([])
  );
}

/** Accept or decline an invite */
export async function respondToFirestoreInvite(
  inviteId: string,
  status: 'accepted' | 'declined',
  projectId: string,
  userId: string
): Promise<void> {
  try {
    await updateDoc(doc(db, 'invites', inviteId), { status });
    if (status === 'accepted') {
      await addMemberToFirestoreProject(projectId, userId);
    }
  } catch {
    throw new Error('Something went wrong. Please try again.');
  }
}

// ── Messages ──────────────────────────────────────────────────────────────────

/** Subscribe to messages for a project (real-time) */
export function subscribeToMessages(
  projectId: string,
  callback: (messages: FirestoreMessage[]) => void
): Unsubscribe {
  return onSnapshot(
    query(
      collection(db, 'projects', projectId, 'messages'),
      orderBy('createdAt', 'asc')
    ),
    (snap) => {
      const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreMessage));
      callback(msgs);
    },
    () => callback([])
  );
}

/** Send a message to a project */
export async function sendFirestoreMessage(
  projectId: string,
  senderId: string,
  senderName: string,
  text: string
): Promise<void> {
  if (!text.trim()) throw new Error('Message cannot be empty.');
  try {
    await addDoc(collection(db, 'projects', projectId, 'messages'), {
      senderId,
      senderName,
      text: text.trim(),
      createdAt: serverTimestamp(),
    });
  } catch {
    throw new Error('Something went wrong. Please try again.');
  }
}

// ── Library Requests ──────────────────────────────────────────────────────────

/** Submit a library request */
export async function submitLibraryRequest(data: Omit<FirestoreLibraryRequest, 'id' | 'status' | 'createdAt'>): Promise<void> {
  try {
    await addDoc(collection(db, 'libraryRequests'), {
      ...data,
      status: 'pending',
      createdAt: serverTimestamp(),
    });
  } catch {
    throw new Error('Something went wrong. Please try again.');
  }
}
