namespace MockAPI.Anomaly;

/// <summary>
/// An anomaly that throws an exception whenever it is executed.
/// </summary>
public class RouteExceptionAnomaly : RouteAnomaly
{

    public RouteExceptionAnomaly(RegisterExceptionAnomalyRequest exceptionAnomalyRequest) : base(exceptionAnomalyRequest.Route) {}

    public RouteExceptionAnomaly(string route) : base(route) {}

    public override Task Execute() {
        throw new AnomalousException();
    }
}
