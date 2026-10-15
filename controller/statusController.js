
const { uploadToCloudinary } = require('../config/cloudinaryConfig');
const Status = require('../models/status');
const response = require('../utils/responseHandler');

// Create a new status
exports.createStatus = async (req, res) => {
    try {
        const { content } = req.body;
        const file = req.file;
        const userId = String(req.user.userId);

        let mediaUrl = null;
        let finalContentType = null;

        if (file) {
            if (
                !file.mimetype.startsWith('image/') &&
                !file.mimetype.startsWith('video/')
            ) {
                return response(res, 400, 'Unsupported file type');
            }

            const uploadFile = await uploadToCloudinary(file);

            if (!uploadFile?.secure_url) {
                return response(res, 400, 'Failed to upload file');
            }

            mediaUrl = uploadFile.secure_url;

            if (file.mimetype.startsWith('image/')) {
                finalContentType = 'image';
            } else {
                finalContentType = 'video';
            }
        } else if (content?.trim()) {
            finalContentType = 'text';
        } else {
            return response(res, 400, 'Status content is required');
        }

        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const newStatus = new Status({
            user: userId,
            content: mediaUrl || content.trim(),
            contentType: finalContentType,
            expiresAt
        });

        await newStatus.save();

        const populatedStatus = await Status.findById(newStatus._id)
            .populate('user', 'username profilePicture')
            .populate('viewers', 'username profilePicture');

        // Notify all connected users except the creator.
        if (req.io && req.socketUserMap) {
            for (const connectedUserId of req.socketUserMap.keys()) {
                const recipientId = String(connectedUserId);

                if (recipientId === userId) continue;

                req.io.to(recipientId).emit(
                    'new_status',
                    populatedStatus
                );
            }
        }

        return response(
            res,
            200,
            'Status created successfully',
            populatedStatus
        );
    } catch (error) {
        console.error('createStatus error:', error);
        return response(res, 500, 'Server error', error.message);
    }
};


// Get all unexpired statuses
exports.getStatus = async (req, res) => {
    try {
        const statuses = await Status.find({
            expiresAt: { $gt: new Date() }
        })
            .populate('user', 'username profilePicture')
            .populate('viewers', 'username profilePicture')
            .sort({ createdAt: -1 });

        return response(
            res,
            200,
            'Status retrieved successfully',
            statuses
        );
    } catch (error) {
        console.error('getStatus error:', error);
        return response(res, 500, 'Server error', error.message);
    }
};


// Mark a status as viewed
exports.viewStatus = async (req, res) => {
    const { statusId } = req.params;
    const userId = String(req.user.userId);

    try {
        const status = await Status.findOne({
            _id: statusId,
            expiresAt: { $gt: new Date() }
        });

        if (!status) {
            return response(res, 404, 'Status not found or expired');
        }

        const alreadyViewed = status.viewers.some(
            viewerId => String(viewerId) === userId
        );

        if (!alreadyViewed) {
            status.viewers.push(userId);
            await status.save();
        }

        const updatedStatus = await Status.findById(statusId)
            .populate('user', 'username profilePicture')
            .populate('viewers', 'username profilePicture');

        if (req.io && req.socketUserMap) {
            const ownerId = String(status.user);

            // Notify the status owner through their user-ID room.
            if (req.socketUserMap.has(ownerId) && !alreadyViewed) {
                req.io.to(ownerId).emit('status_viewed', {
                    statusId: String(status._id),
                    viewerId: userId,
                    totalViewers: updatedStatus.viewers.length,
                    viewers: updatedStatus.viewers
                });
            }
        }

        return response(
            res,
            200,
            'Status viewed successfully',
            updatedStatus
        );
    } catch (error) {
        console.error('viewStatus error:', error);
        return response(res, 500, 'Server error', error.message);
    }
};


// Delete a status
exports.deleteStatus = async (req, res) => {
    const { statusId } = req.params;
    const userId = String(req.user.userId);

    try {
        const status = await Status.findById(statusId);

        if (!status) {
            return response(res, 404, 'Status not found');
        }

        if (String(status.user) !== userId) {
            return response(
                res,
                403,
                'You are not authorized to delete this status'
            );
        }

        await status.deleteOne();

        // Notify all connected users except the creator.
        if (req.io && req.socketUserMap) {
            for (const connectedUserId of req.socketUserMap.keys()) {
                const recipientId = String(connectedUserId);

                if (recipientId === userId) continue;

                req.io.to(recipientId).emit(
                    'status_deleted',
                    String(statusId)
                );
            }
        }

        return response(
            res,
            200,
            'Status deleted successfully'
        );
    } catch (error) {
        console.error('deleteStatus error:', error);
        return response(res, 500, 'Server error', error.message);
    }
};
