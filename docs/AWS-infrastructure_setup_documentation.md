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
- Next.js standalone runtime in the UI container
- private S3 media storage through presigned URLs

---

# High-Level Architecture

```text
Browser (frontend)
  ↓ HTTPS
CloudFront (globalscout-frontend-prod)
  ↓ HTTP
Application Load Balancer (globalscout-api-alb)
  ↓
Target group globalscout-api-tg :80
  ↓
EC2 i-0bfca9e03bd554809 (Prod)
  ↓
nginx proxy container (:80)
  ├── Host: api.globalscout.eu → ASP.NET API (:8080)
  └── default → UI container / Next.js (:80)

Browser (API — api.globalscout.eu)
  ↓ HTTPS
ALB (no CloudFront)
  ↓
same target group :80 → nginx → ASP.NET API
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

Verified in Route 53 (hosted zone `globalscout.eu`, 7 records as of 2026-06).

### Frontend

| Record | Type | Alias | Target |
|---|---|---|---|
| globalscout.eu | A | Yes | `dxbo3oa5f8xms.cloudfront.net` |
| www.globalscout.eu | A | Yes | `dxbo3oa5f8xms.cloudfront.net` |

Both frontend hostnames share one CloudFront distribution. Browser traffic for the site does **not** hit the ALB directly; it goes through CloudFront first.

### API

| Record | Type | Alias | Target |
|---|---|---|---|
| api.globalscout.eu | A | Yes | `dualstack.globalscout-api-alb-129658763.eu-central-1.elb.amazonaws.com` |

The API subdomain bypasses CloudFront. Route 53 sends traffic straight to the API ALB (`globalscout-api-alb`) in `eu-central-1`.

### ACM validation (automatic)

| Record | Type | Purpose |
|---|---|---|
| `_60f4ad20b80ab81859bb8aeed92cf520.api.globalscout.eu` | CNAME | ACM certificate validation for `api.globalscout.eu` |
| `_3fa45278fa6c4f707a2ac9d734e7baec.globalscout.eu` | CNAME | ACM certificate validation for `globalscout.eu` |

These are managed by ACM during certificate issuance. Do not delete them while the certificates are in use.

### Media (planned)

| Record | Type | Target |
|---|---|---|
| media.globalscout.eu | A Alias | Media CloudFront distribution (not created yet) |

---

# SSL / HTTPS

HTTPS is fully managed by AWS Certificate Manager (ACM).

No Let's Encrypt or Certbot is used.

## ACM Certificates

### CloudFront certificate (verified in ACM, `us-east-1`)

CloudFront requires certificates in `us-east-1`. This certificate secures the frontend distribution; it is separate from the API ALB certificate in `eu-central-1`.

| Property | Value |
|---|---|
| Primary domain | `globalscout.eu` |
| Additional names | `*.globalscout.eu` (wildcard) |
| Status | Issued |
| In use | Yes |
| ARN | `arn:aws:acm:us-east-1:272436634689:certificate/143f54e0-f604-41f7-a2c3-69e07aa74dbe` |
| Type | Amazon issued (RSA 2048, SHA-256 with RSA) |
| Issued | May 13, 2024 |
| Not after | June 11, 2025 |
| Attached to | `globalscout-frontend-prod` CloudFront distribution (1 associated resource) |

Used on CloudFront as custom SSL certificate for:

```text
globalscout.eu
www.globalscout.eu
```

Security policy on the distribution: `TLSv1.2_2021`.

The wildcard SAN (`*.globalscout.eu`) would cover subdomains such as `api.globalscout.eu`, but production API HTTPS uses the dedicated `api.globalscout.eu` certificate on the ALB in `eu-central-1` instead.

ACM DNS validation CNAME (also in Route 53):

```text
_3fa45278fa6c4f707a2ac9d734e7baec.globalscout.eu
→ _af27c90394b137473f1d3a166383b78a.jkrkdzztzm.acm-validations.aws.
```

Confirm in ACM that the certificate is still valid and auto-renewed if the **Not after** date has passed.

`api.globalscout.eu` is **not** served by CloudFront; it uses Route 53 → ALB with the `eu-central-1` certificate below.

### API certificate (verified in ACM, `eu-central-1`)

| Property | Value |
|---|---|
| Domain | `api.globalscout.eu` |
| Status | Issued |
| In use | Yes |
| ARN | `arn:aws:acm:eu-central-1:272436634689:certificate/aa2b746f-c352-4481-8762-6ff166d59f54` |
| Type | Amazon issued (RSA 2048, SHA-256 with RSA) |
| Issued | May 17, 2024 |
| Not after | June 17, 2025 |
| Attached to | `globalscout-api-alb` (`arn:aws:elasticloadbalancing:eu-central-1:272436634689:loadbalancer/app/globalscout-api-alb/da87df5c195cbeef`) |

ACM DNS validation CNAME (also in Route 53):

```text
_60f4ad20b80ab81859bb8aeed92cf520.api.globalscout.eu
→ _fb59121ac9d75e340b3817ee0320f478.jkrdzztzm.acm-validations.aws.
```

Confirm in ACM that the certificate is still valid and auto-renewed if the **Not after** date has passed.

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
EC2/nginx proxy → ui container
```

