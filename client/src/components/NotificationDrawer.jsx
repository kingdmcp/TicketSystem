import React, { useState, useEffect } from 'react';
import { socket } from '../services/api';
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Clock,
  KeyRound,
  Radio,
  X,
  ExternalLink,
  Trash2,
  CheckCheck
} from 'lucide-react';

export default function NotificationDrawer({ isOpen, setIsOpen, setActiveTab }) {
  const [notifications, setNotifications] = useState([
    {
      id: 'notif-1',
      title: 'Resolution SLA Approaching Target',
      message: 'Incident INC-2026-001 (Core Database Outage) is within 1 hour of Resolution SLA deadline.',
      type: 'sla_warning',
      timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
      read: false,
      tab: 'tickets'
    },
    {
      id: 'notif-2',
      title: 'SNMP Discovery Sync Completed',
      message: 'Active subnet sweep polled 7 devices across VLANs 10, 20 & 30.',
      type: 'discovery',
      timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
      read: false,
      tab: 'discovery'
    },
    {
      id: 'notif-3',
      title: '3-Month License Retention Reminder',
      message: 'Marcus Thorne offboarding archive period elapsed. Software licenses ready for final revocation.',
      type: 'license',
      timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
      read: true,
      tab: 'offboarding'
    }
  ]);

  const [filter, setFilter] = useState('all'); // 'all' | 'unread' | 'sla'

  useEffect(() => {
    const handleTicketCreated = (ticket) => {
      setNotifications(prev => [
        {
          id: `notif-${Date.now()}`,
          title: `New Incident Logged: ${ticket.ticketNumber}`,
          message: `${ticket.title} (${ticket.priority}) assigned to ${ticket.assignedToName || 'Helpdesk'}.`,
          type: 'ticket',
          timestamp: new Date().toISOString(),
          read: false,
          tab: 'tickets'
        },
        ...prev
      ]);
    };

    const handleSlaWarning = (data) => {
      setNotifications(prev => [
        {
          id: `notif-${Date.now()}`,
          title: `SLA Alert: ${data.ticketNumber}`,
          message: data.message,
          type: 'sla_warning',
          timestamp: new Date().toISOString(),
          read: false,
          tab: 'tickets'
        },
        ...prev
      ]);
    };

    const handleLicenseDue = (data) => {
      setNotifications(prev => [
        {
          id: `notif-${Date.now()}`,
          title: 'Delayed License Revocation Ready',
          message: data.message,
          type: 'license',
          timestamp: new Date().toISOString(),
          read: false,
          tab: 'offboarding'
        },
        ...prev
      ]);
    };

    socket.on('ticket_created', handleTicketCreated);
    socket.on('sla_warning', handleSlaWarning);
    socket.on('license_revocation_due', handleLicenseDue);

    return () => {
      socket.off('ticket_created', handleTicketCreated);
      socket.off('sla_warning', handleSlaWarning);
      socket.off('license_revocation_due', handleLicenseDue);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const handleItemClick = (notif) => {
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    if (notif.tab && setActiveTab) {
      setActiveTab(notif.tab);
      setIsOpen(false);
    }
  };

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'sla') return n.type === 'sla_warning';
    return true;
  });

  return (
    <>
      {/* Bell Button (Rendered directly in Navbar via trigger or exported component) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 hover:text-white transition"
        title="Real-time Alerts & Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Slide-over Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">System Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-semibold">
                    {unreadCount} unread
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sub-Header Actions & Filter Tabs */}
            <div className="p-3 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                    filter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All ({notifications.length})
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                    filter === 'unread' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Unread ({unreadCount})
                </button>
                <button
                  onClick={() => setFilter('sla')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                    filter === 'sla' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  SLA Warnings
                </button>
              </div>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-3 h-3" /> Read all
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-[10px] text-slate-500 hover:text-rose-400 flex items-center gap-1"
                    title="Clear list"
                  >
                    <Trash2 className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>
            </div>

            {/* Notification Items List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {filtered.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs space-y-2">
                  <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
                  <div className="font-semibold text-slate-300">You're all caught up!</div>
                  <div className="text-[11px]">No active notifications for the selected filter.</div>
                </div>
              ) : (
                filtered.map(notif => {
                  let icon = <Clock className="w-4 h-4 text-indigo-400" />;
                  let border = 'border-slate-800';
                  if (notif.type === 'sla_warning') {
                    icon = <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />;
                    border = 'border-rose-500/40 bg-rose-950/15';
                  } else if (notif.type === 'license') {
                    icon = <KeyRound className="w-4 h-4 text-amber-400 shrink-0" />;
                    border = 'border-amber-500/40 bg-amber-950/15';
                  } else if (notif.type === 'discovery') {
                    icon = <Radio className="w-4 h-4 text-cyan-400 shrink-0" />;
                    border = 'border-cyan-500/40 bg-cyan-950/15';
                  }

                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleItemClick(notif)}
                      className={`p-3 rounded-xl border ${border} transition cursor-pointer hover:border-indigo-500/60 relative ${
                        !notif.read ? 'bg-slate-850' : 'bg-slate-900/60 opacity-80'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5">{icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-semibold text-white truncate">
                              {notif.title}
                            </span>
                            {!notif.read && (
                              <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                            {notif.message}
                          </p>
                          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                            <span>{new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {notif.tab && (
                              <span className="text-indigo-400 font-semibold flex items-center gap-0.5 hover:underline">
                                View in {notif.tab} <ExternalLink className="w-2.5 h-2.5" />
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-800 text-center text-[10px] text-slate-400 bg-slate-950">
              Nexus ITSM Real-time Event Stream (Socket.io)
            </div>
          </div>
        </div>
      )}
    </>
  );
}
