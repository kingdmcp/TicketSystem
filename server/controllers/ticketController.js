const store = require('../data/store');
const { logAudit } = require('../middleware/audit');

// SLA Configuration Matrix (in milliseconds)
const SLA_CONFIG = {
  'P1-Critical': {
    responseMs: 15 * 60 * 1000,        // 15 minutes
    resolutionMs: 4 * 60 * 60 * 1000,    // 4 hours
    preBreachResponseMs: 5 * 60 * 1000,  // alert at 5m
    preBreachResolutionMs: 60 * 60 * 1000 // alert 1 hr before
  },
  'P2-High': {
    responseMs: 60 * 60 * 1000,          // 1 hour
    resolutionMs: 12 * 60 * 60 * 1000,   // 12 hours
    preBreachResponseMs: 15 * 60 * 1000,
    preBreachResolutionMs: 2 * 60 * 60 * 1000
  },
  'P3-Medium': {
    responseMs: 4 * 60 * 60 * 1000,      // 4 hours
    resolutionMs: 24 * 60 * 60 * 1000,   // 24 hours
    preBreachResponseMs: 60 * 60 * 1000,
    preBreachResolutionMs: 6 * 60 * 60 * 1000
  },
  'P4-Low': {
    responseMs: 8 * 60 * 60 * 1000,      // 8 hours
    resolutionMs: 72 * 60 * 60 * 1000,   // 72 hours (3 days)
    preBreachResponseMs: 2 * 60 * 60 * 1000,
    preBreachResolutionMs: 24 * 60 * 60 * 1000 // 1 day before
  }
};

// Priority Matrix Calculator
function calculatePriority(impact, urgency) {
  const imp = (impact || 'Medium').toLowerCase();
  const urg = (urgency || 'Medium').toLowerCase();

  if (imp === 'high' && urg === 'high') return 'P1-Critical';
  if ((imp === 'high' && urg === 'medium') || (imp === 'medium' && urg === 'high')) return 'P2-High';
  if ((imp === 'high' && urg === 'low') || (imp === 'medium' && urg === 'medium') || (imp === 'low' && urg === 'high')) return 'P3-Medium';
  return 'P4-Low';
}

// Automated Assignment Logic
function determineAssignee(category, priority) {
  const cat = (category || '').toLowerCase();
  if (cat.includes('network') || cat.includes('wireless') || cat.includes('switch') || cat.includes('ap')) {
    return { id: 'usr_pabodha', name: 'Pabodha Senaratne', role: 'discovery_lead' };
  }
  if (cat.includes('hardware') || cat.includes('laptop') || cat.includes('monitor') || cat.includes('asset')) {
    return { id: 'usr_harindy', name: 'Harindy Jayasuriya', role: 'itam_lead' };
  }
  if (cat.includes('security') || cat.includes('access') || cat.includes('compliance') || cat.includes('permission')) {
    return { id: 'usr_malmika', name: 'Malmika Wickramasinghe', role: 'security_lead' };
  }
  // Default routing to Vishan (ITSM Lead)
  return { id: 'usr_vishan', name: 'Vishan Fernando', role: 'itsm_lead' };
}

// Controller Methods
const getTickets = (req, res) => {
  const ticketsColl = store.collection('tickets');
  let tickets = ticketsColl.find();

  // Evaluate live SLA countdown & breach status
  const now = Date.now();
  tickets = tickets.map(ticket => {
    let slaResponseBreached = ticket.slaResponseBreached;
    let slaResolutionBreached = ticket.slaResolutionBreached;

    if (!ticket.respondedAt && ticket.responseDue) {
      if (now > new Date(ticket.responseDue).getTime()) {
        slaResponseBreached = true;
      }
    }
    if (ticket.status !== 'Resolved' && ticket.status !== 'Closed' && ticket.resolutionDue) {
      if (now > new Date(ticket.resolutionDue).getTime()) {
        slaResolutionBreached = true;
      }
    }

    // Auto-close check if 4 hours elapsed since resolution request
    if (ticket.status === 'Resolved' && ticket.closurePrompt?.sent && ticket.closurePrompt?.status === 'Pending') {
      if (ticket.closurePrompt.autoCloseDue && now > new Date(ticket.closurePrompt.autoCloseDue).getTime()) {
        ticket.status = 'Closed';
        ticket.closedAt = new Date().toISOString();
        ticket.closurePrompt.status = 'Accepted';
        ticket.closurePrompt.notes = 'Auto-closed by system after 4-hour inactivity timeout.';
        ticketsColl.findByIdAndUpdate(ticket._id, ticket);
      }
    }

    return { ...ticket, slaResponseBreached, slaResolutionBreached };
  });

  res.json({ success: true, count: tickets.length, data: tickets });
};

