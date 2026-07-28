'use client';

import { useState, useEffect, useRef } from 'react';
import { Filter } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export interface DateFilterValue {
  fromDate?: string;
  toDate?: string;
}

interface DateRangeFilterProps {
  onFilterChange: (filter: DateFilterValue) => void;
}

export default function DateRangeFilter({ onFilterChange }: DateRangeFilterProps) {
  const { t } = useLanguage();
  const [filterType, setFilterType] = useState<string>('all_time');

  // Month & Year Selection
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

  // Custom Range Selection
  const [customFrom, setCustomFrom] = useState<string>('');
  const [customTo, setCustomTo] = useState<string>('');

  const prevFilterRef = useRef<{ fromDate?: string; toDate?: string }>({});

  const monthsList = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = now.getFullYear();
  const yearsList = Array.from({ length: 5 }, (_, i) => currentYear - i);

  useEffect(() => {
    let fromDate: string | undefined;
    let toDate: string | undefined;

    const currNow = new Date();

    if (filterType === 'this_month') {
      const start = new Date(currNow.getFullYear(), currNow.getMonth(), 1);
      const end = new Date(currNow.getFullYear(), currNow.getMonth() + 1, 0, 23, 59, 59);
      fromDate = start.toISOString();
      toDate = end.toISOString();
    } else if (filterType === 'this_year') {
      const start = new Date(currNow.getFullYear(), 0, 1);
      const end = new Date(currNow.getFullYear(), 11, 31, 23, 59, 59);
      fromDate = start.toISOString();
      toDate = end.toISOString();
    } else if (filterType === 'month_year') {
      const start = new Date(selectedYear, selectedMonth, 1);
      const end = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);
      fromDate = start.toISOString();
      toDate = end.toISOString();
    } else if (filterType === 'custom' && customFrom && customTo) {
      fromDate = new Date(customFrom).toISOString();
      toDate = new Date(customTo + 'T23:59:59').toISOString();
    }

    // Only notify parent if values actually changed string-wise to prevent infinite render loop!
    if (
      prevFilterRef.current.fromDate !== fromDate ||
      prevFilterRef.current.toDate !== toDate
    ) {
      prevFilterRef.current = { fromDate, toDate };
      onFilterChange({ fromDate, toDate });
    }
  }, [filterType, selectedMonth, selectedYear, customFrom, customTo, onFilterChange]);

  return (
    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
      <div className="flex items-center space-x-2 rtl:space-x-reverse">
        <Filter className="w-4 h-4 text-slate-400 shrink-0" />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="py-2 px-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-semibold text-slate-700 shadow-sm"
        >
          <option value="all_time">{t('allTime')}</option>
          <option value="this_month">{t('thisMonth')}</option>
          <option value="this_year">{t('thisYear')}</option>
          <option value="month_year">Specific Month &amp; Year</option>
          <option value="custom">{t('customRange')}</option>
        </select>
      </div>

      {filterType === 'month_year' && (
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="py-1.5 px-2.5 text-xs bg-white border border-slate-200 rounded-xl font-medium text-slate-700"
          >
            {monthsList.map((m, idx) => (
              <option key={idx} value={idx}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="py-1.5 px-2.5 text-xs bg-white border border-slate-200 rounded-xl font-medium text-slate-700"
          >
            {yearsList.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      )}

      {filterType === 'custom' && (
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="py-1.5 px-2.5 text-xs bg-white border border-slate-200 rounded-xl font-medium text-slate-700"
          />
          <span className="text-slate-400 text-xs">&rarr;</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="py-1.5 px-2.5 text-xs bg-white border border-slate-200 rounded-xl font-medium text-slate-700"
          />
        </div>
      )}
    </div>
  );
}
