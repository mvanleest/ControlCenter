// SST Infrastructure: Static web app
// Vite build output deployed behind router.

import { api } from "./api";
import { realtime } from "./realtime";
import { router } from "./router";

export const web = new sst.aws.StaticSite("Web", {
  path: "apps/web",
  build: {
    command: "pnpm build",
    output: "dist",
  },
  dev: {
    command: "pnpm dev --host 0.0.0.0 --port 5173",
    directory: "apps/web",
    url: "http://localhost:5173",
  },
  router: {
    instance: router,
    path: "/",
  },
  environment: {
    VITE_API_URL: api.url,
    VITE_WS_URL: realtime.url,
  },
});

export const outputs = {
  web: web.url,
};
