import React, { useState, useEffect } from 'react';
import api, { socket } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  UserMinus,
  CheckCircle,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Zap,
  Mail,
  HardDrive,
  RefreshCw,
  Plus
} from 'lucide-react';

export default function OffboardingPage() {
  const { currentUser } = useAuth();
  const [offboardings, setOffboardings] = useState([]);
  const [selectedOff, setSelectedOff] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initiate Modal
  const [showInitiateModal, setShowInitiateModal] = useState(false);
  const [targetEmployeeId, setTargetEmployeeId] = useState('');
  const [exitDate, setExitDate] = useState(new Date().toISOString().split('T')[0]);
  const [exitReason, setExitReason] = useState('Voluntary Resignation - Career Growth');

  // Asset return inspection state
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [assetCondition, setAssetCondition] = useState('Good');
  const [qaNotes, setQaNotes] = useState('');

  useEffect(() => {
    loadOffboardings();
    loadUsers();

    const handleUpdated = () => loadOffboardings();
    socket.on('offboarding_updated', handleUpdated);

    return () => {
      socket.off('offboarding_updated', handleUpdated);
    };
  }, []);

  const loadOffboardings = async () => {
    try {
      setLoading(true);
      const res = await api.getOffboardings();
      setOffboardings(res.data.data);
      if (res.data.data.length > 0 && !selectedOff) {
        setSelectedOff(res.data.data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await api.getUsers();
      setUsers(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Step 1: HR Initiates
  const handleInitiate = async (e) => {
    e.preventDefault();
    if (!targetEmployeeId) return;
    try {
      await api.initiateOffboarding({
        employeeId: targetEmployeeId,
        exitDate,
        reason: exitReason,
        actorName: currentUser.name
      });
      setShowInitiateModal(false);
      setTargetEmployeeId('');
      loadOffboardings();
    } catch (err) {
      alert('Failed to initiate offboarding');
    }
  };

  // Step 3: 1-Click Automated Cutoff Sequence
  const handleAutomatedCutoff = async () => {
    if (!selectedOff) return;
    try {
      await api.executeAutomatedCutoff(selectedOff._id, {
        actorName: currentUser.name
      });
      loadOffboardings();
    } catch (err) {
      alert('Failed to execute automated cutoff sequence');
    }
  };

  // Step 4: Asset QA Return Check
  const handleRecordAssetReturn = async (assetId) => {
    if (!selectedOff) return;
    try {
      await api.recordAssetReturn(selectedOff._id, {
        assetId,
        condition: assetCondition,
        notes: qaNotes,
        actorName: currentUser.name
      });
      setSelectedAssetId('');
      setQaNotes('');
      loadOffboardings();
    } catch (err) {
      alert('Failed to record asset condition');
    }
  };

  // Step 5: 3-Month Delayed License Revocation
  const handleRevokeLicenses = async () => {
    if (!selectedOff) return;
    try {
      await api.revokeDelayedLicenses(selectedOff._id, {
        actorName: currentUser.name
      });
      loadOffboardings();
    } catch (err) {
      alert('Failed to revoke software licenses');
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Employee Offboarding & Asset Recovery</h1>
            <span className="px-2 py-0.5 rounded text-xs bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold">
              Workflow 3.2
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automated Cutoff Sequence • Hardware Return & QA Inspection • 3-Month Delayed License Revocation
          </p>
        </div>

        <button
          onClick={() => setShowInitiateModal(true)}
          className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/30 flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Initiate Offboarding</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Offboarding Pipeline ({offboardings.length})
          </div>

          {offboardings.map((off) => {
            const isSelected = selectedOff?._id === off._id;
            return (
              <div
                key={off._id}
                onClick={() => setSelectedOff(off)}
                className={`p-4 rounded-xl border transition cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800/90 border-rose-500/80 shadow-md'
                    : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-rose-400">{off.offboardingId}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-700 text-slate-200">
                    {off.status}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white mt-1.5">{off.employeeName}</h3>
                <div className="text-[11px] text-slate-400">
                  {off.department} • Manager: {off.managerName}
                </div>

                <div className="mt-3 pt-2 border-t border-slate-700/40 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Exit Date: {off.exitDate}</span>
                  <span className="text-slate-300 font-medium">
                    {off.allocatedAssets?.length || 0} Assets Allocated
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Detail / Execution Pane */}
        <div className="lg:col-span-8">
          {selectedOff ? (
            <div className="p-6 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow-xl space-y-6">
              {/* Header */}
              <div className="border-b border-slate-700/60 pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-rose-400">{selectedOff.offboardingId}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-xs text-slate-400">Exit Date: {selectedOff.exitDate}</span>
                  </div>
                  <h2 className="text-lg font-bold text-white mt-1">{selectedOff.employeeName}</h2>
                  <p className="text-xs text-slate-400">
                    Department: <span className="text-slate-200">{selectedOff.department}</span> • Designated Manager:{' '}
                    <span className="text-slate-200 font-semibold">{selectedOff.managerName}</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">Reason: {selectedOff.reason}</p>
                </div>
              </div>

              {/* Step 3: One-Click Automated System Cutoff Sequence */}
              <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-700/60 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span>One-Click Automated System Cutoff (Section 3.2)</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Instantly purges all groups, disables AD account, configures email auto-reply & forwards mail to manager.
                    </p>
                  </div>

                  {!selectedOff.automatedCutoff?.executed ? (
                    <button
                      onClick={handleAutomatedCutoff}
                      className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-lg shadow-rose-600/30 flex items-center gap-1.5 shrink-0"
                    >
                      <Zap className="w-4 h-4" />
                      <span>Execute Cutoff Sequence</span>
                    </button>
                  ) : (
                    <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 shrink-0">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>Cutoff Sequence Executed</span>
                    </span>
                  )}
                </div>

                {/* Visual Verification Checklist */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div
                    className={`p-3 rounded-lg border flex flex-col justify-between ${
                      selectedOff.automatedCutoff?.groupsRemoved
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400'
                    }`}
                  >
                    <span className="text-[10px] font-bold">1. GROUP PURGE</span>
                    <span className="font-medium mt-1">
                      {selectedOff.automatedCutoff?.groupsRemoved ? 'All Groups Removed' : 'Pending Cutoff'}
                    </span>
                  </div>

                  <div
                    className={`p-3 rounded-lg border flex flex-col justify-between ${
                      selectedOff.automatedCutoff?.adDisabled
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400'
                    }`}
                  >
                    <span className="text-[10px] font-bold">2. AD ACCOUNT</span>
                    <span className="font-medium mt-1">
                      {selectedOff.automatedCutoff?.adDisabled ? 'Account Disabled' : 'Active Account'}
                    </span>
                  </div>

                  <div
                    className={`p-3 rounded-lg border flex flex-col justify-between ${
                      selectedOff.automatedCutoff?.autoReplySet
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400'
                    }`}
                  >
                    <span className="text-[10px] font-bold">3. AUTO-REPLY</span>
                    <span className="font-medium mt-1">
                      {selectedOff.automatedCutoff?.autoReplySet ? 'Auto-Reply Configured' : 'Not Set'}
                    </span>
                  </div>

                  <div
                    className={`p-3 rounded-lg border flex flex-col justify-between ${
                      selectedOff.automatedCutoff?.emailForwardedToManager
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400'
                    }`}
                  >
                    <span className="text-[10px] font-bold">4. MAIL FORWARD</span>
                    <span className="font-medium mt-1">
                      {selectedOff.automatedCutoff?.emailForwardedToManager ? 'Forwarded to Mgr' : 'Not Routed'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 4: Asset Return & Quality Check (Good -> Inventory; Broken -> HR) */}
              <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-700/60 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-cyan-400" />
                  <span>Hardware Asset Return & QA Inspection</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Good assets automatically return to available stock inventory. Broken/damaged assets are flagged to HR.
                </p>

                <div className="space-y-3">
                  {(selectedOff.allocatedAssets || []).length === 0 ? (
                    <div className="text-xs text-slate-500 italic p-3 bg-slate-800/40 rounded-lg">
                      No physical hardware assets allocated to this employee.
                    </div>
                  ) : (
                    (selectedOff.allocatedAssets || []).map((ast) => (
                      <div
                        key={ast.assetId}
                        className="p-3.5 rounded-lg bg-slate-800/80 border border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="font-mono font-bold text-cyan-300">{ast.assetTag}</div>
                          <div className="text-white font-medium">{ast.name}</div>
                          {ast.checkedAt && (
                            <div className="text-[10px] text-slate-400 mt-1">
                              Checked on {new Date(ast.checkedAt).toLocaleDateString()} • Note: {ast.notes || 'None'}
                            </div>
                          )}
                        </div>

                        {ast.condition === 'Pending' ? (
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => {
                                setAssetCondition('Good');
                                handleRecordAssetReturn(ast.assetId);
                              }}
                              className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                            >
                              ✓ Return in Good Condition
                            </button>
                            <button
                              onClick={() => {
                                setAssetCondition('Broken');
                                setQaNotes('Physical damage reported on chassis/screen');
                                handleRecordAssetReturn(ast.assetId);
                              }}
                              className="px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-semibold"
                            >
                              ✕ Flag Broken to HR
                            </button>
                          </div>
                        ) : (
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold border shrink-0 ${
                              ast.condition === 'Good'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            }`}
                          >
                            Condition: {ast.condition} {ast.condition === 'Good' ? '(Restocked)' : '(Reported to HR)'}
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Step 5: Delayed 3-Month Software License Revocation Rule */}
              <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-700/60 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span>3-Month Post-Offboarding License Revocation Milestone</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Retention scheduled until:{' '}
                      <span className="font-mono text-amber-300 font-semibold">
                        {selectedOff.delayedLicenseRevocation?.scheduledDate
                          ? new Date(selectedOff.delayedLicenseRevocation.scheduledDate).toLocaleDateString()
                          : '90 Days'}
                      </span>
                    </p>
                  </div>

                  {selectedOff.delayedLicenseRevocation?.status !== 'Revoked (Archive Complete)' ? (
                    <button
                      onClick={handleRevokeLicenses}
                      className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center gap-1.5 shrink-0"
                    >
                      <span>Execute 3-Mo License Revocation</span>
                    </button>
                  ) : (
                    <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 shrink-0">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>Licenses Revoked & Seats Reclaimed</span>
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="text-slate-400 font-medium">Software Seats Linked for Retention:</div>
                  <div className="flex flex-wrap gap-2">
                    {(selectedOff.allocatedLicenses || []).map((lic) => (
                      <span
                        key={lic.licenseId}
                        className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-mono text-[11px]"
                      >
                        {lic.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-xl bg-slate-800/40 border border-slate-700/60 text-slate-400 text-xs">
              Select an offboarding case from the pipeline.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Initiate Offboarding */}
      {showInitiateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserMinus className="w-4 h-4 text-rose-400" />
                <span>HR: Initiate Employee Offboarding</span>
              </h3>
              <button onClick={() => setShowInitiateModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleInitiate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Select Employee to Offboard *</label>
                <select
                  required
                  value={targetEmployeeId}
                  onChange={(e) => setTargetEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
                >
                  <option value="">-- Choose Employee --</option>
                  {users
                    .filter((u) => u.status !== 'Disabled / Offboarded')
                    .map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.name} ({u.department})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Exit Date *</label>
                <input
                  type="date"
                  required
                  value={exitDate}
                  onChange={(e) => setExitDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Reason for Separation</label>
                <select
                  value={exitReason}
                  onChange={(e) => setExitReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
                >
                  <option value="Voluntary Resignation - Career Growth">Voluntary Resignation</option>
                  <option value="Contract Ended">Contract Ended</option>
                  <option value="Retirement">Retirement</option>
                  <option value="Relocation">Relocation</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowInitiateModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold"
                >
                  Initiate Offboarding Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
