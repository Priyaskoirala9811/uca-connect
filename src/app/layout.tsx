import React from 'react';
import type { Metadata, Viewport } from 'next';
import { Toaster } from 'sonner';
import '../styles/tailwind.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'UCA Connect — Collaborate, Create, Graduate',
  description:
    'UCA Connect helps University for the Creative Arts students and tutors find collaborators, manage creative projects, and build portfolio-ready work across all four campuses.',
  icons: {
    icon: [{ url: '/favicon.ico', type: 'image/x-icon' }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-sans bg-brand-bg text-brand-text antialiased">
        {children}
        <Toaster position="top-center" richColors closeButton />
</body>
    </html>
  );
}