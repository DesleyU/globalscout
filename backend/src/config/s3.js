/**
 * AWS S3 Configuration for GlobalScout
 * Handles file uploads to S3 bucket
 */

const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');

// Configure AWS
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'eu-west-1'
});

const s3 = new AWS.S3();

// S3 Upload Configuration
const s3Upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.AWS_S3_BUCKET,
        acl: 'public-read',
        metadata: function (req, file, cb) {
            cb(null, {
                fieldName: file.fieldname,
                uploadedBy: req.user?.id || 'anonymous',
                uploadedAt: new Date().toISOString()
            });
        },
        key: function (req, file, cb) {
            const fileExtension = path.extname(file.originalname);
            const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExtension}`;
            
            // Organize files by type
            let folder = 'misc';
            if (file.fieldname === 'avatar') {
                folder = 'avatars';
            } else if (file.fieldname === 'video') {
                folder = 'videos';
            } else if (file.mimetype.startsWith('image/')) {
                folder = 'images';
            }
            
            cb(null, `${folder}/${fileName}`);
        }
    }),
    limits: {
        fileSize: 500 * 1024 * 1024 // 500MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allowed file types
        const allowedTypes = [
            'image/jpeg',
            'image/jpg', 
            'image/png',
            'image/gif',
            'video/mp4',
            'video/mov',
            'video/avi'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'), false);
        }
    }
});

// Helper functions
const s3Helper = {
    // Upload single file
    uploadSingle: (fieldName) => s3Upload.single(fieldName),
    
    // Upload multiple files
    uploadMultiple: (fieldName, maxCount = 5) => s3Upload.array(fieldName, maxCount),
    
    // Delete file from S3
    deleteFile: async (fileKey) => {
        try {
            await s3.deleteObject({
                Bucket: process.env.AWS_S3_BUCKET,
                Key: fileKey
            }).promise();
            return true;
        } catch (error) {
            console.error('S3 delete error:', error);
            return false;
        }
    },
    
    // Get signed URL for private files
    getSignedUrl: (fileKey, expires = 3600) => {
        return s3.getSignedUrl('getObject', {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: fileKey,
            Expires: expires
        });
    },
    
    // Get public URL
    getPublicUrl: (fileKey) => {
        return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;
    }
};

module.exports = {
    s3,
    s3Upload,
    s3Helper
};