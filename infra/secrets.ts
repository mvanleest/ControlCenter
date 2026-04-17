// SST Infrastructure: Secrets
// Admin auth and provider credentials for v1.

export const AdminUsername = new sst.Secret("AdminUsername", "admin");
export const AdminPassword = new sst.Secret("AdminPassword", "changeme");
export const AdminToken = new sst.Secret("AdminToken", "dev-admin-token");
export const OpenAiApiKey = new sst.Secret("OpenAiApiKey", "replace-me");
export const RouterAuthUser = new sst.Secret("RouterAuthUser", "thisis");
export const RouterAuthPassword = new sst.Secret("RouterAuthPassword", "sparta");
