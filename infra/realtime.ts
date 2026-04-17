// SST Infrastructure: WebSocket realtime
// Pushes run and dashboard updates to clients.

import { controlCenterDynamo } from "./database";
import { AdminToken } from "./secrets";

export const realtime = new sst.aws.ApiGatewayWebSocket("Realtime", {
  accessLog: {
    retention: "1 week",
  },
});

export const realtimeAuthorizer = realtime.addAuthorizer("RealtimeAuthorizer", {
  lambda: {
    function: {
      handler: "packages/api/src/ws-authorizer.handler",
      link: [AdminToken],
      logging: {
        retention: "1 week",
      },
    },
  },
});

realtime.route(
  "$connect",
  {
    handler: "packages/api/src/ws-connect.handler",
    link: [controlCenterDynamo],
    logging: {
      retention: "1 week",
    },
  },
  {
    auth: {
      lambda: realtimeAuthorizer.id,
    },
  },
);

realtime.route("$disconnect", {
  handler: "packages/api/src/ws-disconnect.handler",
  link: [controlCenterDynamo],
  logging: {
    retention: "1 week",
  },
});

realtime.route("$default", {
  handler: "packages/api/src/ws-default.handler",
  link: [controlCenterDynamo],
  logging: {
    retention: "1 week",
  },
});

export const outputs = {
  websocket: realtime.url,
  managementEndpoint: realtime.managementEndpoint,
};
