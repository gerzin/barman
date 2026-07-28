import { Skeleton } from "@/components/ui/skeleton"

/** Loading placeholder for MenuView, shown while the menu is being fetched
 * (see app/loading.tsx). Mirrors its layout: search bar, tab bar, grid of
 * product cards. */
export function MenuSkeleton() {
    return (
        <div className="flex flex-col gap-4">
            <Skeleton className="h-8 w-full rounded-lg" />

            <div className="flex gap-2">
                <Skeleton className="h-8 w-16 rounded-md" />
                <Skeleton className="h-8 w-20 rounded-md" />
                <Skeleton className="h-8 w-14 rounded-md" />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-xl" />
                ))}
            </div>
        </div>
    )
}
