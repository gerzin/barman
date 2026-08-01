"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { login as apiLogin } from "@/lib/api/auth"
import { ApiError } from "@/lib/api/client"

// 24h — must match backend auth.TokenTTL
const TOKEN_MAX_AGE = 60 * 60 * 24

export async function loginAction(
    email: string,
    password: string
): Promise<{ error: string } | void> {
    let token: string
    try {
        const res = await apiLogin(email, password)
        token = res.token
    } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
            return { error: "Invalid email or password" }
        }
        return { error: "Something went wrong, please try again" }
    }

    const cookieStore = await cookies()
    cookieStore.set("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: TOKEN_MAX_AGE,
        path: "/",
    })

    redirect("/management")
}

export async function logoutAction(): Promise<void> {
    const cookieStore = await cookies()
    cookieStore.delete("token")
    redirect("/login")
}

/** Read the bearer token from the httpOnly cookie for use in Server Components. */
export async function getToken(): Promise<string | undefined> {
    const cookieStore = await cookies()
    return cookieStore.get("token")?.value
}
