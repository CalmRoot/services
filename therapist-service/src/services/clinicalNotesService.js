const PDFDocument = require('pdfkit');
const { PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { s3Client, CLINICAL_NOTES_BUCKET } = require('../config/s3-client');
const Session = require('../models/Session');

function generateClinicalNotesTxt(data) {
  return `CalmRoot Clinical Session Notes
=================================
Session ID: ${data.sessionId || 'N/A'}
Date: ${data.date || new Date().toISOString().split('T')[0]}
Patient ID: ${data.patientId || 'N/A'}
Patient Name: ${data.patientName || 'N/A'}
Therapist Name: ${data.therapistName || 'N/A'}

Presenting Issues:
------------------
${(data.presentingIssues || []).join(', ') || 'None reported'}

Session Observations:
---------------------
${data.sessionObservations || 'None'}

Session Summary:
----------------
${data.sessionSummary || 'None'}

Interventions Used:
-------------------
${(data.interventionsUsed || []).join(', ') || 'None'}

Homework Assigned:
------------------
${data.homeworkAssigned || 'None'}

Next Session Focus:
-------------------
${data.nextSessionFocus || 'None'}

Risk Assessment:
----------------
${data.riskAssessment || 'None'}
`;
}

function generateClinicalNotesPdf(data) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Title
      doc.fontSize(22).text('CalmRoot Clinical Session Notes', { align: 'center' });
      doc.moveDown(1.5);

      // Metadata section
      doc.fontSize(12).fillColor('#333333');
      doc.text(`Session ID: ${data.sessionId || 'N/A'}`);
      doc.text(`Date: ${data.date || new Date().toISOString().split('T')[0]}`);
      doc.text(`Patient ID: ${data.patientId || 'N/A'}`);
      doc.text(`Patient Name: ${data.patientName || 'N/A'}`);
      doc.text(`Therapist Name: ${data.therapistName || 'N/A'}`);
      doc.moveDown(1.5);

      // Divider line
      doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#cccccc').stroke();
      doc.moveDown(1);

      // Helper function for sections
      const addSection = (title, content) => {
        doc.fontSize(14).fillColor('#111111').text(title, { underline: false });
        doc.moveDown(0.2);
        doc.fontSize(11).fillColor('#444444').text(content || 'None');
        doc.moveDown(1);
      };

      addSection('Presenting Issues', (data.presentingIssues || []).join(', '));
      addSection('Session Observations', data.sessionObservations);
      addSection('Session Summary', data.sessionSummary);
      addSection('Interventions Used', (data.interventionsUsed || []).join(', '));
      addSection('Homework Assigned', data.homeworkAssigned);
      addSection('Next Session Focus', data.nextSessionFocus);
      addSection('Risk Assessment', data.riskAssessment);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

async function uploadClinicalNotes(data) {
  const patientId = data.patientId;
  const sessionId = data.sessionId;
  const date = data.date || new Date().toISOString().split('T')[0];

  const txtContent = generateClinicalNotesTxt(data);
  const pdfContent = await generateClinicalNotesPdf(data);

  const txtKey = `patients/${patientId}/clinical-notes/${sessionId}/${date}.txt`;
  const pdfKey = `patients/${patientId}/clinical-notes/${sessionId}/${date}.pdf`;

  // Upload TXT to S3
  await s3Client.send(new PutObjectCommand({
    Bucket: CLINICAL_NOTES_BUCKET,
    Key: txtKey,
    Body: txtContent,
    ContentType: 'text/plain'
  }));

  // Upload PDF to S3
  await s3Client.send(new PutObjectCommand({
    Bucket: CLINICAL_NOTES_BUCKET,
    Key: pdfKey,
    Body: pdfContent,
    ContentType: 'application/pdf'
  }));

  // Update DynamoDB session record with keys
  const session = await Session.findById(sessionId);
  if (session) {
    session.clinicalNotesS3Key = txtKey;
    session.clinicalNotesPdfKey = pdfKey;
    
    // Also save notes details onto the session itself for inline queries
    session.presentingIssues = data.presentingIssues || [];
    session.sessionObservations = data.sessionObservations || '';
    session.sessionSummary = data.sessionSummary || '';
    session.interventionsUsed = data.interventionsUsed || [];
    session.homeworkAssigned = data.homeworkAssigned || '';
    session.nextSessionFocus = data.nextSessionFocus || '';
    session.riskAssessment = data.riskAssessment || 'none';
    
    await session.save();
  }

  return { txtKey, pdfKey };
}

async function getPresignedDownloadUrl(s3Key, expiresIn = 900) {
  const command = new GetObjectCommand({
    Bucket: CLINICAL_NOTES_BUCKET,
    Key: s3Key
  });
  return await getSignedUrl(s3Client, command, { expiresIn });
}

module.exports = {
  generateClinicalNotesTxt,
  generateClinicalNotesPdf,
  uploadClinicalNotes,
  getPresignedDownloadUrl
};
