# AWS Infrastructure (Futboligy production)

Production infrastructure for **futboligy.com**. It was rebuilt in a new AWS account in 2026-11. It replaces
the earlier `globalscout.eu` setup in the old account (272436634689), which this doc no longer describes.
To build it from scratch, follow the runbook in [AWS-GITHUB-DEPLOYMENT.md](AWS-GITHUB-DEPLOYMENT.md).
Policy and config files are in [`deploy/aws/`](../deploy/aws).

Code namespaces, the database name and the JWT issuer still say `GlobalScout`. Only the public domain and the
AWS resource names changed.

Design goals: AWS-native, cheap at early stage (single host), and no public entry points except CloudFront
and the ALB.

---

## Architecture

```text
Browser ──HTTPS──► CloudFront (futboligy-frontend-prod)          futboligy.com, www.futboligy.com
                     │ HTTPS → origin.futboligy.com
                     ▼
Browser ──HTTPS──► ALB (futboligy-alb, :443; :80 → 301 to https)  api.futboligy.com (no CloudFront)
                     │ HTTP :80
                     ▼
                   Target group futboligy-tg → EC2 futboligy-prod (only reachable from the ALB SG)
                     │
                   nginx "proxy" container :80
                     ├── Host: api.futboligy.com → api:8080 (ASP.NET, SignalR hubs)
                     └── everything else         → ui:80   (Next.js standalone)

Media:  Browser ⇄ presigned URLs from API ⇄ private S3 futboligy-prod-media
Email:  API → SES (eu-central-1, identity futboligy.com) via instance role
Deploy: GitHub Actions (OIDC) → ECR push → SSM Run Command on the instance
```

Region: **eu-central-1** for everything except the CloudFront certificate, which must be in **us-east-1**.

---

## URL invariants

| Purpose | URL |
|---|---|
| Frontend | `https://futboligy.com`, `https://www.futboligy.com` |
| API (browser + BFF) | `https://api.futboligy.com/api` — never relative `/api` on the frontend domain |
| SignalR | `https://api.futboligy.com/hubs/...` |
| API health | `https://api.futboligy.com/health` |
| OAuth callbacks | `https://api.futboligy.com/signin-oauth/{google,facebook,apple}` |

The UI image bakes in `NEXT_PUBLIC_API_BASE_URL=https://api.futboligy.com/api` and
`NEXT_PUBLIC_API_ORIGIN=https://api.futboligy.com` (build args in `.github/workflows/deploy-aws.yml`).
Next.js route handlers under `/api/*` on the frontend domain are the BFF, served by Next, not by the .NET API.

API CORS allows `https://futboligy.com` and `https://www.futboligy.com`
(`deploy/docker-compose.ec2.yml`, `appsettings.json`).

---

## DNS: Route 53

Hosted zone `futboligy.com`. The domain is registered at **STRATO**, which delegates to the zone's nameservers.
The registrar account belongs to a colleague. Google Workspace email (e.g. engineering@futboligy.com) depends on
the MX/SPF/DKIM records below.

| Record | Type | Target |
|---|---|---|
| `futboligy.com`, `www.futboligy.com` | A + AAAA alias | CloudFront distribution |
| `api.futboligy.com` | A alias | ALB |
| `origin.futboligy.com` | A alias | ALB. CloudFront's origin hostname, so CloudFront → ALB can use HTTPS. |
| `_<hash>.futboligy.com` | CNAME | ACM DNS validation (shared by both certs). **Never delete.** |
| `<token>._domainkey.futboligy.com` ×3 | CNAME | SES Easy DKIM |
| `mail.futboligy.com` | MX + TXT (SPF) | SES custom MAIL FROM |
| `futboligy.com` | MX + TXT (SPF) | Google Workspace mail (`smtp.google.com`, `include:_spf.google.com`) |
| `google._domainkey.futboligy.com` | TXT | Google Workspace DKIM |
| `_dmarc.futboligy.com` | TXT | DMARC `p=reject` (pre-existing from the Google setup; SES passes via aligned DKIM) |
| `media.futboligy.com` | — | Planned (CloudFront + OAC in front of the media bucket). Not built. |

