"use server"

import { revalidatePath } from "next/cache"
import { getToken } from "@/lib/session"
import { createProduct, updateProduct, deleteProduct, type ProductInput } from "@/lib/api/products"

export async function createProductAction(input: ProductInput) {
    const token = await getToken()
    if (!token) return { error: "Not authenticated" }
    try {
        await createProduct(input, token)
    } catch (err) {
        return { error: err instanceof Error ? err.message : "Failed to create product" }
    }
    revalidatePath("/management/menu")
}

export async function updateProductAction(id: string, input: ProductInput) {
    const token = await getToken()
    if (!token) return { error: "Not authenticated" }
    try {
        await updateProduct(id, input, token)
    } catch (err) {
        return { error: err instanceof Error ? err.message : "Failed to update product" }
    }
    revalidatePath("/management/menu")
}

export async function deleteProductAction(id: string) {
    const token = await getToken()
    if (!token) return { error: "Not authenticated" }
    try {
        await deleteProduct(id, token)
    } catch (err) {
        return { error: err instanceof Error ? err.message : "Failed to delete product" }
    }
    revalidatePath("/management/menu")
}
