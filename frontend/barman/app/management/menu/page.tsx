import { getToken } from "@/lib/session"
import { listProducts } from "@/lib/api/products"
import { listSections } from "@/lib/api/menu"
import { MenuClient } from "./_components/menu-client"

export default async function MenuPage() {
    const token = await getToken()
    const [products, sections] = await Promise.all([
        token ? listProducts(token).catch(() => []) : [],
        token ? listSections(token).catch(() => []) : [],
    ])
    return <MenuClient products={products} sections={sections} />
}
