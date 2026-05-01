package com.ipem.api.modules.service.repository;

import com.ipem.api.modules.service.model.Attendance;
import com.ipem.api.modules.vehicle.model.Car;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    @Query("SELECT a FROM Attendance a WHERE a.car.prefix = :prefix AND a.isActive = true")
    List<Attendance> findByCarPrefix(@Param("prefix") String prefix);

    List<Attendance> findByDepartureTimeBetweenAndIsActiveTrue(LocalDateTime start, LocalDateTime end);

    List<Attendance> findByCarAndCompletionTimeIsNullAndIsActiveTrue(Car car);

    Optional<Attendance> findFirstByCarAndCompletionTimeIsNullAndIsActiveTrueOrderByCreatedAtDesc(Car car);
}