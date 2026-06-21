const { ddbDocClient } = require('../config/dynamodb-client');
const { PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

// Availability is stored in the calmroot-users table with SK = 'AVAILABILITY'
const TABLE_NAME = 'calmroot-users';

function wrapAvailability(item) {
  if (!item) return null;
  const a = { ...item };
  a._id = item.userId + '#AVAILABILITY';
  a.therapistId = item.userId;
  return a;
}

const TherapistAvailability = {
  findOne: async function (query = {}) {
    if (query && query.therapistId) {
      const params = {
        TableName: TABLE_NAME,
        Key: {
          userId: query.therapistId,
          SK: 'AVAILABILITY'
        }
      };
      try {
        const data = await ddbDocClient.send(new GetCommand(params));
        return wrapAvailability(data.Item);
      } catch (err) {
        console.error('Error in TherapistAvailability.findOne:', err);
        return null;
      }
    }
    return null;
  },

  findOneAndUpdate: async function (query, updateData, options = {}) {
    if (!query || !query.therapistId) return null;

    try {
      // Get existing or create new
      const getParams = {
        TableName: TABLE_NAME,
        Key: {
          userId: query.therapistId,
          SK: 'AVAILABILITY'
        }
      };
      const existing = await ddbDocClient.send(new GetCommand(getParams));
      let item = existing.Item;

      if (!item && !options.upsert) {
        return null;
      }

      if (!item) {
        item = {
          userId: query.therapistId,
          SK: 'AVAILABILITY'
        };
      }

      // Merge update data
      if (updateData.weeklySchedule !== undefined) {
        item.weeklySchedule = updateData.weeklySchedule;
      }
      if (updateData.blockedDates !== undefined) {
        item.blockedDates = updateData.blockedDates;
      }
      item.updatedAt = updateData.updatedAt || new Date().toISOString();

      await ddbDocClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: item
      }));

      return wrapAvailability(item);
    } catch (err) {
      console.error('Error in TherapistAvailability.findOneAndUpdate:', err);
      return null;
    }
  },

  create: async function (data) {
    const item = {
      userId: data.therapistId,
      SK: 'AVAILABILITY',
      weeklySchedule: data.weeklySchedule || {},
      blockedDates: data.blockedDates || [],
      updatedAt: new Date().toISOString()
    };

    await ddbDocClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: item
    }));

    return wrapAvailability(item);
  }
};

module.exports = TherapistAvailability;
