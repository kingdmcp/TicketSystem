import React, { useEffect, useState } from 'react';
import { socket } from '../services/api';
import { Bell, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

export default function NotificationToast() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Listen for WebSocket events
    const handleNotification = (notif) => {
      addToast(notif.type || 'info', notif.title, notif.message);
    };

    const handleSlaWarning = (slaData) => {
      addToast('warning', `SLA Alert: ${slaData.ticketNumber}`, slaData.message);
    };

    const handleLicenseRevocation = (licData) => {
      addToast('info', '3-Month License Milestone', licData.message);
    };

    socket.on('notification', handleNotification);
    socket.on('sla_warning', handleSlaWarning);
    socket.on('license_revocation_due', handleLicenseRevocation);

    return () => {
      socket.off('notification', handleNotification);
      socket.off('sla_warning', handleSlaWarning);
      socket.off('license_revocation_due', handleLicenseRevocation);
    };
  }, []);

  const addToast = (type, title, message) => {
    const id = Date.now() + Math.random();
    setNotifications((prev) => [{ id, type, title, message, timestamp: new Date() }, ...prev.slice(0, 4)]);

    // Auto dismiss after 6 seconds
    setTimeout(() => {
      removeToast(id);
    }, 6000);
  };

  const removeToast = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none">
      {notifications.map((n) => {
        let borderClass = 'border-slate-700 bg-slate-800 text-slate-100';
        let icon = <Info className="w-5 h-5 text-indigo-400 shrink-0" />;

        if (n.type === 'warning') {
          borderClass = 'border-amber-500/50 bg-slate-900/95 text-amber-200';
          icon = <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
        } else if (n.type === 'success') {
          borderClass = 'border-emerald-500/50 bg-slate-900/95 text-emerald-200';
          icon = <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />;
        }

        return (
          <div
            key={n.id}
            className={`pointer-events-auto p-3.5 rounded-lg border shadow-xl backdrop-blur flex items-start gap-3 transition-all animate-in slide-in-from-right duration-200 ${borderClass}`}
          >
            {icon}
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-semibold tracking-wide uppercase">{n.title}</h4>
              <p className="text-xs mt-0.5 text-slate-300 line-clamp-3">{n.message}</p>
            </div>
            <button
              onClick={() => removeToast(n.id)}
              className="text-slate-400 hover:text-slate-100 shrink-0 ml-1 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
