"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProductCard } from "@/components/menu/product-card"
import { MenuEmptyState } from "@/components/menu/menu-empty-state"
import type { MenuSectionWithProducts } from "@/lib/api/types"

/**
 * Renders the full menu as a searchable, tabbed list of sections. Client
 * component because it owns the search/tab UI state; the actual data is
 * fetched server-side in app/page.tsx and passed in as a prop.
 */
export function MenuView({ sections }: { sections: MenuSectionWithProducts[] }) {
    const [query, setQuery] = useState("")
    const [selectedTab, setSelectedTab] = useState(sections[0]?.id)

    const normalizedQuery = query.trim().toLowerCase()

    const filteredSections = useMemo(() => {
        if (!normalizedQuery) return sections

        return sections
            .map((section) => ({
                ...section,
                products: section.products.filter((product) =>
                    `${product.name} ${product.description}`.toLowerCase().includes(normalizedQuery)
                ),
            }))
            .filter((section) => section.products.length > 0)
    }, [sections, normalizedQuery])

    if (sections.length === 0) {
        return <MenuEmptyState />
    }

    // Fall back to the first visible section if the one that's selected got
    // filtered out (or hasn't been picked yet).
    const activeTab = filteredSections.some((section) => section.id === selectedTab)
        ? selectedTab
        : filteredSections[0]?.id

    return (
        <div className="flex flex-col gap-4">
            <div className="relative">
                <Search
                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                />
                <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search the menu…"
                    type="search"
                    aria-label="Search the menu"
                    className="h-10 pl-9"
                />
            </div>

            {filteredSections.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                    No items match &ldquo;{query}&rdquo;.
                </p>
            ) : (
                <Tabs value={activeTab} onValueChange={setSelectedTab}>
                    <TabsList className="w-full justify-start overflow-x-auto">
                        {filteredSections.map((section) => (
                            <TabsTrigger key={section.id} value={section.id}>
                                {section.name}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {filteredSections.map((section) => (
                        <TabsContent key={section.id} value={section.id} className="mt-4">
                            {section.products.length === 0 ? (
                                <p className="py-8 text-center text-sm text-muted-foreground">
                                    Nothing in this section yet.
                                </p>
                            ) : (
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    {section.products.map((product) => (
                                        <ProductCard key={product.id} product={product} />
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    ))}
                </Tabs>
            )}
        </div>
    )
}
