# AWS_INFRASTRUCTURE.md

# Global Scout AWS Infrastructure Setup

## Overview

This document describes the current production infrastructure setup for Global Scout.

The architecture is intentionally designed to be:
- production-grade
- AWS-native
- scalable over time
- inexpensive during the early stage
- compatible with future horizontal scaling

The current stack uses:
- AWS Route 53
- AWS CloudFront
- AWS Application Load Balancer (ALB)
- AWS Certificate Manager (ACM)
- EC2
- Docker Compose
- nginx reverse proxy inside the frontend/UI container
- private S3 media storage through presigned URLs

---

# High-Level Architecture

```text
Browser
  ↓ HTTPS
CloudFront (frontend CDN)
  ↓
Application Load Balancer (ALB)
  ↓
EC2 instance
  ↓
Docker Compose
  ├── ui (nginx reverse proxy + frontend SPA)
  ├── ASP.NET API
  ├── postgres
  └── migrator
```

Current media upload/read architecture:

```text
Browser
  ↓ HTTPS
API
  ↓ presigned S3 URL
Private S3 bucket
```

---

# Domains

Primary domain:

```text
globalscout.eu
```

Subdomains:

```text
www.globalscout.eu
api.globalscout.eu
media.globalscout.eu
```

---

# DNS / Route 53

DNS is fully managed in AWS Route 53.

The domain registrar delegates authority to the Route 53 hosted zone nameservers.

## Route 53 Hosted Zone

Hosted zone:

```text
globalscout.eu
```

## Current DNS Layout

### Frontend

| Record | Type | Target |
|---|---|---|
| globalscout.eu | A Alias | CloudFront distribution |
| www.globalscout.eu | A Alias | CloudFront distribution |

### API

| Record | Type | Target |
|---|---|---|
| api.globalscout.eu | A Alias | Application Load Balancer |

### Media (planned)

| Record | Type | Target |
|---|---|---|
| media.globalscout.eu | A Alias | Media CloudFront distribution |

---

# SSL / HTTPS

HTTPS is fully managed by AWS Certificate Manager (ACM).

No Let's Encrypt or Certbot is used.

## ACM Certificates

### CloudFront certificate

Region:

```text
us-east-1
```

Domains:

```text
globalscout.eu
*.globalscout.eu
```

IMPORTANT:
CloudFront requires certificates to exist in us-east-1.

This certificate is used for:
- globalscout.eu
- www.globalscout.eu
- future wildcard subdomains

### API certificate

Region:

```text
eu-central-1
```

Domain:

```text
api.globalscout.eu
```

This certificate is attached to the Application Load Balancer HTTPS listener.

---

# CloudFront

## Frontend Distribution

Purpose:
- frontend CDN
- HTTPS termination
- edge caching
- global acceleration

### Frontend CloudFront Flow

```text
Browser
  ↓ HTTPS
CloudFront
  ↓ HTTP
ALB
  ↓ HTTP
EC2/nginx
```

### Frontend CloudFront Configuration

Origin:
- Application Load Balancer

Alternate domain names:

```text
globalscout.eu
www.globalscout.eu
```

Viewer protocol policy:

```text
Redirect HTTP to HTTPS
```

Allowed methods:

```text
GET
HEAD
OPTIONS
```

IMPORTANT:
The frontend CloudFront distribution is intentionally restricted to read-only HTTP methods.

This prevents API POST/PUT/PATCH/DELETE requests from going through the frontend distribution.

API traffic must use:

```text
https://api.globalscout.eu/api
```

NOT:

```text
https://globalscout.eu/api
```

Default root object:

```text
index.html
```

Origin protocol:

```text
HTTP only
```

Reason:
The ALB origin certificate only covers api.globalscout.eu.

CloudFront therefore communicates with the ALB over HTTP internally.

The public browser connection remains HTTPS.

---

# Application Load Balancer (ALB)

Region:

```text
eu-central-1
```

Purpose:
- API HTTPS termination
- future scalability
- future multi-instance routing
- future health checks and deployments

## ALB Listeners

### HTTP listener

Port:

```text
80
```

Action:
- forward to target group

### HTTPS listener

Port:

```text
443
```

Certificate:

```text
api.globalscout.eu ACM certificate
```

Action:
- forward to target group

---

# Target Group

Target type:

```text
Instances
```

Protocol:

```text
HTTP
```

Port:

```text
80
```

Health check path:

```text
/
```

Targets:
- EC2 instance running the UI nginx container

---

# EC2 Instance

Current architecture uses a single EC2 instance.

## EC2 Purpose

The EC2 instance hosts:
- ui container (nginx + frontend static files)
- ASP.NET API container
- postgres container
- migrator container

via Docker Compose.

## Elastic IP

The EC2 instance uses an Elastic IP.

Reason:
- stable infrastructure endpoint
- survives restarts
- avoids changing public IPs

