export async function handler(event: { body?: string; requestContext?: { routeKey?: string } }) {
  console.log("ws_default", {
    routeKey: event.requestContext?.routeKey,
    body: event.body,
  });

  return {
    statusCode: 200,
    body: "ok",
  };
}
