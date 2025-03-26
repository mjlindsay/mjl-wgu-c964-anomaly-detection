namespace AnomalyApi.User;

public record class UserRequestDto
{
    public string Username { get; set; } = string.Empty;
}
