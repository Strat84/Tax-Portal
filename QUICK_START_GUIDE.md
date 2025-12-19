# Tax Portal - Quick Start Implementation Guide

## 🚀 FASTEST PATH TO PRODUCTION (25 Days)

This guide shows your developer the fastest way to get from your current state to production.

---

## Current State Assessment

### ✅ What You Already Have (Saves ~$1,500 & 3 weeks)

1. **Complete UI** - All pages, components, layouts built
2. **Database Schema** - PostgreSQL via Supabase with full schema
3. **Authentication Structure** - Demo mode ready to connect to Cognito
4. **Document Management UI** - Folder structure, file preview, upload forms
5. **Messaging UI** - Conversation views, message displays
6. **Dashboard Templates** - Client, Tax Pro, and Admin dashboards

### ❌ What You Need to Build

1. **Production Authentication** - Remove demo mode, connect Cognito
2. **Real-time Messaging** - Enable Supabase Realtime subscriptions
3. **Backend APIs** - Connect UI to database
4. **File Uploads** - Wire up Supabase Storage
5. **Deployment** - CI/CD and production environment

---

## Week 1: Authentication & Backend Foundation (5 days)

### Day 1-2: AWS Cognito Setup

**Morning: Create Cognito User Pool**
```bash
# 1. Create user pool
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
  --auto-verified-attributes email \
  --mfa-configuration OPTIONAL

# 2. Create app client
aws cognito-idp create-user-pool-client \
  --user-pool-id <YOUR_POOL_ID> \
  --client-name tax-portal-web \
  --no-generate-secret \
  --explicit-auth-flows ALLOW_USER_SRP_AUTH ALLOW_REFRESH_TOKEN_AUTH

# 3. Add custom attributes
aws cognito-idp add-custom-attributes \
  --user-pool-id <YOUR_POOL_ID> \
  --custom-attributes Name=role,AttributeDataType=String
```

**Afternoon: Update Environment Variables**
```bash
# Update .env.production
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_xxxxx
NEXT_PUBLIC_COGNITO_CLIENT_ID=xxxxxxxxxxxxx
NEXT_PUBLIC_AWS_REGION=us-east-1
```

**Files to Modify:**
- `contexts/AuthContext.tsx` - Change `DEMO_MODE = false`
- `middleware.ts` - Change `DEMO_MODE = false`
- Test login flow

**Deliverable: Working Cognito authentication**

---

### Day 3: Lambda Post-Confirmation Trigger

**Morning: Create Lambda Function**

1. Copy code from `TECHNICAL_BLUEPRINT.md` (search for "Lambda Post-Confirmation Trigger")
2. Create `lambda/cognito-post-confirmation/index.ts`
3. Install dependencies:
```bash
cd lambda/cognito-post-confirmation
npm init -y
npm install @supabase/postgrest-js node-fetch
npm install -D @types/node typescript
```

4. Add build script to `package.json`:
```json
{
  "scripts": {
    "build": "tsc",
    "package": "zip -r function.zip dist node_modules"
  }
}
```

**Afternoon: Deploy Lambda**
```bash
# Build
npm run build

# Package
npm run package

# Create Lambda function
aws lambda create-function \
  --function-name tax-portal-post-confirmation \
  --runtime nodejs20.x \
  --role arn:aws:iam::ACCOUNT_ID:role/lambda-execution-role \
  --handler dist/index.handler \
  --zip-file fileb://function.zip \
  --timeout 30 \
  --memory-size 256 \
  --environment Variables='{
    "SUPABASE_URL":"https://your-project.supabase.co",
    "SUPABASE_SERVICE_KEY":"your-service-key"
  }'

# Attach to Cognito
aws cognito-idp update-user-pool \
  --user-pool-id <YOUR_POOL_ID> \
  --lambda-config PostConfirmation=arn:aws:lambda:us-east-1:ACCOUNT_ID:function:tax-portal-post-confirmation
```

**Deliverable: User creation automatically creates database records**

---

### Day 4-5: Environment Setup & CI/CD

**Create GitHub Actions Workflow**

Copy this to `.github/workflows/deploy.yml`:
```yaml
name: Deploy Tax Portal

on:
  push:
    branches: [main, staging, develop]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

**Configure Secrets in GitHub:**
- `VERCEL_TOKEN`
- `VERCEL_PROJECT_ID`
- All environment variables

**Test Deployment:**
```bash
git push origin develop  # Deploy to dev
git push origin staging  # Deploy to staging
git push origin main     # Deploy to production
```

**Deliverable: Automated deployments working**

---

## Week 2: Messaging & Real-Time Features (5 days)

### Day 6-7: Supabase Realtime Setup

**Enable Realtime on Tables:**
```sql
-- In Supabase SQL Editor
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE files;
ALTER PUBLICATION supabase_realtime ADD TABLE document_requests;
```

**Create Realtime Hook:**

Copy `hooks/useRealtimeMessages.ts` from `TECHNICAL_BLUEPRINT.md`

**Update Message Page:**
```typescript
// app/(dashboard)/client/messages/page.tsx
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages'

