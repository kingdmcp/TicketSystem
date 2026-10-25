import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Ticket,
  Server,
  BookOpen,
  MapPin,
  Radio,
  UserPlus,
  UserMinus,
  ShoppingCart,
  BarChart3,
  ShieldAlert,
  ArrowRight,
  Command,
  LayoutDashboard,
  CornerDownLeft,
  X
} from 'lucide-react';
import api from '../services/api';

export default function CommandPalette({ isOpen, onClose, setActiveTab }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [tickets, setTickets] = useState([]);
  const [assets, setAssets] = useState([]);
  const [articles, setArticles] = useState([]);
  const inputRef = useRef(null);

  // Load telemetry data for universal indexing
  useEffect(() => {
    if (isOpen) {
      Promise.all([
        api.getTickets().catch(() => ({ data: { data: [] } })),
        api.getAssets().catch(() => ({ data: { data: [] } })),
        api.getKBArticles().catch(() => ({ data: { data: [] } }))
      ]).then(([tRes, aRes, kRes]) => {
        if (tRes.data?.data) setTickets(tRes.data.data);
        if (aRes.data?.data) setAssets(aRes.data.data);
        if (kRes.data?.data) setArticles(kRes.data.data);
      });
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Global Keyboard listener for Ctrl+K / Cmd+K and Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(true); // Signal to open
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Navigation Items
  const navigationItems = [
    { id: 'dashboard', title: 'Executive Dashboard', category: 'Navigation', icon: LayoutDashboard, desc: 'Real-time SLA telemetry & KPI counters' },
    { id: 'tickets', title: 'ITSM Service Desk Tickets', category: 'Navigation', icon: Ticket, desc: 'Manage incidents, P1-P4 priorities & SLA timers' },
    { id: 'assets', title: 'CMDB Hardware Assets', category: 'Navigation', icon: Server, desc: 'Racks, switches, servers, workstations & serials' },
    { id: 'floorplan', title: 'Spatial Floorplan & Map', category: 'Navigation', icon: MapPin, desc: 'Interactive coordinate pin drops & network nodes' },
    { id: 'discovery', title: 'Network Discovery (Python)', category: 'Navigation', icon: Radio, desc: 'SNMP MIBs, ARP tables, ping latencies & NetBox sync' },
    { id: 'onboarding', title: 'Employee Onboarding Flow', category: 'Navigation', icon: UserPlus, desc: 'Workflow 3.1 & Department Transfers' },
    { id: 'offboarding', title: 'Offboarding & QA Check', category: 'Navigation', icon: UserMinus, desc: 'Workflow 3.2 & 3-Month Delayed License Revocation' },
    { id: 'procurement', title: 'Procurement Flow', category: 'Navigation', icon: ShoppingCart, desc: 'Workflow 3.4 Four-Stage Approvals & Delivery Check-in' },
    { id: 'kb', title: 'Knowledge Base', category: 'Navigation', icon: BookOpen, desc: 'Search documentation & AI KB Assistant' },
    { id: 'analytics', title: 'Analytics & SLA Reports', category: 'Navigation', icon: BarChart3, desc: 'Resolution trends, compliance rates & charts' },
    { id: 'audit-logs', title: 'Security Audit Logs', category: 'Navigation', icon: ShieldAlert, desc: 'Immutable timeline of user actions & IP addresses' }
  ];

  // Filter items
  const cleanQ = query.trim().toLowerCase();

  const filteredNav = navigationItems.filter(item =>
    item.title.toLowerCase().includes(cleanQ) || item.desc.toLowerCase().includes(cleanQ)
  );

  const filteredTickets = tickets.filter(t =>
    t.ticketNumber?.toLowerCase().includes(cleanQ) ||
    t.title?.toLowerCase().includes(cleanQ) ||
    t.category?.toLowerCase().includes(cleanQ)
  ).slice(0, 4);

  const filteredAssets = assets.filter(a =>
    a.assetTag?.toLowerCase().includes(cleanQ) ||
    a.name?.toLowerCase().includes(cleanQ) ||
    a.ipAddress?.toLowerCase().includes(cleanQ)
  ).slice(0, 4);

  const filteredArticles = articles.filter(k =>
    k.title?.toLowerCase().includes(cleanQ) ||
    k.category?.toLowerCase().includes(cleanQ)
  ).slice(0, 3);

  // Unified Results List
  const results = [];
  filteredNav.forEach(n => results.push({ type: 'nav', ...n }));
  filteredTickets.forEach(t => results.push({
    type: 'ticket',
    id: 'tickets',
    title: `${t.ticketNumber}: ${t.title}`,
    desc: `Priority: ${t.priority} • Status: ${t.status} • Assigned: ${t.assignedToName || 'Unassigned'}`,
    icon: Ticket,
    badge: t.priority
  }));
  filteredAssets.forEach(a => results.push({
    type: 'asset',
    id: 'assets',
    title: `${a.assetTag}: ${a.name}`,
    desc: `IP: ${a.ipAddress || 'DHCP'} • Category: ${a.category} • Rack: ${a.rackLocation || 'Building A'}`,
    icon: Server,
    badge: a.status
  }));
  filteredArticles.forEach(k => results.push({
    type: 'kb',
    id: 'kb',
    title: `KB: ${k.title}`,
    desc: `Category: ${k.category} • Solution Guide`,
    icon: BookOpen,
    badge: 'KB Article'
  }));

  // Handle key navigation within results
  const handleInputKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      selectResult(results[selectedIndex]);
    }
  };

  const selectResult = (item) => {
    setActiveTab(item.id);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-start justify-center pt-20 p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-slate-900 border border-indigo-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-900/95 sticky top-0 z-10">
          <Search className="w-5 h-5 text-indigo-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Type a command or search tickets, assets, IPs, articles (e.g. 'INC', 'Server', 'Floorplan')..."
            className="w-full bg-transparent text-white placeholder-slate-400 text-sm focus:outline-none"
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400 font-mono">
              ESC
            </span>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Results Container */}
        <div className="overflow-y-auto p-2 divide-y divide-slate-850">
          {results.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No matching commands, tickets, or assets found for "{query}".
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((item, idx) => {
                const Icon = item.icon;
                const isSelected = idx === selectedIndex;
                return (
                  <div
                    key={`${item.type}-${idx}`}
                    onClick={() => selectResult(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition ${
                      isSelected
                        ? 'bg-indigo-600/30 border border-indigo-500/60 text-white'
                        : 'hover:bg-slate-800/60 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white truncate flex items-center gap-2">
                          <span>{item.title}</span>
                          {item.badge && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-slate-800 border border-slate-700 text-cyan-300">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {item.desc}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 text-slate-400">
                      {isSelected && (
                        <span className="text-[10px] flex items-center gap-1 font-mono text-indigo-300">
                          Jump <CornerDownLeft className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="p-2.5 px-4 bg-slate-950 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Universal Spotlight</span>
            <Command className="w-3 h-3 text-indigo-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
