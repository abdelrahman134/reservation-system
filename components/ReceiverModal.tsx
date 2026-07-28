'use client';

import { useState, useEffect } from 'react';
import { RotateCcw, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface StaffUser {
  _id: string;
  name: string;
}

interface ReceiverModalProps {
  reservationId: string;
  clientName: string;
  staffList: StaffUser[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReceiverModal({
  reservationId,
  clientName,
  staffList,
  onClose,
  onSuccess,
}: ReceiverModalProps) {
  const { t } = useLanguage();
  const [selectedStaff, setSelectedStaff] = useState<string>(staffList[0]?._id || '');
  const [returnInsurance, setReturnInsurance] = useState<string>('100');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingExisting, setIsLoadingExisting] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    setIsLoadingExisting(true);
    fetch(`/api/receivers?reservation=${reservationId}`)
      .then((res) => res.json())
      .then((existing) => {
        if (existing && existing._id) {
          setIsEditMode(true);
          if (existing.staffUser?._id) setSelectedStaff(existing.staffUser._id);
          else if (typeof existing.staffUser === 'string') setSelectedStaff(existing.staffUser);

          if (existing.returnInsurance !== undefined) setReturnInsurance(existing.returnInsurance.toString());
        }
      })
      .catch((err) => console.error('Failed to load existing receiver:', err))
      .finally(() => setIsLoadingExisting(false));
  }, [reservationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) {
      setErrorMsg('Please select the staff member receiving keys.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/receivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservation: reservationId,
          staffUser: selectedStaff,
          returnInsurance: parseFloat(returnInsurance) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to record key return');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {isEditMode ? 'Update Key Return' : t('receiverPopupTitle')}
              </h3>
              <p className="text-xs text-slate-500">{clientName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl font-bold"
          >
            &times;
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {isLoadingExisting ? (
          <div className="py-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                {t('receivingStaff')}
              </label>
              <select
                required
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 text-sm font-medium"
              >
                {staffList.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                {t('returnInsurance')}
              </label>
              <input
                type="number"
                min="0"
                required
                value={returnInsurance}
                onChange={(e) => setReturnInsurance(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-rose-600"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 rtl:space-x-reverse pt-3 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-500/20 transition-all disabled:opacity-50"
              >
                {isSubmitting ? t('saving') : isEditMode ? 'Update Return' : t('recordReceiver')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
