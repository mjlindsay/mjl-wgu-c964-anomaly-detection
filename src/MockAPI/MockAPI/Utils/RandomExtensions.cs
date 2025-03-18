namespace AnomalyApi.Utils;

public static class RandomExtensions
{

    public static double NextGaussianDouble(this Random random, double mean, double stdDev = 1.0d) {
        double u1 = 1.0f - random.NextDouble();
        double u2 = 1.0f - random.NextDouble();
        double randStdNormal = Math.Sqrt(-2.0f * Math.Log(u1)) * Math.Sin(2.0 * Math.PI * u2);
        double randNormal = mean + stdDev * randStdNormal;

        return randNormal;
    }
}
