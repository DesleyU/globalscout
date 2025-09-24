#!/usr/bin/env node

/**
 * CDN Setup Script for GlobalScout
 * Configures Content Delivery Network for media files
 */

const fs = require('fs');
const path = require('path');

console.log('🌐 CDN Setup for GlobalScout Media Files');
console.log('========================================');

// Create AWS S3 configuration
function createS3Config() {
    console.log('\n☁️  Creating AWS S3 configuration...');
    
    const s3Config = `/**
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
            const fileName = \`\${Date.now()}-\${Math.round(Math.random() * 1E9)}\${fileExtension}\`;
            
            // Organize files by type
            let folder = 'misc';
            if (file.fieldname === 'avatar') {
                folder = 'avatars';
            } else if (file.fieldname === 'video') {
                folder = 'videos';
            } else if (file.mimetype.startsWith('image/')) {
                folder = 'images';
            }
            
            cb(null, \`\${folder}/\${fileName}\`);
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
        return \`https://\${process.env.AWS_S3_BUCKET}.s3.\${process.env.AWS_REGION}.amazonaws.com/\${fileKey}\`;
    }
};

module.exports = {
    s3,
    s3Upload,
    s3Helper
};`;

    fs.writeFileSync('backend/src/config/s3.js', s3Config);
    console.log('✅ S3 configuration created: backend/src/config/s3.js');
}

// Create CloudFront configuration
function createCloudFrontConfig() {
    console.log('\n⚡ Creating CloudFront CDN configuration...');
    
    const cloudFrontConfig = `/**
 * CloudFront CDN Configuration
 * Handles CDN distribution for static assets
 */

const cloudFrontHelper = {
    // Get CDN URL for file
    getCDNUrl: (fileKey) => {
        const cdnDomain = process.env.CLOUDFRONT_DOMAIN;
        if (cdnDomain) {
            return \`https://\${cdnDomain}/\${fileKey}\`;
        }
        // Fallback to S3 direct URL
        return \`https://\${process.env.AWS_S3_BUCKET}.s3.\${process.env.AWS_REGION}.amazonaws.com/\${fileKey}\`;
    },
    
    // Invalidate CDN cache
    invalidateCache: async (paths) => {
        if (!process.env.CLOUDFRONT_DISTRIBUTION_ID) {
            console.log('CloudFront distribution ID not configured');
            return false;
        }
        
        const AWS = require('aws-sdk');
        const cloudfront = new AWS.CloudFront();
        
        try {
            const params = {
                DistributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID,
                InvalidationBatch: {
                    CallerReference: Date.now().toString(),
                    Paths: {
                        Quantity: paths.length,
                        Items: paths.map(path => \`/\${path}\`)
                    }
                }
            };
            
            const result = await cloudfront.createInvalidation(params).promise();
            console.log('CloudFront invalidation created:', result.Invalidation.Id);
            return true;
        } catch (error) {
            console.error('CloudFront invalidation error:', error);
            return false;
        }
    }
};

module.exports = cloudFrontHelper;`;

    fs.writeFileSync('backend/src/config/cloudfront.js', cloudFrontConfig);
    console.log('✅ CloudFront configuration created: backend/src/config/cloudfront.js');
}

// Create media service
function createMediaService() {
    console.log('\n📁 Creating media service...');
    
    const mediaService = `/**
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
            
            const fileName = \`avatars/\${userId}-\${Date.now()}.jpg\`;
            
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
            
            const fileName = \`videos/\${userId}-\${Date.now()}.mp4\`;
            
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
            url += \`?\${params.toString()}\`;
        }
        
        return url;
    }
}

module.exports = new MediaService();`;

    fs.writeFileSync('backend/src/services/mediaService.js', mediaService);
    console.log('✅ Media service created: backend/src/services/mediaService.js');
}

