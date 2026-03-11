package com.ucocs.worksphere.service;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendPasswordResetEmail(String to, String resetToken) {
        String resetUrl = "http://localhost:5173/reset-password?token=" + resetToken;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("noreply@worksphere.com");
        message.setTo(to);
        message.setSubject("WorkSphere Password Reset Request");
        message.setText("Hello,\n\n" +
                "You requested to reset your password. Please click the link below to set a new password:\n\n" +
                resetUrl + "\n\n" +
                "This link will expire in 15 minutes.\n\n" +
                "If you did not request this, please ignore this email.\n\n" +
                "Regards,\n" +
                "WorkSphere IT Support");

        try {
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println(
                    "Failed to send email via SMTP, but continuing for local E2E spooling. Error: " + e.getMessage());
        }

        // Write to local spool for E2E testing
        try (java.io.FileWriter writer = new java.io.FileWriter("local_mail_spool.txt", true)) {
            writer.write("To: " + to + "\nLink: " + resetUrl + "\n\n");
        } catch (java.io.IOException e) {
            e.printStackTrace();
        }
    }
}
