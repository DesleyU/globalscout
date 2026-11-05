# AWS Build Runbook and GitHub Deployment

Step-by-step build of the Futboligy production stack in a fresh AWS account, plus how deploys work.
The resulting architecture is described in [AWS-infrastructure_setup_documentation.md](AWS-infrastructure_setup_documentation.md).

The repo ships three containers, pushed to ECR by `.github/workflows/deploy-aws.yml`:

- `futboligy/ui`: Next.js standalone app from `src/ui/apps/web`.
- `futboligy/api`: ASP.NET Core API.
- `futboligy/migrator`: one-shot EF Core migration runner.

Reusable policy/config files live in [`deploy/aws/`](../deploy/aws). Files containing `__PLACEHOLDER__`
tokens are rendered with `sed` into a temp file before use.

Commands are for Git Bash / bash. Run them from the repo root. Every block assumes:

```bash
export AWS_PROFILE=futboligy
export AWS_REGION=eu-central-1
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
TMP=$(mktemp -d)
```

---

## 0. Account baseline (console, root user, one time)

1. Sign in as root → **Security credentials** → assign an MFA device. Confirm there are no root access keys.
2. Set the console region to **eu-central-1**.
3. **IAM Identity Center** → Enable (choose eu-central-1 as its home region).
   - Create a user for yourself, require MFA.
   - Create a permission set from the `AdministratorAccess` managed policy.
   - **AWS accounts** → assign your user + that permission set to this account.
4. **Billing → Budgets** → create a monthly cost budget (e.g. $60) with an email alert at 80%.
5. **CloudTrail** → create one trail (management events, new S3 bucket). The first trail is free.
6. Sign out of root. From here on use the Identity Center user.

On your machine (AWS CLI v2):

```bash
aws configure sso          # profile name: futboligy, region: eu-central-1, output: json
aws sso login --profile futboligy
aws sts get-caller-identity --profile futboligy
```

