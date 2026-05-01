package com.ipem.api.modules.service.controller;

import com.ipem.api.modules.service.dto.CheckInOutRequestDTO;
import com.ipem.api.modules.service.dto.DashboardMetricsDTO;
import com.ipem.api.modules.service.dto.ServiceReportMonthDTO;
import com.ipem.api.modules.service.service.DashboardService;
import com.ipem.api.modules.service.service.AttendanceService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/service")
@CrossOrigin(origins = "*")
public class AttendanceController {

    private final AttendanceService attendanceService;
    private final DashboardService dashboardService;

    public AttendanceController(AttendanceService attendanceService, DashboardService dashboardService) {
        this.attendanceService = attendanceService;
        this.dashboardService = dashboardService;
    }

    @PostMapping("/start")
    public ResponseEntity<?> startService(@RequestBody CheckInOutRequestDTO dto) {
        try {
            var attendance = attendanceService.startService(dto);

            return ResponseEntity.ok(
                    Map.of(
                            "message", "Check-in realizado com sucesso!",
                            "serviceId", attendance.getId()
                    )
            );

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    Map.of("error", e.getMessage())
            );
        }
    }

    @PostMapping("/finalize/{id}")
    public ResponseEntity<?> finalizeService(
            @PathVariable Long id,
            @RequestBody CheckInOutRequestDTO dto
    ) {
        try {
            attendanceService.finishService(id, dto.recordKm());

            return ResponseEntity.ok(
                    Map.of("message", "Check-out concluído com sucesso!")
            );

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    Map.of("error", "Erro no checkout: " + e.getMessage())
            );
        }
    }

    @GetMapping("/reports")
    public ResponseEntity<?> getReports(@RequestParam(required = false, defaultValue = "6") int months) {
        try {
            List<ServiceReportMonthDTO> reports = attendanceService.getMonthlyServiceReports(months);
            return ResponseEntity.ok(Map.of("reports", reports));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardMetricsDTO> getDashboardMetrics() {
        return ResponseEntity.ok(dashboardService.getMetrics());
    }

    @GetMapping("/history")
    public ResponseEntity<?> getAttendanceHistory() {
        try {
            List<Map<String, Object>> history = attendanceService.getAttendanceAuditHistory();
            return ResponseEntity.ok(history);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                    Map.of("error", "Erro ao buscar histórico de auditoria: " + e.getMessage())
            );
        }
    }
}