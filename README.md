# Cloud Resource Request Platform

A self-hosted web application where developers raise cloud infrastructure requests through an AI chat interface, managers approve them, and the platform automatically provisions resources using Terraform.

---

## Overview

The platform bridges the gap between developer needs and cloud infrastructure provisioning. Instead of filing tickets or writing infrastructure code themselves, developers describe what they need in plain English. The AI assistant validates the request against their team and project context, raises a formal approval request, and — once a manager approves — provisions the resource automatically on AWS.

### Key features

- **AI-powered request intake** — Natural language chat interface understands infrastructure requests and raises them automatically
- **Role-based approval workflow** — Developers request, Managers approve, Cloud Engineers oversee
- **Automatic Terraform provisioning** — Approved requests spin up real AWS resources without manual intervention
- **Versioned IaC templates** — Upload and manage Terraform templates per resource type; old versions are preserved for audit history
- **Naming conventions** — Configurable patterns (e.g. `{project}-{env}-{purpose}`) applied consistently to every resource
- **Tagging** — All metadata (owner, team, project, environment) is applied as AWS resource tags
- **Audit log** — Every mutation is recorded with actor, action, and timestamp
- **Email notifications** — Status updates sent at every workflow transition (optional; requires SMTP config)

---

## Architecture

```
Browser
  └── React / Vite (port 3000)
        └── Express API (port 4000)
              ├── PostgreSQL (port 5432)
              ├── Anthropic AI API
              ├── AWS IAM     (role assumption via STS)
              └── Terraform   (runs inside backend container)
```

### Roles

| Role | What they can do |
|------|-----------------|
| **Developer** | Chat with AI, raise requests, view own requests and resources |
| **Manager** | Everything a Developer can + approve/reject team requests |
| **CloudEngineer** | View all requests and resources, manage IaC templates and audit logs |
| **Admin** | Full access — manage users, teams, projects, accounts, naming conventions, templates |

### Request lifecycle

```
Developer chats with AI
  → AI validates context and asks for confirmation
  → Developer confirms → Request created (PendingApproval)
  → Manager approves → Terraform provisions resource
  → Resource created and tagged → Notifications sent
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router v6 |
| Backend | Node.js, Express 4 |
| Database | PostgreSQL 16, Sequelize ORM |
| AI | Anthropic API (model via `ANTHROPIC_MODEL`) |
| Infrastructure | Terraform 1.9.8 (runs in Docker) |
| Auth | JWT (bcrypt password hashing) |
| Email | Nodemailer (SMTP) |
| Container | Docker, Docker Compose |

---

## Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- An [Anthropic API key](https://console.anthropic.com/)
- AWS credentials with `sts:AssumeRole` permission (for provisioning)

### 1. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in the required values (see [Environment Variables](#environment-variables) below).

### 2. Start the platform

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:4000 |
| PostgreSQL | localhost:5432 |

### 3. Seed the database

The first time you start the platform, seed the admin user:

```bash
docker compose exec backend npm run db:seed
```

Default admin credentials:

```
Email:    admin@cloudplatform.com
Password: Admin@123
```

> Change the admin password immediately after first login.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key for the AI chat assistant |
| `ANTHROPIC_MODEL` | Yes | Anthropic model ID (e.g. `claude-sonnet-4-6`) |
| `JWT_SECRET` | Yes | Long random string for signing JWT tokens |
| `AWS_ACCESS_KEY_ID` | Yes | AWS access key (needs `sts:AssumeRole`) |
| `AWS_SECRET_ACCESS_KEY` | Yes | AWS secret access key |
| `AWS_REGION` | No | Default AWS region (default: `us-east-1`) |
| `DB_NAME` | No | PostgreSQL database name (default: `cloudplatform`) |
| `DB_USER` | No | PostgreSQL username (default: `clouduser`) |
| `DB_PASSWORD` | No | PostgreSQL password (default: `cloudpass`) |
| `JWT_EXPIRES_IN` | No | Token expiry (default: `7d`) |
| `SMTP_HOST` | No | SMTP server host — if unset, emails are logged instead of sent |
| `SMTP_PORT` | No | SMTP port (default: `587`) |
| `SMTP_USER` | No | SMTP username |
| `SMTP_PASS` | No | SMTP password |
| `SMTP_FROM` | No | Sender address for notification emails |

---

## Development

### Run backend locally (without Docker)

```bash
cd backend
npm install
npm run dev        # nodemon on port 4000
```

### Run frontend locally (without Docker)

```bash
cd frontend
npm install
npm run dev        # Vite dev server on port 3000
```

### Useful Docker commands

```bash
# Rebuild after code changes
docker compose up --build -d