### Frontend CloudFront Configuration

Distribution name (verified in CloudFront console):

```text
globalscout-frontend-prod
```

Distribution domain name (verified in Route 53):

```text
dxbo3oa5f8xms.cloudfront.net
```

Distribution ARN:

```text
arn:aws:cloudfront::272436634689:distribution/E2GAP0NMSM1QPI
```

Alternate domain names (verified on CloudFront **General** tab):

```text
globalscout.eu
www.globalscout.eu
```

`api.globalscout.eu` is intentionally **not** listed here; API traffic uses Route 53 → ALB directly.

Price class: all edge locations. Supported HTTP versions: HTTP/2, HTTP/1.1, HTTP/1.0.

Custom SSL certificate: `globalscout.eu` (ACM). Security policy: `TLSv1.2_2021`.

Standard logging and cookie logging: off.

Default root object: **(none)** — verified empty on General tab (older docs assumed `index.html`; Next.js serves `/` via the origin).

Viewer protocol policy:

```text
Redirect HTTP to HTTPS
```

Allowed methods:

```text
GET
HEAD
OPTIONS
POST
PUT
PATCH
DELETE
```

Cache only safe read methods at the edge. Non-GET methods are required so Next.js route handlers (sign-in, registration, onboarding, admin actions) on the frontend origin work.

The frontend distribution must NOT be used for .NET API traffic. Browser calls to the ASP.NET API must use:

```text
https://api.globalscout.eu/api
```

NOT:

```text
https://globalscout.eu/api
```

### Origins (verified)

| Property | Value |
|---|---|
| Origin name | `globalscout-api-alb-129658763.eu-central-1.elb.amazonaws.com-mp9xyv652vn` |
| Origin domain | `globalscout-api-alb-129658763.eu-central-1.elb.amazonaws.com` |
| Origin path | (none) |
| Origin type | Elastic Load Balancing |

The frontend CloudFront distribution uses the **same ALB** as `api.globalscout.eu`. There is one origin and no origin groups.

Origin protocol:

```text
HTTP only
```

Reason:
The ALB HTTPS certificate covers `api.globalscout.eu` only. CloudFront therefore communicates with the ALB over HTTP internally. The public browser connection remains HTTPS.

### Behaviors (verified)

| Property | Value |
|---|---|
| Default path pattern | `*` (default) |
| Origin | `globalscout-api-alb-129658763...` (same ALB) |
| Viewer protocol policy | Redirect HTTP to HTTPS |
| Cache policy | `Managed-CachingOptimized` |
| Origin request policy | `Managed-AllViewer` |
| Response headers policy | (none) |

`Managed-AllViewer` forwards viewer headers, cookies, and query strings to the origin. Non-GET methods must still reach the origin for Next.js route handlers; confirm allowed methods in the behavior if POST/PATCH requests fail at the edge.

---

# Application Load Balancer (ALB)

Region:

```text
eu-central-1
```

