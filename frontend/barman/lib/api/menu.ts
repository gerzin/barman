import { apiFetch } from "@/lib/api/client"
import type { MenuSection, MenuSectionWithProducts } from "@/lib/api/types"

export interface SectionInput {
    name: string
    description: string
    position: number
}

/** Mirrors GET /api/v1/menu. */
export function getMenu(): Promise<MenuSectionWithProducts[]> {
    return apiFetch<MenuSectionWithProducts[]>("/api/v1/menu")
}

/** Mirrors GET /api/v1/menu-sections. */
export function listSections(token?: string): Promise<MenuSection[]> {
    return apiFetch<MenuSection[]>("/api/v1/menu-sections", { token })
}

/** Mirrors POST /api/v1/menu-sections. */
export function createSection(input: SectionInput, token: string): Promise<MenuSection> {
    return apiFetch<MenuSection>("/api/v1/menu-sections", { method: "POST", body: input, token })
}

/** Mirrors PUT /api/v1/menu-sections/:id. */
export function updateSection(id: string, input: SectionInput, token: string): Promise<MenuSection> {
    return apiFetch<MenuSection>(`/api/v1/menu-sections/${id}`, { method: "PUT", body: input, token })
}

/** Mirrors DELETE /api/v1/menu-sections/:id. */
export function deleteSection(id: string, token: string): Promise<void> {
    return apiFetch<void>(`/api/v1/menu-sections/${id}`, { method: "DELETE", token })
}
