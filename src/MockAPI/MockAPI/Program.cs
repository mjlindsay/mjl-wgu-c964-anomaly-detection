using MockAPI.Anomaly;
using MockAPI.Config;
using MockAPI.Services;
using MockAPI.Utils;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using Serilog;
using System.Reflection;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddSingleton<AnomalyRegistry>();
builder.Services.AddSingleton<AnomalyService>();

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var openTelemetryConfig = builder.RegisterConfig<OpenTelemetryConfig>();

builder.Services.AddOpenTelemetry()
    .ConfigureResource(resource =>
        resource.AddService(
            serviceName: "MockAPI",
            serviceVersion: Assembly.GetExecutingAssembly().ImageRuntimeVersion))
    .WithMetrics(builder => builder
        .AddAspNetCoreInstrumentation()
        .AddOtlpExporter(configure => {
            configure.Endpoint = new Uri(openTelemetryConfig.Endpoint);
            configure.Protocol = OpenTelemetry.Exporter.OtlpExportProtocol.Grpc;
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

app.UseAuthorization();

app.MapControllers();

app.Run();
