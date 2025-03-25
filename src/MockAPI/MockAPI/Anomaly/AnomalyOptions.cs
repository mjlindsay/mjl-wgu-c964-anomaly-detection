using System.ComponentModel.DataAnnotations;

namespace AnomalyApi.Anomaly;

public record class AnomalyOptions
{
    public bool CauseException { get; set; } = false;

    public int TargetDelayMs { get; set; } = 300;

    public double StdDevMs { get => (TargetDelayMs * 2) / 5; }

    [Range(0, 1)]
    public float ExceptionRate { get; set; } = 0f;

    [Range(0, 1)]
    public float DelayRate { get; set; } = 1f;
}
