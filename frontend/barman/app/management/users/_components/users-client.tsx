"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import type { User } from "@/lib/api/types"
import { createUserAction, deleteUserAction } from "@/lib/actions/users"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const createUserSchema = z.object({
    name: z.string().min(1, "Required"),
    surname: z.string().min(1, "Required"),
    email: z.string().email("Invalid email"),
    phone: z.string().optional(),
    password: z.string().min(8, "At least 8 characters"),
    role: z.enum(["admin", "employee"]),
})

type CreateUserValues = z.infer<typeof createUserSchema>

function CreateUserDialog() {
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CreateUserValues>({
        resolver: zodResolver(createUserSchema),
        defaultValues: { role: "employee" },
    })

    function onSubmit(values: CreateUserValues) {
        startTransition(async () => {
            const result = await createUserAction(values)
            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success("User created")
                reset()
                setOpen(false)
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={(props) => <Button {...props} size="sm">New user</Button>} />
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Create user</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" {...register("name")} />
                            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="surname">Surname</Label>
                            <Input id="surname" {...register("surname")} />
                            {errors.surname && <p className="text-xs text-destructive">{errors.surname.message}</p>}
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" {...register("email")} />
                        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="phone">Phone (optional)</Label>
                        <Input id="phone" {...register("phone")} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="password">Password</Label>
                        <Input id="password" type="password" {...register("password")} />
                        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label>Role</Label>
                        <Select defaultValue="employee" onValueChange={(v) => setValue("role", v as "admin" | "employee")}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="employee">Employee</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button type="submit" disabled={isPending}>
                        {isPending ? "Creating…" : "Create"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}

function DeleteUserButton({ user }: { user: User }) {
    const [isPending, startTransition] = useTransition()

    function handleDelete() {
        startTransition(async () => {
            const result = await deleteUserAction(user.id)
            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success("User deleted")
            }
        })
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger render={(props) => (
                <Button {...props} variant="ghost" size="sm" className="text-destructive hover:text-destructive">Delete</Button>
            )} />
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete {user.name} {user.surname}?</AlertDialogTitle>
                    <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isPending}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

export function UsersClient({ users }: { users: User[] }) {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Users</h1>
                <CreateUserDialog />
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="w-16" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                    No users yet
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">
                                        {user.name} {user.surname}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <DeleteUserButton user={user} />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
