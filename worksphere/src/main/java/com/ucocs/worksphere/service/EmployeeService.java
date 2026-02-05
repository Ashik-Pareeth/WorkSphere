package com.ucocs.worksphere.service;

import com.ucocs.worksphere.dto.EmployeeResponseDTO;
import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.enums.EmployeeStatus;
import com.ucocs.worksphere.exception.ResourceNotFoundException;
import com.ucocs.worksphere.repository.EmployeeRepository;
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
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with name " + userName));
        employee.setPassword(passwordEncoder.encode(newPassword));
        employee.setPhoneNumber(phoneNumber);
        employee.setEmployeeStatus(EmployeeStatus.ACTIVE);
        employeeRepository.save(employee);
    }

    public void uploadProfilePic(String userName, MultipartFile image) {
        Employee employee = employeeRepository.findByUserName(userName)
                .orElseThrow(() -> new ResourceNotFoundException("User Not Found with name " + userName));
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

    public List<EmployeeResponseDTO> getAllEmployees() {
        return employeeRepository.findAll()
                .stream()
                .map(EmployeeResponseDTO::fromEntity)
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

