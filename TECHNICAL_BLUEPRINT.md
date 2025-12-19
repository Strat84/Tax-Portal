# Tax Portal - Technical Implementation Blueprint

## 🚨 CRITICAL ARCHITECTURE DECISION REQUIRED

**Your existing codebase uses Supabase (PostgreSQL + Storage), but the developer's plan uses AWS native services (DynamoDB + S3 + Lambda). You must choose ONE of these paths:**

### Option A: AWS Native Stack (Developer's Plan)
- **Pros**: Better AWS integration, GraphQL AppSync subscriptions, scalable serverless
- **Cons**: Need to rebuild entire data layer, higher complexity, vendor lock-in
- **Cost**: $2,500 + potential rewrites
- **Timeline**: 5-6 weeks as planned

### Option B: Hybrid Approach (RECOMMENDED)
- **Pros**: Leverage existing Supabase code, faster implementation, lower cost
- **Cons**: Managing two services (AWS Cognito + Supabase)
- **Cost**: $1,500-2,000 (30-40% savings)
- **Timeline**: 3-4 weeks (25% faster)

### Option C: Full Supabase (Fastest)
- **Pros**: Use existing setup, Supabase Auth + Realtime, minimal changes
- **Cons**: Less AWS integration, different authentication approach
- **Cost**: $800-1,200 (50% savings)
- **Timeline**: 2-3 weeks (50% faster)

---

## 📋 MILESTONE-BY-MILESTONE IMPLEMENTATION GUIDE

---

## MILESTONE 1: Backend Foundation & Authentication

### Current State Analysis
✅ **Already Built:**
- Next.js 14 frontend with TypeScript
- Basic authentication context (demo mode)
- Supabase PostgreSQL database with complete schema
- UI components for all features

❌ **Missing:**
- Production AWS Cognito configuration
- Lambda post-confirmation trigger
- Custom email templates
- CI/CD pipeline
- Environment management

### Detailed Implementation Plan

#### 1.1 AWS Cognito Advanced Configuration

**Cognito User Pool Setup:**
```bash
# AWS CLI commands to create user pool
aws cognito-idp create-user-pool \
  --pool-name tax-portal-prod \
  --policies '{
    "PasswordPolicy": {
      "MinimumLength": 12,
      "RequireUppercase": true,
      "RequireLowercase": true,
      "RequireNumbers": true,
      "RequireSymbols": true
    }
  }' \
  --mfa-configuration OPTIONAL \
  --email-configuration '{
    "EmailSendingAccount": "DEVELOPER",
    "SourceArn": "arn:aws:ses:us-east-1:ACCOUNT_ID:identity/noreply@yourdomain.com"
  }' \
  --schema '[
    {
      "Name": "email",
      "AttributeDataType": "String",
      "Required": true,
      "Mutable": true
    },
    {
      "Name": "name",
      "AttributeDataType": "String",
      "Required": true,
      "Mutable": true
    },
    {
      "Name": "role",
      "AttributeDataType": "String",
      "Mutable": true,
      "DeveloperOnlyAttribute": false
    }
  ]'
```

**Custom Attributes Configuration:**
```typescript
// lib/auth/cognito-config.ts
export const COGNITO_CONFIG = {
  customAttributes: {
    'custom:role': ['admin', 'tax_pro', 'client'],
    'custom:tax_pro_id': 'uuid',
    'custom:client_id': 'uuid',
    'custom:onboarding_completed': 'boolean'
  },
  passwordPolicy: {
    minimumLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSymbols: true,
    temporaryPasswordValidityDays: 7
  },
  mfa: {
    type: 'OPTIONAL',
    methods: ['SMS', 'TOTP']
  }
}
```

#### 1.2 Lambda Post-Confirmation Trigger

**Lambda Function Structure:**
```typescript
// lambda/cognito-post-confirmation/index.ts
import { CognitoUserPoolTriggerHandler } from 'aws-lambda'
import { PostgrestClient } from '@supabase/postgrest-js'

const supabase = new PostgrestClient(process.env.SUPABASE_URL!, {
  headers: {
    apikey: process.env.SUPABASE_SERVICE_KEY!,
    authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY!}`
  }
})

export const handler: CognitoUserPoolTriggerHandler = async (event) => {
  console.log('Post confirmation trigger:', JSON.stringify(event, null, 2))

  const {
    userName,
    request: { userAttributes }
  } = event

  const role = userAttributes['custom:role'] || 'client'
  const email = userAttributes.email
  const name = userAttributes.name
  const phone = userAttributes.phone_number

  try {
    // 1. Create user in PostgreSQL
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        cognito_user_id: userName,
        email,
        name,
        phone,
        role,
        is_active: true
      })
      .select()
      .single()

    if (userError) {
      console.error('Error creating user:', userError)
      throw new Error(`Failed to create user: ${userError.message}`)
    }

    console.log('User created:', user.id)

    // 2. Create role-specific record
    if (role === 'tax_pro') {
      const { error: taxProError } = await supabase
        .from('tax_professionals')
        .insert({
          user_id: user.id,
          max_clients: 50,
          specializations: []
        })

      if (taxProError) {
        console.error('Error creating tax pro:', taxProError)
        throw new Error(`Failed to create tax pro record: ${taxProError.message}`)
      }
    } else if (role === 'client') {
      const taxProId = userAttributes['custom:tax_pro_id']

      const { error: clientError } = await supabase
        .from('clients')
        .insert({
          user_id: user.id,
          assigned_tax_pro_id: taxProId || null,
          tax_year: new Date().getFullYear(),
          onboarding_completed: false
        })

      if (clientError) {
        console.error('Error creating client:', clientError)
        throw new Error(`Failed to create client record: ${clientError.message}`)
      }

      // Create default folders for client
      const defaultFolders = [
        { name: 'W-2 Forms', path: '/w2-forms' },
        { name: '1099 Forms', path: '/1099-forms' },
        { name: 'Receipts', path: '/receipts' },
        { name: 'Other Documents', path: '/other' }
      ]

      await supabase
        .from('folders')
        .insert(
          defaultFolders.map(folder => ({
            client_id: user.id,
            folder_name: folder.name,
            folder_path: folder.path,
            created_by: user.id
          }))
        )
    }

    // 3. Send welcome email via Resend
    if (process.env.RESEND_API_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Tax Portal <noreply@yourdomain.com>',
          to: email,
          subject: 'Welcome to Tax Portal',
          html: getWelcomeEmailTemplate(name, role)
        })
      })
    }

    // 4. Log to audit trail
    await supabase
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action: 'USER_CREATED',
        entity_type: 'user',
        entity_id: user.id,
        details: { role, email }
      })

    return event
  } catch (error) {
    console.error('Fatal error in post-confirmation:', error)
    throw error
  }
}

