"use client"

import { SelectTrigger, SelectValue } from "@radix-ui/react-select";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem } from "~/components/ui/select";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod"

const formSchema = z.object({
    method: z.enum(["GET", "HEAD", "POST", "PUT", "DELETE", "CONNECT", "OPTIONS", "TRACE", "PATCH"])
})

export function NewRequestForm() {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {}
    })

    function onSubmit(values: z.infer<typeof formSchema>) {
        // Do something with the form values.
        // ✅ This will be type-safe and validated.
        console.log(values)
    }

    return (
    <Card>
        <CardHeader>
            <CardTitle>Create a new constant request</CardTitle>
            <CardDescription>Use the form below to configure requests to specific endpoints. These can be used to trigger anomalies.</CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <FormField control={form.control} name="method" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Route</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="GET" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="GET">GET</SelectItem>
                                    <SelectItem value="HEAD">HEAD</SelectItem>
                                    <SelectItem value="POST">POST</SelectItem>
                                    <SelectItem value="PUT">PUT</SelectItem>
                                    <SelectItem value="DELETE">DELETE</SelectItem>
                                    <SelectItem value="CONNECT">CONNECT</SelectItem>
                                    <SelectItem value="OPTIONS">OPTIONS</SelectItem>
                                    <SelectItem value="TRACE">TRACE</SelectItem>
                                    <SelectItem value="PATCH">PATCH</SelectItem>
                                </SelectContent>
                                </FormControl>
                            </Select>
                        </FormItem>
                    )}
                    />
                </form>
            </Form>
        </CardContent>
    </Card>
    )
}