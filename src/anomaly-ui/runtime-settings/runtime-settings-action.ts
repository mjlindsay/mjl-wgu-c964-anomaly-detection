"use server"

export type EnvironmentSettings = {
  grafanaHost: string
  grafanaDashboardPath: string
  anomalyApiHost: string
}

export async function getRuntimeSettings(): Promise<EnvironmentSettings> {
    const settings: EnvironmentSettings = {
        grafanaHost: process.env.GRAFANA_HOST || "http://localhost:9000",
        grafanaDashboardPath: process.env.GRAFANA_DASHBOARD_PATH || "/d/cefo8i1m8lon4a/anomaly-count-comparison-working?orgId=1&from=now-1m&to=now&timezone=browser&refresh=10s&kiosk",
        anomalyApiHost: process.env.ANOMALY_API_HOST || "http://localhost:5258"
    }

    return settings
}