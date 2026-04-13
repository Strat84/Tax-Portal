# Tax Client Portal

A modern, secure tax document management and collaboration platform built with Next.js 14 and AWS services.

## 🎯 Overview

The Tax Client Portal is a comprehensive platform that facilitates seamless collaboration between tax professionals and their clients. It provides secure document management, structured document request workflows, real-time messaging, and progress tracking for tax returns.

## ✨ Features

### For Clients
- **Secure Authentication**: Multi-factor authentication via AWS Cognito
- **Document Management**: Upload, organize, and manage tax documents in folders
- **Document Requests**: Receive and fulfill specific document requests from tax professionals
- **File Preview**: View PDFs and images without downloading
- **Real-time Messaging**: Communicate directly with your tax professional
- **Progress Tracking**: Monitor the status of your tax return through visual stages
- **Mobile Responsive**: Full functionality on desktop, tablet, and mobile devices

### For Tax Professionals
- **Client Management**: View and manage all assigned clients
- **Document Requests**: Request specific documents with priorities and deadlines
- **Bulk Requests**: Request the same document from multiple clients at once
- **Document Review**: Preview, approve, or reject client-uploaded documents
- **Client Communication**: Message clients individually or in groups
- **Status Updates**: Update client tax return status through workflow stages
- **Dashboard Analytics**: View statistics on clients, documents, and requests

### For Administrators
- **System Overview**: Monitor platform-wide activity and health
- **User Management**: Manage tax professionals and client accounts
- **Audit Logs**: Complete audit trail of all user actions
- **Analytics**: View system-wide reports and metrics
- **Message Monitoring**: Oversee all platform communications

## 🏗️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS, Shadcn/ui components
- **Authentication**: AWS Cognito with MFA support
- **Database**: AWS DynamoDB
- **API**: AWS AppSync GraphQL
- **Storage**: AWS S3 for documents
- **Email**: Resend for transactional emails
- **Deployment**: AWS Amplify (recommended)

## 📁 Project Structure

```
tax-portal/
├── app/                          # Next.js 14 app directory
│   ├── (auth)/                   # Authentication pages
│   │   ├── login/
│   │   ├── signup/
│   │   ├── verify-email/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   ├── (dashboard)/              # Dashboard pages
│   │   ├── client/               # Client-specific pages
│   │   ├── tax-pro/              # Tax professional pages
│   │   └── admin/                # Admin pages
│   ├── layout.tsx                # Root layout with providers
│   ├── page.tsx                  # Landing page
│   └── globals.css               # Global styles
├── components/                   # Reusable components
│   ├── documents/                # Document-related components
│   ├── files/                    # File management components
│   ├── layout/                   # Layout components
│   ├── providers/                # Context providers
│   └── ui/                       # Shadcn/ui components
├── contexts/                     # React contexts
│   └── AuthContext.tsx           # Authentication context
├── hooks/                        # Custom React hooks
│   ├── useFileQuery.ts
│   ├── useDocumentRequests.ts
│   ├── useMessages.ts
│   └── useUserQuery.ts
├── lib/                          # Library code
│   ├── appsync/                  # GraphQL client
│   ├── auth/                     # Authentication utilities
│   └── storage/                  # S3 file operations
├── graphql/                      # GraphQL queries and mutations
│   ├── queries/
│   └── mutation/
├── docs/                         # Documentation
└── public/                       # Static assets
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ and npm
- AWS Account (for Cognito, AppSync, DynamoDB, and S3)
- Resend Account (for emails)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd tax-portal
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```env
# AWS Cognito - Development
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_xxxxx
NEXT_PUBLIC_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_AWS_REGION=us-east-1

# AWS Cognito - Production (optional)
NEXT_PUBLIC_COGNITO_USER_POOL_ID_PROD=us-east-1_yyyyy
NEXT_PUBLIC_COGNITO_CLIENT_ID_PROD=yyyyyyyyyyyyyyyyyyyyy

# AWS AppSync GraphQL API
NEXT_PUBLIC_GRAPHQL_API_URL=https://xxxxx.appsync-api.us-east-1.amazonaws.com/graphql
NEXT_PUBLIC_API_KEY=da2-xxxxxxxxxxxxxxxxxxxxx

# Resend
RESEND_API_KEY=re_xxxxx

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Set Up AWS Cognito

1. **Create User Pool**:
   - Go to AWS Cognito Console
   - Create a new User Pool
   - Configure sign-in options: Email
   - Enable MFA (optional but recommended)
   - Create app client (no client secret)

2. **Add Custom Attributes**:
   - `custom:role` (String) - Values: "admin", "tax_pro", "client"
   - `custom:tax_pro_id` (String) - For client assignments

3. **Configure User Groups**:
   - Create groups: "admins", "tax_professionals", "clients"

### 5. Set Up AWS AppSync (GraphQL API)

1. **Create AppSync API**:
   - Go to AWS AppSync Console
   - Create a new GraphQL API
   - Choose "Build from scratch"
   - Configure API name and authorization mode (API Key + Cognito)

2. **Create DynamoDB Tables**:
   - Create tables for: users, files, conversations, messages, document_requests
   - Configure GSI (Global Secondary Indexes) as needed
   - Connect tables to AppSync data sources

3. **Deploy GraphQL Schema**:
   - Upload your GraphQL schema to AppSync
   - Configure resolvers for queries and mutations
   - Test queries in AppSync console