## Certificates: ACM

Both certificates cover `futboligy.com` + `*.futboligy.com` and are DNS-validated, so they auto-renew while the
validation CNAME exists.

| Region | Used by |
|---|---|
| us-east-1 | CloudFront `futboligy-frontend-prod` |
| eu-central-1 | ALB `futboligy-alb` HTTPS listener (serves `api.` and `origin.`) |

## CloudFront: `futboligy-frontend-prod`

Config file: `deploy/aws/cloudfront-frontend.json`.

- Aliases: `futboligy.com`, `www.futboligy.com`. TLS policy `TLSv1.2_2021`, SNI only, HTTP/2 + HTTP/3, IPv6 on.
- Price class `PriceClass_100` (North America + Europe).
- Origin: `origin.futboligy.com`, **HTTPS only**, TLSv1.2.
- Default behavior `*`:
  - Policies: `Managed-CachingDisabled` + `Managed-AllViewer`.
  - All 7 methods allowed. Cookies, headers and query strings reach Next.js.
  - Pages are SSR and can be user-specific, so they are never cached at the edge.
- Behavior `/_next/static/*`: `Managed-CachingOptimized`, GET/HEAD only. These files are content-hashed and immutable.
- No default root object. Next.js serves `/`.

`api.futboligy.com` is **not** on this distribution.

## Application Load Balancer: `futboligy-alb`

- Internet-facing, IPv4, default VPC, subnets in eu-central-1a and eu-central-1b, security group `futboligy-alb-sg`.
- Idle timeout 300 s, for SignalR WebSockets.
- Listener :443: policy `ELBSecurityPolicy-TLS13-1-2-2021-06`, eu-central-1 cert, forwards to `futboligy-tg`.
- Listener :80: 301 redirect to HTTPS.
- Target group `futboligy-tg`:
  - HTTP:80, instance targets.
  - Health check `GET /` → 200 (served by the UI through nginx), interval 30 s, healthy 3, unhealthy 2.

Both hostnames hit the same target group. nginx (`deploy/nginx.ec2.conf`) splits traffic by `Host` header.

## EC2: `futboligy-prod`

| Property | Value |
|---|---|
| Type / OS | t3.small (2 GB + 2 GB swap), Ubuntu 24.04 amd64 |
| Disk | 30 GB gp3, encrypted |
| Network | default VPC public subnet eu-central-1a, auto-assigned public IPv4 (outbound only), no Elastic IP |
| Security group | `futboligy-ec2-sg`: inbound TCP 80 **from `futboligy-alb-sg` only**. No SSH. |
| IMDS | v2 required, hop limit 2 (containers use the instance role) |
| Instance profile | `FutboligyEc2Role` |
| Key pair | none. Shell via SSM Session Manager. |
| Bootstrap | `deploy/aws/ec2-user-data.sh` (Docker + Compose, AWS CLI v2, swap, `/opt/futboligy`) |

Deploy directory `/opt/futboligy` contains:
- `docker-compose.yml` (from `deploy/docker-compose.ec2.yml`)
- `nginx.ec2.conf`
- `.env` (mode 600, secrets, never committed; template `deploy/env.example`)

Compose services:
- `postgres`: postgres:17-alpine, named volume `postgres-data`. **No backups** (accepted risk).
- `migrator`: one-shot EF migrations. The API waits for it to exit 0.
- `api`: ASP.NET on :8080. S3 and SES go through the instance role, with no static keys.
- `ui`: Next.js standalone on :80.
- `proxy`: nginx:1.27-alpine, the only service bound to a host port (:80).

## IAM

