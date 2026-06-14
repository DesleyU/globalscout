import { Agent, fetch as undiciFetch } from "undici";

function isLocalDevApiHostname(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".localhost")
  );
}

let insecureLocalhostAgent: Agent | undefined;

function getInsecureLocalhostAgent(): Agent {
  if (!insecureLocalhostAgent) {
    insecureLocalhostAgent = new Agent({
      connect: {
        rejectUnauthorized: false,
      },
    });
  }

  return insecureLocalhostAgent;
}

function isLocalDevApiUrl(input: RequestInfo | URL): boolean {
  if (process.env.NODE_ENV === "production") {
    return false;
  }

  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url;

  try {
    const parsed = new URL(url);
    return (
      (parsed.protocol === "https:" || parsed.protocol === "http:") &&
      isLocalDevApiHostname(parsed.hostname)
    );
  } catch {
    return false;
  }
}

/**
 * Server-side fetch for Next route handlers and RSC.
 * In local development, trusts self-signed HTTPS certs on localhost and
 * Aspire *.dev.localhost hosts so API calls succeed from Node.
 */
export function createServerSideFetch(): typeof fetch {
  return (input, init) => {
    if (isLocalDevApiUrl(input)) {
      return undiciFetch(
        input as Parameters<typeof undiciFetch>[0],
        {
          ...init,
          dispatcher: getInsecureLocalhostAgent(),
        } as Parameters<typeof undiciFetch>[1],
      ) as unknown as Promise<Response>;
    }

    return fetch(input, init);
  };
}

export { isLocalDevApiHostname };
