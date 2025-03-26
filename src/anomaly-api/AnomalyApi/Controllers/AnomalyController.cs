using Microsoft.AspNetCore.Mvc;
using AnomalyApi.Anomaly;

namespace AnomalyApi.Controllers;

[Route("api/[controller]")]
public class AnomalyController :ControllerBase
{

    private readonly AnomalyService _anomalyService;

    private readonly ILoggerFactory _loggerFactory;
    private readonly ILogger<AnomalyController> _logger;

    public AnomalyController(
        AnomalyService anomalyRegistry,
        ILoggerFactory loggerFactory,
        ILogger<AnomalyController> logger
    ) {
        _anomalyService = anomalyRegistry;
        _loggerFactory = loggerFactory;
        _logger = logger;
    }

    [HttpGet]
    public AnomalyOptions GetAnomalyOptions() {
        return _anomalyService.GetAnomalyOptions();
    }

    [HttpPost]
    public IActionResult UpdateAnomalyOptions(
        [FromBody] AnomalyOptions anomalyOptionsDto) {

        _anomalyService.UpdateAnomalyOptions(anomalyOptionsDto);

        return StatusCode(StatusCodes.Status200OK);
    }

    [HttpDelete]
    public IActionResult ClearAnomalies() {
        _anomalyService.DisableAnomalies();

        return StatusCode(StatusCodes.Status200OK);
    }
}
