
import type { ColumnDef } from '@tanstack/react-table'

export type ApiRequestSetting = {
    method: string,
    route: string
    delayMs: number,
    causeException: boolean
}

export const columns: ColumnDef<ApiRequestSetting>[] = [
    {
        accessorKey: "method",
        header: "HTTP Method"
    },
    {
        accessorKey: "route",
        header: "Route",
    },
    {
        accessorKey: "delayMs",
        header: "Delay (ms)"
    },
    {
        accessorKey: "causeException",
        header: "Cause Exception?"
    }
]