package com.ucocs.worksphere.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.FileWriter;
import java.io.IOException;
import java.time.LocalDateTime;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    // ========================= COMMON SEND METHOD =========================

    private void sendHtmlEmail(String to, String subject, String htmlContent, String fallbackText) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            helper.setFrom("noreply@worksphere.com");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true); // ✅ HTML enabled

            mailSender.send(message);

        } catch (Exception e) {
            System.err.println("Email failed. Falling back to local spool. Error: " + e.getMessage());
        }

        // ✅ Fallback spool (for dev/testing)
        try (FileWriter writer = new FileWriter("local_mail_spool.txt", true)) {
            writer.write("====================================================\n");
            writer.write("Date:    " + LocalDateTime.now() + "\n");
            writer.write("To:      " + to + "\n");
            writer.write("Subject: " + subject + "\n");
            writer.write("------------------- EMAIL BODY ---------------------\n");
            writer.write(htmlContent + "\n"); // Dumps the full HTML
            writer.write("====================================================\n\n");
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    // ========================= OFFER EMAIL =========================

    public void sendOfferEmail(String to, String offerId, String token) {

        String respondUrl = "http://localhost:5173/offers/" + offerId + "/respond?token=" + token;

        String subject = "Your Offer Letter from WorkSphere";

        String html = """
            <html>
            <body style="font-family: Arial, sans-serif; line-height:1.6;">
                <h2 style="color:#2c3e50;">Congratulations!</h2>

                <p>We are pleased to inform you that you have been selected for a position at <b>WorkSphere</b>.</p>

                <p>Please review your offer details and respond using the button below:</p>

                <p>
                    <a href="%s"
                       style="background-color:#28a745;color:white;padding:12px 18px;
                              text-decoration:none;border-radius:6px;display:inline-block;">
                        View Offer
                    </a>
                </p>

                <p>If you have any questions, feel free to reply to this email.</p>

                <br/>
                <p>Warm regards,<br/>
                <b>HR Team</b><br/>
                WorkSphere</p>

                <hr/>
                <small>This is an automated message. Please do not share this link.</small>
            </body>
            </html>
        """.formatted(respondUrl);

        sendHtmlEmail(to, subject, html, "Offer Link: " + respondUrl);
    }

    // ========================= ONBOARDING EMAIL =========================

    public void sendOnboardingInviteEmail(String to, String userName, String tempPassword) {

        String loginUrl = "http://localhost:5173/login";

        String subject = "Welcome to WorkSphere – Your Account Details";

        String html = """
            <html>
            <body style="font-family: Arial, sans-serif; line-height:1.6;">
                <h2 style="color:#2c3e50;">Welcome to WorkSphere!</h2>

                <p>We’re excited to have you on board.</p>

                <p>Your account has been created. Use the credentials below to log in:</p>

                <ul>
                    <li><b>Login URL:</b> %s</li>
                    <li><b>Username:</b> %s</li>
                    <li><b>Temporary Password:</b> %s</li>
                </ul>

                <p>You will be required to change your password upon your first login.</p>

                <p>If you face any issues, feel free to contact support.</p>

                <br/>
                <p>Best regards,<br/>
                <b>HR Team</b><br/>
                WorkSphere</p>
            </body>
            </html>
        """.formatted(loginUrl, userName, tempPassword);

        sendHtmlEmail(to, subject, html,
                "Login: " + loginUrl + " Username: " + userName + " TempPassword: " + tempPassword);
    }

    // ========================= PASSWORD RESET =========================

    public void sendPasswordResetEmail(String to, String resetToken) {

        String resetUrl = "http://localhost:5173/reset-password?token=" + resetToken;

        String subject = "Reset Your WorkSphere Password";

        String html = """
            <html>
            <body style="font-family: Arial, sans-serif; line-height:1.6;">
                <h2>Password Reset Request</h2>

                <p>We received a request to reset your password.</p>

                <p>
                    <a href="%s"
                       style="background-color:#007bff;color:white;padding:10px 15px;
                              text-decoration:none;border-radius:5px;">
                        Reset Password
                    </a>
                </p>

                <p>This link is valid for 15 minutes.</p>

                <p>If you did not request this, please ignore this email.</p>

                <br/>
                <p>Regards,<br/>
                <b>IT Support</b><br/>
                WorkSphere</p>
            </body>
            </html>
        """.formatted(resetUrl);

        sendHtmlEmail(to, subject, html, "Reset Link: " + resetUrl);
    }
    // ========================= INTERVIEW SCHEDULED EMAIL =========================

    public void sendInterviewScheduledEmail(String to, String candidateName, String jobTitle, String date, String time, String mode, String interviewer, Integer round) {
        String subject = "Interview Scheduled: " + jobTitle + " - WorkSphere";

        String html = """
            <html>
            <body style="font-family: Arial, sans-serif; line-height:1.6;">
                <h2 style="color:#2c3e50;">Interview Scheduled</h2>
                <p>Dear %s,</p>
                <p>We are pleased to inform you that an interview has been scheduled for your application for the <b>%s</b> position.</p>
                <ul>
                    <li><b>Round:</b> %d</li>
                    <li><b>Date:</b> %s</li>
                    <li><b>Time:</b> %s</li>
                    <li><b>Mode:</b> %s</li>
                    <li><b>Interviewer:</b> %s</li>
                </ul>
                <p>Please ensure you are available at the scheduled time. If you have any questions, feel free to reply to this email.</p>
                <br/>
                <p>Best regards,<br/>
                <b>HR Team</b><br/>
                WorkSphere</p>
            </body>
            </html>
        """.formatted(candidateName, jobTitle, round, date, time, mode, interviewer);

        sendHtmlEmail(to, subject, html, "Interview scheduled on " + date + " at " + time);
    }

    // ========================= CANDIDATE STATUS UPDATE EMAIL =========================

    public void sendCandidateStatusUpdateEmail(String to, String candidateName, String jobTitle, String status) {
        String subject = "Application Update: " + jobTitle + " - WorkSphere";

        String html = """
            <html>
            <body style="font-family: Arial, sans-serif; line-height:1.6;">
                <h2 style="color:#2c3e50;">Application Update</h2>
                <p>Dear %s,</p>
                <p>We are writing to inform you that the status of your application for the <b>%s</b> position has been updated to: <b>%s</b>.</p>
                <p>We will keep you posted regarding any further steps.</p>
                <br/>
                <p>Best regards,<br/>
                <b>HR Team</b><br/>
                WorkSphere</p>
            </body>
            </html>
        """.formatted(candidateName, jobTitle, status);

        sendHtmlEmail(to, subject, html, "Your application status is now: " + status);
    }
}