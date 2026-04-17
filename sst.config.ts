/// <reference path="./.sst/platform/config.d.ts" />

function sanitizeStage(value: string): string {
  return value
    .replace(/[^a-zA-Z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+/g, "")
    .replace(/-+$/g, "")
    .toLowerCase();
}

export default $config({
  app(input) {
    return {
      name: "control-center",
      home: "aws",
      removal: input.stage === "production" ? "retain" : "remove",
      protect: input.stage === "production",
    };
  },
  async run() {
    const outputs: Record<string, unknown> = {};
    const { readdirSync } = await import("fs");

    for (const value of readdirSync("./infra/").sort()) {
      if (!value.endsWith(".ts") && !value.endsWith(".js")) {
        continue;
      }

      const result = await import("./infra/" + value);
      if (result.outputs) {
        Object.assign(outputs, result.outputs);
      }
    }

    return outputs;
  },
  console: {
    autodeploy: {
      target(event) {
        if (event.type !== "branch") {
          return;
        }

        if (event.branch === "main") {
          return { stage: "production" };
        }

        return { stage: sanitizeStage(event.branch) };
      },
    },
  },
});
