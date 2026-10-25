const store = require('../data/store');
const { logAudit } = require('../middleware/audit');

const getProcurements = (req, res) => {
  const procColl = store.collection('procurements');
  res.json({ success: true, count: procColl.count(), data: procColl.find() });
};

const getProcurementById = (req, res) => {
  const p = store.collection('procurements').findById(req.params.id);
  if (!p) return res.status(404).json({ success: false, message: 'Procurement request not found' });
  res.json({ success: true, data: p });
};

// Step 1: Staff member raises request
const createProcurement = (req, res) => {
  const { item, category, quantity, estimatedCost, justification, requestedBy, department } = req.body;
  if (!item || !estimatedCost || !requestedBy) {
    return res.status(400).json({ success: false, message: 'Item, estimated cost, and requester required' });
  }

  const procColl = store.collection('procurements');
  const count = procColl.count() + 1;
  const reqNumber = `PR-2026-${String(count).padStart(3, '0')}`;

  const newProc = procColl.insert({
    reqNumber,
    item,
    category: category || 'Hardware / IT Equipment',
    quantity: Number(quantity) || 1,
    estimatedCost: Number(estimatedCost),
    justification: justification || 'Operational requirement',
    requestedBy,
    department: department || 'Engineering',
    status: 'Requested', // Requested -> IT_Review -> Manager_Approved -> Finance_Paid -> Order_Placed -> Delivered_CheckedIn -> Rejected
    itReview: {
      reviewedBy: null,
      recommendedOption: '',
      approved: false,
      reviewedAt: null
    },
    managerApproval: {
      approvedBy: null,
      status: 'Pending',
      approvedAt: null,
      comments: ''
    },
    financePayment: {
      poNumber: '',
      paidAt: null,
      status: 'Pending'
    },
    deliveryCheckIn: {
      deliveredAt: null,
      assetTagsCreated: []
    }
  });

  const io = req.app.get('io');
  if (io) io.emit('procurement_updated', newProc);

  logAudit(
    io,
    requestedBy,
    'employee',
    'PROCUREMENT_REQUEST_CREATED',
    'Procurement',
    newProc._id,
    `Staff raised procurement request ${reqNumber} for "${item}" (Qty: ${quantity}, \$${estimatedCost})`,
    req.ip
  );

  res.status(201).json({ success: true, data: newProc });
};

// Step 2: IT Review
const itReviewProcurement = (req, res) => {
  const { id } = req.params;
  const { approved, recommendedOption, actorName } = req.body;
  const procColl = store.collection('procurements');
  const proc = procColl.findById(id);

  if (!proc) return res.status(404).json({ success: false, message: 'Procurement request not found' });

  const updated = procColl.findByIdAndUpdate(id, {
    status: approved ? 'IT_Review' : 'Rejected',
    itReview: {
      reviewedBy: actorName || 'Harindy Jayasuriya (ITAM)',
      recommendedOption: recommendedOption || 'Standard enterprise SKU approved',
      approved: Boolean(approved),
      reviewedAt: new Date().toISOString()
    }
  });

  const io = req.app.get('io');
  if (io) io.emit('procurement_updated', updated);

  logAudit(
    io,
    actorName || 'IT Support',
    'itam_lead',
    approved ? 'PROCUREMENT_IT_APPROVED' : 'PROCUREMENT_IT_REJECTED',
    'Procurement',
    id,
    `IT reviewed ${proc.reqNumber}: ${approved ? 'Optimal hardware validated, forwarded to Department Manager.' : 'Rejected alternative.'}`,
    req.ip
  );

  res.json({ success: true, data: updated });
};

// Step 3: Manager Approval
const managerApproveProcurement = (req, res) => {
  const { id } = req.params;
  const { approved, comments, actorName } = req.body;
  const procColl = store.collection('procurements');
  const proc = procColl.findById(id);

  if (!proc) return res.status(404).json({ success: false, message: 'Procurement request not found' });

  const updated = procColl.findByIdAndUpdate(id, {
    status: approved ? 'Manager_Approved' : 'Rejected',
    managerApproval: {
      approvedBy: actorName || 'David Miller (Manager)',
      status: approved ? 'Approved' : 'Rejected',
      approvedAt: new Date().toISOString(),
      comments: comments || (approved ? 'Approved within departmental Q4 budget.' : 'Budget cap exceeded.')
    }
  });

  const io = req.app.get('io');
  if (io) io.emit('procurement_updated', updated);

  logAudit(
    io,
    actorName || 'Department Manager',
    'manager',
    approved ? 'PROCUREMENT_MANAGER_APPROVED' : 'PROCUREMENT_MANAGER_REJECTED',
    'Procurement',
    id,
    `Manager ${actorName || 'David Miller'} ${approved ? 'approved' : 'rejected'} ${proc.reqNumber} (\$${proc.estimatedCost}).`,
    req.ip
  );

  res.json({ success: true, data: updated });
};

