namespace MockAPI.Anomaly;

/// <summary>
/// An anomaly that runs Task.Delay() whenever it is executed.
/// </summary>
public class RouteLogAnomaly : RouteAnomaly
{

    private readonly RegisterLogAnomalyRequest _registerLogAnomalyRequest;

    private readonly ILogger _logger;

    /// <summary>
    /// 
    /// </summary>
    /// <param name="delay">The amount of time to delay execution by.</param>
    public RouteLogAnomaly(
        RegisterLogAnomalyRequest registerLogAnomalyRequest,
        ILogger logger) : base(registerLogAnomalyRequest.Route) {
            _registerLogAnomalyRequest = registerLogAnomalyRequest;
            _logger = logger;
    }

    public override Task Execute() { 
        _logger.Log(_registerLogAnomalyRequest.LogLevel, _registerLogAnomalyRequest.Message);

        return Task.CompletedTask;
    }
}
