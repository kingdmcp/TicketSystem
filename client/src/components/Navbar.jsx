import React, { useState, useEffect } from 'react';
import { useAuth, PERSONAS } from '../context/AuthContext';
import { socket } from '../services/api';
import NotificationDrawer from './NotificationDrawer';
import {
  ShieldCheck,
  UserCheck,
  ChevronDown,
  Radio,
  Activity,
  Sparkles,
  Search,
  Command,
  BookOpen,
  HelpCircle
} from 'lucide-react';

export default function Navbar({
  onOpenCommandPalette,
  onOpenTour,
  isNotificationOpen,
  setIsNotificationOpen,
  setActiveTab
}) {
  const { currentUser, switchPersona } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [connected, setConnected] = useState(socket.connected);

  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30 flex items-center justify-between px-6">
      {/* Brand & Platform Name */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 font-bold text-white text-base">
          ⚡
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-tight text-white">NEXUS ITSM & CMDB</span>
            <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-indigo-950 text-indigo-300 border border-indigo-800/60 rounded">
              v2.4 Enterprise
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Integrated Service Desk, ITAM, CMDB & Spatial Discovery</p>
        </div>
      </div>

      {/* Center Search Pill & Shortcuts */}
      <div className="hidden md:flex items-center gap-3">
        {/* Spotlight Command Bar Trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-400 hover:text-slate-200 text-xs transition shadow-inner group"
          title="Search or press Ctrl + K"
        >
          <Search className="w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-300" />
          <span className="pr-4">Search tickets, assets, commands...</span>
          <div className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 font-mono">
            <span>Ctrl</span>
            <span>K</span>
          </div>
        </button>

        {/* Guided Tour Trigger Button */}
        <button
          onClick={onOpenTour}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-950 to-purple-950 hover:from-indigo-900 hover:to-purple-900 border border-indigo-500/40 text-indigo-200 text-xs font-semibold shadow transition"
          title="Start interactive teacher/evaluator walkthrough"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          <span>Quick Tour</span>
        </button>
      </div>

      {/* Right Controls: Notifications & Persona Switcher */}
      <div className="flex items-center gap-3">
        {/* Middle Status Indicators */}
        <div className="hidden xl:flex items-center gap-2 text-xs mr-2">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-300">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span className="text-[10px] font-medium">{connected ? 'WebSockets Live' : 'Reconnecting...'}</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-300">
            <Activity className="w-3 h-3 text-cyan-400" />
            <span className="text-[10px]">SLA Monitor</span>
          </div>
        </div>

        {/* Real-time Notification Bell Drawer */}
        <NotificationDrawer
          isOpen={isNotificationOpen}
          setIsOpen={setIsNotificationOpen}
          setActiveTab={setActiveTab}
        />

        {/* Persona / Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 transition"
          >
            <div className={`w-7 h-7 rounded-md ${currentUser.color} text-white font-bold text-xs flex items-center justify-center`}>
              {currentUser.avatar}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-semibold text-slate-200">{currentUser.name}</div>
              <div className="text-[10px] text-slate-400">{currentUser.title}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl py-2 z-50">
              <div className="px-3 py-1.5 border-b border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-indigo-400" /> Switch Active Persona
                </span>
              </div>
              <div className="max-h-80 overflow-y-auto py-1">
                {PERSONAS.map((p) => {
                  const isSelected = p.id === currentUser.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        switchPersona(p.id);
                        setMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center gap-3 transition ${
                        isSelected ? 'bg-indigo-600/20 border-l-2 border-indigo-500' : 'hover:bg-slate-800/60'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded ${p.color} text-white font-bold text-[10px] flex items-center justify-center shrink-0`}>
                        {p.avatar}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-slate-200 truncate">{p.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{p.title}</div>
                      </div>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
