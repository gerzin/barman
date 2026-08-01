"use client"

import { useState, useTransition, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import type { Order, Product, TableWithOrders, MenuSectionWithProducts } from "@/lib/api/types"
import {
    closeTableAction,
    reopenTableAction,
    updateTableAction,
    addOrderAction,
    updateOrderAction,
    removeOrderAction,
} from "@/lib/actions/tables"
import { formatPrice } from "@/lib/format"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
} from "@/components/ui/select"

const CUSTOM_SENTINEL = "__CUSTOM__"

function formatOrderTime(iso: string): string {
    const d = new Date(iso)
    const now = new Date()
    const diffMin = Math.round((now.getTime() - d.getTime()) / 60_000)
    if (diffMin < 1) return "just now"
    if (diffMin < 60) return `${diffMin}m ago`
    // Same day: show HH:MM
    if (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
    ) {
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
    return d.toLocaleDateString([], { month: "short", day: "numeric" })
}

// ---- Auto-refresh ----------------------------------------------------------

function AutoRefresh({ disabled }: { disabled: boolean }) {
    const router = useRouter()
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

    useEffect(() => {
        if (disabled) return
        intervalRef.current = setInterval(() => {
            router.refresh()
        }, 10_000)
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
        }
    }, [router, disabled])

    return null
}

// ---- Edit table dialog -----------------------------------------------------

const editTableSchema = z.object({
    name: z.string().min(1, "Required"),
    notes: z.string(),
})
type EditTableValues = z.infer<typeof editTableSchema>

