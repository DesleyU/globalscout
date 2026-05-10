# AWS, GitHub Actions, ECR, and EC2 Deployment

This repo ships three containers:

- `globalscout-ui`: React/Vite static files served by nginx.
- `globalscout-api`: ASP.NET Core API.
- `globalscout-migrator`: one-shot EF Core migration runner.

The manual GitHub Actions workflow builds and pushes these images to ECR, then SSHes into EC2 and runs Docker Compose.

## AWS Resources

Create three private ECR repositories:

```bash
aws ecr create-repository --repository-name globalscout-api --region "$AWS_REGION"
aws ecr create-repository --repository-name globalscout-ui --region "$AWS_REGION"
aws ecr create-repository --repository-name globalscout-migrator --region "$AWS_REGION"
```

The image registry value used by GitHub Actions is:

```bash
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REGISTRY="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
```

## GitHub OIDC Role

Create an IAM OIDC provider for GitHub Actions if it does not already exist:

- Provider URL: `https://token.actions.githubusercontent.com`
- Audience: `sts.amazonaws.com`

Create an IAM role for GitHub Actions with a trust policy like this. Replace the account id, GitHub owner, and repository name.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::<account-id>:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:<github-owner>/<repo-name>:*"
        }
      }
    }
  ]
}
```

Attach a policy that allows pushing to the three ECR repositories:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "ecr:GetAuthorizationToken",
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecr:BatchCheckLayerAvailability",
        "ecr:CompleteLayerUpload",
        "ecr:InitiateLayerUpload",
        "ecr:PutImage",
        "ecr:UploadLayerPart"
      ],
      "Resource": [
        "arn:aws:ecr:<region>:<account-id>:repository/globalscout-api",
        "arn:aws:ecr:<region>:<account-id>:repository/globalscout-ui",
        "arn:aws:ecr:<region>:<account-id>:repository/globalscout-migrator"
      ]
    }
  ]
}
```

## EC2 Setup

The target instance is Ubuntu 26.04 amd64, so the workflow builds `linux/amd64` images.

Install Docker Engine, the Compose plugin, and AWS CLI:

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl awscli
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker "$USER"
```

Log out and back in so the `docker` group membership is active.

Give the EC2 instance an IAM instance profile that can pull from ECR:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "ecr:GetAuthorizationToken",
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecr:BatchCheckLayerAvailability",
        "ecr:BatchGetImage",
        "ecr:GetDownloadUrlForLayer"
      ],
      "Resource": [
        "arn:aws:ecr:<region>:<account-id>:repository/globalscout-api",
        "arn:aws:ecr:<region>:<account-id>:repository/globalscout-ui",
        "arn:aws:ecr:<region>:<account-id>:repository/globalscout-migrator"
      ]
    }
  ]
}
```

Open inbound TCP port `80` in the EC2 security group. Keep SSH restricted to your IP.

## EC2 Environment File

Create the deployment directory and environment file:

```bash
sudo mkdir -p /opt/globalscout
sudo chown "$USER:$USER" /opt/globalscout
cp deploy/env.example /opt/globalscout/.env
chmod 600 /opt/globalscout/.env
```

Edit `/opt/globalscout/.env` on the instance. At minimum, set:

- `POSTGRES_PASSWORD`
- `Jwt__SigningKey`
- `Stripe__PublicAppBaseUrl`
- Stripe secrets if billing is enabled
- `ApiFootball__ApiKey` if football statistics are enabled

Do not commit the filled `.env` file.

## GitHub Variables And Secrets

Configure these repository variables in GitHub Actions:

- `AWS_REGION`
- `AWS_ROLE_ARN`: the GitHub OIDC role ARN.
- `ECR_REGISTRY`: for example `123456789012.dkr.ecr.eu-central-1.amazonaws.com`.
- `EC2_HOST`: public DNS name or IP of the EC2 instance.
- `EC2_USER`: usually `ubuntu`.
- `DEPLOY_PATH`: optional, defaults to `/opt/globalscout`.

Configure this repository secret:

- `EC2_SSH_PRIVATE_KEY`: private key that can SSH to the instance.

Use a protected environment if deployment should require approval before the workflow can access production variables and secrets.

## Running A Deployment

Open GitHub Actions, choose `Deploy to AWS`, then run the workflow manually. The optional `image_tag` input defaults to the commit SHA.

The workflow will:

1. Assume the AWS role using GitHub OIDC.
2. Build `linux/amd64` images for API, UI, and migrator.
3. Push each image to ECR using the selected image tag and `latest`.
4. Copy `deploy/docker-compose.ec2.yml` to the EC2 deployment directory.
5. Run `docker compose pull` and `docker compose up -d --remove-orphans` on EC2.

The migrator runs before the API starts. If migrations fail, Compose will not start the API because the API depends on the migrator completing successfully.

## Local Compose

For local smoke testing:

```bash
docker compose build
docker compose up
```

The local UI is available at `http://localhost:8080`, the API at `http://localhost:5288`, and Postgres at `localhost:5432`.
