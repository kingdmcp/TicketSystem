const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { Server } = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const { seedDatabase } = require('./data/seedData');
const apiRoutes = require('./routes/api');
const store = require('./data/store');
const { logAudit } = require('./middleware/audit');

const app = express();
const server = http.createServer(app);

// Socket.io configuration
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
  }
});

app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Mount API routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ITSM & ITAM CMDB Platform API',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend client directly on port 5000 as well
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  console.log(`📦 Serving compiled frontend from: ${clientDistPath}`);
  app.use(express.static(clientDistPath));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io') || req.path === '/health') {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  app.use((req, res) => {
    res.redirect('http://localhost:5173');
  });
}

// WebSocket Connection Management
io.on('connection', (socket) => {
  console.log(`[WebSocket] Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`[WebSocket] Client disconnected: ${socket.id}`);
  });
});

// Seed data initialization
seedDatabase();

// SLA Monitoring & Background Workflow Service
// Checks SLA pre-breach warnings and 4-hour closure timeouts every 20 seconds
setInterval(() => {
  try {
    const ticketsColl = store.collection('tickets');
    const tickets = ticketsColl.find();
    const now = Date.now();

    tickets.forEach(ticket => {
      // 1. Auto-close resolved tickets after 4-hour window
      if (ticket.status === 'Resolved' && ticket.closurePrompt?.sent && ticket.closurePrompt?.status === 'Pending') {
        if (ticket.closurePrompt.autoCloseDue && now > new Date(ticket.closurePrompt.autoCloseDue).getTime()) {
          ticket.status = 'Closed';
          ticket.closedAt = new Date().toISOString();
          ticket.closurePrompt.status = 'Accepted';
          ticket.closurePrompt.notes = 'Auto-closed by system after 4-hour inactivity timeout.';

          ticketsColl.findByIdAndUpdate(ticket._id, ticket);
          io.emit('ticket_updated', ticket);
          io.emit('notification', {
            type: 'info',
            title: `Ticket ${ticket.ticketNumber} Auto-Closed`,
            message: `Resolution auto-accepted after 4 hours of inactivity.`
          });
        }
      }

      // 2. Pre-breach alert notifications (e.g. 1 hour before Resolution due date or 15m before Response due date)
      if (ticket.status === 'Open' && !ticket.respondedAt && ticket.responseDue && !ticket.slaResponseWarningSent) {
        const timeUntilResponseDue = new Date(ticket.responseDue).getTime() - now;
        if (timeUntilResponseDue > 0 && timeUntilResponseDue < 30 * 60 * 1000) { // < 30m
          ticket.slaResponseWarningSent = true;
          ticketsColl.findByIdAndUpdate(ticket._id, { slaResponseWarningSent: true });

          io.emit('sla_warning', {
            ticketNumber: ticket.ticketNumber,
            priority: ticket.priority,
            assignee: ticket.assignedToName,
            type: 'RESPONSE_SLA_PRE_BREACH',
            message: `⚠️ Urgent: ${ticket.ticketNumber} is approaching Response SLA deadline in ${Math.round(timeUntilResponseDue / 60000)} minutes!`
          });
        }
      }

      if (ticket.status !== 'Resolved' && ticket.status !== 'Closed' && ticket.resolutionDue && !ticket.slaResolutionWarningSent) {
        const timeUntilResDue = new Date(ticket.resolutionDue).getTime() - now;
        if (timeUntilResDue > 0 && timeUntilResDue < 2 * 60 * 60 * 1000) { // < 2 hours
          ticket.slaResolutionWarningSent = true;
          ticketsColl.findByIdAndUpdate(ticket._id, { slaResolutionWarningSent: true });

          io.emit('sla_warning', {
            ticketNumber: ticket.ticketNumber,
            priority: ticket.priority,
            assignee: ticket.assignedToName,
            type: 'RESOLUTION_SLA_PRE_BREACH',
            message: `⚠️ Attention: ${ticket.ticketNumber} is approaching Resolution SLA deadline in ${Math.round(timeUntilResDue / 3600000)} hours!`
          });
        }
      }
    });

    // 3. Check 3-Month Delayed License Revocation reminders
    const offColl = store.collection('offboardings');
    const offboardings = offColl.find();
    offboardings.forEach(off => {
      if (off.delayedLicenseRevocation && off.delayedLicenseRevocation.status !== 'Revoked (Archive Complete)') {
        const schedTime = new Date(off.delayedLicenseRevocation.scheduledDate).getTime();
        if (now >= schedTime && off.delayedLicenseRevocation.status !== 'DUE_NOW') {
          offColl.findByIdAndUpdate(off._id, {
            'delayedLicenseRevocation.status': 'DUE_NOW'
          });
          io.emit('license_revocation_due', {
            offboardingId: off.offboardingId,
            employeeName: off.employeeName,
            message: `3-Month archive period elapsed for ${off.employeeName}. Software licenses are ready for final revocation.`
          });
        }
      }
    });
  } catch (err) {
    console.error('Error in SLA background task:', err);
  }
}, 20000);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Enterprise ITSM & ITAM CMDB Platform Backend`);
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket Server active`);
  console.log(`====================================================`);
});