function getWelcomeEmailTemplate(name: string, role: string): string {
  const roleMessages = {
    client: 'You can now upload documents and communicate with your tax professional.',
    tax_pro: 'You can now manage clients and review their documents.',
    admin: 'You have full administrative access to the platform.'
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background: #3b82f6;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
          }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Welcome to Tax Portal, ${name}!</h1>
          <p>Your account has been successfully created.</p>
          <p>${roleMessages[role as keyof typeof roleMessages]}</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" class="button">Get Started</a>
          <div class="footer">
            <p>If you have any questions, please contact support.</p>
            <p>&copy; ${new Date().getFullYear()} Tax Portal. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `
}
```

**Lambda Deployment Package:**
```json
// lambda/cognito-post-confirmation/package.json
{
  "name": "cognito-post-confirmation",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "@supabase/postgrest-js": "^1.9.0",
    "node-fetch": "^2.7.0"
  },
  "scripts": {
    "build": "tsc",
    "package": "zip -r function.zip dist node_modules"
  }
}
```

**Lambda IAM Role:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail"
      ],
      "Resource": "*"
    }
  ]
}
```

#### 1.3 Custom Email Templates

**Cognito Email Template Configuration:**
```typescript
// lib/auth/email-templates.ts
export const EMAIL_TEMPLATES = {
  verification: {
    subject: 'Verify your Tax Portal account',
    htmlBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3b82f6;">Verify Your Email</h1>
        <p>Thank you for signing up for Tax Portal!</p>
        <p>Your verification code is:</p>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
          {####}
        </div>
        <p>This code will expire in 24 hours.</p>
        <p>If you didn't request this code, please ignore this email.</p>
      </div>
    `
  },

  invitation: {
    subject: 'You've been invited to Tax Portal',
    htmlBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3b82f6;">Welcome to Tax Portal</h1>
        <p>Your tax professional has invited you to join Tax Portal.</p>
        <p>Your temporary password is:</p>
        <div style="background: #f3f4f6; padding: 15px; margin: 20px 0; font-family: monospace;">
          {####}
        </div>
        <p>Click the button below to set your password:</p>
        <a href="{##Click here##}" style="display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          Set Password
        </a>
        <p style="color: #6b7280; font-size: 14px;">This link will expire in 7 days.</p>
      </div>
    `
  },

  passwordReset: {
    subject: 'Reset your Tax Portal password',
    htmlBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3b82f6;">Reset Your Password</h1>
        <p>We received a request to reset your password.</p>
        <p>Your verification code is:</p>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
          {####}
        </div>
        <p>If you didn't request a password reset, please ignore this email.</p>
      </div>
    `
  }
}

// AWS CLI command to update email templates
export const updateCognitoEmailTemplates = () => `
aws cognito-idp update-user-pool --user-pool-id YOUR_POOL_ID \
  --email-verification-subject "Verify your Tax Portal account" \
  --email-verification-message "Your verification code is {####}"
`
```

#### 1.4 Multi-Environment Setup

**Environment Configuration:**
```typescript
// lib/config/environments.ts
type Environment = 'development' | 'staging' | 'production'

interface EnvironmentConfig {
  cognito: {
    userPoolId: string
    clientId: string
    region: string
  }
  supabase: {
    url: string
    anonKey: string
  }
  api: {
    baseUrl: string
  }
  features: {
    demoMode: boolean
    debugMode: boolean
  }
}

const configs: Record<Environment, EnvironmentConfig> = {
  development: {
    cognito: {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID_DEV!,
      clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID_DEV!,
      region: 'us-east-1'
    },
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL_DEV!,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_DEV!
    },
    api: {
      baseUrl: 'http://localhost:3000'
    },
    features: {
      demoMode: true,
      debugMode: true
    }
  },

  staging: {
    cognito: {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID_STAGING!,
      clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID_STAGING!,
      region: 'us-east-1'
    },
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL_STAGING!,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_STAGING!
    },
    api: {
      baseUrl: 'https://staging.yourdomain.com'
    },
    features: {
      demoMode: false,
      debugMode: true
    }
  },

  production: {
    cognito: {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID_PROD!,
      clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID_PROD!,
      region: 'us-east-1'
    },
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL_PROD!,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_PROD!
    },
    api: {
      baseUrl: 'https://app.yourdomain.com'
    },
    features: {
      demoMode: false,
      debugMode: false
    }
  }
}

export function getConfig(): EnvironmentConfig {
  const env = (process.env.NEXT_PUBLIC_ENVIRONMENT || 'development') as Environment
  return configs[env]
}
```

**.env Files Structure:**
```bash
# .env.development
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_COGNITO_USER_POOL_ID_DEV=us-east-1_xxxxx
NEXT_PUBLIC_COGNITO_CLIENT_ID_DEV=xxxxx
NEXT_PUBLIC_SUPABASE_URL_DEV=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY_DEV=xxxxx
SUPABASE_SERVICE_KEY_DEV=xxxxx
RESEND_API_KEY=re_xxxxx

# .env.staging
NEXT_PUBLIC_ENVIRONMENT=staging
NEXT_PUBLIC_COGNITO_USER_POOL_ID_STAGING=us-east-1_yyyyy
# ... etc

# .env.production
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_COGNITO_USER_POOL_ID_PROD=us-east-1_zzzzz
# ... etc
```

#### 1.5 CI/CD Pipeline

**GitHub Actions Workflow:**
```yaml
# .github/workflows/deploy.yml
name: Deploy Tax Portal

on:
  push:
    branches:
      - main
      - staging
      - develop

env:
  NODE_VERSION: '20.x'
  AWS_REGION: us-east-1

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Type check
        run: npm run typecheck

      - name: Run tests
        run: npm test

  deploy-development:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    environment: development
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        env:
          NEXT_PUBLIC_ENVIRONMENT: development
          NEXT_PUBLIC_COGNITO_USER_POOL_ID_DEV: ${{ secrets.COGNITO_USER_POOL_ID_DEV }}
          NEXT_PUBLIC_COGNITO_CLIENT_ID_DEV: ${{ secrets.COGNITO_CLIENT_ID_DEV }}
          NEXT_PUBLIC_SUPABASE_URL_DEV: ${{ secrets.SUPABASE_URL_DEV }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY_DEV: ${{ secrets.SUPABASE_ANON_KEY_DEV }}
        run: npm run build

      - name: Deploy to Vercel (Development)
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          scope: ${{ secrets.VERCEL_ORG_ID }}

  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/staging'
    environment: staging
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        env:
          NEXT_PUBLIC_ENVIRONMENT: staging
          NEXT_PUBLIC_COGNITO_USER_POOL_ID_STAGING: ${{ secrets.COGNITO_USER_POOL_ID_STAGING }}
          NEXT_PUBLIC_COGNITO_CLIENT_ID_STAGING: ${{ secrets.COGNITO_CLIENT_ID_STAGING }}
          NEXT_PUBLIC_SUPABASE_URL_STAGING: ${{ secrets.SUPABASE_URL_STAGING }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY_STAGING: ${{ secrets.SUPABASE_ANON_KEY_STAGING }}
        run: npm run build

      - name: Deploy to Vercel (Staging)
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          scope: ${{ secrets.VERCEL_ORG_ID }}
          alias-domains: staging.yourdomain.com

  deploy-production:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        env:
          NEXT_PUBLIC_ENVIRONMENT: production
          NEXT_PUBLIC_COGNITO_USER_POOL_ID_PROD: ${{ secrets.COGNITO_USER_POOL_ID_PROD }}
          NEXT_PUBLIC_COGNITO_CLIENT_ID_PROD: ${{ secrets.COGNITO_CLIENT_ID_PROD }}
          NEXT_PUBLIC_SUPABASE_URL_PROD: ${{ secrets.SUPABASE_URL_PROD }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY_PROD: ${{ secrets.SUPABASE_ANON_KEY_PROD }}
        run: npm run build

      - name: Deploy to Vercel (Production)
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          scope: ${{ secrets.VERCEL_ORG_ID }}
          alias-domains: app.yourdomain.com

      - name: Deploy Lambda Functions
        run: |
          cd lambda/cognito-post-confirmation
          npm ci
          npm run build
          npm run package
          aws lambda update-function-code \
            --function-name tax-portal-post-confirmation-prod \
            --zip-file fileb://function.zip \
            --region ${{ env.AWS_REGION }}
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}

      - name: Notify deployment
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Production deployment completed'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
        if: always()

  deploy-lambda:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Build and deploy Lambda
        run: |
          cd lambda/cognito-post-confirmation
          npm ci
          npm run build
          zip -r function.zip dist node_modules package.json

          aws lambda update-function-code \
            --function-name tax-portal-post-confirmation \
            --zip-file fileb://function.zip \
            --region us-east-1
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

### Milestone 1 Checklist

- [ ] Create Cognito User Pools (dev, staging, prod)
- [ ] Configure custom attributes and password policies
- [ ] Set up MFA configuration
- [ ] Create Lambda function for post-confirmation
- [ ] Deploy Lambda to all environments
- [ ] Attach Lambda trigger to Cognito
- [ ] Configure SES for email sending
- [ ] Create custom email templates
- [ ] Update AuthContext to use real Cognito (remove demo mode)
- [ ] Set up environment variables for all environments
- [ ] Configure GitHub Actions secrets
- [ ] Test CI/CD pipeline with development deploy
- [ ] Verify user registration flow end-to-end
- [ ] Test email delivery
- [ ] Verify database user creation

**Estimated Time: 5 days (2 days faster if using existing Supabase)**
**Cost: $500**

---

## MILESTONE 2: Messaging System & Real-Time Notifications

### Architecture Decision: GraphQL vs Supabase Realtime

**Option A: AWS AppSync GraphQL (Developer's Plan)**
- Complex setup, higher cost
- Better for AWS-centric architecture
- Timeline: 10 days

**Option B: Supabase Realtime (RECOMMENDED)**
- Already available in your stack
- Simpler implementation
- Timeline: 5 days
- **50% time savings**

### GraphQL Schema Design (If using AppSync)

```graphql
# schema.graphql
type Message {
  id: ID!
  conversationId: ID!
  senderId: ID!
  recipientId: ID!
  content: String!
  attachments: [Attachment]
  isRead: Boolean!
  createdAt: AWSDateTime!

  # Populated fields
  sender: User
  recipient: User
}

type Attachment {
  id: ID!
  filename: String!
  fileType: String!
  fileSize: Int!
  url: String!
  uploadedAt: AWSDateTime!
}

type Conversation {
  id: ID!
  clientUserId: ID!
  taxProUserId: ID!
  lastMessageAt: AWSDateTime!
  createdAt: AWSDateTime!

  # Populated fields
  client: User
  taxPro: User
  messages(limit: Int, nextToken: String): MessageConnection
  unreadCount(userId: ID!): Int!
}

type MessageConnection {
  items: [Message]
  nextToken: String
}

type User {
  id: ID!
  email: String!
  name: String!
  role: UserRole!
  avatarUrl: String
}

enum UserRole {
  ADMIN
  TAX_PRO
  CLIENT
}

# Queries
type Query {
  getConversation(id: ID!): Conversation
  listConversations(userId: ID!, role: UserRole!): [Conversation]
  listMessages(conversationId: ID!, limit: Int, nextToken: String): MessageConnection
  getUnreadMessageCount(userId: ID!): Int!
}

# Mutations
type Mutation {
  createConversation(clientUserId: ID!, taxProUserId: ID!): Conversation!
  sendMessage(input: SendMessageInput!): Message!
  markMessageAsRead(messageId: ID!): Message!
  markConversationAsRead(conversationId: ID!, userId: ID!): Boolean!
  uploadAttachment(input: UploadAttachmentInput!): Attachment!
  deleteMessage(messageId: ID!): Boolean!
}

input SendMessageInput {
  conversationId: ID!
  senderId: ID!
  recipientId: ID!
  content: String!
  attachmentIds: [ID]
}

input UploadAttachmentInput {
  filename: String!
  fileType: String!
  fileSize: Int!
  base64Data: String!
}

# Subscriptions
type Subscription {
  onNewMessage(conversationId: ID!): Message
    @aws_subscribe(mutations: ["sendMessage"])

  onMessageRead(conversationId: ID!): Message
    @aws_subscribe(mutations: ["markMessageAsRead"])

  onNewConversation(userId: ID!): Conversation
    @aws_subscribe(mutations: ["createConversation"])
}
```

### RECOMMENDED: Supabase Realtime Implementation

**Realtime Message Hook:**
```typescript
// hooks/useRealtimeMessages.ts
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/db/supabase'
import { Message } from '@/lib/api/messages'
import { RealtimeChannel } from '@supabase/supabase-js'

export function useRealtimeMessages(conversationId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  const supabase = createClient()

  useEffect(() => {
    // Initial load
    loadMessages()

    // Subscribe to new messages
    const messageChannel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          console.log('New message received:', payload)
          const newMessage = payload.new as any
          setMessages(prev => [...prev, mapToMessage(newMessage)])
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          console.log('Message updated:', payload)
          const updatedMessage = payload.new as any
          setMessages(prev =>
            prev.map(msg =>
              msg.id === updatedMessage.id ? mapToMessage(updatedMessage) : msg
            )
          )
        }
      )
      .subscribe()

    setChannel(messageChannel)

    return () => {
      if (messageChannel) {
        supabase.removeChannel(messageChannel)
      }
    }
  }, [conversationId])

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users!messages_sender_id_fkey(name, role)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (!error && data) {
      setMessages(data.map(mapToMessage))
    }
  }

  const mapToMessage = (dbMessage: any): Message => ({
    id: dbMessage.id,
    conversationId: dbMessage.conversation_id,
    senderId: dbMessage.sender_id,
    content: dbMessage.content,
    createdAt: dbMessage.created_at,
    isRead: dbMessage.is_read,
    senderName: dbMessage.sender?.name,
    senderRole: dbMessage.sender?.role
  })

  return { messages, refresh: loadMessages }
}
```

**Realtime Notifications Hook:**
```typescript
// hooks/useRealtimeNotifications.ts
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/db/supabase'
import { useAuth } from '@/contexts/AuthContext'

export interface Notification {
  id: string
  type: 'message' | 'document' | 'request' | 'status_update'
  title: string
  message: string
  link?: string
  isRead: boolean
  createdAt: string
}

export function useRealtimeNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    if (!user) return

    // Load initial notifications
    loadNotifications()

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel(`user:${user.id}:messages`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${user.id}`
        },
        async (payload) => {
          const message = payload.new as any

          // Fetch sender info
          const { data: sender } = await supabase
            .from('users')
            .select('name')
            .eq('id', message.sender_id)
            .single()

          addNotification({
            id: message.id,
            type: 'message',
            title: 'New Message',
            message: `${sender?.name || 'Someone'} sent you a message`,
            link: `/client/messages?conversation=${message.conversation_id}`,
            isRead: false,
            createdAt: message.created_at
          })
        }
      )
      .subscribe()

    // Subscribe to new document requests
    const requestsChannel = supabase
      .channel(`user:${user.id}:requests`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'document_requests',
          filter: `client_id=eq.${user.id}`
        },
        async (payload) => {
          const request = payload.new as any

          addNotification({
            id: request.id,
            type: 'request',
            title: 'New Document Request',
            message: `Your tax professional requested: ${request.document_name}`,
            link: '/client/requests',
            isRead: false,
            createdAt: request.created_at
          })
        }
      )
      .subscribe()

    // Subscribe to new documents (for tax pros)
    let documentsChannel
    if (user.role === 'tax_pro') {
      documentsChannel = supabase
        .channel(`taxpro:${user.id}:documents`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'files'
          },
          async (payload) => {
            const file = payload.new as any

            // Check if this file belongs to this tax pro's client
            const { data: client } = await supabase
              .from('clients')
              .select('user_id, tax_pro_id')
              .eq('id', file.client_id)
              .single()

            if (client?.tax_pro_id === user.id) {
              const { data: clientUser } = await supabase
                .from('users')
                .select('name')
                .eq('id', client.user_id)
                .single()

              addNotification({
                id: file.id,
                type: 'document',
                title: 'New Document Uploaded',
                message: `${clientUser?.name || 'A client'} uploaded ${file.filename}`,
                link: `/tax-pro/clients/${file.client_id}?tab=documents`,
                isRead: false,
                createdAt: file.uploaded_at
              })
            }
          }
        )
        .subscribe()
    }

    return () => {
      supabase.removeChannel(messagesChannel)
      supabase.removeChannel(requestsChannel)
      if (documentsChannel) {
        supabase.removeChannel(documentsChannel)
      }
    }
  }, [user?.id])

  const loadNotifications = async () => {
    if (!user) return

    // This would be a custom view or aggregation
    // For now, we'll fetch unread messages count
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', user.id)
      .eq('is_read', false)

    setUnreadCount(count || 0)
  }

  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev])
    setUnreadCount(prev => prev + 1)

    // Show browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/icon-192.png',
        badge: '/icon-192.png'
      })
    }

    // Play sound
    const audio = new Audio('/notification-sound.mp3')
    audio.play().catch(() => {}) // Ignore errors
  }

  const markAsRead = async (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, isRead: true } : n))
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = async () => {
    if (!user) return

    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('recipient_id', user.id)
      .eq('is_read', false)

    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    setUnreadCount(0)
  }

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refresh: loadNotifications
  }
}
```

**File Upload in Chat:**
```typescript
// lib/api/chat-attachments.ts
import { createClient } from '@/lib/db/supabase'

export interface ChatAttachment {
  id: string
  messageId: string
  filename: string
  fileType: string
  fileSize: number
  storagePath: string
  uploadedAt: string
}

export async function uploadChatAttachment(
  file: File,
  conversationId: string,
  userId: string
): Promise<ChatAttachment> {
  const supabase = createClient()

  // Generate unique file path
  const timestamp = Date.now()
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const filePath = `chat-attachments/${conversationId}/${timestamp}_${sanitizedName}`

  // Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('documents')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (uploadError) {
    throw new Error(`Failed to upload file: ${uploadError.message}`)
  }

  // Create attachment record
  const { data: attachment, error: attachmentError } = await supabase
    .from('chat_attachments')
    .insert({
      conversation_id: conversationId,
      filename: file.name,
      file_type: file.type,
      file_size: file.size,
      storage_path: uploadData.path,
      uploaded_by: userId
    })
    .select()
    .single()

  if (attachmentError) {
    throw new Error(`Failed to create attachment record: ${attachmentError.message}`)
  }

  return {
    id: attachment.id,
    messageId: attachment.message_id,
    filename: attachment.filename,
    fileType: attachment.file_type,
    fileSize: attachment.file_size,
    storagePath: attachment.storage_path,
    uploadedAt: attachment.uploaded_at
  }
}

export async function getChatAttachmentUrl(storagePath: string): Promise<string> {
  const supabase = createClient()

  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(storagePath, 3600) // 1 hour expiry

  if (error) {
    throw new Error(`Failed to get attachment URL: ${error.message}`)
  }

  return data.signedUrl
}
```

**Migration for Chat Attachments:**
```sql
-- Add to migrations
CREATE TABLE chat_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id),
  CONSTRAINT fk_message FOREIGN KEY (message_id) REFERENCES messages(id),
  CONSTRAINT fk_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

CREATE INDEX idx_chat_attachments_conversation_id ON chat_attachments(conversation_id);
CREATE INDEX idx_chat_attachments_message_id ON chat_attachments(message_id);

-- Update messages table to support attachments
ALTER TABLE messages ADD COLUMN attachments JSONB DEFAULT '[]'::jsonb;
```

### Milestone 2 Checklist

- [ ] Decide: AppSync GraphQL OR Supabase Realtime (RECOMMEND Supabase)
- [ ] If GraphQL: Set up AWS AppSync
- [ ] If GraphQL: Create resolvers for all queries/mutations
- [ ] If GraphQL: Configure subscriptions
- [ ] If Supabase: Implement realtime message hook
- [ ] Create chat attachments table migration
- [ ] Implement file upload in chat
- [ ] Build realtime notifications hook
- [ ] Add browser notification support
- [ ] Create notification sound asset
- [ ] Build notification UI component
- [ ] Implement mark as read functionality
- [ ] Test real-time message delivery
- [ ] Test file uploads in chat
- [ ] Test notifications across roles
- [ ] Performance testing with 100+ messages

**Estimated Time:**
- GraphQL AppSync: 10 days
- Supabase Realtime: 4-5 days ✅ **RECOMMENDED**

**Cost: $800 (Could reduce to $400 with Supabase)**

---

## MILESTONE 3: User Profile & Dashboard Counters

### Database Schema Updates

```sql
-- Add profile fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/New_York';
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS sms_notifications BOOLEAN DEFAULT false;

-- Add preferences JSONB column
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{
  "theme": "system",
  "language": "en",
  "dateFormat": "MM/DD/YYYY",
  "emailDigest": "daily"
}'::jsonb;

-- Client profile extensions
ALTER TABLE clients ADD COLUMN IF NOT EXISTS ssn_last_4 TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS filing_status TEXT CHECK (filing_status IN ('single', 'married_jointly', 'married_separately', 'head_of_household', 'widow'));
ALTER TABLE clients ADD COLUMN IF NOT EXISTS dependents INTEGER DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS occupation TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS employer TEXT;

-- Tax pro profile extensions
ALTER TABLE tax_professionals ADD COLUMN IF NOT EXISTS firm_name TEXT;
ALTER TABLE tax_professionals ADD COLUMN IF NOT EXISTS years_experience INTEGER;
ALTER TABLE tax_professionals ADD COLUMN IF NOT EXISTS certifications TEXT[];
ALTER TABLE tax_professionals ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2);
ALTER TABLE tax_professionals ADD COLUMN IF NOT EXISTS availability_hours JSONB;

-- Create dashboard counters table for caching
CREATE TABLE IF NOT EXISTS dashboard_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  unread_messages INTEGER DEFAULT 0,
  pending_requests INTEGER DEFAULT 0,
  new_documents INTEGER DEFAULT 0,
  total_documents INTEGER DEFAULT 0,
  active_clients INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE UNIQUE INDEX idx_dashboard_counters_user_id ON dashboard_counters(user_id);

-- Create function to update dashboard counters
CREATE OR REPLACE FUNCTION update_dashboard_counters(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_user_role TEXT;
  v_unread_messages INTEGER;
  v_pending_requests INTEGER;
  v_new_documents INTEGER;
  v_total_documents INTEGER;
  v_active_clients INTEGER;
BEGIN
  -- Get user role
  SELECT role INTO v_user_role FROM users WHERE id = p_user_id;

  -- Count unread messages
  SELECT COUNT(*) INTO v_unread_messages
  FROM messages
  WHERE recipient_id = p_user_id AND is_read = false;

  IF v_user_role = 'client' THEN
    -- Client-specific counters
    SELECT COUNT(*) INTO v_pending_requests
    FROM document_requests
    WHERE client_id = p_user_id AND status = 'pending';

    SELECT COUNT(*) INTO v_total_documents
    FROM files
    WHERE client_id = p_user_id;

    SELECT COUNT(*) INTO v_new_documents
    FROM files
    WHERE client_id = p_user_id
      AND uploaded_at > NOW() - INTERVAL '7 days';

    v_active_clients := 0;

  ELSIF v_user_role = 'tax_pro' THEN
    -- Tax pro-specific counters
    SELECT COUNT(DISTINCT dr.client_id) INTO v_pending_requests
    FROM document_requests dr
    INNER JOIN clients c ON dr.client_id = c.id
    INNER JOIN tax_professionals tp ON c.assigned_tax_pro_id = tp.id
    WHERE tp.user_id = p_user_id AND dr.status = 'pending';

    SELECT COUNT(DISTINCT f.client_id) INTO v_total_documents
    FROM files f
    INNER JOIN clients c ON f.client_id = c.id
    INNER JOIN tax_professionals tp ON c.assigned_tax_pro_id = tp.id
    WHERE tp.user_id = p_user_id;

    SELECT COUNT(DISTINCT f.client_id) INTO v_new_documents
    FROM files f
    INNER JOIN clients c ON f.client_id = c.id
    INNER JOIN tax_professionals tp ON c.assigned_tax_pro_id = tp.id
    WHERE tp.user_id = p_user_id
      AND f.uploaded_at > NOW() - INTERVAL '7 days';

    SELECT COUNT(*) INTO v_active_clients
    FROM clients c
    INNER JOIN tax_professionals tp ON c.assigned_tax_pro_id = tp.id
    WHERE tp.user_id = p_user_id AND c.onboarding_completed = true;

  ELSE
    -- Admin counters (system-wide)
    v_pending_requests := 0;
    v_total_documents := 0;
    v_new_documents := 0;
    v_active_clients := 0;
  END IF;

  -- Insert or update counters
  INSERT INTO dashboard_counters (
    user_id,
    unread_messages,
    pending_requests,
    new_documents,
    total_documents,
    active_clients,
    updated_at
  ) VALUES (
    p_user_id,
    v_unread_messages,
    v_pending_requests,
    v_new_documents,
    v_total_documents,
    v_active_clients,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    unread_messages = EXCLUDED.unread_messages,
    pending_requests = EXCLUDED.pending_requests,
    new_documents = EXCLUDED.new_documents,
    total_documents = EXCLUDED.total_documents,
    active_clients = EXCLUDED.active_clients,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Create triggers to auto-update counters
CREATE OR REPLACE FUNCTION trigger_update_dashboard_counters()
RETURNS TRIGGER AS $$
BEGIN
  -- Update counters for affected users
  IF TG_OP = 'INSERT' THEN
    IF TG_TABLE_NAME = 'messages' THEN
      PERFORM update_dashboard_counters(NEW.recipient_id);
    ELSIF TG_TABLE_NAME = 'files' THEN
      -- Update client counters
      PERFORM update_dashboard_counters(NEW.client_id);
      -- Update assigned tax pro counters
      PERFORM update_dashboard_counters(
        (SELECT tp.user_id FROM clients c
         INNER JOIN tax_professionals tp ON c.assigned_tax_pro_id = tp.id
         WHERE c.id = NEW.client_id)
      );
    ELSIF TG_TABLE_NAME = 'document_requests' THEN
      PERFORM update_dashboard_counters(NEW.client_id);
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF TG_TABLE_NAME = 'messages' AND OLD.is_read != NEW.is_read THEN
      PERFORM update_dashboard_counters(NEW.recipient_id);
    ELSIF TG_TABLE_NAME = 'document_requests' AND OLD.status != NEW.status THEN
      PERFORM update_dashboard_counters(NEW.client_id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER trigger_messages_dashboard_counters
AFTER INSERT OR UPDATE ON messages
FOR EACH ROW EXECUTE FUNCTION trigger_update_dashboard_counters();

CREATE TRIGGER trigger_files_dashboard_counters
AFTER INSERT ON files
FOR EACH ROW EXECUTE FUNCTION trigger_update_dashboard_counters();

CREATE TRIGGER trigger_requests_dashboard_counters
AFTER INSERT OR UPDATE ON document_requests
FOR EACH ROW EXECUTE FUNCTION trigger_update_dashboard_counters();
```

### Profile Management API

```typescript
// lib/api/profile.ts
import { createClient } from '@/lib/db/supabase'

export interface UserProfile {
  id: string
  email: string
  name: string
  role: 'admin' | 'tax_pro' | 'client'
  phone?: string
  avatarUrl?: string
  bio?: string
  timezone: string
  emailNotifications: boolean
  smsNotifications: boolean
  preferences: {
    theme: 'light' | 'dark' | 'system'
    language: string
    dateFormat: string
    emailDigest: 'realtime' | 'daily' | 'weekly' | 'never'
  }
}

export interface ClientProfile extends UserProfile {
  ssnLast4?: string
  dateOfBirth?: string
  filingStatus?: 'single' | 'married_jointly' | 'married_separately' | 'head_of_household' | 'widow'
  dependents: number
  occupation?: string
  employer?: string
  address?: {
    street: string
    city: string
    state: string
    zip: string
  }
  assignedTaxProId?: string
  assignedTaxProName?: string
}

export interface TaxProProfile extends UserProfile {
  firmName?: string
  licenseNumber?: string
  yearsExperience?: number
  certifications: string[]
  specializations: string[]
  hourlyRate?: number
  maxClients: number
  activeClients: number
  availabilityHours?: Record<string, { start: string; end: string }>
}

export async function getUserProfile(userId: string): Promise<UserProfile> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw new Error(`Failed to fetch profile: ${error.message}`)

  return {
    id: data.id,
    email: data.email,
    name: data.name,
    role: data.role,
    phone: data.phone,
    avatarUrl: data.avatar_url,
    bio: data.bio,
    timezone: data.timezone,
    emailNotifications: data.email_notifications,
    smsNotifications: data.sms_notifications,
    preferences: data.preferences
  }
}

export async function getClientProfile(userId: string): Promise<ClientProfile> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      client:clients!clients_user_id_fkey (
        *,
        tax_pro:tax_professionals!clients_assigned_tax_pro_id_fkey (
          user:users!tax_professionals_user_id_fkey (name)
        )
      )
    `)
    .eq('id', userId)
    .single()

  if (error) throw new Error(`Failed to fetch client profile: ${error.message}`)

  const clientData = data.client[0]

  return {
    id: data.id,
    email: data.email,
    name: data.name,
    role: 'client',
    phone: data.phone,
    avatarUrl: data.avatar_url,
    bio: data.bio,
    timezone: data.timezone,
    emailNotifications: data.email_notifications,
    smsNotifications: data.sms_notifications,
    preferences: data.preferences,
    ssnLast4: clientData?.ssn_last_4,
    dateOfBirth: clientData?.date_of_birth,
    filingStatus: clientData?.filing_status,
    dependents: clientData?.dependents || 0,
    occupation: clientData?.occupation,
    employer: clientData?.employer,
    address: clientData?.address,
    assignedTaxProId: clientData?.assigned_tax_pro_id,
    assignedTaxProName: clientData?.tax_pro?.user?.name
  }
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<UserProfile>
): Promise<UserProfile> {
  const supabase = createClient()

  const dbUpdates: any = {}
  if (updates.name !== undefined) dbUpdates.name = updates.name
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone
  if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl
  if (updates.bio !== undefined) dbUpdates.bio = updates.bio
  if (updates.timezone !== undefined) dbUpdates.timezone = updates.timezone
  if (updates.emailNotifications !== undefined) dbUpdates.email_notifications = updates.emailNotifications
  if (updates.smsNotifications !== undefined) dbUpdates.sms_notifications = updates.smsNotifications
  if (updates.preferences !== undefined) dbUpdates.preferences = updates.preferences

  const { data, error } = await supabase
    .from('users')
    .update(dbUpdates)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw new Error(`Failed to update profile: ${error.message}`)

  // Log audit
  await supabase.from('audit_logs').insert({
    user_id: userId,
    action: 'PROFILE_UPDATED',
    entity_type: 'user',
    entity_id: userId,
    details: updates
  })

  return getUserProfile(userId)
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const supabase = createClient()

  // Delete old avatar if exists
  const { data: user } = await supabase
    .from('users')
    .select('avatar_url')
    .eq('id', userId)
    .single()

  if (user?.avatar_url) {
    const oldPath = user.avatar_url.split('/').pop()
    if (oldPath) {
      await supabase.storage
        .from('avatars')
        .remove([`${userId}/${oldPath}`])
    }
  }

  // Upload new avatar
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}.${fileExt}`
  const filePath = `${userId}/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    })

  if (uploadError) throw new Error(`Failed to upload avatar: ${uploadError.message}`)

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath)

  // Update user record
  await supabase
    .from('users')
    .update({ avatar_url: publicUrl })
    .eq('id', userId)

  return publicUrl
}
```

### Dashboard Counters API

```typescript
// lib/api/dashboard.ts
import { createClient } from '@/lib/db/supabase'