| Principal | Purpose / permissions |
|---|---|
| Identity Center admin user (MFA) | Human access. Root is only used for account-level tasks. |
| `FutboligyEc2Role` (instance profile) | `AmazonSSMManagedInstanceCore`, `AmazonEC2ContainerRegistryReadOnly`, inline `FutboligyAppAccess` (`deploy/aws/ec2-app-policy.json`): media bucket objects + list, `ses:SendEmail`/`SendRawEmail` on the `futboligy.com` identity |
| GitHub OIDC provider `token.actions.githubusercontent.com` | Federation for Actions |
| `FutboligyGitHubDeployRole` | Trust is limited to `repo:DesleyU/globalscout:ref:refs/heads/main` (`deploy/aws/github-trust.json`). Inline `FutboligyDeploy` (`deploy/aws/github-deploy-policy.json`): ECR push to `futboligy/*`, plus `ssm:SendCommand` limited to the prod instance + `AWS-RunShellScript`, plus reading command status. |

## ECR

Repositories `futboligy/api`, `futboligy/ui` and `futboligy/migrator`. Scan on push is on, and a lifecycle
policy keeps the last 20 images. Each deploy pushes `:<commit sha>` and `:latest`.

## S3: `futboligy-prod-media`

- Private. Block Public Access is on, ownership is bucket-owner-enforced (no ACLs), and there is no bucket policy.
- SSE-S3 with Bucket Key.
- Versioning is on. Noncurrent versions expire after 30 days, and incomplete multipart uploads after 7 days.
- CORS (`deploy/aws/s3-cors.json`): PUT/GET/HEAD from `https://futboligy.com`, `https://www.futboligy.com`,
  `http://localhost:3000` and `http://127.0.0.1:3000`.
- The database stores object keys. The API returns short-lived presigned PUT/GET URLs after authorization.

## SES

- Domain identity `futboligy.com` in eu-central-1, with Easy DKIM and MAIL FROM `mail.futboligy.com`.
- Sender `no-reply@futboligy.com` (`Email__FromAddress`).
- Production access is requested. Until it is granted, the account is in the sandbox and can only send to verified addresses.

## Account baseline

- Root has MFA and no access keys.
- Admin access goes through IAM Identity Center.
- Monthly budget alert.
- One CloudTrail trail (management events).

---

## Deploys

These are manual: **Actions → Deploy to AWS** (`workflow_dispatch`). Pushing to `main` only runs CI.

1. The workflow assumes the deploy role via OIDC.
2. It builds and pushes the 3 images.
3. It sends an SSM command to the instance that:
   - writes the compose and nginx files
   - logs in to ECR
   - runs `docker compose pull`, `up -d --remove-orphans` and `image prune`
4. It polls the command and fails the job if the command fails.

Required GitHub variables: `AWS_REGION`, `AWS_ROLE_ARN`, `ECR_REGISTRY`, `EC2_INSTANCE_ID`, `DEPLOY_PATH`.
No secrets are needed.

## Operations

- Shell: `aws ssm start-session --target <instance-id>`, or EC2 console → Connect → Session Manager.
- Cheat sheet: `docs/useful commands.txt`.
- CloudFront changes take 5–15 minutes to propagate. Route 53 changes take 1–5 minutes.

## Changes from the old globalscout.eu setup

- CloudFront → ALB now uses HTTPS (via `origin.`) instead of HTTP. ALB :80 now redirects.
- CloudFront no longer edge-caches SSR pages. Only `/_next/static/*` is cached.
- EC2 has no public ingress: no SSH, no 443, port 80 only from the ALB. The Elastic IP was dropped.
- Deploys use SSM instead of SSH/scp, so the `EC2_SSH_PRIVATE_KEY` secret is gone.
- SES is set up and documented. `Authentication__FrontendBaseUrl` and `Email__*` were added to `env.example`.
- Swap was added. The ECR lifecycle policy and S3 noncurrent-version expiry were added.

## Future improvements

- Postgres backups: EBS snapshots via Data Lifecycle Manager, or `pg_dump` to S3. Or move to RDS.
- `media.futboligy.com` via CloudFront + OAC.
- WAF on CloudFront and the ALB.
- Restrict the ALB to CloudFront plus `api.` only, e.g. by putting the API behind CloudFront too.
- Private subnets, ECS/Fargate, autoscaling, centralized logs and metrics.
