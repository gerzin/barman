import { apiFetch } from "@/lib/api/client"
import type { MenuSectionWithProducts } from "@/lib/api/types"

/**
 * Fetches the full menu: every section, ordered by position, with its
 * assigned products nested underneath. Mirrors GET /api/v1/menu - see
 * MenuHandler.GetMenu on the backend.
 */
export function getMenu(): Promise<MenuSectionWithProducts[]> {
    return apiFetch<MenuSectionWithProducts[]>("/api/v1/menu")
}
