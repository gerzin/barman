"use server"

import { revalidatePath } from "next/cache"
import { getToken } from "@/lib/session"
import {
    createTable,
    updateTable,
    deleteTable,
    closeTable,
    reopenTable,
    addOrder,
    updateOrder,
    removeOrder,
    type OrderInput,
} from "@/lib/api/tables"

export async function createTableAction(name: string, notes: string) {
    const token = await getToken()
    if (!token) return { error: "Not authenticated" }
    try {
        await createTable(name, notes, token)
    } catch (err) {
        return { error: err instanceof Error ? err.message : "Failed to create table" }
    }
    revalidatePath("/management/tables")
}

export async function updateTableAction(id: string, name: string, notes: string) {
    const token = await getToken()
    if (!token) return { error: "Not authenticated" }
    try {
        await updateTable(id, name, notes, token)
    } catch (err) {
        return { error: err instanceof Error ? err.message : "Failed to update table" }
    }
    revalidatePath("/management/tables")
    revalidatePath(`/management/tables/${id}`)
}

export async function deleteTableAction(id: string) {
    const token = await getToken()
    if (!token) return { error: "Not authenticated" }
    try {
        await deleteTable(id, token)
    } catch (err) {
        return { error: err instanceof Error ? err.message : "Failed to delete table" }
    }
    revalidatePath("/management/tables")
}

export async function closeTableAction(id: string) {
    const token = await getToken()
    if (!token) return { error: "Not authenticated" }
    try {
        await closeTable(id, token)
    } catch (err) {
        return { error: err instanceof Error ? err.message : "Failed to close table" }
    }
    revalidatePath(`/management/tables/${id}`)
    revalidatePath("/management/tables")
}

export async function reopenTableAction(id: string) {
    const token = await getToken()
    if (!token) return { error: "Not authenticated" }
    try {
        await reopenTable(id, token)
    } catch (err) {
        return { error: err instanceof Error ? err.message : "Failed to reopen table" }
    }
    revalidatePath(`/management/tables/${id}`)
    revalidatePath("/management/tables")
}

export async function addOrderAction(tableId: string, input: OrderInput) {
    const token = await getToken()
    if (!token) return { error: "Not authenticated" }
    try {
        await addOrder(tableId, input, token)
    } catch (err) {
        return { error: err instanceof Error ? err.message : "Failed to add order" }
    }
    revalidatePath(`/management/tables/${tableId}`)
}

export async function updateOrderAction(orderId: string, tableId: string, quantity: number, note: string) {
    const token = await getToken()
    if (!token) return { error: "Not authenticated" }
    try {
        await updateOrder(orderId, { quantity, note }, token)
    } catch (err) {
        return { error: err instanceof Error ? err.message : "Failed to update order" }
    }
    revalidatePath(`/management/tables/${tableId}`)
}

export async function removeOrderAction(orderId: string, tableId: string) {
    const token = await getToken()
    if (!token) return { error: "Not authenticated" }
    try {
        await removeOrder(orderId, token)
    } catch (err) {
        return { error: err instanceof Error ? err.message : "Failed to remove order" }
    }
    revalidatePath(`/management/tables/${tableId}`)
}
