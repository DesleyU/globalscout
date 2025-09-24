/**
 * Media Service for GlobalScout
 * Handles file uploads, processing, and CDN distribution
 */

const { s3Helper } = require('../config/s3');
const cloudFrontHelper = require('../config/cloudfront');
const sharp = require('sharp'); // For image processing
const ffmpeg = require('fluent-ffmpeg'); // For video processing

class MediaService {
    constructor() {
        this.allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        this.allowedVideoTypes = ['video/mp4', 'video/mov', 'video/avi'];
    }
    
    // Process and upload avatar
    async uploadAvatar(file, userId) {
        try {
            // Resize image for avatar
            const processedBuffer = await sharp(file.buffer)
                .resize(200, 200, { fit: 'cover' })
                .jpeg({ quality: 90 })
                .toBuffer();
            
            const fileName = `avatars/${userId}-${Date.now()}.jpg`;
            
            // Upload to S3
            const uploadResult = await this.uploadToS3(processedBuffer, fileName, 'image/jpeg');
            
            return {
                url: cloudFrontHelper.getCDNUrl(fileName),
                key: fileName,
                size: processedBuffer.length
            };
        } catch (error) {
            console.error('Avatar upload error:', error);
            throw new Error('Failed to upload avatar');
        }
    }
    
    // Process and upload video
    async uploadVideo(file, userId) {
        try {
            // Basic video validation
            if (!this.allowedVideoTypes.includes(file.mimetype)) {
                throw new Error('Invalid video format');
            }
            
            const fileName = `videos/${userId}-${Date.now()}.mp4`;
            
            // Upload original video
            const uploadResult = await this.uploadToS3(file.buffer, fileName, file.mimetype);
            
            // TODO: Add video compression/transcoding here
            
            return {
                url: cloudFrontHelper.getCDNUrl(fileName),
                key: fileName,
                size: file.size,
                duration: null // TODO: Extract video duration
            };
        } catch (error) {
            console.error('Video upload error:', error);
            throw new Error('Failed to upload video');
        }
    }
    
    // Upload file to S3
    async uploadToS3(buffer, key, contentType) {
        const AWS = require('aws-sdk');
        const s3 = new AWS.S3();
        
        const params = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: key,
            Body: buffer,
            ContentType: contentType,
            ACL: 'public-read'
        };
        
        return await s3.upload(params).promise();
    }
    
    // Delete media file
    async deleteMedia(fileKey) {
        try {
            // Delete from S3
            const deleted = await s3Helper.deleteFile(fileKey);
            
            if (deleted) {
                // Invalidate CDN cache
                await cloudFrontHelper.invalidateCache([fileKey]);
            }
            
            return deleted;
        } catch (error) {
            console.error('Media deletion error:', error);
            return false;
        }
    }
    
    // Get optimized image URL
    getOptimizedImageUrl(fileKey, width = null, height = null) {
        let url = cloudFrontHelper.getCDNUrl(fileKey);
        
        // Add image optimization parameters if supported
        if (width || height) {
            const params = new URLSearchParams();
            if (width) params.append('w', width);
            if (height) params.append('h', height);
            url += `?${params.toString()}`;
        }
        
        return url;
    }
}

module.exports = new MediaService();