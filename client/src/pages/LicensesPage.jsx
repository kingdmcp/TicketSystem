import React, { useState, useEffect } from 'react';
import api, { socket } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  KeyRound,
  Plus,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  ShieldAlert,
  ArrowRight,
  UserX
} from 'lucide-react';

export default function LicensesPage() {
  const { currentUser } = useAuth();
  const [licenses, setLicenses] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState(null);
  const [targetUserId, setTargetUserId] = useState('');

  useEffect(() => {
    loadLicenses();
    loadUsers();

    const handleUpdated = () => loadLicenses();
    socket.on('license_updated', handleUpdated);

    return () => {
      socket.off('license_updated', handleUpdated);
    };
  }, []);

  const loadLicenses = async () => {
    try {
      setLoading(true);
      const res = await api.getLicenses();
      setLicenses(res.data.data);
      if (res.data.data.length > 0 && !selectedLicense) {
        setSelectedLicense(res.data.data[0]);
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

  const handleAllocate = async (e) => {
    e.preventDefault();
    if (!selectedLicense || !targetUserId) return;
    try {
      await api.allocateLicense(selectedLicense._id, {
        userId: targetUserId,
        actorName: currentUser.name
      });
      setShowAllocateModal(false);
      setTargetUserId('');
      loadLicenses();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to allocate license');
    }
  };

  const handleRevoke = async (licId, userId, reason) => {
    try {
      await api.revokeLicense(licId, {
        userId,
        actorName: currentUser.name,
        reason: reason || 'Manual license seat reclamation'
      });
      loadLicenses();
    } catch (err) {
      alert('Failed to revoke license');
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Software License & Seat Management</h1>
            <span className="px-2 py-0.5 rounded text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
              Lead: Harindy Jayasuriya
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            ITAM Compliance • Real-Time Seat Allocation Pool & 3-Month Delayed Offboarding Revocation
          </p>
        </div>
      </div>

      {/* 3-Month Delayed License Revocation Banner */}
      <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 flex items-start gap-3">
        <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <h4 className="font-semibold text-amber-200">
            3-Month Post-Offboarding License Retention Policy (Workflow 3.2)
          </h4>
          <p className="text-amber-300/80 leading-relaxed">
            Company policy retains departing employee SaaS & email licenses for 90 days after departure to guarantee full
            mail archiving and transition before seat recycling. The system flags expired archive periods automatically.
          </p>
        </div>
      </div>

      {/* License Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {licenses.map((lic) => {
          const isSelected = selectedLicense?._id === lic._id;
          const pct = Math.round((lic.allocatedSeats / lic.totalSeats) * 100);

          return (
            <div
              key={lic._id}
              onClick={() => setSelectedLicense(lic)}
              className={`p-5 rounded-xl border transition cursor-pointer ${
                isSelected
                  ? 'bg-slate-800/90 border-indigo-500/80 shadow-lg'
                  : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800/70'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{lic.vendor}</span>
                  <h3 className="text-sm font-bold text-white mt-0.5">{lic.name}</h3>
                </div>
                <KeyRound className="w-4 h-4 text-emerald-400 shrink-0" />
              </div>

              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-400">Seat Utilization:</span>
                  <span className="text-white font-bold">{lic.allocatedSeats} / {lic.totalSeats} ({pct}%)</span>
                </div>
                <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      pct > 90 ? 'bg-rose-500' : pct > 75 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
                <span>Annual: ${Number(lic.costPerYear).toLocaleString()}</span>
                <span className="text-indigo-400 font-medium">Renewal: {lic.renewalDate}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected License Seat Allocation Details */}
      {selectedLicense && (
        <div className="p-6 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/60 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{selectedLicense.name}</h3>
                <span className="px-2 py-0.5 rounded text-xs bg-slate-700 text-slate-300 font-mono">
                  {selectedLicense.vendor}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-mono">License Key: {selectedLicense.licenseKey}</p>
            </div>
            <button
              onClick={() => setShowAllocateModal(true)}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              <span>Assign Seat to User</span>
            </button>
          </div>

          {/* Assigned Users Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Active Seat Holders ({(selectedLicense.assignedUsers || []).length} users)
            </h4>

            <div className="overflow-x-auto rounded-lg border border-slate-700/60 bg-slate-900/60">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 border-b border-slate-700/60 text-slate-400 uppercase text-[10px] font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Employee</th>
                    <th className="py-2.5 px-4">Department</th>
                    <th className="py-2.5 px-4">Assigned Date</th>
                    <th className="py-2.5 px-4">3-Mo Offboarding Status</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/40">
                  {(selectedLicense.assignedUsers || []).map((u, i) => (
                    <tr key={i} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-white">{u.userName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{u.userEmail}</div>
                      </td>
                      <td className="py-2.5 px-4 text-slate-300">{u.userDepartment || 'General'}</td>
                      <td className="py-2.5 px-4 text-slate-400">
                        {new Date(u.assignedDate).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-4">
                        {u.pendingRevocation ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 w-fit">
                            <Clock className="w-3 h-3" /> Offboarding Archive Mode
                          </span>
                        ) : (
                          <span className="text-emerald-400 text-[11px]">Active Employee</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={() => handleRevoke(selectedLicense._id, u.userId, 'Admin seat release')}
                          className="px-2.5 py-1 rounded bg-rose-900/40 hover:bg-rose-900/70 text-rose-300 text-xs border border-rose-800/50"
                        >
                          Revoke Seat
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Allocate License */}
      {showAllocateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>Assign {selectedLicense?.name} Seat</span>
              </h3>
              <button onClick={() => setShowAllocateModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAllocate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Select Employee</label>
                <select
                  required
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
                >
                  <option value="">-- Choose Employee --</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.department}) - {u.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAllocateModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                >
                  Allocate Seat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
