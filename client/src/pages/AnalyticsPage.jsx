import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  BarChart3,
  CheckCircle,
  AlertTriangle,
  Clock,
  ShieldCheck,
  TrendingUp,
  Percent,
  DollarSign
} from 'lucide-react';

export default function AnalyticsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboardStats();
      setStats(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-full text-indigo-400 text-xs">
        Loading Performance Telemetry...
      </div>
    );
  }

  const { metrics, priorityDistribution, assetStatusDistribution, licenseUtilization } = stats;

  const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#64748b'];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">ITSM Analytics & SLA Compliance Engine</h1>
            <span className="px-2 py-0.5 rounded text-xs bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold">
              Lead: Malmika Wickramasinghe
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Service Level Agreements • Priority Resolution Matrices & Capacity Utilization Breakdown
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">SLA Compliance Rate</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-white">{metrics.slaComplianceRate}%</div>
          <p className="text-[11px] text-emerald-400 mt-1">Resolution SLA adherence rate</p>
        </div>

        <div className="p-5 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Response SLA Breaches</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-amber-300">{metrics.breachedResponse}</div>
          <p className="text-[11px] text-slate-400 mt-1">First response targets exceeded</p>
        </div>

        <div className="p-5 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Resolution SLA Breaches</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-rose-400">{metrics.breachedResolution}</div>
          <p className="text-[11px] text-slate-400 mt-1">Escalated to Senior Engineering</p>
        </div>

        <div className="p-5 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total CMDB Asset Capital</span>
            <DollarSign className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-cyan-300">
            ${(metrics.totalAssetValue || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Distributed across {metrics.totalAssets} physical assets</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Matrix Distribution Chart */}
        <div className="p-6 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <span>Incidents Categorized by Priority Matrix</span>
            </h3>
            <span className="text-xs text-slate-400">Impact x Urgency</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '12px' }}
                />
                <Bar dataKey="count" name="Ticket Count" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Asset Lifecycle Status Pie Chart */}
        <div className="p-6 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span>Hardware Asset Lifecycle States</span>
            </h3>
            <span className="text-xs text-slate-400">CMDB Portfolio</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={assetStatusDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={50}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="name"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {assetStatusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Software License Seat Utilization Bar Chart */}
        <div className="lg:col-span-2 p-6 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Software Licensing Seat Pool Allocations (ITAM)</span>
            </h3>
            <span className="text-xs text-slate-400">Compliance & Reclaim Capacity</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={licenseUtilization} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="allocated" name="Allocated Seats" fill="#6366f1" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="available" name="Available Seats" fill="#10b981" stackId="a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
