using Microsoft.AspNetCore.Mvc;
using MockAPI.Anomaly;
using MockAPI.Services;

namespace MockAPI.Controllers;

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
        await _anomalyService.ExecuteParallel(Request.Path.Value ?? "");
        _logger.LogInformation("Fetched all users");

        return new string[] { "value1", "value2" };
    }

    // GET api/<UserController>/5
    [HttpGet("{id}")]
    public string Get(int id) {
        _logger.LogInformation("Fetched user {id}", id);

        return "value";
    }

    // POST api/<UserController>
    [HttpPost]
    public void Post([FromBody] string value) {
        _logger.LogInformation("Creating user: {user}", value);
    }

    // PUT api/<UserController>/5
    [HttpPut("{id}")]
    public void Put(int id, [FromBody] string value) {
        _logger.LogInformation("Updating user {id}: {updatedUser}", id, value);
    }

    // DELETE api/<UserController>/5
    [HttpDelete("{id}")]
    public void Delete(int id) {
        _logger.LogWarning("Deleting user {id}", id);
    }
}
