package com.neurosys.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.File;

@RestController
@RequestMapping("/api/v1/download")
@Tag(name = "Agent Download Endpoint", description = "REST API for downloading compiled NeuroSys Monitoring Agent executable JAR")
public class DownloadController {

    @GetMapping("/agent")
    @Operation(summary = "Download Monitoring Agent JAR", description = "Download executable NeuroSys-Agent.jar to run on monitored computers")
    public ResponseEntity<Resource> downloadAgentJar() {
        File jarFile = new File("../neurosys-agent/target/neurosys-agent-1.0.0-SNAPSHOT-exec.jar");
        if (!jarFile.exists()) {
            jarFile = new File("neurosys-agent/target/neurosys-agent-1.0.0-SNAPSHOT-exec.jar");
        }

        if (!jarFile.exists()) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = new FileSystemResource(jarFile);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"NeuroSys-Agent.jar\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .contentLength(jarFile.length())
                .body(resource);
    }
}