Verified API ALB (from Route 53 and EC2 console):

| Property | Value |
|---|---|
| Name | `globalscout-api-alb` |
| Type | Application |
| Scheme | Internet-facing |
| Status | Active |
| DNS name | `globalscout-api-alb-129658763.eu-central-1.elb.amazonaws.com` |
| Dualstack DNS | `dualstack.globalscout-api-alb-129658763.eu-central-1.elb.amazonaws.com` |
| VPC | `vpc-0cacbc70e1d184a88` |
| Availability zones | `eu-central-1a` (`subnet-0f36cebd5f24f3684`), `eu-central-1b` (`subnet-07d9ebeefffd8e426`) |
| Created | May 17, 2024 |

Purpose:
- Shared entry point for **both** `api.globalscout.eu` (direct DNS) and the frontend CloudFront origin
- HTTPS termination for `api.globalscout.eu`
- future scalability, health checks, and multi-instance routing

## ALB Listeners (verified)

Both listeners use a **single default rule** each (no host-header or path conditions). All ALB traffic forwards to the same target group.

### HTTP listener

| Property | Value |
|---|---|
| Port | `80` |
| Default action | Forward to `globalscout-api-tg` (100%) |
| Rules | 1 (default only) |

Does not redirect HTTP to HTTPS at the ALB. Clients that hit the ALB directly on port 80 are forwarded to the target group over HTTP.

### HTTPS listener

| Property | Value |
|---|---|
| Port | `443` |
| Default action | Forward to `globalscout-api-tg` (100%) |
| TLS policy | `ELBSecurityPolicy-TLS13-1-2-...` |
| Certificate | `api.globalscout.eu` (ACM) |
| mTLS | Off |
| Rules | 1 (default only) |

---

# Target Groups

## `globalscout-api-tg` (verified)

| Property | Value |
|---|---|
| ARN | `arn:aws:elasticloadbalancing:eu-central-1:272436634689:targetgroup/globalscout-api-tg/18d0c470c5bc8f9c` |
| Target type | Instance |
| Protocol : Port | HTTP : `80` |
| Protocol version | HTTP1 |
| Load balancer | `globalscout-api-alb` |
| VPC | `vpc-0cacbc70e1d184a88` |

### Registered targets (verified)

| Instance | Name | Port | AZ | Health (as of last console check) |
|---|---|---|---|---|
| `i-0bfca9e03bd554809` | Prod | `80` | `eu-central-1a` | **Healthy** (after health check path changed to `/`) |

There is one production EC2 instance. Both frontend traffic (CloudFront → ALB) and `api.globalscout.eu` traffic (Route 53 → ALB) land in this target group on **host port 80**.

An **nginx** reverse-proxy container (`deploy/nginx.ec2.conf`) listens on port `80` and routes by `Host` header:

| Host | Backend |
|---|---|
| `api.globalscout.eu` | ASP.NET API container (`api:8080`) |
| everything else (e.g. ALB hostname, CloudFront origin requests) | UI container (`ui:80`, Next.js) |

The UI container is no longer published directly to the host; only the `proxy` service binds `${HTTP_PORT:-80}`.

### Health checks (verified)

| Setting | Value |
|---|---|
| Protocol | HTTP |
| Path | `/` (updated from `/health`) |
| Port | Traffic port (`80`) |
| Healthy threshold | 5 consecutive successes |
| Unhealthy threshold | 2 consecutive failures |
| Timeout | 5 seconds |
| Interval | 30 seconds |
| Success codes | `200` |

The target was **Unhealthy** while the path was `/health` because port `80` serves the **Next.js UI**, which has no `/health` route. After changing the path to `/`, the target reports **Healthy** when the UI container responds with HTTP `200` on `/`.

If you later split ALB routing into separate target groups, the API group can use path `/health` (mapped in Production on the ASP.NET API).

---

# EC2 Instance

Single production instance (verified).

