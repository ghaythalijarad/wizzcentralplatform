const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand
} = require('@aws-sdk/lib-dynamodb');

// Configure AWS SDK v3
const dynamoClient = new DynamoDBClient({
  region: process.env.REGION || 'us-east-1'
});

class Database {
  constructor() {
    this.client = dynamoClient;
  }

  // Generic CRUD operations
  async create(tableName, item) {
    const itemWithTimestamps = {
      ...item,
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const params = {
      TableName: tableName,
      Item: itemWithTimestamps
    };

    try {
      await this.client.send(new PutCommand(params));
      return itemWithTimestamps;
    } catch (error) {
      console.error('Database Create Error:', error);
      throw new Error(`Failed to create item in ${tableName}`);
    }
  }

  // Get by primary key (flexible for different key names)
  async get(tableName, keyName, keyValue) {
    const params = {
      TableName: tableName,
      Key: { [keyName]: keyValue }
    };

    try {
      const result = await this.client.send(new GetCommand(params));
      return result.Item;
    } catch (error) {
      console.error('Database Get Error:', error);
      throw new Error(`Failed to get item from ${tableName}`);
    }
  }

  // Backward compatibility
  async getById(tableName, id) {
    return this.get(tableName, 'id', id);
  }

  // Get by userId
  async getByUserId(tableName, userId) {
    return this.get(tableName, 'userId', userId);
  }

  // Update item
  async update(tableName, keyName, keyValue, updates) {
    const updateExpression = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    Object.keys(updates).forEach(key => {
      updateExpression.push(`#${key} = :${key}`);
      expressionAttributeNames[`#${key}`] = key;
      expressionAttributeValues[`:${key}`] = updates[key];
    });

    // Always update the updatedAt timestamp
    updateExpression.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const params = {
      TableName: tableName,
      Key: { [keyName]: keyValue },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    };

    try {
      const result = await this.client.send(new UpdateCommand(params));
      return result.Attributes;
    } catch (error) {
      console.error('Database Update Error:', error);
      throw new Error(`Failed to update item in ${tableName}`);
    }
  }

  // Backward compatibility
  async updateById(tableName, id, updates) {
    return this.update(tableName, 'id', id, updates);
  }

  // Delete item
  async delete(tableName, keyName, keyValue) {
    const params = {
      TableName: tableName,
      Key: { [keyName]: keyValue }
    };

    try {
      await this.client.send(new DeleteCommand(params));
      return { success: true };
    } catch (error) {
      console.error('Database Delete Error:', error);
      throw new Error(`Failed to delete item from ${tableName}`);
    }
  }

  // Backward compatibility
  async deleteById(tableName, id) {
    return this.delete(tableName, 'id', id);
  }

  // Scan table
  async scan(tableName, filters = {}, limit = null) {
    let params = {
      TableName: tableName
    };

    if (limit) {
      params.Limit = limit;
    }

    // Add filters if provided
    if (Object.keys(filters).length > 0) {
      const filterExpression = [];
      const expressionAttributeNames = {};
      const expressionAttributeValues = {};

      Object.keys(filters).forEach(key => {
        filterExpression.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = filters[key];
      });

      params.FilterExpression = filterExpression.join(' AND ');
      params.ExpressionAttributeNames = expressionAttributeNames;
      params.ExpressionAttributeValues = expressionAttributeValues;
    }

    try {
      const result = await this.client.send(new ScanCommand(params));
      return result.Items || [];
    } catch (error) {
      console.error('Database Scan Error:', error);
      throw new Error(`Failed to scan ${tableName}`);
    }
  }

  // Query table with index
  async query(tableName, indexName, keyCondition, filters = {}, limit = null) {
    let params = {
      TableName: tableName,
      KeyConditionExpression: keyCondition.expression,
      ExpressionAttributeValues: keyCondition.values
    };

    if (indexName) {
      params.IndexName = indexName;
    }

    if (keyCondition.names) {
      params.ExpressionAttributeNames = keyCondition.names;
    }

    // Add additional filters
    if (Object.keys(filters).length > 0) {
      const filterExpression = [];
      const expressionAttributeNames = params.ExpressionAttributeNames || {};
      const expressionAttributeValues = { ...params.ExpressionAttributeValues };

      Object.keys(filters).forEach(key => {
        filterExpression.push(`#filter_${key} = :filter_${key}`);
        expressionAttributeNames[`#filter_${key}`] = key;
        expressionAttributeValues[`:filter_${key}`] = filters[key];
      });

      params.FilterExpression = filterExpression.join(' AND ');
      params.ExpressionAttributeNames = expressionAttributeNames;
      params.ExpressionAttributeValues = expressionAttributeValues;
    }

    try {
      const result = await this.client.send(new QueryCommand(params));
      return result.Items || [];
    } catch (error) {
      console.error('Database Query Error:', error);
      throw new Error(`Failed to query ${tableName}`);
    }
  }

  // Find by email (common operation)
  async findByEmail(tableName, email) {
    const params = {
      TableName: tableName,
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email
      }
    };

    try {
      const result = await this.client.send(new QueryCommand(params));
      return result.Items && result.Items.length > 0 ? result.Items[0] : null;
    } catch (error) {
      console.error('Database FindByEmail Error:', error);
      throw new Error(`Failed to find by email in ${tableName}`);
    }
  }

  async batchWrite(tableName, items) {
    // Implementation for batch write operations
    // This would be used for writing multiple items at once
    console.log('Batch write not implemented yet');
    return { success: true };
  }
}

module.exports = new Database();
