import Ticket from '../models/Ticket.js';
import Log from '../models/Log.js';
import { logger } from '../utils/logger.js';

/**
 * Create a new ticket
 * @param {object} ticketData - Ticket data
 * @returns {object} Created ticket
 */
export const createTicket = async (ticketData) => {
  try {
    const ticket = new Ticket({
      ticketId: `TKT-${Date.now()}`,
      userId: ticketData.userId,
      category: ticketData.category,
      title: ticketData.title,
      description: ticketData.description,
      channelId: ticketData.channelId,
    });

    await ticket.save();

    await Log.create({
      type: 'ticket',
      action: 'ticket_created',
      userId: ticketData.userId,
      details: { ticketId: ticket.ticketId, category: ticketData.category },
      severity: 'info',
    });

    logger.info('Ticket created', { ticketId: ticket.ticketId });
    return ticket;
  } catch (error) {
    logger.error('Failed to create ticket', { error: error.message });
    throw error;
  }
};

/**
 * Add message to ticket
 * @param {string} ticketId - Ticket ID
 * @param {string} userId - User ID
 * @param {string} content - Message content
 * @returns {object} Updated ticket
 */
export const addMessage = async (ticketId, userId, content) => {
  try {
    const ticket = await Ticket.findOneAndUpdate(
      { ticketId },
      {
        $push: {
          messages: {
            userId,
            content,
            timestamp: new Date(),
          },
        },
      },
      { new: true }
    );

    logger.info('Message added to ticket', { ticketId });
    return ticket;
  } catch (error) {
    logger.error('Failed to add message to ticket', { error: error.message });
    throw error;
  }
};

/**
 * Close ticket
 * @param {string} ticketId - Ticket ID
 * @returns {object} Updated ticket
 */
export const closeTicket = async (ticketId) => {
  try {
    const ticket = await Ticket.findOneAndUpdate(
      { ticketId },
      { status: 'closed', closedAt: new Date() },
      { new: true }
    );

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    // Generate transcript
    const transcript = ticket.messages
      .map(m => `[${m.timestamp}] ${m.userId}: ${m.content}`)
      .join('\n');

    await Ticket.updateOne({ ticketId }, { transcript });

    await Log.create({
      type: 'ticket',
      action: 'ticket_closed',
      userId: ticket.userId,
      details: { ticketId },
      severity: 'info',
    });

    logger.info('Ticket closed', { ticketId });
    return ticket;
  } catch (error) {
    logger.error('Failed to close ticket', { error: error.message });
    throw error;
  }
};

/**
 * Get user tickets
 * @param {string} userId - User ID
 * @returns {Array} User tickets
 */
export const getUserTickets = async (userId) => {
  try {
    const tickets = await Ticket.find({ userId }).sort({ createdAt: -1 });
    return tickets;
  } catch (error) {
    logger.error('Failed to fetch user tickets', { error: error.message });
    throw error;
  }
};

export default {
  createTicket,
  addMessage,
  closeTicket,
  getUserTickets,
};