| Property | Value |
|---|---|
| Instance ID | `i-0bfca9e03bd554809` |
| Name tag | `Prod` |
| State | Running |
| Instance type | `t3.small` |
| AMI | `ami-051eaec1417c5d4ae` — Ubuntu 24.04 Noble (`ubuntu-noble-24.04-amd64-server`) |
| Launch time | May 10, 2026 |
| Key pair | `GlobalScout Prod SSH` |
| IAM instance profile | `GlobalScoutEc2Role` |
| Availability zone | `eu-central-1a` (`euc1-az2`) |
| VPC | `vpc-0cacbc70e1d184a88` |
| Subnet | `subnet-0f36cebd5f24f3684` |
| Private IPv4 | `172.31.25.152` |
| Public IPv4 / Elastic IP | `63.177.190.171` (`eipalloc-0f0121e30b2ede1b5`) |
| Public DNS | `ec2-63-177-190-171.eu-central-1.compute.amazonaws.com` |
| Private DNS | `ip-172-31-25-152.eu-central-1.compute.internal` |
| Network interface | `eni-024b7dad544d3c8ae` |
| Security group | `launch-wizard-1` (`sg-0f5e4b3145b117169`) |
| IMDSv2 | Required |
| Monitoring | disabled |
| Termination / stop protection | disabled |
| ALB target group port | `80` |

ALB health checks reach the instance on its **private IP** (`172.31.25.152`) on port `80`. Public traffic should flow through CloudFront / ALB, not directly to the Elastic IP.

## EC2 Purpose

The EC2 instance hosts via Docker Compose (`deploy/docker-compose.ec2.yml`):

- **proxy** — nginx on host port `80` (ALB target); routes `api.globalscout.eu` to the API
- **ui** — Next.js standalone runtime (internal port `80`)
- **api** — ASP.NET API (internal port `8080`)
- **postgres**
- **migrator**

## Elastic IP

| Property | Value |
|---|---|
| Address | `63.177.190.171` |
| Allocation ID | `eipalloc-0f0121e30b2ede1b5` |
| Association | instance `i-0bfca9e03bd554809` |

Reason:
- stable infrastructure endpoint
- survives restarts
- avoids changing public IPs

SSH and emergency access use this IP; web traffic should use CloudFront / ALB hostnames.

---

# IAM (EC2 instance role)

Production EC2 uses instance profile **`GlobalScoutEc2Role`** (verified).

| Property | Value |
|---|---|
| Role name | `GlobalScoutEc2Role` |
| Role ARN | `arn:aws:iam::272436634689:role/GlobalScoutEc2Role` |
| Instance profile ARN | `arn:aws:iam::272436634689:instance-profile/GlobalScoutEc2Role` |
| Created | May 10, 2026 |
| Maximum session duration | 1 hour |
| Trusted entity | `ec2.amazonaws.com` (EC2 instances) |

## Attached policies (verified)

| Policy | Type | Purpose |
|---|---|---|
| `AmazonEC2ContainerRegistryReadOnly` | AWS managed | Pull container images from ECR (`globalscout/api`, `globalscout/ui`, `globalscout/migrator`) |
| `GlobalScoutMediaBucketAccess` | Customer managed | Read/write/delete objects in the private media S3 bucket (see `docs/AWS-GITHUB-DEPLOYMENT.md`; bucket name is set via `ObjectStorage__BucketName` on the instance, typically `globalscout-prod-media`) |

The API container uses the instance role credentials for S3 presigned URLs and object storage. No long-lived access keys are stored in the deployment `.env` for S3.

Permissions boundary: not set.

---

# UI Container (Next.js)

The UI container runs the Next.js standalone server from `src/ui/apps/web` on port 80.

Current architecture:

```text
/*         -> Next.js App Router (pages, layouts, route handlers)
```

Next route handlers under `/api/*` are backend-for-frontend endpoints (auth cookies, secure proxying). They are served by Next, not the ASP.NET API.

Browser calls to the .NET API still use the absolute API origin:

```text
https://api.globalscout.eu/api
```

SignalR and uploads also use the API origin directly:

```text
https://api.globalscout.eu/hubs/...
https://api.globalscout.eu/uploads/...
```

The UI image is built with:

