const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand
} = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');

const responseHelper = require('../utils/response');
const { validateInput } = require('../utils/validation');
const { verifyToken } = require('../utils/auth');
const { sendEmail } = require('../utils/email');

const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION });

// Validation schemas
const createTicketSchema = Joi.object({
  subject: Joi.string().min(5).max(200).required(),
  description: Joi.string().min(10).max(2000).required(),
  category: Joi.string().valid(
    'order_issue', 'payment_problem', 'delivery_delay', 'app_bug', 
    'account_issue', 'merchant_support', 'driver_support', 'other'
  ).required(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
  userId: Joi.string().required(),
  userType: Joi.string().valid('customer', 'merchant', 'driver', 'admin').required(),
  attachments: Joi.array().items(Joi.object({
    filename: Joi.string().required(),
    url: Joi.string().uri().required(),
    fileType: Joi.string().required()
  })).optional(),
  relatedOrderId: Joi.string().optional()
});

const updateTicketSchema = Joi.object({
  status: Joi.string().valid('open', 'in_progress', 'resolved', 'closed').optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
  assignedTo: Joi.string().optional(),
  resolution: Joi.string().max(1000).optional(),
  internalNotes: Joi.string().max(1000).optional()
});

const addMessageSchema = Joi.object({
  message: Joi.string().min(1).max(2000).required(),
  isInternal: Joi.boolean().default(false),
  attachments: Joi.array().items(Joi.object({
    filename: Joi.string().required(),
    url: Joi.string().uri().required(),
    fileType: Joi.string().required()
  })).optional()
});

const createFAQSchema = Joi.object({
  question: Joi.string().min(10).max(300).required(),
  answer: Joi.string().min(20).max(2000).required(),
  category: Joi.string().required(),
  tags: Joi.array().items(Joi.string()).optional(),
  isPublished: Joi.boolean().default(true),
  order: Joi.number().integer().min(0).default(0)
});

const updateFAQSchema = Joi.object({
  question: Joi.string().min(10).max(300).optional(),
  answer: Joi.string().min(20).max(2000).optional(),
  category: Joi.string().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  isPublished: Joi.boolean().optional(),
  order: Joi.number().integer().min(0).optional()
});

const createKnowledgeBaseSchema = Joi.object({
  title: Joi.string().min(5).max(200).required(),
  content: Joi.string().min(50).required(),
  category: Joi.string().required(),
  tags: Joi.array().items(Joi.string()).optional(),
  isPublished: Joi.boolean().default(true),
  authorId: Joi.string().required(),
  order: Joi.number().integer().min(0).default(0)
});

const updateKnowledgeBaseSchema = Joi.object({
  title: Joi.string().min(5).max(200).optional(),
  content: Joi.string().min(50).optional(),
  category: Joi.string().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  isPublished: Joi.boolean().optional(),
  order: Joi.number().integer().min(0).optional()
});

// SUPPORT TICKETS

// Create new support ticket
exports.createTicket = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const validation = validateInput(body, createTicketSchema);
    if (!validation.isValid) {
      return responseHelper.error(400, 'Validation failed', validation.errors);
    }

    const ticketId = uuidv4();
    const timestamp = new Date().toISOString();
    const ticketNumber = `TK${Date.now().toString().slice(-6)}`;

    const ticket = {
      ticketId,
      ticketNumber,
      ...body,
      status: 'open',
      messages: [{
        messageId: uuidv4(),
        message: body.description,
        sentBy: body.userId,
        sentAt: timestamp,
        isInternal: false
      }],
      createdAt: timestamp,
      updatedAt: timestamp,
      lastMessageAt: timestamp
    };

    await dynamodb.send(new PutCommand({
      TableName: process.env.SUPPORT_TICKETS_TABLE,
      Item: ticket
    }));

    // Send confirmation email to user
    await sendTicketConfirmationEmail(ticket);

    return responseHelper.success(201, ticket, 'Support ticket created successfully');
  } catch (error) {
    console.error('Error creating support ticket:', error);
    return responseHelper.error(500, 'Internal server error');
  }
};

// Get ticket by ID
exports.getTicket = async (event) => {
  try {
    const { ticketId } = event.pathParameters;

    const result = await dynamodb.send(new GetCommand({
      TableName: process.env.SUPPORT_TICKETS_TABLE,
      Key: { ticketId }
    }));

    if (!result.Item) {
      return responseHelper.error(404, 'Support ticket not found');
    }

    return responseHelper.success(200, result.Item);
  } catch (error) {
    console.error('Error fetching support ticket:', error);
    return responseHelper.error(500, 'Internal server error');
  }
};

