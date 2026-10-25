import React, { useState, useEffect } from 'react';
import api, { socket } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Server,
  Plus,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Activity,
  Layers,
  HardDrive,
  Cpu,
  Trash2,
  Edit2,
  Download,
  Wifi,
  Laptop
} from 'lucide-react';

export default function AssetsPage() {
  const { currentUser } = useAuth();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals & detail view
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Laptop');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [macAddress, setMacAddress] = useState('');
  const [switchPort, setSwitchPort] = useState('');
  const [vlan, setVlan] = useState(20);
  const [room, setRoom] = useState('Engineering Bay A');
  const [rack, setRack] = useState('Desk 10');
  const [cost, setCost] = useState(1500);

  useEffect(() => {
    loadAssets();

    const handleCreated = () => loadAssets();
    const handleUpdated = () => loadAssets();

    socket.on('asset_created', handleCreated);
    socket.on('asset_updated', handleUpdated);

    return () => {
      socket.off('asset_created', handleCreated);
      socket.off('asset_updated', handleUpdated);
    };
  }, []);

  const loadAssets = async () => {
    try {
      setLoading(true);
      const res = await api.getAssets();
      setAssets(res.data.data);
      if (res.data.data.length > 0 && !selectedAsset) {
        setSelectedAsset(res.data.data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAsset = async (e) => {
    e.preventDefault();
    try {
      await api.createAsset({
        name,
        category,
        model,
        serialNumber,
        ipAddress,
        macAddress,
        switchPort,
        vlan,
        room,
        rack,
        cost,
        status: 'In Use',
        actorName: currentUser.name
      });
      setShowCreateModal(false);
      resetForm();
      loadAssets();
    } catch (err) {
      alert('Failed to register asset: ' + (err.response?.data?.message || err.message));
    }
  };

  const resetForm = () => {
    setName('');
    setModel('');
    setSerialNumber('');
    setIpAddress('');
    setMacAddress('');
    setSwitchPort('');
  };

  const handleStatusChange = async (assetId, newStatus) => {
    try {
      await api.updateAsset(assetId, {
        status: newStatus,
        actorName: currentUser.name
      });
      loadAssets();
    } catch (err) {
      alert('Failed to update asset status');
    }
  };

  const exportAssetsToCSV = () => {
    if (assets.length === 0) {
      alert('No assets available to export.');
      return;
    }
    const headers = ['Asset Tag', 'Asset Name', 'Category', 'Status', 'IP Address', 'MAC Address', 'VLAN', 'Room', 'Rack', 'Cost (USD)', 'Created At'];
    const rows = filteredAssets.map(a => [
      a.assetTag,
      `"${(a.name || '').replace(/"/g, '""')}"`,
      a.category,
      a.status,
      a.ipAddress || 'DHCP',
      a.macAddress || 'N/A',
      a.vlan || '20',
      `"${a.room || ''}"`,
      `"${a.rack || ''}"`,
      a.cost || 0,
      a.createdAt ? new Date(a.createdAt).toLocaleString() : ''
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CMDB_Assets_Inventory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredAssets = assets.filter((a) => {
    if (categoryFilter !== 'ALL' && a.category !== categoryFilter) return false;
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        a.name.toLowerCase().includes(q) ||
        a.assetTag.toLowerCase().includes(q) ||
        a.ipAddress.toLowerCase().includes(q) ||
        a.macAddress.toLowerCase().includes(q) ||
        a.room.toLowerCase().includes(q)
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
            <h1 className="text-2xl font-bold tracking-tight text-white">ITAM & CMDB Hardware Repository</h1>
            <span className="px-2 py-0.5 rounded text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
              Lead: Harindy Jayasuriya
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Central Configuration Management Database • Port Tracing, Spatial Racks & Lifecycle Tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportAssetsToCSV}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
            title="Download CSV spreadsheet of current hardware inventory"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export CMDB CSV</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Register New CMDB Asset</span>
          </button>
        </div>
      </div>

      {/* Quick Category Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Quick Presets:</span>
        <button
          onClick={() => { setCategoryFilter('ALL'); setStatusFilter('ALL'); setSearchQuery(''); }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            categoryFilter === 'ALL'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/60'
          }`}
        >
          All Assets ({assets.length})
        </button>
        <button
          onClick={() => setCategoryFilter('Server')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
            categoryFilter === 'Server'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-slate-800/80 text-indigo-300 hover:text-white border border-indigo-500/30'
          }`}
        >
          <Server className="w-3.5 h-3.5 text-indigo-400" />
          Servers ({assets.filter(a => a.category === 'Server').length})
        </button>
        <button
          onClick={() => setCategoryFilter('Laptop')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
            categoryFilter === 'Laptop'
              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
              : 'bg-slate-800/80 text-cyan-300 hover:text-white border border-cyan-500/30'
          }`}
        >
          <Laptop className="w-3.5 h-3.5 text-cyan-400" />
          Laptops & Workstations
        </button>
        <button
          onClick={() => setCategoryFilter('Switch')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
            categoryFilter === 'Switch'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
              : 'bg-slate-800/80 text-amber-300 hover:text-white border border-amber-500/30'
          }`}
        >
          <Wifi className="w-3.5 h-3.5 text-amber-400" />
          Switches & APs
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by tag, name, IP, MAC address, room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs"
        >
          <option value="ALL">All Categories</option>
          <option value="Server">Servers</option>
          <option value="Switch">Switches</option>
          <option value="Access Point">Access Points</option>
          <option value="Workstation">Workstations</option>
          <option value="Laptop">Laptops</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs"
        >
          <option value="ALL">All Lifecycle States</option>
          <option value="In Use">In Use</option>
          <option value="Planned">Planned / Stock</option>
          <option value="In Repair">In Repair</option>
          <option value="Retired">Retired</option>
        </select>
      </div>

      {/* Asset Grid & Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Table / List View */}
        <div className="lg:col-span-8 bg-slate-800/70 border border-slate-700/60 rounded-xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-slate-700/60 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Asset Tag / Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">IP & MAC</th>
                  <th className="py-3 px-4">Switch Port</th>
                  <th className="py-3 px-4">Location (Room / Rack)</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {filteredAssets.map((asset) => {
                  const isSelected = selectedAsset?._id === asset._id;
                  let statusBadge = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
                  if (asset.status === 'In Repair') statusBadge = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
                  if (asset.status === 'Retired') statusBadge = 'bg-slate-500/20 text-slate-400 border-slate-500/30';
                  if (asset.status === 'Planned') statusBadge = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';

                  return (
                    <tr
                      key={asset._id}
                      onClick={() => setSelectedAsset(asset)}
                      className={`hover:bg-slate-700/50 cursor-pointer transition ${
                        isSelected ? 'bg-indigo-950/40 border-l-4 border-indigo-500' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-200">{asset.assetTag}</div>
                        <div className="text-slate-400 text-[11px] font-medium">{asset.name}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-300">{asset.category}</td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        <div className="text-slate-200">{asset.ipAddress}</div>
                        <div className="text-slate-500">{asset.macAddress}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-300">
                        {asset.switchPort} (VLAN {asset.vlan})
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        <div>{asset.room}</div>
                        <div className="text-[10px] text-slate-500">{asset.rack}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${statusBadge}`}>
                          {asset.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Asset Detail Drawer */}
        <div className="lg:col-span-4">
          {selectedAsset ? (
            <div className="p-6 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow-xl space-y-5">
              <div className="border-b border-slate-700/60 pb-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-emerald-400">{selectedAsset.assetTag}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-700 text-slate-300 uppercase font-bold">
                    {selectedAsset.category}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-1">{selectedAsset.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{selectedAsset.model}</p>
              </div>

              {/* Lifecycle State Controls */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Update Lifecycle State
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['In Use', 'Planned', 'In Repair', 'Retired'].map((st) => (
                    <button
                      key={st}
                      onClick={() => handleStatusChange(selectedAsset._id, st)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
                        selectedAsset.status === st
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-750'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hardware Specifications */}
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-700/60 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Serial Number:</span>
                  <span className="font-mono text-slate-200">{selectedAsset.serialNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">IP Address:</span>
                  <span className="font-mono text-cyan-300">{selectedAsset.ipAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">MAC Address:</span>
                  <span className="font-mono text-slate-300">{selectedAsset.macAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Switch Port:</span>
                  <span className="font-mono text-slate-200">{selectedAsset.switchPort}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Location:</span>
                  <span className="text-slate-200">{selectedAsset.room}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Rack / Desk:</span>
                  <span className="text-slate-200">{selectedAsset.rack}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Estimated Value:</span>
                  <span className="text-emerald-400 font-semibold">${Number(selectedAsset.cost).toLocaleString()}</span>
                </div>
              </div>

              {/* Real-time Discovery Telemetry */}
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-700/60 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Ping Latency:</span>
                  <span className="font-mono font-bold text-cyan-400">{selectedAsset.pingLatency || 1.2} ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Last Discovered:</span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(selectedAsset.lastDiscovered).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center rounded-xl bg-slate-800/40 border border-slate-700/60 text-slate-400 text-xs">
              Select an asset from the table to view configuration items.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Register Asset */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-400" />
                <span>Register Hardware in CMDB</span>
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateAsset} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Asset Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Core App Server 02"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
                  >
                    <option value="Server">Server</option>
                    <option value="Switch">Switch</option>
                    <option value="Access Point">Access Point</option>
                    <option value="Workstation">Workstation</option>
                    <option value="Laptop">Laptop</option>
                    <option value="Monitor">Monitor / Peripheral</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Hardware Model & Specs</label>
                <input
                  type="text"
                  placeholder="e.g. Dell PowerEdge R750 2x Xeon 128GB"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">IP Address</label>
                  <input
                    type="text"
                    placeholder="10.0.1.15"
                    value={ipAddress}
                    onChange={(e) => setIpAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">MAC Address</label>
                  <input
                    type="text"
                    placeholder="00:1A:2B:3C:4D:99"
                    value={macAddress}
                    onChange={(e) => setMacAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Switch Port & VLAN</label>
                  <input
                    type="text"
                    placeholder="Gi1/0/12"
                    value={switchPort}
                    onChange={(e) => setSwitchPort(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Room Location</label>
                  <input
                    type="text"
                    placeholder="Server Room / Data Center A"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                >
                  Register CMDB Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
