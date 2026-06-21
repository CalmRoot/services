const { ddbDocClient } = require('../config/dynamodb-client');
const { PutCommand, GetCommand, QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const crypto = require('crypto');

const TABLE_NAME = 'calmroot-sessions';

function wrapSession(item) {
  if (!item) return null;
  const s = { ...item };
  s._id = item.sessionId;
  
  if (item.createdAt && typeof item.createdAt === 'string') {
    s.createdAt = new Date(item.createdAt);
  }
  if (item.updatedAt && typeof item.updatedAt === 'string') {
    s.updatedAt = new Date(item.updatedAt);
  }

  s.save = async function () {
    this.updatedAt = new Date();
    const itemToSave = { ...this };
    delete itemToSave.save;
    delete itemToSave._id;
    
    if (itemToSave.createdAt instanceof Date) {
      itemToSave.createdAt = itemToSave.createdAt.toISOString();
    }
    if (itemToSave.updatedAt instanceof Date) {
      itemToSave.updatedAt = itemToSave.updatedAt.toISOString();
    }

    const putParams = {
      TableName: TABLE_NAME,
      Item: itemToSave
    };
    await ddbDocClient.send(new PutCommand(putParams));
    return this;
  };

  return s;
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
  return {
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
}

const Session = {
  create: async function (data) {
    const sessionId = crypto.randomUUID();
    const now = new Date().toISOString();
    const sessionItem = {
      sessionId,
      SK: 'SESSION',
      createdAt: now,
      updatedAt: now,
      ...data
    };
    const params = {
      TableName: TABLE_NAME,
      Item: sessionItem
    };
    await ddbDocClient.send(new PutCommand(params));
    return wrapSession(sessionItem);
  },

  findById: function (id) {
    const promise = (async () => {
      if (!id) return null;
      const params = {
        TableName: TABLE_NAME,
        Key: {
          sessionId: id,
          SK: 'SESSION'
        }
      };
      try {
        const data = await ddbDocClient.send(new GetCommand(params));
        return wrapSession(data.Item);
      } catch (err) {
        console.error('Error in Session.findById:', err);
        return null;
      }
    })();
    return makeChainable(promise);
  },

  find: function (query = {}) {
    const promise = (async () => {
      let results = [];
      try {
        if (query && query.therapistId) {
          const params = {
            TableName: TABLE_NAME,
            IndexName: 'therapist-index',
            KeyConditionExpression: 'therapistId = :therapistId',
            ExpressionAttributeValues: {
              ':therapistId': query.therapistId
            }
          };
          const data = await ddbDocClient.send(new QueryCommand(params));
          results = data.Items || [];
        } else if (query && query.userId) {
          const params = {
            TableName: TABLE_NAME,
            IndexName: 'patient-index',
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
              ':userId': query.userId
            }
          };
          const data = await ddbDocClient.send(new QueryCommand(params));
          results = data.Items || [];
        } else {
          const data = await ddbDocClient.send(new ScanCommand({ TableName: TABLE_NAME }));
          results = data.Items || [];
        }

        // Apply filters in JS
        if (query) {
          if (query.scheduledDate) {
            if (typeof query.scheduledDate === 'object') {
              if (query.scheduledDate.$gte) {
                results = results.filter(s => s.scheduledDate >= query.scheduledDate.$gte);
              }
              if (query.scheduledDate.$lte) {
                results = results.filter(s => s.scheduledDate <= query.scheduledDate.$lte);
              }
            } else {
              results = results.filter(s => s.scheduledDate === query.scheduledDate);
            }
          }
          if (query.status) {
            if (typeof query.status === 'object' && query.status.$in) {
              results = results.filter(s => query.status.$in.includes(s.status));
            } else {
              results = results.filter(s => s.status === query.status);
            }
          }
        }

        return results.map(item => wrapSession(item));
      } catch (err) {
        console.error('Error in Session.find:', err);
        return [];
      }
    })();
    return makeChainable(promise);
  },

  findOne: function (query = {}) {
    const findPromise = (async () => {
      const results = await this.find(query);
      return results;
    })();
    return makeFindOneChainable(findPromise);
  },

  countDocuments: async function (query = {}) {
    const list = await this.find(query);
    return list.length;
  }
};

module.exports = Session;