const getTicketById = (req, res) => {
  const ticketsColl = store.collection('tickets');
  const ticket = ticketsColl.findById(req.params.id);
  if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
  res.json({ success: true, data: ticket });
};

const createTicket = (req, res) => {
  const { title, description, shortDescription, category, impact, urgency, linkedAsset, createdBy, createdByName, isDraft, attachments } = req.body;
  if (!title && !shortDescription) {
    return res.status(400).json({ success: false, message: 'Title or short description is required' });
  }

  const ticketsColl = store.collection('tickets');
  const ticketCount = ticketsColl.count() + 1;
  const ticketNumber = `INC-2026-${String(ticketCount).padStart(3, '0')}`;

  const priority = calculatePriority(impact, urgency);
  const slaRule = SLA_CONFIG[priority];
  const now = Date.now();
  const responseDue = new Date(now + slaRule.responseMs).toISOString();
  const resolutionDue = new Date(now + slaRule.resolutionMs).toISOString();

  // Auto assign
  const assignee = determineAssignee(category, priority);

  // Link asset details
  let linkedAssetName = 'None';
  if (linkedAsset) {
    const asset = store.collection('assets').findById(linkedAsset);
    if (asset) linkedAssetName = asset.name;
  }

  const newTicket = ticketsColl.insert({
    ticketNumber,
    title: title || shortDescription,
    shortDescription: shortDescription || title,
    description: description || shortDescription || title,
    category: category || 'General IT Issue',
    impact: impact || 'Medium',
    urgency: urgency || 'Medium',
    priority,
    status: isDraft ? 'Draft' : 'Open',
    isDraft: Boolean(isDraft),
    attachments: attachments || [],
    createdBy: createdBy || 'usr_staff',
    createdByName: createdByName || 'Staff Member',
    assignedTo: assignee.id,
    assignedToName: assignee.name,
    linkedAsset: linkedAsset || null,
    linkedAssetName,
    responseDue,
    resolutionDue,
    respondedAt: null,
    resolvedAt: null,
    closedAt: null,
    slaResponseBreached: false,
    slaResolutionBreached: false,
    resolutionNotes: '',
    closurePrompt: {
      sent: false,
      status: 'Pending',
      autoCloseDue: null
    },
    kbArticleCreated: false,
    comments: [
      {
        author: 'System Auto-Router',
        role: 'system',
        text: isDraft ? 'Ticket saved as draft.' : `Calculated priority: ${priority} based on Impact: ${impact || 'Medium'} & Urgency: ${urgency || 'Medium'}. Auto-assigned to ${assignee.name} (${assignee.role}). Response SLA target: ${Math.round(slaRule.responseMs / 60000)}m.`,
        createdAt: new Date().toISOString()
      }
    ]
  });

  const io = req.app.get('io');
  if (io) {
    io.emit('ticket_created', newTicket);
  }

  logAudit(
    io,
    createdByName || 'Staff Member',
    'employee',
    isDraft ? 'TICKET_DRAFT_SAVED' : 'TICKET_CREATED',
    'Ticket',
    newTicket._id,
    `${isDraft ? 'Saved draft' : 'Created ticket'} ${ticketNumber}: "${newTicket.title}" (${priority})`,
    req.ip
  );

  res.status(201).json({ success: true, data: newTicket });
};

