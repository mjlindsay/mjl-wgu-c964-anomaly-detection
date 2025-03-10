using Microsoft.AspNetCore.Mvc;
using AnomalyApi.Anomaly;
using AnomalyApi.User;

namespace AnomalyApi.Controllers;

[Route("api/[controller]")]
[ApiController]
public class UserController : ControllerBase
{

    private readonly AnomalyService _anomalyService;

    private readonly ILogger<UserController> _logger;

    public UserController(
        AnomalyService anomalyService,
        ILogger<UserController> logger) {
            _anomalyService = anomalyService;
            _logger = logger;
    }

    // GET: api/<UserController>
    [HttpGet]
    public async Task<IEnumerable<string>> Get() {
        await _anomalyService.Trigger();

        _logger.LogInformation("Fetched all users");

        return new string[] { "value1", "value2" };
    }

    // GET api/<UserController>/5
    [HttpGet("{id}")]
    public async Task<string> Get(int id) {
        await _anomalyService.Trigger();

        _logger.LogInformation("Fetched user {id}", id);

        return "value";
    }

    // POST api/<UserController>
    [HttpPost]
    public async Task<IActionResult> Post([FromBody] UserRequestDto userRequest) {
        await _anomalyService.Trigger();

        _logger.LogInformation("Creating user: {@user}", userRequest);

        return new OkResult();
    }

    // PUT api/<UserController>/5
    [HttpPut("{id}")]
    public async Task<IActionResult> Put(int id, [FromBody] UserRequestDto userRequest) {
        await _anomalyService.Trigger();

        _logger.LogInformation("Updating user {id}: {@user}", id, userRequest);

        return new OkResult();
    }

    // DELETE api/<UserController>/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id) {
        await _anomalyService.Trigger();

        _logger.LogWarning("Deleting user {id}", id);

        return new OkResult();
    }
}
