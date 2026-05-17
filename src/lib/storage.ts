/**
 * UCA Connect - localStorage utility
 * All app data is stored here and persists across refresh and sign out/sign in.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StoredUser {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string; // simple base64 for demo; not real crypto
  role: 'student' | 'tutor';
  campus: string;
  course: string;
  skills: string[];
  interests: string[];
  bio: string;
  portfolioUrl: string;
  githubUrl: string;
  behanceUrl: string;
  available: boolean;
  avatarColor: string;
  yearOfStudy: string;
  createdAt: string;
}

export type ProjectType = 'coding' | 'presentation' | 'design' | 'general';

export interface StoredProject {
  id: string;
  title: string;
  description: string;
  type: ProjectType;
  status: 'active' | 'completed' | 'archived';
  tags: string[];
  createdAt: string;
  ownerId: string;
  memberIds: string[];
}

export interface StoredTask {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: 'todo' | 'inprogress' | 'done';
  priority: 'high' | 'medium' | 'low';
  assigneeId: string;
  dueDate: string;
  tags: string[];
  createdAt: string;
}

export interface StoredMessage {
  id: string;
  projectId: string;
  senderId: string;
  content: string;
  timestamp: string;
}

export interface StoredFile {
  id: string;
  projectId: string;
  name: string;
  type: 'pdf' | 'figma' | 'github' | 'slides' | 'video' | 'link';
  url: string;
  uploadedById: string;
  uploadedAt: string;
  size?: string;
}

export interface StoredIdea {
  id: string;
  projectId: string;
  authorId: string;
  content: string;
  createdAt: string;
}

export interface StoredInvitation {
  id: string;
  projectId: string;
  projectTitle: string;
  projectType: ProjectType;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  message: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export interface StoredNotification {
  id: string;
  userId: string;
  type: 'invitation';
  invitationId: string;
  read: boolean;
  createdAt: string;
}

// Code workspace types
export interface CodeFile {
  id: string;
  projectId: string;
  filename: string;
  language: string;
  content: string;
  lastEdited: string;
}

// Presentation workspace types
export interface Slide {
  id: string;
  title: string;
  body: string;
  notes: string;
  order: number;
}

export interface StoredPresentation {
  projectId: string;
  slides: Slide[];
  externalLink: string;
  lastEdited: string;
}

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const KEYS = {
  USERS: 'uca_users',
  CURRENT_USER_ID: 'uca_current_user_id',
  PROJECTS: 'uca_projects',
  TASKS: 'uca_tasks',
  MESSAGES: 'uca_messages',
  FILES: 'uca_files',
  IDEAS: 'uca_ideas',
  INVITATIONS: 'uca_invitations',
  NOTIFICATIONS: 'uca_notifications',
  CODE_FILES: 'uca_code_files',
  PRESENTATIONS: 'uca_presentations',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function load<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

/** Simple encode so passwords aren't plain text in localStorage */
function encodePassword(pw: string): string {
  return btoa(unescape(encodeURIComponent(pw)));
}

function checkPassword(pw: string, hash: string): boolean {
  return encodePassword(pw) === hash;
}

/** Generate a random avatar colour from a preset palette */
const AVATAR_COLORS = [
  '#6C47FF', '#FF6B6B', '#F59E0B', '#22C55E',
  '#0EA5E9', '#EC4899', '#8B5CF6', '#14B8A6',
  '#F97316', '#A855F7', '#06B6D4', '#D946EF',
];
function randomColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export function getUsers(): StoredUser[] {
  return load<StoredUser[]>(KEYS.USERS, []);
}

export function saveUsers(users: StoredUser[]): void {
  save(KEYS.USERS, users);
}

export function getUserById(id: string): StoredUser | undefined {
  return getUsers().find((u) => u.id === id);
}

