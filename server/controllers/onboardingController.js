const store = require('../data/store');
const { logAudit } = require('../middleware/audit');

const getOnboardings = (req, res) => {
  const onbColl = store.collection('onboardings');
  res.json({ success: true, count: onbColl.count(), data: onbColl.find() });
};

const getOnboardingById = (req, res) => {
  const onb = store.collection('onboardings').findById(req.params.id);
  if (!onb) return res.status(404).json({ success: false, message: 'Onboarding record not found' });
  res.json({ success: true, data: onb });
};

// Step 1: HR Initiates Draft (Image 5: First name, Last name, DOB, Designation, Department, Primary Key)
const createDraft = (req, res) => {
  const { firstName, lastName, employeeName, dob, personalEmail, department, designation, managerName, startDate, actorName } = req.body;
  const fullName = employeeName || `${firstName || ''} ${lastName || ''}`.trim();
  if (!fullName || !personalEmail || !department) {
    return res.status(400).json({ success: false, message: 'Name, email, and department are required' });
  }

  const onbColl = store.collection('onboardings');
  const count = onbColl.count() + 1;
  const primaryKey = `EMP-PK-${Date.now().toString().slice(-6)}`;
  const onboardingId = `ONB-2026-${String(count).padStart(3, '0')}`;

  const newOnboarding = onbColl.insert({
    onboardingId,
    primaryKey,
    firstName: firstName || fullName.split(' ')[0],
    lastName: lastName || fullName.split(' ')[1] || '',
    dob: dob || '1998-05-15',
    employeeName: fullName,
    personalEmail,
    department,
    designation: designation || 'Associate',
    managerName: managerName || 'Unassigned',
    startDate: startDate || new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
    step: 'HR_DRAFT', // HR_DRAFT -> EMPLOYEE_INPUT -> HR_VERIFIED -> IT_PROVISIONED -> Completed
    employeeDetails: {
      phone: '',
      address: '',
      emergencyContact: '',
      preferredLaptop: 'Dell Latitude Enterprise'
    },
    securityGroups: ['Global-Staff'],
    itCredentials: {
      networkId: '',
      systemId: '',
      corporateEmail: '',
      tempPassword: '',
      badgeId: ''
    },
    status: 'In Progress',
    history: [
      {
        step: 'HR_DRAFT',
        by: actorName || 'Sarah Jenkins (HR)',
        at: new Date().toISOString()
      }
    ]
  });

  const io = req.app.get('io');
  if (io) io.emit('onboarding_updated', newOnboarding);

  logAudit(
    io,
    actorName || 'Sarah Jenkins',
    'hr',
    'ONBOARDING_HR_DRAFT_CREATED',
    'Onboarding',
    newOnboarding._id,
    `HR initiated onboarding draft ${onboardingId} for ${employeeName} (${department})`,
    req.ip
  );

  res.status(201).json({ success: true, data: newOnboarding });
};

// Step 2: Employee Completes Form
const employeeSubmit = (req, res) => {
  const { id } = req.params;
  const { phone, address, emergencyContact, preferredLaptop } = req.body;
  const onbColl = store.collection('onboardings');
  const onb = onbColl.findById(id);

  if (!onb) return res.status(404).json({ success: false, message: 'Onboarding record not found' });

  const history = onb.history || [];
  history.push({
    step: 'EMPLOYEE_INPUT',
    by: onb.employeeName,
    at: new Date().toISOString()
  });

  const updated = onbColl.findByIdAndUpdate(id, {
    step: 'EMPLOYEE_INPUT',
    employeeDetails: {
      phone: phone || onb.employeeDetails.phone,
      address: address || onb.employeeDetails.address,
      emergencyContact: emergencyContact || onb.employeeDetails.emergencyContact,
      preferredLaptop: preferredLaptop || onb.employeeDetails.preferredLaptop
    },
    history
  });

  const io = req.app.get('io');
  if (io) io.emit('onboarding_updated', updated);

  logAudit(
    io,
    onb.employeeName,
    'employee',
    'ONBOARDING_EMPLOYEE_SUBMITTED',
    'Onboarding',
    id,
    `Candidate ${onb.employeeName} submitted profile and equipment preferences`,
    req.ip
  );

  res.json({ success: true, data: updated });
};

