import React, { useState, useEffect } from 'react';
import api, { socket } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  UserPlus,
  CheckCircle,
  Clock,
  ArrowRight,
  Shield,
  Mail,
  UserCheck,
  Send,
  Building,
  RefreshCw,
  Plus
} from 'lucide-react';

export default function OnboardingPage() {
  const { currentUser } = useAuth();
  const [onboardings, setOnboardings] = useState([]);
  const [selectedOnb, setSelectedOnb] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('onboarding'); // 'onboarding' | 'transfers'

  // Step 1: HR Draft Modal (Image 5)
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('1998-05-15');
  const [employeeName, setEmployeeName] = useState('');
  const [personalEmail, setPersonalEmail] = useState('');
  const [department, setDepartment] = useState('Software Engineering');
  const [designation, setDesignation] = useState('Frontend Engineer');
  const [managerName, setManagerName] = useState('David Miller');

  // Step 2: Employee Form Input states
  const [phone, setPhone] = useState('+1 (555) 789-0123');
  const [address, setAddress] = useState('500 Tech Blvd, Apt 4B');
  const [emergencyContact, setEmergencyContact] = useState('Jane Vance (+1 555-111-2222)');
  const [preferredLaptop, setPreferredLaptop] = useState('MacBook Pro 16" M3 Max');

  // Step 3: HR Verify states
  const [selectedGroups, setSelectedGroups] = useState(['Engineering-Dev', 'Global-Staff']);
  const availableGroups = ['Engineering-Dev', 'Finance-Approvers', 'Cloud-Ops', 'HR-Core', 'GitHub-Committers', 'SAP-Treasury', 'Global-Staff'];

  // Step 4: IT Provisioning states
  const [provisionSysId, setProvisionSysId] = useState('');
  const [provisionNetId, setProvisionNetId] = useState('');

  // Department Transfer states
  const [users, setUsers] = useState([]);
  const [transferUserId, setTransferUserId] = useState('');
  const [transferNewDept, setTransferNewDept] = useState('Information Security & Compliance');
  const [transferNewManager, setTransferNewManager] = useState('Malmika Wickramasinghe');
  const [transferReason, setTransferReason] = useState('Internal rotation to SecOps');

  useEffect(() => {
    loadOnboardings();
    loadUsers();

    const handleUpdated = () => loadOnboardings();
    socket.on('onboarding_updated', handleUpdated);

    return () => {
      socket.off('onboarding_updated', handleUpdated);
    };
  }, []);

  const loadOnboardings = async () => {
    try {
      setLoading(true);
      const res = await api.getOnboardings();
      setOnboardings(res.data.data);
      if (res.data.data.length > 0 && !selectedOnb) {
        setSelectedOnb(res.data.data[0]);
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

  // Step 1: HR Initiates Draft (Image 5)
  const handleCreateDraft = async (e) => {
    e.preventDefault();
    try {
      await api.createDraftOnboarding({
        firstName,
        lastName,
        employeeName: `${firstName} ${lastName}`.trim() || employeeName,
        dob,
        personalEmail,
        department,
        designation,
        managerName,
        actorName: currentUser.name
      });
      setShowDraftModal(false);
      setFirstName('');
      setLastName('');
      setPersonalEmail('');
      loadOnboardings();
    } catch (err) {
      alert('Failed to initiate onboarding draft: ' + (err.response?.data?.message || err.message));
    }
  };

  // Step 2: Employee Action
  const handleEmployeeSubmit = async () => {
    if (!selectedOnb) return;
    try {
      await api.employeeSubmitOnboarding(selectedOnb._id, {
        phone,
        address,
        emergencyContact,
        preferredLaptop
      });
      loadOnboardings();
    } catch (err) {
      alert('Failed to submit employee form');
    }
  };

  // Step 3: HR Verification
  const handleHrVerify = async () => {
    if (!selectedOnb) return;
    try {
      await api.hrVerifyOnboarding(selectedOnb._id, {
        securityGroups: selectedGroups,
        managerName: selectedOnb.managerName,
        actorName: currentUser.name
      });
      loadOnboardings();
    } catch (err) {
      alert('Failed to verify candidate');
    }
  };

  // Step 4: IT Provisioning
  const handleItProvision = async () => {
    if (!selectedOnb) return;
    try {
      await api.itProvisionOnboarding(selectedOnb._id, {
        networkId: provisionNetId,
        systemId: provisionSysId,
        actorName: currentUser.name
      });
      loadOnboardings();
    } catch (err) {
      alert('Failed to provision IT credentials');
    }
  };

  // Department Transfer
  const handleDepartmentTransfer = async (e) => {
    e.preventDefault();
    if (!transferUserId) return;
    try {
      await api.requestDepartmentTransfer({
        userId: transferUserId,
        newDepartment: transferNewDept,
        newManagerName: transferNewManager,
        newGroups: ['SecOps-Core', 'Global-Staff'],
        reason: transferReason,
        actorName: currentUser.name
      });
      alert('Department transfer executed successfully! Access groups and manager updated.');
      loadUsers();
    } catch (err) {
      alert('Failed to transfer department');
    }
  };

  const stepsList = [
    { key: 'HR_DRAFT', label: '1. HR Initiates Draft', actor: 'HR Specialist' },
    { key: 'EMPLOYEE_INPUT', label: '2. Candidate Submits Form', actor: 'New Employee' },
    { key: 'HR_VERIFIED', label: '3. HR Verifies & Groups', actor: 'HR Specialist' },
    { key: 'IT_PROVISIONED', label: '4. IT System & Net ID', actor: 'IT Support' }
  ];

  const getStepIndex = (step) => {
    if (step === 'HR_DRAFT') return 0;
    if (step === 'EMPLOYEE_INPUT') return 1;
    if (step === 'HR_VERIFIED') return 2;
    if (step === 'IT_PROVISIONED') return 3;
    return 4;
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Employee Onboarding & Lifecycle</h1>
            <span className="px-2 py-0.5 rounded text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold">
              Workflow 3.1 & Transfers
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            HR Draft Generation • Candidate Detail Intake • Role-Based Group Allocation • IT System ID Provisioning
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-800 p-1 rounded-lg border border-slate-700 flex text-xs">
            <button
              onClick={() => setActiveTab('onboarding')}
              className={`px-3 py-1 rounded-md font-medium transition ${
                activeTab === 'onboarding' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              New Hire Onboarding
            </button>
            <button
              onClick={() => setActiveTab('transfers')}
              className={`px-3 py-1 rounded-md font-medium transition ${
                activeTab === 'transfers' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Department Transfers
            </button>
          </div>

          {activeTab === 'onboarding' && (
            <button
              onClick={() => setShowDraftModal(true)}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Initiate Onboarding</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'onboarding' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Onboarding Records List */}
          <div className="lg:col-span-4 space-y-3">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
              Onboarding Pipeline ({onboardings.length})
            </div>
            {onboardings.map((onb) => {
              const isSelected = selectedOnb?._id === onb._id;
              const stepIdx = getStepIndex(onb.step);

              return (
                <div
                  key={onb._id}
                  onClick={() => setSelectedOnb(onb)}
                  className={`p-4 rounded-xl border transition cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800/90 border-indigo-500/80 shadow-md'
                      : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800/70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-indigo-400">{onb.onboardingId}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        onb.status === 'Completed'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      }`}
                    >
                      {onb.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white mt-1.5">{onb.employeeName}</h3>
                  <div className="text-[11px] text-slate-400">
                    {onb.designation} • <span className="text-slate-300">{onb.department}</span>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-700/40 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Stage: Step {stepIdx + 1} of 4</span>
                    <span className="text-indigo-300 font-medium">{onb.step}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Interactive 4-Step Stepper & Action Card */}
          <div className="lg:col-span-8">
            {selectedOnb ? (
              <div className="p-6 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow-xl space-y-6">
                {/* Header */}
                <div className="border-b border-slate-700/60 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-400">{selectedOnb.onboardingId}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-xs text-slate-400">Start Date: {selectedOnb.startDate}</span>
                    </div>
                    <h2 className="text-lg font-bold text-white mt-1">{selectedOnb.employeeName}</h2>
                    <div className="text-xs text-slate-400">
                      Personal Email: <span className="text-slate-300 font-mono">{selectedOnb.personalEmail}</span> • Manager: <span className="text-slate-300">{selectedOnb.managerName}</span>
                    </div>
                  </div>
                </div>

                {/* Stepper Progress Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {stepsList.map((st, idx) => {
                    const currentIdx = getStepIndex(selectedOnb.step);
                    const isDone = currentIdx > idx || selectedOnb.status === 'Completed';
                    const isCurrent = currentIdx === idx && selectedOnb.status !== 'Completed';

                    return (
                      <div
                        key={st.key}
                        className={`p-3 rounded-lg border text-xs ${
                          isDone
                            ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                            : isCurrent
                            ? 'bg-indigo-950/60 border-indigo-500 text-indigo-200 shadow-md ring-1 ring-indigo-500'
                            : 'bg-slate-900/60 border-slate-800 text-slate-500'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase">{st.actor}</span>
                          {isDone ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Clock className="w-3.5 h-3.5" />}
                        </div>
                        <div className="font-semibold mt-1 text-[11px]">{st.label}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Step Action Interactive Form */}
                <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-700/60 space-y-4">
                  {/* Step 1 Current */}
                  {selectedOnb.step === 'HR_DRAFT' && (
                    <div className="space-y-3 text-xs">
                      <div className="flex items-center gap-2 text-indigo-400 font-semibold">
                        <Clock className="w-4 h-4" />
                        <span>Stage 1 Complete: HR Initiated Draft</span>
                      </div>
                      <p className="text-slate-300">
                        HR created the candidate draft record. An invitation token is ready to send to candidate's personal email (
                        <span className="text-white font-mono">{selectedOnb.personalEmail}</span>).
                      </p>
                      <button
                        onClick={handleEmployeeSubmit}
                        className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Simulate Candidate Opening Email & Submitting Details</span>
                      </button>
                    </div>
                  )}

                  {/* Step 2 Current: Candidate Form */}
                  {selectedOnb.step === 'EMPLOYEE_INPUT' && (
                    <div className="space-y-4 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">Candidate Action: Employee Intake Form</span>
                        <span className="text-[10px] text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                          Waiting for Candidate Submission
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-400 mb-1">Contact Phone</label>
                          <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1">Residential Address</label>
                          <input
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1">Emergency Contact</label>
                          <input
                            type="text"
                            value={emergencyContact}
                            onChange={(e) => setEmergencyContact(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1">Hardware Preference</label>
                          <select
                            value={preferredLaptop}
                            onChange={(e) => setPreferredLaptop(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white"
                          >
                            <option value={'MacBook Pro 16" M3 Max'}>MacBook Pro 16" M3 Max</option>
                            <option value="Dell Latitude 5540 Enterprise">Dell Latitude 5540 Enterprise</option>
                            <option value="Lenovo ThinkPad P16s Workstation">Lenovo ThinkPad P16s Workstation</option>
                          </select>
                        </div>
                      </div>

                      <button
                        onClick={handleEmployeeSubmit}
                        className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Submit Completed Candidate Information</span>
                      </button>
                    </div>
                  )}

                  {/* Step 3 Current: HR Verification */}
                  {selectedOnb.step === 'HR_VERIFIED' && (
                    <div className="space-y-4 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">HR Action: Detail Verification & Group Assignment</span>
                        <span className="text-[10px] text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800">
                          HR Specialist Review
                        </span>
                      </div>

                      <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/60 space-y-1.5 text-slate-300">
                        <div>
                          Candidate Phone: <span className="text-white font-mono">{selectedOnb.employeeDetails?.phone || phone}</span>
                        </div>
                        <div>
                          Address: <span className="text-white">{selectedOnb.employeeDetails?.address || address}</span>
                        </div>
                        <div>
                          Preferred Equipment:{' '}
                          <span className="text-emerald-400 font-semibold">{selectedOnb.employeeDetails?.preferredLaptop || preferredLaptop}</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-medium mb-1.5">
                          Assign Department Security Groups (AD / LDAP Roles):
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {availableGroups.map((grp) => {
                            const isChecked = selectedGroups.includes(grp);
                            return (
                              <button
                                key={grp}
                                type="button"
                                onClick={() => {
                                  if (isChecked) setSelectedGroups(selectedGroups.filter((g) => g !== grp));
                                  else setSelectedGroups([...selectedGroups, grp]);
                                }}
                                className={`px-2.5 py-1 rounded-md text-xs font-medium border transition ${
                                  isChecked
                                    ? 'bg-purple-600 text-white border-purple-500'
                                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                                }`}
                              >
                                {grp}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <button
                        onClick={handleHrVerify}
                        className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold flex items-center gap-1.5"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>Verify & Handover to IT Support Provisioning</span>
                      </button>
                    </div>
                  )}

                  {/* Step 4 Current: IT Provisioning */}
                  {selectedOnb.step === 'IT_PROVISIONED' || selectedOnb.status === 'Completed' ? (
                    <div className="space-y-4 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm flex items-center gap-1.5">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          <span>IT Provisioning Completed & Account Active</span>
                        </span>
                        <span className="text-[10px] text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                          Active System Record
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-lg bg-slate-800/90 border border-slate-700/60 font-mono text-[11px]">
                        <div>
                          <span className="text-slate-400">Network ID:</span>
                          <div className="text-cyan-300 font-bold">{selectedOnb.itCredentials?.networkId}</div>
                        </div>
                        <div>
                          <span className="text-slate-400">System ID:</span>
                          <div className="text-white font-bold">{selectedOnb.itCredentials?.systemId}</div>
                        </div>
                        <div>
                          <span className="text-slate-400">Corporate Email:</span>
                          <div className="text-indigo-300">{selectedOnb.itCredentials?.corporateEmail}</div>
                        </div>
                        <div>
                          <span className="text-slate-400">Security Badge:</span>
                          <div className="text-amber-300">{selectedOnb.itCredentials?.badgeId}</div>
                        </div>
                      </div>

                      <div className="text-emerald-400 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5" />
                        <span>Welcome kit & temporary credentials dispatched to candidate personal email ({selectedOnb.personalEmail}).</span>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center rounded-xl bg-slate-800/40 border border-slate-700/60 text-slate-400 text-xs">
                Select an onboarding candidate from the pipeline list.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Department Transfers Workflow Tab */
        <div className="p-6 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow-xl space-y-6 max-w-2xl">
          <div className="border-b border-slate-700/60 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-indigo-400" />
              <span>Ongoing Department Transfer Request (Section 3.1)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Internal rotation workflow: Manager reviews change request, HR approves, and IT dynamically updates system access groups.
            </p>
          </div>

          <form onSubmit={handleDepartmentTransfer} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Select Employee *</label>
              <select
                required
                value={transferUserId}
                onChange={(e) => setTransferUserId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
              >
                <option value="">-- Choose Employee --</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} (Current: {u.department}) - Mgr: {u.managerName}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Target Department *</label>
                <select
                  value={transferNewDept}
                  onChange={(e) => setTransferNewDept(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                >
                  <option value="Information Security & Compliance">Information Security & Compliance</option>
                  <option value="Network Operations & Spatial Discovery">Network Operations & Spatial Discovery</option>
                  <option value="IT Service Management">IT Service Management</option>
                  <option value="Finance & Accounting">Finance & Accounting</option>
                  <option value="Software Engineering">Software Engineering</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">New Reporting Manager *</label>
                <input
                  type="text"
                  required
                  value={transferNewManager}
                  onChange={(e) => setTransferNewManager(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Reason for Department Transfer</label>
              <textarea
                rows={3}
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
              >
                Execute Approved Department Transfer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Initiate Draft Onboarding */}
      {showDraftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-400" />
                <span>HR: Initiate New Employee Onboarding</span>
              </h3>
              <button onClick={() => setShowDraftModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateDraft} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Jane"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Date of Birth (DOB) *</label>
                  <input
                    type="date"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Personal Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="jane.doe@gmail.com"
                    value={personalEmail}
                    onChange={(e) => setPersonalEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
                  >
                    <option value="Software Engineering">Software Engineering</option>
                    <option value="IT Service Management">IT Service Management</option>
                    <option value="Network Operations">Network Operations</option>
                    <option value="Finance & Accounting">Finance & Accounting</option>
                    <option value="Human Resources">Human Resources</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Designation / Title</label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Reporting Manager</label>
                <input
                  type="text"
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDraftModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                >
                  Generate Onboarding Draft ID
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
