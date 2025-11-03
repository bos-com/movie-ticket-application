package com.example.mailer.controller;

import com.example.mailer.dto.EmailRequest;
import com.example.mailer.service.EmailService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/email")
public class EmailController {
    private final EmailService emailService;

    @Value("${service.token:}")
    private String serviceToken;

    public EmailController(EmailService emailService) {
        this.emailService = emailService;
    }

    private boolean authorized(String authHeader) {
        if (serviceToken == null || serviceToken.isBlank()) return true; // if not set, allow for local dev
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return false;
        String token = authHeader.substring(7);
        return token.equals(serviceToken);
    }

    @PostMapping("/ticket")
    public ResponseEntity<?> sendTicket(@RequestHeader(value = "Authorization", required = false) String authorization,
                                        @Valid @RequestBody EmailRequest request) {
        if (!authorized(authorization)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));
        }
        emailService.sendTicketEmail(request);
        return ResponseEntity.ok(Map.of("message", "sent"));
    }
}
