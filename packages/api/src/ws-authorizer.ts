import { resources } from "./resources";

export async function handler(event: {
  headers?: Record<string, string | undefined>;
  queryStringParameters?: Record<string, string | undefined>;
}) {
  const headerToken = event.headers?.Authorization ?? event.headers?.authorization;
  const queryToken = event.queryStringParameters?.token;
  const token = headerToken?.startsWith("Bearer ") ? headerToken.slice("Bearer ".length) : queryToken;

  return {
    isAuthorized: token === resources.AdminToken.value,
    context: {
      principalId: "admin",
    },
  };
}
