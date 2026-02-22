package com.ucocs.worksphere.service;

import com.ucocs.worksphere.entity.WorkSchedule;
import com.ucocs.worksphere.exception.ResourceNotFoundException;
import com.ucocs.worksphere.repository.WorkScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WorkScheduleService {

    private final WorkScheduleRepository workScheduleRepository;

    public WorkSchedule createSchedule(WorkSchedule workSchedule) {
        return workScheduleRepository.save(workSchedule);
    }

    public WorkSchedule getScheduleById(UUID id) {
        return workScheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Work Schedule not found with id: " + id));
    }

    public List<WorkSchedule> getAllSchedules() {
        return workScheduleRepository.findAll();
    }

    public WorkSchedule updateSchedule(UUID id, WorkSchedule updatedSchedule) {
        WorkSchedule existing = getScheduleById(id);

        existing.setScheduleName(updatedSchedule.getScheduleName());
        existing.setTimezone(updatedSchedule.getTimezone());
        existing.setExpectedStart(updatedSchedule.getExpectedStart());
        existing.setExpectedEnd(updatedSchedule.getExpectedEnd());
        existing.setGracePeriodMin(updatedSchedule.getGracePeriodMin());
        existing.setBreakDurationMin(updatedSchedule.getBreakDurationMin());
        existing.setWorkingDays(updatedSchedule.getWorkingDays());

        return workScheduleRepository.save(existing);
    }
}