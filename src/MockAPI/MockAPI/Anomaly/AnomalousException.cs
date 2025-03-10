namespace AnomalyApi.Anomaly;

public class AnomalousException : Exception
{
    public AnomalousException(string? message = null, Exception? innerException = null) : base(message, innerException) {}
}
