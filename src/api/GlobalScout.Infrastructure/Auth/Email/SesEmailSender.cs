using Amazon.SimpleEmail;
using Amazon.SimpleEmail.Model;
using GlobalScout.Application.Abstractions.Email;
using Microsoft.Extensions.Options;

namespace GlobalScout.Infrastructure.Auth.Email;

internal sealed class SesEmailSender(
    IAmazonSimpleEmailService ses,
    IOptions<EmailOptions> options) : IEmailSender
{
    private readonly EmailOptions _options = options.Value;

    public async Task SendAsync(string to, string subject, string htmlBody, CancellationToken cancellationToken)
    {
        var request = new SendEmailRequest
        {
            Source = _options.FromAddress,
            Destination = new Destination { ToAddresses = [to] },
            Message = new Message
            {
                Subject = new Content(subject),
                Body = new Body { Html = new Content(htmlBody) }
            }
        };

        await ses.SendEmailAsync(request, cancellationToken);
    }
}