// Step 3: HR Verification & Group Assignment
const hrVerify = (req, res) => {
  const { id } = req.params;
  const { securityGroups, managerName, actorName } = req.body;
  const onbColl = store.collection('onboardings');
  const onb = onbColl.findById(id);

  if (!onb) return res.status(404).json({ success: false, message: 'Onboarding record not found' });

  const history = onb.history || [];
  history.push({
    step: 'HR_VERIFIED',
    by: actorName || 'Sarah Jenkins (HR)',
    at: new Date().toISOString()
  });

  const updated = onbColl.findByIdAndUpdate(id, {
    step: 'HR_VERIFIED',
    securityGroups: securityGroups || onb.securityGroups,
    managerName: managerName || onb.managerName,
    history
  });

  const io = req.app.get('io');
  if (io) io.emit('onboarding_updated', updated);

  logAudit(
    io,
    actorName || 'Sarah Jenkins',
    'hr',
    'ONBOARDING_HR_VERIFIED',
    'Onboarding',
    id,
    `HR verified details for ${onb.employeeName}. Assigned groups: [${(securityGroups || []).join(', ')}]. Forwarded to IT Support.`,
    req.ip
  );

  res.json({ success: true, data: updated });
};

// Step 4: IT Provisioning (Creates Network/System ID & sends credentials)
const itProvision = (req, res) => {
  const { id } = req.params;
  const { networkId, systemId, corporateEmail, tempPassword, badgeId, actorName } = req.body;
  const onbColl = store.collection('onboardings');
  const onb = onbColl.findById(id);

  if (!onb) return res.status(404).json({ success: false, message: 'Onboarding record not found' });

  // Generate IDs if not provided
  const cleanFirst = onb.employeeName.toLowerCase().split(' ')[0];
  const netId = networkId || `NET_${cleanFirst.toUpperCase()}_${Math.floor(10 + Math.random() * 90)}`;
  const sysId = systemId || `SYS-EMP-${Date.now().toString().slice(-4)}`;
  const corpEmail = corporateEmail || `${cleanFirst}.${(onb.employeeName.toLowerCase().split(' ')[1] || 'emp')}@enterprise.local`;
  const tPassword = tempPassword || `Welcome#${new Date().getFullYear()}!${Math.floor(100 + Math.random() * 900)}`;
  const bId = badgeId || `BDG-${Math.floor(1000 + Math.random() * 9000)}`;

  const history = onb.history || [];
  history.push({
    step: 'IT_PROVISIONED',
    by: actorName || 'IT Support (Vishan / Harindy)',
    at: new Date().toISOString()
  });

  const itCredentials = {
    networkId: netId,
    systemId: sysId,
    corporateEmail: corpEmail,
    tempPassword: tPassword,
    badgeId: bId,
    welcomeEmailSentAt: new Date().toISOString()
  };

  const updated = onbColl.findByIdAndUpdate(id, {
    step: 'IT_PROVISIONED',
    status: 'Completed',
    itCredentials,
    history
  });

  // Create active employee user in users collection
  const usersColl = store.collection('users');
  usersColl.insert({
    _id: `usr_${cleanFirst}_${Date.now().toString().slice(-4)}`,
    name: onb.employeeName,
    email: corpEmail,
    personalEmail: onb.personalEmail,
    role: 'employee',
    roleLabel: onb.designation,
    department: onb.department,
    networkId: netId,
    systemId: sysId,
    badgeId: bId,
    groups: onb.securityGroups,
    managerName: onb.managerName,
    status: 'Active'
  });

  const io = req.app.get('io');
  if (io) io.emit('onboarding_updated', updated);

  logAudit(
    io,
    actorName || 'IT Support',
    'itsm_lead',
    'ONBOARDING_IT_PROVISIONED',
    'Onboarding',
    id,
    `IT provisioned Network ID (${netId}), System ID (${sysId}), Corporate Email (${corpEmail}) and dispatched credentials to ${onb.personalEmail}`,
    req.ip
  );

  res.json({ success: true, data: updated });
};

// Department Transfer Workflow
const requestDepartmentTransfer = (req, res) => {
  const { userId, newDepartment, newManagerName, newGroups, reason, actorName } = req.body;
  const usersColl = store.collection('users');
  const user = usersColl.findById(userId);

  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const oldDept = user.department;
  const oldManager = user.managerName;

  const updated = usersColl.findByIdAndUpdate(userId, {
    department: newDepartment,
    managerName: newManagerName || user.managerName,
    groups: newGroups || user.groups,
    transferHistory: [
      ...(user.transferHistory || []),
      {
        fromDepartment: oldDept,
        toDepartment: newDepartment,
        fromManager: oldManager,
        toManager: newManagerName,
        approvedBy: actorName || 'HR & Manager',
        reason,
        transferredAt: new Date().toISOString()
      }
    ]
  });

  const io = req.app.get('io');
  if (io) io.emit('user_updated', updated);

  logAudit(
    io,
    actorName || 'HR Management',
    'hr',
    'DEPARTMENT_TRANSFER_COMPLETED',
    'User',
    userId,
    `Completed department transfer for ${user.name}: ${oldDept} -> ${newDepartment}. Updated access groups & manager.`,
    req.ip
  );

  res.json({ success: true, data: updated });
};

module.exports = {
  getOnboardings,
  getOnboardingById,
  createDraft,
  employeeSubmit,
  hrVerify,
  itProvision,
  requestDepartmentTransfer
};
