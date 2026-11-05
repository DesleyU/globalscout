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
| Registrar | **STRATO**, in a colleague's account. Only they can change nameservers. |
| Existing DNS that must survive | Google Workspace email: MX `smtp.google.com`, SPF `include:_spf.google.com`, `google._domainkey` DKIM, `_dmarc` `p=reject`. Never overwrite DMARC. |
| DNSSEC | Off (no DS record), so there is nothing to undo before switching |

## Blockers / waiting on others

- [ ] **Colleague:** check STRATO's DNS settings for records beyond the four Google ones (subdomains,
      `google-site-verification` TXT, CNAMEs). Send a screenshot so they can be copied into Route 53.
- [ ] **Colleague:** switch the nameservers at STRATO to the four Route 53 ones, once phase A is done and checked.
      Then test email to and from engineering@futboligy.com.
- [ ] **AWS:** SES production access review (about a day after the request).

## Phase 0: repo + account (done)

- [x] Review the old infra and decide on changes (see the "Changes from the old setup" section of the infra doc)
- [x] Repo: domain rename, `futboligy-*` AWS names, SSM-based deploy workflow, `deploy/aws/*` files, docs.
      **Not committed yet.** Commit before the first deploy (step 14).
- [x] Step 0: root MFA, Identity Center admin user, CLI SSO profile works (`sts get-caller-identity` OK)
- [ ] Step 0 extras: budget alert, CloudTrail trail (console)

## Phase A: can do now (no dependency on the nameserver switch)

- [ ] Step 1: Route 53 hosted zone created; nameservers noted below
- [ ] Step 1a: Google records copied, plus any extras from STRATO; checked against the Route 53 nameservers
- [ ] Step 2: ACM certificates requested in both regions, validation CNAMEs added (stay *Pending* until the switch)
- [ ] Step 3: SES identity + DKIM + MAIL FROM records (stay *Pending* until the switch)
- [ ] Step 4: ECR repositories
- [ ] Step 5: S3 media bucket
- [ ] Step 6: IAM (EC2 role, GitHub OIDC provider, deploy role)
- [ ] Step 7: security groups
- [ ] Step 8: EC2 instance up, SSM *Online*, GitHub deploy policy attached
- [ ] Step 9: `.env` filled on the instance
- [ ] Step 10 (part): ALB, target group, HTTP→HTTPS redirect listener. *The HTTPS listener waits for the certificate.*
- [ ] Step 11: `api.` / `origin.` alias records (go live only after the switch)
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
export AWS_PROFILE=futboligy AWS_REGION=eu-central-1
ACCOUNT_ID=794647355088
ZONE_ID=
# Route 53 nameservers (give these to the colleague):
#   1.
#   2.
#   3.
#   4.
CF_CERT_ARN=      # us-east-1
ALB_CERT_ARN=     # eu-central-1
VPC_ID=
SUBNET_A=
SUBNET_B=
ALB_SG=
EC2_SG=
INSTANCE_ID=
ALB_ARN=
TG_ARN=
CF_DOMAIN=
```

## Log

- 2026-11-05: Plan agreed, repo changes made (uncommitted), CLI access verified, current DNS inspected
  (STRATO + Google Workspace). Next: Phase A, starting with step 1.
