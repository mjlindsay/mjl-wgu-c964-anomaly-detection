"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AnomalyDetectionLogProps {
  className?: string;
}

export default function AnomalyMonitor({ className }: AnomalyDetectionLogProps) {
  return (
    <Card className={`h-full w-full ${className || ''}`}>
      <CardHeader className="pb-2">
        <CardTitle>Anomaly Detection Metrics</CardTitle>
        <CardDescription>
          Live monitoring of anomaly detection results
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full h-full items-stretch h-screen flex flex-col">
          <iframe 
            src="http://localhost:9000/public-dashboards/24f0c9562aeb420b8e1d383ab0fc18ce" 
            width="100%" 
            style={{ 
              border: "none",
              borderRadius: "var(--radius)",
              overflow: "hidden"
            }}
            className="h-full"
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