"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import type { Table } from "@/lib/api/types"
import { createTableAction, deleteTableAction } from "@/lib/actions/tables"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

const tableSchema = z.object({
    name: z.string().min(1, "Required"),
    notes: z.string(),
})
type TableFormValues = z.infer<typeof tableSchema>

function CreateTableDialog() {
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const { register, handleSubmit, reset, formState: { errors } } = useForm<TableFormValues>({
        resolver: zodResolver(tableSchema),
        defaultValues: { name: "", notes: "" },
    })

    function onSubmit(values: TableFormValues) {
        startTransition(async () => {
            const result = await createTableAction(values.name, values.notes)
            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success("Table created")
                reset()
                setOpen(false)
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={(props) => <Button {...props} size="sm">New table</Button>} />
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>Create table</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="t-name">Name</Label>
                        <Input id="t-name" placeholder="e.g. Table 3" {...register("name")} />
                        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="t-notes">Notes (optional)</Label>
                        <Input id="t-notes" placeholder="e.g. Window seat, 4 people" {...register("notes")} />
                    </div>
                    <Button type="submit" disabled={isPending}>
                        {isPending ? "Creating…" : "Create"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}

function DeleteTableButton({ table }: { table: Table }) {
    const [isPending, startTransition] = useTransition()

    function handleDelete() {
        startTransition(async () => {
            const result = await deleteTableAction(table.id)
            if (result?.error) toast.error(result.error)
            else toast.success(`"${table.name}" deleted`)
        })
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger render={(props) => (
                <Button
                    {...props}
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    aria-label="Delete table"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                </Button>
            )} />
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete {table.name}?</AlertDialogTitle>
                    <AlertDialogDescription>
                        All orders and logs for this table will be permanently deleted.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

export function TablesClient({ tables }: { tables: Table[] }) {
    const open = tables.filter((t) => !t.closed)
    const closed = tables.filter((t) => t.closed)

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Tables</h1>
                <CreateTableDialog />
            </div>

            {tables.length === 0 && (
                <p className="text-sm text-muted-foreground">No tables yet. Create one to get started.</p>
            )}

            {open.length > 0 && (
                <section className="flex flex-col gap-2">
                    <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Open</h2>
                    <div className="flex flex-col gap-2">
                        {open.map((table) => (
                            <TableCard key={table.id} table={table} />
                        ))}
                    </div>
                </section>
            )}

            {closed.length > 0 && (
                <section className="flex flex-col gap-2">
                    <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Closed</h2>
                    <div className="flex flex-col gap-2 opacity-60">
                        {closed.map((table) => (
                            <TableCard key={table.id} table={table} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    )
}

function TableCard({ table }: { table: Table }) {
    return (
        <div className="relative flex items-stretch rounded-xl border bg-card">
            {/* Tappable main area */}
            <Link
                href={`/management/tables/${table.id}`}
                className="flex flex-1 items-center gap-3 px-4 py-4 min-h-[68px]"
            >
                <div className="min-w-0 flex-1">
                    <p className="font-semibold leading-tight">{table.name}</p>
                    {table.notes && (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{table.notes}</p>
                    )}
                </div>
                <Badge variant={table.closed ? "secondary" : "default"} className="shrink-0">
                    {table.closed ? "Closed" : "Open"}
                </Badge>
            </Link>
            {/* Delete sits outside the link */}
            <div className="flex items-center border-l pl-1 pr-2">
                <DeleteTableButton table={table} />
            </div>
        </div>
    )
}
