import type { SQSEvent, SQSBatchResponse } from "aws-lambda";

export async function handler(event: SQSEvent): Promise<SQSBatchResponse> {
  for (const record of event.Records) {
    console.log("queue_record", {
      messageId: record.messageId,
      body: record.body,
    });
  }

  return { batchItemFailures: [] };
}
