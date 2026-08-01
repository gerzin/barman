/**
 * Types mirroring the backend's JSON responses (see
 * ../../../backend/internal/domain). Keep these in sync with the Go
 * structs whenever a field is added, renamed, or removed on that side.
 */

export type Role = "admin" | "employee" | "user"

export interface Product {
    id: string
    name: string
    description: string
    price: number
    available: boolean
    section_id?: string | null
    created_at: string
    updated_at: string
}

export interface MenuSection {
    id: string
    name: string
    description: string
    position: number
    created_at: string
    updated_at: string
}

/** A menu section together with the products currently assigned to it, as
 * returned by GET /api/v1/menu. */
export interface MenuSectionWithProducts extends MenuSection {
    products: Product[]
}

export interface Table {
    id: string
    name: string
    notes: string
    qr_token: string
    closed: boolean
    closed_at?: string | null
    created_at: string
    updated_at: string
}

export interface Order {
    id: string
    table_id: string
    product_id?: string | null
    product_name: string
    unit_price: number
    quantity: number
    note?: string
    created_by?: string | null
    created_at: string
    updated_at: string
}

export type OrderAction = "created" | "updated" | "removed"

export interface OrderLog {
    id: string
    order_id?: string | null
    table_id: string
    action: OrderAction
    product_name: string
    quantity: number
    unit_price: number
    note?: string
    performed_by?: string | null
    performed_at: string
}

/** A table with its current orders and the total amount due, as returned
 * by the bill and public QR endpoints. */
export interface TableWithOrders extends Table {
    orders: Order[]
    total: number
}

export interface User {
    id: string
    name: string
    surname: string
    email: string
    role: Role
    phone: string
    created_at: string
    updated_at: string
}

export interface LoginResponse {
    token: string
    user: User
}
