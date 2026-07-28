'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarCheck2,
  CalendarDays,
  Receipt,
  Wallet,
  UserCheck,
  BarChart3,
  Building,
  Menu,
  Briefcase,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';
import Sidebar from '@/components/Sidebar';

export default function Navbar() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const navItems = [
    { name: t('dashboard'), href: '/', icon: LayoutDashboard },
    { name: t('users'), href: '/users', icon: Users },
    { name: t('apartments'), href: '/apartments', icon: Building2 },
    { name: t('brokers'), href: '/brokers', icon: Briefcase },
    { name: t('reservations'), href: '/reservations', icon: CalendarCheck2 },
    { name: t('calendar'), href: '/calendar', icon: CalendarDays },
    { name: t('expenses'), href: '/expenses', icon: Receipt },
    { name: t('revenue'), href: '/revenue', icon: Wallet },
    { name: t('insights'), href: '/insights', icon: UserCheck },
    { name: t('apartmentRevenue'), href: '/apartment-revenue', icon: BarChart3 },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 glass-panel border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3 rtl:space-x-reverse shrink-0">
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6" />
              </button>

              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                  {t('brandName')}
                </span>
                <span className="hidden sm:inline-block mx-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  {t('pro')}
                </span>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-3 rtl:space-x-reverse overflow-x-auto py-1">
              <nav className="flex items-center space-x-1 sm:space-x-1.5 rtl:space-x-reverse overflow-x-auto py-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={clsx(
                        'flex items-center space-x-1.5 rtl:space-x-reverse px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150',
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              <LanguageToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Slide-Out Drawer Sidebar */}
      <Sidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />
    </>
  );
}