// IT Support Override: Reject or Immediate Close with Reason (Image 4)
const itSupportOverride = (req, res) => {
  const { id } = req.params;
  const { action, reason, actorName, actorRole } = req.body; // action: 'reject' | 'force_close'
  const ticketsColl = store.collection('tickets');
  const ticket = ticketsColl.findById(id);

  if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

  const now = new Date().toISOString();
  let nextStatus = action === 'reject' ? 'Rejected' : 'Closed';
  const comments = ticket.comments || [];
  comments.push({
    author: actorName || 'IT Support Lead',
    role: actorRole || 'itsm_lead',
    text: `⚠️ IT Support Override [${action.toUpperCase()}]: ${reason || 'Administrative exception override applied.'}`,
    createdAt: now
  });

  const updateData = {
    status: nextStatus,
    overrideReason: reason || '',
    closedAt: action === 'force_close' ? now : ticket.closedAt,
    comments
  };

  const updated = ticketsColl.findByIdAndUpdate(id, updateData);
  const io = req.app.get('io');
  if (io) io.emit('ticket_updated', updated);

  logAudit(
    io,
    actorName || 'IT Support Lead',
    actorRole || 'itsm_lead',
    action === 'reject' ? 'TICKET_OVERRIDE_REJECTED' : 'TICKET_OVERRIDE_FORCE_CLOSED',
    'Ticket',
    id,
    `IT Support executed override [${action.toUpperCase()}] for ${ticket.ticketNumber}. Reason: "${reason}"`,
    req.ip
  );

  res.json({ success: true, data: updated });
};

const updateTicketStatus = (req, res) => {
  const { id } = req.params;
  const { status, actorName, actorRole, commentText } = req.body;
  const ticketsColl = store.collection('tickets');
  const ticket = ticketsColl.findById(id);

  if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

  const now = new Date().toISOString();
  const updateData = { status };

  // Track first response time
  if (status === 'Assigned' || status === 'In Progress') {
    if (!ticket.respondedAt) {
      updateData.respondedAt = now;
      if (new Date(now).getTime() > new Date(ticket.responseDue).getTime()) {
        updateData.slaResponseBreached = true;
      }
    }
  }

  if (commentText) {
    const comments = ticket.comments || [];
    comments.push({
      author: actorName || 'IT Support',
      role: actorRole || 'itsm_lead',
      text: commentText,
      createdAt: now
    });
    updateData.comments = comments;
  }

  const updated = ticketsColl.findByIdAndUpdate(id, updateData);
  const io = req.app.get('io');
  if (io) {
    io.emit('ticket_updated', updated);
  }

  logAudit(
    io,
    actorName || 'IT Support',
    actorRole || 'itsm_lead',
    'TICKET_STATUS_UPDATED',
    'Ticket',
    id,
    `Ticket ${ticket.ticketNumber} transitioned to status: ${status}`,
    req.ip
  );

  res.json({ success: true, data: updated });
};

const resolveTicket = (req, res) => {
  const { id } = req.params;
  const { resolutionNotes, createKbArticle, actorName, actorRole } = req.body;
  const ticketsColl = store.collection('tickets');
  const ticket = ticketsColl.findById(id);

  if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

  const now = new Date();
  const autoCloseDue = new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(); // 4 hours auto close

  let slaResolutionBreached = ticket.slaResolutionBreached;
  if (ticket.resolutionDue && now.getTime() > new Date(ticket.resolutionDue).getTime()) {
    slaResolutionBreached = true;
  }

  const updateData = {
    status: 'Resolved',
    resolvedAt: now.toISOString(),
    resolutionNotes: resolutionNotes || 'Issue addressed by IT technician.',
    slaResolutionBreached,
    closurePrompt: {
      sent: true,
      status: 'Pending',
      autoCloseDue,
      sentAt: now.toISOString()
    }
  };

  // If IT selects to convert to Knowledge Base article
  if (createKbArticle) {
    const kbColl = store.collection('knowledgeBases');
    const newArticle = kbColl.insert({
      title: `Solution: ${ticket.title}`,
      category: ticket.category,
      tags: [ticket.category.toLowerCase().split(' ')[0], 'troubleshooting', 'resolved-ticket'],
      problemDescription: ticket.description,
      solutionSteps: resolutionNotes.split('\n').filter(s => s.trim().length > 0),
      viewCount: 1,
      helpfulVotes: 1,
      author: actorName || 'Vishan Fernando (ITSM Lead)',
      sourceTicketNumber: ticket.ticketNumber
    });
    updateData.kbArticleCreated = true;
    updateData.kbArticleId = newArticle._id;
  }

  const comments = ticket.comments || [];
  comments.push({
    author: actorName || 'IT Support',
    role: actorRole || 'itsm_lead',
    text: `Resolved issue. Resolution notes: "${resolutionNotes}". Closure confirmation request sent to user. (Auto-close in 4 hours if unattended)`,
    createdAt: now.toISOString()
  });
  updateData.comments = comments;

  const updated = ticketsColl.findByIdAndUpdate(id, updateData);
  const io = req.app.get('io');
  if (io) {
    io.emit('ticket_updated', updated);
  }

  logAudit(
    io,
    actorName || 'IT Support',
    actorRole || 'itsm_lead',
    'TICKET_RESOLVED',
    'Ticket',
    id,
    `Ticket ${ticket.ticketNumber} marked Resolved with 4-hr closure prompt. ${createKbArticle ? 'Created KB article.' : ''}`,
    req.ip
  );

  res.json({ success: true, data: updated });
};

