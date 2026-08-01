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
    if (!token) return { error: "Non autenticato" }
    try {
        await createTable(name, notes, token)
    } catch (err) {
        return { error: err instanceof Error ? err.message : "Errore creazione tavolo" }
    }
    revalidatePath("/management/tables")
}

export async function updateTableAction(id: string, name: string, notes: string) {
    const token = await getToken()
    if (!token) return { error: "Non autenticato" }
    try {
        await updateTable(id, name, notes, token)
    } catch (err) {
        return { error: err instanceof Error ? err.message : "Errore aggiornamento tavolo" }
    }
    revalidatePath("/management/tables")
    revalidatePath(`/management/tables/${id}`)
}

export async function deleteTableAction(id: string) {
    const token = await getToken()
    if (!token) return { error: "Non autenticato" }
    try {
        await deleteTable(id, token)
    } catch (err) {
        return { error: err instanceof Error ? err.message : "Errore eliminazione tavolo" }
    }
    revalidatePath("/management/tables")
}

export async function closeTableAction(id: string) {
    const token = await getToken()
    if (!token) return { error: "Non autenticato" }
    try {
        await closeTable(id, token)
    } catch (err) {
        return { error: err instanceof Error ? err.message : "Errore chiusura tavolo" }
    }
    revalidatePath(`/management/tables/${id}`)
    revalidatePath("/management/tables")
}

export async function reopenTableAction(id: string) {
    const token = await getToken()
    if (!token) return { error: "Non autenticato" }
    try {
        await reopenTable(id, token)
    } catch (err) {
        return { error: err instanceof Error ? err.message : "Errore riapertura tavolo" }
    }
    revalidatePath(`/management/tables/${id}`)
    revalidatePath("/management/tables")
}

export async function addOrderAction(tableId: string, input: OrderInput) {
    const token = await getToken()
    if (!token) return { error: "Non autenticato" }
    try {
        await addOrder(tableId, input, token)
    } catch (err) {
        return { error: err instanceof Error ? err.message : "Errore aggiunta ordine" }
    }
    revalidatePath(`/management/tables/${tableId}`)
}

export async function updateOrderAction(orderId: string, tableId: string, quantity: number, note: string) {
    const token = await getToken()
    if (!token) return { error: "Non autenticato" }
    try {
        await updateOrder(orderId, { quantity, note }, token)
    } catch (err) {
        return { error: err instanceof Error ? err.message : "Errore aggiornamento ordine" }
    }
    revalidatePath(`/management/tables/${tableId}`)
}

/** Toggle paid on an order. Passes existing quantity/note to satisfy the required fields. */
export async function markOrderPaidAction(
    orderId: string,
    tableId: string,
    paid: boolean,
    quantity: number,
    note: string
) {
    const token = await getToken()
    if (!token) return { error: "Non autenticato" }
    try {
        await updateOrder(orderId, { quantity, note, paid }, token)
    } catch (err) {
        return { error: err instanceof Error ? err.message : "Errore" }
    }
    revalidatePath(`/management/tables/${tableId}`)
}

export async function removeOrderAction(orderId: string, tableId: string) {
    const token = await getToken()
    if (!token) return { error: "Non autenticato" }
    try {
        await removeOrder(orderId, token)
    } catch (err) {
        return { error: err instanceof Error ? err.message : "Errore rimozione ordine" }
    }
    revalidatePath(`/management/tables/${tableId}`)
}

