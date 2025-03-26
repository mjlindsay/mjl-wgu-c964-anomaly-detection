using AnomalyApi.Anomaly;
using AnomalyApi.Config;
using AnomalyApi.Utils;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using Serilog;
using System.Reflection;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddSingleton<AnomalyService>();

builder.Services.AddControllers();

builder.Services.AddCors(options => {
    options.AddPolicy("default", policy => {
        policy.AllowAnyOrigin();
        policy.AllowAnyHeader();
        policy.AllowAnyMethod();
    });
});

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddHealthChecks();

var openTelemetryConfig = builder.RegisterConfig<OpenTelemetryConfig>();

builder.Services.AddOpenTelemetry()
    .ConfigureResource(resource =>
        resource.AddService(
            serviceName: "AnomalyApi",
            serviceVersion: Assembly.GetExecutingAssembly().ImageRuntimeVersion))
    .WithMetrics(metrics => metrics
        .AddAspNetCoreInstrumentation()
        .AddOtlpExporter((configure, metricReaderOptions) => {
            configure.Endpoint = new Uri(openTelemetryConfig.Endpoint);
            configure.BatchExportProcessorOptions.ScheduledDelayMilliseconds = 500;

            metricReaderOptions.PeriodicExportingMetricReaderOptions.ExportIntervalMilliseconds = 2500;
            metricReaderOptions.TemporalityPreference = MetricReaderTemporalityPreference.Delta;
        }))
    .WithTracing(tracing => tracing
        .AddSource("anomaly-api")
        .AddAspNetCoreInstrumentation(o => {
            o.EnrichWithHttpRequest = (activity, request) => {
                activity.SetTag("request.contentLength", request.ContentLength);
            };

            o.EnrichWithHttpResponse = (activity, response) => {
                activity.SetTag("response.statusCode", response.StatusCode);
                activity.SetTag("response.duration", activity.Duration.TotalMilliseconds);
            };

            o.EnrichWithException = (activity, exception) => {
                if (exception.Source is not null) {
                    activity.SetTag("exception.source", exception.Source);
                }
            };
        })
        .AddOtlpExporter(config => {
            config.Endpoint = new Uri(openTelemetryConfig.Endpoint);
            config.ExportProcessorType = OpenTelemetry.ExportProcessorType.Simple;
        }));
            
        

Log.Logger = new LoggerConfiguration()
        .ReadFrom.Configuration(builder.Configuration)
        .WriteTo.OpenTelemetry(options => {
            options.Endpoint = openTelemetryConfig.Endpoint;
            options.Protocol = openTelemetryConfig.Protocol;
            options.ResourceAttributes = new Dictionary<string, object>
            {
                { "service.name", openTelemetryConfig.ServiceName }
            };

        })
        .CreateLogger();

builder.Host.UseSerilog();


var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment()) {
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("default");

app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health");

app.Run();
