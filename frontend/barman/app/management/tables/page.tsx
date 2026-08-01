import { getToken } from "@/lib/session"
import { listTables } from "@/lib/api/tables"
import { TablesClient } from "./_components/tables-client"

export default async function TablesPage() {
    const token = await getToken()
    const tables = token ? await listTables(token).catch(() => []) : []
    return <TablesClient tables={tables} />
}
