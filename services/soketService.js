const { Server } = require('socket.io')
const User = require('../models/user.model');
const Message = require('../models/messages');
const { connect } = require('mongoose');

const onlineUsers = new Map();

const typingUser = new Map();

const initializeSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL,
            credentials: true,
            methods: ['GET', 'POST', 'DELETE', 'OPTIONS']
        },
        pingTimeout: 60000
    });

    io.on('connection', (socket) => {
        console.log(`User Connected : ${socket.id}`);
        let userId = null;

        socket.on("user_connected", async (connectingUserId) => {
            try {
                userId = String(connectingUserId);
                socket.data.userId = userId;

                onlineUsers.set(userId, socket.id);
                socket.join(userId);

                await User.findByIdAndUpdate(userId, {
                    isOnline: true,
                    lastSeen: new Date(),
                });

                io.emit("user_status", {
                    userId,
                    isOnline: true,
                });
            } catch (error) {
                console.error("Error registering user:", error);
            }

        });
        socket.on('get_user_status', (requestedUserId, callback) => {
            const isOnline = onlineUsers.has(requestedUserId);
            callback({
                userId: requestedUserId,
                isOnline,
                lastSeen: isOnline ? new Date() : null,
            })
        })
        socket.on('send_message', async (message) => {
            try {
                const receiverSocketId = onlineUsers.get(
                    String(message.receiver?._id)
                );
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("receive_message", message)
                }
            }
            catch (error) {
                console.error(e);
                socket.emit("message_error", { error: 'failed to send mesage' })
            }
        })
        socket.on("message_read", async ({ messageIds, senderId }) => {
            try {
                await Message.updateMany(
                    { _id: { $in: messageIds } },
                    { $set: { messageStatus: "read" } }
                )
                const senderSocketId = onlineUsers.get(senderId);
                if (senderSocketId) {
                    messageIds.forEach((messageid) => {
                        io.to(senderSocketId).emit("message_status_update", {
                            messageid,
                            messageStatus: "read"
                        })
                    });
                }
            } catch (error) {
                console.error("error updating message read status", error)
            }
        })
        socket.on("typing_start", ({ conversationId, receiverId }) => {
            if (!userId || !conversationId || !receiverId) return;
            if (!typingUser.has(userId)) typingUser.set(userId, {});
            const userTyping = typingUser.get(userId);

            userTyping[conversationId] = true;
            if (userTyping[`${conversationId}_timeout`]) {
                clearTimeout(userTyping[`${conversationId}_timeout`])
            }
            userTyping[`${conversationId}_timeout`] = setTimeout(() => {
                userTyping[conversationId] = false;
                socket.to(receiverId).emit("user_typing", {
                    userId,
                    conversationId,
                    isTyping: false
                })
            }, 3000)

            socket.to(receiverId).emit("user_typing", {
                userId,
                conversationId,
                isTyping: true
            })
        })
        socket.on("typing_stop", ({ conversationId, receiverId }) => {
            if (!userId || !conversationId || !receiverId) return;
            if (typingUser.has(userId)) {
                const userTyping = typingUser.get(userId);
                userTyping[conversationId] = false;

                if (userTyping[`${conversationId}_timeout`]) {
                    clearTimeout(userTyping[`${conversationId}_timeout`]);
                    delete userTyping[`${conversationId}_timeout`]
                }
            }
            socket.to(receiverId).emit("user_typing", {
                userId,
                conversationId,
                isTyping: false
            })
        })
        socket.on(
            "add_reaction",
            async ({ messageId, emoji, userId }) => {
                try {
                    const message = await Message.findById(messageId);

                    if (!message) return;

                    const existingIndex = message.reactions.findIndex(
                        (r) => r.user?.toString() === userId?.toString()
                    );

                    if (existingIndex > -1) {

                        const existing = message.reactions[existingIndex];

                        // Same emoji → remove reaction
                        if (existing.emoji === emoji) {
                            message.reactions.splice(existingIndex, 1);
                        }

                        // Different emoji → change reaction
                        else {
                            message.reactions[existingIndex].emoji = emoji;
                        }

                    } else {

                        // First reaction from this user
                        message.reactions.push({
                            user: userId,
                            emoji
                        });

                    }

                    await message.save();

                    const populatedMessage = await Message.findById(message._id)
                        .populate("sender", "username profilePicture")
                        .populate("receiver", "username profilePicture")
                        .populate(
                            "reactions.user",
                            "username profilePicture"
                        );

                    const reactionUpdated = {
                        messageId: message._id,
                        reactions: populatedMessage.reactions
                    };

                    const senderSocket = onlineUsers.get(
                        populatedMessage.sender._id.toString()
                    );

                    const receiverSocket = onlineUsers.get(
                        populatedMessage.receiver._id.toString()
                    );

                    if (senderSocket) {
                        io.to(senderSocket).emit(
                            "reaction_update",
                            reactionUpdated
                        );
                    }

                    if (receiverSocket) {
                        io.to(receiverSocket).emit(
                            "reaction_update",
                            reactionUpdated
                        );
                    }

                } catch (error) {
                    console.error("Error handling reaction:", error);
                }
            }
        );
        const handleDisconnected = async () => {
            if (!userId) return;

            try {
                // Ignore disconnects from an old socket
                if (onlineUsers.get(userId) !== socket.id) {
                    return;
                }

                onlineUsers.delete(userId);

                if (typingUser.has(userId)) {
                    const userTyping = typingUser.get(userId);

                    Object.keys(userTyping).forEach((key) => {
                        if (key.endsWith("_timeout")) {
                            clearTimeout(userTyping[key]);
                        }
                    });

                    typingUser.delete(userId);
                }

                const lastSeen = new Date();

                await User.findByIdAndUpdate(userId, {
                    isOnline: false,
                    lastSeen,
                });

                io.emit("user_status", {
                    userId,
                    isOnline: false,
                    lastSeen,
                });

                socket.leave(userId);
                console.log(`User ${userId} disconnected`);
            } catch (error) {
                console.error("Error handling disconnection:", error);
            }

        };
        socket.on('disconnect', handleDisconnected)
    })
    io.socketUserMap = onlineUsers;
    return io;
}

module.exports = initializeSocket