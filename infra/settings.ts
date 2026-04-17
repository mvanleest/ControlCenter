// SST Infrastructure: Stage settings
// Central place for stage-specific infra config.

const stage = $app.stage;
const devBaseDomain = "dev.digitalgalore.com";

export const prodSettings = {
  baseDomain: "controlcenter.digitalgalore.com",
  siteProtected: false,
  apiCorsAllowOrigins: ["https://controlcenter.digitalgalore.com"],
};

export const devSettings = {
  baseDomain:
    stage === "dev" ? devBaseDomain : `${stage}.${devBaseDomain}`,
  siteProtected: true,
  apiCorsAllowOrigins: [
    `https://${stage === "dev" ? devBaseDomain : `${stage}.${devBaseDomain}`}`,
  ],
};

export const infraSettings =
  $app.stage === "production" ? prodSettings : devSettings;