export interface DashboardCounters {
  unreadMessages: number
  pendingRequests: number
  newDocuments: number
  totalDocuments: number
  activeClients: number
  updatedAt: string
}

export async function getDashboardCounters(userId: string): Promise<DashboardCounters> {
  const supabase = createClient()

  // Try to get cached counters
  const { data: cached, error: cacheError } = await supabase
    .from('dashboard_counters')
    .select('*')
    .eq('user_id', userId)
    .single()

  // If cached and recent (< 1 minute old), return it
  if (cached && !cacheError) {
    const age = Date.now() - new Date(cached.updated_at).getTime()
    if (age < 60000) { // 1 minute
      return {
        unreadMessages: cached.unread_messages,
        pendingRequests: cached.pending_requests,
        newDocuments: cached.new_documents,
        totalDocuments: cached.total_documents,
        activeClients: cached.active_clients,
        updatedAt: cached.updated_at
      }
    }
  }

  // Otherwise, trigger refresh
  await supabase.rpc('update_dashboard_counters', { p_user_id: userId })

  // Fetch updated counters
  const { data, error } = await supabase
    .from('dashboard_counters')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) throw new Error(`Failed to fetch dashboard counters: ${error.message}`)

  return {
    unreadMessages: data.unread_messages,
    pendingRequests: data.pending_requests,
    newDocuments: data.new_documents,
    totalDocuments: data.total_documents,
    activeClients: data.active_clients,
    updatedAt: data.updated_at
  }
}

