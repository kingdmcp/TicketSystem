import React, { useState, useEffect } from 'react';
import api, { socket } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Radio,
  RefreshCw,
  Server,
  Activity,
  CheckCircle,
  AlertTriangle,
  Clock,
  Terminal,
  Shield,
  Zap
} from 'lucide-react';

export default function NetworkDiscoveryPage() {
  const { currentUser } = useAuth();
  const [assets, setAssets] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [lastScanMessage, setLastScanMessage] = useState(null);

  useEffect(() => {
    loadDiscoveryData();

    const handleSync = (data) => {
      setLastScanMessage(`Synchronized ${data.updatedCount || 'all'} devices via ${data.source}`);
      loadDiscoveryData();
    };

    socket.on('discovery_sync_completed', handleSync);
    socket.on('network_scan_completed', handleSync);

    return () => {
      socket.off('discovery_sync_completed', handleSync);
      socket.off('network_scan_completed', handleSync);
    };
  }, []);

  const loadDiscoveryData = async () => {
    try {
      const res = await api.getAssets();
      setAssets(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTriggerScan = async () => {
    try {
      setScanning(true);
      const res = await api.triggerDiscoveryScan({
        actorName: currentUser.name
      });
      setLastScanMessage(res.data.message);
      loadDiscoveryData();
    } catch (err) {
      alert('Failed to execute scan');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Network Discovery & IPAM Telemetry</h1>
            <span className="px-2 py-0.5 rounded text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold">
              Lead: Pabodha Senaratne
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Zabbix / NetBox / SNMP MIB Polling Integration • Port Mapping, MAC Bridge Tables & Subnet Discovery
          </p>
        </div>

        <button
          disabled={scanning}
          onClick={handleTriggerScan}
          className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-cyan-600/30 flex items-center gap-2 transition"
        >
          <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
          <span>{scanning ? 'Scanning Subnets...' : 'Trigger Network Discovery Scan'}</span>
        </button>
      </div>

      {/* Integration Reference Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-2">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
            <Radio className="w-4 h-4" />
            <span>Python Discovery Agent</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Continuous background script in <code className="text-cyan-300 font-mono">python/discovery_service.py</code> simulating active ICMP ping sweeps and SNMP MIB queries.
          </p>
          <div className="text-[10px] text-slate-400 font-mono">Run: python discovery_service.py --once</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <Server className="w-4 h-4" />
            <span>NetBox IPAM Tracing</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Subnet address space allocated across VLAN 1 (Mgmt), VLAN 10 (Servers), VLAN 20 (Engineering), VLAN 30 (Wi-Fi), and VLAN 40 (HR).
          </p>
          <div className="text-[10px] text-emerald-400 font-medium">Auto-populates CMDB Switch Ports</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <Activity className="w-4 h-4" />
            <span>Zabbix SNMP Telemetry</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Monitors round-trip ping latency and interface status. Flags devices with degraded connectivity (&gt;80ms latency) automatically.
          </p>
          <div className="text-[10px] text-amber-300 font-medium">Real-Time WebSocket Emission</div>
        </div>
      </div>

      {/* Status banner */}
      {lastScanMessage && (
        <div className="p-3.5 rounded-lg bg-cyan-950/40 border border-cyan-500/40 text-cyan-200 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{lastScanMessage}</span>
        </div>
      )}

      {/* Discovered Subnet Devices Table */}
      <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700/60 flex items-center justify-between text-xs">
          <span className="font-bold text-white uppercase tracking-wider text-[11px]">
            Live Discovered Devices ({assets.length} hosts)
          </span>
          <span className="text-slate-400 font-mono text-[11px]">Subnet: 10.0.1.0/24, 10.0.2.0/24</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-700/60 text-slate-400 uppercase text-[10px] font-semibold">
              <tr>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">MAC Address</th>
                <th className="py-3 px-4">Hostname / Device Name</th>
                <th className="py-3 px-4">Switch Port</th>
                <th className="py-3 px-4">VLAN</th>
                <th className="py-3 px-4">Ping Latency</th>
                <th className="py-3 px-4">Zabbix Health</th>
                <th className="py-3 px-4">Last Discovered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {assets.map((ast) => (
                <tr key={ast._id} className="hover:bg-slate-750/50">
                  <td className="py-3 px-4 font-mono font-bold text-cyan-300">{ast.ipAddress}</td>
                  <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">{ast.macAddress}</td>
                  <td className="py-3 px-4 font-medium text-white">{ast.name}</td>
                  <td className="py-3 px-4 font-mono text-slate-300">{ast.switchPort}</td>
                  <td className="py-3 px-4 font-mono text-slate-400">VLAN {ast.vlan || 1}</td>
                  <td className="py-3 px-4 font-mono font-bold">
                    <span className={ast.health === 'Degraded' ? 'text-amber-400' : 'text-emerald-400'}>
                      {ast.pingLatency || 1.2} ms
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        ast.health === 'Online'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {ast.health || 'Online'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {ast.lastDiscovered ? new Date(ast.lastDiscovered).toLocaleTimeString() : 'Just now'}
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
