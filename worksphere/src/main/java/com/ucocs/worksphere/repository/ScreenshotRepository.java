package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.Screenshot;
import com.ucocs.worksphere.entity.WorkSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ScreenshotRepository extends JpaRepository<Screenshot, Long> {
    List<Screenshot> findByWorkSession(WorkSession workSession);
}