// User feedback on resolution (Accept / Reject)
const respondToClosure = (req, res) => {
  const { id } = req.params;
  const { decision, feedback, actorName } = req.body; // decision: 'accept' | 'reject'
  const ticketsColl = store.collection('tickets');
  const ticket = ticketsColl.findById(id);

  if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

  const now = new Date().toISOString();
  let updateData = {};
  const comments = ticket.comments || [];

  if (decision === 'accept') {
    updateData = {
      status: 'Closed',
      closedAt: now,
      closurePrompt: {
        ...ticket.closurePrompt,
        status: 'Accepted',
        respondedAt: now,
        feedback: feedback || 'User confirmed resolution.'
      }
    };
    comments.push({
      author: actorName || 'End User',
      role: 'employee',
      text: `User accepted resolution. Ticket is now officially Closed. Feedback: "${feedback || 'Satisfied'}"`,
      createdAt: now
    });
  } else {
    // Reopen ticket
    updateData = {
      status: 'In Progress',
      closurePrompt: {
        ...ticket.closurePrompt,
        status: 'Rejected',
        respondedAt: now,
        feedback: feedback || 'Issue persists, reopening ticket.'
      }
    };
    comments.push({
      author: actorName || 'End User',
      role: 'employee',
      text: `User rejected closure! Ticket reopened to In Progress. Rejection reason: "${feedback || 'Problem still occurs.'}"`,
      createdAt: now
    });
  }

  updateData.comments = comments;
  const updated = ticketsColl.findByIdAndUpdate(id, updateData);

  const io = req.app.get('io');
  if (io) {
    io.emit('ticket_updated', updated);
  }

  logAudit(
    io,
    actorName || 'End User',
    'employee',
    decision === 'accept' ? 'TICKET_CLOSED_CONFIRMED' : 'TICKET_REOPENED_REJECTED',
    'Ticket',
    id,
    `User ${actorName || 'Requester'} ${decision === 'accept' ? 'confirmed closure' : 'rejected closure'} for ${ticket.ticketNumber}`,
    req.ip
  );

  res.json({ success: true, data: updated });
};

// Escalate breached ticket
const escalateTicket = (req, res) => {
  const { id } = req.params;
  const { actorName, reason } = req.body;
  const ticketsColl = store.collection('tickets');
  const ticket = ticketsColl.findById(id);
  if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

  const comments = ticket.comments || [];
  comments.push({
    author: actorName || 'Escalation Engine',
    role: 'system',
    text: `⚠️ SLA Escalation: Ticket escalated to Senior Management (Vishan Fernando & Engineering Director). Reason: ${reason || 'SLA threshold breach risk.'}`,
    createdAt: new Date().toISOString()
  });

  const updated = ticketsColl.findByIdAndUpdate(id, {
    escalated: true,
    escalatedAt: new Date().toISOString(),
    assignedTo: 'usr_vishan',
    assignedToName: 'Vishan Fernando (ITSM Lead Escalation)',
    comments
  });

  const io = req.app.get('io');
  if (io) {
    io.emit('ticket_updated', updated);
  }

  logAudit(
    io,
    actorName || 'Escalation Engine',
    'system',
    'TICKET_ESCALATED',
    'Ticket',
    id,
    `Escalated ${ticket.ticketNumber} to Senior Staff. Reason: ${reason || 'SLA breached'}`,
    req.ip
  );

  res.json({ success: true, data: updated });
};

module.exports = {
  getTickets,
  getTicketById,
  createTicket,
  updateTicketStatus,
  resolveTicket,
  respondToClosure,
  escalateTicket,
  itSupportOverride,
  calculatePriority,
  determineAssignee
};
