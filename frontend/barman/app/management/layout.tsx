import Link from "next/link"
import { logoutAction } from "@/lib/session"
import { Toaster } from "@/components/ui/sonner"

export default function ManagementLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-10 border-b bg-background px-4 py-3">
                <div className="mx-auto flex max-w-3xl items-center justify-between">
                    <nav className="flex gap-6">
                        <Link href="/management/tables" className="text-sm font-medium hover:underline">
                            Tavoli
                        </Link>
                        <Link href="/management/menu" className="text-sm font-medium hover:underline">
                            Menu
                        </Link>
                        <Link href="/management/users" className="text-sm font-medium hover:underline">
                            Utenti
                        </Link>
                    </nav>
                    <form action={logoutAction}>
                        <button type="submit" className="text-sm text-muted-foreground hover:text-foreground">
                            Esci
                        </button>
                    </form>
                </div>
            </header>
            <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>
            <Toaster richColors />
        </div>
    )
}
