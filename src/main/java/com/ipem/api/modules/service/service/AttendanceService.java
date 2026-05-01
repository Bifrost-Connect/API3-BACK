package com.ipem.api.modules.service.service;

import com.ipem.api.modules.service.dto.CheckInOutRequestDTO;
import com.ipem.api.modules.service.dto.ServiceReportEntryDTO;
import com.ipem.api.modules.service.dto.ServiceReportMonthDTO;
import com.ipem.api.modules.service.model.Attendance;
import com.ipem.api.modules.service.model.enums.Priority;
import com.ipem.api.modules.service.repository.AttendanceRepository;
import com.ipem.api.modules.user.repository.UserRepository;
import com.ipem.api.modules.vehicle.model.enums.VehicleStatus;
import com.ipem.api.modules.vehicle.repository.CarRepository;

import org.hibernate.envers.AuditReader;
import org.hibernate.envers.AuditReaderFactory;
import org.hibernate.envers.RevisionType;
import org.hibernate.envers.query.AuditEntity;
import jakarta.persistence.EntityManager;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final CarRepository carRepository;
    private final UserRepository userRepository;
    private final EntityManager entityManager;

    public AttendanceService(AttendanceRepository attendanceRepository,
                             CarRepository carRepository,
                             UserRepository userRepository,
                             EntityManager entityManager) {
        this.attendanceRepository = attendanceRepository;
        this.carRepository = carRepository;
        this.userRepository = userRepository;
        this.entityManager = entityManager;
    }

    @Transactional
    public Attendance startService(CheckInOutRequestDTO dto) {
        var car = carRepository.findById(dto.carPrefix())
                .orElseThrow(() -> new RuntimeException("Veículo não encontrado com o prefixo: " + dto.carPrefix()));
        var user = userRepository.findById(dto.userRegistration())
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado com a matrícula: " + dto.userRegistration()));

        Attendance newAttendance = Attendance.builder()
                .car(car)
                .user(user)
                .departureTime(LocalDateTime.now())
                .departureKm(dto.recordKm())
                .description(dto.note())
                .priority(dto.priority() != null ? dto.priority() : Priority.MEDIUM)
                .build();

        newAttendance.setIsActive(true);

        return attendanceRepository.save(newAttendance);
    }

    @Transactional
    public Attendance finishService(Long attendanceId, Float kmFinal) {
        Attendance attendance = attendanceRepository.findById(attendanceId)
                .orElseThrow(() -> new RuntimeException("Atendimento não encontrado com o ID: " + attendanceId));

        attendance.setArrivalTime(LocalDateTime.now());
        attendance.setCompletionTime(LocalDateTime.now());
        attendance.setArrivalKm(kmFinal);

        var car = attendance.getCar();
        car.setCurrentKm(kmFinal);
        car.setVehicleStatus(VehicleStatus.AVAILABLE);
        carRepository.save(car);

        return attendanceRepository.save(attendance);
    }

    public List<ServiceReportMonthDTO> getMonthlyServiceReports(int months) {
        var formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        var monthNameFormatter = DateTimeFormatter.ofPattern("MMMM", new Locale("pt", "BR"));
        var reports = new ArrayList<ServiceReportMonthDTO>();

        for (int offset = months - 1; offset >= 0; offset--) {
            YearMonth yearMonth = YearMonth.now().minusMonths(offset);
            var start = yearMonth.atDay(1).atStartOfDay();
            var end = yearMonth.atEndOfMonth().plusDays(1).atStartOfDay();

            var services = attendanceRepository.findByDepartureTimeBetweenAndIsActiveTrue(start, end);

            int totalCalls = services.size();
            int completedCalls = (int) services.stream().filter(s -> s.getCompletionTime() != null).count();
            int openCalls = totalCalls - completedCalls;

            String monthLabel = yearMonth.format(monthNameFormatter);
            monthLabel = monthLabel.substring(0, 1).toUpperCase() + monthLabel.substring(1);

            boolean isCurrentMonth = yearMonth.equals(YearMonth.now());
            String status = isCurrentMonth
                    ? openCalls > 0
                    ? String.format("O mês de %s ainda não foi fechado", monthLabel)
                    : String.format("O mês de %s foi fechado", monthLabel)
                    : openCalls > 0
                    ? String.format("Mês de %s com %d chamados em aberto", monthLabel, openCalls)
                    : String.format("Mês de %s fechado", monthLabel);

            var entries = new ArrayList<ServiceReportEntryDTO>();
            for (var service : services) {
                String departureTime = service.getDepartureTime() != null ? formatter.format(service.getDepartureTime()) : "";
                String arrivalTime = service.getArrivalTime() != null ? formatter.format(service.getArrivalTime()) : "";
                String completionTime = service.getCompletionTime() != null ? formatter.format(service.getCompletionTime()) : "";
                String statusLabel = service.getCompletionTime() != null ? "Finalizado" : "Em andamento";

                entries.add(new ServiceReportEntryDTO(
                        service.getId(),
                        service.getCar() != null ? service.getCar().getPrefix() : "",
                        service.getUser() != null ? service.getUser().getRegistration() : "",
                        service.getUser() != null ? service.getUser().getName() : "",
                        service.getDescription(),
                        departureTime,
                        arrivalTime,
                        completionTime,
                        statusLabel,
                        service.getDepartureKm(),
                        service.getArrivalKm(),
                        service.getDestinationRequester()
                ));
            }

            reports.add(new ServiceReportMonthDTO(
                    monthLabel,
                    yearMonth.getYear(),
                    totalCalls,
                    completedCalls,
                    openCalls,
                    isCurrentMonth,
                    status,
                    entries
            ));
        }

        return reports;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAttendanceAuditHistory() {
        AuditReader auditReader = AuditReaderFactory.get(entityManager);

        List<?> revisions = auditReader.createQuery()
                .forRevisionsOfEntity(Attendance.class, false, true)
                .addOrder(AuditEntity.revisionNumber().desc())
                .setMaxResults(100)
                .getResultList();

        List<Map<String, Object>> historyList = new ArrayList<>();

        for (Object item : revisions) {
            Object[] revision = (Object[]) item;
            Attendance entity = (Attendance) revision[0];
            RevisionType revisionType = (RevisionType) revision[2];

            Map<String, Object> dto = new HashMap<>();

            Map<String, Object> entityData = new HashMap<>();
            entityData.put("id", entity.getId());
            entityData.put("departureTime", entity.getDepartureTime());
            entityData.put("completionTime", entity.getCompletionTime());
            entityData.put("destinationRequester", entity.getDestinationRequester());
            entityData.put("description", entity.getDescription());

            if (entity.getPriority() != null) {
                entityData.put("priority", entity.getPriority().name());
            }
            entityData.put("expectedCompletionTime", entity.getExpectedCompletionTime());

            if (entity.getCar() != null) {
                entityData.put("car", Map.of("prefix", entity.getCar().getPrefix()));
            }

            if (entity.getUser() != null) {
                entityData.put("user", Map.of(
                        "registration", entity.getUser().getRegistration(),
                        "name", entity.getUser().getName()
                ));
            }

            dto.put("entity", entityData);
            dto.put("revisionType", revisionType.name());

            historyList.add(dto);
        }

        return historyList;
    }
}