```text
NEXT_PUBLIC_API_BASE_URL=https://api.globalscout.eu/api
NEXT_PUBLIC_API_ORIGIN=https://api.globalscout.eu
```

### CloudFront method requirements

The frontend CloudFront distribution must forward non-GET methods to the UI origin so Next route handlers (sign-in, registration, onboarding uploads, admin actions) work. Cache only safe read methods at the edge; do not restrict viewer methods to GET/HEAD/OPTIONS.

For Next.js `/_next/image` optimization (optional; the app currently uses `images.unoptimized` and serves `/public` assets directly), the cache behavior must also **forward all query strings** (`url`, `w`, `q`). If query strings are not forwarded, image optimizer requests return `400` with `"url" parameter is required`.

The legacy nginx SPA setup proxied `/api/*` on the frontend host to the ASP.NET API. The Next app does not rely on that path for .NET API traffic.

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
NEXT_PUBLIC_API_BASE_URL=https://api.globalscout.eu/api
```

Legacy Vite builds used `VITE_API_BASE_URL` with the same value.

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

VPC: `vpc-0cacbc70e1d184a88`.

| Security group | ID | Used by |
|---|---|---|
| `globalscout-alb-sg` | `sg-0104828ad803f3cae` | Application Load Balancer |
| `launch-wizard-1` | `sg-0f5e4b3145b117169` | EC2 prod instance |
| `default` | `sg-0147b81fda3df8e9a` | (default VPC SG, not on prod instance) |

## ALB security group (`globalscout-alb-sg`)

Description: Public web traffic for ALB.

### Inbound (verified)

| Type | Protocol | Port | Source |
|---|---|---|---|
| HTTP | TCP | 80 | `0.0.0.0/0` |
| HTTPS | TCP | 443 | `0.0.0.0/0` |

### Outbound (verified)

| Type | Protocol | Port | Destination |
|---|---|---|---|
| All traffic | All | All | `0.0.0.0/0` |

## EC2 security group (`launch-wizard-1`)

Attached to prod instance `i-0bfca9e03bd554809`.

### Inbound (verified — current production)

| Type | Protocol | Port | Source |
|---|---|---|---|
| HTTP | TCP | 80 | `0.0.0.0/0` |
| HTTPS | TCP | 443 | `0.0.0.0/0` |
| SSH | TCP | 22 | `0.0.0.0/0` |

### Outbound (verified)

| Type | Protocol | Port | Destination |
|---|---|---|---|
| All traffic | All | All | `0.0.0.0/0` |

ALB → EC2 health checks work with this configuration because port `80` is open to the internet (including the ALB). For tighter production hardening, restrict EC2 inbound HTTP to the ALB security group only and remove public HTTPS on the instance (TLS terminates at CloudFront and the ALB). Restrict SSH to trusted developer IPs instead of `0.0.0.0/0`.

Desired hardening (not yet applied):

| Type | Port | Source |
|---|---|---|
| HTTP | 80 | `sg-0104828ad803f3cae` (ALB SG only) |
| SSH | 22 | trusted developer IPs only |

Traffic should flow:

```text
Internet
  ↓
CloudFront / ALB
  ↓
