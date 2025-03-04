using Microsoft.AspNetCore.Mvc;
using MockAPI.Anomaly;

namespace MockAPI.Controllers;

[Route("api/[controller]")]
public class AnomalyController :ControllerBase
{

    private readonly AnomalyRegistry _anomalyRegistry;

    private readonly ILoggerFactory _loggerFactory;
    private readonly ILogger<AnomalyController> _logger;

    public AnomalyController(
        AnomalyRegistry anomalyRegistry,
        ILoggerFactory loggerFactory,
        ILogger<AnomalyController> logger
    ) {
        _anomalyRegistry = anomalyRegistry;
        _loggerFactory = loggerFactory;
        _logger = logger;
    }

    [HttpGet]
    public IActionResult GetAnomalies() {
        return new OkObjectResult(_anomalyRegistry.GetAnomalies());
    }

    [HttpPost]
    public IActionResult RegisterAnomaly(
        [FromBody] RegisterAnomalyRequest registerAnomalyRequest) {

        try {
            _anomalyRegistry.RegisterAnomaly(registerAnomalyRequest.ToAnomaly(_loggerFactory.CreateLogger<RegisterAnomalyRequest>()));
        } catch (Exception ex) {
            _logger.LogError(ex, "Unable to register anomaly");

            return StatusCode(StatusCodes.Status500InternalServerError);
        }

        return StatusCode(StatusCodes.Status200OK);
    }

    [HttpDelete]
    public IActionResult ClearAnomalies(
        [FromBody] RegisterAnomalyRequest clearAnomaliesRequest) {
        _anomalyRegistry.ClearAnomalies(clearAnomaliesRequest.Route);

        return StatusCode(StatusCodes.Status200OK);
    }
}
