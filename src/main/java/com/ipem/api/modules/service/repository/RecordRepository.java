package com.ipem.api.modules.service.repository;

import com.ipem.api.modules.service.model.Record;
import com.ipem.api.modules.service.model.enums.RecordType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RecordRepository extends JpaRepository<Record, Long> {

    List<Record> findByAttendanceIdAndIsActiveTrueOrderByRecordDateAsc(Long attendanceId);

    List<Record> findByAttendanceIdAndRecordTypeAndIsActiveTrue(Long attendanceId, RecordType type);
}