---

# nginx

nginx currently runs in the frontend/UI container and routes traffic by path.

Current architecture:

```text
/api/*     -> ASP.NET API
/uploads/* -> API/static files if present
/hubs/*    -> SignalR/WebSockets
/*         -> frontend SPA
```

Current nginx config:

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    client_max_body_size 500m;

    location /api/ {
        proxy_pass http://api:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads/ {
        proxy_pass http://api:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /hubs/ {
        proxy_pass http://api:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 3600s;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

# Frontend API Communication

IMPORTANT:
The frontend MUST NOT use relative API URLs like:

```text
/api/auth/login
```

because frontend traffic goes through the frontend CloudFront distribution, which only allows:

```text
GET
HEAD
OPTIONS
```

Instead, frontend code MUST use:

```text
https://api.globalscout.eu/api
```

through an environment variable.

Recommended frontend environment variable:

```text
VITE_API_BASE_URL=https://api.globalscout.eu/api
```

or:

```text
NEXT_PUBLIC_API_BASE_URL=https://api.globalscout.eu/api
```

depending on framework.

SignalR/WebSocket connections should also use:

```text
https://api.globalscout.eu/hubs/...
```

---

# CORS

The ASP.NET API must allow frontend origins:

```text
https://globalscout.eu
https://www.globalscout.eu
```

Recommended ASP.NET Core configuration:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy
            .WithOrigins(
                "https://globalscout.eu",
                "https://www.globalscout.eu")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

app.UseCors("Frontend");
```

---

# Security Groups

## ALB Security Group

Purpose:
- public web entry point

Inbound rules:

| Type | Port | Source |
|---|---|---|
| HTTP | 80 | 0.0.0.0/0 |
| HTTPS | 443 | 0.0.0.0/0 |

Outbound:
- allow all

---

## EC2 Security Group

Desired production configuration:

| Type | Port | Source |
|---|---|---|
| HTTP | 80 | ALB security group |
| SSH | 22 | trusted developer IPs only |

IMPORTANT:
EC2 should NOT expose port 80 publicly to the internet.

Traffic should flow:

```text
Internet
  ↓
CloudFront / ALB
  ↓
EC2
```

not:

```text
Internet
  ↓
EC2 directly
```

---

# Media Architecture

Current media architecture:

```text
Browser
→ API
→ presigned S3 upload/read URLs
→ private S3 bucket
```

The API stores media in S3 through the configured `ObjectStorage` provider. Browser uploads use presigned PUT URLs, and media reads use short-lived presigned GET URLs returned by the API.

Planned media delivery architecture:

```text
media.globalscout.eu
→ CloudFront
→ private S3 bucket
```

Media files should NOT be publicly accessible directly from S3.

Recommended approach:
- private S3 bucket
- CloudFront Origin Access Control (OAC)
- signed URLs if needed

Database stores:
- S3 object keys
- not local disk paths

---

# Deployment Strategy

Current deployment model:

```text
Single EC2 instance
+ Docker Compose
```

This is intentionally simple and cost-efficient initially.

The architecture is designed to later evolve toward:
- ECS/EKS
- multiple EC2 instances
- auto scaling
- blue/green deployments
- private subnets
- separate DB infrastructure

without changing the public DNS architecture.

---

# Important Operational Notes

## CloudFront propagation

CloudFront deployments can take:

```text
5-15 minutes
```

before becoming globally active.

---

## Route 53 propagation

Route 53 changes are usually fast but can still require:

```text
1-5 minutes
```

for propagation.

---

## HTTPS Ownership

HTTPS is terminated at:

### Frontend

```text
CloudFront
```

### API

```text
Application Load Balancer
```

nginx itself currently does NOT manage certificates.

---

# Future Improvements

Potential future infrastructure improvements:

- WAF
- CloudFront bot protection
- private VPC subnets
- managed RDS Postgres
- Redis ElastiCache
- ECS/Fargate
- CI/CD pipelines
- blue/green deployments
- origin shielding
- signed media URLs
- S3 multipart uploads
- autoscaling
- observability stack
- centralized logging
- distributed tracing

---

# Summary

Current production architecture:

```text
Frontend:
https://globalscout.eu
https://www.globalscout.eu
→ CloudFront
→ ALB
→ EC2/ui nginx
→ frontend SPA

API:
https://api.globalscout.eu
→ ALB
→ EC2/nginx
→ ASP.NET API

Media:
Browser
→ API
→ presigned S3 URLs
→ private S3 bucket

Future media:
https://media.globalscout.eu
→ CloudFront
→ private S3 bucket
```

This is now a legitimate production-grade AWS setup with:
- HTTPS everywhere
- AWS-managed certificates
- CDN acceleration
- proper DNS architecture
- scalable load balancing
- separation between frontend and API
- future-ready infrastructure

