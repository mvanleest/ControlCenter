// SST Infrastructure: Lambda API
// Hono-based API running on AWS Lambda with Function URL.

import { controlCenterDynamo } from "./database";
import { infraSettings } from "./settings";
import { runQueue } from "./queue";
import { realtime } from "./realtime";
import { AdminPassword, AdminToken, AdminUsername, OpenAiApiKey } from "./secrets";
import { controlCenterFiles } from "./storage";

export const api = new sst.aws.Function("Api", {
  handler: "packages/api/src/http.handler",
  url: {
    cors: {
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowOrigins: infraSettings.apiCorsAllowOrigins,
    },
  },
  link: [
    controlCenterDynamo,
    controlCenterFiles,
    runQueue,
    realtime,
    AdminUsername,
    AdminPassword,
    AdminToken,
    OpenAiApiKey,
  ],
  runtime: "nodejs24.x",
  timeout: "30 seconds",
  logging: {
    retention: "1 week",
  },
  environment: {
    NODE_OPTIONS: "--enable-source-maps",
  },
  nodejs: {
    install: ["hono", "zod", "@hono/zod-validator"],
  },
});

export const outputs = {
  api: api.url,
};
