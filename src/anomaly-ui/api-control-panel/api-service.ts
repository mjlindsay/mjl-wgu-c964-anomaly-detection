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
  maxConcurrentRequests?: number;
  onSuccess?: (data: any, method: string, url: string) => void;
  onError?: (error: any, method: string, url: string) => void;
  headers?: Record<string, string>;
}

export function useApiService(options: ApiServiceOptions) {
  const {
    endpoints,
    requestsPerSecond = 1,
    enabled = false,
    maxConcurrentRequests = 10, // Limit concurrent requests
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
  
  // Keep track of in-flight requests to manage concurrency
  const activeRequestsRef = useRef<number>(0);
  const schedulerRef = useRef<NodeJS.Timeout | null>(null);
  const shouldContinueRef = useRef<boolean>(false);

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
    if (endpoints.length === 0 || !shouldContinueRef.current) return;
    
    // Increment active requests counter
    activeRequestsRef.current += 1;
    
    try {
      const selectedEndpoint = selectEndpoint();
      const fullUrl = buildUrl(selectedEndpoint);

      // Use AbortController to support request cancellation if needed
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
      
      const response = await fetch(fullUrl, {
        method: selectedEndpoint.method || "GET",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: selectedEndpoint.body ? selectedEndpoint.body : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.text();
      
      // Update stats using functional updates to avoid race conditions
      setCallCount(prev => prev + 1);
      setEndpointStats(prev => ({
        ...prev,
        [selectedEndpoint.url]: {
          calls: (prev[selectedEndpoint.url]?.calls || 0) + 1,
          errors: prev[selectedEndpoint.url]?.errors || 0,
        },
      }));

      if (onSuccess) onSuccess(data, selectedEndpoint.method, selectedEndpoint.url);
      return data;
    } catch (error: any) {
      // Only count as error if not aborted
      if (error.name !== 'AbortError') {
        setErrors(prev => prev + 1);
        
        const selectedEndpoint = selectEndpoint();
        setEndpointStats(prev => ({
          ...prev,
          [selectedEndpoint.url]: {
            calls: prev[selectedEndpoint.url]?.calls || 0,
            errors: (prev[selectedEndpoint.url]?.errors || 0) + 1,
          },
        }));
        
        if (onError) onError(error, selectedEndpoint.method, selectedEndpoint.url);
        console.error(`API call failed:`, error);
      }
    } finally {
      // Decrement active requests counter
      activeRequestsRef.current -= 1;
      
      // If we're still running and below concurrency limit, schedule next request
      if (shouldContinueRef.current && activeRequestsRef.current < maxConcurrentRequests) {
        scheduleNextRequest();
      }
    }
  };

  // Schedule the next request based on the configured rate
  const scheduleNextRequest = () => {
    if (!shouldContinueRef.current) return;
    
    // Only schedule a new request if we're below the concurrency limit
    if (activeRequestsRef.current < maxConcurrentRequests) {
      // Use setTimeout instead of setInterval for more precise control
      schedulerRef.current = setTimeout(() => {
        // Start the request (non-blocking)
        makeApiCall().catch(console.error);
        
        // Immediately schedule the next request if we're below concurrency limit
        if (shouldContinueRef.current && activeRequestsRef.current < maxConcurrentRequests) {
          scheduleNextRequest();
        }
      }, delay);
    }
  };

  const startService = () => {
    if (shouldContinueRef.current) return;
    
    setIsRunning(true);
    shouldContinueRef.current = true;
    activeRequestsRef.current = 0;
    
    // Start with multiple concurrent requests up to the limit
    const initialBatch = Math.min(maxConcurrentRequests, 3); // Start with a few requests
    
    for (let i = 0; i < initialBatch; i++) {
      scheduleNextRequest();
    }
    
    console.log(
      `API service started - target ${requestsPerSecond} req/sec, max ${maxConcurrentRequests} concurrent requests`
    );
  };

  const stopService = () => {
    shouldContinueRef.current = false;
    
    // Clear any scheduled requests
    if (schedulerRef.current) {
      clearTimeout(schedulerRef.current);
      schedulerRef.current = null;
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
      shouldContinueRef.current = false;
      if (schedulerRef.current) {
        clearTimeout(schedulerRef.current);
      }
    };
  }, [enabled]);

  // Single call function for manual triggering
  const triggerSingleCall = () => {
    return makeApiCall();
  };

  return {
    isRunning,
    callCount,
    errors,
    endpointStats,
    startService,
    stopService,
    makeApiCall: triggerSingleCall, // Expose single call for manual triggering
  };
}
