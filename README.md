# Tax Client Portal

A modern, secure tax document management and collaboration platform built with Next.js 14, AWS Cognito, and Supabase.

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
- **Database**: PostgreSQL (Supabase)
- **Storage**: Supabase Storage for documents
- **Email**: Resend for transactional emails
- **Deployment**: AWS Amplify (recommended)
- **Serverless**: AWS Lambda for Cognito triggers

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
│   ├── useDocuments.ts
│   ├── useDocumentRequests.ts
│   └── useMessages.ts
├── lib/                          # Library code
│   ├── api/                      # API helper functions
│   ├── auth/                     # Authentication utilities
│   └── db/                       # Database clients
├── lambda/                       # AWS Lambda functions
│   └── cognito-post-confirmation/
├── supabase/                     # Supabase configurations
│   └── migrations/               # Database migrations
├── docs/                         # Documentation
└── public/                       # Static assets
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ and npm
- AWS Account (for Cognito)
- Supabase Account (for database and storage)
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

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

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

4. **Set Up Lambda Triggers**:
   - Deploy the Lambda function from `/lambda/cognito-post-confirmation`
   - Attach to Post-Confirmation trigger
   - See `lambda/cognito-post-confirmation/README.md` for details

### 5. Set Up Supabase

1. **Create Project**: Create a new Supabase project

2. **Run Migrations**:
   ```bash
   # Install Supabase CLI
   npm install -g supabase

   # Link to your project
   supabase link --project-ref <your-project-ref>

   # Run migrations
   supabase db push
   ```

   Or manually run the migrations in Supabase SQL Editor:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_document_requests_enhancement.sql`

3. **Configure Storage**:
   - Create a bucket named `documents`
   - Set up RLS policies for the bucket
   - Configure CORS for file preview

### 6. Run Development Server

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
- **Authorization**: Row-Level Security (RLS) in Supabase
- **JWT Validation**: Server-side token verification
- **File Security**: Signed URLs with expiration
- **Audit Logging**: Complete activity trail
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

### Database Configuration

Edit `lib/db/supabase.ts` for:
- Connection pooling
- Query optimization
- Custom functions

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

1. Create database migration if needed
2. Create API functions in `lib/api/`
3. Create custom hook in `hooks/`
4. Build UI components
5. Integrate with pages
6. Update documentation

## 🐛 Troubleshooting

### Common Issues

**Authentication not working**:
- Verify Cognito credentials in `.env.local`
- Check Amplify configuration
- Ensure cookies are enabled

**Database queries failing**:
- Check RLS policies in Supabase
- Verify service role key for admin operations
- Check network connectivity

**File upload not working**:
- Verify Supabase Storage bucket exists
- Check storage RLS policies
- Verify file size limits

**Preview not loading**:
- Check CORS configuration
- Verify signed URL generation
- Check file accessibility

## 📊 Database Schema

See `supabase/migrations/` for complete schema.

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
- [Supabase](https://supabase.com/)
- [Resend](https://resend.com/)
