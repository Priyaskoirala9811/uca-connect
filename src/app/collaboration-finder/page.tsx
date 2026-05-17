'use client';

import AppLayout from '@/components/AppLayout';
import CollaborationFinderScreen from './components/CollaborationFinderScreen';

export default function CollaborationFinderPage() {
  return (
    <AppLayout currentPath="/collaboration-finder">
      <CollaborationFinderScreen />
    </AppLayout>
  );
}