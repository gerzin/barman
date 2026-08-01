import { apiFetch } from "@/lib/api/client"
import type { Product } from "@/lib/api/types"

export interface ProductInput {
    name: string
    description: string
    price: number
    available: boolean
    section_id?: string | null
}

/** Mirrors GET /api/v1/products. */
export function listProducts(token?: string): Promise<Product[]> {
    return apiFetch<Product[]>("/api/v1/products", { token })
}

/** Mirrors GET /api/v1/products/:id. */
export function getProduct(id: string): Promise<Product> {
    return apiFetch<Product>(`/api/v1/products/${id}`)
}

/** Mirrors POST /api/v1/products. */
export function createProduct(input: ProductInput, token: string): Promise<Product> {
    return apiFetch<Product>("/api/v1/products", { method: "POST", body: input, token })
}

/** Mirrors PUT /api/v1/products/:id. */
export function updateProduct(id: string, input: ProductInput, token: string): Promise<Product> {
    return apiFetch<Product>(`/api/v1/products/${id}`, { method: "PUT", body: input, token })
}

/** Mirrors DELETE /api/v1/products/:id. */
export function deleteProduct(id: string, token: string): Promise<void> {
    return apiFetch<void>(`/api/v1/products/${id}`, { method: "DELETE", token })
}
