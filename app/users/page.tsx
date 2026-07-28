'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Eye, Calendar, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface UserItem {
  _id: string;
  name: string;
  reservationCount: number;
  totalValue: number;
  createdAt: string;
}

interface UserReservation {
  _id: string;
  apartment: { name: string };
  startDate: string;
  endDate: string;
  value: number;
  status: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  // Form states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // History modal state
  const [selectedUserHistory, setSelectedUserHistory] = useState<{
    user: UserItem;
    reservations: UserReservation[];
  } | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameInput.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add user');
      }

      setNameInput('');
      setIsAddModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !nameInput.trim()) return;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/users/${editingUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameInput.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update user');
      }

      setEditingUser(null);
      setNameInput('');
      fetchUsers();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (user: UserItem) => {
    const confirmMessage = user.reservationCount > 0
      ? `User "${user.name}" has ${user.reservationCount} reservation(s). Deleting will soft-delete the user while preserving historical revenue records. Proceed?`
      : `Are you sure you want to delete user "${user.name}"?`;

    if (!confirm(confirmMessage)) return;

    try {
      const res = await fetch(`/api/users/${user._id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewHistory = async (user: UserItem) => {
    setLoadingHistory(true);
    setSelectedUserHistory({ user, reservations: [] });

    try {
      const res = await fetch(`/api/reservations?user=${user._id}`);
      const data = await res.json();
      setSelectedUserHistory({ user, reservations: data });
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
            <Users className="w-8 h-8 text-blue-600" /> {t('usersTitle')}
          </h1>
          <p className="text-slate-500 text-sm mt-1">{t('usersSubtitle')}</p>
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
          <span>{t('addUser')}</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="glass-card rounded-2xl p-6">
        {users.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            {t('noUsersFound')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3.5 rounded-l-lg rtl:rounded-r-lg rtl:rounded-l-none">
                    {t('userName')}
                  </th>
                  <th className="px-4 py-3.5">{t('reservationsCount')}</th>
                  <th className="px-4 py-3.5">{t('totalRevenueGenerated')}</th>
                  <th className="px-4 py-3.5">{t('memberSince')}</th>
                  <th className="px-4 py-3.5 text-right rtl:text-left rounded-r-lg rtl:rounded-l-lg rtl:rounded-r-none">
                    {t('actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-4 font-semibold text-slate-900">{user.name}</td>
                    <td className="px-4 py-4 text-slate-600">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                        {user.reservationCount}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-bold text-emerald-600">
                      ${user.totalValue.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-slate-500 text-xs">
                      {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-4 py-4 text-right rtl:text-left space-x-2 rtl:space-x-reverse">
                      <button
                        onClick={() => handleViewHistory(user)}
                        title="View History"
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingUser(user);
                          setNameInput(user.name);
                          setErrorMsg('');
                        }}
                        title="Edit User"
                        className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        title="Delete User"
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

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-xl font-bold text-slate-900">{t('addNewUser')}</h3>
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  {t('guestNameLabel')}
                </label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
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
                  {isSubmitting ? t('saving') : t('addUser')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-xl font-bold text-slate-900">{t('editUser')}</h3>
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  {t('guestNameLabel')}
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
                  onClick={() => setEditingUser(null)}
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

      {/* User History Modal */}
      {selectedUserHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {selectedUserHistory.user.name} {t('userBookingHistory')}
                </h3>
                <p className="text-xs text-slate-500">
                  {t('totalRevenueGenerated')}: ${selectedUserHistory.user.totalValue.toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedUserHistory(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="overflow-y-auto flex-1 py-2">
              {loadingHistory ? (
                <div className="text-center py-8 text-slate-500">{t('saving')}</div>
              ) : selectedUserHistory.reservations.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  {t('noHistoryUser')}
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedUserHistory.reservations.map((res) => (
                    <div
                      key={res._id}
                      className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-slate-900 text-sm">
                          {res.apartment?.name || 'Apartment'}
                        </div>
                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-blue-600" />
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