Install the [Session Manager plugin](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html)
for shell access to the instance from the CLI (optional: the console's Session Manager works in a browser).

## 1. Route 53 hosted zone

```bash
aws route53 create-hosted-zone --name futboligy.com --caller-reference "futboligy-$(date +%s)"
ZONE_ID=$(aws route53 list-hosted-zones-by-name --dns-name futboligy.com \
  --query 'HostedZones[0].Id' --output text | cut -d/ -f3)
aws route53 get-hosted-zone --id "$ZONE_ID" --query DelegationSet.NameServers
```

This helper UPSERTs a record (`upsert NAME TYPE VALUE`). Later steps use it too:

```bash
upsert() {
  aws route53 change-resource-record-sets --hosted-zone-id "$ZONE_ID" --change-batch "{\"Changes\":[{\"Action\":\"UPSERT\",\"ResourceRecordSet\":{\"Name\":\"$1\",\"Type\":\"$2\",\"TTL\":300,\"ResourceRecords\":[{\"Value\":\"$3\"}]}}]}"
}
```

### 1a. Copy existing records before switching nameservers

The domain is registered at **STRATO** (nameservers `*.rzone.de`). Email runs on **Google Workspace**.
Every record STRATO hosts stops resolving once the nameservers change, so copy them into Route 53 first.
Check STRATO's DNS settings page for anything not listed below, such as other subdomains, `google-site-verification`
TXT records, or CNAMEs. These were the public records as of 2026-11:

```bash
upsert futboligy.com MX "1 smtp.google.com"          # STRATO listed preference 10. Any value works with a single MX.
upsert futboligy.com TXT '\"v=spf1 include:_spf.google.com ~all\"'
upsert _dmarc.futboligy.com TXT '\"v=DMARC1;p=reject;\"'
# The Google DKIM key is longer than 255 chars, so it is split into two quoted strings. Re-read the current value with
#   nslookup -type=TXT google._domainkey.futboligy.com 8.8.8.8
upsert google._domainkey.futboligy.com TXT '\"v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4Xeshrn9h8Ypgrb8ZTf/cli+sa5J1s4qDUn4+6nkKuYcvDJfQieZ3Jx3THvqu5Y+JGEj4jWxbFgTzA5/F3ae0SkpKHqz5AGGHfi02s7mzZWg5ZlWh8z638d1kz5R1BbvjJAV4Z9w61jhtrfG+olQRK/OAu5WVkUsH6JOsshC3zPcj47hOjWx9o3q7609vN4ah\" \"n7JHpWggYDtu9Y7+8lrto53E1pRVAIvzedeM80vsE+DHre2QWx7IKrFoqhpCClfCGzrvhfQiqo2F0RpsdorT6WoJrI/qnMN03IpUCRa6Y4QBChXxNi7SDNCPqaGQpGboLRuGCDFaJtomhLVt02Y0QIDAQAB\"'
```

Do **not** copy the apex `A` record (`217.160.0.106`, STRATO's placeholder page) or the `www` CNAME. Steps 11–12
replace them with CloudFront.

Check the copies against Route 53's own nameservers before switching:

```bash
NS1=$(aws route53 get-hosted-zone --id "$ZONE_ID" --query 'DelegationSet.NameServers[0]' --output text)
for q in "MX futboligy.com" "TXT futboligy.com" "TXT _dmarc.futboligy.com" "TXT google._domainkey.futboligy.com"; do
  set -- $q; nslookup -type=$1 $2 "$NS1"
done
```

### 1b. Switch nameservers at STRATO

DNSSEC is off for the domain, so there is no DS record to remove. In STRATO's domain settings, set the domain's
nameservers to the four Route 53 ones. Then verify (usually minutes to a few hours):

```bash
nslookup -type=NS futboligy.com 8.8.8.8
```

After the switch, send a test email to engineering@futboligy.com from an outside address, and send one from it.

## 2. ACM certificates

One certificate per region, both for `futboligy.com` + `*.futboligy.com`:
`us-east-1` for CloudFront, `eu-central-1` for the ALB.

```bash
CF_CERT_ARN=$(aws acm request-certificate --region us-east-1 --domain-name futboligy.com \
  --subject-alternative-names '*.futboligy.com' --validation-method DNS --query CertificateArn --output text)
ALB_CERT_ARN=$(aws acm request-certificate --region eu-central-1 --domain-name futboligy.com \
  --subject-alternative-names '*.futboligy.com' --validation-method DNS --query CertificateArn --output text)
sleep 10
for pair in "us-east-1 $CF_CERT_ARN" "eu-central-1 $ALB_CERT_ARN"; do
  set -- $pair
  aws acm describe-certificate --region "$1" --certificate-arn "$2" \
    --query 'Certificate.DomainValidationOptions[].ResourceRecord.[Name,Value]' --output text
done | sort -u | while read -r name value; do upsert "$name" CNAME "$value"; done
aws acm wait certificate-validated --region us-east-1 --certificate-arn "$CF_CERT_ARN"
aws acm wait certificate-validated --region eu-central-1 --certificate-arn "$ALB_CERT_ARN"
```

Keep the validation CNAMEs forever. ACM auto-renews as long as they resolve.

## 3. SES (email)

```bash
aws sesv2 create-email-identity --email-identity futboligy.com \
  --query 'DkimAttributes.Tokens' --output text | tr '\t' '\n' | while read -r t; do
  upsert "${t}._domainkey.futboligy.com" CNAME "${t}.dkim.amazonses.com"
done

# Custom MAIL FROM on a subdomain, so SPF aligns. The apex SPF stays Google-only.
aws sesv2 put-email-identity-mail-from-attributes --email-identity futboligy.com \
  --mail-from-domain mail.futboligy.com --behavior-on-mx-failure USE_DEFAULT_VALUE
upsert mail.futboligy.com MX "10 feedback-smtp.eu-central-1.amazonses.com"
upsert mail.futboligy.com TXT '\"v=spf1 include:amazonses.com ~all\"'
# Leave the existing _dmarc record (p=reject) alone. SES's DKIM signs as futboligy.com, so it passes DMARC.
# Wait for DKIM Status SUCCESS before sending any app email, or receivers will reject it under p=reject.

aws sesv2 get-email-identity --email-identity futboligy.com --query 'DkimAttributes.Status'
```

New accounts are in the SES sandbox (can only send to verified addresses). Request production access early
(review usually takes about a day):

```bash
aws sesv2 put-account-details --production-access-enabled --mail-type TRANSACTIONAL \
  --website-url https://futboligy.com --contact-language EN \
  --use-case-description "Transactional email only (account verification, password reset) for users who register on futboligy.com."
```

## 4. ECR repositories

```bash
for r in api ui migrator; do
  aws ecr create-repository --repository-name "futboligy/$r" --image-scanning-configuration scanOnPush=true
  aws ecr put-lifecycle-policy --repository-name "futboligy/$r" --lifecycle-policy-text \
    '{"rules":[{"rulePriority":1,"description":"keep last 20","selection":{"tagStatus":"any","countType":"imageCountMoreThan","countNumber":20},"action":{"type":"expire"}}]}'
done
```

## 5. S3 media bucket

```bash
B=futboligy-prod-media
aws s3api create-bucket --bucket $B --create-bucket-configuration LocationConstraint=$AWS_REGION
aws s3api put-public-access-block --bucket $B --public-access-block-configuration \
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
aws s3api put-bucket-ownership-controls --bucket $B \
  --ownership-controls 'Rules=[{ObjectOwnership=BucketOwnerEnforced}]'
aws s3api put-bucket-encryption --bucket $B --server-side-encryption-configuration \
  '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"},"BucketKeyEnabled":true}]}'
aws s3api put-bucket-versioning --bucket $B --versioning-configuration Status=Enabled
aws s3api put-bucket-lifecycle-configuration --bucket $B --lifecycle-configuration \
  '{"Rules":[{"ID":"expire-old-versions","Status":"Enabled","Filter":{},"NoncurrentVersionExpiration":{"NoncurrentDays":30},"AbortIncompleteMultipartUpload":{"DaysAfterInitiation":7}}]}'
aws s3api put-bucket-cors --bucket $B --cors-configuration file://deploy/aws/s3-cors.json
```

## 6. IAM

EC2 instance role: SSM (deploys + shell), ECR pull, media bucket, SES send.

```bash
aws iam create-role --role-name FutboligyEc2Role --assume-role-policy-document file://deploy/aws/ec2-trust.json
aws iam attach-role-policy --role-name FutboligyEc2Role --policy-arn arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
aws iam attach-role-policy --role-name FutboligyEc2Role --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly
sed "s/__ACCOUNT_ID__/$ACCOUNT_ID/g" deploy/aws/ec2-app-policy.json > "$TMP/ec2-app-policy.json"
aws iam put-role-policy --role-name FutboligyEc2Role --policy-name FutboligyAppAccess \
  --policy-document "file://$TMP/ec2-app-policy.json"
aws iam create-instance-profile --instance-profile-name FutboligyEc2Role
aws iam add-role-to-instance-profile --instance-profile-name FutboligyEc2Role --role-name FutboligyEc2Role
```

GitHub Actions OIDC provider + deploy role. The trust policy only allows workflows running on `main` of
`DesleyU/globalscout`. The permissions policy is attached in step 8, once the instance ID exists.

```bash
aws iam create-open-id-connect-provider --url https://token.actions.githubusercontent.com --client-id-list sts.amazonaws.com
sed "s/__ACCOUNT_ID__/$ACCOUNT_ID/g" deploy/aws/github-trust.json > "$TMP/github-trust.json"
aws iam create-role --role-name FutboligyGitHubDeployRole --assume-role-policy-document "file://$TMP/github-trust.json"
```

## 7. Security groups (default VPC)

```bash
VPC_ID=$(aws ec2 describe-vpcs --filters Name=is-default,Values=true --query 'Vpcs[0].VpcId' --output text)
ALB_SG=$(aws ec2 create-security-group --group-name futboligy-alb-sg --description "Public HTTP/HTTPS to ALB" \
  --vpc-id "$VPC_ID" --query GroupId --output text)
EC2_SG=$(aws ec2 create-security-group --group-name futboligy-ec2-sg --description "HTTP from ALB only" \
  --vpc-id "$VPC_ID" --query GroupId --output text)
aws ec2 authorize-security-group-ingress --group-id "$ALB_SG" --ip-permissions \
  'IpProtocol=tcp,FromPort=80,ToPort=80,IpRanges=[{CidrIp=0.0.0.0/0}]' \
  'IpProtocol=tcp,FromPort=443,ToPort=443,IpRanges=[{CidrIp=0.0.0.0/0}]'
aws ec2 authorize-security-group-ingress --group-id "$EC2_SG" --protocol tcp --port 80 --source-group "$ALB_SG"
```

No SSH rule. Shell access goes through SSM Session Manager.

## 8. EC2 instance

Ubuntu 24.04 amd64, t3.small, 30 GB gp3, IMDSv2 required. The hop limit is 2 so containers can reach the
instance role. The user data installs Docker, Compose, AWS CLI v2 and a 2 GB swap file.

```bash
SUBNET_A=$(aws ec2 describe-subnets --filters Name=vpc-id,Values=$VPC_ID Name=availability-zone,Values=eu-central-1a \
  --query 'Subnets[0].SubnetId' --output text)
INSTANCE_ID=$(aws ec2 run-instances \
  --image-id resolve:ssm:/aws/service/canonical/ubuntu/server/24.04/stable/current/amd64/hvm/ebs-gp3/ami-id \
  --instance-type t3.small \
  --subnet-id "$SUBNET_A" --security-group-ids "$EC2_SG" \
  --iam-instance-profile Name=FutboligyEc2Role \
  --metadata-options HttpTokens=required,HttpEndpoint=enabled,HttpPutResponseHopLimit=2 \
  --block-device-mappings 'DeviceName=/dev/sda1,Ebs={VolumeSize=30,VolumeType=gp3,Encrypted=true}' \
  --user-data file://deploy/aws/ec2-user-data.sh \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=futboligy-prod}]' \
  --query 'Instances[0].InstanceId' --output text)
aws ec2 wait instance-status-ok --instance-ids "$INSTANCE_ID"
aws ssm describe-instance-information --filters Key=InstanceIds,Values=$INSTANCE_ID \
  --query 'InstanceInformationList[0].PingStatus'   # expect Online
```

Now attach the GitHub deploy permissions (ECR push + SSM send-command limited to this instance):

```bash
sed -e "s/__ACCOUNT_ID__/$ACCOUNT_ID/g" -e "s/__INSTANCE_ID__/$INSTANCE_ID/g" \
  deploy/aws/github-deploy-policy.json > "$TMP/github-deploy-policy.json"
aws iam put-role-policy --role-name FutboligyGitHubDeployRole --policy-name FutboligyDeploy \
  --policy-document "file://$TMP/github-deploy-policy.json"
```

## 9. `.env` on the instance

Open a shell with `aws ssm start-session --target "$INSTANCE_ID"`, or use **EC2 → Connect → Session Manager**
in the console. Then:

```bash
sudo -i
cloud-init status --wait            # user data finished
docker version && aws --version
nano /opt/futboligy/.env            # paste deploy/env.example, fill every secret
chmod 600 /opt/futboligy/.env
```

Do not pass secrets via `ssm send-command`, because they would persist in the command history.

## 10. Application Load Balancer

```bash
SUBNET_B=$(aws ec2 describe-subnets --filters Name=vpc-id,Values=$VPC_ID Name=availability-zone,Values=eu-central-1b \
  --query 'Subnets[0].SubnetId' --output text)
ALB_ARN=$(aws elbv2 create-load-balancer --name futboligy-alb --type application --scheme internet-facing \
  --ip-address-type ipv4 --subnets "$SUBNET_A" "$SUBNET_B" --security-groups "$ALB_SG" \
  --query 'LoadBalancers[0].LoadBalancerArn' --output text)
TG_ARN=$(aws elbv2 create-target-group --name futboligy-tg --protocol HTTP --port 80 --vpc-id "$VPC_ID" \
  --target-type instance --health-check-path / --health-check-interval-seconds 30 \
  --healthy-threshold-count 3 --unhealthy-threshold-count 2 --matcher HttpCode=200 \
  --query 'TargetGroups[0].TargetGroupArn' --output text)
aws elbv2 register-targets --target-group-arn "$TG_ARN" --targets Id="$INSTANCE_ID"
aws elbv2 create-listener --load-balancer-arn "$ALB_ARN" --protocol HTTPS --port 443 \
  --ssl-policy ELBSecurityPolicy-TLS13-1-2-2021-06 --certificates CertificateArn="$ALB_CERT_ARN" \
  --default-actions Type=forward,TargetGroupArn="$TG_ARN"
aws elbv2 create-listener --load-balancer-arn "$ALB_ARN" --protocol HTTP --port 80 \
  --default-actions 'Type=redirect,RedirectConfig={Protocol=HTTPS,Port=443,StatusCode=HTTP_301}'
# Long-lived SignalR WebSockets: raise idle timeout from 60s.
aws elbv2 modify-load-balancer-attributes --load-balancer-arn "$ALB_ARN" \
  --attributes Key=idle_timeout.timeout_seconds,Value=300
```

The target stays unhealthy until the first deploy (step 14). That is expected.

## 11. DNS for the API and the CloudFront origin

`api.futboligy.com` goes straight to the ALB. `origin.futboligy.com` is the hostname CloudFront uses to reach the
ALB over HTTPS (it's covered by the wildcard certificate).

```bash
ALB_DNS=$(aws elbv2 describe-load-balancers --load-balancer-arns "$ALB_ARN" --query 'LoadBalancers[0].DNSName' --output text)
ALB_ZONE=$(aws elbv2 describe-load-balancers --load-balancer-arns "$ALB_ARN" --query 'LoadBalancers[0].CanonicalHostedZoneId' --output text)
alias_record() {  # alias_record NAME TARGET_DNS TARGET_ZONE [TYPES...]
  local name=$1 dns=$2 zone=$3; shift 3
  for type in "${@:-A}"; do
    aws route53 change-resource-record-sets --hosted-zone-id "$ZONE_ID" --change-batch "{\"Changes\":[{\"Action\":\"UPSERT\",\"ResourceRecordSet\":{\"Name\":\"$name\",\"Type\":\"$type\",\"AliasTarget\":{\"DNSName\":\"$dns\",\"HostedZoneId\":\"$zone\",\"EvaluateTargetHealth\":false}}}]}"
  done
}
alias_record api.futboligy.com "dualstack.$ALB_DNS" "$ALB_ZONE"
alias_record origin.futboligy.com "dualstack.$ALB_DNS" "$ALB_ZONE"
```

## 12. CloudFront (frontend)

Default behavior: **CachingDisabled** + **AllViewer**, all methods, because pages are SSR and can be
user-specific. `/_next/static/*` uses **CachingOptimized**, because those files are content-hashed and immutable.

```bash
sed -e "s|__CF_CERT_ARN__|$CF_CERT_ARN|" -e "s|__CALLER_REF__|futboligy-$(date +%s)|" \
  deploy/aws/cloudfront-frontend.json > "$TMP/cloudfront.json"
CF_DOMAIN=$(aws cloudfront create-distribution --distribution-config "file://$TMP/cloudfront.json" \
  --query 'Distribution.DomainName' --output text)
alias_record futboligy.com "$CF_DOMAIN" Z2FDTNDATAQYW2 A AAAA
alias_record www.futboligy.com "$CF_DOMAIN" Z2FDTNDATAQYW2 A AAAA
```

`Z2FDTNDATAQYW2` is the fixed hosted zone ID for all CloudFront aliases. The distribution takes 5–15 minutes to deploy.

## 13. GitHub configuration

```bash
gh variable set AWS_REGION --body eu-central-1
gh variable set AWS_ROLE_ARN --body "arn:aws:iam::$ACCOUNT_ID:role/FutboligyGitHubDeployRole"
gh variable set ECR_REGISTRY --body "$ACCOUNT_ID.dkr.ecr.eu-central-1.amazonaws.com"
gh variable set EC2_INSTANCE_ID --body "$INSTANCE_ID"
gh variable set DEPLOY_PATH --body /opt/futboligy
# Remove settings from the old SSH-based workflow:
gh variable delete EC2_HOST; gh variable delete EC2_USER; gh variable delete EC2_SSH_PORT
gh secret delete EC2_SSH_PRIVATE_KEY
```

## 14. First deploy

Push the repo changes, then run **Actions → Deploy to AWS → Run workflow** on `main`. The workflow:

1. Assumes `FutboligyGitHubDeployRole` via GitHub OIDC (no static AWS keys).
2. Builds `linux/amd64` images for API, migrator and UI, and pushes `:<sha>` and `:latest` to ECR.
   The UI is built with `NEXT_PUBLIC_API_BASE_URL=https://api.futboligy.com/api`.
3. Sends an `AWS-RunShellScript` SSM command to `EC2_INSTANCE_ID`. The command writes
   `deploy/docker-compose.ec2.yml` and `deploy/nginx.ec2.conf` (inlined as base64) into `DEPLOY_PATH`,
   logs in to ECR, then runs `docker compose pull`, `up -d --remove-orphans` and `image prune`.
4. Polls the command until it finishes and prints its output. The job fails if the remote script fails.

Compose order: postgres → migrator (must exit 0) → api → ui → proxy (nginx on host :80, the ALB target).
nginx routes `Host: api.futboligy.com` to the API and everything else to the UI.

## 15. Outside AWS

- **Stripe**: add a webhook endpoint pointing at the API's Stripe webhook route on `https://api.futboligy.com`
  (see [STRIPE-BILLING.md](STRIPE-BILLING.md)). Put its signing secret in `Stripe__WebhookSecret` in `.env`.
  Checkout success/cancel URLs derive from `Stripe__PublicAppBaseUrl`.
- **OAuth providers** (Google / Facebook / Apple): add redirect URIs
  `https://api.futboligy.com/signin-oauth/google` (`/facebook`, `/apple`) and the `https://futboligy.com` origin.

After editing `.env`, restart via SSM: `cd /opt/futboligy && docker compose --env-file .env up -d`.

## 16. Verify

```bash
nslookup futboligy.com 8.8.8.8
aws elbv2 describe-target-health --target-group-arn "$TG_ARN" --query 'TargetHealthDescriptions[].TargetHealth.State'
curl -sI http://futboligy.com | head -3                  # 301 → https
curl -s -o /dev/null -w "%{http_code}\n" https://futboligy.com
curl -s -o /dev/null -w "%{http_code}\n" https://www.futboligy.com
curl -s -o /dev/null -w "%{http_code}\n" https://api.futboligy.com/health
curl -sI https://futboligy.com/ | grep -i x-cache          # Miss / RefreshHit, never a cached page
```

Then check the app end to end:
- register and receive the verification email
- log in
- upload and view an avatar
- send a message (SignalR)
- complete a Stripe test checkout and confirm the webhook arrives
- sign in with Google

---

## Local development

Use Aspire for local development so Postgres, MiniStack, the API, and the Next.js web app start together:

```bash
dotnet run --project src/api/GlobalScout.AppHost/GlobalScout.AppHost.csproj
```

The AppHost starts MiniStack on port `4566`, injects API URLs into the web app, and configures the API to
create/use the local development bucket automatically. Apply the CORS from `deploy/aws/s3-cors.json` to the dev
bucket (`globalscout-dev-media`) if uploads fail locally.
