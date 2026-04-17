export async function handler(event: { requestContext?: { connectionId?: string } }) {
  console.log("ws_connect", {
    connectionId: event.requestContext?.connectionId,
  });

  return {
    statusCode: 200,
    body: "connected",
  };
}