EC2 (private IP from ALB)
```

Avoid routing production users directly to the Elastic IP on port 80/443.

---

# Media Architecture

Current media architecture:

```text
Browser
→ API (presigned URL from ASP.NET)
→ private S3 bucket (globalscout-prod-media)
```

The API stores media in S3 through the configured `ObjectStorage` provider (`ObjectStorage__Provider=S3` on EC2). Browser uploads use presigned PUT URLs; reads use short-lived presigned GET URLs returned by the API after authorization checks. Access is via the EC2 instance role `GlobalScoutEc2Role` policy `GlobalScoutMediaBucketAccess`.

Database stores S3 object keys, not local disk paths.

## S3 media bucket (`globalscout-prod-media`)

Verified in S3 console.

| Property | Value |
|---|---|
| Bucket name | `globalscout-prod-media` |
| Region | `eu-central-1` (Europe Frankfurt) |
| ARN | `arn:aws:s3:::globalscout-prod-media` |
| Created | May 10, 2026 |

Configured on EC2 via `ObjectStorage__BucketName` and `ObjectStorage__Region` in `/opt/globalscout/.env` (see `deploy/env.example`).

### Block Public Access (verified)

**Block all public access:** On (recommended).

No bucket policy is attached. Public access is blocked by Block Public Access settings, not by a deny policy document.

### Object Ownership / ACL (verified)

**Bucket owner enforced** — ACLs are disabled. Access is controlled by IAM (`GlobalScoutMediaBucketAccess` on the EC2 role) and presigned URLs issued by the API. No public or authenticated-users ACL grants.

### Default encryption (verified)

| Setting | Value |
|---|---|
| Encryption type | SSE-S3 (Amazon S3 managed keys) |
| Bucket Key | Enabled |
| Blocked encryption types | SSE-C |

Server-side encryption is applied automatically to new objects.

### Versioning (verified)

Bucket versioning: **Enabled**. MFA delete: disabled.

### CORS (verified)

Required so browsers can upload directly to S3 with presigned PUT URLs from the frontend origin:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedOrigins": [
      "https://globalscout.eu",
      "https://www.globalscout.eu",
      "https://d1k7x0oeu0hozx.cloudfront.net"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

**Note:** the current frontend CloudFront distribution domain is `dxbo3oa5f8xms.cloudfront.net`, not `d1k7x0oeu0hozx.cloudfront.net`. Production uploads from `https://globalscout.eu` and `https://www.globalscout.eu` are covered. If you ever test uploads via the raw CloudFront domain, add `https://dxbo3oa5f8xms.cloudfront.net` to `AllowedOrigins` or remove the stale distribution hostname.

### Tags

No user-defined tags on the bucket.

## Planned media delivery

```text
media.globalscout.eu
→ CloudFront
→ private S3 bucket
```

Media files should NOT be publicly accessible directly from S3 (enforced by Block Public Access).

Recommended approach for future `media.globalscout.eu`:
- keep bucket private
- CloudFront Origin Access Control (OAC)
- signed URLs if needed

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

The UI container does not terminate TLS; HTTPS is handled at CloudFront and the ALB.

---

# Documentation Status

Infrastructure documentation is complete from AWS console verification (Route 53, CloudFront, ALB, target groups, EC2, security groups, ACM, IAM, S3).

Optional follow-ups (not blocking):

- **IAM** → `GlobalScoutMediaBucketAccess` policy JSON (exact S3 ARNs in IAM).
- **S3 CORS** → replace or supplement `d1k7x0oeu0hozx.cloudfront.net` with `dxbo3oa5f8xms.cloudfront.net` if needed.
- **ACM** → confirm certificate auto-renewal for certs past documented **Not after** dates.

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
→ CloudFront (globalscout-frontend-prod)
→ ALB (globalscout-api-alb)
→ target group globalscout-api-tg :80
→ EC2 i-0bfca9e03bd554809
→ UI container (Next.js)

API (DNS):
https://api.globalscout.eu
→ ALB (globalscout-api-alb)          [bypasses CloudFront]
→ target group globalscout-api-tg :80
→ EC2 nginx proxy (Host: api.globalscout.eu)
→ ASP.NET API

Media:
Browser
→ API (presigned URLs)
→ S3 globalscout-prod-media (private, SSE-S3, eu-central-1)

Future media:
https://media.globalscout.eu
→ CloudFront
→ private S3 bucket
```

**Open items:**

1. **Security hardening** — EC2 SG allows `0.0.0.0/0` on ports 22, 80, and 443; restrict to ALB SG + trusted SSH IPs.
2. **ACM** — confirm certificate auto-renewal if past the documented **Not after** dates.
3. **S3 CORS** — `AllowedOrigins` includes an older CloudFront hostname (`d1k7x0oeu0hozx`); current distribution is `dxbo3oa5f8xms`.

This is now a legitimate production-grade AWS setup with:
- HTTPS everywhere
- AWS-managed certificates
- CDN acceleration
- proper DNS architecture
- scalable load balancing
- separation between frontend and API
- future-ready infrastructure

