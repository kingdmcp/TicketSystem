import React, { useState, useEffect } from 'react';
import api, { socket } from '../services/api';
import {
  ShieldAlert,
  Search,
  Filter,
  Activity,
  Lock,
  UserCheck,
  CheckCircle,
  Clock,
  Radio
} from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');

  useEffect(() => {
    loadLogs();

    const handleNewLog = (entry) => {
      setLogs((prev) => [entry, ...prev]);
    };

    socket.on('audit_logged', handleNewLog);

    return () => {
      socket.off('audit_logged', handleNewLog);
    };
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getAuditLogs();
      setLogs(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (filterAction !== 'ALL' && !log.action.includes(filterAction)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        log.action.toLowerCase().includes(q) ||
        log.actorName.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        (log.entityType && log.entityType.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">System Security & Forensic Audit Logs</h1>
            <span className="px-2 py-0.5 rounded text-xs bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold">
              Lead: Malmika Wickramasinghe
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Immutable Audit Trail • RBAC Access Audits, Workflow State Transitions & WebSocket Streaming
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Real-time Forensic Stream Active</span>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search audit trail by actor, action, details, IP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none"
          />
        </div>

        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs"
        >
          <option value="ALL">All System Actions</option>
          <option value="TICKET">Ticket Events</option>
          <option value="ONBOARDING">Onboarding Events</option>
          <option value="OFFBOARDING">Offboarding Events</option>
          <option value="PROCUREMENT">Procurement Events</option>
          <option value="ASSET">Asset / CMDB Events</option>
          <option value="NETWORK">Network Discovery Events</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-700/60 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor & Role</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Forensic Details</th>
                <th className="py-3 px-4">Source IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {filteredLogs.map((log) => {
                let actionBadge = 'bg-slate-700 text-slate-300';
                if (log.action.includes('TICKET')) actionBadge = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
                if (log.action.includes('ONBOARDING')) actionBadge = 'bg-purple-500/20 text-purple-300 border-purple-500/30';
                if (log.action.includes('OFFBOARDING')) actionBadge = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
                if (log.action.includes('PROCUREMENT')) actionBadge = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
                if (log.action.includes('ASSET')) actionBadge = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
                if (log.action.includes('NETWORK')) actionBadge = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';

                return (
                  <tr key={log._id || log.id} className="hover:bg-slate-750/50">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{log.actorName}</div>
                      <div className="text-[10px] text-slate-400 uppercase font-mono">{log.actorRole}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${actionBadge}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300 text-[11px]">
                      {log.entityType} ({log.entityId || 'N/A'})
                    </td>
                    <td className="py-3 px-4 text-slate-200 text-xs max-w-md">
                      {log.details}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
