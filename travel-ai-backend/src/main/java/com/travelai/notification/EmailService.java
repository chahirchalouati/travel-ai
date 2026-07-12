package com.travelai.notification;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final NotificationLogRepository logRepository;

    /** Sends an HTML email asynchronously and logs the result. */
    @Async
    public void sendHtml(UUID userId, String to, String subject, String htmlBody) {
        var logEntry =
                NotificationLog.builder()
                        .userId(userId)
                        .channel(NotificationChannel.EMAIL)
                        .recipient(to)
                        .subject(subject)
                        .body(htmlBody)
                        .status(NotificationStatus.PENDING)
                        .build();

        try {
            MimeMessage message = mailSender.createMimeMessage();
            var helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
            logEntry.setStatus(NotificationStatus.SENT);
            log.info("Email sent to {} subject='{}'", to, subject);
        } catch (MessagingException ex) {
            logEntry.setStatus(NotificationStatus.FAILED);
            logEntry.setErrorMessage(ex.getMessage());
            log.error("Failed to send email to {}: {}", to, ex.getMessage());
        } finally {
            try {
                logRepository.save(logEntry);
            } catch (RuntimeException persistEx) {
                log.error("Failed to persist NotificationLog for {}: {}", to, persistEx.getMessage());
            }
        }
    }

    /** Sends an HTML email with a PDF attachment asynchronously and logs the result. */
    @Async
    public void sendHtmlWithPdf(UUID userId, String to, String subject, String htmlBody,
                                byte[] pdf, String filename) {
        var logEntry =
                NotificationLog.builder()
                        .userId(userId)
                        .channel(NotificationChannel.EMAIL)
                        .recipient(to)
                        .subject(subject)
                        .body(htmlBody)
                        .status(NotificationStatus.PENDING)
                        .build();
        try {
            MimeMessage message = mailSender.createMimeMessage();
            var helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            helper.addAttachment(filename, new ByteArrayResource(pdf), "application/pdf");
            mailSender.send(message);
            logEntry.setStatus(NotificationStatus.SENT);
            log.info("Email+PDF sent to {} subject='{}'", to, subject);
        } catch (MessagingException ex) {
            logEntry.setStatus(NotificationStatus.FAILED);
            logEntry.setErrorMessage(ex.getMessage());
            log.error("Failed to send email+PDF to {}: {}", to, ex.getMessage());
        } finally {
            try {
                logRepository.save(logEntry);
            } catch (RuntimeException persistEx) {
                log.error("Failed to persist NotificationLog for {}: {}", to, persistEx.getMessage());
            }
        }
    }
}
