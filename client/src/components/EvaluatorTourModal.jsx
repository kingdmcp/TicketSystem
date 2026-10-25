import React, { useState } from 'react';
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  Ticket,
  Server,
  MapPin,
  Radio,
  Layers,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Laptop
} from 'lucide-react';

export default function EvaluatorTourModal({ isOpen, onClose, setActiveTab }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: 'Welcome to NEXUS ITSM & CMDB Platform',
      badge: 'Platform Architecture Overview',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
      icon: Sparkles,
      iconColor: 'text-indigo-400',
      heading: 'Integrated ITSM, CMDB, Network Discovery & Enterprise Lifecycle',
      summary: 'Built on the MERN stack with Socket.io real-time websockets, a standalone Python SNMP network discovery daemon, Leaflet spatial mapping, and ITIL SLA management engines.',
      highlights: [
        'Real-time WebSocket event bus syncing tickets, alerts, and floorplan movements live across all clients.',
        'Dual-Mode persistent JSON database store with standard Mongoose-compatible CRUD interface.',
        'Role-Based Access Control (RBAC) supporting ITSM, ITAM, NetOps, SecOps, HR, Manager, and Finance roles.'
      ],
      targetTab: 'dashboard',
      actionLabel: 'Explore Executive Dashboard'
    },
    {
      title: 'ITSM Helpdesk & SLA Engine',
      badge: 'ITSM Lead: Vishan Fernando',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      icon: Ticket,
      iconColor: 'text-blue-400',
      heading: 'Automated Priority Calculation & ITIL Incident Triage',
      summary: 'Implements ITIL-compliant service desk workflows with live SLA countdown clocks and automated assignment based on category matching.',
      highlights: [
        'Priority Matrix Algorithm: automatically calculates P1-Critical to P4-Low based on Impact x Urgency.',
        'Targeted routing: Hardware tickets auto-route to Harindy (ITAM), Network issues to Pabodha (NetOps), Security to Malmika (SecOps), General to Vishan.',
        'Resolution & Closure workflow: IT support resolution prompts candidate confirmation with a 4-hour auto-close countdown.',
        'Pre-breach SLA warning notifications broadcast via WebSockets 15 mins before target expiration.'
      ],
      targetTab: 'tickets',
      actionLabel: 'Open Service Desk Tickets'
    },
    {
      title: 'ITAM & CMDB Hardware Inventory',
      badge: 'ITAM Lead: Harindy Jayasuriya',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      icon: Server,
      iconColor: 'text-emerald-400',
      heading: 'Hardware Assets, Rack Locations & Software Licenses',
      summary: 'Centralized Configuration Management Database (CMDB) linking hardware assets, IP/MAC configurations, serial tags, rack placements, and software licenses.',
      highlights: [
        'Full hardware asset lifecycle tracking (Ordered -> In Stock -> In Use -> Under Maintenance -> Retired).',
        'Direct linkage between CMDB assets and ITSM tickets to inspect hardware incident history.',
        'Software license seat allocation pool with remaining quota enforcement and 3-month delayed revocation policy.'
      ],
      targetTab: 'assets',
      actionLabel: 'Inspect CMDB Hardware Assets'
    },
    {
      title: 'Spatial Floorplan & Python Discovery',
      badge: 'Discovery Lead: Pabodha Senaratne',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      icon: MapPin,
      iconColor: 'text-cyan-400',
      heading: 'Interactive Spatial Mapping & Active Subnet Sweeps',
      summary: 'Visual floorplan mapping powered by Leaflet.js with drag-and-drop device repositioning, integrated with a standalone Python SNMP/ARP polling service.',
      highlights: [
        'Interactive Campus Floorplan: view servers, workstations, and network APs placed on building blueprints.',
        'Live device repositioning: move any device on the floorplan with instant real-time coordinate syncing via WebSockets.',
        'Python Discovery Daemon: standalone script polling SNMP MIBs, ARP tables, and ping latencies across VLANs 10, 20 & 30, posting directly to NetBox/Zabbix bridge.'
      ],
      targetTab: 'floorplan',
      actionLabel: 'View Spatial Floorplan'
    },
    {
      title: 'Enterprise Lifecycle Workflows',
      badge: 'Workflows 3.1, 3.2, & 3.4',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      icon: Layers,
      iconColor: 'text-amber-400',
      heading: 'Automated Onboarding, Offboarding QA & Procurement',
      summary: 'Digitized business process automation covering candidate onboarding, asset returns with delayed license cutoffs, and multi-tier procurement approvals.',
      highlights: [
        'Workflow 3.1 Employee Onboarding: 4-stage pipeline (HR Draft -> Candidate Form Submission -> HR Group Verification -> IT Credential Provisioning).',
        'Workflow 3.2 Offboarding & QA: 1-click automated system cutoff, hardware check-in, and 3-month delayed software license revocation reminder.',
        'Workflow 3.4 Hardware Procurement: 4-step approval chain (IT Review -> Manager Authorization -> Finance Sign-off -> Delivery Check-in to CMDB).'
      ],
      targetTab: 'onboarding',
      actionLabel: 'Explore Lifecycle Workflows'
    },
    {
      title: 'Security, Analytics & Audit Trail',
      badge: 'Security Lead: Malmika Wickramasinghe',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      icon: ShieldCheck,
      iconColor: 'text-rose-400',
      heading: 'Executive SLA Analytics & Immutable Security Audit Logs',
      summary: 'Comprehensive SLA compliance telemetry and cryptographic-style audit trail logging every administrative action, IP address, and status transition.',
      highlights: [
        'SLA Analytics Dashboard: visual charts tracking MTTR (Mean Time to Resolution), first-response compliance, and category distribution.',
        'Comprehensive Audit Trail: captures Actor Name, Role, Action Type, Target Entity, and Client IP for complete compliance readiness.',
        'Dynamic Persona Switcher: switch live between Vishan (ITSM), Harindy (ITAM), Pabodha (NetOps), Malmika (SecOps), HR, and Staff to inspect role-tailored views.'
      ],
      targetTab: 'analytics',
      actionLabel: 'View Analytics & Audit Logs'
    }
  ];

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  const handleJump = (tab) => {
    setActiveTab(tab);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-slate-900 border border-indigo-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center">
              <Icon className={`w-5 h-5 ${slide.iconColor}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${slide.badgeColor}`}>
                  {slide.badge}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  Slide {currentSlide + 1} of {slides.length}
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-0.5">{slide.title}</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Slide Content */}
        <div className="p-6 space-y-5 flex-1">
          <div>
            <h4 className="text-base font-bold text-white leading-snug">{slide.heading}</h4>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{slide.summary}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
            <div className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Key Technical Capabilities:
            </div>
            <ul className="space-y-2 text-xs text-slate-300">
              {slide.highlights.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 mt-1.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentSlide ? 'w-6 bg-indigo-500' : 'w-2 bg-slate-700 hover:bg-slate-600'
                }`}
                title={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {slide.targetTab && (
              <button
                onClick={() => handleJump(slide.targetTab)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <span>{slide.actionLabel}</span>
                <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
              </button>
            )}

            <button
              onClick={handlePrev}
              disabled={currentSlide === 0}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 disabled:opacity-40 text-xs font-medium flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Back
            </button>

            <button
              onClick={handleNext}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-1 transition"
            >
              <span>{currentSlide === slides.length - 1 ? 'Finish Tour' : 'Next'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
