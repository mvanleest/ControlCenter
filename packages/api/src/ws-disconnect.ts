export async function handler(event: { requestContext?: { connectionId?: string } }) {
  console.log("ws_disconnect", {
    connectionId: event.requestContext?.connectionId,
  });

  return {
    statusCode: 200,
    body: "disconnected",
  };
}
