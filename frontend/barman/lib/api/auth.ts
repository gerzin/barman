import { apiFetch } from "@/lib/api/client"
import type { LoginResponse } from "@/lib/api/types"

/** Mirrors POST /api/v1/auth/login. Returns a JWT valid for 24h (see
 * backend/internal/auth.TokenTTL) to use as the `token` option on the
 * staff-only lib/api/tables.ts functions. */
export function login(email: string, password: string): Promise<LoginResponse> {
    return apiFetch<LoginResponse>("/api/v1/auth/login", {
        method: "POST",
        body: { email, password },
    })
}
