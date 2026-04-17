import OpenAI from "openai";
import type { ProviderId } from "@control-center/domain";

export type ProviderMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ProviderInvokeInput = {
  provider: ProviderId;
  model: string;
  messages: ProviderMessage[];
};

export type ProviderUsage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  provider: ProviderId;
  model: string;
};

export type ProviderInvokeOutput = {
  text: string;
  usage: ProviderUsage;
  raw: unknown;
};

export type NormalizedProviderError = {
  provider: ProviderId;
  type: "rate_limit" | "auth" | "validation" | "transient" | "unknown";
  message: string;
  retryable: boolean;
};

export interface ProviderAdapter {
  readonly provider: ProviderId;
  invokeModel(input: ProviderInvokeInput): Promise<ProviderInvokeOutput>;
  normalizeError(error: unknown): NormalizedProviderError;
}

export class OpenAIResponsesAdapter implements ProviderAdapter {
  readonly provider = "openai" as const;

  constructor(private readonly client: OpenAI) {}

  async invokeModel(input: ProviderInvokeInput): Promise<ProviderInvokeOutput> {
    const response = await this.client.responses.create({
      model: input.model,
      input: input.messages.map((message) => ({
        role: message.role,
        content: [
          {
            type: message.role === "assistant" ? "output_text" : "input_text",
            text: message.content,
          },
        ],
      })) as never,
    });

    return {
      text: response.output_text ?? "",
      usage: {
        promptTokens: response.usage?.input_tokens ?? 0,
        completionTokens: response.usage?.output_tokens ?? 0,
        totalTokens: response.usage?.total_tokens ?? 0,
        provider: "openai",
        model: input.model,
      },
      raw: response,
    };
  }

  normalizeError(error: unknown): NormalizedProviderError {
    const message = error instanceof Error ? error.message : "Unknown provider error";

    if (message.toLowerCase().includes("rate")) {
      return {
        provider: "openai",
        type: "rate_limit",
        message,
        retryable: true,
      };
    }

    if (message.toLowerCase().includes("auth") || message.toLowerCase().includes("key")) {
      return {
        provider: "openai",
        type: "auth",
        message,
        retryable: false,
      };
    }

    return {
      provider: "openai",
      type: "unknown",
      message,
      retryable: false,
    };
  }
}

export function createOpenAIResponsesAdapter(apiKey: string): OpenAIResponsesAdapter {
  return new OpenAIResponsesAdapter(
    new OpenAI({
      apiKey,
    }),
  );
}
