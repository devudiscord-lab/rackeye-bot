import User from '../models/User.js';
import Log from '../models/Log.js';
import { logger } from '../utils/logger.js';

/**
 * Warn a user
 * @param {string} userId - User to warn
 * @param {string} staffId - Staff member ID
 * @param {string} reason - Warning reason
 * @returns {object} Updated user
 */
export const warnUser = async (userId, staffId, reason) => {
  try {
    const user = await User.findOneAndUpdate(
      { userId },
      { $inc: { warnings: 1 } },
      { new: true, upsert: true }
    );

    // Log action
    await Log.create({
      type: 'moderation',
      action: 'warn',
      userId,
      staffId,
      reason,
      details: { warningCount: user.warnings },
      severity: 'warning',
    });

    logger.info('User warned', { userId, staffId, reason });
    return user;
  } catch (error) {
    logger.error('Failed to warn user', { error: error.message });
    throw error;
  }
};

/**
 * Record a ban
 * @param {string} userId - User to ban
 * @param {string} staffId - Staff member ID
 * @param {string} reason - Ban reason
 * @returns {Log} Log entry
 */
export const recordBan = async (userId, staffId, reason) => {
  try {
    const log = await Log.create({
      type: 'moderation',
      action: 'ban',
      userId,
      staffId,
      reason,
      severity: 'critical',
    });

    await User.findOneAndUpdate(
      { userId },
      { status: 'suspended' },
      { upsert: true }
    );

    logger.warn('User banned', { userId, staffId, reason });
    return log;
  } catch (error) {
    logger.error('Failed to record ban', { error: error.message });
    throw error;
  }
};

/**
 * Record a kick
 * @param {string} userId - User to kick
 * @param {string} staffId - Staff member ID
 * @param {string} reason - Kick reason
 * @returns {Log} Log entry
 */
export const recordKick = async (userId, staffId, reason) => {
  try {
    const log = await Log.create({
      type: 'moderation',
      action: 'kick',
      userId,
      staffId,
      reason,
      severity: 'warning',
    });

    logger.warn('User kicked', { userId, staffId, reason });
    return log;
  } catch (error) {
    logger.error('Failed to record kick', { error: error.message });
    throw error;
  }
};

/**
 * Get moderation logs for user
 * @param {string} userId - User ID
 * @returns {Array} Moderation logs
 */
export const getUserLogs = async (userId) => {
  try {
    const logs = await Log.find({
      userId,
      type: 'moderation',
    }).sort({ createdAt: -1 });

    return logs;
  } catch (error) {
    logger.error('Failed to fetch user logs', { error: error.message });
    throw error;
  }
};

export default {
  warnUser,
  recordBan,
  recordKick,
  getUserLogs,
};