export async function refreshDashboardCounters(userId: string): Promise<void> {
  const supabase = createClient()
  await supabase.rpc('update_dashboard_counters', { p_user_id: userId })
}
```

### Dashboard Counters Hook

```typescript
// hooks/useDashboardCounters.ts
import { useEffect, useState } from 'react'
import { getDashboardCounters, DashboardCounters } from '@/lib/api/dashboard'
import { useAuth } from '@/contexts/AuthContext'

export function useDashboardCounters() {
  const { user } = useAuth()
  const [counters, setCounters] = useState<DashboardCounters | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    loadCounters()

    // Refresh every 30 seconds
    const interval = setInterval(loadCounters, 30000)

    return () => clearInterval(interval)
  }, [user?.id])

  const loadCounters = async () => {
    if (!user) return

    try {
      setLoading(true)
      const data = await getDashboardCounters(user.id)
      setCounters(data)
      setError(null)
    } catch (err: any) {
      console.error('Error loading dashboard counters:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return { counters, loading, error, refresh: loadCounters }
}
```

### Milestone 3 Checklist

- [ ] Run database migrations for profile fields
- [ ] Create dashboard_counters table
- [ ] Implement update_dashboard_counters function
- [ ] Create database triggers for auto-updates
- [ ] Create avatars storage bucket in Supabase
- [ ] Implement profile API functions
- [ ] Implement dashboard counters API
- [ ] Create profile management UI
- [ ] Create avatar upload component
- [ ] Implement useDashboardCounters hook
- [ ] Update dashboard to show real counters
- [ ] Add counter badges to navigation
- [ ] Test profile updates
- [ ] Test avatar uploads
- [ ] Test counter accuracy
- [ ] Performance test with 1000+ documents

**Estimated Time: 3 days (1 day faster with existing Supabase)**
**Cost: $250**

---

## MILESTONE 4: Document Management System

### Current State
✅ **Already Built:**
- Document upload UI
- Folder structure UI
- File preview modal
- Grid/list views
- Basic file operations

❌ **Missing:**
- S3 integration (OR continue with Supabase Storage)
- Multi-file upload
- Folder upload
- Advanced access control
- Document versioning
- OCR / metadata extraction

### Enhanced Document Management

**Multi-file Upload Component:**
```typescript
// components/documents/MultiFileUploader.tsx
'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { X, Upload, File, CheckCircle, AlertCircle } from 'lucide-react'

interface UploadFile {
  file: File
  id: string
  progress: number
  status: 'pending' | 'uploading' | 'complete' | 'error'
  error?: string
  url?: string
}

interface MultiFileUploaderProps {
  userId: string
  folderId?: string
  onComplete?: (files: UploadFile[]) => void
  maxFiles?: number
  maxSize?: number // in bytes
  acceptedTypes?: string[]
}

export function MultiFileUploader({
  userId,
  folderId,
  onComplete,
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB
  acceptedTypes = ['image/*', 'application/pdf', '.doc', '.docx', '.xls', '.xlsx']
}: MultiFileUploaderProps) {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map(file => ({
      file,
      id: `${Date.now()}-${Math.random()}`,
      progress: 0,
      status: 'pending'
    }))

    setFiles(prev => [...prev, ...newFiles].slice(0, maxFiles))
  }, [maxFiles])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize,
    accept: acceptedTypes.reduce((acc, type) => {
      acc[type] = []
      return acc
    }, {} as Record<string, string[]>),
    disabled: uploading || files.length >= maxFiles
  })

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  const uploadFiles = async () => {
    setUploading(true)

    for (const uploadFile of files) {
      if (uploadFile.status !== 'pending') continue

      try {
        // Update status
        setFiles(prev =>
          prev.map(f => (f.id === uploadFile.id ? { ...f, status: 'uploading' as const } : f))
        )

        // Upload with progress tracking
        const result = await uploadWithProgress(
          uploadFile.file,
          userId,
          folderId,
          (progress) => {
            setFiles(prev =>
              prev.map(f => (f.id === uploadFile.id ? { ...f, progress } : f))
            )
          }
        )

        // Mark as complete
        setFiles(prev =>
          prev.map(f =>
            f.id === uploadFile.id
              ? { ...f, status: 'complete' as const, progress: 100, url: result.url }
              : f
          )
        )
      } catch (error: any) {
        // Mark as error
        setFiles(prev =>
          prev.map(f =>
            f.id === uploadFile.id
              ? { ...f, status: 'error' as const, error: error.message }
              : f
          )
        )
      }
    }

    setUploading(false)
    onComplete?.(files)
  }

  const allComplete = files.every(f => f.status === 'complete' || f.status === 'error')
  const hasErrors = files.some(f => f.status === 'error')

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-gray-300 hover:border-gray-400'
        } ${uploading || files.length >= maxFiles ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        {isDragActive ? (
          <p className="text-lg">Drop files here...</p>
        ) : (
          <div>
            <p className="text-lg mb-2">Drag & drop files here, or click to select</p>
            <p className="text-sm text-gray-500">
              Maximum {maxFiles} files, up to {Math.round(maxSize / 1024 / 1024)}MB each
            </p>
          </div>
        )}
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map(uploadFile => (
            <div
              key={uploadFile.id}
              className="flex items-center gap-3 p-3 border rounded-lg"
            >
              <File className="h-5 w-5 text-gray-400 flex-shrink-0" />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{uploadFile.file.name}</p>
                <p className="text-xs text-gray-500">
                  {(uploadFile.file.size / 1024).toFixed(0)} KB
                </p>

                {uploadFile.status === 'uploading' && (
                  <Progress value={uploadFile.progress} className="h-1 mt-1" />
                )}

                {uploadFile.status === 'error' && (
                  <p className="text-xs text-red-500 mt-1">{uploadFile.error}</p>
                )}
              </div>

              {uploadFile.status === 'complete' && (
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
              )}

              {uploadFile.status === 'error' && (
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              )}

              {uploadFile.status === 'pending' && !uploading && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(uploadFile.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {files.length > 0 && !allComplete && (
        <Button
          onClick={uploadFiles}
          disabled={uploading}
          className="w-full"
        >
          {uploading ? 'Uploading...' : `Upload ${files.length} file${files.length > 1 ? 's' : ''}`}
        </Button>
      )}

      {allComplete && (
        <div className="text-center text-sm text-gray-600">
          {hasErrors ? (
            <p className="text-red-600">
              Some files failed to upload. Please try again.
            </p>
          ) : (
            <p className="text-green-600">All files uploaded successfully!</p>
          )}
        </div>
      )}
    </div>
  )
}

async function uploadWithProgress(
  file: File,
  userId: string,
  folderId: string | undefined,
  onProgress: (progress: number) => void
): Promise<{ url: string }> {
  const supabase = createClient()

  // Simulate progress for demo (Supabase doesn't support upload progress directly)
  const progressInterval = setInterval(() => {
    onProgress(Math.min(90, Math.random() * 90))
  }, 100)

  try {
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filePath = `${userId}/${folderId || 'root'}/${timestamp}_${sanitizedName}`

    const { data, error } = await supabase.storage
      .from('documents')
      .upload(filePath, file)

    if (error) throw error

    onProgress(100)

    // Create database record
    await supabase.from('files').insert({
      client_id: userId,
      folder_id: folderId,
      filename: file.name,
      storage_path: data.path,
      file_size: file.size,
      file_type: file.type,
      uploaded_by: userId
    })

    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(data.path)

    return { url: publicUrl }
  } finally {
    clearInterval(progressInterval)
  }
}
```

**Access Control (Row Level Security Policies):**
```sql
-- Enable RLS on all tables
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_requests ENABLE ROW LEVEL SECURITY;

-- Files policies
CREATE POLICY "Users can view their own files"
  ON files FOR SELECT
  USING (
    uploaded_by = auth.uid() OR
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    ) OR
    client_id IN (
      SELECT c.id FROM clients c
      INNER JOIN tax_professionals tp ON c.assigned_tax_pro_id = tp.id
      WHERE tp.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can upload their own files"
  ON files FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid() AND (
      client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()) OR
      EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'tax_pro')
    )
  );

CREATE POLICY "Users can update their own files"
  ON files FOR UPDATE
  USING (
    uploaded_by = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can delete their own files"
  ON files FOR DELETE
  USING (
    uploaded_by = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Folders policies
CREATE POLICY "Users can view their own folders"
  ON folders FOR SELECT
  USING (
    created_by = auth.uid() OR
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()) OR
    client_id IN (
      SELECT c.id FROM clients c
      INNER JOIN tax_professionals tp ON c.assigned_tax_pro_id = tp.id
      WHERE tp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own folders"
  ON folders FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
  );
```

### Milestone 4 Checklist

- [ ] Decide: S3 or Supabase Storage (RECOMMEND Supabase)
- [ ] Implement multi-file uploader component
- [ ] Add drag-and-drop support
- [ ] Implement upload progress tracking
- [ ] Create RLS policies for document security
- [ ] Implement folder upload functionality
- [ ] Add document versioning
- [ ] Implement file sharing via links
- [ ] Add document tagging system
- [ ] Create advanced search/filter
- [ ] Implement bulk operations (move, delete)
- [ ] Add document preview for more types
- [ ] Test with large files (50MB+)
- [ ] Test concurrent uploads
- [ ] Load testing with 100+ files

**Estimated Time: 7 days (50% faster using Supabase)**
**Cost: $750 (Could reduce to $400)**

---

## MILESTONE 5: Testing, Optimization & Production Release

### Testing Strategy

**Unit Testing Setup:**
```typescript
// __tests__/api/documents.test.ts
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { uploadDocument, getDocuments, deleteDocument } from '@/lib/api/documents'
import { createClient } from '@/lib/db/supabase'

describe('Document API', () => {
  let testUserId: string
  let testFile: File

  beforeEach(async () => {
    // Create test user
    const supabase = createClient()
    const { data } = await supabase.from('users').insert({
      email: 'test@example.com',
      name: 'Test User',
      role: 'client'
    }).select().single()

    testUserId = data.id
    testFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
  })

  afterEach(async () => {
    // Clean up test data
    const supabase = createClient()
    await supabase.from('users').delete().eq('id', testUserId)
  })

  it('should upload a document', async () => {
    const result = await uploadDocument(testFile, testUserId)

    expect(result).toHaveProperty('id')
    expect(result.filename).toBe('test.pdf')
    expect(result.userId).toBe(testUserId)
  })

  it('should retrieve documents', async () => {
    await uploadDocument(testFile, testUserId)

    const documents = await getDocuments(testUserId)

    expect(documents).toHaveLength(1)
    expect(documents[0].filename).toBe('test.pdf')
  })

  it('should delete a document', async () => {
    const uploaded = await uploadDocument(testFile, testUserId)

    await deleteDocument(uploaded.id, uploaded.path)

    const documents = await getDocuments(testUserId)
    expect(documents).toHaveLength(0)
  })
})
```

**Integration Testing:**
```typescript
// __tests__/e2e/auth-flow.test.ts
import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should sign up a new user', async ({ page }) => {
    await page.goto('/signup')

    await page.fill('[name="email"]', 'newuser@example.com')
    await page.fill('[name="password"]', 'SecurePassword123!')
    await page.fill('[name="name"]', 'New User')
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('/verify-email')
    await expect(page.locator('text=Verify your email')).toBeVisible()
  })

  test('should login existing user', async ({ page }) => {
    await page.goto('/login')

    await page.fill('[name="email"]', 'existing@example.com')
    await page.fill('[name="password"]', 'Password123!')
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('/client/dashboard')
  })
})
```

### Performance Optimization

**Image Optimization:**
```typescript
// next.config.mjs
const nextConfig = {
  images: {
    domains: ['your-supabase-project.supabase.co'],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
}

export default nextConfig
```

**Database Query Optimization:**
```sql
-- Add indexes for common queries
CREATE INDEX CONCURRENTLY idx_files_client_folder
  ON files(client_id, folder_id)
  WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY idx_messages_recipient_unread
  ON messages(recipient_id, is_read)
  WHERE is_read = false;

CREATE INDEX CONCURRENTLY idx_document_requests_client_status
  ON document_requests(client_id, status)
  WHERE status != 'fulfilled';

-- Analyze tables
ANALYZE files;
ANALYZE messages;
ANALYZE document_requests;
```

**Caching Strategy:**
```typescript
// lib/cache/redis.ts
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300 // 5 minutes
): Promise<T> {
  // Try cache first
  const cached = await redis.get<T>(key)
  if (cached) return cached

  // Fetch fresh data
  const fresh = await fetcher()

  // Cache it
  await redis.setex(key, ttl, fresh)

  return fresh
}

