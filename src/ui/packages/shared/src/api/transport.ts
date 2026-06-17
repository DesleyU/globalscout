import { ApiError, parseApiError } from "./errors";
import { resolveApiUrl } from "./urls";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ApiTransport = {
  baseUrl: string;
  request<T>(path: string, init?: RequestInit): Promise<T>;
  get<T>(path: string, init?: Omit<RequestInit, "method" | "body">): Promise<T>;
  post<T>(
    path: string,
    body?: unknown,
    init?: Omit<RequestInit, "method" | "body">,
  ): Promise<T>;
  put<T>(
    path: string,
    body?: unknown,
    init?: Omit<RequestInit, "method" | "body">,
  ): Promise<T>;
  patch<T>(
    path: string,
    body?: unknown,
    init?: Omit<RequestInit, "method" | "body">,
  ): Promise<T>;
  delete<T>(
    path: string,
    init?: Omit<RequestInit, "method" | "body">,
  ): Promise<T>;
};

export type CreateApiTransportOptions = {
  baseUrl: string;
  getAuthToken?: () =>
    | string
    | null
    | undefined
    | Promise<string | null | undefined>;
  getHeaders?: () => HeadersInit | Promise<HeadersInit>;
  credentials?: RequestCredentials;
  fetch?: typeof fetch;
};

async function readResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  const text = await response.text();
  return text.length > 0 ? text : null;
}

export function createApiTransport(
  options: CreateApiTransportOptions,
): ApiTransport {
  const fetchImpl = options.fetch ?? fetch;

  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const url = resolveApiUrl(options.baseUrl, path);
    const headers = new Headers(init.headers);
    const extraHeaders = options.getHeaders ? await options.getHeaders() : undefined;

    if (extraHeaders) {
      new Headers(extraHeaders).forEach((value, key) => {
        headers.set(key, value);
      });
    }

    const token = options.getAuthToken ? await options.getAuthToken() : undefined;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const hasBody = init.body !== undefined && init.body !== null;
    if (hasBody && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    let response: Response;
    try {
      response = await fetchImpl(url, {
        ...init,
        headers,
        credentials: init.credentials ?? options.credentials,
      });
    } catch (cause) {
      throw new ApiError("Network request failed", {
        status: 0,
        kind: "network",
        cause,
      });
    }

    const body = await readResponseBody(response);
    if (!response.ok) {
      throw parseApiError(response.status, body);
    }

    return body as T;
  }

  return {
    baseUrl: options.baseUrl,
    request,
    get: (path, init) => request(path, { ...init, method: "GET" }),
    post: (path, body, init) =>
      request(path, {
        ...init,
        method: "POST",
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
    put: (path, body, init) =>
      request(path, {
        ...init,
        method: "PUT",
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
    patch: (path, body, init) =>
      request(path, {
        ...init,
        method: "PATCH",
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
    delete: (path, init) => request(path, { ...init, method: "DELETE" }),
  };
}
