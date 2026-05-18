import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from './firebase';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt?: any;
}

export async function createOrOpenChat(
  currentUserId: string,
  targetUserId: string,
  targetName: string
) {
  const sortedIds = [currentUserId, targetUserId].sort();
  const chatId = sortedIds.join('_');

  await setDoc(
    doc(db, 'projectChats', chatId),
    {
      participants: sortedIds,
      targetName,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return chatId;
}

export function listenToMessages(
  chatId: string,
  callback: (messages: ChatMessage[]) => void
) {
  const q = query(
    collection(db, 'projectChats', chatId, 'messages'),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    })) as ChatMessage[];

    callback(messages);
  });
}

export async function sendChatMessage(
  chatId: string,
  senderId: string,
  senderName: string,
  text: string
) {
  const cleanText = text.trim();
  if (!cleanText) return;

  await addDoc(collection(db, 'projectChats', chatId, 'messages'), {
    senderId,
    senderName,
    text: cleanText,
    createdAt: serverTimestamp(),
  });

  await setDoc(
    doc(db, 'projectChats', chatId),
    {
      lastMessage: cleanText,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}