const store = require('../data/store');
const { logAudit } = require('../middleware/audit');

const getOffboardings = (req, res) => {
  const offColl = store.collection('offboardings');
  res.json({ success: true, count: offColl.count(), data: offColl.find() });
};

const getOffboardingById = (req, res) => {
  const off = store.collection('offboardings').findById(req.params.id);
  if (!off) return res.status(404).json({ success: false, message: 'Offboarding record not found' });
  res.json({ success: true, data: off });
};

// Step 1: HR Initiates Offboarding & System automatically aggregates allocated assets & licenses
const initiateOffboarding = (req, res) => {
  const { employeeId, exitDate, reason, actorName } = req.body;
  const usersColl = store.collection('users');
  const user = usersColl.findById(employeeId);

  if (!user) return res.status(404).json({ success: false, message: 'Employee not found' });

  // Find all hardware assets assigned to this user
  const assetsColl = store.collection('assets');
  const userAssets = assetsColl.find(a => a.assignedTo === employeeId).map(a => ({
    assetId: a._id,
    assetTag: a.assetTag,
    name: a.name,
    category: a.category,
    condition: 'Pending', // Pending, Good, Broken
    checkedAt: null,
    notes: ''
  }));

  // Find all software licenses assigned to this user
  const licensesColl = store.collection('licenses');
  const allLicenses = licensesColl.find();
  const userLicenses = [];
  allLicenses.forEach(lic => {
    if ((lic.assignedUsers || []).some(entry => entry.userId === employeeId)) {
      userLicenses.push({
        licenseId: lic._id,
        name: lic.name,
        vendor: lic.vendor
      });
    }
  });

  const offColl = store.collection('offboardings');
  const count = offColl.count() + 1;
  const offboardingId = `OFF-2026-${String(count).padStart(3, '0')}`;

  const delayedDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(); // 90 days / 3 months

  const newOffboarding = offColl.insert({
    offboardingId,
    employeeId,
    employeeName: user.name,
    department: user.department,
    managerName: user.managerName || 'Department Manager',
    exitDate: exitDate || new Date().toISOString().split('T')[0],
    reason: reason || 'End of Employment',
    status: 'Initiated', // Initiated -> Assets_Checked -> Automated_Cutoff_Complete -> Completed
    allocatedAssets: userAssets,
    allocatedLicenses: userLicenses,
    automatedCutoff: {
      executed: false,
      executedAt: null,
      groupsRemoved: false,
      adDisabled: false,
      autoReplySet: false,
      emailForwardedToManager: false
    },
    delayedLicenseRevocation: {
      scheduledDate: delayedDate,
      status: 'Scheduled (3-Month Archive Period)',
      revokedAt: null
    }
  });

  // Mark user status as Pending Offboarding
  usersColl.findByIdAndUpdate(employeeId, { status: 'Pending Offboarding' });

  const io = req.app.get('io');
  if (io) io.emit('offboarding_updated', newOffboarding);

  logAudit(
    io,
    actorName || 'Sarah Jenkins',
    'hr',
    'OFFBOARDING_INITIATED',
    'Offboarding',
    newOffboarding._id,
    `HR initiated offboarding for ${user.name} (${user.department}). Aggregated ${userAssets.length} assets & ${userLicenses.length} software licenses.`,
    req.ip
  );

  res.status(201).json({ success: true, data: newOffboarding });
};

// Step 2 & 3: Trigger Automated Offboarding Cutoff Sequence (One-Click)
const executeAutomatedCutoff = (req, res) => {
  const { id } = req.params;
  const { actorName } = req.body;
  const offColl = store.collection('offboardings');
  const off = offColl.findById(id);

  if (!off) return res.status(404).json({ success: false, message: 'Offboarding record not found' });

  const now = new Date().toISOString();

  // 1. Remove from all groups in User record
  // 2. Disable AD account
  // 3. Configure email auto-reply
  // 4. Forward email to manager
  const usersColl = store.collection('users');
  const user = usersColl.findById(off.employeeId);

  if (user) {
    usersColl.findByIdAndUpdate(off.employeeId, {
      groups: [],
      status: 'Disabled / Offboarded',
      adAccountDisabled: true,
      emailAutoReply: {
        active: true,
        message: `${off.employeeName} is no longer with the company. For urgent inquiries, please contact ${off.managerName}.`
      },
      emailForwardingTarget: off.managerName
    });
  }

  const updated = offColl.findByIdAndUpdate(id, {
    status: 'Automated_Cutoff_Complete',
    automatedCutoff: {
      executed: true,
      executedAt: now,
      groupsRemoved: true,
      adDisabled: true,
      autoReplySet: true,
      emailForwardedToManager: true
    }
  });

  const io = req.app.get('io');
  if (io) io.emit('offboarding_updated', updated);

  logAudit(
    io,
    actorName || 'IT Support',
    'itsm_lead',
    'OFFBOARDING_AUTOMATED_CUTOFF_EXECUTED',
    'Offboarding',
    id,
    `Automated Security Sequence Executed for ${off.employeeName}: Groups Purged, AD Account Disabled, Auto-reply set, Emails Forwarded to Manager (${off.managerName}).`,
    req.ip
  );

  res.json({ success: true, data: updated });
};