// Update ticket
exports.updateTicket = async (event) => {
  try {
    const { ticketId } = event.pathParameters;
    const body = JSON.parse(event.body);
    const validation = validateInput(body, updateTicketSchema);
    
    if (!validation.isValid) {
      return responseHelper.error(400, 'Validation failed', validation.errors);
    }

    // Check if ticket exists
    const existingTicket = await dynamodb.send(new GetCommand({
      TableName: process.env.SUPPORT_TICKETS_TABLE,
      Key: { ticketId }
    }));

    if (!existingTicket.Item) {
      return responseHelper.error(404, 'Support ticket not found');
    }

    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    // Build update expression
    Object.entries(body).forEach(([key, value]) => {
      updateExpressions.push(`#${key} = :${key}`);
      expressionAttributeNames[`#${key}`] = key;
      expressionAttributeValues[`:${key}`] = value;
    });

    updateExpressions.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const result = await dynamodb.send(new UpdateCommand({
      TableName: process.env.SUPPORT_TICKETS_TABLE,
      Key: { ticketId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    }));

    // Send status update email if status changed
    if (body.status && body.status !== existingTicket.Item.status) {
      await sendTicketStatusUpdateEmail(result.Attributes);
    }

    return responseHelper.success(200, result.Attributes, 'Support ticket updated successfully');
  } catch (error) {
    console.error('Error updating support ticket:', error);
    return responseHelper.error(500, 'Internal server error');
  }
};

// List tickets with filters
exports.listTickets = async (event) => {
  try {
    const {
      status,
      category,
      priority,
      userType,
      userId,
      assignedTo,
      startDate,
      endDate,
      limit = 50,
      lastEvaluatedKey
    } = event.queryStringParameters || {};

    let params = {
      TableName: process.env.SUPPORT_TICKETS_TABLE,
      Limit: parseInt(limit)
    };

    // Add filters
    const filterExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    if (status) {
      filterExpressions.push('#status = :status');
      expressionAttributeNames['#status'] = 'status';
      expressionAttributeValues[':status'] = status;
    }

    if (category) {
      filterExpressions.push('category = :category');
      expressionAttributeValues[':category'] = category;
    }

    if (priority) {
      filterExpressions.push('priority = :priority');
      expressionAttributeValues[':priority'] = priority;
    }

    if (userType) {
      filterExpressions.push('userType = :userType');
      expressionAttributeValues[':userType'] = userType;
    }

    if (userId) {
      filterExpressions.push('userId = :userId');
      expressionAttributeValues[':userId'] = userId;
    }

    if (assignedTo) {
      filterExpressions.push('assignedTo = :assignedTo');
      expressionAttributeValues[':assignedTo'] = assignedTo;
    }

    if (startDate && endDate) {
      filterExpressions.push('createdAt BETWEEN :startDate AND :endDate');
      expressionAttributeValues[':startDate'] = startDate;
      expressionAttributeValues[':endDate'] = endDate;
    }

    if (filterExpressions.length > 0) {
      params.FilterExpression = filterExpressions.join(' AND ');
      if (Object.keys(expressionAttributeNames).length > 0) {
        params.ExpressionAttributeNames = expressionAttributeNames;
      }
      params.ExpressionAttributeValues = expressionAttributeValues;
    }

    if (lastEvaluatedKey) {
      params.ExclusiveStartKey = JSON.parse(decodeURIComponent(lastEvaluatedKey));
    }

    const result = await dynamodb.send(new ScanCommand(params));

    return responseHelper.success(200, {
      tickets: result.Items,
      lastEvaluatedKey: result.LastEvaluatedKey ? encodeURIComponent(JSON.stringify(result.LastEvaluatedKey)) : null,
      count: result.Items.length
    });
  } catch (error) {
    console.error('Error listing support tickets:', error);
    return responseHelper.error(500, 'Internal server error');
  }
};

// Add message to ticket
exports.addMessage = async (event) => {
  try {
    const { ticketId } = event.pathParameters;
    const body = JSON.parse(event.body);
    const validation = validateInput(body, addMessageSchema);
    
    if (!validation.isValid) {
      return responseHelper.error(400, 'Validation failed', validation.errors);
    }

    // Check if ticket exists
    const existingTicket = await dynamodb.send(new GetCommand({
      TableName: process.env.SUPPORT_TICKETS_TABLE,
      Key: { ticketId }
    }));

    if (!existingTicket.Item) {
      return responseHelper.error(404, 'Support ticket not found');
    }

    const messageId = uuidv4();
    const timestamp = new Date().toISOString();
    const userId = event.requestContext?.authorizer?.userId || 'system';

    const newMessage = {
      messageId,
      message: body.message,
      sentBy: userId,
      sentAt: timestamp,
      isInternal: body.isInternal || false,
      attachments: body.attachments || []
    };

    // Add message to ticket
    const result = await dynamodb.send(new UpdateCommand({
      TableName: process.env.SUPPORT_TICKETS_TABLE,
      Key: { ticketId },
      UpdateExpression: 'SET messages = list_append(messages, :newMessage), lastMessageAt = :timestamp, updatedAt = :timestamp',
      ExpressionAttributeValues: {
        ':newMessage': [newMessage],
        ':timestamp': timestamp
      },
      ReturnValues: 'ALL_NEW'
    }));

    // Send notification email if not internal message
    if (!body.isInternal) {
      await sendTicketMessageNotificationEmail(result.Attributes, newMessage);
    }

    return responseHelper.success(200, result.Attributes, 'Message added successfully');
  } catch (error) {
    console.error('Error adding message to ticket:', error);
    return responseHelper.error(500, 'Internal server error');
  }
};

// FAQ MANAGEMENT

// Create FAQ
exports.createFAQ = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const validation = validateInput(body, createFAQSchema);
    if (!validation.isValid) {
      return responseHelper.error(400, 'Validation failed', validation.errors);
    }

    const faqId = uuidv4();
    const timestamp = new Date().toISOString();

    const faq = {
      faqId,
      ...body,
      createdAt: timestamp,
      updatedAt: timestamp,
      createdBy: event.requestContext?.authorizer?.userId || 'system'
    };

    await dynamodb.send(new PutCommand({
      TableName: process.env.FAQS_TABLE,
      Item: faq
    }));

    return responseHelper.success(201, faq, 'FAQ created successfully');
  } catch (error) {
    console.error('Error creating FAQ:', error);
    return responseHelper.error(500, 'Internal server error');
  }
};

