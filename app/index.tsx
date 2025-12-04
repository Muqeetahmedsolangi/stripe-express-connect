import React from 'react';
import AuthGuard from '@/components/AuthGuard';

export default function RootIndex() {
  return <AuthGuard />;
}