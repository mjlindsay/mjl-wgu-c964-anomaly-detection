using AnomalyApi.Anomaly;
using AnomalyApi.Utils;
using System.Threading.Tasks;

namespace AnomalyApi.Anomaly;

public class AnomalyService
{
    private static readonly AnomalyOptions DEFAULT_OPTIONS = new AnomalyOptions {
        CauseException = false,
        TargetDelayMs = 0,
        ExceptionRate = 0
    };

    private AnomalyOptions _anomalyOptions = DEFAULT_OPTIONS;

    private readonly Random _random;

    /// <summary>
    /// 
    /// </summary>
    /// <param name="seed">Seed used for random anomaly generation</param>
    public AnomalyService(int? seed = null) {
        _random = seed is null ? new Random() : new Random(seed.Value);
    }

    public AnomalyOptions GetAnomalyOptions() {
        return _anomalyOptions;
    }

    public void UpdateAnomalyOptions(AnomalyOptions anomalyOptions) {
        _anomalyOptions = anomalyOptions;
    }

    public void DisableAnomalies() {
        _anomalyOptions = DEFAULT_OPTIONS;
    }

    public async Task Trigger() {
        var randDouble = _random.NextDouble();

        if (randDouble <= _anomalyOptions.ExceptionRate) {
            if (_anomalyOptions.CauseException) {
                throw new AnomalousException();
            }
        }

        if (randDouble <= _anomalyOptions.DelayRate) {
            if (_anomalyOptions.TargetDelayMs > 0) {
                var delay = Math.Max(_random.NextGaussianDouble(_anomalyOptions.TargetDelayMs, _anomalyOptions.StdDevMs), 0);
                await Task.Delay((int) Math.Floor(delay));
            }
        }
    }
}
