"use client";

import { useState, useEffect, useRef } from "react";

export interface ApiEndpoint {
  method: string; // HTTP method (GET, POST, PUT, etc.)
  url: string;
  body?: string | null;
  weight: number; // Probability weight for this endpoint (higher = more calls)
  params?: Record<string, string | number>; // Optional query parameters
}

interface ApiServiceOptions {
  endpoints: ApiEndpoint[];
  requestsPerSecond: number;
  enabled: boolean;
  onSuccess?: (data: any, method: string, url: string) => void;
  onError?: (error: any, method: string, url: string) => void;
  headers?: Record<string, string>;
}

export function useApiService(options: ApiServiceOptions) {
  const {
    endpoints,
    requestsPerSecond = 1,
    enabled = false,
    onSuccess,
    onError,
    headers = {},
  } = options;

  const [isRunning, setIsRunning] = useState<boolean>(enabled);
  const [callCount, setCallCount] = useState<number>(0);
  const [errors, setErrors] = useState<number>(0);
  const [endpointStats, setEndpointStats] = useState<
    Record<string, { calls: number; errors: number }>
  >({});
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate delay in ms between requests
  const delay = Math.max(Math.floor(1000 / requestsPerSecond), 100);

  // Initialize endpoint stats
  useEffect(() => {
    const initialStats: Record<string, { calls: number; errors: number }> = {};
    endpoints.forEach((endpoint) => {
      initialStats[endpoint.url] = { calls: 0, errors: 0 };
    });
    setEndpointStats(initialStats);
  }, [endpoints]);

  // Select a random endpoint based on weights
  const selectEndpoint = (): ApiEndpoint => {
    // Default weight is 1 if not specified
    const totalWeight = endpoints.reduce(
      (sum, endpoint) => sum + (endpoint.weight || 1),
      0
    );
    let random = Math.random() * totalWeight;

    for (const endpoint of endpoints) {
      const weight = endpoint.weight || 1;
      if (random < weight) {
        return endpoint;
      }
      random -= weight;
    }

    // Fallback to first endpoint (shouldn't normally reach here)
    return endpoints[0];
  };

  // Build URL with query parameters
  const buildUrl = (endpoint: ApiEndpoint): string => {
    if (!endpoint.params) return endpoint.url;

    const url = new URL(endpoint.url);
    Object.entries(endpoint.params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });

    return url.toString();
  };

  const makeApiCall = async () => {
    if (endpoints.length === 0) return;

    const selectedEndpoint = selectEndpoint();
    const fullUrl = buildUrl(selectedEndpoint);

    try {
      const response = await fetch(fullUrl, {
        method: selectedEndpoint.method || "GET", // Use specified method or default to GET
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: selectedEndpoint.body
      });

      const data = await response.text();
      setCallCount((prev) => prev + 1);

      // Update stats for this endpoint
      setEndpointStats((prev) => ({
        ...prev,
        [selectedEndpoint.url]: {
          calls: (prev[selectedEndpoint.url]?.calls || 0) + 1,
          errors: prev[selectedEndpoint.url]?.errors || 0,
        },
      }));

      if (onSuccess) onSuccess(data, selectedEndpoint.method, selectedEndpoint.url);
      return data;
    } catch (error) {
      setErrors((prev) => prev + 1);

      // Update error stats for this endpoint
      setEndpointStats((prev) => ({
        ...prev,
        [selectedEndpoint.url]: {
          calls: prev[selectedEndpoint.url]?.calls || 0,
          errors: (prev[selectedEndpoint.url]?.errors || 0) + 1,
        },
      }));

      if (onError) onError(error, selectedEndpoint.method, selectedEndpoint.url);
      console.error(`API call failed for ${selectedEndpoint.url}:`, error);
    }
  };

  const startService = () => {
    if (intervalRef.current) return;

    setIsRunning(true);
    intervalRef.current = setInterval(makeApiCall, delay);
    console.log(
      `API service started - ${requestsPerSecond} requests/second across ${endpoints.length} endpoints`
    );
  };

  const stopService = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    console.log(
      `API service stopped after ${callCount} calls with ${errors} errors`
    );
  };

  // Control the service based on the enabled prop
  useEffect(() => {
    if (enabled) {
      startService();
    } else {
      stopService();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled]);

  return {
    isRunning,
    callCount,
    errors,
    endpointStats,
    startService,
    stopService,
    makeApiCall, // Expose single call for manual triggering
  };
}
