'use client';

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
  X,
  Building,
  Briefcase,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useLanguage();

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer */}
      <div className="relative flex-1 max-w-xs w-full bg-white h-full shadow-2xl flex flex-col z-10">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
              <Building className="w-5 h-5" />
            </div>
            <span className="font-bold text-slate-900 text-lg">{t('brandName')}</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={clsx(
                  'flex items-center space-x-3 rtl:space-x-reverse px-4 py-3 rounded-xl text-sm font-semibold transition-all',
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <span className="text-xs font-semibold text-slate-500">Language / اللغة</span>
          <LanguageToggle />
        </div>
      </div>
    </div>
  );
}