// Step 4: Asset Return & QA Inspection
const recordAssetReturn = (req, res) => {
  const { id } = req.params;
  const { assetId, condition, notes, actorName } = req.body; // condition: 'Good' | 'Broken'
  const offColl = store.collection('offboardings');
  const off = offColl.findById(id);

  if (!off) return res.status(404).json({ success: false, message: 'Offboarding record not found' });

  const allocatedAssets = (off.allocatedAssets || []).map(item => {
    if (item.assetId === assetId) {
      return {
        ...item,
        condition,
        notes: notes || '',
        checkedAt: new Date().toISOString()
      };
    }
    return item;
  });

  // Update CMDB hardware asset record
  const assetsColl = store.collection('assets');
  const asset = assetsColl.findById(assetId);

  if (asset) {
    if (condition === 'Good') {
      // Return to inventory
      assetsColl.findByIdAndUpdate(assetId, {
        status: 'Planned', // back in stock/inventory
        room: 'IT Secure Storage Cage 1',
        rack: 'Inventory Shelf A',
        assignedTo: null
      });
    } else {
      // Broken / Damaged: mark for repair and log HR flag
      assetsColl.findByIdAndUpdate(assetId, {
        status: 'In Repair',
        damageReport: notes || 'Hardware defect discovered during exit QA inspection'
      });
    }
  }

  const allChecked = allocatedAssets.every(a => a.condition !== 'Pending');
  const updateData = { allocatedAssets };
  if (allChecked && off.status === 'Initiated') {
    updateData.status = 'Assets_Checked';
  }

  const updated = offColl.findByIdAndUpdate(id, updateData);
  const io = req.app.get('io');
  if (io) io.emit('offboarding_updated', updated);

  logAudit(
    io,
    actorName || 'IT Support',
    'itam_lead',
    'OFFBOARDING_ASSET_QA_CHECKED',
    'Asset',
    assetId,
    `Hardware QA Checked for ${off.employeeName}: Asset ${asset?.assetTag} condition marked "${condition}". ${condition === 'Good' ? 'Returned to available inventory.' : 'Defect flagged to HR.'}`,
    req.ip
  );

  res.json({ success: true, data: updated });
};

// Step 5: Delayed 3-Month License Revocation Execution
const executeDelayedLicenseRevocation = (req, res) => {
  const { id } = req.params;
  const { actorName } = req.body;
  const offColl = store.collection('offboardings');
  const off = offColl.findById(id);

  if (!off) return res.status(404).json({ success: false, message: 'Offboarding record not found' });

  // Revoke all software licenses assigned to user
  const licensesColl = store.collection('licenses');
  const userLicenses = off.allocatedLicenses || [];

  userLicenses.forEach(entry => {
    const lic = licensesColl.findById(entry.licenseId);
    if (lic) {
      const remainingUsers = (lic.assignedUsers || []).filter(u => u.userId !== off.employeeId);
      licensesColl.findByIdAndUpdate(lic._id, {
        assignedUsers: remainingUsers,
        allocatedSeats: remainingUsers.length
      });
    }
  });

  const updated = offColl.findByIdAndUpdate(id, {
    status: 'Completed',
    delayedLicenseRevocation: {
      scheduledDate: off.delayedLicenseRevocation?.scheduledDate || new Date().toISOString(),
      status: 'Revoked (Archive Complete)',
      revokedAt: new Date().toISOString()
    }
  });

  const io = req.app.get('io');
  if (io) io.emit('offboarding_updated', updated);

  logAudit(
    io,
    actorName || 'IT Support',
    'itam_lead',
    'OFFBOARDING_LICENSES_REVOKED_POST_3MONTH',
    'Offboarding',
    id,
    `3-Month Delayed License Revocation executed for ${off.employeeName}. Reclaimed ${userLicenses.length} software seats to the licensing pool.`,
    req.ip
  );

  res.json({ success: true, data: updated });
};

module.exports = {
  getOffboardings,
  getOffboardingById,
  initiateOffboarding,
  executeAutomatedCutoff,
  recordAssetReturn,
  executeDelayedLicenseRevocation
};
