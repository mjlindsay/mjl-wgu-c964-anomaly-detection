using System.ComponentModel.DataAnnotations;

namespace AnomalyApi.Anomaly;

public record class AnomalyOptions
{
    public bool CauseException { get; set; } = false;

    public int DelayMs { get; set; } = 0;

    [Range(0, 1)]
    public float ExceptionRate { get; set; } = 0f;

    [Range(0, 1)]
    public float DelayRate { get; set; } = 0f;
}
