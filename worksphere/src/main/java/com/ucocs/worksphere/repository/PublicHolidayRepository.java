package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.PublicHoliday;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PublicHolidayRepository extends JpaRepository<PublicHoliday, UUID> {

    // Used by the frontend calendar to display holidays
    @Query("SELECT p FROM PublicHoliday p WHERE YEAR(p.date) = :year ORDER BY p.date ASC")
    List<PublicHoliday> findHolidaysByYear(@Param("year") int year);

    // Used by the nightly attendance job to check if today is a holiday
    Optional<PublicHoliday> findByDate(LocalDate date);

    boolean existsByDate(LocalDate date);
}