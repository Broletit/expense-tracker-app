'use client';

import React from 'react';

type Props = {
  height?: number;
  className?: string;
  children: (dims: { width: number; height: number }) => React.ReactNode;
};

export default function ChartFrame({ height = 288, className, children }: Props) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [dims, setDims] = React.useState({ width: 0, height });

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.style.height = `${height}px`;
    el.style.minWidth = '0';

    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (!cr) return;
      const w = Math.max(0, Math.floor(cr.width));
      setDims((d) => (d.width !== w ? { width: w, height } : d));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [height]);

  return (
    <div
      ref={ref}
      className={['w-full min-w-0', className || ''].join(' ')}
      style={{ height, minWidth: 0 }}
    >
      {dims.width > 0 && dims.height > 0 ? (
        children(dims)
      ) : (
        <div className="h-full w-full grid place-items-center text-sm text-gray-500">
          Đang tính kích thước…
        </div>
      )}
    </div>
  );
}