### 6. Set Up AWS S3 Storage

1. **Create S3 Bucket**:
   - Go to AWS S3 Console
   - Create bucket for document storage
   - Enable versioning (recommended)

2. **Configure CORS**:
   - Add CORS policy for file uploads/downloads
   - Allow origins: your app domain

3. **Set Up IAM Permissions**:
   - Create IAM role for authenticated users
   - Grant S3 read/write permissions to user folders
   - Configure bucket policies

### 7. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 📚 Key Features Documentation

### Authentication System
- JWT token validation
- Role-based access control
- Protected routes via middleware
- See `/contexts/AuthContext.tsx`

### Document Request System
- [Document Request System](./docs/DOCUMENT_REQUEST_SYSTEM.md)
- Structured request workflow
- Priority management
- Automatic status updates
- Approval/rejection workflow

### File Preview System
- [File Preview System](./docs/FILE_PREVIEW_SYSTEM.md)
- Multi-format support (PDF, images)
- Zoom controls
- Keyboard navigation
- Mobile responsive

## 🔒 Security Features

- **Authentication**: AWS Cognito with MFA support
- **Authorization**: Fine-grained access control via AppSync resolvers
- **JWT Validation**: Server-side token verification
- **File Security**: Signed S3 URLs with expiration
- **Audit Logging**: Complete activity trail in DynamoDB
- **HTTPS**: Enforced in production
- **CORS**: Configured for secure file access
- **Input Validation**: Client and server-side

## 🎨 UI/UX Features

- **Modern Design**: Clean, professional interface
- **Dark Mode**: Full dark mode support
- **Responsive**: Mobile-first design
- **Accessibility**: ARIA labels, keyboard navigation
- **Loading States**: Progress indicators throughout
- **Error Handling**: User-friendly error messages
- **File Icons**: Visual file type indicators
- **Status Colors**: Intuitive color coding

## 🧪 Testing

```bash
# Run type checking
npm run typecheck

# Run linting
npm run lint
```

## 📦 Building for Production

```bash
# Create production build
npm run build

# Preview production build
npm run start
```

## 🚢 Deployment

### Deploy to AWS Amplify

1. **Connect Repository**:
   - Go to AWS Amplify Console
   - Connect your Git repository

2. **Configure Build Settings**:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
         - .next/cache/**/*
   ```

3. **Add Environment Variables**:
   - Add all environment variables from `.env.local`
   - Ensure production Cognito credentials are used

4. **Deploy**:
   - Push to main branch to trigger deployment
   - Monitor build logs

### Alternative: Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

## 🔧 Configuration

### Cognito Configuration

Edit `lib/auth/cognito.ts` to customize:
- Password requirements
- MFA settings
- User attributes
- Sign-in options

### GraphQL API Configuration

Edit `lib/appsync/client.ts` for:
- API endpoint configuration
- Authentication settings
- Error handling

### Email Configuration

Edit email templates in Resend dashboard or create custom templates.

## 📝 Development Workflow

### Adding a New Page

1. Create page in appropriate directory
2. Add route to layout navigation
3. Implement page with useAuth hook
4. Add API calls if needed
5. Test authentication and permissions

### Adding a New Feature

1. Update GraphQL schema in AppSync if needed
2. Add queries/mutations to `graphql/` directory
3. Create custom hook in `hooks/` using GraphQL client
4. Build UI components
5. Integrate with pages
6. Update documentation

## 🐛 Troubleshooting

### Common Issues

**Authentication not working**:
- Verify Cognito credentials in `.env.local`
- Check Amplify configuration
- Ensure cookies are enabled

**GraphQL queries failing**:
- Verify AppSync API endpoint in `.env.local`
- Check API key and Cognito authentication
- Review resolver configurations in AppSync console
- Check network connectivity

**File upload not working**:
- Verify S3 bucket exists and is accessible
- Check IAM permissions for authenticated users
- Verify file size limits in S3 and application
- Check CORS configuration on S3 bucket

**Preview not loading**:
- Check CORS configuration
- Verify signed URL generation
- Check file accessibility

## 📊 Database Schema

The application uses DynamoDB tables with the following structure:

Key tables:
- `users` - All platform users
- `clients` - Client profiles and assignments
- `tax_professionals` - Tax pro profiles
- `files` - Document metadata
- `folders` - Folder structure
- `document_requests` - Document request workflow
- `conversations` - Message threads
- `messages` - Individual messages
- `audit_logs` - Activity tracking

## 🎯 Roadmap

### Phase 2 Features (Planned)
- E-signature integration
- Advanced analytics dashboard
- Email notifications with Resend
- Real-time collaboration
- Mobile app (React Native)
- Tax form generation
- OCR document extraction
- API for third-party integrations

### Phase 3 Features (Future)
- AI-powered document classification
- Automated tax calculations
- Client portal white-labeling
- Multi-language support
- Advanced reporting
- Integration marketplace
- Video consultations
- Payment processing

## 🙏 Acknowledgments

Built with:
- [Next.js](https://nextjs.org/)
- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Shadcn/ui](https://ui.shadcn.com/)
- [AWS Cognito](https://aws.amazon.com/cognito/)
- [AWS AppSync](https://aws.amazon.com/appsync/)
- [AWS S3](https://aws.amazon.com/s3/)
- [AWS DynamoDB](https://aws.amazon.com/dynamodb/)
- [Resend](https://resend.com/)
