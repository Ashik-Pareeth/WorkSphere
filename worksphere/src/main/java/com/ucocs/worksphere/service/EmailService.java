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

    public void sendOfferEmail(String to, String offerId, String token) {
        String respondUrl = "http://localhost:5173/offers/" + offerId + "/respond?token=" + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("noreply@worksphere.com");
        message.setTo(to);
        message.setSubject("You have a new Job Offer from WorkSphere!");
        message.setText("Congratulations!\n\n" +
                "You have been extended a job offer. Please click the link below to view and respond to your offer:\n\n" +
                respondUrl + "\n\n" +
                "We look forward to hearing from you!\n\n" +
                "Regards,\n" +
                "WorkSphere HR Team");

        try {
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println(
                    "Failed to send email via SMTP, but continuing for local E2E spooling. Error: " + e.getMessage());
        }

        // Write to local spool for E2E testing
        try (java.io.FileWriter writer = new java.io.FileWriter("local_mail_spool.txt", true)) {
            writer.write("To: " + to + "\nLink: " + respondUrl + "\n\n");
        } catch (java.io.IOException e) {
            e.printStackTrace();
        }
    }

    public void sendOnboardingInviteEmail(String to, String userName, String tempPassword) {
        String loginUrl = "http://localhost:5173/login";

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("noreply@worksphere.com");
        message.setTo(to);
        message.setSubject("Welcome to WorkSphere - Your Account Details");
        message.setText("Welcome to the team!\n\n" +
                "Your WorkSphere account has been created. Please log in using the credentials below to complete your onboarding process:\n\n" +
                "Login URL: " + loginUrl + "\n" +
                "Username: " + userName + "\n" +
                "Temporary Password: " + tempPassword + "\n\n" +
                "You will be required to change this password upon your first login.\n\n" +
                "Regards,\n" +
                "WorkSphere HR Team");

        try {
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send email via SMTP, but continuing for local E2E spooling. Error: " + e.getMessage());
        }

        // Write to local spool for E2E testing
        try (java.io.FileWriter writer = new java.io.FileWriter("local_mail_spool.txt", true)) {
            writer.write("To: " + to + "\nUsername: " + userName + "\nTempPassword: " + tempPassword + "\n\n");
        } catch (java.io.IOException e) {
            e.printStackTrace();
        }
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
