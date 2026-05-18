'use client';

import React, { useEffect, useState } from 'react';
import type { UserProfile } from './CollaborationFinderScreen';

import {
  createOrOpenChat,
  listenToMessages,
  sendChatMessage,
  type ChatMessage,
} from '@/lib/chatservice';

import { auth } from '@/lib/firebase';

interface ChatModalProps {
  target: UserProfile;
  currentUid: string;
  onClose: () => void;
}

export default function ChatModal({
  target,
  currentUid,
  onClose,
}: ChatModalProps) {
  const [chatId, setChatId] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');

  useEffect(() => {
    let stopListening: undefined | (() => void);

    async function openChat() {
      const id = await createOrOpenChat(
        currentUid,
        target.id,
        target.name
      );

      setChatId(id);

      stopListening = listenToMessages(id, setMessages);
    }

    openChat();

    return () => {
      if (stopListening) stopListening();
    };
  }, [currentUid, target.id, target.name]);

  const handleSend = async () => {
    if (!chatId || !text.trim()) return;

    await sendChatMessage(
      chatId,
      currentUid,
      auth.currentUser?.displayName ||
        auth.currentUser?.email ||
        'UCA User',
      text,
      target.id
    );

    setText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="p-5 border-b flex items-center justify-between">
          <div>
            <h2
              className="font-bold text-lg"
              style={{ color: '#1A1730' }}
            >
              Message {target.name}
            </h2>

            <p
              className="text-xs mt-1"
              style={{ color: '#8B87A0' }}
            >
              Ask about project, skills, availability or joining.
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-sm font-semibold"
          >
            ✕
          </button>
        </div>

        <div className="h-80 overflow-y-auto p-5 space-y-3 bg-[#FBFAFF]">
          {messages.length === 0 ? (
            <p
              className="text-sm text-center mt-20"
              style={{ color: '#8B87A0' }}
            >
              No messages yet. Start the conversation.
            </p>
          ) : (
            messages.map((msg) => {
              const mine = msg.senderId === currentUid;

              return (
                <div
                  key={msg.id}
                  className={`flex ${
                    mine
                      ? 'justify-end'
                      : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                      mine
                        ? 'bg-[#6C47FF] text-white'
                        : 'bg-white border'
                    }`}
                  >
                    <p className="text-[10px] opacity-70 mb-1">
                      {msg.senderName}
                    </p>

                    <p>{msg.text}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 border-t flex gap-2">
          <input
            value={text}
            onChange={(e) =>
              setText(e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSend();
              }
            }}
            placeholder="Type your message..."
            className="flex-1 border rounded-xl px-4 py-2 text-sm outline-none"
          />

          <button
            onClick={handleSend}
            className="btn-primary px-5 py-2 text-sm"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}