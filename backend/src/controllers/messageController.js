const prisma = require('../config/database');

const sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiverId, content } = req.body;

    // Validate input
    if (!receiverId || !content) {
      return res.status(400).json({ error: 'Receiver ID and content are required' });
    }

    if (content.trim().length === 0) {
      return res.status(400).json({ error: 'Message content cannot be empty' });
    }

    if (content.length > 1000) {
      return res.status(400).json({ error: 'Message content too long (max 1000 characters)' });
    }

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

    // Check if trying to message self
    if (senderId === receiverId) {
      return res.status(400).json({ error: 'Cannot send message to yourself' });
    }

    // Check if users are connected (optional - you might want to allow messaging without connection)
    const connection = await prisma.connection.findFirst({
      where: {
        OR: [
          { senderId: senderId, receiverId: receiverId, status: 'ACCEPTED' },
          { senderId: receiverId, receiverId: senderId, status: 'ACCEPTED' }
        ]
      }
    });

    if (!connection) {
      return res.status(403).json({ error: 'You must be connected to send messages' });
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        content: content.trim()
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true
              }
            }
          }
        },
        receiver: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      message: 'Message sent successfully',
      data: message
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { otherUserId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    // Check if other user exists
    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId }
    });

    if (!otherUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get messages between the two users
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    });

    // Mark messages as read if they were sent to the current user
    await prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: userId,
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    res.json({
      messages: messages.reverse(), // Reverse to show oldest first
      pagination: {
        page,
        limit,
        hasMore: messages.length === limit
      }
    });

  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all conversations (latest message with each user)
    const rawConversations = await prisma.$queryRaw`
      SELECT 
        m.*,
        CASE 
          WHEN m.senderId = ${userId} THEN m.receiverId 
          ELSE m.senderId 
        END as otherUserId,
        u.email as otherUserEmail,
        p.firstName as otherUserFirstName,
        p.lastName as otherUserLastName,
        p.avatar as otherUserAvatar,
        (SELECT COUNT(*) FROM messages 
         WHERE senderId = CASE WHEN m.senderId = ${userId} THEN m.receiverId ELSE m.senderId END
         AND receiverId = ${userId} 
         AND isRead = false) as unreadCount
      FROM messages m
      INNER JOIN (
        SELECT 
          CASE 
            WHEN senderId = ${userId} THEN receiverId 
            ELSE senderId 
          END as otherUserId,
          MAX(createdAt) as latestMessageTime
        FROM messages 
        WHERE senderId = ${userId} OR receiverId = ${userId}
        GROUP BY otherUserId
      ) latest ON (
        (m.senderId = ${userId} AND m.receiverId = latest.otherUserId) OR
        (m.receiverId = ${userId} AND m.senderId = latest.otherUserId)
      ) AND m.createdAt = latest.latestMessageTime
      INNER JOIN users u ON u.id = latest.otherUserId
      LEFT JOIN profiles p ON p.userId = u.id
      ORDER BY m.createdAt DESC
    `;

    // Transform the raw data to match frontend expectations
    const conversations = rawConversations.map(conv => ({
      id: conv.otherUserId, // Use otherUserId as conversation ID
      lastMessage: {
        id: conv.id,
        content: conv.content,
        senderId: conv.senderId,
        receiverId: conv.receiverId,
        createdAt: conv.createdAt,
        isRead: conv.isRead
      },
      otherUser: {
        id: conv.otherUserId,
        email: conv.otherUserEmail,
        profile: {
          firstName: conv.otherUserFirstName,
          lastName: conv.otherUserLastName,
          profilePicture: conv.otherUserAvatar
        }
      },
      unreadCount: Number(conv.unreadCount)
    }));

    res.json({ conversations });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { otherUserId } = req.params;

    await prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: userId,
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    res.json({ message: 'Messages marked as read' });

  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  sendMessage,
  getConversation,
  getConversations,
  markAsRead
};