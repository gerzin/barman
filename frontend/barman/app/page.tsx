import { MenuEmptyState } from "@/components/menu/menu-empty-state"
import { MenuView } from "@/components/menu/menu-view"
import { getMenu } from "@/lib/api/menu"
import type { MenuSectionWithProducts } from "@/lib/api/types"

// The menu (availability, prices, sections) can change at any time, and the
// production image is built before the backend is reachable - force this
// route to render per-request instead of being baked in as static HTML at
// build time.
export const dynamic = "force-dynamic"

export default async function Home() {
  const sections = await loadMenu()

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
      {sections ? <MenuView sections={sections} /> : <MenuEmptyState />}
    </main>
  );
}

/**
 * Loads the menu, swallowing backend errors so a temporary outage (or the
 * backend simply not running yet) shows a friendly empty state instead of
 * crashing the whole page.
 */
async function loadMenu(): Promise<MenuSectionWithProducts[] | null> {
  try {
    return await getMenu()
  } catch (error) {
    console.error("Failed to load menu", error)
    return null
  }
}
