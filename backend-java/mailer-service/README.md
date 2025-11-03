# Mailer Service (Java / Spring Boot)

Exposes `POST /api/email/ticket` for the Node backend to send ticket emails. Matches the existing call in `routes/api.js` using `MAILER_URL`.

## Run

- Java 17+
- Maven

```bash
mvn spring-boot:run
```

The service runs on `http://localhost:8081`.

## Configure SMTP

Edit `src/main/resources/application.properties`:

```
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your@gmail.com
spring.mail.password=your-app-password
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true

# Optional service-to-service token
service.token=change-this
```

## Node integration

Set in your Node `.env`:

```
MAILER_URL=http://localhost:8081
# If you set service.token above, also add in Node when calling this service:
# Authorization: Bearer change-this
```

No UI changes required. Node will continue to call this endpoint after payment.
