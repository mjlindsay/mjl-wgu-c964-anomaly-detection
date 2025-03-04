namespace MockAPI.Anomaly;

/// <summary>
/// An anomaly that runs Task.Delay() whenever it is executed.
/// </summary>
public class RouteDelayAnomaly : RouteAnomaly
{
    private readonly RegisterDelayAnomalyRequest _registerDelayAnomalyRequest;

    /// <summary>
    /// 
    /// </summary>
    /// <param name="delay">The amount of time to delay execution by.</param>
    public RouteDelayAnomaly(RegisterDelayAnomalyRequest registerDelayAnomalyRequest) : base(registerDelayAnomalyRequest.Route) {
        _registerDelayAnomalyRequest = registerDelayAnomalyRequest;
    }

    public override async Task Execute() {
        await Task.Delay(_registerDelayAnomalyRequest.Delay);
    }
}
