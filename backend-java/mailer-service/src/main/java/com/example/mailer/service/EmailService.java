package com.example.mailer.service;

import com.example.mailer.dto.EmailRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {
    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String defaultFrom;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendTicketEmail(EmailRequest req) {
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setTo(req.getTo());
        msg.setSubject(req.getSubject());
        msg.setText(req.getContent());
        if (defaultFrom != null && !defaultFrom.isBlank()) {
            msg.setFrom(defaultFrom);
        }
        mailSender.send(msg);
    }
}