# View backend logs
docker compose logs -f backend

# Force recreate backend (picks up new .env values)
docker compose up -d --force-recreate backend

# Open a shell in the backend container
docker compose exec backend sh
```

---

## Admin Setup Guide

After seeding, log in as Admin and complete the following setup before developers can use the platform:

### 1. Create teams and projects

- **Admin → Teams** — Create teams and assign a manager
- **Admin → Projects** — Create projects and link each to a team and an AWS account

### 2. Add AWS accounts

- **Admin → Accounts** — Add the AWS account name, Account ID, and the IAM Role ARN the platform should assume when provisioning into that account

### 3. Upload IaC templates

- **Admin → Templates** — Upload Terraform (`.tf`) templates for each resource type (e.g. `S3Bucket`, `RDSInstance`)
- Templates support platform tokens: `{project}`, `{env}`, `{purpose}`, `{resource}`, `{region}`, `{owner}`
- Uploading a new template for an existing resource type auto-increments the version and deactivates the old one

### 4. Configure naming conventions (optional)

- **Admin → Naming** — Define a naming pattern such as `{project}-{env}-{purpose}`
- If no convention is set, the platform defaults to `{project}-{env}-{purpose}`

### 5. Invite users

- **Admin → Users** — Invite developers, managers, and cloud engineers
- Assign each user to their team(s) after creation

---

## IaC Template Format

Templates are standard Terraform HCL files. The platform substitutes these tokens before running `terraform apply`:

| Token | Value |
|-------|-------|
| `{project}` | Project slug |
| `{env}` | Environment (dev, staging, prod) |
| `{purpose}` | Resource type slug |
| `{resource}` | Full generated resource name |
| `{region}` | AWS region |
| `{owner}` | Requester email |

**Example S3 template:**

```hcl
variable "bucket_name" {}
variable "region"      { default = "us-east-1" }
variable "enable_versioning" { default = "true" }

resource "aws_s3_bucket" "main" {
  bucket = var.bucket_name
  tags = {
    Project     = "{project}"
    Environment = "{env}"
    Owner       = "{owner}"
    ManagedBy   = "CloudPlatform"
  }
}

output "bucket_arn" {
  value = aws_s3_bucket.main.arn
}
```

---

## Project Structure

```
.
├── backend/
│   ├── Dockerfile              # Node 20 Alpine + Terraform 1.9.8
│   ├── src/
│   │   ├── index.js            # Express entry point
│   │   ├── config/             # Database and logger config
│   │   ├── middleware/         # Auth (JWT) and audit log middleware
│   │   ├── models/             # Sequelize models + associations
│   │   ├── routes/             # Express routers (one per entity)
│   │   ├── services/
│   │   │   ├── aiService.js            # Anthropic AI integration
│   │   │   ├── provisioningService.js  # Terraform execution
│   │   │   ├── namingService.js        # Naming convention resolver
│   │   │   ├── iamService.js           # IAM policy attachment
│   │   │   └── notificationService.js  # Email notifications
│   │   └── db/
│   │       └── seed.js         # Initial admin user seed
│
├── frontend/
│   ├── Dockerfile
│   ├── src/
│   │   ├── App.jsx             # Routes and auth guards
│   │   ├── components/
│   │   │   └── Layout.jsx      # Sidebar + main content shell
│   │   ├── context/
│   │   │   └── AuthContext.jsx # JWT auth state
│   │   ├── api/
│   │   │   └── client.js       # Axios instance + all API calls
│   │   └── pages/
│   │       ├── Chat.jsx        # AI chat interface (Developer)
│   │       ├── Dashboard.jsx   # Stats overview
│   │       ├── Requests.jsx    # Request history
│   │       ├── Resources.jsx   # Provisioned resources
│   │       ├── Manager/
│   │       │   └── Approvals.jsx
│   │       └── Admin/
│   │           ├── Users.jsx
│   │           ├── Teams.jsx
│   │           ├── Projects.jsx
│   │           ├── Accounts.jsx
│   │           ├── NamingConventions.jsx
│   │           ├── Templates.jsx
│   │           └── AuditLogs.jsx
│
└── docker-compose.yml
```

---

## Security Notes

- JWT secrets must be long, random strings in production
- The AWS IAM user only needs `sts:AssumeRole` — all resource-level permissions are on the per-account role ARN
- Passwords are hashed with bcrypt; new users must change their password on first login
- All admin and mutation routes are protected by `requireRole` middleware
- SMTP credentials and API keys are never exposed to the frontend

---

## License

MIT
