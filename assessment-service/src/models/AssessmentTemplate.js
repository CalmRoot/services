const { ddbDocClient } = require('../config/dynamodb-client');
const { PutCommand, GetCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const TABLE_NAME = 'calmroot-assessment-templates';

function wrapTemplate(item) {
  if (!item) return null;
  const t = { ...item };
  t._id = item.type;
  return t;
}

function makeChainable(promise) {
  promise.select = function () {
    return makeChainable(promise);
  };
  return promise;
}

const AssessmentTemplate = {
  findOne: function (query = {}) {
    const promise = (async () => {
      if (query && query.type) {
        const params = {
          TableName: TABLE_NAME,
          Key: {
            type: query.type.toUpperCase(),
            SK: 'TEMPLATE'
          }
        };
        try {
          const data = await ddbDocClient.send(new GetCommand(params));
          const item = data.Item;
          if (item) {
            if (query.isActive !== undefined && item.isActive !== query.isActive) {
              return null;
            }
            return wrapTemplate(item);
          }
        } catch (err) {
          console.error('Error in AssessmentTemplate.findOne:', err);
        }
      }
      return null;
    })();
    return makeChainable(promise);
  },

  find: function (query = {}) {
    const promise = (async () => {
      try {
        const params = { TableName: TABLE_NAME };
        let filterExpression = [];
        let expressionAttributeValues = {};

        if (query && query.isActive !== undefined) {
          filterExpression.push('isActive = :isActive');
          expressionAttributeValues[':isActive'] = query.isActive;
        }

        if (filterExpression.length > 0) {
          params.FilterExpression = filterExpression.join(' AND ');
          params.ExpressionAttributeValues = expressionAttributeValues;
        }

        const data = await ddbDocClient.send(new ScanCommand(params));
        return (data.Items || []).map(item => wrapTemplate(item));
      } catch (err) {
        console.error('Error in AssessmentTemplate.find:', err);
        return [];
      }
    })();
    return makeChainable(promise);
  },

  create: async function (data) {
    const templateItem = {
      SK: 'TEMPLATE',
      isActive: true,
      ...data,
      type: data.type.toUpperCase()
    };
    const params = {
      TableName: TABLE_NAME,
      Item: templateItem
    };
    await ddbDocClient.send(new PutCommand(params));
    return wrapTemplate(templateItem);
  },

  deleteMany: async function () {
    // Overwriting via create/PutCommand handles the seed data update. 
    // Return mock deletedCount to satisfy mongoose seed call.
    return { deletedCount: 0 };
  }
};

module.exports = AssessmentTemplate;
