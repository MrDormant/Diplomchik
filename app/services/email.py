import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from starlette.concurrency import run_in_threadpool

from app.core.config import settings


def _send_email_sync(to_addr: str, subject: str, body_text: str) -> None:
    msg = MIMEMultipart()
    msg["Subject"] = subject
    msg["From"] = settings.smtp_from
    msg["To"] = to_addr
    msg.attach(MIMEText(body_text, "plain", "utf-8"))

    if settings.smtp_use_tls:
        server = smtplib.SMTP(settings.smtp_host, settings.smtp_port)
        try:
            server.starttls()
            if settings.smtp_user and settings.smtp_password:
                server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(settings.smtp_from, [to_addr], msg.as_string())
        finally:
            server.quit()
    else:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            if settings.smtp_user and settings.smtp_password:
                server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(settings.smtp_from, [to_addr], msg.as_string())


async def send_operator_notification(subject: str, body: str) -> None:
    await run_in_threadpool(_send_email_sync, settings.operator_email, subject, body)
