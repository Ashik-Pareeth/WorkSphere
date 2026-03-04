package com.ucocs.worksphere.controller;

import com.ucocs.worksphere.entity.PublicHoliday;
import com.ucocs.worksphere.service.PublicHolidayService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Year;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/holidays")
@RequiredArgsConstructor
public class PublicHolidayController {

    private final PublicHolidayService holidayService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<PublicHoliday>> getHolidays(
            @RequestParam(required = false) Integer year) {
        int targetYear = (year != null) ? year : Year.now().getValue();
        return ResponseEntity.ok(holidayService.getHolidaysByYear(targetYear));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    public ResponseEntity<PublicHoliday> createHoliday(@RequestBody PublicHoliday holiday) {
        return ResponseEntity.ok(holidayService.createHoliday(holiday));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    public ResponseEntity<Void> deleteHoliday(@PathVariable UUID id) {
        holidayService.deleteHoliday(id);
        return ResponseEntity.noContent().build();
    }
}
