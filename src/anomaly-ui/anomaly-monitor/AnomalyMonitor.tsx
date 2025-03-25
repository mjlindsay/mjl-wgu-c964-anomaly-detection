"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AnomalyDetectionLogProps {
  className?: string;
}

export default function AnomalyMonitor({ className }: AnomalyDetectionLogProps) {
  return (
    <Card className={` w-full flex fles-col ${className || ''}`}>
      <CardHeader className="pb-2">
        <CardTitle>Anomaly Detection Metrics</CardTitle>
        <CardDescription>
          Live monitoring of anomaly detection results
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="w-full items-stretch h-screen flex flex-col">
          <iframe 
            src="http://localhost:9000/d/cefo8i1m8lon4a/anomaly-count-comparison-working?orgId=1&from=now-1m&to=now&timezone=browser&refresh=10s&kiosk" 
            width="100%" 
            style={{ 
              border: "none",
              borderRadius: "var(--radius)",
              overflow: "hidden"
            }}
            className="h-screen w-full"
            title="Anomaly Detection Dashboard"
            allow="fullscreen"
            loading="lazy"
          />
          
          <div className="text-xs text-muted-foreground mt-2 text-center">
            Dashboard refreshes every 5 seconds
          </div>
        </div>
      </CardContent>
    </Card>
  );
}