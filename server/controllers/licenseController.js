const store = require('../data/store');
const { logAudit } = require('../middleware/audit');

const getLicenses = (req, res) => {
  const licensesColl = store.collection('licenses');
  const licenses = licensesColl.find();

  // Attach enriched user info
  const usersColl = store.collection('users');
  const enriched = licenses.map(lic => {
    const assignedWithNames = (lic.assignedUsers || []).map(entry => {
      const u = usersColl.findById(entry.userId);
      return {
        ...entry,
        userName: u ? u.name : 'Unknown User',
        userEmail: u ? u.email : '',
        userDepartment: u ? u.department : ''
      };
    });
    return { ...lic, assignedUsers: assignedWithNames };
  });

  res.json({ success: true, count: enriched.length, data: enriched });
};

const createLicense = (req, res) => {
  const { name, vendor, licenseKey, totalSeats, costPerYear, renewalDate } = req.body;
  if (!name || !vendor || !totalSeats) {
    return res.status(400).json({ success: false, message: 'License Name, Vendor, and Total Seats required' });
  }

  const licensesColl = store.collection('licenses');
  const newLic = licensesColl.insert({
    name,
    vendor,
    licenseKey: licenseKey || `LIC-${Math.random().toString(36).substr(2, 12).toUpperCase()}`,
    totalSeats: Number(totalSeats),
    allocatedSeats: 0,
    costPerYear: Number(costPerYear) || 1200,
    renewalDate: renewalDate || '2027-01-01',
    status: 'Active',
    assignedUsers: []
  });

  const io = req.app.get('io');
  if (io) io.emit('license_created', newLic);

  logAudit(
    io,
    req.body.actorName || 'Harindy Jayasuriya',
    'itam_lead',
    'LICENSE_CREATED',
    'SoftwareLicense',
    newLic._id,
    `Registered new Software Contract: ${name} (${totalSeats} seats) from ${vendor}`,
    req.ip
  );

  res.status(201).json({ success: true, data: newLic });
};

const allocateLicense = (req, res) => {
  const { id } = req.params;
  const { userId, actorName } = req.body;
  const licensesColl = store.collection('licenses');
  const lic = licensesColl.findById(id);

  if (!lic) return res.status(404).json({ success: false, message: 'License not found' });
  if (lic.allocatedSeats >= lic.totalSeats) {
    return res.status(400).json({ success: false, message: 'No seats available in license pool' });
  }

  const assigned = lic.assignedUsers || [];
  if (assigned.some(a => a.userId === userId)) {
    return res.status(400).json({ success: false, message: 'User already holds this license seat' });
  }

  assigned.push({
    userId,
    assignedDate: new Date().toISOString(),
    pendingRevocation: false
  });

  const updated = licensesColl.findByIdAndUpdate(id, {
    assignedUsers: assigned,
    allocatedSeats: assigned.length
  });

  const io = req.app.get('io');
  if (io) io.emit('license_updated', updated);

  const user = store.collection('users').findById(userId);

  logAudit(
    io,
    actorName || 'Harindy Jayasuriya',
    'itam_lead',
    'LICENSE_ALLOCATED',
    'SoftwareLicense',
    id,
    `Allocated seat of ${lic.name} to employee ${user?.name || userId}`,
    req.ip
  );

  res.json({ success: true, data: updated });
};

const revokeLicense = (req, res) => {
  const { id } = req.params;
  const { userId, actorName, reason } = req.body;
  const licensesColl = store.collection('licenses');
  const lic = licensesColl.findById(id);

  if (!lic) return res.status(404).json({ success: false, message: 'License not found' });

  let assigned = lic.assignedUsers || [];
  assigned = assigned.filter(a => a.userId !== userId);

  const updated = licensesColl.findByIdAndUpdate(id, {
    assignedUsers: assigned,
    allocatedSeats: assigned.length
  });

  const io = req.app.get('io');
  if (io) io.emit('license_updated', updated);

  const user = store.collection('users').findById(userId);

  logAudit(
    io,
    actorName || 'Harindy Jayasuriya',
    'itam_lead',
    'LICENSE_REVOKED',
    'SoftwareLicense',
    id,
    `Revoked seat of ${lic.name} from ${user?.name || userId}. Reason: ${reason || 'Offboarding / seat reclamation'}`,
    req.ip
  );

  res.json({ success: true, data: updated });
};

module.exports = {
  getLicenses,
  createLicense,
  allocateLicense,
  revokeLicense
};