function EditTableDialog({ bill }: { bill: TableWithOrders }) {
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const { register, handleSubmit, reset, formState: { errors } } = useForm<EditTableValues>({
        resolver: zodResolver(editTableSchema),
        defaultValues: { name: bill.name, notes: bill.notes },
    })

    function onSubmit(values: EditTableValues) {
        startTransition(async () => {
            const result = await updateTableAction(bill.id, values.name, values.notes)
            if (result?.error) toast.error(result.error)
            else {
                toast.success("Table updated")
                setOpen(false)
                reset(values)
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={(props) => (
                <Button {...props} variant="outline" size="sm">Edit</Button>
            )} />
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>Edit table</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="et-name">Name</Label>
                        <Input id="et-name" {...register("name")} />
                        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="et-notes">Notes</Label>
                        <Input id="et-notes" placeholder="e.g. Window seat" {...register("notes")} />
                    </div>
                    <Button type="submit" disabled={isPending}>
                        {isPending ? "Saving…" : "Save"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ---- Close / reopen buttons ------------------------------------------------

function CloseReopenButton({ bill }: { bill: TableWithOrders }) {
    const [isPending, startTransition] = useTransition()

    function toggle() {
        startTransition(async () => {
            const action = bill.closed ? reopenTableAction : closeTableAction
            const result = await action(bill.id)
            if (result?.error) toast.error(result.error)
            else toast.success(bill.closed ? "Table reopened" : "Table closed")
        })
    }

    return (
        <Button
            variant={bill.closed ? "outline" : "secondary"}
            size="sm"
            onClick={toggle}
            disabled={isPending}
        >
            {bill.closed ? "Reopen" : "Close table"}
        </Button>
    )
}

// ---- Add order form --------------------------------------------------------

const addOrderSchema = z.object({
    productId: z.string(),
    productName: z.string(),
    unitPrice: z.string(),
    quantity: z.coerce.number().int().min(1, "Min 1"),
    note: z.string(),
})
type AddOrderValues = z.infer<typeof addOrderSchema>

function AddOrderForm({
    tableId,
    products,
    sections,
}: {
    tableId: string
    products: Product[]
    sections: MenuSectionWithProducts[]
}) {
    const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<AddOrderValues>({
        resolver: zodResolver(addOrderSchema),
        defaultValues: { productId: "", productName: "", unitPrice: "", quantity: 1, note: "" },
    })
    const [isPending, startTransition] = useTransition()
    const productId = watch("productId")
    const isCustom = productId === CUSTOM_SENTINEL

    // Build a map of productId → price for auto-fill
    const priceMap = Object.fromEntries(products.map((p) => [p.id, p.price]))

    function handleProductChange(value: string | null) {
        if (!value) return
        setValue("productId", value)
        if (value && value !== CUSTOM_SENTINEL) {
            setValue("productName", "")
            setValue("unitPrice", String(priceMap[value] ?? ""))
        } else if (value === CUSTOM_SENTINEL) {
            setValue("unitPrice", "")
            setValue("productName", "")
        }
    }

    function onSubmit(values: AddOrderValues) {
        startTransition(async () => {
            const input =
                values.productId && values.productId !== CUSTOM_SENTINEL
                    ? {
                        product_id: values.productId,
                        quantity: values.quantity,
                        note: values.note,
                    }
                    : {
                        product_name: values.productName,
                        unit_price: values.unitPrice ? parseFloat(values.unitPrice) : 0,
                        quantity: values.quantity,
                        note: values.note,
                    }
            const result = await addOrderAction(tableId, input)
            if (result?.error) toast.error(result.error)
            else {
                toast.success("Order added")
                reset({ productId: "", productName: "", unitPrice: "", quantity: 1, note: "" })
            }
        })
    }

    // Determine selected product label for the trigger
    const selectedProduct = products.find((p) => p.id === productId)
    const triggerLabel = isCustom
        ? "Custom item"
        : selectedProduct
            ? selectedProduct.name
            : "Select product…"

    // Group products by section for the dropdown
    const sectionMap = Object.fromEntries(sections.map((s) => [s.id, s.name]))

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
                <Label>Product</Label>
                <Select value={productId} onValueChange={handleProductChange}>
                    <SelectTrigger>
                        <span className={productId ? "" : "text-muted-foreground"}>{triggerLabel}</span>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={CUSTOM_SENTINEL}>Custom item…</SelectItem>
                        {products.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                                {p.section_id ? `${sectionMap[p.section_id] ?? ""}  ·  ` : ""}
                                {p.name}
                                <span className="ml-2 text-muted-foreground text-xs">
                                    {formatPrice(p.price)}
                                </span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {isCustom && (
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5 col-span-2">
                        <Label htmlFor="ao-name">Item name</Label>
                        <Input id="ao-name" placeholder="e.g. Special cocktail" {...register("productName")} />
                    </div>
                    <div className="flex flex-col gap-1.5 col-span-2">
                        <Label htmlFor="ao-price">Unit price (€) — optional</Label>
                        <Input
                            id="ao-price"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            {...register("unitPrice")}
                        />
                    </div>
                </div>
            )}

            {!isCustom && productId && (
                <div className="flex flex-col gap-1.5">
                    <Label>Unit price</Label>
                    <p className="text-sm text-muted-foreground py-1">
                        {formatPrice(priceMap[productId] ?? 0)}
                    </p>
                </div>
            )}

            <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="ao-qty">Qty</Label>
                    <Input id="ao-qty" type="number" min={1} {...register("quantity")} />
                    {errors.quantity && <p className="text-xs text-destructive">{errors.quantity.message}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="ao-note">Who / note (optional)</Label>
                    <Input id="ao-note" placeholder="e.g. Alice" {...register("note")} />
                </div>
            </div>

            <Button type="submit" disabled={isPending || !productId}>
                {isPending ? "Adding…" : "Add order"}
            </Button>
        </form>
    )
}

// ---- Edit order dialog -----------------------------------------------------

const editOrderSchema = z.object({
    quantity: z.coerce.number().int().min(1, "Min 1"),
    note: z.string(),
})
type EditOrderValues = z.infer<typeof editOrderSchema>

function EditOrderDialog({ order, tableId }: { order: Order; tableId: string }) {
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const { register, handleSubmit, formState: { errors } } = useForm<EditOrderValues>({
        resolver: zodResolver(editOrderSchema),
        defaultValues: { quantity: order.quantity, note: order.note ?? "" },
    })

    function onSubmit(values: EditOrderValues) {
        startTransition(async () => {
            const result = await updateOrderAction(order.id, tableId, values.quantity, values.note)
            if (result?.error) toast.error(result.error)
            else {
                toast.success("Order updated")
                setOpen(false)
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={(props) => (
                <Button {...props} variant="ghost" size="sm" className="h-7 px-2 text-xs">
                    Edit
                </Button>
            )} />
            <DialogContent className="sm:max-w-xs">
                <DialogHeader>
                    <DialogTitle>Edit — {order.product_name}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="eo-qty">Quantity</Label>
                        <Input id="eo-qty" type="number" min={1} {...register("quantity")} />
                        {errors.quantity && <p className="text-xs text-destructive">{errors.quantity.message}</p>}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="eo-note">Who / note</Label>
                        <Input id="eo-note" placeholder="e.g. Alice" {...register("note")} />
                    </div>
                    <Button type="submit" disabled={isPending}>
                        {isPending ? "Saving…" : "Save"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ---- Remove order button ---------------------------------------------------

function RemoveOrderButton({ order, tableId }: { order: Order; tableId: string }) {
    const [isPending, startTransition] = useTransition()

    function handleRemove() {
        startTransition(async () => {
            const result = await removeOrderAction(order.id, tableId)
            if (result?.error) toast.error(result.error)
            else toast.success("Order removed")
        })
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger render={(props) => (
                <Button
                    {...props}
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                >
                    Remove
                </Button>
            )} />
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Remove order?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Remove {order.quantity}× {order.product_name} from the table?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleRemove}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        Remove
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

// ---- Main component --------------------------------------------------------

interface Props {
    bill: TableWithOrders
    products: Product[]
    sections: MenuSectionWithProducts[]
}

export function TableDetailClient({ bill, products, sections }: Props) {
    return (
        <>
            <AutoRefresh disabled={bill.closed} />
            <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex flex-col gap-1">
                    <Link
                        href="/management/tables"
                        className="text-xs text-muted-foreground hover:underline mb-1"
                    >
                        ← All tables
                    </Link>
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-xl font-semibold">{bill.name}</h1>
                        <Badge variant={bill.closed ? "secondary" : "default"}>
                            {bill.closed ? "Closed" : "Open"}
                        </Badge>
                    </div>
                    {bill.notes && (
                        <p className="text-sm text-muted-foreground">{bill.notes}</p>
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                    <EditTableDialog bill={bill} />
                    <CloseReopenButton bill={bill} />
                </div>

                <Separator />

                {/* Orders */}
                <section className="flex flex-col gap-3">
                    <h2 className="text-sm font-medium">Orders</h2>
                    {bill.orders.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No orders yet.</p>
                    ) : (
                        <div className="flex flex-col divide-y rounded-md border">
                            {bill.orders.map((order) => (
                                <OrderRow
                                    key={order.id}
                                    order={order}
                                    tableId={bill.id}
                                    tableClosed={bill.closed}
                                />
                            ))}
                        </div>
                    )}

                    {/* Total */}
                    <div className="flex items-center justify-between rounded-md bg-muted/40 px-4 py-3">
                        <span className="font-medium">Total</span>
                        <span className="text-lg font-semibold tabular-nums">
                            {formatPrice(bill.total)}
                        </span>
                    </div>
                </section>

                {/* Add order */}
                {!bill.closed && (
                    <>
                        <Separator />
                        <section className="flex flex-col gap-3">
                            <h2 className="text-sm font-medium">Add order</h2>
                            <AddOrderForm
                                tableId={bill.id}
                                products={products}
                                sections={sections}
                            />
                        </section>
                    </>
                )}
            </div>
        </>
    )
}

function OrderRow({
    order,
    tableId,
    tableClosed,
}: {
    order: Order
    tableId: string
    tableClosed: boolean
}) {
    return (
        <div className="flex items-start gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="font-medium">{order.product_name}</span>
                    <span className="text-xs text-muted-foreground">×{order.quantity}</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-2 mt-0.5">
                    {order.note && (
                        <span className="text-xs text-muted-foreground">{order.note}</span>
                    )}
                    <span className="text-xs text-muted-foreground/60">{formatOrderTime(order.created_at)}</span>
                </div>
                {!tableClosed && (
                    <div className="mt-1 flex gap-1">
                        <EditOrderDialog order={order} tableId={tableId} />
                        <RemoveOrderButton order={order} tableId={tableId} />
                    </div>
                )}
            </div>
            <span className="tabular-nums text-sm shrink-0 pt-0.5">
                {order.unit_price > 0
                    ? formatPrice(order.unit_price * order.quantity)
                    : <span className="text-muted-foreground">—</span>}
            </span>
        </div>
    )
}
