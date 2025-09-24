#!/bin/bash

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
echo "4. Configure custom domain for CloudFront (optional)"