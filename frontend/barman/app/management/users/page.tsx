import { getToken } from "@/lib/session"
import { listUsers } from "@/lib/api/users"
import { UsersClient } from "./_components/users-client"

export default async function UsersPage() {
    const token = await getToken()
    const users = token ? await listUsers(token).catch(() => []) : []
    return <UsersClient users={users} />
}
