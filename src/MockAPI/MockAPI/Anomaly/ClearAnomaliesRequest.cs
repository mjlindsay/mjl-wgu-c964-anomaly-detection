namespace MockAPI.Anomaly;

public record class ClearAnomaliesRequest
{
    public string Route { get; set; } = string.Empty;
}
