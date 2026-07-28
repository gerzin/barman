import { UtensilsCrossed } from "lucide-react"

export function MenuEmptyState({
    title = "Menu unavailable",
    description = "We couldn't load the menu right now. Please ask a member of staff, or try refreshing the page.",
}: {
    title?: string
    description?: string
}) {
    return (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
            <UtensilsCrossed className="size-8 text-muted-foreground" aria-hidden="true" />
            <div className="space-y-1 px-6">
                <p className="font-heading font-medium">{title}</p>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
        </div>
    )
}
