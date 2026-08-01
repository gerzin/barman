import { apiFetch } from "@/lib/api/client"
import type { Order, OrderLog, Table, TableWithOrders } from "@/lib/api/types"

export interface OrderInput {
    product_id: string
    quantity: number
    note?: string
}

// --- Staff endpoints (require a bearer token from lib/api/auth.login) ---

/** Mirrors GET /api/v1/tables. */
export function listTables(token: string): Promise<Table[]> {
    return apiFetch<Table[]>("/api/v1/tables", { token })
}

/** Mirrors GET /api/v1/tables/:id. */
export function getTable(id: string, token: string): Promise<Table> {
    return apiFetch<Table>(`/api/v1/tables/${id}`, { token })
}

/** Mirrors POST /api/v1/tables. */
export function createTable(name: string, token: string): Promise<Table> {
    return apiFetch<Table>("/api/v1/tables", { method: "POST", body: { name }, token })
}

/** Mirrors GET /api/v1/tables/:id/bill - the table with its current orders
 * and total amount due. */
export function getTableBill(id: string, token: string): Promise<TableWithOrders> {
    return apiFetch<TableWithOrders>(`/api/v1/tables/${id}/bill`, { token })
}

/** Mirrors GET /api/v1/tables/:id/logs - the audit trail of order changes. */
export function getTableLogs(id: string, token: string): Promise<OrderLog[]> {
    return apiFetch<OrderLog[]>(`/api/v1/tables/${id}/logs`, { token })
}

/** Mirrors POST /api/v1/tables/:id/orders. */
export function addOrder(tableId: string, input: OrderInput, token: string): Promise<Order> {
    return apiFetch<Order>(`/api/v1/tables/${tableId}/orders`, { method: "POST", body: input, token })
}

/** Mirrors PUT /api/v1/orders/:orderID. */
export function updateOrder(
    orderId: string,
    input: { quantity: number; note?: string },
    token: string
): Promise<Order> {
    return apiFetch<Order>(`/api/v1/orders/${orderId}`, { method: "PUT", body: input, token })
}

/** Mirrors DELETE /api/v1/orders/:orderID. */
export function removeOrder(orderId: string, token: string): Promise<void> {
    return apiFetch<void>(`/api/v1/orders/${orderId}`, { method: "DELETE", token })
}

/** Mirrors POST /api/v1/tables/:id/close. */
export function closeTable(id: string, token: string): Promise<void> {
    return apiFetch<void>(`/api/v1/tables/${id}/close`, { method: "POST", token })
}

/** Mirrors POST /api/v1/tables/:id/reopen. */
export function reopenTable(id: string, token: string): Promise<void> {
    return apiFetch<void>(`/api/v1/tables/${id}/reopen`, { method: "POST", token })
}

// --- Public QR endpoints (no auth, scoped to one table via its QR token) ---

/** Mirrors GET /api/v1/public/tables/:token - what the printed QR code on
 * a physical table links to. */
export function getPublicTable(qrToken: string): Promise<TableWithOrders> {
    return apiFetch<TableWithOrders>(`/api/v1/public/tables/${qrToken}`)
}

/** Mirrors POST /api/v1/public/tables/:token/orders - lets a customer place
 * an order themselves from the QR page. */
export function addPublicOrder(qrToken: string, input: OrderInput): Promise<Order> {
    return apiFetch<Order>(`/api/v1/public/tables/${qrToken}/orders`, { method: "POST", body: input })
}
