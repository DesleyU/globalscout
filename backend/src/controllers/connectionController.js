const prisma = require('../config/database');
const SubscriptionService = require('../services/subscriptionService');

const sendConnectionRequest = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiverId, message } = req.body;

    // Check if receiver exists and is active
    const receiver = await prisma.user.findUnique({
      where: { 
        id: receiverId,
        status: 'ACTIVE'
      }
    });

    if (!receiver) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if trying to connect to self
    if (senderId === receiverId) {
      return res.status(400).json({ error: 'Cannot connect to yourself' });
    }

    // Check connection limits for basic users
    const senderTier = await SubscriptionService.getUserTier(senderId);
    if (senderTier === 'BASIC') {
      const limits = await SubscriptionService.getUserLimits(senderId);
      
      // Count current connections
      const currentConnections = await prisma.connection.count({
        where: {
          OR: [
            { senderId: senderId, status: 'ACCEPTED' },
            { receiverId: senderId, status: 'ACCEPTED' }
          ]
        }
      });

      if (currentConnections >= limits.maxConnections) {
        return res.status(403).json({ 
          error: 'Connection limit reached',
          message: `Basic users can have maximum ${limits.maxConnections} connections. Upgrade to Premium for unlimited connections.`,
          currentConnections,
          maxConnections: limits.maxConnections,
          tier: 'BASIC'
        });
      }
    }

    // Check if connection already exists
    const existingConnection = await prisma.connection.findUnique({
      where: {
        senderId_receiverId: {
          senderId,
          receiverId
        }
      }
    });

    if (existingConnection) {
      return res.status(400).json({ error: 'Connection request already exists' });
    }

    // Check reverse connection
    const reverseConnection = await prisma.connection.findUnique({
      where: {
        senderId_receiverId: {
          senderId: receiverId,
          receiverId: senderId
        }
      }
    });

    if (reverseConnection) {
      return res.status(400).json({ error: 'Connection already exists or pending' });
    }

    // Create connection request
    const connection = await prisma.connection.create({
      data: {
        senderId,
        receiverId,
        message,
        status: 'PENDING'
      },
      include: {
        sender: {
          include: { profile: true }
        },
        receiver: {
          include: { profile: true }
        }
      }
    });

    res.status(201).json({
      message: 'Connection request sent successfully',
      connection: {
        id: connection.id,
        status: connection.status,
        message: connection.message,
        createdAt: connection.createdAt,
        sender: {
          id: connection.sender.id,
          role: connection.sender.role,
          profile: connection.sender.profile
        },
        receiver: {
          id: connection.receiver.id,
          role: connection.receiver.role,
          profile: connection.receiver.profile
        }
      }
    });
  } catch (error) {
    console.error('Send connection error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const respondToConnection = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { action } = req.body; // 'accept' or 'reject'
    const userId = req.user.id;

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Use "accept" or "reject"' });
    }

    // Find the connection where current user is the receiver
    const connection = await prisma.connection.findFirst({
      where: {
        id: connectionId,
        receiverId: userId,
        status: 'PENDING'
      },
      include: {
        sender: {
          include: { profile: true }
        },
        receiver: {
          include: { profile: true }
        }
      }
    });

    if (!connection) {
      return res.status(404).json({ error: 'Connection request not found' });
    }

    // Update connection status
    const updatedConnection = await prisma.connection.update({
      where: { id: connectionId },
      data: {
        status: action === 'accept' ? 'ACCEPTED' : 'REJECTED'
      },
      include: {
        sender: {
          include: { profile: true }
        },
        receiver: {
          include: { profile: true }
        }
      }
    });

    res.json({
      message: `Connection ${action}ed successfully`,
      connection: {
        id: updatedConnection.id,
        status: updatedConnection.status,
        message: updatedConnection.message,
        createdAt: updatedConnection.createdAt,
        updatedAt: updatedConnection.updatedAt,
        sender: {
          id: updatedConnection.sender.id,
          role: updatedConnection.sender.role,
          profile: updatedConnection.sender.profile
        },
        receiver: {
          id: updatedConnection.receiver.id,
          role: updatedConnection.receiver.role,
          profile: updatedConnection.receiver.profile
        }
      }
    });
  } catch (error) {
    console.error('Respond to connection error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getConnections = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status = 'ACCEPTED', page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;
    const take = parseInt(limit);

    const [connections, total] = await Promise.all([
      prisma.connection.findMany({
        where: {
          OR: [
            { senderId: userId },
            { receiverId: userId }
          ],
          status: status.toUpperCase()
        },
        include: {
          sender: {
            include: { profile: true }
          },
          receiver: {
            include: { profile: true }
          }
        },
        skip,
        take,
        orderBy: {
          updatedAt: 'desc'
        }
      }),
      prisma.connection.count({
        where: {
          OR: [
            { senderId: userId },
            { receiverId: userId }
          ],
          status: status.toUpperCase()
        }
      })
    ]);

    // Format connections to show the other user
    const formattedConnections = connections.map(connection => {
      const otherUser = connection.senderId === userId ? connection.receiver : connection.sender;
      
      return {
        id: connection.id,
        status: connection.status,
        message: connection.message,
        createdAt: connection.createdAt,
        updatedAt: connection.updatedAt,
        user: {
          id: otherUser.id,
          role: otherUser.role,
          profile: otherUser.profile
        }
      };
    });

    res.json({
      connections: formattedConnections,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        pages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    console.error('Get connections error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getPendingRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type = 'received', page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;
    const take = parseInt(limit);

    let where;
    if (type === 'received') {
      where = {
        receiverId: userId,
        status: 'PENDING'
      };
    } else if (type === 'sent') {
      where = {
        senderId: userId,
        status: 'PENDING'
      };
    } else {
      return res.status(400).json({ error: 'Invalid type. Use "received" or "sent"' });
    }

    const [requests, total] = await Promise.all([
      prisma.connection.findMany({
        where,
        include: {
          sender: {
            include: { profile: true }
          },
          receiver: {
            include: { profile: true }
          }
        },
        skip,
        take,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.connection.count({ where })
    ]);

    const formattedRequests = requests.map(request => ({
      id: request.id,
      status: request.status,
      message: request.message,
      createdAt: request.createdAt,
      sender: {
        id: request.sender.id,
        role: request.sender.role,
        profile: request.sender.profile
      },
      receiver: {
        id: request.receiver.id,
        role: request.receiver.role,
        profile: request.receiver.profile
      }
    }));

    res.json({
      requests: formattedRequests,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        pages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  sendConnectionRequest,
  respondToConnection,
  getConnections,
  getPendingRequests
};