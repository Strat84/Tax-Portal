# Cognito Post-Confirmation Lambda Function

This Lambda function is triggered automatically after a user confirms their email address in AWS Cognito. It creates a corresponding user record in the PostgreSQL database and sets up initial data.

## What This Function Does

1. **Creates User Record**: Inserts the user into the `users` table with data from Cognito
2. **Creates Client Record**: If the user is a client, creates an entry in the `clients` table
3. **Creates Tax Pro Record**: If the user is a tax professional, creates an entry in the `tax_professionals` table
4. **Creates Default Folders**: Sets up default folder structure for new clients (W2s, 1099s, Receipts, Other)
5. **Assigns Tax Professional**: If a client was invited by a tax pro, creates the relationship
6. **Logs Activity**: Creates an audit log entry for the signup

## Environment Variables

The following environment variables must be configured in AWS Lambda:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (for admin access)

## Deployment Steps

### 1. Install Dependencies

```bash
cd lambda/cognito-post-confirmation
npm install
```

### 2. Build the Function

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` directory.

### 3. Package the Function

```bash
npm run package
```

This creates a `function.zip` file containing the compiled code and dependencies.

### 4. Deploy to AWS Lambda

#### Option A: AWS Console

1. Go to AWS Lambda Console
2. Click "Create function"
3. Choose "Author from scratch"
4. Function name: `cognito-post-confirmation`
5. Runtime: Node.js 20.x
6. Click "Create function"
7. Upload the `function.zip` file
8. Set handler to: `dist/index.handler`
9. Add environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
10. Set timeout to 30 seconds (recommended)
11. Set memory to 256 MB

#### Option B: AWS CLI

```bash
# Create the function
aws lambda create-function \
  --function-name cognito-post-confirmation \
  --runtime nodejs20.x \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-execution-role \
  --handler dist/index.handler \
  --zip-file fileb://function.zip \
  --timeout 30 \
  --memory-size 256 \
  --environment Variables="{SUPABASE_URL=your-url,SUPABASE_SERVICE_ROLE_KEY=your-key}"

# Update the function (for subsequent deploys)
aws lambda update-function-code \
  --function-name cognito-post-confirmation \
  --zip-file fileb://function.zip
```

### 5. Configure Cognito Trigger

1. Go to AWS Cognito Console
2. Select your User Pool
3. Go to "User pool properties" → "Lambda triggers"
4. Click "Add Lambda trigger"
5. Trigger type: "Authentication"
6. Authentication trigger: "Post confirmation trigger"
7. Assign Lambda function: Select `cognito-post-confirmation`
8. Click "Add Lambda trigger"

### 6. Grant Lambda Permissions

The Lambda execution role needs permission to be invoked by Cognito:

```bash
aws lambda add-permission \
  --function-name cognito-post-confirmation \
  --statement-id cognito-trigger \
  --action lambda:InvokeFunction \
  --principal cognito-idp.amazonaws.com \
  --source-arn arn:aws:cognito-idp:REGION:ACCOUNT_ID:userpool/USER_POOL_ID
```

## Testing

You can test the function by:

1. Creating a test event in Lambda Console with the following structure:

```json
{
  "version": "1",
  "region": "us-east-1",
  "userPoolId": "us-east-1_XXXXXXXXX",
  "userName": "test-user-123",
  "triggerSource": "PostConfirmation_ConfirmSignUp",
  "request": {
    "userAttributes": {
      "sub": "12345678-1234-1234-1234-123456789012",
      "email": "test@example.com",
      "email_verified": "true",
      "name": "Test User",
      "phone_number": "+15555551234",
      "custom:role": "client"
    }
  },
  "response": {}
}
```

2. Or by actually signing up a new user through your application

## Monitoring

Check CloudWatch Logs for the Lambda function to see:
- User creation logs
- Any errors that occur
- Audit trail of all operations

## Troubleshooting

### User Not Created in Database

1. Check CloudWatch Logs for errors
2. Verify Supabase credentials are correct
3. Ensure Lambda has internet access (VPC configuration if needed)
4. Check RLS policies in Supabase (service role key should bypass RLS)

### Timeout Errors

- Increase Lambda timeout (default is 3 seconds, recommended 30 seconds)
- Check Supabase API response times

### Permission Errors

- Verify Lambda execution role has basic execution permissions
- Ensure Cognito has permission to invoke the Lambda function

## Updating the Function

After making code changes:

```bash
npm run build
npm run package
aws lambda update-function-code \
  --function-name cognito-post-confirmation \
  --zip-file fileb://function.zip
```

## Local Development

To test locally without deploying:

```bash
npm install
npm run build
node -e "require('./dist/index').handler({ ... test event ... }).then(console.log)"
```

## Cost Considerations

- Lambda invocations: First 1M requests/month are free, then $0.20 per 1M requests
- Duration: First 400,000 GB-seconds/month free
- This function typically runs in < 1 second, so costs are minimal

## Security Notes

- Never commit `.env` files or credentials to git
- Use AWS Secrets Manager for sensitive values in production
- Service role key has full database access - protect it carefully
- Lambda function logs may contain PII - configure log retention appropriately
