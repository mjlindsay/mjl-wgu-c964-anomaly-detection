using MockAPI.Anomaly;
using MockAPI.Utils;

namespace MockAPI.Services;

public class AnomalyService
{
    private readonly AnomalyRegistry _registry;

    public AnomalyService(AnomalyRegistry container) {
        _registry = container;
    }

    public async Task ExecuteSequentially(string route, bool randomOrder = false) {
        var anomalies = _registry.GetAnomalies(route);

        var exceptions = new List<Exception>();
        
        foreach (RouteAnomaly anomaly in randomOrder ? anomalies.Shuffle() : anomalies) {
            try { 
                await anomaly.Execute();
            } catch (Exception ex) {
                exceptions.Add(ex);
            }
        }
    }

    public async Task ExecuteParallel(string route, bool randomOrder = false) {
        var anomalies = _registry.GetAnomalies(route);

        await Task.WhenAll((randomOrder ? anomalies.Shuffle() : anomalies).Select(a => a.Execute()));
    }
}
