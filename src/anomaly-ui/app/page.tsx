"use client"

import AnomalyMonitor from "@/anomaly-monitor/AnomalyMonitor";
import ApiControlPanel from "@/api-control-panel/api-control-panel";

export default function Home() {
  return (
    <div className="w-screen max-w-full h-screen p-0 m-0 ">
      <h1 className="text-2xl font-bold p-2">Anomaly Detection Using Half-Space Trees</h1>
      
      <div className="flex w-full h-full">
        {/* Fixed width for the control panel */}
        <div className="w-100 min-w-100 p-2">
          <ApiControlPanel />
        </div>

        {/* Take all remaining space for the monitor */}
        <div className="flex-grow h-full p-2">
          <AnomalyMonitor />
        </div>
      </div>
    </div>
  );
}
