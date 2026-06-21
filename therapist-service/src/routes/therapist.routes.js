const express = require('express');
const { body } = require('express-validator');
const therapistCtrl = require('../controllers/therapist.controller');
const sessionCtrl = require('../controllers/session.controller');
const clinicalNotesCtrl = require('../controllers/clinicalNotesController');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/directory', therapistCtrl.getDirectory);
router.get('/directory/:id', therapistCtrl.getTherapistProfile);
router.get('/directory/:id/slots', therapistCtrl.getAvailableSlots);

router.post('/sessions/book', authenticate, authorize('user'), [
  body('therapistId').notEmpty().withMessage('Therapist ID is required.'),
  body('scheduledDate').notEmpty().withMessage('Date is required.'),
  body('scheduledTime').notEmpty().withMessage('Time is required.')
], sessionCtrl.bookSession);

router.get('/sessions/my', authenticate, authorize('user'), sessionCtrl.getUserSessions);
router.get('/sessions/upcoming', authenticate, authorize('user'), sessionCtrl.getUpcomingSessions);
router.patch('/sessions/:id/cancel', authenticate, sessionCtrl.cancelSession);

router.get('/my/sessions', authenticate, authorize('therapist'), sessionCtrl.getTherapistSessions);
router.get('/my/sessions/today', authenticate, authorize('therapist'), sessionCtrl.getTodaySessions);
router.patch('/sessions/:id/confirm', authenticate, authorize('therapist'), sessionCtrl.confirmSession);
router.patch('/sessions/:id/complete', authenticate, authorize('therapist'), sessionCtrl.completeSession);

router.post('/my/availability', authenticate, authorize('therapist'), therapistCtrl.setAvailability);
router.get('/my/availability', authenticate, authorize('therapist'), therapistCtrl.getMyAvailability);

router.post('/sessions/:id/notes', authenticate, authorize('therapist'), sessionCtrl.saveNotes);
router.get('/sessions/:id/notes', authenticate, authorize('therapist'), sessionCtrl.getNotes);

router.get('/my/client/:userId', authenticate, authorize('therapist'), therapistCtrl.getClientInfo);

// Clinical notes S3 routes
router.post('/patient/:patientId/notes', authenticate, authorize('therapist'), clinicalNotesCtrl.uploadNotes);
router.get('/patient/:patientId/notes', authenticate, clinicalNotesCtrl.listNotes);
router.get('/patient/:patientId/notes/:sessionId/download', authenticate, clinicalNotesCtrl.downloadNotes);

router.get('/admin/stats', authenticate, authorize('admin'), therapistCtrl.getAdminStats);

module.exports = router;

