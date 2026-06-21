const axios = require('axios');
const Session = require('../models/Session');
const TherapistPatient = require('../models/TherapistPatient');
const { uploadClinicalNotes, getPresignedDownloadUrl } = require('../services/clinicalNotesService');

const AUTH_SERVICE = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';

exports.uploadNotes = async (req, res) => {
  try {
    const { patientId } = req.params;
    const {
      sessionId,
      presentingIssues,
      sessionObservations,
      sessionSummary,
      interventionsUsed,
      homeworkAssigned,
      nextSessionFocus,
      riskAssessment
    } = req.body;

    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'Session ID is required.' });
    }

    // Fetch session
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }

    // Verify therapist owns the session
    if (session.therapistId !== req.user.sub) {
      return res.status(403).json({ success: false, message: 'Not authorized to upload notes for this session.' });
    }

    // Verify patient matches the session's patient
    if (session.userId !== patientId) {
      return res.status(400).json({ success: false, message: 'Session patient ID mismatch.' });
    }

    // Fetch patient info from auth-service if name is not on session
    let patientName = session.userName || '';
    if (!patientName) {
      try {
        const { data } = await axios.get(`${AUTH_SERVICE}/api/auth/internal/user/${patientId}`, {
          headers: { 'X-Internal-Service': 'therapist-service' }
        });
        patientName = data.data.name;
      } catch (e) {
        console.error('Failed to fetch patient name:', e.message);
      }
    }

    const data = {
      sessionId,
      patientId,
      patientName,
      therapistId: req.user.sub,
      therapistName: req.user.name || session.therapistName || 'Therapist',
      date: session.scheduledDate || new Date().toISOString().split('T')[0],
      presentingIssues: presentingIssues || [],
      sessionObservations: sessionObservations || '',
      sessionSummary: sessionSummary || '',
      interventionsUsed: interventionsUsed || [],
      homeworkAssigned: homeworkAssigned || '',
      nextSessionFocus: nextSessionFocus || '',
      riskAssessment: riskAssessment || 'none'
    };

    const result = await uploadClinicalNotes(data);
    
    // Fetch and return the fully wrapped note to ensure frontend cache is perfectly in sync
    const SessionNote = require('../models/SessionNote');
    const note = await SessionNote.findOne({ sessionId });

    res.json({ success: true, message: 'Clinical notes uploaded successfully.', data: note });
  } catch (error) {
    console.error('Upload notes error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.listNotes = async (req, res) => {
  try {
    const { patientId } = req.params;

    // Authorization check: patient or therapist
    if (req.user.role !== 'therapist' && req.user.sub !== patientId) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    if (req.user.role === 'therapist') {
      // Verify therapist has at least one session with this patient
      const sessions = await Session.find({ userId: patientId, therapistId: req.user.sub });
      if (!sessions || sessions.length === 0) {
        return res.status(403).json({ success: false, message: 'Not authorized. You are not the therapist for this patient.' });
      }
    }

    // Find all sessions for user
    const sessions = await Session.find({ userId: patientId });
    const notesSessions = sessions.filter(s => s.clinicalNotesS3Key);

    res.json({ success: true, data: notesSessions });
  } catch (error) {
    console.error('List notes error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.downloadNotes = async (req, res) => {
  try {
    const { patientId, sessionId } = req.params;
    const { format } = req.query; // 'txt' or 'pdf'

    // Authorization check: patient or therapist
    if (req.user.role !== 'therapist' && req.user.sub !== patientId) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }

    if (session.userId !== patientId) {
      return res.status(400).json({ success: false, message: 'Session patient ID mismatch.' });
    }

    if (req.user.role === 'therapist') {
      // Check if this therapist owns the session
      if (session.therapistId !== req.user.sub) {
        return res.status(403).json({ success: false, message: 'Not authorized. You are not the therapist for this session.' });
      }
    }

    let s3Key = format === 'txt' ? session.clinicalNotesS3Key : session.clinicalNotesPdfKey;
    if (!s3Key) {
      // Fallback to whatever key is available
      s3Key = session.clinicalNotesPdfKey || session.clinicalNotesS3Key;
    }

    if (!s3Key) {
      return res.status(404).json({ success: false, message: 'Notes not generated yet for this session.' });
    }

    const downloadUrl = await getPresignedDownloadUrl(s3Key);
    res.json({ success: true, data: { downloadUrl } });
  } catch (error) {
    console.error('Download notes error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
