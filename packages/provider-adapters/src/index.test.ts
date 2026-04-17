import { describe, expect, it } from "vitest";
import { OpenAIResponsesAdapter } from "./index";

describe("OpenAIResponsesAdapter", () => {
  it("normalizes rate limit errors as retryable", () => {
    const adapter = new OpenAIResponsesAdapter({} as never);

    expect(adapter.normalizeError(new Error("Rate limit exceeded"))).toEqual({
      provider: "openai",
      type: "rate_limit",
      message: "Rate limit exceeded",
      retryable: true,
    });
  });

  it("normalizes auth errors as non-retryable", () => {
    const adapter = new OpenAIResponsesAdapter({} as never);

    expect(adapter.normalizeError(new Error("API key invalid"))).toEqual({
      provider: "openai",
      type: "auth",
      message: "API key invalid",
      retryable: false,
    });
  });
});
