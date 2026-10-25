import React from 'react';
import {
  LayoutDashboard,
  Ticket,
  BookOpen,
  Server,
  KeyRound,
  UserPlus,
  UserMinus,
  ShoppingCart,
  MapPin,
  Radio,
  BarChart3,
  ShieldAlert
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const navSections = [
    {
      title: 'OVERVIEW',
      items: [
        { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard }
      ]
    },
    {
      title: 'ITSM HELPDESK (Vishan)',
      items: [
        { id: 'tickets', label: 'Service Desk Tickets', icon: Ticket, badge: 'SLA' },
        { id: 'kb', label: 'Knowledge Base', icon: BookOpen }
      ]
    },
    {
      title: 'ITAM & CMDB (Harindy)',
      items: [
        { id: 'assets', label: 'Hardware Assets', icon: Server },
        { id: 'licenses', label: 'Software Licenses', icon: KeyRound, badge: '3-Mo' }
      ]
    },
    {
      title: 'SPATIAL DISCOVERY (Pabodha)',
      items: [
        { id: 'floorplan', label: 'Spatial Floorplan', icon: MapPin },
        { id: 'discovery', label: 'Network Discovery', icon: Radio, badge: 'Python' }
      ]
    },
    {
      title: 'LIFECYCLE WORKFLOWS',
      items: [
        { id: 'onboarding', label: 'Employee Onboarding', icon: UserPlus },
        { id: 'offboarding', label: 'Offboarding & QA Check', icon: UserMinus },
        { id: 'procurement', label: 'Procurement Flow', icon: ShoppingCart }
      ]
    },
    {
      title: 'SECURITY & AUDIT (Malmika)',
      items: [
        { id: 'analytics', label: 'Analytics & SLA Reports', icon: BarChart3 },
        { id: 'audit-logs', label: 'Security Audit Logs', icon: ShieldAlert }
      ]
    }
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900/60 backdrop-blur shrink-0 flex flex-col justify-between h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="py-4 px-3 space-y-6">
        {navSections.map((sec, idx) => (
          <div key={idx}>
            <div className="px-3 mb-2 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              {sec.title}
            </div>
            <div className="space-y-1">
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                          isActive
                            ? 'bg-indigo-700 text-indigo-100'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400 text-center">
        Enterprise ITSM/ITAM System © 2026
      </div>
    </aside>
  );
}