// Usage in API
export async function getDocuments(userId: string) {
  return getCached(
    `documents:${userId}`,
    () => fetchDocumentsFromDB(userId),
    300 // 5 minutes
  )
}
```

### Security Audit

**Security Headers:**
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
  )

  return response
}
```

**Input Validation:**
```typescript
// lib/validation/schemas.ts
import { z } from 'zod'

export const uploadFileSchema = z.object({
  file: z.instanceof(File)
    .refine(file => file.size <= 10 * 1024 * 1024, 'File must be less than 10MB')
    .refine(
      file => ['image/jpeg', 'image/png', 'application/pdf', 'application/msword'].includes(file.type),
      'Invalid file type'
    ),
  folderId: z.string().uuid().optional(),
})

export const sendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().min(1).max(5000),
  attachments: z.array(z.string().uuid()).max(5).optional(),
})

// Usage
export async function uploadDocument(data: unknown) {
  const validated = uploadFileSchema.parse(data)
  // ... proceed with upload
}
```

### Production Deployment Checklist

**Pre-deployment:**
- [ ] All tests passing
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Error tracking configured (Sentry)
- [ ] Analytics configured (PostHog/Mixpanel)
- [ ] Backup strategy in place
- [ ] Monitoring dashboards created
- [ ] Documentation updated
- [ ] API rate limiting configured
- [ ] DDoS protection enabled

