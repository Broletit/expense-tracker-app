'use client';

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppDispatch, useAppSelector } from "../../hooks/reduxHooks";
import { toggleTheme } from "../../features/theme/themeSlice";
import {
  Moon,
  Sun,
  LayoutDashboard,
  Wallet,
  BarChart,
  Calendar,
  FileBarChart2,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/expenses", label: "Chi tiêu", icon: Wallet },
  { href: "/stats", label: "Thống kê", icon: BarChart },
  { href: "/analytics", label: "Báo cáo", icon: FileBarChart2 },
];

export default function Header() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const darkMode = useAppSelector((state) => state.theme.darkMode);
  const [menuOpen, setMenuOpen] = useState(false);

  const toggle = () => {
    dispatch(toggleTheme());
    if (typeof window !== "undefined") {
      localStorage.setItem("darkMode", (!darkMode).toString());
    }
    document.documentElement.classList.toggle("dark");
  };

  return (
    <header className="bg-white dark:bg-gray-900 shadow-md sticky top-0 z-50 border-b dark:border-gray-700">
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
        <div
          className="absolute inset-0 -z-10 bg-cover bg-center bg-no-repeat opacity-20 dark:opacity-10"
          style={{ backgroundImage: "url('/bg.jpg')" }}
        />
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center">
          <Image
            src="/logo.png"
            alt="Logo"
            width={180}
            height={120}
            className="hover:opacity-80 transition"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 gap-8">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center px-4 py-2 rounded-lg border border-transparent 
                hover:bg-blue-50 dark:hover:bg-gray-800 
                hover:border-blue-300 dark:hover:border-blue-500 transition-all group
                ${
                  pathname === href
                    ? "text-blue-600 dark:text-blue-400 border border-blue-400 dark:border-blue-500 bg-blue-200 dark:bg-gray-800"
                    : "text-gray-700 dark:text-gray-300"
                }`}
            >
              <Icon className="w-6 h-6 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-base font-semibold tracking-wide uppercase">
                {label}
              </span>
            </Link>
          ))}
        </nav>


        {/* Dark mode & mobile menu */}
        <div className="flex items-center gap-3">
          {/* Mobile menu toggle */}
          <div className="md:hidden">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Dark Mode toggle */}
          <button
            onClick={toggle}
            title={darkMode ? "Chế độ sáng" : "Chế độ tối"}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            {darkMode ? (
              <Sun size={20} className="text-yellow-500" />
            ) : (
              <Moon size={20} className="text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden px-4 pb-4 border-t dark:border-gray-700 bg-white dark:bg-gray-900">
          <nav className="flex flex-col gap-2">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-4 py-2 rounded-md transition-all group
                ${
                  pathname === href
                    ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-gray-800"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
                onClick={() => setMenuOpen(false)}
              >
                <Icon className="w-5 h-5" />
                <span className="text-base font-medium">{label}</span>
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
