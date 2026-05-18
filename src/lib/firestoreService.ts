/**
 * Firestore Service — UCA Connect
 * All shared data operations: users, projects, invites, messages, library requests.
 * Auth is handled separately by firebaseAuth.ts — do NOT touch auth here.
 */

import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot, serverTimestamp, Timestamp, type Unsubscribe } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';

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
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  edited?: boolean;
}

export interface FirestoreTask {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: 'todo' | 'inprogress' | 'done';
  priority: 'high' | 'medium' | 'low';
  assigneeId: string;
  dueDate: string;
  tags: string[];
  createdBy: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface FirestoreResourceFile {
  id: string;
  projectId: string;
  name: string;
  url: string;
  type: 'pdf' | 'image' | 'document' | 'link' | 'other';
  mimeType?: string;
  size?: string;
  uploadedById: string;
  uploadedByName: string;
  uploadedAt?: Timestamp;
}


export interface FirestoreNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'invite' | 'direct-message' | 'group-message' | 'task' | 'file' | 'project';
  link?: string;
  read?: boolean;
  fromUserId?: string;
  fromUserName?: string;
  projectId?: string;
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


// ── Notifications ────────────────────────────────────────────────────────────

export async function createFirestoreNotification(data: Omit<FirestoreNotification, 'id' | 'createdAt' | 'read'>): Promise<void> {
  try {
    await addDoc(collection(db, 'notifications'), {
      ...data,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch {
    // Do not block the main app action if notification creation fails.
  }
}

export function subscribeToNotifications(
  userId: string,
  callback: (notifications: FirestoreNotification[]) => void
): Unsubscribe {
  return onSnapshot(
    query(
      collection(db, 'notifications'),
      where('userId', '==', userId)
    ),
    (snap) => {
      const notifications = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as FirestoreNotification))
        .sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        });
      callback(notifications);
    },
    () => callback([])
  );
}

export async function markFirestoreNotificationRead(notificationId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), { read: true });
  } catch {
    // ignore
  }
}

async function notifyProjectMembers(data: {
  projectId: string;
  fromUserId: string;
  fromUserName: string;
  title: string;
  body: string;
  type: FirestoreNotification['type'];
  link?: string;
}): Promise<void> {
  try {
    const snap = await getDoc(doc(db, 'projects', data.projectId));
    if (!snap.exists()) return;
    const project = snap.data() as FirestoreProject;
    const receivers = (project.members || []).filter((uid) => uid !== data.fromUserId);

    await Promise.all(
      receivers.map((uid) =>
        createFirestoreNotification({
          userId: uid,
          title: data.title,
          body: data.body,
          type: data.type,
          link: data.link || '/project-workspace',
          fromUserId: data.fromUserId,
          fromUserName: data.fromUserName,
          projectId: data.projectId,
        })
      )
    );
  } catch {
    // ignore
  }
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

    await createFirestoreNotification({
      userId: data.toUserId,
      title: `Project invite from ${data.fromUserName}`,
      body: `You were invited to join ${data.projectTitle}.`,
      type: 'invite',
      link: '/profile',
      fromUserId: data.fromUserId,
      fromUserName: data.fromUserName,
      projectId: data.projectId,
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

    await notifyProjectMembers({
      projectId,
      fromUserId: senderId,
      fromUserName: senderName,
      title: `New group message from ${senderName}`,
      body: text.trim().length > 90 ? `${text.trim().slice(0, 90)}...` : text.trim(),
      type: 'group-message',
      link: '/project-workspace',
    });
  } catch {
    throw new Error('Something went wrong. Please try again.');
  }
}



// ── Shared Tasks ──────────────────────────────────────────────────────────────

/** Subscribe to project tasks in real time so every project member sees updates. */
export function subscribeToProjectTasks(
  projectId: string,
  callback: (tasks: FirestoreTask[]) => void
): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'projects', projectId, 'tasks'), orderBy('createdAt', 'asc')),
    (snap) => {
      const tasks = snap.docs.map((d) => ({ id: d.id, projectId, ...d.data() } as FirestoreTask));
      callback(tasks);
    },
    () => callback([])
  );
}

/** Add task into the shared project task collection. */
export async function addFirestoreTask(
  projectId: string,
  task: Omit<FirestoreTask, 'id' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  try {
    await addDoc(collection(db, 'projects', projectId, 'tasks'), {
      ...task,
      projectId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await updateDoc(doc(db, 'projects', projectId), { updatedAt: serverTimestamp() });

    await notifyProjectMembers({
      projectId,
      fromUserId: task.createdBy,
      fromUserName: 'A team member',
      title: 'New task added',
      body: task.title,
      type: 'task',
      link: '/project-workspace',
    });
  } catch {
    throw new Error('Task could not be saved. Please try again.');
  }
}

/** Update task status/details in Firestore. */
export async function updateFirestoreTask(
  projectId: string,
  taskId: string,
  updates: Partial<FirestoreTask>
): Promise<void> {
  try {
    await updateDoc(doc(db, 'projects', projectId, 'tasks', taskId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    await updateDoc(doc(db, 'projects', projectId), { updatedAt: serverTimestamp() });
  } catch {
    throw new Error('Task could not be updated. Please try again.');
  }
}

// ── Shared Resource Files ─────────────────────────────────────────────────────

function getResourceType(file: File): FirestoreResourceFile['type'] {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type === 'application/pdf') return 'pdf';
  if (
    file.type.includes('word') ||
    file.type.includes('document') ||
    file.name.endsWith('.doc') ||
    file.name.endsWith('.docx') ||
    file.name.endsWith('.ppt') ||
    file.name.endsWith('.pptx')
  ) return 'document';
  return 'other';
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function withUploadTimeout<T>(promise: Promise<T>, seconds = 30): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error('Upload is taking too long. Please check Firebase Storage is enabled and your Storage rules allow logged-in users to upload.'));
    }, seconds * 1000);

    promise
      .then((result) => {
        window.clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        window.clearTimeout(timer);
        reject(error);
      });
  });
}

