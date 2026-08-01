import { notFound } from "next/navigation"
import { getToken } from "@/lib/session"
import { getTableBill } from "@/lib/api/tables"
import { listProducts } from "@/lib/api/products"
import { getMenu } from "@/lib/api/menu"
import { TableDetailClient } from "./_components/table-detail-client"

interface Props {
    params: Promise<{ id: string }>
}

export default async function TableDetailPage({ params }: Props) {
    const { id } = await params
    const token = await getToken()
    if (!token) notFound()

    const [bill, products, menu] = await Promise.all([
        getTableBill(id, token).catch(() => null),
        listProducts(token).catch(() => []),
        getMenu().catch(() => []),
    ])

    if (!bill) notFound()

    return <TableDetailClient bill={bill} products={products} sections={menu} />
}
