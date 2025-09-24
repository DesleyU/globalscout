/**
 * CloudFront CDN Configuration
 * Handles CDN distribution for static assets
 */

const cloudFrontHelper = {
    // Get CDN URL for file
    getCDNUrl: (fileKey) => {
        const cdnDomain = process.env.CLOUDFRONT_DOMAIN;
        if (cdnDomain) {
            return `https://${cdnDomain}/${fileKey}`;
        }
        // Fallback to S3 direct URL
        return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;
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
                        Items: paths.map(path => `/${path}`)
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

module.exports = cloudFrontHelper;