package com.ucocs.worksphere.controller;

import com.ucocs.worksphere.service.ScreenshotService;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RequestMapping("/screenshots")
@RestController
public class ScreenshotController {
    private final ScreenshotService screenshotService;

    public ScreenshotController(ScreenshotService screenshotService) {
        this.screenshotService = screenshotService;
    }

    @PostMapping("/upload/{employeeId}")
    public void uploadScreenshot(@PathVariable Long employeeId, @RequestParam("file") MultipartFile file)
            throws IOException {
        screenshotService.saveScreenshot(employeeId, file);
    }
}
