const Message = require('../models/Message');
const User = require('../models/User');

/**
 * Sends a system generated message to a user.
 * 
 * @param {object} req - The request object, used to access socket.io instance.
 * @param {string} receiverId - The ID of the user receiving the message.
 * @param {string} text - The message content.
 * @param {string|null} specificSenderId - Optional. If provided, used as sender. If null, finds the first admin.
 */
const sendSystemMessage = async (req, receiverId, text, specificSenderId = null) => {
    try {
        let senderId = specificSenderId;

        // If no specific sender provided, use AdminBot
        if (!senderId) {
            let botUser = await User.findOne({ email: 'bot@aadhavmadhav.com' });

            if (!botUser) {
                // Create Bot User if doesn't exist
                try {
                    botUser = await User.create({
                        name: 'AdminBot',
                        email: 'bot@aadhavmadhav.com',
                        password: 'botpasswordsecure123!@#',
                        isAdmin: true,
                        isOnline: true // Bot is arguably always "online" for serving messages, or irrelevant
                    });
                } catch (createError) {
                    console.error('Error creating bot user:', createError);
                    // Fallback to any admin
                    const adminUser = await User.findOne({ isAdmin: true }).sort({ createdAt: 1 });
                    if (adminUser) senderId = adminUser._id;
                }
            }

            if (botUser) {
                senderId = botUser._id;
            }
        }

        const message = await Message.create({
            user: receiverId, // In the Message User context, 'user' is the one the message is associated with (usually the receiver in a 1-on-1 chat logic depending on schema?)
            // Wait, let's check Message schema.
            // user: { type: ObjectId, ref: 'User' } -> This usually means the "Chat ID" owner or the "Recipient" in some designs?
            // sender: { type: ObjectId, ref: 'User' }
            // In a simple system: Message.find({ user: userId }) might fetch all messages for a user, OR
            // Message.find({ $or: [{sender: userId, user: otherId}, {sender: otherId, user: userId}] })

            // Looking at userController: unreadMessageCount filter: { $eq: ['$$msg.sender', '$_id'] } (where $_id is user).
            // This suggests 'user' is the 'Owner' of the message thread? Or 'Receiver'?

            // Let's check getMessages in messageController if it exists, or typically:
            // Message.find({ $or: [ {sender: req.user._id, user: friendId}, {sender: friendId, user: req.user._id} ] })

            // In this app, it seems 'user' field in Message model typically refers to the CUSTOMER if it's a support chat.
            // Let's assuming 'user' is the Customer ID and 'sender' is the person who sent it.

            user: receiverId,
            sender: senderId,
            text: text,
            isRead: false
        });

        // Populate for socket emission - Populate BOTH sender and user to ensure consistent ID access on client
        const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'name isAdmin')
            .populate('user', 'name email');

        const io = req.app.get('io');
        if (io) {
            io.emit('newMessage', populatedMessage);
        }

        // Return message for logging if needed
        return populatedMessage;

    } catch (error) {
        console.error('Error sending system message:', error);
    }
};

module.exports = sendSystemMessage;
