import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

/**
 * Connect to MongoDB
 * @param {string} uri - MongoDB connection string
 */
export const connectDatabase = async (uri) => {
  try {
    await mongoose.connect(uri);
    logger.info('✅ MongoDB connected successfully');
  } catch (error) {
    logger.error('❌ MongoDB connection failed', { error: error.message });
    process.exit(1);
  }
};

/**
 * Disconnect from MongoDB
 */
export const disconnectDatabase = async () => {
  try {
    await mongoose.disconnect();
    logger.info('✅ MongoDB disconnected');
  } catch (error) {
    logger.error('❌ MongoDB disconnection failed', { error: error.message });
  }
};

export default { connectDatabase, disconnectDatabase };
