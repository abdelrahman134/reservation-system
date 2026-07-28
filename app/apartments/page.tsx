'use client';

import { useState, useEffect } from 'react';
import { Building2, Plus, Edit2, Trash2, Eye, Calendar, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface ApartmentItem {
  _id: string;
  name: string;
  reservationCount: number;
  totalValue: number;
  createdAt: string;
}

interface ApartmentReservation {
  _id: string;
  user: { name: string };
  startDate: string;
  endDate: string;
  value: number;
  status: string;
}

export default function ApartmentsPage() {
  const [apartments, setApartments] = useState<ApartmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  // Form states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingApartment, setEditingApartment] = useState<ApartmentItem | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detail Modal state
  const [selectedApartmentHistory, setSelectedApartmentHistory] = useState<{
    apartment: ApartmentItem;
    reservations: ApartmentReservation[];
  } | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchApartments = async () => {
    try {
      const res = await fetch('/api/apartments');
      const data = await res.json();
      setApartments(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApartments();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/apartments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameInput.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create apartment');
      }

      setNameInput('');
      setIsAddModalOpen(false);
      fetchApartments();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApartment || !nameInput.trim()) return;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/apartments/${editingApartment._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameInput.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update apartment');
      }

      setEditingApartment(null);
      setNameInput('');
      fetchApartments();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (apt: ApartmentItem) => {
    const confirmMessage = apt.reservationCount > 0
      ? `Apartment "${apt.name}" has ${apt.reservationCount} associated reservation(s). Soft-deleting will preserve historical revenue reports. Proceed?`
      : `Are you sure you want to delete apartment "${apt.name}"?`;

    if (!confirm(confirmMessage)) return;

    try {
      const res = await fetch(`/api/apartments/${apt._id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchApartments();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewHistory = async (apt: ApartmentItem) => {
    setLoadingHistory(true);
    setSelectedApartmentHistory({ apartment: apt, reservations: [] });

    try {
      const res = await fetch(`/api/reservations?apartment=${apt._id}`);
      const data = await res.json();
      setSelectedApartmentHistory({ apartment: apt, reservations: data });
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Building2 className="w-8 h-8 text-amber-600" /> {t('apartmentsTitle')}
          </h1>
          <p className="text-slate-500 text-sm mt-1">{t('apartmentsSubtitle')}</p>
        </div>
        <button
          onClick={() => {
            setNameInput('');
            setErrorMsg('');
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center justify-center space-x-2 rtl:space-x-reverse bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-xl text-sm transition-all shadow-md shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>{t('addApartment')}</span>
        </button>
      </div>

      {/* Apartments Table */}
      <div className="glass-card rounded-2xl p-6">
        {apartments.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            {t('noApartmentsFound')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3.5 rounded-l-lg rtl:rounded-r-lg rtl:rounded-l-none">
                    {t('apartmentName')}
                  </th>
                  <th className="px-4 py-3.5">{t('reservationsCount')}</th>
                  <th className="px-4 py-3.5">{t('totalRevenueGenerated')}</th>
                  <th className="px-4 py-3.5">{t('listedSince')}</th>
                  <th className="px-4 py-3.5 text-right rtl:text-left rounded-r-lg rtl:rounded-l-lg rtl:rounded-r-none">
                    {t('actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {apartments.map((apt) => (
                  <tr key={apt._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-4 font-semibold text-slate-900 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <span>{apt.name}</span>
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
                        {apt.reservationCount}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-bold text-emerald-600">
                      ${apt.totalValue.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-slate-500 text-xs">
                      {format(new Date(apt.createdAt), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-4 py-4 text-right rtl:text-left space-x-2 rtl:space-x-reverse">
                      <button
                        onClick={() => handleViewHistory(apt)}
                        title="View History"
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingApartment(apt);
                          setNameInput(apt.name);
                          setErrorMsg('');
                        }}
                        title="Edit Apartment"
                        className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(apt)}
                        title="Delete Apartment"
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Apartment Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-xl font-bold text-slate-900">{t('addNewApartment')}</h3>
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  {t('apartmentName')}
                </label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="e.g. Apartment 4B"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div className="flex items-center justify-end space-x-3 rtl:space-x-reverse pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? t('saving') : t('addApartment')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Apartment Modal */}
      {editingApartment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-xl font-bold text-slate-900">{t('editApartment')}</h3>
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  {t('apartmentName')}
                </label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div className="flex items-center justify-end space-x-3 rtl:space-x-reverse pt-2">
                <button
                  type="button"
                  onClick={() => setEditingApartment(null)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? t('saving') : t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Apartment History Modal */}
      {selectedApartmentHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {selectedApartmentHistory.apartment.name} {t('apartmentHistory')}
                </h3>
                <p className="text-xs text-slate-500">
                  {t('totalRevenueGenerated')}: ${selectedApartmentHistory.apartment.totalValue.toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedApartmentHistory(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="overflow-y-auto flex-1 py-2">
              {loadingHistory ? (
                <div className="text-center py-8 text-slate-500">{t('saving')}</div>
              ) : selectedApartmentHistory.reservations.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  {t('noHistoryApartment')}
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedApartmentHistory.reservations.map((res) => (
                    <div
                      key={res._id}
                      className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-slate-900 text-sm">
                          {res.user?.name || 'Guest'}
                        </div>
                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-amber-600" />
                          <span>
                            {format(new Date(res.startDate), 'MMM dd, yyyy')} -{' '}
                            {format(new Date(res.endDate), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      </div>
                      <div className="text-right rtl:text-left">
                        <div className="font-bold text-emerald-600 text-sm">
                          ${res.value.toLocaleString()}
                        </div>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold mt-1 uppercase ${
                            res.status === 'confirmed'
                              ? 'bg-blue-100 text-blue-700'
                              : res.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {t(res.status as any) || res.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
