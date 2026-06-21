const { ddbDocClient } = require('../config/dynamodb-client');
const { PutCommand, QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const crypto = require('crypto');

const TABLE_NAME = 'calmroot-assessments';

function wrapResult(item) {
  if (!item) return null;
  const result = { ...item };
  result._id = item.resultId;
  
  if (item.takenAt && typeof item.takenAt === 'string') {
    result.takenAt = new Date(item.takenAt);
  }
  
  result.toObject = function () {
    const obj = { ...this };
    delete obj.toObject;
    return obj;
  };
  
  return result;
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

function makeFindOneChainable(promise) {
  let sortQuery = null;
  
  const execute = async () => {
    const results = await promise;
    if (!results || results.length === 0) return null;
    if (sortQuery) {
      const key = Object.keys(sortQuery)[0];
      const direction = sortQuery[key];
      const sorted = [...results].sort((a, b) => {
        const valA = a[key] instanceof Date ? a[key].getTime() : a[key];
        const valB = b[key] instanceof Date ? b[key].getTime() : b[key];
        return direction === -1 ? (valB > valA ? 1 : -1) : (valA > valB ? 1 : -1);
      });
      return sorted[0];
    }
    return results[0];
  };
  
  const thenable = {
    then: function (onSuccess, onFailure) {
      return execute().then(onSuccess, onFailure);
    },
    sort: function (sq) {
      sortQuery = sq;
      return this;
    },
    select: function () {
      return this;
    }
  };
  
  return thenable;
}

const AssessmentResult = {
  create: async function (data) {
    const resultId = crypto.randomUUID();
    const takenAtDate = data.takenAt || new Date();
    const takenAtStr = takenAtDate instanceof Date ? takenAtDate.toISOString() : takenAtDate;
    
    const resultItem = {
      resultId,
      SK: `ASSESSMENT#${takenAtStr}`,
      ...data,
      takenAt: takenAtStr
    };
    
    const params = {
      TableName: TABLE_NAME,
      Item: resultItem
    };
    
    await ddbDocClient.send(new PutCommand(params));
    return wrapResult(resultItem);
  },

  find: function (query = {}) {
    const promise = (async () => {
      let results = [];
      
      if (query.userId) {
        // Query by userId (PK) and SK begins_with ASSESSMENT#
        const params = {
          TableName: TABLE_NAME,
          KeyConditionExpression: 'userId = :userId AND begins_with(SK, :skPrefix)',
          ExpressionAttributeValues: {
            ':userId': query.userId,
            ':skPrefix': 'ASSESSMENT#'
          }
        };
        
        if (query.assessmentType) {
          params.FilterExpression = 'assessmentType = :assessmentType';
          params.ExpressionAttributeValues[':assessmentType'] = query.assessmentType;
        }
        
        try {
          const data = await ddbDocClient.send(new QueryCommand(params));
          results = data.Items || [];
        } catch (err) {
          console.error('Error querying assessments by userId:', err);
          return [];
        }
      } else {
        // Fallback scan
        try {
          const data = await ddbDocClient.send(new ScanCommand({ TableName: TABLE_NAME }));
          results = (data.Items || []).filter(item => item.SK && item.SK.startsWith('ASSESSMENT#'));
        } catch (err) {
          console.error('Error scanning assessments:', err);
          return [];
        }
      }
      
      return results.map(item => wrapResult(item));
    })();
    
    return makeChainable(promise);
  },

  findOne: function (query = {}) {
    // We execute a find query and return chainable single item
    const findPromise = (async () => {
      let results = [];
      if (query.userId) {
        const params = {
          TableName: TABLE_NAME,
          KeyConditionExpression: 'userId = :userId AND begins_with(SK, :skPrefix)',
          ExpressionAttributeValues: {
            ':userId': query.userId,
            ':skPrefix': 'ASSESSMENT#'
          }
        };
        
        if (query.assessmentType) {
          params.FilterExpression = 'assessmentType = :assessmentType';
          params.ExpressionAttributeValues[':assessmentType'] = query.assessmentType;
        }
        
        const data = await ddbDocClient.send(new QueryCommand(params));
        results = data.Items || [];
      } else {
        const data = await ddbDocClient.send(new ScanCommand({ TableName: TABLE_NAME }));
        results = (data.Items || []).filter(item => item.SK && item.SK.startsWith('ASSESSMENT#'));
      }
      return results.map(item => wrapResult(item));
    })();
    
    return makeFindOneChainable(findPromise);
  }
};

module.exports = AssessmentResult;
