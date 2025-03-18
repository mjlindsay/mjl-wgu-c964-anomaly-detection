using System.ComponentModel.DataAnnotations;

namespace AnomalyApi.Anomaly;

public record class AnomalyOptions
{
    public bool CauseException { get; set; } = false;

    public int MeanDelayMs { get; set; } = 0;

    public double StdDevMs { get => (MeanDelayMs * 2) / 5; }

    [Range(0, 1)]
    public float ExceptionRate { get; set; } = 0f;

    [Range(0, 1)]
    public float DelayRate { get; set; } = 0f;
}
