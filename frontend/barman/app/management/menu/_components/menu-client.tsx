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

// ─── Schemas ──────────────────────────────────────────────────────────────────

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

// ─── Shared delete confirmation ───────────────────────────────────────────────

function DeleteButton({ label, onConfirm }: { label: string; onConfirm: () => void }) {
    return (
        <AlertDialog>
            <AlertDialogTrigger render={(props) => (
                <Button {...props} variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                    Delete
                </Button>
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

// ─── Product dialog (create / edit) ──────────────────────────────────────────

function ProductDialog({
    product,
    sections,
    defaultSectionId,
}: {
    product?: Product
    sections: MenuSection[]
    // Pre-fills section when adding a product from within a section card
    defaultSectionId?: string | null
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
            : { name: "", description: "", price: 0, available: true, section_id: defaultSectionId ?? null },
    })

    const available = watch("available")
    const sectionId = watch("section_id")
    // SelectValue in base-ui can't resolve text before the dropdown has opened; resolve manually
    const sectionLabel = sectionId
        ? (sections.find((s) => s.id === sectionId)?.name ?? "No section")
        : "No section"

    function onSubmit(values: ProductValues) {
        startTransition(async () => {
            const input = { ...values, section_id: values.section_id || null }
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
                <Button {...props} variant={isEditing ? "ghost" : "outline"} size="sm">
                    {isEditing ? "Edit" : "+ Add product"}
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
                            defaultValue={sectionId ?? "none"}
                            onValueChange={(v) => setValue("section_id", v === "none" ? null : v)}
                        >
                            <SelectTrigger>
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

function SectionDialog({ section, nextPosition }: { section?: MenuSection; nextPosition: number }) {
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

// ─── Single product row ───────────────────────────────────────────────────────

function ProductRow({ product, sections }: { product: Product; sections: MenuSection[] }) {
    const [isPending, startTransition] = useTransition()

    function handleToggle() {
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

    function handleDelete() {
        startTransition(async () => {
            const result = await deleteProductAction(product.id)
            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success(`"${product.name}" deleted`)
            }
        })
    }

    return (
        <div className="flex items-center gap-3 px-4 py-2.5">
            <Switch
                checked={product.available}
                onCheckedChange={handleToggle}
                disabled={isPending}
                aria-label={`Toggle ${product.name} availability`}
            />
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{product.name}</p>
                {product.description && (
                    <p className="truncate text-xs text-muted-foreground">{product.description}</p>
                )}
            </div>
            <span className="shrink-0 text-sm">€{product.price.toFixed(2)}</span>
            {!product.available && (
                <Badge variant="secondary" className="shrink-0 text-xs">Off</Badge>
            )}
            <ProductDialog product={product} sections={sections} />
            <DeleteButton label={product.name} onConfirm={handleDelete} />
        </div>
    )
}

// ─── Section card (header + products + add-product button) ───────────────────

function SectionCard({
    section,
    products,
    sections,
    nextPosition,
}: {
    section: MenuSection
    products: Product[]
    sections: MenuSection[]
    nextPosition: number
}) {
    const [isPending, startTransition] = useTransition()

    function handleDeleteSection() {
        startTransition(async () => {
            const result = await deleteSectionAction(section.id)
            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success(`"${section.name}" deleted`)
            }
        })
    }

    return (
        <div className="rounded-md border">
            <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-2.5">
                <div className="min-w-0 flex-1">
                    <p className="font-semibold">{section.name}</p>
                    {section.description && (
                        <p className="text-xs text-muted-foreground">{section.description}</p>
                    )}
                </div>
                <SectionDialog section={section} nextPosition={nextPosition} />
                <DeleteButton label={section.name} onConfirm={handleDeleteSection} />
            </div>

            <div className="divide-y">
                {products.length === 0 && (
                    <p className="px-4 py-3 text-sm text-muted-foreground">No products yet.</p>
                )}
                {products.map((p) => (
                    <ProductRow key={p.id} product={p} sections={sections} />
                ))}
            </div>

            <div className="border-t px-3 py-2">
                <ProductDialog defaultSectionId={section.id} sections={sections} />
            </div>
        </div>
    )
}

// ─── Root component ───────────────────────────────────────────────────────────

export function MenuClient({ products, sections }: { products: Product[]; sections: MenuSection[] }) {
    const sortedSections = [...sections].sort((a, b) => a.position - b.position)
    const uncategorized = products.filter((p) => !p.section_id)

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Menu</h1>
                <SectionDialog nextPosition={sections.length} />
            </div>

            {sortedSections.length === 0 && products.length === 0 && (
                <p className="text-sm text-muted-foreground">
                    Start by creating a section, then add products to it.
                </p>
            )}

            {sortedSections.map((section) => (
                <SectionCard
                    key={section.id}
                    section={section}
                    products={products.filter((p) => p.section_id === section.id)}
                    sections={sections}
                    nextPosition={sections.length}
                />
            ))}

            {/* Uncategorized bucket — always visible so products can exist without a section */}
            <div className="rounded-md border">
                <div className="border-b bg-muted/40 px-4 py-2.5">
                    <p className="font-semibold text-muted-foreground">Uncategorized</p>
                </div>
                <div className="divide-y">
                    {uncategorized.length === 0 && (
                        <p className="px-4 py-3 text-sm text-muted-foreground">No uncategorized products.</p>
                    )}
                    {uncategorized.map((p) => (
                        <ProductRow key={p.id} product={p} sections={sections} />
                    ))}
                </div>
                <div className="border-t px-3 py-2">
                    <ProductDialog sections={sections} />
                </div>
            </div>
        </div>
    )
}
