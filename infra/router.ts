// SST Infrastructure: CloudFront router
// Single entry point for static app and API.

import { api } from "./api";
import { infraSettings } from "./settings";
import { RouterAuthPassword, RouterAuthUser } from "./secrets";

const basicAuth = $resolve([
  RouterAuthUser.value,
  RouterAuthPassword.value,
]).apply(([username, password]) =>
  Buffer.from(`${username}:${password}`).toString("base64"),
);

export const router = new sst.aws.Router("Router", {
  protection: "oac",
  domain: infraSettings.baseDomain,
  edge:
    $app.stage !== "production" && infraSettings.siteProtected === true
      ? {
          viewerRequest: {
            injection: $interpolate`
              if (
                !event.request.headers.authorization
                || event.request.headers.authorization.value !== "Basic ${basicAuth}"
              ) {
                return {
                  statusCode: 401,
                  headers: {
                    "www-authenticate": { value: "Basic" }
                  }
                };
              }
            `,
          },
        }
      : undefined,
});

router.route("/api", api.url);
router.route("/api/*", api.url);

export const outputs = {
  router: router.url,
};