**Deployment:**
- [ ] Database migrations run
- [ ] Environment variables configured
- [ ] DNS configured
- [ ] SSL certificates installed
- [ ] CDN configured
- [ ] Email templates tested
- [ ] Cognito production pool configured
- [ ] Lambda functions deployed
- [ ] Webhooks configured

**Post-deployment:**
- [ ] Smoke tests run
- [ ] User acceptance testing
- [ ] Load testing
- [ ] Monitoring alerts configured
- [ ] Team training completed
- [ ] User documentation published
- [ ] Support system ready
- [ ] Rollback plan tested

**Estimated Time: 5 days**
**Cost: $200**

---

## COST & TIMELINE OPTIMIZATION

### Original Developer Plan
| Milestone | Timeline | Cost |
|-----------|----------|------|
| 1. Backend & Auth | 7 days | $500 |
| 2. Messaging & GraphQL | 10 days | $800 |
| 3. Profile & Counters | 4 days | $250 |
| 4. Document Management | 14 days | $750 |
| 5. Testing & Production | 7 days | $200 |
| **TOTAL** | **42 days** | **$2,500** |

### RECOMMENDED: Optimized with Supabase
| Milestone | Timeline | Cost | Savings |
|-----------|----------|------|---------|
| 1. Backend & Auth | 5 days | $500 | 2 days |
| 2. Supabase Realtime | 5 days | $400 | 5 days, $400 |
| 3. Profile & Counters | 3 days | $250 | 1 day |
| 4. Document Management | 7 days | $400 | 7 days, $350 |
| 5. Testing & Production | 5 days | $200 | 2 days |
| **TOTAL** | **25 days** | **$1,750** | **40% faster, 30% cheaper** |

