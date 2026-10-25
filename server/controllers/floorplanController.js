const store = require('../data/store');
const { logAudit } = require('../middleware/audit');

const getFloorplan = (req, res) => {
  const fpColl = store.collection('floorplans');
  let fp = fpColl.findOne();
  if (!fp) {
    return res.status(404).json({ success: false, message: 'No floorplan found' });
  }

  // Cross-reference with live CMDB assets for latest health & ping latency
  const assetsColl = store.collection('assets');
  const ticketsColl = store.collection('tickets');

  const enrichedDevices = (fp.devices || []).map(dev => {
    const asset = assetsColl.findById(dev.assetId);
    const activeTickets = ticketsColl.find(t => t.linkedAsset === dev.assetId && t.status !== 'Closed');

    return {
      ...dev,
      status: asset ? asset.health : dev.status,
      pingLatency: asset ? asset.pingLatency : dev.pingLatency,
      model: asset ? asset.model : '',
      activeTicketsCount: activeTickets.length
    };
  });

  res.json({
    success: true,
    data: {
      ...fp,
      devices: enrichedDevices
    }
  });
};

const updateDevicePosition = (req, res) => {
  const { deviceId, x, y, actorName } = req.body;
  const fpColl = store.collection('floorplans');
  let fp = fpColl.findOne();
  if (!fp) return res.status(404).json({ success: false, message: 'Floorplan not found' });

  const devices = (fp.devices || []).map(d => {
    if (d.id === deviceId) {
      return { ...d, x: Number(x), y: Number(y) };
    }
    return d;
  });

  const updated = fpColl.findByIdAndUpdate(fp._id, { devices });
  const io = req.app.get('io');
  if (io) io.emit('floorplan_device_moved', { deviceId, x, y });

  logAudit(
    io,
    actorName || 'Pabodha Senaratne',
    'discovery_lead',
    'DEVICE_SPATIAL_RELOCATED',
    'Floorplan',
    deviceId,
    `Spatial coordinates updated for device ${deviceId} on Floor 1 Canvas: [X:${x}, Y:${y}]`,
    req.ip
  );

  res.json({ success: true, data: updated });
};

const addDeviceToFloorplan = (req, res) => {
  const { assetId, x, y, actorName } = req.body;
  const fpColl = store.collection('floorplans');
  let fp = fpColl.findOne();
  if (!fp) return res.status(404).json({ success: false, message: 'Floorplan not found' });

  const asset = store.collection('assets').findById(assetId);
  if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });

  const newDevice = {
    id: `dev_${Date.now().toString().slice(-4)}`,
    assetId: asset._id,
    assetTag: asset.assetTag,
    name: asset.name,
    type: asset.category.toLowerCase().includes('switch') ? 'switch' :
          asset.category.toLowerCase().includes('access') ? 'access_point' :
          asset.category.toLowerCase().includes('server') ? 'server' : 'workstation',
    x: Number(x) || 300,
    y: Number(y) || 200,
    room: asset.room,
    rack: asset.rack,
    ip: asset.ipAddress,
    mac: asset.macAddress,
    switchPort: asset.switchPort,
    status: asset.health || 'Online',
    pingLatency: asset.pingLatency || 1.2
  };

  const devices = [...(fp.devices || []), newDevice];
  const updated = fpColl.findByIdAndUpdate(fp._id, { devices });

  const io = req.app.get('io');
  if (io) io.emit('floorplan_updated', updated);

  logAudit(
    io,
    actorName || 'Pabodha Senaratne',
    'discovery_lead',
    'DEVICE_PLACED_ON_FLOORPLAN',
    'Floorplan',
    newDevice.id,
    `Placed ${asset.assetTag} (${asset.name}) onto Spatial Floorplan canvas`,
    req.ip
  );

  res.json({ success: true, data: newDevice });
};

module.exports = {
  getFloorplan,
  updateDevicePosition,
  addDeviceToFloorplan
};
