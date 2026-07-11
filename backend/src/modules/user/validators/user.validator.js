const { body, param, query } = require('express-validator');
const { ALL_ROLES } = require('../../../shared/constants/roles');

const registerValidation = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('phone').optional().trim(),
  body('department').optional().trim(),
];

const updateProfileValidation = [
  body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
  body('phone').optional().trim(),
  body('department').optional().trim(),
];

const updateUserValidation = [
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
  body('phone').optional().trim(),
  body('role').optional().isIn(ALL_ROLES).withMessage('Invalid role'),
  body('department').optional().trim(),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
];

const userIdValidation = [
  param('id').isMongoId().withMessage('Invalid user ID'),
];

const listUsersValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('role').optional().isIn(ALL_ROLES).withMessage('Invalid role'),
  query('isActive').optional().isIn(['true', 'false']).withMessage('isActive must be true or false'),
  query('search').optional().trim(),
];

module.exports = {
  registerValidation,
  updateProfileValidation,
  updateUserValidation,
  userIdValidation,
  listUsersValidation,
};
