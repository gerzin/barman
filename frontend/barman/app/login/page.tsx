"use client"

import { useActionState } from "react"
import { loginFormAction } from "@/lib/session"

export default function LoginPage() {
    const [state, action, pending] = useActionState(loginFormAction, null)

    return (
        <main className="flex min-h-full items-center justify-center px-4">
            <form action={action} className="flex flex-col gap-4 w-full max-w-sm">
                <h1 className="text-2xl font-semibold">Accesso staff</h1>

                {state?.error && (
                    <p className="text-destructive text-sm">{state.error}</p>
                )}

                <input
                    name="email"
                    type="email"
                    placeholder="Email"
                    required
                    autoComplete="email"
                    className="border rounded px-3 py-2 bg-background text-foreground"
                />
                <input
                    name="password"
                    type="password"
                    placeholder="Password"
                    required
                    autoComplete="current-password"
                    className="border rounded px-3 py-2 bg-background text-foreground"
                />
                <button
                    type="submit"
                    disabled={pending}
                    className="bg-primary text-primary-foreground rounded px-3 py-2 disabled:opacity-50"
                >
                    {pending ? "Accesso in corso…" : "Accedi"}
                </button>
            </form>
        </main>
    )
}
