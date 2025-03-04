using Serilog;
using System.Text.Json.Serialization;

using MelILogger = Microsoft.Extensions.Logging.ILogger;

namespace MockAPI.Anomaly;

[JsonPolymorphic]
[JsonDerivedType(typeof(RegisterDelayAnomalyRequest), typeDiscriminator: "DELAY")]
[JsonDerivedType(typeof(RegisterLogAnomalyRequest), typeDiscriminator: "LOG")]
[JsonDerivedType(typeof(RegisterExceptionAnomalyRequest), typeDiscriminator: "EXCEPTION")]
public abstract record class RegisterAnomalyRequest
{
    public string Route { get; set; } = RouteConstants.ALL_ROUTES_KEYWORD;

    public abstract RouteAnomaly ToAnomaly(MelILogger logger);
}

public record class RegisterDelayAnomalyRequest : RegisterAnomalyRequest {
    
    public TimeSpan Delay { get; set; }

    public override RouteAnomaly ToAnomaly(MelILogger logger) {
        return new RouteDelayAnomaly(this);
    }
}

public record class RegisterLogAnomalyRequest : RegisterAnomalyRequest {

    [JsonConverter(typeof(JsonStringEnumConverter<LogLevel>))]
    public LogLevel LogLevel {  get; set; }

    public string Message { get; set; } = string.Empty;

    public override RouteAnomaly ToAnomaly(MelILogger logger)
    {
        return new RouteLogAnomaly(this, logger);
    }
}

public record class RegisterExceptionAnomalyRequest : RegisterAnomalyRequest
{
    public override RouteAnomaly ToAnomaly(MelILogger logger) {
        return new RouteExceptionAnomaly(this);
    }
}
