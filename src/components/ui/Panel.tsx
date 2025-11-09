'use client';

import React from 'react';

export default function Panel({
  className,
  children,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={[
        'bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800',
        'w-full min-w-0', 
        className || '',
      ].join(' ')}
    >
      {children}
    </div>
  );
}
