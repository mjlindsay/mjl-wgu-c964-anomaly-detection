using Serilog.Sinks.OpenTelemetry;
using System.Text.Json.Serialization;

namespace MockAPI.Config;

public record class OpenTelemetryConfig
{
    public string Endpoint { get; set; } = "http://127.0.0.1:4317";

    [JsonConverter(typeof(JsonStringEnumConverter<OtlpProtocol>))]
    public OtlpProtocol Protocol { get; set; } = OtlpProtocol.Grpc;

    public string ServiceName { get; set; } = "MockAPI";

}
