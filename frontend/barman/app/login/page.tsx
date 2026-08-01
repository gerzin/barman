"use client"

import { useState } from "react"
import { loginAction } from "@/lib/session"

export default function LoginPage() {
    const [error, setError] = useState<string | null>(null)
    const [pending, setPending] = useState(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setError(null)
        setPending(true)

        const data = new FormData(e.currentTarget)
        const result = await loginAction(
            data.get("email") as string,
            data.get("password") as string
        )

        // loginAction redirects on success, so we only reach here on error
        if (result?.error) {
            setError(result.error)
            setPending(false)
        }
    }

    return (
        <main className="flex min-h-full items-center justify-center">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm">
                <h1 className="text-2xl font-semibold">Staff login</h1>

                {error && (
                    <p className="text-red-600 text-sm">{error}</p>
                )}

                <input
                    name="email"
                    type="email"
                    placeholder="Email"
                    required
                    className="border rounded px-3 py-2"
                />
                <input
                    name="password"
                    type="password"
                    placeholder="Password"
                    required
                    className="border rounded px-3 py-2"
                />
                <button
                    type="submit"
                    disabled={pending}
                    className="bg-black text-white rounded px-3 py-2 disabled:opacity-50"
                >
                    {pending ? "Signing in…" : "Sign in"}
                </button>
            </form>
        </main>
    )
}
