"use client";

import { NewRequestForm } from "~/new-request-form/new-request-form"
import { type ApiRequestSetting, columns } from "./columns"
import { DataTable } from "./data-table"

async function getData(): Promise<ApiRequestSetting[]> {
  // Fetch data from your API here.
  return [
    {
        method: "GET",
        route: "api/User",
        delayMs: 0,
        causeException: false
    },
    // ...
  ]
}

export default async function RequestSettings() {
  const data = await getData()

  return (
    <div className="container mx-auto py-10">
        <NewRequestForm />
        <DataTable columns={columns} data={data} />
    </div>
  );
}
