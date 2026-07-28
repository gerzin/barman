import { apiFetch } from "@/lib/api/client"
import type { Product } from "@/lib/api/types"

/** Mirrors GET /api/v1/products. */
export function listProducts(): Promise<Product[]> {
    return apiFetch<Product[]>("/api/v1/products")
}

/** Mirrors GET /api/v1/products/:id. */
export function getProduct(id: string): Promise<Product> {
    return apiFetch<Product>(`/api/v1/products/${id}`)
}
