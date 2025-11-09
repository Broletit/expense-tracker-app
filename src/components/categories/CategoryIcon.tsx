'use client';

export default function CategoryIcon({ icon }: { icon?: string | null }) {
  if (!icon) return <span className="text-gray-400">—</span>;
  return (
    <span
      className="inline-flex items-center justify-center h-8 w-8 rounded-md bg-gray-100 text-lg"
      title={icon}
      aria-label="category-icon"
    >
      {icon}
    </span>
  );
}