export function getUserByEmail(email: string): StoredUser | undefined {
  return getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function registerUser(data: {
  fullName: string;
  email: string;
  password: string;
  role: 'student' | 'tutor';
  campus: string;
  course: string;
  skills: string[];
  portfolioUrl: string;
  githubUrl: string;
  available: boolean;
}): StoredUser {
  const users = getUsers();
  const newUser: StoredUser = {
    id: generateId('user'),
    fullName: data.fullName,
    email: data.email,
    passwordHash: encodePassword(data.password),
    role: data.role,
    campus: data.campus,
    course: data.course,
    skills: data.skills,
    interests: [],
    bio: '',
    portfolioUrl: data.portfolioUrl || '',
    githubUrl: data.githubUrl || '',
    behanceUrl: '',
    available: data.available,
    avatarColor: randomColor(),
    yearOfStudy: '',
    createdAt: new Date().toISOString(),
  };
  saveUsers([...users, newUser]);
  return newUser;
}

export function updateUser(id: string, updates: Partial<StoredUser>): void {
  const users = getUsers().map((u) => (u.id === id ? { ...u, ...updates } : u));
  saveUsers(users);
}

export function loginUser(email: string, password: string): StoredUser | null {
  const user = getUserByEmail(email);
  if (!user) return null;
  if (!checkPassword(password, user.passwordHash)) return null;
  return user;
}

// ─── Session ──────────────────────────────────────────────────────────────────

export function getCurrentUserId(): string | null {
  return load<string | null>(KEYS.CURRENT_USER_ID, null);
}

export function setCurrentUserId(id: string | null): void {
  if (id === null) {
    if (typeof window !== 'undefined') localStorage.removeItem(KEYS.CURRENT_USER_ID);
  } else {
    save(KEYS.CURRENT_USER_ID, id);
  }
}

export function getCurrentUser(): StoredUser | null {
  const id = getCurrentUserId();
  if (!id) return null;
  return getUserById(id) || null;
}

export function logout(): void {
  setCurrentUserId(null);
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export function getProjects(): StoredProject[] {
  return load<StoredProject[]>(KEYS.PROJECTS, []);
}

export function saveProjects(projects: StoredProject[]): void {
  save(KEYS.PROJECTS, projects);
}

export function getProjectById(id: string): StoredProject | undefined {
  return getProjects().find((p) => p.id === id);
}

export function createProject(data: {
  title: string;
  description: string;
  type: ProjectType;
  tags: string[];
  ownerId: string;
}): StoredProject {
  const projects = getProjects();
  const newProject: StoredProject = {
    id: generateId('proj'),
    title: data.title,
    description: data.description,
    type: data.type,
    status: 'active',
    tags: data.tags,
    createdAt: new Date().toISOString(),
    ownerId: data.ownerId,
    memberIds: [data.ownerId],
  };
  saveProjects([...projects, newProject]);
  return newProject;
}

export function addMemberToProject(projectId: string, userId: string): void {
  const projects = getProjects().map((p) => {
    if (p.id === projectId && !p.memberIds.includes(userId)) {
      return { ...p, memberIds: [...p.memberIds, userId] };
    }
    return p;
  });
  saveProjects(projects);
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export function getTasks(projectId: string): StoredTask[] {
  return load<StoredTask[]>(KEYS.TASKS, []).filter((t) => t.projectId === projectId);
}

export function saveTasks(tasks: StoredTask[]): void {
  const all = load<StoredTask[]>(KEYS.TASKS, []);
  const otherTasks = all.filter((t) => !tasks.some((nt) => nt.projectId === t.projectId));
  save(KEYS.TASKS, [...otherTasks, ...tasks]);
}

export function addTask(task: Omit<StoredTask, 'id' | 'createdAt'>): StoredTask {
  const all = load<StoredTask[]>(KEYS.TASKS, []);
  const newTask: StoredTask = { ...task, id: generateId('task'), createdAt: new Date().toISOString() };
  save(KEYS.TASKS, [...all, newTask]);
  return newTask;
}

export function updateTask(taskId: string, updates: Partial<StoredTask>): void {
  const all = load<StoredTask[]>(KEYS.TASKS, []).map((t) => (t.id === taskId ? { ...t, ...updates } : t));
  save(KEYS.TASKS, all);
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export function getMessages(projectId: string): StoredMessage[] {
  return load<StoredMessage[]>(KEYS.MESSAGES, []).filter((m) => m.projectId === projectId);
}

export function addMessage(msg: Omit<StoredMessage, 'id'>): StoredMessage {
  const all = load<StoredMessage[]>(KEYS.MESSAGES, []);
  const newMsg: StoredMessage = { ...msg, id: generateId('msg') };
  save(KEYS.MESSAGES, [...all, newMsg]);
  return newMsg;
}

// ─── Files ────────────────────────────────────────────────────────────────────

export function getFiles(projectId: string): StoredFile[] {
  return load<StoredFile[]>(KEYS.FILES, []).filter((f) => f.projectId === projectId);
}

export function addFile(file: Omit<StoredFile, 'id'>): StoredFile {
  const all = load<StoredFile[]>(KEYS.FILES, []);
  const newFile: StoredFile = { ...file, id: generateId('file') };
  save(KEYS.FILES, [...all, newFile]);
  return newFile;
}

// ─── Ideas ────────────────────────────────────────────────────────────────────

export function getIdeas(projectId: string): StoredIdea[] {
  return load<StoredIdea[]>(KEYS.IDEAS, []).filter((i) => i.projectId === projectId);
}

export function addIdea(idea: Omit<StoredIdea, 'id'>): StoredIdea {
  const all = load<StoredIdea[]>(KEYS.IDEAS, []);
  const newIdea: StoredIdea = { ...idea, id: generateId('idea') };
  save(KEYS.IDEAS, [...all, newIdea]);
  return newIdea;
}

// ─── Invitations ──────────────────────────────────────────────────────────────

export function getInvitations(): StoredInvitation[] {
  return load<StoredInvitation[]>(KEYS.INVITATIONS, []);
}

export function getInvitationsForUser(userId: string): StoredInvitation[] {
  return getInvitations().filter((inv) => inv.toUserId === userId);
}

export function createInvitation(data: {
  projectId: string;
  projectTitle: string;
  projectType: ProjectType;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  message: string;
}): StoredInvitation {
  const all = getInvitations();
  const inv: StoredInvitation = {
    id: generateId('inv'),
    ...data,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  save(KEYS.INVITATIONS, [...all, inv]);
  // Create a notification for the invited user
  createNotification({ userId: data.toUserId, type: 'invitation', invitationId: inv.id });
  return inv;
}

export function updateInvitationStatus(
  invId: string,
  status: 'accepted' | 'declined'
): void {
  const all = getInvitations().map((inv) =>
    inv.id === invId ? { ...inv, status } : inv
  );
  save(KEYS.INVITATIONS, all);
  if (status === 'accepted') {
    const inv = all.find((i) => i.id === invId);
    if (inv) addMemberToProject(inv.projectId, inv.toUserId);
  }
}

// ─── Notifications ────────────────────────────────────────────────────────────

export function getNotifications(): StoredNotification[] {
  return load<StoredNotification[]>(KEYS.NOTIFICATIONS, []);
}

export function getNotificationsForUser(userId: string): StoredNotification[] {
  return getNotifications().filter((n) => n.userId === userId);
}

export function createNotification(data: {
  userId: string;
  type: 'invitation';
  invitationId: string;
}): void {
  const all = getNotifications();
  const notif: StoredNotification = {
    id: generateId('notif'),
    ...data,
    read: false,
    createdAt: new Date().toISOString(),
  };
  save(KEYS.NOTIFICATIONS, [...all, notif]);
}

export function markNotificationRead(notifId: string): void {
  const all = getNotifications().map((n) =>
    n.id === notifId ? { ...n, read: true } : n
  );
  save(KEYS.NOTIFICATIONS, all);
}

// ─── Code Files ───────────────────────────────────────────────────────────────

export function getCodeFiles(projectId: string): CodeFile[] {
  return load<CodeFile[]>(KEYS.CODE_FILES, []).filter((f) => f.projectId === projectId);
}

export function saveCodeFile(file: CodeFile): void {
  const all = load<CodeFile[]>(KEYS.CODE_FILES, []);
  const exists = all.findIndex((f) => f.id === file.id);
  if (exists >= 0) {
    all[exists] = file;
    save(KEYS.CODE_FILES, all);
  } else {
    save(KEYS.CODE_FILES, [...all, file]);
  }
}

export function addCodeFile(data: Omit<CodeFile, 'id' | 'lastEdited'>): CodeFile {
  const newFile: CodeFile = {
    ...data,
    id: generateId('code'),
    lastEdited: new Date().toISOString(),
  };
  saveCodeFile(newFile);
  return newFile;
}

export function deleteCodeFile(fileId: string): void {
  const all = load<CodeFile[]>(KEYS.CODE_FILES, []).filter((f) => f.id !== fileId);
  save(KEYS.CODE_FILES, all);
}

// ─── Presentations ────────────────────────────────────────────────────────────

export function getPresentation(projectId: string): StoredPresentation {
  const all = load<StoredPresentation[]>(KEYS.PRESENTATIONS, []);
  return all.find((p) => p.projectId === projectId) || {
    projectId,
    slides: [],
    externalLink: '',
    lastEdited: new Date().toISOString(),
  };
}

export function savePresentation(pres: StoredPresentation): void {
  const all = load<StoredPresentation[]>(KEYS.PRESENTATIONS, []);
  const idx = all.findIndex((p) => p.projectId === pres.projectId);
  if (idx >= 0) {
    all[idx] = { ...pres, lastEdited: new Date().toISOString() };
    save(KEYS.PRESENTATIONS, all);
  } else {
    save(KEYS.PRESENTATIONS, [...all, { ...pres, lastEdited: new Date().toISOString() }]);
  }
}
