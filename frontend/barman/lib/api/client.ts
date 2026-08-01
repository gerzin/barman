/**
 * Small fetch wrapper shared by every lib/api/* module. It picks the right
 * backend base URL for the environment it runs in (server vs. browser),
 * attaches JSON headers and an optional bearer token, and normalizes
 * failures into ApiError so callers can branch on `error.status`.
 */

/** Thrown for any non-2xx response, and for network-level failures (status
 * 0) such as the backend being unreachable. */
export class ApiError extends Error {
    constructor(
        message: string,
        public readonly status: number,
        public readonly body?: unknown
    ) {
        super(message)
        this.name = "ApiError"
    }
}

function resolveBaseUrl(): string {
    if (typeof window === "undefined") {
        // Server Components / route handlers run in Node and need a fully
        // qualified URL - there's no browser origin to resolve a relative
        // path against.
        return process.env.API_URL ?? "http://backend:8080"
    }

    // In the browser, default to a relative path so requests hit the same
    // origin and get proxied to the backend (see ../../caddy/Caddyfile).
    return process.env.NEXT_PUBLIC_API_URL ?? ""
}

export interface ApiFetchOptions extends Omit<RequestInit, "body"> {
    /** Bearer token for staff-authenticated endpoints (tables, orders). */
    token?: string
    /** JSON-serializable request body. Already-serialized strings/FormData
     * are passed through as-is. */
    body?: unknown
}

/** Shape of the JSON error body returned by the Go backend, e.g.
 * `{"error": "table not found"}`. */
interface ApiErrorBody {
    error?: string
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
    const { token, headers, body, ...rest } = options
    const baseUrl = resolveBaseUrl()
    const url = `${baseUrl}${path}`

    const serializedBody =
        body === undefined || typeof body === "string" || body instanceof FormData
            ? body
            : JSON.stringify(body)

    let response: Response
    try {
        response = await fetch(url, {
            ...rest,
            body: serializedBody as BodyInit | undefined,
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...headers,
            },
        })
    } catch (cause) {
        throw new ApiError(`Could not reach the backend (${path})`, 0, cause)
    }

    if (response.status === 204) {
        return undefined as T
    }

    const isJson = response.headers.get("content-type")?.includes("application/json")
    const data = isJson ? await response.json().catch(() => undefined) : undefined

    if (!response.ok) {
        const message = (data as ApiErrorBody | undefined)?.error ?? response.statusText
        throw new ApiError(message, response.status, data)
    }

    return data as T
}
