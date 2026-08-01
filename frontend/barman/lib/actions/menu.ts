"use server"

import { revalidatePath } from "next/cache"
import { getToken } from "@/lib/session"
import { createSection, updateSection, deleteSection, type SectionInput } from "@/lib/api/menu"

export async function createSectionAction(input: SectionInput) {
    const token = await getToken()
    if (!token) return { error: "Not authenticated" }
    try {
        await createSection(input, token)
    } catch (err) {
        return { error: err instanceof Error ? err.message : "Failed to create section" }
    }
    revalidatePath("/management/menu")
}

export async function updateSectionAction(id: string, input: SectionInput) {
    const token = await getToken()
    if (!token) return { error: "Not authenticated" }
    try {
        await updateSection(id, input, token)
    } catch (err) {
        return { error: err instanceof Error ? err.message : "Failed to update section" }
    }
    revalidatePath("/management/menu")
}

export async function deleteSectionAction(id: string) {
    const token = await getToken()
    if (!token) return { error: "Not authenticated" }
    try {
        await deleteSection(id, token)
    } catch (err) {
        return { error: err instanceof Error ? err.message : "Failed to delete section" }
    }
    revalidatePath("/management/menu")
}
