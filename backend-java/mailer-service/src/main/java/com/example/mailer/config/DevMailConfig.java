package com.example.mailer.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.MailException;
import org.springframework.mail.MailParseException;
import org.springframework.mail.MailPreparationException;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import jakarta.mail.internet.MimeMessage;
import java.io.InputStream;

@Configuration
public class DevMailConfig {
    private static final Logger log = LoggerFactory.getLogger(DevMailConfig.class);

    @Bean
    @ConditionalOnMissingBean(JavaMailSender.class)
    public JavaMailSender devNoopMailSender() {
        // No-op mail sender for development so the app can start without SMTP config
        return new JavaMailSender() {
            @Override
            public MimeMessage createMimeMessage() {
                return new jakarta.mail.internet.MimeMessage((jakarta.mail.Session) null);
            }

            @Override
            public MimeMessage createMimeMessage(InputStream contentStream) throws MailException {
                try {
                    return new jakarta.mail.internet.MimeMessage(null, contentStream);
                } catch (Exception e) {
                    throw new MailParseException(e);
                }
            }

            @Override
            public void send(MimeMessage mimeMessage) throws MailException {
                log.info("[DEV NO-OP MAIL] send(MimeMessage)");
            }

            @Override
            public void send(MimeMessage... mimeMessages) throws MailException {
                log.info("[DEV NO-OP MAIL] send(MimeMessage...): {} messages", mimeMessages != null ? mimeMessages.length : 0);
            }

            @Override
            public void send(SimpleMailMessage simpleMessage) throws MailException {
                log.info("[DEV NO-OP MAIL] To: {} | Subject: {}", (Object) simpleMessage.getTo(), simpleMessage.getSubject());
                log.debug("Body: {}", simpleMessage.getText());
            }

            @Override
            public void send(SimpleMailMessage... simpleMessages) throws MailException {
                log.info("[DEV NO-OP MAIL] send(SimpleMailMessage...): {} messages", simpleMessages != null ? simpleMessages.length : 0);
            }
        };
    }
}
