import { Badge } from "@/components/ui/badge"
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { formatPrice } from "@/lib/format"
import type { Product } from "@/lib/api/types"
import { cn } from "@/lib/utils"

export function ProductCard({ product }: { product: Product }) {
    return (
        <Card className={cn(!product.available && "opacity-60")}>
            <CardHeader>
                <CardTitle className="pr-16">{product.name}</CardTitle>
                <CardAction>
                    <span className="font-heading text-base font-semibold tabular-nums">
                        {formatPrice(product.price)}
                    </span>
                </CardAction>
                {product.description && (
                    <CardDescription>{product.description}</CardDescription>
                )}
            </CardHeader>
            {!product.available && (
                <CardContent className="pt-0">
                    <Badge variant="outline">Sold out</Badge>
                </CardContent>
            )}
        </Card>
    )
}
