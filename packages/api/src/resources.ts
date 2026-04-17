import { Resource } from "sst";

export const resources = Resource as unknown as {
  AdminUsername: { value: string };
  AdminPassword: { value: string };
  AdminToken: { value: string };
  OpenAiApiKey: { value: string };
  AppTable: { name: string };
  Artifacts: { name: string };
  RunQueue: { url: string };
  Realtime: { url: string; managementEndpoint: string };
};
