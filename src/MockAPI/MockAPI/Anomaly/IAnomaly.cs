namespace MockAPI.Anomaly;

public abstract class RouteAnomaly(string route)
{
    public string Route { get; private set; } = route;

    public bool CanExecute(string route) => string.Equals(route, Route, StringComparison.OrdinalIgnoreCase);

    public abstract Task Execute();
}
