'use client';

import { useState, useEffect } from 'react';
import { KeyRound, Upload, AlertCircle, Image as ImageIcon, X } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface StaffUser {
  _id: string;
  name: string;
}

interface DeliveryModalProps {
  reservationId: string;
  clientName: string;
  totalValue: number;
  staffList: StaffUser[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeliveryModal({
  reservationId,
  clientName,
  totalValue,
  staffList,
  onClose,
  onSuccess,
}: DeliveryModalProps) {
  const { t } = useLanguage();
  const [selectedStaff, setSelectedStaff] = useState<string>(staffList[0]?._id || '');
  const [insurance, setInsurance] = useState<string>('100');
  const [cashValue, setCashValue] = useState<string>(totalValue.toString());
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingExisting, setIsLoadingExisting] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    setIsLoadingExisting(true);
    fetch(`/api/deliveries?reservation=${reservationId}`)
      .then((res) => res.json())
      .then((existing) => {
        if (existing && existing._id) {
          setIsEditMode(true);
          if (existing.staffUser?._id) setSelectedStaff(existing.staffUser._id);
          else if (typeof existing.staffUser === 'string') setSelectedStaff(existing.staffUser);

          if (existing.insurance !== undefined) setInsurance(existing.insurance.toString());
          if (existing.totalValue !== undefined) setCashValue(existing.totalValue.toString());
          if (Array.isArray(existing.nationalIdPhotos)) setUploadedPhotos(existing.nationalIdPhotos);
        }
      })
      .catch((err) => console.error('Failed to load existing delivery:', err))
      .finally(() => setIsLoadingExisting(false));
  }, [reservationId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append('files', file));

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload photos');
      }

      setUploadedPhotos((prev) => [...prev, ...data.urls]);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    setUploadedPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) {
      setErrorMsg('Please select the staff member delivering keys.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservation: reservationId,
          staffUser: selectedStaff,
          insurance: parseFloat(insurance) || 0,
          totalValue: parseFloat(cashValue) || 0,
          nationalIdPhotos: uploadedPhotos,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to record delivery handoff');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {isEditMode ? 'Update Key Delivery' : t('deliveryPopupTitle')}
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
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                {t('deliveringStaff')}
              </label>
              <select
                required
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 text-sm font-medium"
              >
                {staffList.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  {t('insurance')}
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={insurance}
                  onChange={(e) => setInsurance(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  {t('cashCollected')}
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={cashValue}
                  onChange={(e) => setCashValue(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-emerald-600"
                />
              </div>
            </div>

            {/* ID Photo Uploader */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase">
                {t('idPhotos')}
              </label>
              <p className="text-[11px] text-slate-500">{t('uploadIdInstruction')}</p>

              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <label className="cursor-pointer inline-flex items-center space-x-2 rtl:space-x-reverse bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-4 py-2 rounded-xl border border-slate-200 transition-colors">
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span>{isUploading ? t('saving') : t('uploadPhotos')}</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
              </div>

              {uploadedPhotos.length > 0 && (
                <div className="grid grid-cols-3 gap-2 pt-2">
                  {uploadedPhotos.map((url, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200">
                      <img src={url} alt="National ID" className="w-full h-20 object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="absolute top-1 right-1 bg-slate-900/70 text-white rounded-full p-1 hover:bg-rose-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
                className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
              >
                {isSubmitting ? t('saving') : isEditMode ? 'Update Delivery' : t('recordDelivery')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
