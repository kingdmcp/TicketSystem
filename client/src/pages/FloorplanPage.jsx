import React, { useState, useEffect } from 'react';
import api, { socket } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  MapPin,
  Server,
  Wifi,
  Monitor,
  Activity,
  Layers,
  Search,
  ExternalLink,
  ShieldAlert,
  Ticket,
  Maximize2
} from 'lucide-react';

export default function FloorplanPage() {
  const { currentUser } = useAuth();
  const [floorplan, setFloorplan] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');

  useEffect(() => {
    loadFloorplan();

    const handleMoved = (data) => {
      setFloorplan((prev) => {
        if (!prev) return prev;
        const devices = prev.devices.map((d) =>
          d.id === data.deviceId ? { ...d, x: data.x, y: data.y } : d
        );
        return { ...prev, devices };
      });
    };

    const handleUpdated = (updated) => {
      loadFloorplan();
    };

    const handleDiscoverySync = () => {
      loadFloorplan();
    };

    socket.on('floorplan_device_moved', handleMoved);
    socket.on('floorplan_updated', handleUpdated);
    socket.on('discovery_sync_completed', handleDiscoverySync);

    return () => {
      socket.off('floorplan_device_moved', handleMoved);
      socket.off('floorplan_updated', handleUpdated);
      socket.off('discovery_sync_completed', handleDiscoverySync);
    };
  }, []);

  const loadFloorplan = async () => {
    try {
      setLoading(true);
      const res = await api.getFloorplan();
      setFloorplan(res.data.data);
      if (res.data.data.devices.length > 0 && !selectedDevice) {
        setSelectedDevice(res.data.data.devices[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Device movement handler
  const handleDeviceMove = async (deviceId, deltaX, deltaY) => {
    if (!floorplan) return;
    const dev = floorplan.devices.find((d) => d.id === deviceId);
    if (!dev) return;

    const newX = Math.max(20, Math.min(floorplan.width - 40, dev.x + deltaX));
    const newY = Math.max(20, Math.min(floorplan.height - 40, dev.y + deltaY));

    try {
      await api.updateDevicePosition({
        deviceId,
        x: newX,
        y: newY,
        actorName: currentUser.name
      });
    } catch (e) {
      console.error('Failed to move device', e);
    }
  };

  if (loading || !floorplan) {
    return (
      <div className="flex items-center justify-center h-full text-indigo-400 text-xs">
        Loading Spatial Floorplan Layers...
      </div>
    );
  }

  const filteredDevices = floorplan.devices.filter((d) => {
    if (filterType === 'ALL') return true;
    return d.type === filterType;
  });

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Spatial Campus Floorplan & Network Topology</h1>
            <span className="px-2 py-0.5 rounded text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold">
              Lead: Pabodha Senaratne
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            2D Interactive Canvas Layer • Room Polygons, Live Device Pings & One-Click CMDB Ticketing Bridge
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter device types */}
          <div className="bg-slate-800 p-1 rounded-lg border border-slate-700 flex text-xs">
            {['ALL', 'server', 'switch', 'access_point', 'workstation'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-2.5 py-1 rounded capitalize font-medium transition ${
                  filterType === t ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Floorplan Canvas and Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Spatial Canvas */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-700/80 rounded-2xl p-4 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">{floorplan.floorName}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">Scale: 1000 x 700 px</span>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Online
              </span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Degraded (&gt;80ms)
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Offline
              </span>
            </div>
          </div>

          {/* SVG Floorplan Canvas */}
          <div className="relative mt-3 w-full overflow-auto bg-[#0a0f1d] rounded-xl border border-slate-800/80">
            <svg
              viewBox={`0 0 ${floorplan.width} ${floorplan.height}`}
              className="w-full h-auto min-h-[480px] select-none"
            >
              {/* Grid Background */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* Rooms & Zones */}
              {floorplan.rooms.map((room) => {
                const isRoomSelected = selectedRoom?.id === room.id;
                return (
                  <g
                    key={room.id}
                    onClick={() => setSelectedRoom(room)}
                    className="cursor-pointer transition-all"
                  >
                    <rect
                      x={room.x}
                      y={room.y}
                      width={room.width}
                      height={room.height}
                      rx="10"
                      fill={room.color}
                      fillOpacity={isRoomSelected ? '0.35' : '0.2'}
                      stroke={isRoomSelected ? '#38bdf8' : '#334155'}
                      strokeWidth={isRoomSelected ? '2' : '1.5'}
                      strokeDasharray={room.type === 'closet' ? '4 2' : 'none'}
                    />
                    <text
                      x={room.x + 14}
                      y={room.y + 24}
                      fill="#e2e8f0"
                      fontSize="12"
                      fontWeight="bold"
                      fontFamily="Inter, sans-serif"
                    >
                      {room.name}
                    </text>
                    <text
                      x={room.x + 14}
                      y={room.y + 40}
                      fill="#94a3b8"
                      fontSize="10"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      ZONE: {room.code}
                    </text>
                  </g>
                );
              })}

              {/* Device Nodes Pins */}
              {filteredDevices.map((dev) => {
                const isSelected = selectedDevice?.id === dev.id;
                let pinColor = '#10b981'; // green
                if (dev.status === 'Degraded') pinColor = '#f59e0b';
                if (dev.status === 'Offline') pinColor = '#f43f5e';

                return (
                  <g
                    key={dev.id}
                    transform={`translate(${dev.x}, ${dev.y})`}
                    onClick={() => setSelectedDevice(dev)}
                    className="cursor-pointer group"
                  >
                    {/* Pulsing ring if selected or degraded */}
                    {(isSelected || dev.status === 'Degraded') && (
                      <circle
                        r="20"
                        fill="none"
                        stroke={pinColor}
                        strokeWidth="1.5"
                        strokeOpacity="0.7"
                        className="animate-ping"
                      />
                    )}

                    {/* Outer Circle */}
                    <circle
                      r="16"
                      fill="#0f172a"
                      stroke={isSelected ? '#38bdf8' : pinColor}
                      strokeWidth={isSelected ? '2.5' : '2'}
                      className="filter drop-shadow"
                    />

                    {/* Center Icon Indicator */}
                    <circle r="6" fill={pinColor} />

                    {/* Device Label Tooltip Badge */}
                    <rect
                      x="-50"
                      y="20"
                      width="100"
                      height="18"
                      rx="4"
                      fill="#0f172a"
                      fillOpacity="0.9"
                      stroke="#334155"
                      strokeWidth="0.8"
                    />
                    <text
                      x="0"
                      y="32"
                      textAnchor="middle"
                      fill="#f8fafc"
                      fontSize="9"
                      fontWeight="600"
                      fontFamily="Inter, sans-serif"
                    >
                      {dev.name.length > 15 ? dev.name.substring(0, 15) + '..' : dev.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
            <span>Tip: Click any room or device pin to open its configuration specifications.</span>
            <span>Subnet: 10.0.1.0/24 & 10.0.2.0/24</span>
          </div>
        </div>

        {/* Right: Selected Device Drawer & CMDB Ticketing Bridge */}
        <div className="lg:col-span-4">
          {selectedDevice ? (
            <div className="p-6 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow-xl space-y-5">
              <div className="border-b border-slate-700/60 pb-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-cyan-400">{selectedDevice.assetTag}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      selectedDevice.status === 'Online'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : selectedDevice.status === 'Degraded'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {selectedDevice.status}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-1">{selectedDevice.name}</h3>
                <div className="text-xs text-slate-400">{selectedDevice.model || 'Enterprise Node'}</div>
              </div>

              {/* Physical Floor Location & Rack */}
              <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-700/60 space-y-2 text-xs">
                <div className="text-[10px] uppercase font-bold text-slate-400">Physical Deployment</div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Room Zone:</span>
                  <span className="text-white font-medium">{selectedDevice.room}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Rack / Position:</span>
                  <span className="text-white font-medium">{selectedDevice.rack}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Coordinates:</span>
                  <span className="font-mono text-cyan-400">X: {selectedDevice.x}, Y: {selectedDevice.y}</span>
                </div>
              </div>

              {/* Move Position Controls */}
              <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-700/40 text-xs space-y-2">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Nudge Device Coordinates</span>
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    onClick={() => handleDeviceMove(selectedDevice.id, -20, 0)}
                    className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-center font-bold"
                  >
                    ← Left
                  </button>
                  <button
                    onClick={() => handleDeviceMove(selectedDevice.id, 20, 0)}
                    className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-center font-bold"
                  >
                    → Right
                  </button>
                  <button
                    onClick={() => handleDeviceMove(selectedDevice.id, 0, -20)}
                    className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-center font-bold"
                  >
                    ↑ Up
                  </button>
                  <button
                    onClick={() => handleDeviceMove(selectedDevice.id, 0, 20)}
                    className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-center font-bold"
                  >
                    ↓ Down
                  </button>
                </div>
              </div>

              {/* Network Discovery Ports & IP */}
              <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-700/60 space-y-2 text-xs">
                <div className="text-[10px] uppercase font-bold text-slate-400">Discovery Telemetry (Zabbix/NetBox)</div>
                <div className="flex justify-between">
                  <span className="text-slate-400">IP Address:</span>
                  <span className="font-mono text-cyan-300 font-semibold">{selectedDevice.ip}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">MAC Address:</span>
                  <span className="font-mono text-slate-300">{selectedDevice.mac}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Switch Port:</span>
                  <span className="font-mono text-slate-200">{selectedDevice.switchPort}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Ping Latency:</span>
                  <span className="font-mono text-emerald-400 font-bold">{selectedDevice.pingLatency} ms</span>
                </div>
              </div>

              {/* Linked Tickets & ITSM Bridge (Section 4.2) */}
              <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/40 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Ticket className="w-3.5 h-3.5 text-indigo-400" />
                    <span>ITSM Incident Bridge</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-900 text-indigo-200 font-bold">
                    {selectedDevice.activeTicketsCount || 0} Active Ticket(s)
                  </span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  Physical hardware asset IDs map directly back to the ticketing queue for immediate incident escalation.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-xl bg-slate-800/40 border border-slate-700/60 text-slate-400 text-xs">
              Select a device pin on the floorplan to view spatial telemetry.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
