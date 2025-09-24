const Joi = require('joi');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }
    next();
  };
};

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('PLAYER', 'CLUB', 'SCOUT_AGENT').required(),
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  position: Joi.string().valid('GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'FORWARD').when('role', {
    is: 'PLAYER',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  age: Joi.number().min(16).max(50).when('role', {
    is: 'PLAYER',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  clubName: Joi.string().min(2).max(100).when('role', {
    is: 'CLUB',
    then: Joi.required(),
    otherwise: Joi.optional()
  })
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const profileUpdateSchema = Joi.object({
  firstName: Joi.string().min(2).max(50),
  lastName: Joi.string().min(2).max(50),
  bio: Joi.string().max(500),
  position: Joi.string().valid('GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'FORWARD'),
  age: Joi.number().min(16).max(50),
  height: Joi.number().min(150).max(220),
  weight: Joi.number().min(50).max(150),
  nationality: Joi.string().max(50),
  clubName: Joi.string().max(100),
  phone: Joi.string().max(20),
  website: Joi.string().uri(),
  country: Joi.string().max(50),
  city: Joi.string().max(50),
  instagram: Joi.string().max(100),
  twitter: Joi.string().max(100),
  linkedin: Joi.string().max(100),
  playerId: Joi.alternatives().try(
    Joi.number().integer().positive(),
    Joi.string().allow('', null)
  ).optional()
});

const connectionSchema = Joi.object({
  receiverId: Joi.string().required(),
  message: Joi.string().max(500).optional()
});

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  profileUpdateSchema,
  connectionSchema
};