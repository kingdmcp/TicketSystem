import React, { useEffect, useState } from 'react';
import api from '../services/api';
import {
  Ticket,
  Server,
  KeyRound,
  ShieldAlert,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  Layers
} from 'lucide-react';

export default function Dashboard({ setActiveTab }) {
  const [stats, setStats] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dashRes, tktRes] = await Promise.all([
        api.getDashboardStats(),
        api.getTickets()
      ]);
      setStats(dashRes.data.data);
      setTickets(tktRes.data.data.slice(0, 5));
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center gap-2 text-indigo-400">
          <Clock className="w-5 h-5 animate-spin" />
          <span>Loading Executive Telemetry...</span>
        </div>
      </div>
    );
  }

  const { metrics, priorityDistribution, assetStatusDistribution } = stats;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Executive Command Center</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
              Systems Healthy
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry across IT Service Management, CMDB Assets, Network Discovery & Workflows
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('tickets')}
            className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 flex items-center gap-1.5 transition"
          >
            <Ticket className="w-4 h-4" />
            <span>Manage Incidents</span>
          </button>
          <button
            onClick={() => setActiveTab('floorplan')}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>View Floorplan</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-slate-800/70 border border-slate-700/60 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">SLA Resolution Rate</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{metrics.slaComplianceRate}%</span>
            <span className="text-[11px] text-emerald-400 font-medium">Target: &gt;95%</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {metrics.breachedResolution} breached incident(s) out of {metrics.totalTickets} total
          </p>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
        </div>

        <div className="p-5 rounded-xl bg-slate-800/70 border border-slate-700/60 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Open Service Desk Tickets</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{metrics.openTicketsCount}</span>
            <span className="text-[11px] text-indigo-400 font-medium">{metrics.closedOrResolvedCount} Resolved</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Auto-assigned via Priority Matrix engine
          </p>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
        </div>

        <div className="p-5 rounded-xl bg-slate-800/70 border border-slate-700/60 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">CMDB Hardware Assets</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{metrics.totalAssets}</span>
            <span className="text-[11px] text-cyan-400 font-medium">
              ${(metrics.totalAssetValue || 0).toLocaleString()} Value
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Mapped with IPs, MACs, & Floorplan Racks
          </p>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-cyan-500/10 rounded-full blur-xl pointer-events-none" />
        </div>

        <div className="p-5 rounded-xl bg-slate-800/70 border border-slate-700/60 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Active Workflows</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {metrics.activeOnboardings + metrics.activeOffboardings}
            </span>
            <span className="text-[11px] text-amber-400 font-medium">
              {metrics.activeOnboardings} Onb / {metrics.activeOffboardings} Offb
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            3-Mo delayed license tracking active
          </p>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
        </div>
      </div>

      {/* Workflow Shortcuts Banner */}
      <div className="p-5 rounded-xl bg-gradient-to-r from-indigo-950/70 via-slate-800/80 to-slate-900/90 border border-indigo-900/50 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <span>Core IT Service & Lifecycle Workflows</span>
          </h3>
          <p className="text-xs text-slate-300">
            Automated onboarding, 1-click offboarding cutoff, priority ticket routing & procurement approvals.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('onboarding')}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200"
          >
            3.1 Onboarding Flow
          </button>
          <button
            onClick={() => setActiveTab('offboarding')}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200"
          >
            3.2 Offboarding Flow
          </button>
          <button
            onClick={() => setActiveTab('procurement')}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200"
          >
            3.4 Procurement Flow
          </button>
        </div>
      </div>

      {/* Two Column Layout: Recent Incidents & Priority Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incident Queue */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-slate-800/70 border border-slate-700/60 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Ticket className="w-4 h-4 text-indigo-400" />
              <span>Active Service Desk Incidents (Vishan ITSM)</span>
            </h3>
            <button
              onClick={() => setActiveTab('tickets')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-700/60">
            {tickets.map((t) => {
              let prioBadge = 'bg-blue-500/20 text-blue-300 border-blue-500/30';
              if (t.priority === 'P1-Critical') prioBadge = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
              if (t.priority === 'P2-High') prioBadge = 'bg-amber-500/20 text-amber-300 border-amber-500/30';

              return (
                <div key={t._id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-300">{t.ticketNumber}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${prioBadge}`}>
                        {t.priority}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                        {t.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 font-medium truncate mt-1">{t.title}</p>
                    <p className="text-[11px] text-slate-400">
                      Assigned: <span className="text-slate-300">{t.assignedToName}</span> • Asset: {t.linkedAssetName}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('tickets')}
                    className="px-2.5 py-1 rounded bg-slate-700/60 hover:bg-slate-700 text-xs text-slate-300 shrink-0"
                  >
                    Details
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority Matrix Distribution */}
        <div className="p-5 rounded-xl bg-slate-800/70 border border-slate-700/60 shadow-lg space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span>Priority Matrix Distribution</span>
          </h3>
          <p className="text-xs text-slate-400">Calculated via Impact x Urgency algorithm</p>

          <div className="space-y-3 pt-2">
            {priorityDistribution.map((item) => {
              const pct = metrics.totalTickets > 0 ? Math.round((item.count / metrics.totalTickets) * 100) : 0;
              return (
                <div key={item.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-300">{item.name}</span>
                    <span className="text-slate-400">{item.count} tickets ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-700/60 space-y-2">
            <span className="text-xs font-semibold text-slate-300">CMDB Asset Health Breakdown</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {assetStatusDistribution.map((a) => (
                <div key={a.name} className="p-2 rounded bg-slate-900/60 border border-slate-700/40">
                  <div className="text-slate-400 text-[10px]">{a.name}</div>
                  <div className="text-base font-bold text-white mt-0.5">{a.count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
