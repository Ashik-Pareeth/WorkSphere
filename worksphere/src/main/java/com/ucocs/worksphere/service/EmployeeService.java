package com.ucocs.worksphere.service;

import com.ucocs.worksphere.dto.EmployeeSummary;
import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.enums.EmployeeStatus;
import com.ucocs.worksphere.repository.EmployeeRepository;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
public class EmployeeService {
    private final PasswordEncoder passwordEncoder;
    private final EmployeeRepository employeeRepository;

    public EmployeeService(
            PasswordEncoder passwordEncoder, EmployeeRepository employeeRepository) {
        this.employeeRepository = employeeRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public void saveEmployee(Employee employee) {

        String encoded = passwordEncoder.encode(employee.getPassword());
        employee.setPassword(encoded);
        employeeRepository.save(employee);
    }

    public void activateEmployee(String userName, String newPassword, String phoneNumber) {
        Employee employee = employeeRepository.findByUserName(userName)
                .orElseThrow(() -> new RuntimeException("No employee Found"));
        employee.setPassword(passwordEncoder.encode(newPassword));
        employee.setPhoneNumber(phoneNumber);
        employee.setEmployeeStatus(EmployeeStatus.ACTIVE);
        employeeRepository.save(employee);
    }

    public void uploadProfilePic(String userName, MultipartFile image) {
        Employee employee = employeeRepository.findByUserName(userName)
                .orElseThrow(() -> new UsernameNotFoundException("User Not Found"));
        if (image.isEmpty()) {
            throw new IllegalArgumentException("The file is empty");
        }
        Path uploadPath = Paths.get("uploads/profilePhoto/");
        try {
            Files.createDirectories(uploadPath);
        } catch (IOException e) {
            throw new IllegalStateException("Could not create directory");
        }
        String timeStamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String imageName = timeStamp + image.getOriginalFilename();
        Path filePath = uploadPath.resolve(imageName);
        try {
            Files.copy(image.getInputStream(), filePath);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to store Profile picture");
        }
        ;
        employee.setProfilePic(imageName);
        employeeRepository.save(employee);
    }

    public List<EmployeeSummary> getAllEmployees() {
        return employeeRepository.findAll()
                .stream()
                .map(EmployeeSummary::getEmployeeSummary)
                .toList();
    }


    public double calculateBonus(double salary) {
        if (salary > 50000) {
            return salary * .10;
        } else {
            return salary * .05;
        }
    }
}

