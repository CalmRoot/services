const { ddbDocClient } = require('../config/dynamodb-client');
const { PutCommand, QueryCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const TABLE_NAME = 'calmroot-therapist-patients';

const TherapistPatient = {
  assignPatient: async function (data) {
    const item = {
      therapistId: data.therapistId,
      SK: `PATIENT#${data.patientId}`,
      patientId: data.patientId,
      patientName: data.patientName || '',
      assignedDate: data.assignedDate || new Date().toISOString(),
      consentStatus: data.consentStatus || 'pending'
    };

    await ddbDocClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: item
    }));

    return item;
  },

  getPatientsByTherapist: async function (therapistId) {
    const params = {
      TableName: TABLE_NAME,
      KeyConditionExpression: 'therapistId = :tid AND begins_with(SK, :prefix)',
      ExpressionAttributeValues: {
        ':tid': therapistId,
        ':prefix': 'PATIENT#'
      }
    };

    try {
      const data = await ddbDocClient.send(new QueryCommand(params));
      return data.Items || [];
    } catch (err) {
      console.error('Error in getPatientsByTherapist:', err);
      return [];
    }
  },

  getTherapistForPatient: async function (patientId) {
    // This requires a scan since patientId is not the PK
    // In production, consider adding a GSI on patientId
    const { ScanCommand } = require('@aws-sdk/lib-dynamodb');
    const params = {
      TableName: TABLE_NAME,
      FilterExpression: 'patientId = :pid',
      ExpressionAttributeValues: {
        ':pid': patientId
      }
    };

    try {
      const data = await ddbDocClient.send(new ScanCommand(params));
      return data.Items && data.Items.length > 0 ? data.Items[0] : null;
    } catch (err) {
      console.error('Error in getTherapistForPatient:', err);
      return null;
    }
  },

  updateConsentStatus: async function (therapistId, patientId, consentStatus) {
    const getParams = {
      TableName: TABLE_NAME,
      Key: {
        therapistId,
        SK: `PATIENT#${patientId}`
      }
    };

    try {
      const existing = await ddbDocClient.send(new GetCommand(getParams));
      if (!existing.Item) return null;

      const updated = {
        ...existing.Item,
        consentStatus,
        updatedAt: new Date().toISOString()
      };

      await ddbDocClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: updated
      }));

      return updated;
    } catch (err) {
      console.error('Error in updateConsentStatus:', err);
      return null;
    }
  }
};

module.exports = TherapistPatient;
