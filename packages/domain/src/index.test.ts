import { describe, expect, it } from "vitest";
import { agentCreateSchema, locales, seededAgents } from "./index";

describe("domain package", () => {
  it("exports expected locales", () => {
    expect(locales).toEqual(["en", "nl"]);
  });

  it("seeded agents match agent create schema", () => {
    for (const agent of seededAgents) {
      const parsed = agentCreateSchema.safeParse({
        roleKey: agent.roleKey,
        displayName: agent.displayName,
        description: agent.description,
        provider: agent.provider,
        model: agent.model,
        systemPrompt: agent.systemPrompt,
        enabledTools: agent.enabledTools,
        budgetConfig: agent.budgetConfig,
        workflowDefinitionId: agent.workflowDefinitionId,
        status: agent.status,
      });

      expect(parsed.success).toBe(true);
    }
  });
});
