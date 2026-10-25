const express = require('express');
const router = express.Router();

const ticketController = require('../controllers/ticketController');
const assetController = require('../controllers/assetController');
const licenseController = require('../controllers/licenseController');
const onboardingController = require('../controllers/onboardingController');
const offboardingController = require('../controllers/offboardingController');
const procurementController = require('../controllers/procurementController');
const floorplanController = require('../controllers/floorplanController');
const discoveryController = require('../controllers/discoveryController');
const kbController = require('../controllers/knowledgeBaseController');
const userController = require('../controllers/userController');
const analyticsController = require('../controllers/analyticsController');

// 1. Helpdesk & Tickets (ITSM Lead Vishan)
router.get('/tickets', ticketController.getTickets);
router.post('/tickets', ticketController.createTicket);
router.get('/tickets/:id', ticketController.getTicketById);
router.patch('/tickets/:id/status', ticketController.updateTicketStatus);
router.post('/tickets/:id/resolve', ticketController.resolveTicket);
router.post('/tickets/:id/closure-response', ticketController.respondToClosure);
router.post('/tickets/:id/escalate', ticketController.escalateTicket);
router.post('/tickets/:id/override', ticketController.itSupportOverride);

// 2. CMDB Hardware Assets (ITAM Lead Harindy)
router.get('/assets', assetController.getAssets);
router.post('/assets', assetController.createAsset);
router.get('/assets/:id', assetController.getAssetById);
router.put('/assets/:id', assetController.updateAsset);
router.delete('/assets/:id', assetController.deleteAsset);

// 3. Software Licenses (ITAM Lead Harindy)
router.get('/licenses', licenseController.getLicenses);
router.post('/licenses', licenseController.createLicense);
router.post('/licenses/:id/allocate', licenseController.allocateLicense);
router.post('/licenses/:id/revoke', licenseController.revokeLicense);

// 4. Onboarding & Department Transfers (Workflow 3.1)
router.get('/onboarding', onboardingController.getOnboardings);
router.get('/onboarding/:id', onboardingController.getOnboardingById);
router.post('/onboarding/draft', onboardingController.createDraft);
router.post('/onboarding/:id/employee-submit', onboardingController.employeeSubmit);
router.post('/onboarding/:id/hr-verify', onboardingController.hrVerify);
router.post('/onboarding/:id/it-provision', onboardingController.itProvision);
router.post('/onboarding/transfer', onboardingController.requestDepartmentTransfer);

// 5. Offboarding & Delayed License Revocation (Workflow 3.2)
router.get('/offboarding', offboardingController.getOffboardings);
router.get('/offboarding/:id', offboardingController.getOffboardingById);
router.post('/offboarding/initiate', offboardingController.initiateOffboarding);
router.post('/offboarding/:id/automated-cutoff', offboardingController.executeAutomatedCutoff);
router.post('/offboarding/:id/asset-return', offboardingController.recordAssetReturn);
router.post('/offboarding/:id/revoke-licenses', offboardingController.executeDelayedLicenseRevocation);

// 6. Procurement Flow (Workflow 3.4)
router.get('/procurement', procurementController.getProcurements);
router.post('/procurement', procurementController.createProcurement);
router.get('/procurement/:id', procurementController.getProcurementById);
router.post('/procurement/:id/it-review', procurementController.itReviewProcurement);
router.post('/procurement/:id/manager-approve', procurementController.managerApproveProcurement);
router.post('/procurement/:id/finance-authorize', procurementController.financeAuthorizeProcurement);
router.post('/procurement/:id/delivery-checkin', procurementController.itCheckInDelivery);

// 7. Spatial Floorplan & Mapping (Discovery Lead Pabodha)
router.get('/floorplan', floorplanController.getFloorplan);
router.post('/floorplan/move-device', floorplanController.updateDevicePosition);
router.post('/floorplan/add-device', floorplanController.addDeviceToFloorplan);

// 8. Network Discovery & Zabbix/NetBox Integration (Discovery Lead Pabodha)
router.post('/discovery/sync', discoveryController.syncDiscoveryData);
router.post('/discovery/scan', discoveryController.triggerDiscoveryScan);

// 9. Knowledge Base (Vishan)
router.get('/kb', kbController.getArticles);
router.post('/kb', kbController.createArticle);
router.post('/kb/ai-suggest', kbController.aiKbAssistant);
router.get('/kb/:id', kbController.getArticleById);
router.post('/kb/:id/helpful', kbController.voteHelpful);

// 10. Users & Security RBAC & Audit Logs (Security Lead Malmika)
router.get('/users', userController.getUsers);
router.get('/users/:id', userController.getUserById);
router.get('/audit-logs', userController.getAuditLogs);
router.get('/analytics/dashboard', analyticsController.getDashboardStats);

module.exports = router;
