"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EnvironmentSettings, getRuntimeSettings } from "@/runtime-settings/runtime-settings-action";

interface AnomalyDetectionLogProps {
  className?: string;
}

export default function AnomalyMonitor({ className }: AnomalyDetectionLogProps) {
  // State for dashboard URL
  const [dashboardUrl, setDashboardUrl] = useState<string>("");
  // State for loading status
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // State for any errors
  const [error, setError] = useState<string | null>(null);

  // Fetch runtime settings when component mounts
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const settings: EnvironmentSettings = await getRuntimeSettings();
        const fullDashboardUrl = `${settings.grafanaHost}${settings.grafanaDashboardPath}`;
        console.log("Dashboard URL:", fullDashboardUrl);
        setDashboardUrl(fullDashboardUrl);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch runtime settings:", err);
        setError("Failed to load dashboard settings");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return (
    <Card className={`w-full h-full flex flex-col ${className || ''}`}>
      <CardHeader className="pb-2">
        <CardTitle>Anomaly Detection Metrics</CardTitle>
        <CardDescription>
          Live monitoring of anomaly detection results
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow p-1">
        <div className="w-full h-full flex flex-col">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full text-destructive">
              <p>{error}</p>
            </div>
          ) : (
            <iframe 
              src={dashboardUrl}
              width="100%" 
              style={{ 
                border: "none",
                borderRadius: "var(--radius)",
                overflow: "hidden",
                height: "calc(100vh - 200px)" // Adjust as needed
              }}
              title="Anomaly Detection Dashboard"
              allow="fullscreen"
              loading="lazy"
            />
          )}
          
          <div className="text-xs text-muted-foreground mt-2 text-center">
            Dashboard refreshes every 10 seconds
          </div>
        </div>
      </CardContent>
    </Card>
  );
}