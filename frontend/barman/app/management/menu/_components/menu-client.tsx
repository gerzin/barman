"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import type { Product, MenuSection } from "@/lib/api/types"
import { createProductAction, updateProductAction, deleteProductAction } from "@/lib/actions/products"
import { createSectionAction, updateSectionAction, deleteSectionAction } from "@/lib/actions/menu"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
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

// ─── Schemas ─────────────────────────────────────────────────────────────────

const productSchema = z.object({
    name: z.string().min(1, "Required"),
    description: z.string(),
    price: z.coerce.number().positive("Must be greater than 0"),
    available: z.boolean(),
    section_id: z.string().nullable().optional(),
})

const sectionSchema = z.object({
    name: z.string().min(1, "Required"),
    description: z.string(),
    position: z.coerce.number().int().min(0),
})

type ProductValues = z.infer<typeof productSchema>
type SectionValues = z.infer<typeof sectionSchema>

// ─── Product dialog (create / edit) ──────────────────────────────────────────

function ProductDialog({
    product,
    sections,
}: {
    product?: Product
    sections: MenuSection[]
}) {
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const isEditing = !!product

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ProductValues>({
        resolver: zodResolver(productSchema),
        defaultValues: product
            ? {
                name: product.name,
                description: product.description,
                price: product.price,
                available: product.available,
                section_id: product.section_id ?? null,
            }
            : { name: "", description: "", price: 0, available: true, section_id: null },
    })

    const available = watch("available")
    const sectionId = watch("section_id")
    const sectionLabel = sectionId
        ? (sections.find((s) => s.id === sectionId)?.name ?? "No section")
        : "No section"

    function onSubmit(values: ProductValues) {
        startTransition(async () => {
            const input = {
                ...values,
                section_id: values.section_id || null,
            }
            const result = isEditing
                ? await updateProductAction(product.id, input)
                : await createProductAction(input)

            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success(isEditing ? "Product updated" : "Product created")
                if (!isEditing) reset()
                setOpen(false)
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={(props) => (
                <Button {...props} variant={isEditing ? "ghost" : "default"} size="sm">
                    {isEditing ? "Edit" : "New product"}
                </Button>
            )} />
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit product" : "New product"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="p-name">Name</Label>
                        <Input id="p-name" {...register("name")} />
                        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="p-desc">Description</Label>
                        <Input id="p-desc" {...register("description")} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="p-price">Price (€)</Label>
                        <Input id="p-price" type="number" step="0.01" {...register("price")} />
                        {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label>Section</Label>
                        <Select
                            defaultValue={product?.section_id ?? "none"}
                            onValueChange={(v) => setValue("section_id", v === "none" ? null : v)}
                        >
                            <SelectTrigger>
                                {/* SelectValue can't resolve text before dropdown opens; resolve name manually */}
                                <span>{sectionLabel}</span>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">No section</SelectItem>
                                {sections.map((s) => (
                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center gap-3">
                        <Switch
                            id="p-available"
                            checked={available}
                            onCheckedChange={(v) => setValue("available", v)}
                        />
                        <Label htmlFor="p-available">Available</Label>
                    </div>
                    <Button type="submit" disabled={isPending}>
                        {isPending ? "Saving…" : "Save"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ─── Section dialog (create / edit) ──────────────────────────────────────────

function SectionDialog({
    section,
    nextPosition,
}: {
    section?: MenuSection
    nextPosition: number
}) {
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const isEditing = !!section

    const { register, handleSubmit, reset, formState: { errors } } = useForm<SectionValues>({
        resolver: zodResolver(sectionSchema),
        defaultValues: section
            ? { name: section.name, description: section.description, position: section.position }
            : { name: "", description: "", position: nextPosition },
    })

    function onSubmit(values: SectionValues) {
        startTransition(async () => {
            const result = isEditing
                ? await updateSectionAction(section.id, values)
                : await createSectionAction(values)

            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success(isEditing ? "Section updated" : "Section created")
                if (!isEditing) reset()
                setOpen(false)
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={(props) => (
                <Button {...props} variant={isEditing ? "ghost" : "default"} size="sm">
                    {isEditing ? "Edit" : "New section"}
                </Button>
            )} />
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit section" : "New section"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="s-name">Name</Label>
                        <Input id="s-name" {...register("name")} />
                        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="s-desc">Description</Label>
                        <Input id="s-desc" {...register("description")} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="s-pos">Position</Label>
                        <Input id="s-pos" type="number" {...register("position")} />
                        {errors.position && <p className="text-xs text-destructive">{errors.position.message}</p>}
                    </div>
                    <Button type="submit" disabled={isPending}>
                        {isPending ? "Saving…" : "Save"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ─── Delete confirm helpers ───────────────────────────────────────────────────

function DeleteButton({ label, onConfirm }: { label: string; onConfirm: () => void }) {
    return (
        <AlertDialog>
            <AlertDialogTrigger render={(props) => (
                <Button {...props} variant="ghost" size="sm" className="text-destructive hover:text-destructive">Delete</Button>
            )} />
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete {label}?</AlertDialogTitle>
                    <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

// ─── Products list ────────────────────────────────────────────────────────────

function ProductsSection({ products, sections }: { products: Product[]; sections: MenuSection[] }) {
    const [isPending, startTransition] = useTransition()

    function handleToggle(product: Product) {
        startTransition(async () => {
            const result = await updateProductAction(product.id, {
                name: product.name,
                description: product.description,
                price: product.price,
                available: !product.available,
                section_id: product.section_id,
            })
            if (result?.error) toast.error(result.error)
        })
    }

    function handleDelete(id: string, name: string) {
        startTransition(async () => {
            const result = await deleteProductAction(id)
            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success(`"${name}" deleted`)
            }
        })
    }

    const sectionName = (id?: string | null) =>
        id ? sections.find((s) => s.id === id)?.name ?? "—" : "—"

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Products</h2>
                <ProductDialog sections={sections} />
            </div>
            <div className="flex flex-col divide-y rounded-md border">
                {products.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">No products yet</p>
                ) : (
                    products.map((product) => (
                        <div key={product.id} className="flex items-center gap-3 px-4 py-3">
                            <Switch
                                checked={product.available}
                                onCheckedChange={() => handleToggle(product)}
                                disabled={isPending}
                                aria-label="Available"
                            />
                            <div className="min-w-0 flex-1">
                                <p className="truncate font-medium">{product.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    €{product.price.toFixed(2)} · {sectionName(product.section_id)}
                                </p>
                            </div>
                            <Badge variant={product.available ? "default" : "secondary"}>
                                {product.available ? "Available" : "Unavailable"}
                            </Badge>
                            <ProductDialog
                                product={product}
                                sections={sections}
                            />
                            <DeleteButton
                                label={product.name}
                                onConfirm={() => handleDelete(product.id, product.name)}
                            />
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

// ─── Sections list ────────────────────────────────────────────────────────────

function SectionsSection({ sections }: { sections: MenuSection[] }) {
    const [isPending, startTransition] = useTransition()
    const nextPosition = sections.length

    function handleDelete(id: string, name: string) {
        startTransition(async () => {
            const result = await deleteSectionAction(id)
            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success(`"${name}" deleted`)
            }
        })
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Sections</h2>
                <SectionDialog nextPosition={nextPosition} />
            </div>
            <div className="flex flex-col divide-y rounded-md border">
                {sections.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">No sections yet</p>
                ) : (
                    sections.map((section) => (
                        <div key={section.id} className="flex items-center gap-3 px-4 py-3">
                            <div className="min-w-0 flex-1">
                                <p className="truncate font-medium">{section.name}</p>
                                {section.description && (
                                    <p className="truncate text-sm text-muted-foreground">{section.description}</p>
                                )}
                            </div>
                            <span className="text-sm text-muted-foreground">#{section.position}</span>
                            <SectionDialog
                                section={section}
                                nextPosition={nextPosition}
                            />
                            <DeleteButton
                                label={section.name}
                                onConfirm={() => handleDelete(section.id, section.name)}
                            />
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

// ─── Root client component ────────────────────────────────────────────────────

export function MenuClient({ products, sections }: { products: Product[]; sections: MenuSection[] }) {
    return (
        <div className="flex flex-col gap-8">
            <ProductsSection products={products} sections={sections} />
            <Separator />
            <SectionsSection sections={sections} />
        </div>
    )
}
