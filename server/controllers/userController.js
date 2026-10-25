const store = require('../data/store');

const getUsers = (req, res) => {
  const usersColl = store.collection('users');
  const assetsColl = store.collection('assets');
  const licensesColl = store.collection('licenses');

  const users = usersColl.find();
  const enriched = users.map(u => {
    const assignedAssets = assetsColl.find(a => a.assignedTo === u._id);
    let licenseCount = 0;
    licensesColl.find().forEach(lic => {
      if ((lic.assignedUsers || []).some(entry => entry.userId === u._id)) {
        licenseCount++;
      }
    });

    return {
      ...u,
      assignedAssetsCount: assignedAssets.length,
      assignedLicensesCount: licenseCount
    };
  });

  res.json({ success: true, count: enriched.length, data: enriched });
};

const getUserById = (req, res) => {
  const user = store.collection('users').findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const assignedAssets = store.collection('assets').find(a => a.assignedTo === req.params.id);
  const tickets = store.collection('tickets').find(t => t.createdBy === req.params.id || t.assignedTo === req.params.id);

  res.json({
    success: true,
    data: {
      ...user,
      assignedAssets,
      tickets
    }
  });
};

const getAuditLogs = (req, res) => {
  const auditColl = store.collection('auditLogs');
  const logs = auditColl.find();
  res.json({ success: true, count: logs.length, data: logs });
};

module.exports = {
  getUsers,
  getUserById,
  getAuditLogs
};
