const store = require('../data/store');
const { logAudit } = require('../middleware/audit');

// Sync discovered assets from Python network scanner or Zabbix / NetBox agents
const syncDiscoveryData = (req, res) => {
  const { source, devices, scanDurationMs } = req.body;
  const assetsColl = store.collection('assets');
  const fpColl = store.collection('floorplans');
  const fp = fpColl.findOne();

  let updatedCount = 0;
  let newCount = 0;

  if (Array.isArray(devices)) {
    devices.forEach(dev => {
      // Find asset by IP or MAC
      const existing = assetsColl.findOne(a => a.ipAddress === dev.ip || a.macAddress === dev.mac);
      if (existing) {
        assetsColl.findByIdAndUpdate(existing._id, {
          health: dev.health || 'Online',
          pingLatency: dev.pingLatency || 1.5,
          switchPort: dev.switchPort || existing.switchPort,
          vlan: dev.vlan || existing.vlan,
          lastDiscovered: new Date().toISOString()
        });
        updatedCount++;
      }
    });
  }

  const io = req.app.get('io');
  if (io) {
    io.emit('discovery_sync_completed', {
      source: source || 'Python NetScan Agent',
      updatedCount,
      timestamp: new Date().toISOString()
    });
  }

  logAudit(
    io,
    source || 'Python NetScan Agent',
    'system',
    'NETWORK_DISCOVERY_SYNC',
    'NetworkDiscovery',
    'sync_job',
    `Network Discovery synced ${updatedCount} devices via ${source || 'SNMP / Zabbix'}. Scan latency: ${scanDurationMs || 340}ms.`,
    req.ip
  );

  res.json({
    success: true,
    message: `Discovery synced successfully. Updated: ${updatedCount}, New: ${newCount}`,
    updatedCount
  });
};

// On-demand simulation of discovery scan
const triggerDiscoveryScan = (req, res) => {
  const assetsColl = store.collection('assets');
  const allAssets = assetsColl.find();

  // Simulate network jitter & availability
  allAssets.forEach(asset => {
    if (asset.status === 'In Use') {
      const isDegraded = asset.assetTag === 'ASSET-AP-BAY-02' ? Math.random() > 0.3 : Math.random() > 0.95;
      const latency = isDegraded ? Math.floor(90 + Math.random() * 80) : +(0.8 + Math.random() * 3.5).toFixed(1);
      const health = isDegraded ? 'Degraded' : 'Online';

      assetsColl.findByIdAndUpdate(asset._id, {
        health,
        pingLatency: latency,
        lastDiscovered: new Date().toISOString()
      });
    }
  });

  const io = req.app.get('io');
  if (io) {
    io.emit('network_scan_completed', {
      timestamp: new Date().toISOString(),
      message: 'Network subnet scan completed across VLANs 1, 10, 20, 30, 40'
    });
  }

  logAudit(
    io,
    req.body.actorName || 'Pabodha Senaratne',
    'discovery_lead',
    'NETWORK_SCAN_TRIGGERED',
    'NetworkDiscovery',
    'subnet_scan',
    'Manual network discovery sweep executed across 10.0.1.0/24 & 10.0.2.0/24 subnets.',
    req.ip
  );

  res.json({
    success: true,
    message: 'Network discovery scan completed. Telemetry updated in CMDB & Floorplan.',
    scannedHosts: allAssets.length
  });
};

module.exports = {
  syncDiscoveryData,
  triggerDiscoveryScan
};
