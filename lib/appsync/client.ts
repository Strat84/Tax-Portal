// src/lib/gqlClient.ts
"use client";

import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/api";
import awsConfig from "../../src/aws-exports";

const customConfig = {
  aws_appsync_graphqlEndpoint:
  process.env.NEXT_PUBLIC_GRAPHQL_API_URL,
  aws_appsync_region: process.env.NEXT_PUBLIC_AWS_REGION,
  aws_appsync_authenticationType: "AMAZON_COGNITO_USER_POOLS",
  aws_appsync_apiKey: process.env.NEXT_PUBLIC_API_KEY,
};
// Configure Amplify before creating client
// This ensures the client has access to auth configuration for subscriptions
if (typeof window !== "undefined") {
  Amplify.configure(
    {
      ...awsConfig,
      ...customConfig,
    },
    { ssr: false }
  );
}

export const gqlClient = generateClient();