// Get FAQ by ID
exports.getFAQ = async (event) => {
  try {
    const { faqId } = event.pathParameters;

    const result = await dynamodb.send(new GetCommand({
      TableName: process.env.FAQS_TABLE,
      Key: { faqId }
    }));

    if (!result.Item) {
      return responseHelper.error(404, 'FAQ not found');
    }

    return responseHelper.success(200, result.Item);
  } catch (error) {
    console.error('Error fetching FAQ:', error);
    return responseHelper.error(500, 'Internal server error');
  }
};

// Update FAQ
exports.updateFAQ = async (event) => {
  try {
    const { faqId } = event.pathParameters;
    const body = JSON.parse(event.body);
    const validation = validateInput(body, updateFAQSchema);
    
    if (!validation.isValid) {
      return responseHelper.error(400, 'Validation failed', validation.errors);
    }

    // Check if FAQ exists
    const existingFAQ = await dynamodb.send(new GetCommand({
      TableName: process.env.FAQS_TABLE,
      Key: { faqId }
    }));

    if (!existingFAQ.Item) {
      return responseHelper.error(404, 'FAQ not found');
    }

    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    // Build update expression
    Object.entries(body).forEach(([key, value]) => {
      updateExpressions.push(`#${key} = :${key}`);
      expressionAttributeNames[`#${key}`] = key;
      expressionAttributeValues[`:${key}`] = value;
    });

    updateExpressions.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const result = await dynamodb.send(new UpdateCommand({
      TableName: process.env.FAQS_TABLE,
      Key: { faqId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    }));

    return responseHelper.success(200, result.Attributes, 'FAQ updated successfully');
  } catch (error) {
    console.error('Error updating FAQ:', error);
    return responseHelper.error(500, 'Internal server error');
  }
};

// Delete FAQ
exports.deleteFAQ = async (event) => {
  try {
    const { faqId } = event.pathParameters;

    // Check if FAQ exists
    const existingFAQ = await dynamodb.send(new GetCommand({
      TableName: process.env.FAQS_TABLE,
      Key: { faqId }
    }));

    if (!existingFAQ.Item) {
      return responseHelper.error(404, 'FAQ not found');
    }

    await dynamodb.send(new DeleteCommand({
      TableName: process.env.FAQS_TABLE,
      Key: { faqId }
    }));

    return responseHelper.success(200, null, 'FAQ deleted successfully');
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    return responseHelper.error(500, 'Internal server error');
  }
};

// List FAQs
exports.listFAQs = async (event) => {
  try {
    const {
      category,
      isPublished,
      limit = 50,
      lastEvaluatedKey
    } = event.queryStringParameters || {};

    let params = {
      TableName: process.env.FAQS_TABLE,
      Limit: parseInt(limit)
    };

    // Add filters
    const filterExpressions = [];
    const expressionAttributeValues = {};

    if (category) {
      filterExpressions.push('category = :category');
      expressionAttributeValues[':category'] = category;
    }

    if (isPublished !== undefined) {
      filterExpressions.push('isPublished = :isPublished');
      expressionAttributeValues[':isPublished'] = isPublished === 'true';
    }

    if (filterExpressions.length > 0) {
      params.FilterExpression = filterExpressions.join(' AND ');
      params.ExpressionAttributeValues = expressionAttributeValues;
    }

    if (lastEvaluatedKey) {
      params.ExclusiveStartKey = JSON.parse(decodeURIComponent(lastEvaluatedKey));
    }

    const result = await dynamodb.send(new ScanCommand(params));

    // Sort by order and creation date
    const sortedItems = result.Items.sort((a, b) => {
      if (a.order !== b.order) {
        return a.order - b.order;
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return responseHelper.success(200, {
      faqs: sortedItems,
      lastEvaluatedKey: result.LastEvaluatedKey ? encodeURIComponent(JSON.stringify(result.LastEvaluatedKey)) : null,
      count: result.Items.length
    });
  } catch (error) {
    console.error('Error listing FAQs:', error);
    return responseHelper.error(500, 'Internal server error');
  }
};

// KNOWLEDGE BASE MANAGEMENT

// Create knowledge base article
exports.createKnowledgeBase = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const validation = validateInput(body, createKnowledgeBaseSchema);
    if (!validation.isValid) {
      return responseHelper.error(400, 'Validation failed', validation.errors);
    }

    const articleId = uuidv4();
    const timestamp = new Date().toISOString();

    const article = {
      articleId,
      ...body,
      views: 0,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    await dynamodb.send(new PutCommand({
      TableName: process.env.KNOWLEDGE_BASE_TABLE,
      Item: article
    }));

    return responseHelper.success(201, article, 'Knowledge base article created successfully');
  } catch (error) {
    console.error('Error creating knowledge base article:', error);
    return responseHelper.error(500, 'Internal server error');
  }
};

// Get knowledge base article by ID
exports.getKnowledgeBase = async (event) => {
  try {
    const { articleId } = event.pathParameters;

    const result = await dynamodb.send(new GetCommand({
      TableName: process.env.KNOWLEDGE_BASE_TABLE,
      Key: { articleId }
    }));

    if (!result.Item) {
      return responseHelper.error(404, 'Knowledge base article not found');
    }

    // Increment view count
    await dynamodb.send(new UpdateCommand({
      TableName: process.env.KNOWLEDGE_BASE_TABLE,
      Key: { articleId },
      UpdateExpression: 'SET views = views + :increment',
      ExpressionAttributeValues: {
        ':increment': 1
      }
    }));

    result.Item.views = (result.Item.views || 0) + 1;

    return responseHelper.success(200, result.Item);
  } catch (error) {
    console.error('Error fetching knowledge base article:', error);
    return responseHelper.error(500, 'Internal server error');
  }
};

// Update knowledge base article
exports.updateKnowledgeBase = async (event) => {
  try {
    const { articleId } = event.pathParameters;
    const body = JSON.parse(event.body);
    const validation = validateInput(body, updateKnowledgeBaseSchema);
    
    if (!validation.isValid) {
      return responseHelper.error(400, 'Validation failed', validation.errors);
    }

    // Check if article exists
    const existingArticle = await dynamodb.send(new GetCommand({
      TableName: process.env.KNOWLEDGE_BASE_TABLE,
      Key: { articleId }
    }));

    if (!existingArticle.Item) {
      return responseHelper.error(404, 'Knowledge base article not found');
    }

    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    // Build update expression
    Object.entries(body).forEach(([key, value]) => {
      updateExpressions.push(`#${key} = :${key}`);
      expressionAttributeNames[`#${key}`] = key;
      expressionAttributeValues[`:${key}`] = value;
    });

    updateExpressions.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const result = await dynamodb.send(new UpdateCommand({
      TableName: process.env.KNOWLEDGE_BASE_TABLE,
      Key: { articleId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    }));

    return responseHelper.success(200, result.Attributes, 'Knowledge base article updated successfully');
  } catch (error) {
    console.error('Error updating knowledge base article:', error);
    return responseHelper.error(500, 'Internal server error');
  }
};

// Delete knowledge base article
exports.deleteKnowledgeBase = async (event) => {
  try {
    const { articleId } = event.pathParameters;

    // Check if article exists
    const existingArticle = await dynamodb.send(new GetCommand({
      TableName: process.env.KNOWLEDGE_BASE_TABLE,
      Key: { articleId }
    }));

    if (!existingArticle.Item) {
      return responseHelper.error(404, 'Knowledge base article not found');
    }

    await dynamodb.send(new DeleteCommand({
      TableName: process.env.KNOWLEDGE_BASE_TABLE,
      Key: { articleId }
    }));

    return responseHelper.success(200, null, 'Knowledge base article deleted successfully');
  } catch (error) {
    console.error('Error deleting knowledge base article:', error);
    return responseHelper.error(500, 'Internal server error');
  }
};

// List knowledge base articles
exports.listKnowledgeBase = async (event) => {
  try {
    const {
      category,
      isPublished,
      authorId,
      limit = 50,
      lastEvaluatedKey
    } = event.queryStringParameters || {};

    let params = {
      TableName: process.env.KNOWLEDGE_BASE_TABLE,
      Limit: parseInt(limit)
    };

    // Add filters
    const filterExpressions = [];
    const expressionAttributeValues = {};

    if (category) {
      filterExpressions.push('category = :category');
      expressionAttributeValues[':category'] = category;
    }

    if (isPublished !== undefined) {
      filterExpressions.push('isPublished = :isPublished');
      expressionAttributeValues[':isPublished'] = isPublished === 'true';
    }

    if (authorId) {
      filterExpressions.push('authorId = :authorId');
      expressionAttributeValues[':authorId'] = authorId;
    }

    if (filterExpressions.length > 0) {
      params.FilterExpression = filterExpressions.join(' AND ');
      params.ExpressionAttributeValues = expressionAttributeValues;
    }

    if (lastEvaluatedKey) {
      params.ExclusiveStartKey = JSON.parse(decodeURIComponent(lastEvaluatedKey));
    }

    const result = await dynamodb.send(new ScanCommand(params));

    // Sort by order and creation date
    const sortedItems = result.Items.sort((a, b) => {
      if (a.order !== b.order) {
        return a.order - b.order;
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return responseHelper.success(200, {
      articles: sortedItems,
      lastEvaluatedKey: result.LastEvaluatedKey ? encodeURIComponent(JSON.stringify(result.LastEvaluatedKey)) : null,
      count: result.Items.length
    });
  } catch (error) {
    console.error('Error listing knowledge base articles:', error);
    return responseHelper.error(500, 'Internal server error');
  }
};

// Helper functions for email notifications
async function sendTicketConfirmationEmail(ticket) {
  const template = `
    <h2>Support Ticket Created</h2>
    <p>Your support ticket has been created successfully.</p>
    <p><strong>Ticket Number:</strong> ${ticket.ticketNumber}</p>
    <p><strong>Subject:</strong> ${ticket.subject}</p>
    <p><strong>Status:</strong> ${ticket.status}</p>
    <p>We'll get back to you as soon as possible.</p>
  `;
  
  // Implementation would depend on how you get user email
  // await sendEmail(userEmail, 'Support Ticket Created', template);
}

async function sendTicketStatusUpdateEmail(ticket) {
  const template = `
    <h2>Support Ticket Update</h2>
    <p>Your support ticket status has been updated.</p>
    <p><strong>Ticket Number:</strong> ${ticket.ticketNumber}</p>
    <p><strong>New Status:</strong> ${ticket.status}</p>
    ${ticket.resolution ? `<p><strong>Resolution:</strong> ${ticket.resolution}</p>` : ''}
  `;
  
  // Implementation would depend on how you get user email
  // await sendEmail(userEmail, 'Support Ticket Update', template);
}

async function sendTicketMessageNotificationEmail(ticket, message) {
  const template = `
    <h2>New Message on Support Ticket</h2>
    <p>A new message has been added to your support ticket.</p>
    <p><strong>Ticket Number:</strong> ${ticket.ticketNumber}</p>
    <p><strong>Message:</strong> ${message.message}</p>
  `;
  
  // Implementation would depend on how you get user email
  // await sendEmail(userEmail, 'New Message on Support Ticket', template);
}
