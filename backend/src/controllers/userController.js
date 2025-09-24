const prisma = require('../config/database');
const SubscriptionService = require('../services/subscriptionService');

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      accountType: user.accountType,
      playerId: user.playerId,
      profile: user.profile,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;

    // Separate user fields from profile fields
    const { playerId, ...profileData } = updateData;

    // Update user table if playerId is provided
    if (playerId !== undefined) {
      const finalPlayerId = playerId === '' ? null : parseInt(playerId);
      
      // Check if playerId is already in use by another user (only if not null)
      if (finalPlayerId !== null) {
        const existingUser = await prisma.user.findFirst({
          where: {
            playerId: finalPlayerId,
            id: { not: userId } // Exclude current user
          }
        });

        if (existingUser) {
          return res.status(400).json({ 
            error: 'This player ID is already associated with another account' 
          });
        }
      }

      await prisma.user.update({
        where: { id: userId },
        data: { 
          playerId: finalPlayerId
        }
      });
    }

    // Update profile table with remaining data
    if (Object.keys(profileData).length > 0) {
      await prisma.profile.update({
        where: { userId },
        data: profileData
      });
    }

    // Fetch the complete user data including role and playerId
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true
      }
    });

    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      accountType: user.accountType,
      playerId: user.playerId,
      profile: user.profile,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const searchUsers = async (req, res) => {
  try {
    const { 
      role, 
      position, 
      club, 
      country, 
      city, 
      minAge, 
      maxAge, 
      search, 
      page = 1, 
      limit = 20 
    } = req.query;

    const skip = (page - 1) * limit;
    const take = parseInt(limit);

    // Build where clause
    const where = {
      status: 'ACTIVE',
      NOT: {
        id: req.user.id // Exclude current user
      }
    };

    if (role) {
      where.role = role;
    }

    // Profile filters
    const profileWhere = {};
    
    if (position) {
      profileWhere.position = position;
    }
    
    if (club) {
      profileWhere.clubName = {
        contains: club
      };
    }
    
    if (country) {
      profileWhere.country = {
        contains: country
      };
    }
    
    if (city) {
      profileWhere.city = {
        contains: city
      };
    }
    
    if (minAge || maxAge) {
      profileWhere.age = {};
      if (minAge) profileWhere.age.gte = parseInt(minAge);
      if (maxAge) profileWhere.age.lte = parseInt(maxAge);
    }
    
    if (search) {
      profileWhere.OR = [
        {
          firstName: {
            contains: search
          }
        },
        {
          lastName: {
            contains: search
          }
        },
        {
          clubName: {
            contains: search
          }
        }
      ];
    }

    if (Object.keys(profileWhere).length > 0) {
      where.profile = profileWhere;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          profile: true
        },
        skip,
        take,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.user.count({ where })
    ]);

    // Remove sensitive data
    const sanitizedUsers = users.map(user => ({
      id: user.id,
      role: user.role,
      accountType: user.accountType,
      profile: user.profile
    }));

    res.json({
      users: sanitizedUsers,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        pages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const viewerId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { 
        id,
        status: 'ACTIVE'
      },
      include: {
        profile: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Track profile visitor (only if viewing someone else's profile)
    if (viewerId !== id) {
      try {
        await prisma.profileVisitor.upsert({
          where: {
            profileId_visitorId: {
              profileId: id,
              visitorId: viewerId
            }
          },
          update: {
            createdAt: new Date() // Update visit time
          },
          create: {
            profileId: id,
            visitorId: viewerId,
            visitorType: req.user.role
          }
        });
      } catch (visitorError) {
        console.error('Error tracking visitor:', visitorError);
        // Don't fail the request if visitor tracking fails
      }
    }

    // Get user's subscription tier to determine what profile data to show
    const userTier = await SubscriptionService.getUserTier(id);
    const limits = userTier === 'PREMIUM' ? 
      SubscriptionService.getPremiumLimits() : 
      SubscriptionService.getBasicLimits();

    // Filter profile data based on subscription tier
    let filteredProfile = user.profile;
    if (userTier === 'BASIC' && limits.profileFields !== 'all') {
      // For basic users, only show limited fields
      const allowedFields = limits.profileFields;
      filteredProfile = {};
      allowedFields.forEach(field => {
        if (user.profile && user.profile[field] !== undefined) {
          filteredProfile[field] = user.profile[field];
        }
      });
      // Always include basic info
      filteredProfile.id = user.profile?.id;
      filteredProfile.firstName = user.profile?.firstName;
      filteredProfile.lastName = user.profile?.lastName;
    }

    // Remove sensitive data
    const sanitizedUser = {
      id: user.id,
      role: user.role,
      accountType: user.accountType,
      profile: filteredProfile,
      subscriptionTier: userTier
    };

    res.json({ user: sanitizedUser });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getRecommendations = async (req, res) => {
  try {
    const currentUser = req.user;
    const limit = parseInt(req.query.limit) || 10;

    // Get users with similar roles or complementary roles
    let recommendationFilters = [];

    if (currentUser.role === 'PLAYER') {
      recommendationFilters = [
        { role: 'SCOUT_AGENT' },
        { role: 'CLUB' }
      ];
    } else if (currentUser.role === 'SCOUT_AGENT') {
      recommendationFilters = [
        { role: 'PLAYER' },
        { role: 'CLUB' }
      ];
    } else if (currentUser.role === 'CLUB') {
      recommendationFilters = [
        { role: 'PLAYER' },
        { role: 'SCOUT_AGENT' }
      ];
    }

    // Get existing connections to exclude
    const existingConnections = await prisma.connection.findMany({
      where: {
        OR: [
          { senderId: currentUser.id },
          { receiverId: currentUser.id }
        ]
      },
      select: {
        senderId: true,
        receiverId: true
      }
    });

    const connectedUserIds = existingConnections.flatMap(conn => 
      [conn.senderId, conn.receiverId]
    ).filter(id => id !== currentUser.id);

    const recommendations = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: recommendationFilters
          },
          {
            status: 'ACTIVE'
          },
          {
            NOT: {
              id: {
                in: [...connectedUserIds, currentUser.id]
              }
            }
          }
        ]
      },
      include: {
        profile: true
      },
      take: limit,
      orderBy: {
        createdAt: 'desc'
      }
    });

    const sanitizedRecommendations = recommendations.map(user => ({
      id: user.id,
      role: user.role,
      accountType: user.accountType,
      profile: user.profile
    }));

    res.json({ recommendations: sanitizedRecommendations });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user.id;
    const avatarPath = `/uploads/avatars/${req.file.filename}`;

    // Update user profile with new avatar path
    const updatedProfile = await prisma.profile.update({
      where: { userId },
      data: { avatar: avatarPath }
    });

    res.json({
      message: 'Avatar uploaded successfully',
      avatar: avatarPath,
      profile: updatedProfile
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getProfileVisitors = async (req, res) => {
  try {
    const userId = req.user.id;
    const userTier = await SubscriptionService.getUserTier(userId);
    const limits = await SubscriptionService.getUserLimits(userId);

    if (userTier === 'BASIC') {
      // Basic users only get visitor count by type
      const visitorStats = await prisma.profileVisitor.groupBy({
        by: ['visitorType'],
        where: {
          profileId: userId
        },
        _count: {
          visitorType: true
        }
      });

      const formattedStats = visitorStats.map(stat => ({
        type: stat.visitorType,
        count: stat._count.visitorType
      }));

      res.json({
        tier: 'BASIC',
        message: 'Upgrade to Premium to see detailed visitor information',
        stats: formattedStats,
        totalVisitors: formattedStats.reduce((sum, stat) => sum + stat.count, 0)
      });
    } else {
      // Premium users get detailed visitor information
      const visitors = await prisma.profileVisitor.findMany({
        where: {
          profileId: userId
        },
        include: {
          visitor: {
            include: {
              profile: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 50 // Limit to last 50 visitors
      });

      const visitorStats = await prisma.profileVisitor.groupBy({
        by: ['visitorType'],
        where: {
          profileId: userId
        },
        _count: {
          visitorType: true
        }
      });

      res.json({
        tier: 'PREMIUM',
        visitors: visitors.map(v => ({
          id: v.id,
          visitorType: v.visitorType,
          visitedAt: v.createdAt,
          visitor: {
            id: v.visitor.id,
            role: v.visitor.role,
            profile: {
              firstName: v.visitor.profile?.firstName,
              lastName: v.visitor.profile?.lastName,
              avatar: v.visitor.profile?.avatar,
              clubName: v.visitor.profile?.clubName
            }
          }
        })),
        stats: visitorStats.map(stat => ({
          type: stat.visitorType,
          count: stat._count.visitorType
        })),
        totalVisitors: visitors.length
      });
    }
  } catch (error) {
    console.error('Get profile visitors error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  searchUsers,
  getUserById,
  getRecommendations,
  uploadAvatar,
  getProfileVisitors
};