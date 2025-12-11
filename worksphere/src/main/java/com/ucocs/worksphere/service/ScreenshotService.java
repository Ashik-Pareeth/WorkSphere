package com.ucocs.worksphere.service;

import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.entity.Screenshot;
import com.ucocs.worksphere.entity.WorkSession;
import com.ucocs.worksphere.repository.EmployeeRepository;
import com.ucocs.worksphere.repository.ScreenshotRepository;
import com.ucocs.worksphere.repository.WorkSessionRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;

@Service
public class ScreenshotService {
    private final ScreenshotRepository screenshotRepository;
    private final WorkSessionRepository workSessionRepository;

    private final EmployeeRepository employeeRepository;

    public ScreenshotService(ScreenshotRepository screenshotRepository, WorkSessionRepository workSessionRepository,
                             EmployeeRepository employeeRepository) {
        this.screenshotRepository = screenshotRepository;
        this.employeeRepository = employeeRepository;
        this.workSessionRepository = workSessionRepository;
    }

    public Screenshot saveScreenshot(Long employeeId, MultipartFile multipartFile) throws IOException {
        Employee employee = employeeRepository.findById(employeeId).orElseThrow();
        WorkSession workSession = workSessionRepository.findByEmployeeAndIsActiveTrue(employee).orElseThrow();
        if (!workSession.isActive()) {
            throw new RuntimeException("User is not clocked in");
        } else {
            Path uploadPath = Paths.get("upload");
            Files.createDirectories(uploadPath);
            String originalFileName = multipartFile.getOriginalFilename();
            String filename = employeeId + "_" + System.currentTimeMillis() + "_" + originalFileName;
            Path filePath = uploadPath.resolve(filename);
            Files.copy(multipartFile.getInputStream(), filePath);
            Screenshot screenshot = new Screenshot();
            screenshot.setTimeStamp(LocalDateTime.now());
            screenshot.setFilePath(String.valueOf(filePath));
            screenshot.setWorkSession(workSession);
            return screenshotRepository.save(screenshot);
        }

    }

}
