package com.ucocs.worksphere.scheduler;

import com.ucocs.worksphere.entity.PerformanceAppraisal;
import com.ucocs.worksphere.enums.AppraisalStatus;
import com.ucocs.worksphere.enums.NotificationType;
import com.ucocs.worksphere.repository.PerformanceAppraisalRepository;
import com.ucocs.worksphere.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class AppraisalReminderJob {

    private final PerformanceAppraisalRepository appraisalRepository;
    private final NotificationService notificationService;

    /**
     * Run daily at 9:00 AM (server time).
     * Sends reminders to employees for pending self-appraisals and managers for
     * pending reviews.
     */
    @Scheduled(cron = "0 0 9 * * *")
    @Transactional(readOnly = true)
    public void sendReminders() {
        log.info("Starting AppraisalReminderJob...");

        // Remind employees to submit self-appraisal
        List<PerformanceAppraisal> pendingAppraisals = appraisalRepository.findByStatus(AppraisalStatus.PENDING);
        for (PerformanceAppraisal appraisal : pendingAppraisals) {
            notificationService.send(
                    appraisal.getEmployee().getId(),
                    NotificationType.APPRAISAL_DUE,
                    "Reminder: Self-Appraisal Pending",
                    "Your " + appraisal.getCycleType()
                            + " performance appraisal is currently pending. Please submit your self-rating soon.",
                    appraisal.getId(),
                    "PerformanceAppraisal");
        }

        // Remind managers to submit manager review
        List<PerformanceAppraisal> inReviewAppraisals = appraisalRepository.findByStatus(AppraisalStatus.IN_REVIEW);
        for (PerformanceAppraisal appraisal : inReviewAppraisals) {
            if (appraisal.getManager() != null) {
                notificationService.send(
                        appraisal.getManager().getId(),
                        NotificationType.APPRAISAL_DUE,
                        "Reminder: Manager Review Pending",
                        "You have a pending manager review for " + appraisal.getEmployee().getFirstName() + " "
                                + appraisal.getEmployee().getLastName() + ". Please complete it.",
                        appraisal.getId(),
                        "PerformanceAppraisal");
            }
        }

        // Remind employees to acknowledge their reviewed appraisal
        List<PerformanceAppraisal> reviewedAppraisals = appraisalRepository.findByStatus(AppraisalStatus.REVIEWED);
        for (PerformanceAppraisal appraisal : reviewedAppraisals) {
            notificationService.send(
                    appraisal.getEmployee().getId(),
                    NotificationType.APPRAISAL_DUE,
                    "Reminder: Acknowledge Appraisal",
                    "Your manager has completed your appraisal review. Please review the feedback and acknowledge it.",
                    appraisal.getId(),
                    "PerformanceAppraisal");
        }

        log.info(
                "AppraisalReminderJob completed. Sent reminders for {} PENDING, {} IN_REVIEW, and {} REVIEWED appraisals.",
                pendingAppraisals.size(), inReviewAppraisals.size(), reviewedAppraisals.size());
    }
}
