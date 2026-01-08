package com.ucocs.worksphere;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {
    @GetMapping("/" )
    public String method(){
        return "WorkSphere is running";
    }
}
