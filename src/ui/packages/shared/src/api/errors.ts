/** RFC 7807 problem details returned by the GlobalScout API. */
export interface ApiProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  code?: string;
  [key: string]: unknown;
}

export type ApiErrorKind =
  | "validation"
  | "not_found"
  | "conflict"
  | "forbidden"
  | "unauthorized"
  | "network"
  | "unknown";

export class ApiError extends Error {
  readonly status: number;
  readonly kind: ApiErrorKind;
  readonly code?: string;
  readonly problem?: ApiProblemDetails;

  constructor(
    message: string,
    options: {
      status: number;
      kind: ApiErrorKind;
      code?: string;
      problem?: ApiProblemDetails;
      cause?: unknown;
    },
  ) {
    super(message);
    this.name = "ApiError";
    this.status = options.status;
    this.kind = options.kind;
    this.code = options.code;
    this.problem = options.problem;
    if (options.cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = options.cause;
    }
  }
}

function kindFromStatus(status: number): ApiErrorKind {
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 409) return "conflict";
  if (status === 400 || status === 422) return "validation";
  return "unknown";
}

function isProblemDetails(value: unknown): value is ApiProblemDetails {
  return (
    typeof value === "object" &&
    value !== null &&
    ("title" in value || "detail" in value || "status" in value || "code" in value)
  );
}

/** Normalize backend error payloads into a typed ApiError. */
export function parseApiError(
  status: number,
  body: unknown,
  fallbackMessage = "Request failed",
): ApiError {
  if (isProblemDetails(body)) {
    const message =
      typeof body.detail === "string"
        ? body.detail
        : typeof body.title === "string"
          ? body.title
          : fallbackMessage;

    return new ApiError(message, {
      status,
      kind: kindFromStatus(status),
      code: typeof body.code === "string" ? body.code : undefined,
      problem: body,
    });
  }

  if (typeof body === "object" && body !== null) {
    const record = body as Record<string, unknown>;
    const message =
      (typeof record.message === "string" && record.message) ||
      (typeof record.error === "string" && record.error) ||
      fallbackMessage;

    return new ApiError(message, {
      status,
      kind: kindFromStatus(status),
      code: typeof record.code === "string" ? record.code : undefined,
    });
  }

  return new ApiError(fallbackMessage, {
    status,
    kind: kindFromStatus(status),
  });
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
