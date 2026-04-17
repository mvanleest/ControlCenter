// SST Infrastructure: Queue
// Drives async run execution and retry flow.

import { controlCenterDynamo } from "./database";
import { controlCenterFiles } from "./storage";
import { realtime } from "./realtime";
import { OpenAiApiKey } from "./secrets";

export const runQueueDlq = new sst.aws.Queue("RunQueueDlq");

export const runQueue = new sst.aws.Queue("RunQueue", {
  visibilityTimeout: "60 seconds",
  dlq: {
    queue: runQueueDlq.arn,
    retry: 3,
  },
});

runQueue.subscribe({
  handler: "packages/api/src/worker.handler",
  runtime: "nodejs24.x",
  timeout: "60 seconds",
  logging: {
    retention: "1 week",
  },
  link: [controlCenterDynamo, controlCenterFiles, runQueue, realtime, OpenAiApiKey],
});

export const outputs = {
  queue: runQueue.url,
};