### Infrastructure Costs (Monthly)

**Current Supabase Stack:**
- Supabase Pro: $25/month
- Vercel Pro: $20/month
- **Total: $45/month**

**Developer's AWS Stack:**
- Cognito: $0 (first 50k MAU free)
- AppSync: ~$50/month (1M queries)
- Lambda: ~$20/month
- DynamoDB: ~$30/month
- S3: ~$10/month
- **Total: $110/month**

**SAVINGS: $65/month = $780/year**

---

## RECOMMENDATIONS

### Priority 1: CRITICAL DECISIONS (Make These NOW)

1. **Database: Supabase PostgreSQL OR AWS DynamoDB?**
   - ✅ RECOMMEND: Keep Supabase PostgreSQL
   - Reason: Already implemented, 40% faster, $750 cheaper

2. **Storage: Supabase Storage OR AWS S3?**
   - ✅ RECOMMEND: Keep Supabase Storage
   - Reason: Integrated, simpler, cheaper

3. **Real-time: Supabase Realtime OR AWS AppSync?**
   - ✅ RECOMMEND: Supabase Realtime
   - Reason: 50% faster, $400 cheaper, already available

### Priority 2: QUICK WINS (Do These First)

1. Turn off demo mode and connect to Cognito (2 days)
2. Implement Supabase Realtime for messaging (3 days)
3. Add dashboard counters with PostgreSQL functions (2 days)
4. Deploy to production (1 day)

