"use server"

import { revalidatePath } from "next/cache"
import { getToken } from "@/lib/session"
import { createUser, deleteUser, type CreateUserInput } from "@/lib/api/users"

export async function createUserAction(input: CreateUserInput) {
    const token = await getToken()
    if (!token) return { error: "Not authenticated" }
    try {
        await createUser(input, token)
    } catch (err) {
        return { error: err instanceof Error ? err.message : "Failed to create user" }
    }
    revalidatePath("/management/users")
}

export async function deleteUserAction(id: string) {
    const token = await getToken()
    if (!token) return { error: "Not authenticated" }
    try {
        await deleteUser(id, token)
    } catch (err) {
        return { error: err instanceof Error ? err.message : "Failed to delete user" }
    }
    revalidatePath("/management/users")
}
