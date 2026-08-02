import Link from "next/link"
import type { Metadata } from "next"
import { getMenu } from "@/lib/api/menu"
import type { MenuSectionWithProducts } from "@/lib/api/types"
import { formatPrice } from "@/lib/format"

export const metadata: Metadata = {
    title: "Caffetteria del Corso",
    description: "Il menu della Caffetteria del Corso",
}

export const revalidate = 30

const homeConfig = {
    brand: "Caffetteria del Corso",
    secondaryCta: "Area staff",
    secondaryHref: "/login",
}

function formatSectionDescription(section: MenuSectionWithProducts) {
    return section.description?.trim() || " "
}

function isSoldOut(product: { available: boolean }) {
    return !product.available
}

export default async function Home() {
    const menu = await getMenu().catch(() => [])

    return (
        <main className="min-h-screen bg-[#090909] text-zinc-100 selection:bg-amber-300/30 selection:text-amber-50">
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.06),_transparent_30%),radial-gradient(circle_at_15%_20%,_rgba(180,140,80,0.10),_transparent_22%),radial-gradient(circle_at_85%_15%,_rgba(255,255,255,0.05),_transparent_18%)]" />
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0,transparent_12%),linear-gradient(90deg,rgba(255,255,255,0.02)_0,transparent_1px)] bg-[length:100%_100%,88px_88px] opacity-[0.15]" />
            </div>

            <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
                <header className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                    <h1 className="text-sm uppercase tracking-[0.45em] text-zinc-300 sm:text-base">{homeConfig.brand}</h1>
                </header>

                <section id="menu" className="flex flex-1 flex-col gap-6 py-8 lg:py-12">
                    <div className="flex items-end justify-between gap-4 border-b border-white/10 pb-4">
                        <div>
                            <p className="text-[0.68rem] uppercase tracking-[0.36em] text-zinc-500">Menu</p>
                            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">Sezioni e proposte</h2>
                        </div>
                    </div>

                    {menu.length === 0 ? (
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-8 text-sm text-zinc-400">
                            Il menu non è ancora stato pubblicato.
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {menu.map((section, index) => (
                                <section key={section.id} className="space-y-4">
                                    <div className="flex items-baseline justify-between gap-4">
                                        <div className="flex items-baseline gap-3">
                                            <span className="text-[0.68rem] uppercase tracking-[0.36em] text-zinc-500">
                                                {String(index + 1).padStart(2, "0")}
                                            </span>
                                            <h3 className="text-xl font-medium text-white sm:text-2xl">{section.name}</h3>
                                        </div>
                                        <span className="text-sm text-zinc-500">{section.products.length} prodotti</span>
                                    </div>

                                    <p className="max-w-2xl text-sm leading-6 text-zinc-400">
                                        {formatSectionDescription(section)}
                                    </p>

                                    <div className="border-t border-white/10">
                                        {section.products.map((product) => {
                                            const soldOut = isSoldOut(product)

                                            return (
                                                <div
                                                    key={product.id}
                                                    className={`flex items-start gap-4 border-b border-white/10 py-4 last:border-b-0 ${soldOut ? "opacity-60" : ""}`}
                                                >
                                                    <div className="mt-2 h-px w-8 shrink-0 bg-white/20" />

                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                                                            <h4
                                                                className={`text-[1.02rem] font-medium leading-tight tracking-[0.01em] text-white ${soldOut ? "line-through decoration-white/30" : ""
                                                                    }`}
                                                            >
                                                                {product.name}
                                                            </h4>
                                                            <span className="text-sm tabular-nums text-amber-50/90">{formatPrice(product.price)}</span>
                                                        </div>

                                                        {product.description && (
                                                            <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-400">
                                                                {product.description}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="shrink-0 pt-0.5 text-right">
                                                        {soldOut ? (
                                                            <span className="text-[0.68rem] uppercase tracking-[0.32em] text-zinc-500">Esaurito</span>
                                                        ) : (
                                                            <span className="text-[0.68rem] uppercase tracking-[0.32em] text-emerald-300/80">Disponibile</span>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </section>
                            ))}
                        </div>
                    )}
                </section>

                <footer className="flex flex-col gap-3 border-t border-white/10 py-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-zinc-500">{homeConfig.brand}</p>
                    <nav className="flex flex-wrap items-center gap-3">
                        <Link
                            href={homeConfig.secondaryHref}
                            className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
                        >
                            {homeConfig.secondaryCta}
                        </Link>
                    </nav>
                </footer>
            </div>
        </main>
    )
}
