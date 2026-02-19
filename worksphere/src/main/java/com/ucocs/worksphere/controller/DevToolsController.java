package com.ucocs.worksphere.controller;

import com.ucocs.worksphere.service.DatabaseFlushService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/dev")
@RequiredArgsConstructor
@Profile("dev")
@Slf4j
public class DevToolsController {

    private final DatabaseFlushService flushService;

    @PostMapping("/flush-db")
    public ResponseEntity<Map<String, Object>> flushDatabase() {

        log.warn("⚠️ DEV TOOL USED → Database flush triggered");

        flushService.flushDatabase();

        return ResponseEntity.ok(Map.of(
                "message", "Database flushed",
                "timestamp", Instant.now()
        ));
    }
}
