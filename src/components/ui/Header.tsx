'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import HeaderUser from '@/components/ui/HeaderUser';

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = [
    { href: '/dashboard', label: 'Tổng quan' },
    { href: '/expenses', label: 'Chi tiêu' },
    { href: '/categories', label: 'Danh mục' },
    { href: '/reports', label: 'Báo cáo' },
    { href: '/budgets', label: 'Ngân sách' },
  ];

  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(href + '/');

  return (
    <header className="w-full border-b bg-transparent transition-[background-color,color,border-color] duration-500 ease-in-out">
      <div className="w-full max-w-screen-2xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-3 hover:opacity-90 transition-opacity"
          aria-label="Trang chủ Expense Tracker"
        >
          <img
            src="/logo.png"
            alt="Expense Tracker Logo"
            className="h-16 max-h-16 w-auto object-contain drop-shadow-md"
          />
        </Link>


        {/* Nav desktop */}
        <nav className="hidden md:flex items-center gap-4 sm:gap-6">
          {nav.map((l) => {
            const active = isActive(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`text-sm font-medium px-3 py-1.5 rounded-md transition-colors duration-300
                  ${
                    active
                      ? 'bg-blue-100 text-blue-700 dark:bg-gray-700 dark:text-white'
                      : 'text-gray-800 hover:text-blue-700 dark:text-gray-200 dark:hover:text-white'
                  }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: user + hamburger */}
        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <HeaderUser />
          </div>
          <button
            className="md:hidden p-2 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors duration-300"
            onClick={() => setOpen((v) => !v)}
            aria-label="Mở menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden border-t border-black/10 dark:border-white/10 overflow-hidden
                    transition-[max-height,opacity] duration-500 ease-in-out
                    ${
                      open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    } bg-transparent`}
      >
        <nav className="flex flex-col px-6 py-3 space-y-2">
          {nav.map((l) => {
            const active = isActive(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors duration-300
                  ${
                    active
                      ? 'bg-blue-100 text-blue-700 dark:bg-gray-700 dark:text-white'
                      : 'text-gray-800 hover:bg.black/5 dark:text-gray-200 dark:hover:bg.white/10'
                  }`}
              >
                {l.label}
              </Link>
            );
          })}

          <div className="pt-2">
            <HeaderUser />
          </div>
        </nav>
      </div>
    </header>
  );
}
