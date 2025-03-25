"use client";

import { useState } from 'react';

export interface AnomalyOptions {
    causeException: boolean;
    targetDelayMs: number;
    exceptionRate: number;
    delayRate: number;
}

export interface AnomalyServiceResult {
    success: boolean;
    message: string;
    error?: any;
    isLoading: boolean;
}

/**
 * Hook for managing anomaly settings via the API
 */
export function useAnomalyService() {
    const [result, setResult] = useState<AnomalyServiceResult>({
        success: false,
        message: '',
        isLoading: false
    });

    /**
     * Updates anomaly settings by sending a POST request to the API
     * @param options The anomaly configuration options to apply
     * @returns A promise that resolves when the API call completes
     */
    const updateAnomalySettings = async (options: AnomalyOptions): Promise<AnomalyServiceResult> => {
        // Initialize loading state
        setResult({
            success: false,
            message: 'Sending anomaly settings...',
            isLoading: true
        });

        try {
            const response = await fetch('http://localhost:5258/api/Anomaly', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(options),
            });

            debugger;
            // Check if the request was successful
            if (response.ok) {
                const newResult = {
                    success: true,
                    message: 'Anomaly settings updated successfully',
                    isLoading: false
                };
                
                setResult(newResult);
                return newResult;
            } else {
                // Handle HTTP errors
                const errorText = await response.text();
                const newResult = {
                    success: false,
                    message: `Failed to update anomaly settings: ${response.status} ${response.statusText}`,
                    error: errorText,
                    isLoading: false
                };
                
                setResult(newResult);
                return newResult;
            }
        } catch (error) {
            // Handle network or other errors
            const newResult = {
                success: false,
                message: 'Error connecting to anomaly service',
                error,
                isLoading: false
            };
            
            setResult(newResult);
            return newResult;
        }
    };

    /**
     * Gets the current anomaly settings from the API
     */
    const getAnomalySettings = async (): Promise<AnomalyOptions | null> => {
        setResult({
            success: false,
            message: 'Fetching anomaly settings...',
            isLoading: true
        });

        try {
            const response = await fetch('http://localhost:5258/api/Anomaly', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (response.ok) {
                const data: AnomalyOptions = await response.json();
                
                setResult({
                    success: true,
                    message: 'Anomaly settings retrieved successfully',
                    isLoading: false
                });
                
                return data;
            } else {
                const errorText = await response.text();
                
                setResult({
                    success: false,
                    message: `Failed to get anomaly settings: ${response.status} ${response.statusText}`,
                    error: errorText,
                    isLoading: false
                });
                
                return null;
            }
        } catch (error) {
            setResult({
                success: false,
                message: 'Error connecting to anomaly service',
                error,
                isLoading: false
            });
            
            return null;
        }
    };

    // Return the service functions and current state
    return {
        updateAnomalySettings,
        getAnomalySettings,
        result
    };
}