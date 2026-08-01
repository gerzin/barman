import { apiFetch } from "@/lib/api/client"
import type { User } from "@/lib/api/types"

export interface CreateUserInput {
    name: string
    surname: string
    email: string
    phone?: string
    password: string
    role: "admin" | "employee"
}

export interface UpdateUserInput {
    name: string
    surname: string
    email: string
    phone?: string
    role: "admin" | "employee"
}

/** Mirrors GET /api/v1/users. */
export function listUsers(token: string): Promise<User[]> {
    return apiFetch<User[]>("/api/v1/users", { token })
}

/** Mirrors POST /api/v1/users. */
export function createUser(input: CreateUserInput, token: string): Promise<User> {
    return apiFetch<User>("/api/v1/users", { method: "POST", body: input, token })
}

/** Mirrors PUT /api/v1/users/:id. */
export function updateUser(id: string, input: UpdateUserInput, token: string): Promise<User> {
    return apiFetch<User>(`/api/v1/users/${id}`, { method: "PUT", body: input, token })
}

/** Mirrors DELETE /api/v1/users/:id. */
export function deleteUser(id: string, token: string): Promise<void> {
    return apiFetch<void>(`/api/v1/users/${id}`, { method: "DELETE", token })
}
