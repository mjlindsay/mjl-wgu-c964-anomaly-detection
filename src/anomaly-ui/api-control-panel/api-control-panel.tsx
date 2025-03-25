"use client";

import { useEffect, useState } from 'react';
import { useApiService, ApiEndpoint } from '@/request-generator/api-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Trash, Plus, Play, Pause, AlertCircle, Check, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAnomalyService } from './anomaly-service';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

export default function ApiControlPanel() {

    const { updateAnomalySettings, getAnomalySettings } = useAnomalyService();
    const [options, setOptions] = useState({
        causeException: false,
        targetDelayMs: 300,
        exceptionRate: 0.1,
        delayRate: 1.0
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitResult, setSubmitResult] = useState<{ success: boolean, message: string } | null>(null);

    useEffect(() => {
        const loadSettings = async () => {
            const currentSettings = await getAnomalySettings();
            if (currentSettings) {
                setOptions(currentSettings);
            }
        };

        loadSettings();
    }, []);

    const handleSaveAnomalySettings = async () => {
        setIsSubmitting(true);
        setSubmitResult(null);

        try {
            const result = await updateAnomalySettings(options);
            setSubmitResult({
                success: result.success,
                message: result.success ? 'Settings saved successfully' : result.message
            });
        } catch (error) {
            setSubmitResult({
                success: false,
                message: 'An unexpected error occurred'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCauseExceptionToggle = (checked: boolean) => {
        setOptions({
            ...options,
            causeException: checked
        })
    }

    const handleChangeDelay = (targetDelayMs: number) => {
        setOptions({
            ...options,
            targetDelayMs: targetDelayMs
        })
    }

    const handleChangeExceptionRate = (exceptionRate: number) => {
        setOptions({
            ...options,
            exceptionRate: exceptionRate
        })
    }

    const handleChangeDelayRate = (delayRate: number) => {
        setOptions({
            ...options,
            delayRate: delayRate
        })
    }

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
        <div className="flex flex-col gap-2">
            <Tabs defaultValue="anomaly-settings">
                <TabsList>
                    <TabsTrigger value="anomaly-settings">Anomaly Settings</TabsTrigger>
                    <TabsTrigger value="endpoint-settings">Endpoint Settings</TabsTrigger>
                </TabsList>
                <TabsContent value="anomaly-settings">
                    <Card>
                        <CardHeader>
                            <CardTitle>API Anomaly Configuration</CardTitle>
                            <CardDescription>
                                Configure how the API behaves to simulate anomalies for testing
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {/* Exception Toggle */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label htmlFor="causeExceptionSwitch" className="text-base">
                                            Cause Exceptions
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            When enabled, API calls will randomly return error responses
                                        </p>
                                    </div>
                                    <Switch
                                        id="causeExceptionSwitch"
                                        checked={options.causeException}
                                        onCheckedChange={(checked) => setOptions({ ...options, causeException: checked })}
                                    />
                                </div>

                                {/* Exception Rate Slider */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="exceptionRateSlider">Exception Rate</Label>
                                        <span className="text-sm font-medium">{Math.round(options.exceptionRate * 100)}%</span>
                                    </div>
                                    <Slider
                                        id="exceptionRateSlider"
                                        disabled={!options.causeException}
                                        value={[options.exceptionRate * 100]}
                                        min={1}
                                        max={100}
                                        step={1}
                                        onValueChange={(value) => setOptions({ ...options, exceptionRate: value[0] / 100 })}
                                        className={!options.causeException ? "opacity-50" : ""}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        The percentage of API calls that will result in errors
                                    </p>
                                </div>

                                {/* Delay Settings */}
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="delayInput">Target Delay (milliseconds)</Label>
                                        <div className="flex items-center mt-1 gap-2">
                                            <Input
                                                id="delayInput"
                                                type="number"
                                                min={0}
                                                max={10000}
                                                value={options.targetDelayMs}
                                                onChange={(e) => setOptions({ ...options, targetDelayMs: parseInt(e.target.value) || 0 })}
                                                className="w-32"
                                            />
                                            <span className="text-sm text-muted-foreground">ms</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            The target amount of delay if an endpoint triggers an anomaly. Actual delays will be randomized based on this target and may be skewed.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="delayRateSlider">Delay Rate</Label>
                                            <span className="text-sm font-medium">{Math.round(options.delayRate * 100)}%</span>
                                        </div>
                                        <Slider
                                            id="delayRateSlider"
                                            value={[options.delayRate * 100]}
                                            min={1}
                                            max={100}
                                            step={1}
                                            disabled={options.targetDelayMs === 0}
                                            className={options.targetDelayMs === 0 ? "opacity-50" : ""}
                                            onValueChange={(value) => setOptions({ ...options, delayRate: value[0] / 100 })}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            The percentage of API calls that will include the delay
                                        </p>
                                    </div>
                                </div>

                                {/* Show result message if any */}
                                {submitResult && (
                                    <Alert variant={submitResult.success ? "default" : "destructive"} className="mt-4">
                                        {submitResult.success ? (
                                            <Check className="h-4 w-4" />
                                        ) : (
                                            <AlertCircle className="h-4 w-4" />
                                        )}
                                        <AlertTitle>
                                            {submitResult.success ? "Success" : "Error"}
                                        </AlertTitle>
                                        <AlertDescription>{submitResult.message}</AlertDescription>
                                    </Alert>
                                )}

                                {/* Submit Button */}
                                <Button
                                    onClick={handleSaveAnomalySettings}
                                    className="w-full"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        'Save Anomaly Settings'
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="endpoint-settings">
                    <Card>
                        <CardHeader>
                            <CardTitle>Endpoint Configuration</CardTitle>
                            <CardDescription>
                                <p>
                                    This can be used to configure the endpoints that are hit, as well as the rate
                                    and distribution at which they are hit.
                                </p>
                                <p>
                                    Please keep in mind that the overall rate for requests per second is the target rate.
                                    The actual rate differs due to many different factors, and can be a few requests per
                                    second slower than the target.
                                </p>
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="col-span-4">
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
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Card>
                <CardContent>
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
        </div>
    );
}