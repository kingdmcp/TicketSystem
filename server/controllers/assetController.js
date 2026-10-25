const store = require('../data/store');
const { logAudit } = require('../middleware/audit');

const getAssets = (req, res) => {
  const assetsColl = store.collection('assets');
  const assets = assetsColl.find();
  res.json({ success: true, count: assets.length, data: assets });
};

const getAssetById = (req, res) => {
  const assetsColl = store.collection('assets');
  const asset = assetsColl.findById(req.params.id);
  if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });

  // Find linked tickets
  const tickets = store.collection('tickets').find({ linkedAsset: req.params.id });

  res.json({ success: true, data: { ...asset, linkedTickets: tickets } });
};

const createAsset = (req, res) => {
  const {
    name, category, model, serialNumber, ipAddress, macAddress,
    switchPort, vlan, room, rack, status, assignedTo, cost, warrantyExpiry
  } = req.body;

  if (!name || !category) {
    return res.status(400).json({ success: false, message: 'Asset Name and Category are required' });
  }

  const assetsColl = store.collection('assets');
  const assetTag = `ASSET-${category.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;

  const newAsset = assetsColl.insert({
    assetTag,
    name,
    category,
    model: model || 'Generic Enterprise Unit',
    serialNumber: serialNumber || `SN-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
    ipAddress: ipAddress || 'Dynamic / DHCP',
    macAddress: macAddress || '00:00:00:00:00:00',
    switchPort: switchPort || 'Unpatched',
    vlan: Number(vlan) || 1,
    room: room || 'Central IT Depot',
    rack: rack || 'Unracked',
    status: status || 'In Use',
    health: 'Online',
    pingLatency: 1.5,
    assignedTo: assignedTo || null,
    purchaseDate: new Date().toISOString().split('T')[0],
    warrantyExpiry: warrantyExpiry || '2028-01-01',
    cost: Number(cost) || 1000,
    lastDiscovered: new Date().toISOString()
  });

  const io = req.app.get('io');
  if (io) io.emit('asset_created', newAsset);

  logAudit(
    io,
    req.body.actorName || 'Harindy Jayasuriya',
    'itam_lead',
    'ASSET_CREATED',
    'Asset',
    newAsset._id,
    `Registered new CMDB Hardware Asset: ${newAsset.assetTag} (${name}) in ${room}`,
    req.ip
  );

  res.status(201).json({ success: true, data: newAsset });
};

const updateAsset = (req, res) => {
  const { id } = req.params;
  const assetsColl = store.collection('assets');
  const asset = assetsColl.findById(id);

  if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });

  const updated = assetsColl.findByIdAndUpdate(id, {
    ...req.body,
    lastDiscovered: new Date().toISOString()
  });

  const io = req.app.get('io');
  if (io) io.emit('asset_updated', updated);

  logAudit(
    io,
    req.body.actorName || 'Harindy Jayasuriya',
    'itam_lead',
    'ASSET_UPDATED',
    'Asset',
    id,
    `Updated CMDB Asset ${asset.assetTag}: Status -> ${updated.status}, Health -> ${updated.health}`,
    req.ip
  );

  res.json({ success: true, data: updated });
};

const deleteAsset = (req, res) => {
  const { id } = req.params;
  const assetsColl = store.collection('assets');
  const asset = assetsColl.findById(id);
  if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });

  const deleted = assetsColl.findByIdAndDelete(id);
  const io = req.app.get('io');
  if (io) io.emit('asset_deleted', { _id: id });

  logAudit(
    io,
    req.body.actorName || 'Harindy Jayasuriya',
    'itam_lead',
    'ASSET_RETIRED_DELETED',
    'Asset',
    id,
    `Decommissioned and deleted CMDB Asset ${asset.assetTag}`,
    req.ip
  );

  res.json({ success: true, message: 'Asset deleted', data: deleted });
};

module.exports = {
  getAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset
};
