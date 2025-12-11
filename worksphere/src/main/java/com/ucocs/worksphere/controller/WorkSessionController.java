package com.ucocs.worksphere.controller;

import com.ucocs.worksphere.service.WorkSessionService;
import org.springframework.web.bind.annotation.*;

@RequestMapping("/work-session")
@RestController
public class WorkSessionController {
    private final WorkSessionService workSessionService;

    public WorkSessionController(WorkSessionService workSessionService) {
        this.workSessionService = workSessionService;
    }

    @PostMapping("/start/{employeeId}")
    public void startWork(@PathVariable Long employeeId) {
        workSessionService.startSession(employeeId);
    }

    @PostMapping("/end/{employeeId}")
    public void endWork(@PathVariable Long employeeId) {
        workSessionService.endSession(employeeId);
    }
}
