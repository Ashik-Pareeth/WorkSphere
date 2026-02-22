package com.ucocs.worksphere.service;

import com.ucocs.worksphere.entity.PublicHoliday;
import com.ucocs.worksphere.repository.PublicHolidayRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PublicHolidayService {

    private final PublicHolidayRepository publicHolidayRepository;

    public List<PublicHoliday> getHolidaysByYear(int year) {
        return publicHolidayRepository.findHolidaysByYear(year);
    }

    public boolean isHoliday(LocalDate date) {
        return publicHolidayRepository.existsByDate(date);
    }

    // You can add methods here later for Admins to create/delete holidays
    public PublicHoliday createHoliday(PublicHoliday holiday) {
        // Add logic to prevent duplicate dates
        if(isHoliday(holiday.getDate())) {
            throw new IllegalArgumentException("A holiday already exists on this date.");
        }
        return publicHolidayRepository.save(holiday);
    }
}