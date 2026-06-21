const { ddbDocClient } = require('../config/dynamodb-client');
const { PutCommand, GetCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const TABLE_NAME = 'calmroot-mood-logs';

function wrapMood(item) {
  if (!item) return null;
  const mood = { ...item };
  mood._id = item.userId + '#' + item.logDate;
  
  if (item.createdAt && typeof item.createdAt === 'string') {
    mood.createdAt = new Date(item.createdAt);
  }

  mood.save = async function () {
    const itemToSave = { ...this };
    delete itemToSave.save;
    delete itemToSave._id;
    
    // Ensure createdAt is stored as string in DynamoDB
    if (itemToSave.createdAt instanceof Date) {
      itemToSave.createdAt = itemToSave.createdAt.toISOString();
    }

    const putParams = {
      TableName: TABLE_NAME,
      Item: itemToSave
    };
    
    await ddbDocClient.send(new PutCommand(putParams));
    return this;
  };

  return mood;
}

function makeChainable(promise) {
  promise.sort = function (sortQuery) {
    const sortedPromise = promise.then(results => {
      if (!Array.isArray(results)) return results;
      const key = Object.keys(sortQuery)[0];
      const direction = sortQuery[key];
      return [...results].sort((a, b) => {
        const valA = a[key] instanceof Date ? a[key].getTime() : a[key];
        const valB = b[key] instanceof Date ? b[key].getTime() : b[key];
        return direction === -1 ? (valB > valA ? 1 : -1) : (valA > valB ? 1 : -1);
      });
    });
    return makeChainable(sortedPromise);
  };
  
  promise.select = function () {
    return makeChainable(promise);
  };
  
  return promise;
}

const MoodLog = {
  create: async function (data) {
    const createdAtDate = data.createdAt || new Date();
    const createdAtStr = createdAtDate instanceof Date ? createdAtDate.toISOString() : createdAtDate;
    
    const moodItem = {
      SK: `MOOD#${data.logDate}`,
      ...data,
      createdAt: createdAtStr
    };
    
    const params = {
      TableName: TABLE_NAME,
      Item: moodItem
    };
    
    await ddbDocClient.send(new PutCommand(params));
    return wrapMood(moodItem);
  },

  findOne: function (query = {}) {
    const promise = (async () => {
      if (query && query.userId && query.logDate) {
        const params = {
          TableName: TABLE_NAME,
          Key: {
            userId: query.userId,
            SK: `MOOD#${query.logDate}`
          }
        };
        try {
          const data = await ddbDocClient.send(new GetCommand(params));
          return wrapMood(data.Item);
        } catch (err) {
          console.error('Error in MoodLog.findOne:', err);
          return null;
        }
      }
      return null;
    })();
    return promise;
  },

  find: function (query = {}) {
    const promise = (async () => {
      if (!query || !query.userId) return [];
      
      let skCondition = 'begins_with(SK, :prefix)';
      let expressionAttributeValues = {
        ':userId': query.userId,
        ':prefix': 'MOOD#'
      };

      if (query.logDate) {
        if (query.logDate.$gte) {
          skCondition = 'SK >= :skStart';
          expressionAttributeValues[':skStart'] = `MOOD#${query.logDate.$gte}`;
          delete expressionAttributeValues[':prefix'];
        }
      }

      const params = {
        TableName: TABLE_NAME,
        KeyConditionExpression: 'userId = :userId AND ' + skCondition,
        ExpressionAttributeValues: expressionAttributeValues
      };

      try {
        const data = await ddbDocClient.send(new QueryCommand(params));
        let items = data.Items || [];
        
        if (query.logDate) {
          if (query.logDate.$lt) {
            const ltVal = `MOOD#${query.logDate.$lt}`;
            items = items.filter(item => item.SK < ltVal);
          }
          if (query.logDate.$lte) {
            const lteVal = `MOOD#${query.logDate.$lte}`;
            items = items.filter(item => item.SK <= lteVal);
          }
        }
        
        return items.map(item => wrapMood(item));
      } catch (err) {
        console.error('Error in MoodLog.find:', err);
        return [];
      }
    })();
    return makeChainable(promise);
  }
};

module.exports = MoodLog;
