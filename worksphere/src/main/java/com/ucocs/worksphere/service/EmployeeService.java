package com.ucocs.worksphere.service;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class EmployeeService {
    public double calculateBonus(double salary){
        if(salary>50000)
        {
            return salary*.10;
        }
        else {
            return salary*.05;
        }
    }
}
