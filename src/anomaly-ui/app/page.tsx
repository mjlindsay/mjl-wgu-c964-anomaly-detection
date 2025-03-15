"use client"

import AnomalyMonitor from "@/anomaly-monitor/AnomalyMonitor";
import ApiControlPanel from "@/api-control-panel/api-control-panel";
import RequestGenerator from "@/request-generator/request-generator";

export default function Home() {
  return (
    <div className="container p-4 mx-auto">
      <h1 className="text-2xl font-bold mb-6">Anomaly Detection Test Environment</h1>
      
      <div className="grid grid-cols-4 gap-2 items-stretch">
        <div className="col-span-1">
          <ApiControlPanel />
        </div>

        <div className="col-span-3 h-full">
          <AnomalyMonitor />
        </div>
      </div>
    </div>
  );
}