**Total: 8 days for MVP**

### Priority 3: FUTURE ENHANCEMENTS

- E-signature integration (DocuSign/HelloSign)
- OCR for document processing (AWS Textract)
- AI tax assistant (OpenAI API)
- Mobile app (React Native)
- Advanced analytics (Metabase)

---

## NEXT STEPS FOR YOUR DEVELOPER

1. **Review this blueprint** (1 hour)
2. **Make architecture decisions** (2 hours)
3. **Set up development environment** (1 day)
4. **Start with Milestone 1** (5 days)
5. **Weekly check-ins with you** (ongoing)

---

## ADDITIONAL RESOURCES

### Code Repositories
- Lambda functions: `/lambda/cognito-post-confirmation/`
- Migration files: `/supabase/migrations/`
- API functions: `/lib/api/`
- React hooks: `/hooks/`

### Documentation
- Supabase: https://supabase.com/docs
- AWS Cognito: https://docs.aws.amazon.com/cognito/
- Next.js: https://nextjs.org/docs
- GraphQL: https://graphql.org/learn/

### Tools
- Database management: pgAdmin, TablePlus
- API testing: Postman, Insomnia
- Monitoring: Sentry, LogRocket
- Performance: Lighthouse, WebPageTest

---

**Questions? Ask me to elaborate on any section!**
