const store = require('../data/store');

function logAudit(io, actorName, actorRole, action, entityType, entityId, details, ipAddress = '127.0.0.1') {
  const auditColl = store.collection('auditLogs');
  const entry = auditColl.insert({
    actorName: actorName || 'System Service',
    actorRole: actorRole || 'system',
    action,
    entityType,
    entityId: String(entityId || ''),
    details,
    ipAddress,
    timestamp: new Date().toISOString()
  });

  if (io) {
    io.emit('audit_logged', entry);
    io.emit('notification', {
      type: 'info',
      title: `Audit: ${action}`,
      message: details,
      timestamp: entry.timestamp
    });
  }

  return entry;
}

module.exports = { logAudit };