export default function MessagesPage() {
  const { messages } = useRealtimeMessages(conversationId)

  return (
    <div>
      {messages.map(msg => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
    </div>
  )
}
```

**Deliverable: Real-time message updates working**

---

### Day 8: Notifications System

**Create Notifications Hook:**

Copy `hooks/useRealtimeNotifications.ts` from `TECHNICAL_BLUEPRINT.md`

**Add to Layout:**
```typescript
// components/layout/DashboardHeader.tsx
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications'

export function DashboardHeader() {
  const { unreadCount, notifications } = useRealtimeNotifications()

  return (
    <header>
      <NotificationBell count={unreadCount} items={notifications} />
    </header>
  )
}
```

**Request Browser Notification Permission:**
```typescript
// On first login
if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission()
}
```

**Deliverable: Desktop notifications for new messages/documents**

---

### Day 9-10: File Uploads in Chat

**Create Chat Attachments Migration:**
```sql
CREATE TABLE chat_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Add Upload Button to Message Compose:**
```typescript
// components/messages/MessageComposer.tsx
import { uploadChatAttachment } from '@/lib/api/chat-attachments'

function MessageComposer() {
  const handleFileUpload = async (file: File) => {
    const attachment = await uploadChatAttachment(file, conversationId, userId)
    // Attach to message
  }

  return (
    <div>
      <input type="file" onChange={e => handleFileUpload(e.target.files[0])} />
      <textarea />
      <button>Send</button>
    </div>
  )
}
```

**Deliverable: Send files in messages**

---

## Week 3: Profiles & Dashboard (3 days)

### Day 11-12: Profile Management

**Run Migration:**
```sql
-- Copy from TECHNICAL_BLUEPRINT.md "Milestone 3" section
ALTER TABLE users ADD COLUMN avatar_url TEXT;
ALTER TABLE users ADD COLUMN bio TEXT;
-- etc...
```

**Create Profile Page:**
```typescript
// app/(dashboard)/client/profile/page.tsx
import { useAuth } from '@/contexts/AuthContext'
import { updateUserProfile, uploadAvatar } from '@/lib/api/profile'

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()

  const handleUpdate = async (data: any) => {
    await updateUserProfile(user.id, data)
    await refreshUser()
  }

  return (
    <ProfileForm user={user} onSubmit={handleUpdate} />
  )
}
```

**Deliverable: Users can edit profiles and upload avatars**

---

### Day 13: Dashboard Counters

**Run Migration:**
```sql
-- Copy dashboard_counters table and functions from TECHNICAL_BLUEPRINT.md
CREATE TABLE dashboard_counters (...);
CREATE FUNCTION update_dashboard_counters(...);
```

**Update Dashboard:**
```typescript
// app/(dashboard)/client/dashboard/page.tsx
import { useDashboardCounters } from '@/hooks/useDashboardCounters'

export default function ClientDashboard() {
  const { counters } = useDashboardCounters()

  return (
    <div>
      <StatCard label="Unread Messages" value={counters.unreadMessages} />
      <StatCard label="Pending Requests" value={counters.pendingRequests} />
      {/* etc */}
    </div>
  )
}
```

**Deliverable: Live dashboard counters**

---

## Week 4: Document Management (7 days)

### Day 14-16: Multi-File Uploader

**Install Dependencies:**
```bash
npm install react-dropzone
```

**Create Component:**

Copy `components/documents/MultiFileUploader.tsx` from `TECHNICAL_BLUEPRINT.md`

**Add to Documents Page:**
```typescript
// app/(dashboard)/client/documents/page.tsx
import { MultiFileUploader } from '@/components/documents/MultiFileUploader'

export default function DocumentsPage() {
  return (
    <div>
      <MultiFileUploader
        userId={user.id}
        folderId={currentFolder?.id}
        onComplete={files => {
          toast.success(`${files.length} files uploaded!`)
          refreshDocuments()
        }}
      />
    </div>
  )
}
```

**Deliverable: Drag & drop multi-file uploads**

---

### Day 17-18: Access Control & Security

**Enable RLS:**
```sql
-- Copy from TECHNICAL_BLUEPRINT.md "Milestone 4"
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own files" ON files FOR SELECT USING (...);
-- etc
```

**Test Access Control:**
1. Log in as client - can only see own files
2. Log in as tax pro - can see all client files
3. Log in as admin - can see all files

**Deliverable: Secure document access**

---

### Day 19-20: File Operations

**Implement:**
- Rename file
- Move to folder
- Delete file
- Share via link
- Download

**Create Context Menu:**
```typescript
// components/documents/FileContextMenu.tsx
<ContextMenu>
  <ContextMenuItem onClick={handleRename}>Rename</ContextMenuItem>
  <ContextMenuItem onClick={handleMove}>Move</ContextMenuItem>
  <ContextMenuItem onClick={handleDownload}>Download</ContextMenuItem>
  <ContextMenuItem onClick={handleDelete}>Delete</ContextMenuItem>
</ContextMenu>
```

**Deliverable: Full file management**

---

## Week 5: Testing & Production (5 days)

### Day 21-22: Testing

**Install Testing Dependencies:**
```bash
npm install -D @playwright/test jest @testing-library/react
```

**Write Tests:**
```typescript
// __tests__/auth.test.ts
test('should login user', async () => {
  // Test login flow
})

// __tests__/documents.test.ts
test('should upload document', async () => {
  // Test upload
})
```

**Run Tests:**
```bash
npm test
npx playwright test
```

**Deliverable: Test coverage > 70%**

---

### Day 23: Performance Optimization

**Add Indexes:**
```sql
CREATE INDEX CONCURRENTLY idx_files_client_folder ON files(client_id, folder_id);
CREATE INDEX CONCURRENTLY idx_messages_recipient_unread ON messages(recipient_id, is_read);
```

**Enable Caching:**
```typescript
// Use React Query or SWR
import { useQuery } from '@tanstack/react-query'

const { data: documents } = useQuery({
  queryKey: ['documents', userId],
  queryFn: () => getDocuments(userId),
  staleTime: 5 * 60 * 1000 // 5 minutes
})
```

**Deliverable: Page load < 2 seconds**

---

### Day 24: Security Audit

**Checklist:**
- [ ] All API endpoints validate input
- [ ] RLS policies tested
- [ ] SQL injection prevention verified
- [ ] XSS protection enabled
- [ ] CSRF tokens implemented
- [ ] Rate limiting configured
- [ ] Error messages don't leak info
- [ ] Secrets not in code

**Tools:**
```bash
npm audit
npm run lint
npx next-secure
```

**Deliverable: Security audit passed**

---

### Day 25: Production Deployment

**Pre-flight Checklist:**
- [ ] All environment variables set
- [ ] Database migrations run
- [ ] Lambda functions deployed
- [ ] DNS configured
- [ ] SSL certificates active
- [ ] Monitoring enabled
- [ ] Backups configured
- [ ] Error tracking (Sentry) active

**Go Live:**
```bash
# Final deployment
git tag v1.0.0
git push origin v1.0.0
git push origin main
```

**Post-deployment:**
1. Smoke test all features
2. Monitor error rates
3. Check performance metrics
4. Verify email delivery
5. Test from multiple devices

**Deliverable: Production application live! 🎉**

---

## Daily Checklist Template

```markdown
### Day X: [Feature Name]

**Morning (4 hours):**
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

**Afternoon (4 hours):**
- [ ] Task 4
- [ ] Task 5
- [ ] Test & verify

**Deliverable:** [What's done today]

**Blockers:** [Any issues]

**Tomorrow:** [What's next]
```

---

## Common Issues & Solutions

### Issue: Cognito signup fails
**Solution:** Check custom attributes are configured correctly

### Issue: Realtime not working
**Solution:** Ensure tables are added to `supabase_realtime` publication

### Issue: File upload fails
**Solution:** Check Supabase Storage bucket exists and RLS policies allow upload

### Issue: Lambda not creating user
**Solution:** Check Lambda logs in CloudWatch, verify Supabase credentials

### Issue: Build fails on Vercel
**Solution:** Check all environment variables are set in Vercel dashboard

---

## Success Metrics

**Week 1:** Authentication working ✅
**Week 2:** Real-time messaging working ✅
**Week 3:** Profiles & dashboards complete ✅
**Week 4:** Document management complete ✅
**Week 5:** Production deployed ✅

**Timeline:** 25 days (17 days faster than original plan)
**Cost:** $1,750 ($750 savings)
**Quality:** Production-ready, tested, secure

---

## Need Help?

1. Check `TECHNICAL_BLUEPRINT.md` for detailed code
2. Review existing code in `/lib/api/` and `/hooks/`
3. Test in development first
4. Use version control (git)
5. Deploy to staging before production

**You've got this! 🚀**
