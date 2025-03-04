namespace MockAPI.Anomaly;

/// <summary>
/// A container class to map multiple anomalies to different types.
/// </summary>
public class AnomalyRegistry
{

    private Dictionary<string, List<RouteAnomaly>> _anomalies = new(2);
    
    public void RegisterAnomaly(RouteAnomaly routeAnomaly) {
        bool hasList = _anomalies.TryGetValue(routeAnomaly.Route, out List<RouteAnomaly>? anomalies);

        if (hasList) {
            // This isn't null, that's why we have the TryGetValue check
            anomalies!.Add(routeAnomaly);
        } else {
            _anomalies.Add(routeAnomaly.Route, [routeAnomaly]);
        }
    }

    /// <summary>
    /// Gets all registered anomalies.
    /// </summary>
    /// <returns></returns>
    public List<RouteAnomaly> GetAnomalies() {
        return _anomalies.SelectMany(v => v.Value).ToList();
    }

    public List<RouteAnomaly> GetAnomalies(string route) {
        _anomalies.TryGetValue(RouteConstants.ALL_ROUTES_KEYWORD, out List<RouteAnomaly>? allAnomalies);
        _anomalies.TryGetValue(route, out List<RouteAnomaly>? routeSpecificAnomalies);

        List<RouteAnomaly> returnAnomalies = new();
        if (allAnomalies is not null) { returnAnomalies.AddRange(allAnomalies); }
        if (routeSpecificAnomalies is not null) { returnAnomalies.AddRange(routeSpecificAnomalies); }


        return returnAnomalies;
    }

    public void ClearAnomalies(string route) {
        _anomalies.TryGetValue(route, out List<RouteAnomaly>? anomalies);

        anomalies?.Clear();
    }
}