// Step 4: Finance Approval & Payment Authorization
const financeAuthorizeProcurement = (req, res) => {
  const { id } = req.params;
  const { poNumber, actorName } = req.body;
  const procColl = store.collection('procurements');
  const proc = procColl.findById(id);

  if (!proc) return res.status(404).json({ success: false, message: 'Procurement request not found' });

  const generatedPo = poNumber || `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  const updated = procColl.findByIdAndUpdate(id, {
    status: 'Finance_Paid',
    financePayment: {
      poNumber: generatedPo,
      paidAt: new Date().toISOString(),
      status: 'Paid / Authorized'
    }
  });

  const io = req.app.get('io');
  if (io) io.emit('procurement_updated', updated);

  logAudit(
    io,
    actorName || 'Priya Sharma (Finance)',
    'finance',
    'PROCUREMENT_FINANCE_PAID',
    'Procurement',
    id,
    `Finance released payment for ${proc.reqNumber}. Purchase Order issued: ${generatedPo}.`,
    req.ip
  );

  res.json({ success: true, data: updated });
};

// Step 5: IT Order Placement & Delivery QA Check-in (Creates Asset in CMDB!)
const itCheckInDelivery = (req, res) => {
  const { id } = req.params;
  const { serialNumber, room, rack, actorName } = req.body;
  const procColl = store.collection('procurements');
  const proc = procColl.findById(id);

  if (!proc) return res.status(404).json({ success: false, message: 'Procurement request not found' });

  // Automatically register asset in CMDB
  const assetsColl = store.collection('assets');
  const assetTags = [];

  for (let i = 0; i < (proc.quantity || 1); i++) {
    const assetTag = `ASSET-${proc.category.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}${i > 0 ? '-' + (i + 1) : ''}`;
    const newAsset = assetsColl.insert({
      assetTag,
      name: proc.item,
      category: proc.category.includes('Display') ? 'Monitor' : 'Hardware',
      model: proc.item,
      serialNumber: serialNumber || `SN-PROC-${Date.now().toString().slice(-6)}`,
      ipAddress: 'DHCP Reserved',
      macAddress: '00:1A:2B:3C:99:' + Math.floor(10 + Math.random() * 89),
      switchPort: 'Gi1/0/15',
      vlan: 20,
      room: room || 'Engineering Bay A',
      rack: rack || 'Workstation Desk',
      status: 'In Use',
      health: 'Online',
      pingLatency: 1.1,
      assignedTo: proc.requestedBy,
      purchaseDate: new Date().toISOString().split('T')[0],
      warrantyExpiry: '2028-10-25',
      cost: proc.estimatedCost,
      lastDiscovered: new Date().toISOString()
    });
    assetTags.push(assetTag);
  }

  const updated = procColl.findByIdAndUpdate(id, {
    status: 'Delivered_CheckedIn',
    deliveryCheckIn: {
      deliveredAt: new Date().toISOString(),
      assetTagsCreated: assetTags,
      checkedBy: actorName || 'IT Support (Harindy)'
    }
  });

  const io = req.app.get('io');
  if (io) {
    io.emit('procurement_updated', updated);
    io.emit('asset_created', { count: assetTags.length });
  }

  logAudit(
    io,
    actorName || 'IT Support',
    'itam_lead',
    'PROCUREMENT_DELIVERED_AND_CHECKED_IN',
    'Procurement',
    id,
    `Delivery verified for ${proc.reqNumber}. Registered ${assetTags.length} asset(s) in CMDB: [${assetTags.join(', ')}] assigned to ${proc.requestedBy}.`,
    req.ip
  );

  res.json({ success: true, data: updated, generatedAssetTags: assetTags });
};

module.exports = {
  getProcurements,
  getProcurementById,
  createProcurement,
  itReviewProcurement,
  managerApproveProcurement,
  financeAuthorizeProcurement,
  itCheckInDelivery
};
