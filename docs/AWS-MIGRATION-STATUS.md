# AWS migration status: futboligy.com

Tracks the rebuild of production for **futboligy.com** in the new AWS account. Update this file as steps finish,
so work can resume after a break.

- How-to (commands): [AWS-GITHUB-DEPLOYMENT.md](AWS-GITHUB-DEPLOYMENT.md). Step numbers below refer to it.
- Target architecture: [AWS-infrastructure_setup_documentation.md](AWS-infrastructure_setup_documentation.md)

## Key facts

| | |
|---|---|
| New AWS account | `794647355088` (old account `272436634689` is legacy; don't touch until new prod is verified) |
| CLI access | profile `futboligy` (IAM Identity Center user `alex`, AdministratorAccess), region `eu-central-1`. Re-login: `aws sso login --profile futboligy` |
| Registrar | **STRATO**. Alex has access to the account. |
| Existing DNS that must survive | Google Workspace email: MX `smtp.google.com`, SPF `include:_spf.google.com`, `google._domainkey` DKIM, `_dmarc` `p=reject`. Never overwrite DMARC. |
| DNSSEC | Off (no DS record), so there is nothing to undo before switching |

## Blockers / waiting on others

- [x] **Alex:** check STRATO's DNS settings for records beyond the four Google ones (subdomains,
      `google-site-verification` TXT, CNAMEs). Send a screenshot so they can be copied into Route 53.
- [ ] **Alex:** switch the nameservers at STRATO to the four Route 53 ones, once phase A is done and checked.
      Then test email to and from engineering@futboligy.com.
- [ ] **AWS:** SES production access review (about a day after the request).

## Later / parked

- [ ] Other domains `futboligy.nl`, `futboligy.info` and `futboligy.store` (also at STRATO, STRATO defaults only, no
      Google mail). Plan: redirect them to `https://futboligy.com`. Options: STRATO domain forwarding (quick), or
      Route 53 zones + CloudFront aliases + cert SANs + a redirect function (proper HTTPS). Not started.

## Phase 0: repo + account (done)

- [x] Review the old infra and decide on changes (see the "Changes from the old setup" section of the infra doc)
- [x] Repo: domain rename, `futboligy-*` AWS names, SSM-based deploy workflow, `deploy/aws/*` files, docs.
      Committed in 60a33ba and pushed.
- [x] Step 0: root MFA, Identity Center admin user, CLI SSO profile works (`sts get-caller-identity` OK)
- [ ] Step 0 extras: budget alert, CloudTrail trail (console)

## Phase A: can do now (no dependency on the nameserver switch)

- [x] Step 1: Route 53 hosted zone created; nameservers noted below
- [x] Step 1a: Google records copied and match STRATO (MX, SPF, DMARC, DKIM, plus the Google verification CNAME `yknieg3tniag`). STRATO checked for extras; nothing else needed.
- [x] Step 2: ACM certificates requested in both regions, validation CNAMEs added (stay *Pending* until the switch)
- [x] Step 3: SES identity + DKIM + MAIL FROM records (stay *Pending* until the switch)
- [x] Step 4: ECR repositories
- [x] Step 5: S3 media bucket
- [x] Step 6: IAM (EC2 role, GitHub OIDC provider, deploy role)
- [x] Step 7: security groups
- [x] Step 8: EC2 instance up, SSM *Online*, GitHub deploy policy attached
- [~] Step 9: `.env` created via SSM with generated `POSTGRES_PASSWORD` + `Jwt__SigningKey`. **Still blank:** `AdminSeed__*`, Stripe, Google/Facebook OAuth, `ApiFootball__ApiKey`. Fill these in from a Session Manager shell (`sudo nano /opt/futboligy/.env`).
- [x] Step 10 (part): ALB, target group, HTTP→HTTPS redirect listener. *The HTTPS listener waits for the certificate.*
- [x] Step 11: `api.` / `origin.` alias records (go live only after the switch)
- [ ] Step 13: GitHub variables set; old SSH variables and secret removed
- [ ] Step 14: commit + push repo changes, first deploy. Check from an SSM shell with
      `curl -H "Host: api.futboligy.com" http://127.0.0.1/health`

## Phase B: after the nameservers point to AWS

- [ ] `nslookup -type=NS futboligy.com 8.8.8.8` returns the AWS nameservers; Google email still works both ways
- [ ] ACM certificates *Issued* (both regions)
- [ ] SES DKIM status *SUCCESS*. App email must not be sent before this, because DMARC is `p=reject`.
- [ ] SES production access requested and granted
- [ ] Step 10 (rest): ALB HTTPS :443 listener
- [ ] Step 12: CloudFront distribution + apex/`www` alias records
- [ ] Step 15: Stripe webhook + OAuth redirect URIs (Google/Facebook/Apple) updated to `api.futboligy.com`
- [ ] Step 16: full verification checklist passes
- [ ] Decide what to do with the old account (tear down or keep)

## Resource IDs (fill in as they are created)

Each CLI session starts fresh. Re-export these instead of re-creating resources.

```bash
export AWS_PROFILE=futboligy AWS_REGION=eu-central-1 AWS_PAGER="" MSYS_NO_PATHCONV=1
aws() { command aws "$@" | tr -d '\r'; }   # Git Bash: strip \r from aws.exe output
ACCOUNT_ID=794647355088
ZONE_ID=Z02495172W2S1YLMB3XC6
# Route 53 nameservers (give these to the colleague for STRATO):
#   ns-272.awsdns-34.com
#   ns-681.awsdns-21.net
#   ns-1346.awsdns-40.org
#   ns-1744.awsdns-26.co.uk
CF_CERT_ARN=arn:aws:acm:us-east-1:794647355088:certificate/59854cc9-4e6a-4f6b-bc59-8862bce2a9d3
ALB_CERT_ARN=arn:aws:acm:eu-central-1:794647355088:certificate/43070574-a258-49c2-b4f8-03222cea27b0
VPC_ID=vpc-0590c827113dce959
SUBNET_A=subnet-079ed91dc1f3431fe   # eu-central-1a
SUBNET_B=subnet-064ae2c39c92669ca   # eu-central-1b
ALB_SG=sg-04936c7b516d9b83a
EC2_SG=sg-0ca77affbb73d2f57
INSTANCE_ID=i-0d8aeaaf08d85d0bc
ALB_ARN=arn:aws:elasticloadbalancing:eu-central-1:794647355088:loadbalancer/app/futboligy-alb/27956e2205518a79
TG_ARN=arn:aws:elasticloadbalancing:eu-central-1:794647355088:targetgroup/futboligy-tg/eea0eaf2848c792b
ALB_DNS=futboligy-alb-536509459.eu-central-1.elb.amazonaws.com
ALB_ZONE=Z215JYRZR1TBD5
CF_DOMAIN=          # step 12
```

## Log

- 2026-11-05: Plan agreed, repo changes made (uncommitted), CLI access verified, current DNS inspected
  (STRATO + Google Workspace). Next: Phase A, starting with step 1.
- 2026-11-05 (later): Phase A executed through step 11. Zone, certs (pending), SES (pending), ECR, S3, IAM, SGs,
  EC2 `i-0d8aeaaf08d85d0bc` (SSM Online), `.env` base, ALB + redirect listener, `api`/`origin` aliases.
  Fixed the UI typecheck error (statistics `row.league`) that would have broken the image build. Added `.gitattributes`
  (`*.sh eol=lf`). Runbook notes for Git Bash (`\r` stripping, `MSYS_NO_PATHCONV`).
  Next: set GitHub variables (step 13), push, first deploy (step 14). Colleague: STRATO extras check + nameserver switch.