// Create CDN deployment script
function createCDNDeploymentScript() {
    console.log('\n🚀 Creating CDN deployment script...');
    
    const deployScript = `#!/bin/bash

# CDN Deployment Script for GlobalScout
# Sets up AWS S3 and CloudFront for media files

echo "🌐 Setting up CDN for GlobalScout"
echo "================================"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first:"
    echo "   https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Please run:"
    echo "   aws configure"
    exit 1
fi

echo "✅ AWS CLI is configured"

# Get configuration
read -p "🪣 Enter S3 bucket name (e.g., globalscout-media): " BUCKET_NAME
read -p "🌍 Enter AWS region (e.g., eu-west-1): " AWS_REGION

if [ -z "$BUCKET_NAME" ] || [ -z "$AWS_REGION" ]; then
    echo "❌ Bucket name and region are required"
    exit 1
fi

# Create S3 bucket
echo "🪣 Creating S3 bucket: $BUCKET_NAME"
aws s3 mb s3://$BUCKET_NAME --region $AWS_REGION

if [ $? -eq 0 ]; then
    echo "✅ S3 bucket created successfully"
else
    echo "⚠️  Bucket might already exist or there was an error"
fi

# Configure bucket for public access
echo "🔧 Configuring bucket policy..."
cat > bucket-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
        }
    ]
}
EOF

aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy file://bucket-policy.json
rm bucket-policy.json

# Enable CORS
echo "🌐 Configuring CORS..."
cat > cors-config.json << EOF
{
    "CORSRules": [
        {
            "AllowedHeaders": ["*"],
            "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
            "AllowedOrigins": ["*"],
            "ExposeHeaders": ["ETag"],
            "MaxAgeSeconds": 3000
        }
    ]
}
EOF

aws s3api put-bucket-cors --bucket $BUCKET_NAME --cors-configuration file://cors-config.json
rm cors-config.json

# Create CloudFront distribution
echo "⚡ Creating CloudFront distribution..."
cat > cloudfront-config.json << EOF
{
    "CallerReference": "globalscout-$(date +%s)",
    "Comment": "GlobalScout Media CDN",
    "DefaultCacheBehavior": {
        "TargetOriginId": "$BUCKET_NAME-origin",
        "ViewerProtocolPolicy": "redirect-to-https",
        "TrustedSigners": {
            "Enabled": false,
            "Quantity": 0
        },
        "ForwardedValues": {
            "QueryString": true,
            "Cookies": {
                "Forward": "none"
            }
        },
        "MinTTL": 0,
        "DefaultTTL": 86400,
        "MaxTTL": 31536000
    },
    "Origins": {
        "Quantity": 1,
        "Items": [
            {
                "Id": "$BUCKET_NAME-origin",
                "DomainName": "$BUCKET_NAME.s3.$AWS_REGION.amazonaws.com",
                "S3OriginConfig": {
                    "OriginAccessIdentity": ""
                }
            }
        ]
    },
    "Enabled": true,
    "PriceClass": "PriceClass_100"
}
EOF

DISTRIBUTION_ID=$(aws cloudfront create-distribution --distribution-config file://cloudfront-config.json --query 'Distribution.Id' --output text)
rm cloudfront-config.json

if [ "$DISTRIBUTION_ID" != "None" ]; then
    echo "✅ CloudFront distribution created: $DISTRIBUTION_ID"
    
    # Get distribution domain
    DOMAIN_NAME=$(aws cloudfront get-distribution --id $DISTRIBUTION_ID --query 'Distribution.DomainName' --output text)
    echo "🌐 CDN Domain: $DOMAIN_NAME"
    
    echo ""
    echo "📝 Add these to your .env file:"
    echo "AWS_S3_BUCKET=$BUCKET_NAME"
    echo "AWS_REGION=$AWS_REGION"
    echo "CLOUDFRONT_DISTRIBUTION_ID=$DISTRIBUTION_ID"
    echo "CLOUDFRONT_DOMAIN=$DOMAIN_NAME"
    
else
    echo "❌ Failed to create CloudFront distribution"
fi

echo ""
echo "🎉 CDN setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Update your .env file with the values above"
echo "2. Install required packages: npm install aws-sdk sharp fluent-ffmpeg"
echo "3. Test file upload functionality"
echo "4. Configure custom domain for CloudFront (optional)"`;

    fs.writeFileSync('setup-cdn.sh', deployScript);
    fs.chmodSync('setup-cdn.sh', '755');
    console.log('✅ CDN deployment script created: setup-cdn.sh');
}

// Main CDN setup function
function setupCDN() {
    console.log('\n🚀 Starting CDN setup...');
    
    // Create backend config directory if it doesn't exist
    if (!fs.existsSync('backend/src/config')) {
        fs.mkdirSync('backend/src/config', { recursive: true });
    }
    
    createS3Config();
    createCloudFrontConfig();
    createMediaService();
    createCDNDeploymentScript();
    
    console.log('\n🎉 CDN setup files created!');
    console.log('\n📋 Next Steps:');
    console.log('1. ☁️  Set up AWS account and configure AWS CLI');
    console.log('2. 🚀 Run ./setup-cdn.sh to create S3 bucket and CloudFront');
    console.log('3. 📦 Install required packages:');
    console.log('   cd backend && npm install aws-sdk sharp fluent-ffmpeg multer-s3');
    console.log('4. 🔧 Update your .env with AWS credentials and bucket info');
    console.log('5. 🧪 Test file upload functionality');
    
    console.log('\n📚 Created Files:');
    console.log('- backend/src/config/s3.js: S3 upload configuration');
    console.log('- backend/src/config/cloudfront.js: CloudFront CDN helper');
    console.log('- backend/src/services/mediaService.js: Media processing service');
    console.log('- setup-cdn.sh: Automated CDN deployment script');
    
    console.log('\n💰 Cost Optimization:');
    console.log('- S3: Pay for storage and requests');
    console.log('- CloudFront: Free tier includes 1TB transfer/month');
    console.log('- Consider S3 lifecycle policies for old files');
}

// Run the CDN setup
setupCDN();