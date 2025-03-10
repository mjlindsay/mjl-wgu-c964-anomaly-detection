"use client";

import { useState } from 'react';
import { useApiService, ApiEndpoint } from '@/request-generator/api-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trash, Plus, Play, Pause } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { AnomalyOptions } from './anomaly-service';
import { Label } from '@/components/ui/label';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

export default function AnomalyGenerator() {

    const defaultAnomalyOptions: AnomalyOptions = {
        causeException: false,
        delay: 0
    };

    const [anomalyOptions, setAnomalyOptions] = useState(defaultAnomalyOptions);

    const defaultEndpoints: ApiEndpoint[] = [
        { url: 'http://localhost:5258/api/User', weight: 1, method: 'GET', body: null },
        { url: 'http://localhost:5258/api/User/1', weight: 1, method: 'GET', body: null },
        { url: 'http://localhost:5258/api/User', weight: 1, method: 'POST', body: '{"username": "test"}' },
        { url: 'http://localhost:5258/api/User/1', weight: 1, method: 'PUT', body: '{"username": "test"}' },
        { url: 'http://localhost:5258/api/User/1', weight: 1, method: 'DELETE', body: null }
    ];
    const [endpoints, setEndpoints] = useState(defaultEndpoints);

    const [newMethod, setNewMethod] = useState('GET');
    const [newUrl, setNewUrl] = useState('');
    const [newBody, setNewBody] = useState('');

    const [rate, setRate] = useState(10);
    const [enabled, setEnabled] = useState(false);

    const {
        isRunning,
        callCount,
        errors,
        endpointStats,
        startService,
        stopService
    } = useApiService({
        endpoints,
        requestsPerSecond: rate,
        enabled,
        onSuccess: (data, method, url) => console.log(`Success from ${url}:`, data),
        onError: (error, method, url) => console.error(`Error from ${url}:`, error)
    });

    const handleToggle = () => {
        setEnabled(!enabled);
    };

    const handleCauseExceptionToggle = (checked: boolean) => {
        setAnomalyOptions({
            ...anomalyOptions,
            causeException: checked
        })
    }

    const updateDelayMs = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAnomalyOptions({
            ...anomalyOptions,
            delay: parseInt(e.target.value, 10) || 0
        })
    }

    const addEndpoint = () => {
        if (newUrl.trim() && !isRunning) {
            setEndpoints([...endpoints, {
                method: newMethod,
                url: newUrl.trim(),
                weight: 1,
                body: newBody.trim()
            }]);
            setNewUrl('');
            setNewBody('');
            setNewMethod('GET');
        }
    };

    const removeEndpoint = (index: number) => {
        if (!isRunning) {
            const newEndpoints = [...endpoints];
            newEndpoints.splice(index, 1);
            setEndpoints(newEndpoints);
        }
    };

    const updateWeight = (index: number, weight: number) => {
        if (!isRunning) {
            const newEndpoints = [...endpoints];
            newEndpoints[index] = { ...newEndpoints[index], weight };
            setEndpoints(newEndpoints);
        }
    };

    const updateMethod = (index: number, method: string) => {
        if (!isRunning) {
            const newEndpoints = [...endpoints];
            newEndpoints[index] = { ...newEndpoints[index], method };
            setEndpoints(newEndpoints);
        }
    };

    // Calculate total calls for percentage calculations
    const totalCalls = Object.values(endpointStats).reduce((sum, stat) => sum + stat.calls, 0) || 1;

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Anomaly Generator</CardTitle>
                <CardDescription>
                    Generate test traffic with controlled anomaly patterns for machine learning.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Endpoints List */}
                <div className="space-y-3">
                    <h3 className="text-sm font-medium">Anomaly Setting</h3>

                    <p className="font-small">These settings inject anomalies into the API. Any requests that are made after adjusting these settings will respond accordingly. For example, adjusting the delay will result in each request taking additional time, while toggling exceptions will change the response code of the API requests.</p>                

                    <div className="flex">
                        <Label htmlFor="causeExceptionSwitch">Cause exceptions?</Label>

                        <Switch
                            className="ml-5"
                            id="causeExceptionSwitch"
                            checked={anomalyOptions.causeException}
                            disabled={false}
                            onCheckedChange={handleCauseExceptionToggle} />
                    </div>

                    <div className="flex mt-4">
                        <Label htmlFor="delayMs">Delay (ms):</Label>

                        <Input
                            className="ml-5"
                            id="delayMsInput"
                            value={anomalyOptions.delay}
                            onChange={updateDelayMs} />
                    </div>

                    <h3 className="text-sm font-medium">Endpoints</h3>

                    {endpoints.map((endpoint, index) => (
                        <div key={index} className="flex items-center space-x-2 p-2 bg-muted/50 rounded-md">
                            <div className="flex-grow">
                                <div className="flex gap-2 mb-1">
                                    <Select
                                        value={endpoint.method || 'GET'}
                                        onValueChange={(value) => updateMethod(index, value)}
                                        disabled={isRunning}
                                    >
                                        <SelectTrigger className="w-24">
                                            <SelectValue placeholder="Method" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {HTTP_METHODS.map(method => (
                                                <SelectItem key={method} value={method}>{method}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Input
                                        value={endpoint.url}
                                        onChange={(e) => {
                                            if (!isRunning) {
                                                const newEndpoints = [...endpoints];
                                                newEndpoints[index] = { ...endpoint, url: e.target.value };
                                                setEndpoints(newEndpoints);
                                            }
                                        }}
                                        disabled={isRunning}
                                        className="flex-grow"
                                    />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-xs text-muted-foreground w-24">Weight: {endpoint.weight}</span>
                                    <Slider
                                        value={[endpoint.weight]}
                                        min={1}
                                        max={10}
                                        step={1}
                                        disabled={isRunning}
                                        onValueChange={(value) => updateWeight(index, value[0])}
                                        className="flex-grow"
                                    />
                                </div>

                                {/* Stats for this endpoint if available */}
                                {endpointStats[endpoint.url] && endpointStats[endpoint.url].calls > 0 && (
                                    <div className="mt-1 space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <span>Calls: {endpointStats[endpoint.url].calls}</span>
                                            <span>Errors: {endpointStats[endpoint.url].errors}</span>
                                            <span>{Math.round((endpointStats[endpoint.url].calls / totalCalls) * 100)}%</span>
                                        </div>
                                        <Progress
                                            value={(endpointStats[endpoint.url].calls / totalCalls) * 100}
                                            className="h-1"
                                        />
                                    </div>
                                )}
                            </div>

                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeEndpoint(index)}
                                disabled={isRunning || endpoints.length <= 1}
                            >
                                <Trash className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}

                    {/* Add new endpoint */}
                    {!isRunning && (
                        <div className="flex space-x-2 mt-2">
                            <Select
                                value={newMethod}
                                onValueChange={setNewMethod}>

                                <SelectTrigger className="w-24">
                                    <SelectValue placeholder="Method" />
                                </SelectTrigger>

                                <SelectContent>
                                    {HTTP_METHODS.map(method => (
                                        <SelectItem key={method} value={method}>{method}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Input
                                value={newUrl}
                                onChange={(e) => setNewUrl(e.target.value)}
                                placeholder="Enter new endpoint URL"
                                className="flex-grow"
                            />
                            
                            <Textarea
                                value={newBody}
                                onChange={(e) => setNewBody(e.target.value)}
                                placeholder="request body (json)" className="flex-grow" />

                            <Button onClick={addEndpoint} disabled={!newUrl.trim()}>
                                <Plus className="h-4 w-4 mr-1" /> Add
                            </Button>
                        </div>
                    )}
                </div>

                {/* Request rate control */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-medium">Request Rate</label>
                        <span className="text-sm font-medium">{rate} per second</span>
                    </div>
                    <Slider
                        value={[rate]}
                        min={1}
                        max={100}
                        step={1}
                        onValueChange={(value) => setRate(value[0])}
                        disabled={isRunning}
                    />
                </div>

                {/* Status & Controls */}
                <div className="flex items-center justify-between bg-accent/30 p-3 rounded-md">
                    <div>
                        <div className="text-sm font-medium">
                            Status: <span className={isRunning ? "text-green-500" : "text-amber-500"}>
                                {isRunning ? "Running" : "Stopped"}
                            </span>
                        </div>
                        <div className="text-sm">
                            Total: {callCount} calls ({errors} errors)
                        </div>
                    </div>

                    <Button
                        onClick={handleToggle}
                        variant={isRunning ? "destructive" : "default"}
                        className="gap-2"
                    >
                        {isRunning ? (
                            <>
                                <Pause className="h-4 w-4" /> Stop
                            </>
                        ) : (
                            <>
                                <Play className="h-4 w-4" /> Start
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}