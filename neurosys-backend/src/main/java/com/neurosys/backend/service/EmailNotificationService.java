package com.neurosys.backend.service;

import com.neurosys.backend.entity.Alert;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailNotificationService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Async
    public void sendCriticalAlertEmail(Alert alert) {
        log.info("Preparing critical alert notification email for Computer: {}, Alert: {}", alert.getComputer().getHostname(), alert.getTitle());
        
        if (mailSender == null) {
            log.warn("JavaMailSender is not configured. Skipping email dispatch for alert: {}", alert.getTitle());
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setTo("admin@neurosys.com");
            helper.setSubject("🚨 [CRITICAL ALERT] NeuroSys: " + alert.getTitle());
            
            String htmlContent = String.format("""
                <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 20px; border-radius: 8px;">
                    <h2 style="color: #ef4444;">🚨 Critical System Alert Triggered</h2>
                    <p><strong>Computer:</strong> %s (%s)</p>
                    <p><strong>Lab Location:</strong> %s</p>
                    <p><strong>Severity:</strong> <span style="color: #ef4444; font-weight: bold;">%s</span></p>
                    <p><strong>Alert Message:</strong> %s</p>
                    <hr style="border: 1px solid #334155;" />
                    <p style="font-size: 0.9em; color: #94a3b8;">Log into the NeuroSys Dashboard to take immediate remediation action.</p>
                </div>
                """,
                alert.getComputer().getHostname(),
                alert.getComputer().getIpAddress(),
                alert.getComputer().getLabName(),
                alert.getSeverity().name(),
                alert.getMessage()
            );

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("Critical alert email sent successfully to administrator for computer: {}", alert.getComputer().getHostname());
        } catch (Exception e) {
            log.error("Failed to send critical alert email", e);
        }
    }

    @Async
    public void sendAlertRecoveryEmail(Alert alert) {
        log.info("Preparing alert recovery notification email for Computer: {}, Alert: {}", alert.getComputer().getHostname(), alert.getTitle());

        if (mailSender == null) {
            log.warn("JavaMailSender is not configured. Skipping recovery email dispatch for alert: {}", alert.getTitle());
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo("admin@neurosys.com");
            helper.setSubject("✅ [RESOLVED ALERT] NeuroSys: " + alert.getTitle());

            String htmlContent = String.format("""
                <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 20px; border-radius: 8px;">
                    <h2 style="color: #10b981;">✅ Alert Condition Resolved</h2>
                    <p><strong>Computer:</strong> %s (%s)</p>
                    <p><strong>Lab Location:</strong> %s</p>
                    <p><strong>Alert Title:</strong> %s</p>
                    <p><strong>Status:</strong> <span style="color: #10b981; font-weight: bold;">RESOLVED</span></p>
                    <hr style="border: 1px solid #334155;" />
                    <p style="font-size: 0.9em; color: #94a3b8;">Resource usage has dropped below the recovery threshold and returned to normal operation.</p>
                </div>
                """,
                alert.getComputer().getHostname(),
                alert.getComputer().getIpAddress(),
                alert.getComputer().getLabName(),
                alert.getTitle()
            );

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("Alert recovery email sent successfully to administrator for computer: {}", alert.getComputer().getHostname());
        } catch (Exception e) {
            log.error("Failed to send alert recovery email", e);
        }
    }
}
