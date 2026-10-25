import React, { useState, useEffect } from 'react';
import api, { socket } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ShoppingCart,
  Plus,
  CheckCircle,
  Clock,
  ArrowRight,
  DollarSign,
  FileText,
  ShieldCheck,
  PackageCheck
} from 'lucide-react';

export default function ProcurementPage() {
  const { currentUser } = useAuth();
  const [procurements, setProcurements] = useState([]);
  const [selectedProc, setSelectedProc] = useState(null);
  const [loading, setLoading] = useState(true);

  // New Request Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [item, setItem] = useState('');
  const [category, setCategory] = useState('Hardware / Displays');
  const [quantity, setQuantity] = useState(1);
  const [estimatedCost, setEstimatedCost] = useState(999);
  const [justification, setJustification] = useState('');

  // Step 2: IT Review input
  const [itRecommendation, setItRecommendation] = useState('Optimal enterprise standard configuration confirmed.');

  // Step 3: Manager comment
  const [managerComment, setManagerComment] = useState('Approved within Q4 departmental budget.');

  // Step 4: Finance PO input
  const [poNumber, setPoNumber] = useState('PO-2026-IT-' + Math.floor(1000 + Math.random() * 9000));

  // Step 5: Delivery check-in input
  const [serialNumber, setSerialNumber] = useState('');
  const [room, setRoom] = useState('Engineering Bay A');

  useEffect(() => {
    loadProcurements();

    const handleUpdated = () => loadProcurements();
    socket.on('procurement_updated', handleUpdated);

    return () => {
      socket.off('procurement_updated', handleUpdated);
    };
  }, []);

  const loadProcurements = async () => {
    try {
      setLoading(true);
      const res = await api.getProcurements();
      setProcurements(res.data.data);
      if (res.data.data.length > 0 && !selectedProc) {
        setSelectedProc(res.data.data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.createProcurement({
        item,
        category,
        quantity,
        estimatedCost,
        justification,
        requestedBy: currentUser.name,
        department: currentUser.department
      });
      setShowCreateModal(false);
      setItem('');
      setJustification('');
      loadProcurements();
    } catch (err) {
      alert('Failed to raise request');
    }
  };

  // Step 2: IT Review
  const handleItReview = async (approved) => {
    if (!selectedProc) return;
    try {
      await api.itReviewProcurement(selectedProc._id, {
        approved,
        recommendedOption: itRecommendation,
        actorName: currentUser.name
      });
      loadProcurements();
    } catch (err) {
      alert('Failed to submit IT review');
    }
  };

  // Step 3: Manager Approval
  const handleManagerApprove = async (approved) => {
    if (!selectedProc) return;
    try {
      await api.managerApproveProcurement(selectedProc._id, {
        approved,
        comments: managerComment,
        actorName: currentUser.name
      });
      loadProcurements();
    } catch (err) {
      alert('Failed to submit manager approval');
    }
  };

  // Step 4: Finance Authorization
  const handleFinanceAuthorize = async () => {
    if (!selectedProc) return;
    try {
      await api.financeAuthorizeProcurement(selectedProc._id, {
        poNumber,
        actorName: currentUser.name
      });
      loadProcurements();
    } catch (err) {
      alert('Failed to submit finance authorization');
    }
  };

  // Step 5: Delivery & CMDB Check-in
  const handleDeliveryCheckIn = async () => {
    if (!selectedProc) return;
    try {
      await api.itCheckInDelivery(selectedProc._id, {
        serialNumber: serialNumber || `SN-${Date.now().toString().slice(-6)}`,
        room,
        actorName: currentUser.name
      });
      alert('Delivery accepted! New hardware asset registered automatically in CMDB!');
      loadProcurements();
    } catch (err) {
      alert('Failed to check in delivery');
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">IT Procurement & Hardware Acquisition</h1>
            <span className="px-2 py-0.5 rounded text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
              Workflow 3.4
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Staff Request • IT Optimization • Manager Budget Approval • Finance PO & Automatic CMDB Check-In
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Raise Procurement Request</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Requisitions Pipeline ({procurements.length})
          </div>

          {procurements.map((p) => {
            const isSelected = selectedProc?._id === p._id;
            let statusBadge = 'bg-slate-700 text-slate-300';
            if (p.status === 'Delivered_CheckedIn') statusBadge = 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
            if (p.status === 'Finance_Paid' || p.status === 'Manager_Approved') statusBadge = 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30';
            if (p.status === 'Rejected') statusBadge = 'bg-rose-500/20 text-rose-300 border border-rose-500/30';

            return (
              <div
                key={p._id}
                onClick={() => setSelectedProc(p)}
                className={`p-4 rounded-xl border transition cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800/90 border-indigo-500/80 shadow-md'
                    : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-indigo-400">{p.reqNumber}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${statusBadge}`}>
                    {p.status.replace('_', ' ')}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white mt-1.5">{p.item}</h3>
                <div className="text-[11px] text-slate-400">
                  Qty: {p.quantity} • Est: <span className="text-emerald-400 font-semibold">${p.estimatedCost}</span> • Requested by: {p.requestedBy}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Detail / Approval Pipeline Pane */}
        <div className="lg:col-span-7">
          {selectedProc ? (
            <div className="p-6 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow-xl space-y-6">
              {/* Header */}
              <div className="border-b border-slate-700/60 pb-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-indigo-400">{selectedProc.reqNumber}</span>
                  <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-slate-700 text-slate-200">
                    {selectedProc.status}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white mt-2">{selectedProc.item}</h2>
                <div className="text-xs text-slate-400 mt-1">
                  Department: <span className="text-slate-300">{selectedProc.department}</span> • Requester: <span className="text-slate-300">{selectedProc.requestedBy}</span>
                </div>
                <div className="mt-2 p-3 rounded-lg bg-slate-900/80 border border-slate-700/40 text-xs text-slate-300">
                  <span className="font-semibold text-slate-400 block mb-0.5">Business Justification:</span>
                  {selectedProc.justification}
                </div>
              </div>

              {/* 5-Step Procurement Workflow Stepper */}
              <div className="space-y-4">
                {/* Step 1: Requested */}
                <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-700/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="font-semibold text-white">1. Requisition Raised by Staff</div>
                      <div className="text-slate-400 text-[11px]">Requested: {selectedProc.item} (${selectedProc.estimatedCost})</div>
                    </div>
                  </div>
                  <span className="text-emerald-400 font-semibold">Done</span>
                </div>

                {/* Step 2: IT Review */}
                <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-700/60 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-400" />
                      <span>2. IT Support Review & Optimal Solution Check</span>
                    </div>
                    {selectedProc.itReview?.approved && (
                      <span className="text-emerald-400 font-semibold">IT Approved</span>
                    )}
                  </div>

                  {selectedProc.status === 'Requested' ? (
                    <div className="space-y-2 pt-1 border-t border-slate-800">
                      <input
                        type="text"
                        value={itRecommendation}
                        onChange={(e) => setItRecommendation(e.target.value)}
                        placeholder="IT technical review notes / alternative hardware sku..."
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleItReview(true)}
                          className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                        >
                          Approve IT Spec & Forward to Manager
                        </button>
                        <button
                          onClick={() => handleItReview(false)}
                          className="px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-semibold"
                        >
                          Reject Request
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-300 text-[11px]">
                      Recommended Option: "{selectedProc.itReview?.recommendedOption || 'Standard'}" • Reviewed by: {selectedProc.itReview?.reviewedBy}
                    </div>
                  )}
                </div>

                {/* Step 3: Manager Approval */}
                <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-700/60 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <span>3. Department Manager Budget Approval</span>
                    </div>
                    {selectedProc.managerApproval?.status === 'Approved' && (
                      <span className="text-emerald-400 font-semibold">Manager Approved</span>
                    )}
                  </div>

                  {selectedProc.status === 'IT_Review' ? (
                    <div className="space-y-2 pt-1 border-t border-slate-800">
                      <input
                        type="text"
                        value={managerComment}
                        onChange={(e) => setManagerComment(e.target.value)}
                        placeholder="Manager approval comment or budget code..."
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleManagerApprove(true)}
                          className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white font-semibold"
                        >
                          Approve Budget & Forward to Finance
                        </button>
                        <button
                          onClick={() => handleManagerApprove(false)}
                          className="px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-semibold"
                        >
                          Decline Request
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-300 text-[11px]">
                      Status: {selectedProc.managerApproval?.status} • Approver: {selectedProc.managerApproval?.approvedBy}
                    </div>
                  )}
                </div>

                {/* Step 4: Finance Payment Authorization */}
                <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-700/60 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-white flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      <span>4. Finance Payment & Purchase Order (PO)</span>
                    </div>
                    {selectedProc.financePayment?.status === 'Paid / Authorized' && (
                      <span className="text-emerald-400 font-semibold">Paid: {selectedProc.financePayment.poNumber}</span>
                    )}
                  </div>

                  {selectedProc.status === 'Manager_Approved' ? (
                    <div className="space-y-2 pt-1 border-t border-slate-800">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={poNumber}
                          onChange={(e) => setPoNumber(e.target.value)}
                          placeholder="PO Number"
                          className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white"
                        />
                        <button
                          onClick={handleFinanceAuthorize}
                          className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                        >
                          Authorize Payment & Release PO to IT
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Step 5: Order Placement, Delivery Check-in & CMDB Auto-Tagging */}
                <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/50 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-white flex items-center gap-2">
                      <PackageCheck className="w-4 h-4 text-cyan-400" />
                      <span>5. IT Order Placement & Delivery QA Check-in</span>
                    </div>
                    {selectedProc.status === 'Delivered_CheckedIn' && (
                      <span className="text-emerald-400 font-bold">Checked In to CMDB</span>
                    )}
                  </div>

                  {selectedProc.status === 'Finance_Paid' ? (
                    <div className="space-y-3 pt-1 border-t border-slate-800">
                      <p className="text-slate-300">
                        Order was placed with vendor. Hardware has arrived at the receiving dock. Conduct physical check and automatically generate CMDB asset tag:
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Serial Number (e.g. SN-88294)"
                          value={serialNumber}
                          onChange={(e) => setSerialNumber(e.target.value)}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                        />
                        <input
                          type="text"
                          placeholder="Deploy Location (e.g. Bay A Desk 12)"
                          value={room}
                          onChange={(e) => setRoom(e.target.value)}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                        />
                      </div>
                      <button
                        onClick={handleDeliveryCheckIn}
                        className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center gap-2"
                      >
                        <PackageCheck className="w-4 h-4" />
                        <span>Accept Delivery, Generate CMDB Tag & Assign to Staff</span>
                      </button>
                    </div>
                  ) : selectedProc.status === 'Delivered_CheckedIn' ? (
                    <div className="text-emerald-300">
                      Asset delivered and registered in CMDB. Generated Tags:{' '}
                      <span className="font-mono font-bold">
                        {(selectedProc.deliveryCheckIn?.assetTagsCreated || []).join(', ')}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-xl bg-slate-800/40 border border-slate-700/60 text-slate-400 text-xs">
              Select a procurement requisition.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Raise Procurement */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-indigo-400" />
                <span>New IT Procurement Request</span>
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Item / Hardware Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dell UltraSharp 32 4K Monitor or Cisco Catalyst Switch"
                  value={item}
                  onChange={(e) => setItem(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Estimated Total Cost ($) *</label>
                  <input
                    type="number"
                    required
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Operational Justification *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain why this equipment is needed for project delivery or productivity..."
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                >
                  Submit for IT Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
