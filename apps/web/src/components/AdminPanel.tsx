'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  Coins,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Plus,
  RefreshCw,
  Send,
  Lock,
  Crown,
  Database,
  User as UserIcon,
  AlertCircle,
} from 'lucide-react';
import { User, LocaleType } from '../types';
import { api } from '../lib/api';

interface AdminPanelProps {
  user: User | null;
  locale: LocaleType;
}

export function AdminPanel({ user, locale }: AdminPanelProps) {
  const [requests, setRequests] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Manual Grant Form
  const [targetPhone, setTargetPhone] = useState('');
  const [tokensToGrant, setTokensToGrant] = useState(20);
  const [grantReason, setGrantReason] = useState('');
  const [isGranting, setIsGranting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isAdmin = user?.role === 'admin';

  const loadAdminData = async () => {
    if (!isAdmin) return;
    setIsLoading(true);
    try {
      const [reqs, users] = await Promise.all([
        api.adminListRequests(),
        api.adminListUsers(),
      ]);
      setRequests(reqs || []);
      setUsersList(users || []);
    } catch (err: any) {
      console.warn('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    }
  }, [isAdmin]);

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPhone.trim()) return;

    setIsGranting(true);
    setStatusMessage(null);
    try {
      const res = await api.adminGrantTokens({
        targetPhoneNumber: targetPhone.trim(),
        tokensToAdd: Number(tokensToGrant),
        reason: grantReason.trim() || 'Admin qoʻlda token ajratdi',
      });

      setStatusMessage({ type: 'success', text: res.message || 'Tokenlar muvaffaqiyatli berildi!' });
      setTargetPhone('');
      setGrantReason('');
      loadAdminData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Token berishda xatolik yuz berdi' });
    } finally {
      setIsGranting(false);
    }
  };

  const handleApproveRequest = async (req: any) => {
    setIsGranting(true);
    setStatusMessage(null);
    try {
      const res = await api.adminGrantTokens({
        targetUserId: req.userId,
        targetPhoneNumber: req.userPhone,
        tokensToAdd: req.requestedTokens,
        requestId: req.requestId,
        reason: req.note || 'Soʻrov tasdiqlandi',
      });

      setStatusMessage({ type: 'success', text: res.message || 'Soʻrov tasdiqlandi va tokenlar berildi!' });
      loadAdminData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Xatolik yuz berdi' });
    } finally {
      setIsGranting(false);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await api.adminRejectRequest(requestId);
      setStatusMessage({ type: 'success', text: 'Soʻrov rad etildi' });
      loadAdminData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Rad etishda xatolik yuz berdi' });
    }
  };

  const handleQuickGrant = async (targetUserId: string, targetPhone: string, count: number) => {
    try {
      const res = await api.adminGrantTokens({
        targetUserId,
        targetPhoneNumber: targetPhone,
        tokensToAdd: count,
        reason: `Admin tezkor +${count} token berdi`,
      });
      setStatusMessage({ type: 'success', text: res.message });
      loadAdminData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Xatolik' });
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-6">
        <div className="h-16 w-16 mx-auto rounded-3xl bg-red-100 text-red-600 flex items-center justify-center shadow-md">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-heading font-black text-ink tracking-tight">
            Kirish Taqiqlangan (Faqat Administratorlar)
          </h2>
          <p className="text-sm text-ink-muted leading-relaxed">
            Ushbu boʻlim faqat maʼlumotlar bazasida <code className="bg-canvas px-1.5 py-0.5 rounded text-coral font-bold font-mono">role = 'admin'</code> boʻlgan foydalanuvchilar uchun ochiladi.
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-border text-xs text-ink-muted space-y-1">
          <p className="font-semibold text-ink">Joriy hisob holati:</p>
          <p>Foydalanuvchi: <span className="font-mono font-bold text-ink">{user?.full_name || 'Mehmon (Kirilmagan)'}</span></p>
          <p>Roli: <span className="font-mono font-bold text-red-600 uppercase">{user?.role || 'Guest'}</span></p>
        </div>
      </div>
    );
  }

  const filteredUsers = usersList.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone_number?.includes(searchQuery) ||
      u.id?.includes(searchQuery),
  );

  const pendingRequests = requests.filter((r) => r.status === 'pending');

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Top Admin Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-mono font-bold uppercase tracking-wide">
            <Crown className="h-3.5 w-3.5" />
            <span>Platforma Administratori</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-ink tracking-tight">
            Admin Panel — Tokenlar va Foydalanuvchilar Nazorati
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted">
            Maʼlumotlar bazasidagi barcha foydalanuvchilar, kutilayotgan token soʻrovlari va hisob balansi.
          </p>
        </div>

        <button
          onClick={loadAdminData}
          disabled={isLoading}
          className="px-3.5 py-2 rounded-xl bg-white hover:bg-canvas text-ink border border-border text-xs font-semibold flex items-center gap-2 tactile-btn shadow-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Yangilash</span>
        </button>
      </div>

      {/* Status Notice */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center gap-2 shadow-xs ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          )}
          <span className="font-semibold">{statusMessage.text}</span>
        </div>
      )}

      {/* Bento Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-border shadow-xs interactive-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-semibold text-ink-muted uppercase">Barcha Foydalanuvchilar</span>
            <Users className="h-4 w-4 text-coral" />
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-black text-ink">
            {usersList.length}
          </div>
          <span className="text-[11px] text-ink-muted">PostgreSQL bazasida saqlangan</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-border shadow-xs interactive-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-semibold text-ink-muted uppercase">Kutilayotgan Soʻrovlar</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-black text-amber-600">
            {pendingRequests.length}
          </div>
          <span className="text-[11px] text-ink-muted">Tasdiq kutayotgan soʻrovlar</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-border shadow-xs interactive-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-semibold text-ink-muted uppercase">Taqsimlangan Tokenlar</span>
            <Coins className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-black text-emerald-700">
            {usersList.reduce((acc, u) => acc + (Number(u.credits_balance) || 0), 0)}
          </div>
          <span className="text-[11px] text-ink-muted">Foydalanuvchilar balansida</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-border shadow-xs interactive-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-semibold text-ink-muted uppercase">Admin Balansi</span>
            <Database className="h-4 w-4 text-purple-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-black text-purple-700">
            {user.credits_balance}
          </div>
          <span className="text-[11px] text-ink-muted">Cheksiz boshqaruv huquqi</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (7 cols): Pending Requests Queue */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl border border-border p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-600" />
                <h3 className="text-base font-heading font-extrabold text-ink">
                  Kutilayotgan Token Soʻrovlari ({pendingRequests.length})
                </h3>
              </div>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="py-12 text-center space-y-2 text-ink-muted">
                <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-600 opacity-80" />
                <p className="text-xs font-semibold">Barcha soʻrovlar koʻrib chiqilgan!</p>
                <p className="text-[11px]">Hozirda yangi kutilayotgan token soʻrovi yoʻq.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((req) => (
                  <div
                    key={req.requestId}
                    className="p-4 rounded-2xl bg-canvas border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-ink">{req.userName}</span>
                        <span className="font-mono text-[11px] text-ink-muted">({req.userPhone})</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-coral bg-bento-peach px-2 py-0.5 rounded-md">
                          +{req.requestedTokens} ta token
                        </span>
                        <span className="text-ink-muted font-mono text-[11px]">
                          Joriy: {req.currentBalance} ta
                        </span>
                      </div>
                      {req.note && (
                        <p className="text-xs text-ink-muted italic bg-white p-2 rounded-lg border border-border/60 mt-1">
                          "{req.note}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleApproveRequest(req)}
                        disabled={isGranting}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-bold text-xs tactile-btn shadow-2xs flex items-center gap-1"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Tasdiqlash</span>
                      </button>
                      <button
                        onClick={() => handleRejectRequest(req.requestId)}
                        disabled={isGranting}
                        className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-red-50 text-red-600 border border-red-200 font-heading font-bold text-xs tactile-btn"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Manual Grant Form */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-border p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Coins className="h-5 w-5 text-coral" />
            <h3 className="text-base font-heading font-extrabold text-ink">
              Foydalanuvchiga Token Ajratish
            </h3>
          </div>

          <form onSubmit={handleGrant} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-heading font-bold text-ink">
                Telefon raqam yoki Foydalanuvchi ID
              </label>
              <input
                type="text"
                value={targetPhone}
                onChange={(e) => setTargetPhone(e.target.value)}
                placeholder="+998901234567"
                required
                className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-border bg-canvas/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-heading font-bold text-ink">
                Qoʻshiladigan Token Miqdori
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[5, 20, 50, 100].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setTokensToGrant(num)}
                    className={`py-2 rounded-xl text-xs font-mono font-bold border transition-all ${
                      tokensToGrant === num
                        ? 'bg-coral text-white border-coral shadow-2xs'
                        : 'bg-canvas text-ink-muted hover:text-ink border-border'
                    }`}
                  >
                    +{num}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="1"
                max="5000"
                value={tokensToGrant}
                onChange={(e) => setTokensToGrant(Number(e.target.value))}
                className="w-full px-3.5 py-2 mt-2 text-xs font-mono rounded-xl border border-border bg-canvas/40 focus:bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-heading font-bold text-ink">
                Sabab yoki Izoh (Ixtiyoriy)
              </label>
              <input
                type="text"
                value={grantReason}
                onChange={(e) => setGrantReason(e.target.value)}
                placeholder="Masalan: Telegram orqali toʻlov qildi"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-border bg-canvas/40 focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={isGranting || !targetPhone.trim()}
              className="w-full py-3 px-4 rounded-xl bg-coral hover:bg-coral-dark disabled:opacity-60 text-white font-heading font-extrabold text-xs shadow-tactile transition-all tactile-btn flex items-center justify-center gap-2"
            >
              <Send className="h-4 w-4" />
              <span>{isGranting ? 'Token berilmoqda...' : 'Tokenlarni Hisobga Qoʻshish'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Bottom Section: All Platform Users Table */}
      <div className="bg-white rounded-3xl border border-border p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-coral" />
            <h3 className="text-base font-heading font-extrabold text-ink">
              Barcha Roʻyxatdan Oʻtgan Foydalanuvchilar ({usersList.length})
            </h3>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ism yoki telefon boʻyicha izlash..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-border bg-canvas/40 focus:bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-ink-muted font-mono uppercase text-[10px]">
                <th className="py-2.5 px-3">Foydalanuvchi</th>
                <th className="py-2.5 px-3">Telefon</th>
                <th className="py-2.5 px-3">Rol</th>
                <th className="py-2.5 px-3">Tokenlar (DB)</th>
                <th className="py-2.5 px-3">Sana</th>
                <th className="py-2.5 px-3 text-right">Tezkor Token</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-canvas/40 transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-semibold text-ink flex items-center gap-1.5">
                      <div className="h-5 w-5 rounded-full bg-bento-peach text-coral font-bold flex items-center justify-center text-[10px]">
                        {u.full_name ? u.full_name[0] : 'U'}
                      </div>
                      <span>{u.full_name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono text-ink-muted">
                    {u.phone_number}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full font-mono font-bold text-[10px] ${
                        u.role === 'admin'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      {u.role || 'user'}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-mono font-extrabold text-coral bg-bento-peach px-2 py-0.5 rounded">
                      {u.credits_balance} ta
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-ink-muted">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => handleQuickGrant(u.id, u.phone_number, 5)}
                        className="px-2 py-1 rounded bg-canvas hover:bg-emerald-50 text-emerald-800 border border-border text-[10px] font-bold"
                      >
                        +5
                      </button>
                      <button
                        onClick={() => handleQuickGrant(u.id, u.phone_number, 20)}
                        className="px-2 py-1 rounded bg-canvas hover:bg-coral hover:text-white text-coral border border-border text-[10px] font-bold transition-colors"
                      >
                        +20
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
