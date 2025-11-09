'use client';

import { useIsFetching } from '@tanstack/react-query';
import React from 'react';

export default function GlobalTopLoader() {
  // Đếm tổng số query đang fetch (trong toàn app)
  const isFetching = useIsFetching();

  if (!isFetching) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[9999] pointer-events-none">
      <div className="h-0.5 w-full bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-400 animate-pulse" />
    </div>
  );
}
