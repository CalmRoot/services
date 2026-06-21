const { ddbDocClient } = require('../config/dynamodb-client');
const { PutCommand, GetCommand, QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const crypto = require('crypto');

const TABLE_NAME = 'calmroot-users';

function wrapUser(item) {
  if (!item) return null;
  const user = { ...item };
  user._id = item.userId;

  user.save = async function () {
    const now = new Date().toISOString();
    this.updatedAt = now;

    const itemToSave = { ...this };
    delete itemToSave.save;
    delete itemToSave.toSafeObject;
    delete itemToSave._id;

    const sanitize = (obj) => {
      Object.keys(obj).forEach(key => {
        if (obj[key] instanceof Date) {
          obj[key] = obj[key].toISOString();
        } else if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
          sanitize(obj[key]);
        }
      });
    };
    sanitize(itemToSave);

    const putParams = {
      TableName: TABLE_NAME,
      Item: itemToSave
    };

    await ddbDocClient.send(new PutCommand(putParams));
    return this;
  };

  user.toSafeObject = function () {
    const obj = { ...this };
    delete obj.passwordHash;
    delete obj.save;
    delete obj.toSafeObject;
    return obj;
  };

  return user;
}

const User = {
  findOne: function (query) {
    const promise = (async () => {
      if (query && query.email) {
        const email = query.email.toLowerCase();
        const params = {
          TableName: TABLE_NAME,
          IndexName: 'email-index',
          KeyConditionExpression: 'email = :email',
          ExpressionAttributeValues: {
            ':email': email
          }
        };
        const data = await ddbDocClient.send(new QueryCommand(params));
        if (data.Items && data.Items.length > 0) {
          const userItem = data.Items[0];
          return this.findById(userItem.userId);
        }
        return null;
      }
      return null;
    })();
    promise.select = function () { return promise; };
    return promise;
  },

  findById: function (id) {
    const promise = (async () => {
      if (!id) return null;
      const params = {
        TableName: TABLE_NAME,
        Key: {
          userId: id,
          SK: 'PROFILE'
        }
      };
      try {
        const data = await ddbDocClient.send(new GetCommand(params));
        return wrapUser(data.Item);
      } catch (err) {
        console.error('Error in findById:', err);
        return null;
      }
    })();
    promise.select = function () { return promise; };
    return promise;
  },

  create: async function (userData) {
    const userId = crypto.randomUUID();
    const now = new Date().toISOString();

    const userItem = {
      userId,
      SK: 'PROFILE',
      isActive: true,
      phone: '',
      privacySettings: {
        shareAssessmentsWithTherapist: false,
        shareMoodWithTherapist: false
      },
      createdAt: now,
      updatedAt: now,
      ...userData
    };

    const params = {
      TableName: TABLE_NAME,
      Item: userItem
    };

    await ddbDocClient.send(new PutCommand(params));
    return wrapUser(userItem);
  },

  find: function (query = {}) {
    const promise = (async () => {
      let filterExpressions = [];
      let expressionAttributeValues = {};
      let expressionAttributeNames = {};

      // Filter by role
      if (query.role) {
        filterExpressions.push('#role = :role');
        expressionAttributeNames['#role'] = 'role';
        expressionAttributeValues[':role'] = query.role;
      }

      // Filter by therapistProfile.isVerified — FIXED nested attribute syntax
      if (query['therapistProfile.isVerified'] !== undefined) {
        filterExpressions.push('#tp.#isVerified = :isVerified');
        expressionAttributeNames['#tp'] = 'therapistProfile';
        expressionAttributeNames['#isVerified'] = 'isVerified';
        expressionAttributeValues[':isVerified'] = query['therapistProfile.isVerified'];
      }

      // Filter by specialization
      if (query['therapistProfile.specializations']) {
        const spec = query['therapistProfile.specializations'].$in
          ? query['therapistProfile.specializations'].$in[0]
          : query['therapistProfile.specializations'];
        if (spec) {
          filterExpressions.push('contains(#tp2.#specs, :spec)');
          expressionAttributeNames['#tp2'] = 'therapistProfile';
          expressionAttributeNames['#specs'] = 'specializations';
          expressionAttributeValues[':spec'] = spec.toLowerCase();
        }
      }

      // Filter by language
      if (query['therapistProfile.languages']) {
        let lang = query['therapistProfile.languages'];
        if (lang instanceof RegExp) {
          lang = lang.source;
        } else if (lang.$regex) {
          lang = lang.$regex instanceof RegExp
            ? lang.$regex.source
            : lang.$regex;
        }
        filterExpressions.push('contains(#tp3.#langs, :lang)');
        expressionAttributeNames['#tp3'] = 'therapistProfile';
        expressionAttributeNames['#langs'] = 'languages';
        expressionAttributeValues[':lang'] = lang;
      }

      // Filter by maxPrice
      if (query['therapistProfile.sessionPrice']) {
        const priceLte = query['therapistProfile.sessionPrice'].$lte;
        if (priceLte !== undefined) {
          filterExpressions.push('#tp4.#price <= :maxPrice');
          expressionAttributeNames['#tp4'] = 'therapistProfile';
          expressionAttributeNames['#price'] = 'sessionPrice';
          expressionAttributeValues[':maxPrice'] = Number(priceLte);
        }
      }

      const params = {
        TableName: TABLE_NAME
      };

      if (filterExpressions.length > 0) {
        params.FilterExpression = filterExpressions.join(' AND ');
        params.ExpressionAttributeValues = expressionAttributeValues;
      }

      if (Object.keys(expressionAttributeNames).length > 0) {
        params.ExpressionAttributeNames = expressionAttributeNames;
      }

      try {
        const data = await ddbDocClient.send(new ScanCommand(params));
        return (data.Items || []).map(item => wrapUser(item));
      } catch (err) {
        console.error('Error in find:', err);
        return [];
      }
    })();

    promise.select = function () { return promise; };
    return promise;
  }
};

module.exports = User;