function getUploadErrorMessage(error: unknown): string {
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code?: string }).code) : '';
  if (code.includes('storage/unauthorized')) {
    return 'Upload blocked by Firebase Storage rules. Please allow authenticated users to upload in Firebase Storage rules.';
  }
  if (code.includes('storage/quota-exceeded')) {
    return 'Firebase Storage quota is full. Please check your Firebase plan/storage usage.';
  }
  if (error instanceof Error && error.message) return error.message;
  return 'File could not be uploaded. Please try again.';
}

/** Upload PDF/image/document to Firebase Storage and save it in project resources. */
export async function uploadProjectResourceFile(data: {
  projectId: string;
  file: File;
  uploadedById: string;
  uploadedByName: string;
}): Promise<void> {
  try {
    const safeName = data.file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `projects/${data.projectId}/resources/${Date.now()}-${safeName}`;
    const fileRef = ref(storage, filePath);
    await withUploadTimeout(uploadBytes(fileRef, data.file));
    const url = await getDownloadURL(fileRef);

    await addDoc(collection(db, 'projects', data.projectId, 'files'), {
      projectId: data.projectId,
      name: data.file.name,
      url,
      type: getResourceType(data.file),
      mimeType: data.file.type,
      size: formatFileSize(data.file.size),
      uploadedById: data.uploadedById,
      uploadedByName: data.uploadedByName,
      uploadedAt: serverTimestamp(),
    });

    await updateDoc(doc(db, 'projects', data.projectId), { updatedAt: serverTimestamp() });

    await notifyProjectMembers({
      projectId: data.projectId,
      fromUserId: data.uploadedById,
      fromUserName: data.uploadedByName,
      title: `${data.uploadedByName} uploaded a file`,
      body: data.file.name,
      type: 'file',
      link: '/project-workspace',
    });
  } catch (error) {
    throw new Error(getUploadErrorMessage(error));
  }
}

export async function deleteProjectResourceFile(projectId: string, fileId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'projects', projectId, 'files', fileId));
    await updateDoc(doc(db, 'projects', projectId), { updatedAt: serverTimestamp() });
  } catch {
    throw new Error('File could not be deleted. Please try again.');
  }
}

/** Subscribe to project resource files in real time. */
export function subscribeToProjectFiles(
  projectId: string,
  callback: (files: FirestoreResourceFile[]) => void
): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'projects', projectId, 'files'), orderBy('uploadedAt', 'desc')),
    (snap) => {
      const files = snap.docs.map((d) => ({ id: d.id, projectId, ...d.data() } as FirestoreResourceFile));
      callback(files);
    },
    () => callback([])
  );
}

/** Send a chat message with an optional uploaded file attachment. */
export async function sendFirestoreMessageWithOptionalFile(data: {
  projectId: string;
  senderId: string;
  senderName: string;
  text: string;
  file?: File | null;
}): Promise<void> {
  const cleanText = data.text.trim();
  if (!cleanText && !data.file) throw new Error('Message cannot be empty.');

  try {
    let fileUrl = '';
    let fileName = '';
    let fileType = '';

    if (data.file) {
      const safeName = data.file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `projects/${data.projectId}/chat/${Date.now()}-${safeName}`;
      const fileRef = ref(storage, filePath);
      await withUploadTimeout(uploadBytes(fileRef, data.file));
      fileUrl = await getDownloadURL(fileRef);
      fileName = data.file.name;
      fileType = data.file.type || 'file';
    }

    await addDoc(collection(db, 'projects', data.projectId, 'messages'), {
      senderId: data.senderId,
      senderName: data.senderName,
      text: cleanText,
      ...(fileUrl ? { fileUrl, fileName, fileType } : {}),
      createdAt: serverTimestamp(),
    });

    await notifyProjectMembers({
      projectId: data.projectId,
      fromUserId: data.senderId,
      fromUserName: data.senderName,
      title: `New group message from ${data.senderName}`,
      body: fileName ? `Sent a file: ${fileName}` : (cleanText.length > 90 ? `${cleanText.slice(0, 90)}...` : cleanText),
      type: 'group-message',
      link: '/project-workspace',
    });
  } catch (error) {
    throw new Error(getUploadErrorMessage(error));
  }
}

export async function updateFirestoreMessage(
  projectId: string,
  messageId: string,
  text: string
): Promise<void> {
  const cleanText = text.trim();
  if (!cleanText) throw new Error('Message cannot be empty.');
  try {
    await updateDoc(doc(db, 'projects', projectId, 'messages', messageId), {
      text: cleanText,
      edited: true,
      updatedAt: serverTimestamp(),
    });
    await updateDoc(doc(db, 'projects', projectId), { updatedAt: serverTimestamp() });
  } catch {
    throw new Error('Message could not be edited. Please try again.');
  }
}

export async function deleteFirestoreMessage(projectId: string, messageId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'projects', projectId, 'messages', messageId));
    await updateDoc(doc(db, 'projects', projectId), { updatedAt: serverTimestamp() });
  } catch {
    throw new Error('Message could not be deleted. Please try again.');
  }
}

export async function deleteFirestoreTask(projectId: string, taskId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'projects', projectId, 'tasks', taskId));
    await updateDoc(doc(db, 'projects', projectId), { updatedAt: serverTimestamp() });
  } catch {
    throw new Error('Task could not be deleted. Please try again.');
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
