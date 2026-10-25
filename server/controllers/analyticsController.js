const store = require('../data/store');

const getDashboardStats = (req, res) => {
  const ticketsColl = store.collection('tickets');
  const assetsColl = store.collection('assets');
  const licensesColl = store.collection('licenses');
  const procColl = store.collection('procurements');
  const onbColl = store.collection('onboardings');
  const offColl = store.collection('offboardings');

  const tickets = ticketsColl.find();
  const assets = assetsColl.find();
  const licenses = licensesColl.find();
  const procurements = procColl.find();

  // SLA Metrics
  const totalTickets = tickets.length;
  const closedOrResolved = tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed');
  const openTickets = tickets.filter(t => t.status !== 'Closed');
  const breachedResponse = tickets.filter(t => t.slaResponseBreached).length;
  const breachedResolution = tickets.filter(t => t.slaResolutionBreached).length;
  const slaComplianceRate = totalTickets > 0 ? Math.round(((totalTickets - breachedResolution) / totalTickets) * 100) : 100;

  // Priority Distribution
  const priorityDistribution = [
    { name: 'P1-Critical', count: tickets.filter(t => t.priority === 'P1-Critical').length, color: '#ef4444' },
    { name: 'P2-High', count: tickets.filter(t => t.priority === 'P2-High').length, color: '#f97316' },
    { name: 'P3-Medium', count: tickets.filter(t => t.priority === 'P3-Medium').length, color: '#eab308' },
    { name: 'P4-Low', count: tickets.filter(t => t.priority === 'P4-Low').length, color: '#3b82f6' }
  ];

  // Asset Lifecycle Status
  const assetStatusDistribution = [
    { name: 'In Use', count: assets.filter(a => a.status === 'In Use').length, fill: '#10b981' },
    { name: 'Planned / Stock', count: assets.filter(a => a.status === 'Planned').length, fill: '#6366f1' },
    { name: 'In Repair', count: assets.filter(a => a.status === 'In Repair').length, fill: '#f59e0b' },
    { name: 'Retired', count: assets.filter(a => a.status === 'Retired').length, fill: '#64748b' }
  ];

  // Asset Categories
  const categoryMap = {};
  assets.forEach(a => {
    categoryMap[a.category] = (categoryMap[a.category] || 0) + 1;
  });
  const assetCategories = Object.keys(categoryMap).map(cat => ({
    name: cat,
    count: categoryMap[cat]
  }));

  // Software License Seat Utilization
  const licenseUtilization = licenses.map(l => ({
    name: l.name.length > 18 ? l.name.substring(0, 18) + '...' : l.name,
    allocated: l.allocatedSeats,
    available: Math.max(0, l.totalSeats - l.allocatedSeats),
    total: l.totalSeats,
    utilizationRate: Math.round((l.allocatedSeats / l.totalSeats) * 100)
  }));

  // Total Asset Valuation
  const totalAssetValue = assets.reduce((sum, a) => sum + (Number(a.cost) || 0), 0);

  // Active Onboarding / Offboarding counts
  const activeOnboardings = onbColl.find(o => o.status === 'In Progress').length;
  const activeOffboardings = offColl.find(o => o.status !== 'Completed').length;

  res.json({
    success: true,
    data: {
      metrics: {
        totalTickets,
        openTicketsCount: openTickets.length,
        closedOrResolvedCount: closedOrResolved.length,
        breachedResponse,
        breachedResolution,
        slaComplianceRate,
        totalAssets: assets.length,
        totalAssetValue,
        activeOnboardings,
        activeOffboardings,
        totalProcurements: procurements.length
      },
      priorityDistribution,
      assetStatusDistribution,
      assetCategories,
      licenseUtilization
    }
  });
};

module.exports = {
  getDashboardStats
};
