namespace AnomalyApi.Utils
{
    public static class WebApplicationBuilderExtensions
    {
        public static T RegisterConfig<T>(this WebApplicationBuilder builder, string? sectionName = null) where T : class, new() {
            var configurationSection = builder.Configuration.GetSection(sectionName ?? typeof(T).Name);
            builder.Services.Configure<T>(configurationSection);
            var configurationModel = configurationSection?.Get<T>() ?? new T();
            return configurationModel;
        }
    }

}
