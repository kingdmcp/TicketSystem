import React, { useState, useEffect } from 'react';
import api, { socket } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Ticket,
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  User,
  ArrowRight,
  ShieldAlert,
  Search,
  BookOpen,
  Filter
} from 'lucide-react';

export default function TicketsPage() {
  const { currentUser } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showResolveModal, setShowResolveModal] = useState(false);

  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('General IT Issue');
  const [newImpact, setNewImpact] = useState('Medium');
  const [newUrgency, setNewUrgency] = useState('Medium');
  const [newAssetId, setNewAssetId] = useState('');
  const [assets, setAssets] = useState([]);

  // KB auto-suggestion
  const [kbSuggestions, setKbSuggestions] = useState([]);

  // Resolve form states
  const [resolveNotes, setResolveNotes] = useState('');
  const [createKbCheckbox, setCreateKbCheckbox] = useState(true);

  // Closure response state
  const [closureFeedback, setClosureFeedback] = useState('');

  // IT Support Override states (Image 4)
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideAction, setOverrideAction] = useState('reject');
  const [overrideReason, setOverrideReason] = useState('');

  useEffect(() => {
    loadTickets();
    loadAssets();

    const handleTicketCreated = (t) => {
      setTickets((prev) => [t, ...prev]);
    };
    const handleTicketUpdated = (updated) => {
      setTickets((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
      if (selectedTicket && selectedTicket._id === updated._id) {
        setSelectedTicket(updated);
      }
    };

    socket.on('ticket_created', handleTicketCreated);
    socket.on('ticket_updated', handleTicketUpdated);

    return () => {
      socket.off('ticket_created', handleTicketCreated);
      socket.off('ticket_updated', handleTicketUpdated);
    };
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const res = await api.getTickets();
      setTickets(res.data.data);
      if (res.data.data.length > 0 && !selectedTicket) {
        setSelectedTicket(res.data.data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadAssets = async () => {
    try {
      const res = await api.getAssets();
      setAssets(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Live search KB suggestions when user types ticket title
  const handleTitleChange = async (val) => {
    setNewTitle(val);
    if (val.trim().length > 3) {
      try {
        const res = await api.getKBArticles({ query: val });
        setKbSuggestions(res.data.data);
      } catch (e) {}
    } else {
      setKbSuggestions([]);
    }
  };

  const handleCreateTicket = async (e, isDraft = false) => {
    if (e) e.preventDefault();
    try {
      await api.createTicket({
        title: newTitle,
        shortDescription: newTitle,
        description: newDesc,
        category: newCategory,
        impact: newImpact,
        urgency: newUrgency,
        linkedAsset: newAssetId || null,
        isDraft,
        createdBy: currentUser.id,
        createdByName: currentUser.name
      });
      setShowCreateModal(false);
      setNewTitle('');
      setNewDesc('');
      setKbSuggestions([]);
      loadTickets();
    } catch (err) {
      alert('Error creating ticket: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleOverride = async () => {
    if (!selectedTicket || !overrideReason) return;
    try {
      await api.itSupportOverride(selectedTicket._id, {
        action: overrideAction,
        reason: overrideReason,
        actorName: currentUser.name,
        actorRole: currentUser.role
      });
      setShowOverrideModal(false);
      setOverrideReason('');
      loadTickets();
    } catch (err) {
      alert('Failed to execute IT override');
    }
  };

  const handleStatusChange = async (ticketId, nextStatus) => {
    try {
      await api.updateTicketStatus(ticketId, {
        status: nextStatus,
        actorName: currentUser.name,
        actorRole: currentUser.role,
        commentText: `Status transitioned to ${nextStatus} by ${currentUser.name}`
      });
      loadTickets();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleResolveTicket = async () => {
    if (!selectedTicket || !resolveNotes) return;
    try {
      await api.resolveTicket(selectedTicket._id, {
        resolutionNotes: resolveNotes,
        createKbArticle: createKbCheckbox,
        actorName: currentUser.name,
        actorRole: currentUser.role
      });
      setShowResolveModal(false);
      setResolveNotes('');
      loadTickets();
    } catch (err) {
      alert('Failed to resolve ticket');
    }
  };

  const handleClosureDecision = async (decision) => {
    if (!selectedTicket) return;
    try {
      await api.respondToClosure(selectedTicket._id, {
        decision,
        feedback: closureFeedback,
        actorName: currentUser.name
      });
      setClosureFeedback('');
      loadTickets();
    } catch (err) {
      alert('Failed to submit closure review');
    }
  };

  const handleEscalate = async (ticketId) => {
    try {
      await api.escalateTicket(ticketId, {
        actorName: currentUser.name,
        reason: 'Manual SLA Escalation to Senior Staff'
      });
      loadTickets();
    } catch (err) {
      alert('Failed to escalate ticket');
    }
  };

  // Priority matrix preview helper
  const previewPriority = () => {
    const imp = newImpact.toLowerCase();
    const urg = newUrgency.toLowerCase();
    if (imp === 'high' && urg === 'high') return { text: 'P1-Critical (Response: 15m, Resolution: 4h)', color: 'text-rose-400' };
    if ((imp === 'high' && urg === 'medium') || (imp === 'medium' && urg === 'high'))
      return { text: 'P2-High (Response: 1h, Resolution: 12h)', color: 'text-amber-400' };
    if ((imp === 'high' && urg === 'low') || (imp === 'medium' && urg === 'medium') || (imp === 'low' && urg === 'high'))
      return { text: 'P3-Medium (Response: 4h, Resolution: 24h)', color: 'text-yellow-400' };
    return { text: 'P4-Low (Response: 8h, Resolution: 72h)', color: 'text-blue-400' };
  };

  const filteredTickets = tickets.filter((t) => {
    if (filterStatus !== 'ALL' && t.status !== filterStatus) return false;
    if (filterPriority !== 'ALL' && t.priority !== filterPriority) return false;
    return true;
  });

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">ITSM Helpdesk & Ticket Lifecycle</h1>
            <span className="px-2 py-0.5 rounded text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
              Lead: Vishan Fernando
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automated Routing Matrix • SLA Pre-Breach Monitoring • 4-Hour Closure Timeout & KB Sync
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Raise New Incident</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Filter className="w-3.5 h-3.5" />
          <span>Status:</span>
        </div>
        {['ALL', 'Open', 'Assigned', 'In Progress', 'Resolved', 'Closed'].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-2.5 py-1 rounded-md transition font-medium ${
              filterStatus === st
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {st}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          <span className="text-slate-400">Priority:</span>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-slate-200 text-xs"
          >
            <option value="ALL">All Priorities</option>
            <option value="P1-Critical">P1-Critical</option>
            <option value="P2-High">P2-High</option>
            <option value="P3-Medium">P3-Medium</option>
            <option value="P4-Low">P4-Low</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Ticket List and Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List */}
        <div className="lg:col-span-5 space-y-3">
          {filteredTickets.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-slate-800/40 border border-slate-700/60 text-slate-400 text-xs">
              No tickets matching active filters.
            </div>
          ) : (
            filteredTickets.map((t) => {
              const isSelected = selectedTicket?._id === t._id;
              let prioClass = 'border-l-4 border-l-blue-500';
              if (t.priority === 'P1-Critical') prioClass = 'border-l-4 border-l-rose-500 bg-rose-950/10';
              if (t.priority === 'P2-High') prioClass = 'border-l-4 border-l-amber-500 bg-amber-950/10';

              return (
                <div
                  key={t._id}
                  onClick={() => setSelectedTicket(t)}
                  className={`p-4 rounded-xl border transition cursor-pointer ${prioClass} ${
                    isSelected
                      ? 'bg-slate-800/90 border-indigo-500/80 shadow-md'
                      : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800/70'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-200">{t.ticketNumber}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 font-medium">
                        {t.status}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">{t.priority}</span>
                  </div>

                  <h3 className="text-xs font-semibold text-white mt-1.5 line-clamp-1">{t.title}</h3>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">{t.description}</p>

                  <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-700/40 pt-2">
                    <span>Assignee: {t.assignedToName}</span>
                    {t.slaResolutionBreached ? (
                      <span className="text-rose-400 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> SLA Breached
                      </span>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> In SLA
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Detail Pane */}
        <div className="lg:col-span-7">
          {selectedTicket ? (
            <div className="p-6 rounded-xl bg-slate-800/70 border border-slate-700/60 shadow-xl space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-700/60 pb-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-sm font-bold text-indigo-400">{selectedTicket.ticketNumber}</span>
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-700 text-slate-200">
                      {selectedTicket.priority}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800">
                      {selectedTicket.status}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-white mt-2">{selectedTicket.title}</h2>
                  <div className="text-xs text-slate-400 mt-1">
                    Raised by: <span className="text-slate-300">{selectedTicket.createdByName}</span> • Category:{' '}
                    <span className="text-slate-300">{selectedTicket.category}</span>
                  </div>
                </div>

                {/* Workflow Transitions */}
                <div className="flex flex-wrap items-center gap-2">
                  {selectedTicket.status === 'Open' && (
                    <button
                      onClick={() => handleStatusChange(selectedTicket._id, 'Assigned')}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium"
                    >
                      Acknowledge & Assign
                    </button>
                  )}
                  {selectedTicket.status === 'Assigned' && (
                    <button
                      onClick={() => handleStatusChange(selectedTicket._id, 'In Progress')}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium"
                    >
                      Start Investigation
                    </button>
                  )}
                  {selectedTicket.status === 'In Progress' && (
                    <button
                      onClick={() => setShowResolveModal(true)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium"
                    >
                      Resolve & Request Closure
                    </button>
                  )}
                  {selectedTicket.status !== 'Closed' && (
                    <>
                      <button
                        onClick={() => handleEscalate(selectedTicket._id)}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-800 border border-rose-700 text-rose-200 text-xs font-medium flex items-center gap-1"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Escalate</span>
                      </button>
                      <button
                        onClick={() => {
                          setOverrideAction('reject');
                          setShowOverrideModal(true);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 text-xs font-medium"
                      >
                        Override: Reject
                      </button>
                      <button
                        onClick={() => {
                          setOverrideAction('force_close');
                          setShowOverrideModal(true);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 text-xs font-medium"
                      >
                        Override: Close
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* SLA Targets & Countdown Box */}
              <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-700/60 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Response SLA Target</span>
                  </div>
                  <div className="mt-1 font-semibold text-slate-200">
                    {selectedTicket.respondedAt ? (
                      <span className="text-emerald-400">
                        Responded at {new Date(selectedTicket.respondedAt).toLocaleTimeString()}
                      </span>
                    ) : (
                      <span className={selectedTicket.slaResponseBreached ? 'text-rose-400 font-bold' : 'text-amber-300'}>
                        Due by {new Date(selectedTicket.responseDue).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Resolution SLA Target</span>
                  </div>
                  <div className="mt-1 font-semibold text-slate-200">
                    {selectedTicket.resolvedAt ? (
                      <span className="text-emerald-400">
                        Resolved at {new Date(selectedTicket.resolvedAt).toLocaleTimeString()}
                      </span>
                    ) : (
                      <span className={selectedTicket.slaResolutionBreached ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                        Due: {new Date(selectedTicket.resolutionDue).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Closure Prompt Review Card (Section 3.3 Acceptance / Rejection / 4-hr timeout) */}
              {selectedTicket.closurePrompt?.sent && selectedTicket.status === 'Resolved' && (
                <div className="p-4 rounded-xl bg-indigo-950/50 border-2 border-indigo-500/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>User Closure Confirmation Pending</span>
                    </h4>
                    <span className="text-[11px] text-indigo-200 bg-indigo-900/80 px-2 py-0.5 rounded border border-indigo-700">
                      Auto-closes in 4 hours
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    IT Support has marked this ticket resolved with notes:
                    <span className="block mt-1 font-mono text-indigo-200 bg-slate-900/70 p-2 rounded">
                      "{selectedTicket.resolutionNotes}"
                    </span>
                  </p>

                  <div className="space-y-2 pt-1">
                    <input
                      type="text"
                      placeholder="Optional feedback or rejection reason..."
                      value={closureFeedback}
                      onChange={(e) => setClosureFeedback(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleClosureDecision('accept')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                      >
                        Accept & Close Ticket
                      </button>
                      <button
                        onClick={() => handleClosureDecision('reject')}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
                      >
                        Reject & Reopen Ticket
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Linked Asset & Hardware Spec */}
              <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-700/40 text-xs space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Linked CMDB Asset</span>
                <div className="text-slate-200 font-semibold">{selectedTicket.linkedAssetName || 'None Linked'}</div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300">Detailed Description</span>
                <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-700/60 text-xs text-slate-200 leading-relaxed">
                  {selectedTicket.description}
                </div>
              </div>

              {/* Ticket Lifecycle Audit Comments */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-semibold text-slate-300">Timeline & Activity Log</span>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {(selectedTicket.comments || []).map((c, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-700/40 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-semibold text-indigo-300">{c.author}</span>
                        <span>{new Date(c.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-slate-300">{c.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-xl bg-slate-800/40 border border-slate-700/60 text-slate-400 text-xs">
              Select an incident from the list to view its SLA targets and workflow status.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create Ticket */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Ticket className="w-4 h-4 text-indigo-400" />
                <span>Submit Service Desk Ticket</span>
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
              {/* Title */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">Issue Summary / Short Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cannot connect to PostgreSQL database or Wi-Fi drops"
                  value={newTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Knowledge Base Self-Service Suggestions */}
              {kbSuggestions.length > 0 && (
                <div className="p-3 rounded-lg bg-indigo-950/60 border border-indigo-800/80 space-y-2">
                  <div className="flex items-center gap-1.5 text-indigo-300 font-semibold text-[11px]">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Matching Knowledge Base Articles (Solve now without a ticket!):</span>
                  </div>
                  <div className="space-y-1.5">
                    {kbSuggestions.slice(0, 2).map((kb) => (
                      <div key={kb._id} className="p-2 rounded bg-slate-900/80 border border-slate-700/60">
                        <div className="font-semibold text-slate-200">{kb.title}</div>
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{kb.problemDescription}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Category & Asset */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
                  >
                    <option value="Database / Infrastructure">Database / Infrastructure</option>
                    <option value="Network & Wireless">Network & Wireless</option>
                    <option value="Hardware / Peripherals">Hardware / Peripherals</option>
                    <option value="Workstation / Software">Workstation / Software</option>
                    <option value="Security / Compliance">Security / Compliance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Linked CMDB Asset (Optional)</label>
                  <select
                    value={newAssetId}
                    onChange={(e) => setNewAssetId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
                  >
                    <option value="">-- None / Unspecified --</option>
                    {assets.map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.assetTag} - {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Impact x Urgency -> Priority Matrix */}
              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-3">
                <span className="font-semibold text-slate-300 uppercase tracking-wider text-[10px]">
                  Priority Matrix Engine (Impact x Urgency)
                </span>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 mb-1">Impact (Scope of affected users)</label>
                    <select
                      value={newImpact}
                      onChange={(e) => setNewImpact(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                    >
                      <option value="High">High (Whole org / Mission critical)</option>
                      <option value="Medium">Medium (Department / Team)</option>
                      <option value="Low">Low (Single individual)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Urgency (Time sensitivity)</label>
                    <select
                      value={newUrgency}
                      onChange={(e) => setNewUrgency(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                    >
                      <option value="High">High (Immediate work stoppage)</option>
                      <option value="Medium">Medium (Workaround available)</option>
                      <option value="Low">Low (Inconvenience / Planned)</option>
                    </select>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-700/40 flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-400">Calculated Priority:</span>
                  <span className={previewPriority().color}>{previewPriority().text}</span>
                </div>
              </div>

              {/* Long Description */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">Long Description & Steps to Reproduce *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide complete error logs, expected vs actual behavior, and affected systems..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleCreateTicket(null, true)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-medium"
                >
                  Save as Draft
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                >
                  Submit Incident Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Resolve Ticket & Convert to KB */}
      {showResolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Resolve Ticket: {selectedTicket?.ticketNumber}</span>
            </h3>
            <p className="text-xs text-slate-400">
              Provide resolution notes. The requester will receive a 4-hour review prompt to accept or reject the closure.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Resolution Summary / Fix Applied *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Document how the issue was fixed, e.g. updated firewall rule, reindexed database, replaced cable..."
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={createKbCheckbox}
                  onChange={(e) => setCreateKbCheckbox(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-0"
                />
                <span>Automatically publish resolution as Knowledge Base article</span>
              </label>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowResolveModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleResolveTicket}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                >
                  Submit Resolution
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: IT Support Exception Override (Image 4: Reject or Close with Reason) */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>
                IT Support Override: {overrideAction === 'reject' ? 'Reject Incident' : 'Immediate Force-Close'}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Provide justification for overriding normal workflow for ticket <span className="font-mono text-white font-bold">{selectedTicket?.ticketNumber}</span>:
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Administrative Reason *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain why this ticket is being rejected or immediately closed..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowOverrideModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleOverride}
                  className={`px-4 py-2 rounded-lg text-white font-semibold ${
                    overrideAction === 'reject' ? 'bg-rose-600 hover:bg-rose-500' : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                >
                  Confirm Override {overrideAction === 'reject' ? 'Rejection' : 'Closure'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
