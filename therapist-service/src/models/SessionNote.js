// SessionNote is now merged into the Session model.
// Notes fields (presentingIssues, sessionSummary, observations, interventionsUsed,
// homeworkAssigned, nextSessionFocus, riskAssessment) are stored as attributes
// directly on the Session item in the calmroot-sessions DynamoDB table.
//
// This module provides a backward-compatible API so existing controller code
// still works without changes.

const { ddbDocClient } = require('../config/dynamodb-client');
const { GetCommand, PutCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const TABLE_NAME = 'calmroot-sessions';

function wrapNote(item) {
  if (!item) return null;
  const note = {
    sessionId: item.sessionId,
    therapistId: item.therapistId,
    userId: item.userId,
    presentingIssues: item.presentingIssues || [],
    sessionSummary: item.sessionSummary || '',
    observations: item.observations || item.sessionObservations || '',
    sessionObservations: item.sessionObservations || item.observations || '',
    interventionsUsed: item.interventionsUsed || [],
    homeworkAssigned: item.homeworkAssigned || '',
    nextSessionFocus: item.nextSessionFocus || '',
    riskAssessment: item.riskAssessment || 'none',
    clinicalNotesS3Key: item.clinicalNotesS3Key || null,
    clinicalNotesPdfKey: item.clinicalNotesPdfKey || null,
    createdAt: item.noteCreatedAt || item.createdAt,
    updatedAt: item.noteUpdatedAt || item.updatedAt
  };
  note._id = item.sessionId + '#NOTE';
  return note;
}

const SessionNote = {
  findOne: async function (query = {}) {
    if (query && query.sessionId) {
      try {
        const params = {
          TableName: TABLE_NAME,
          Key: {
            sessionId: query.sessionId,
            SK: 'SESSION'
          }
        };
        const data = await ddbDocClient.send(new GetCommand(params));
        if (data.Item && (data.Item.presentingIssues !== undefined || data.Item.clinicalNotesS3Key !== undefined)) {
          return wrapNote(data.Item);
        }
        return null;
      } catch (err) {
        console.error('Error in SessionNote.findOne:', err);
        return null;
      }
    }
    return null;
  },

  findOneAndUpdate: async function (query, updateData, options = {}) {
    if (!query || !query.sessionId) return null;

    try {
      // Get the existing session
      const params = {
        TableName: TABLE_NAME,
        Key: {
          sessionId: query.sessionId,
          SK: 'SESSION'
        }
      };
      const data = await ddbDocClient.send(new GetCommand(params));
      let sessionItem = data.Item;

      if (!sessionItem && !options.upsert) {
        return null;
      }

      if (!sessionItem) {
        sessionItem = {
          sessionId: query.sessionId,
          SK: 'SESSION'
        };
      }

      // Merge note fields into the session
      const noteFields = [
        'presentingIssues', 'sessionSummary', 'observations', 'sessionObservations',
        'interventionsUsed', 'homeworkAssigned', 'nextSessionFocus',
        'riskAssessment', 'therapistId', 'userId', 'clinicalNotesS3Key', 'clinicalNotesPdfKey'
      ];
      const now = new Date().toISOString();
      for (const field of noteFields) {
        if (updateData[field] !== undefined) {
          sessionItem[field] = updateData[field];
        }
      }
      sessionItem.noteUpdatedAt = now;
      if (!sessionItem.noteCreatedAt) {
        sessionItem.noteCreatedAt = now;
      }

      await ddbDocClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: sessionItem
      }));

      return wrapNote(sessionItem);
    } catch (err) {
      console.error('Error in SessionNote.findOneAndUpdate:', err);
      return null;
    }
  }
};

module.exports = SessionNote;
