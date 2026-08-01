import { logoutAction } from "@/lib/session"

export default function ManagementLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-full flex-col">
            <header className="flex items-center justify-between border-b px-6 py-3">
                <span className="font-semibold">Management</span>
                <form action={logoutAction}>
                    <button type="submit" className="text-sm text-gray-500 hover:text-black">
                        Logout
                    </button>
                </form>
            </header>
            <main className="flex-1 p-6">{children}</main>
        </div>
    )
}
