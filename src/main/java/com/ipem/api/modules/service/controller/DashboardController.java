package com.ipem.api.modules.service.controller;

import com.ipem.api.modules.service.dto.DashboardMetricsDTO;
import com.ipem.api.modules.service.dto.ServiceReportMonthDTO;
import com.ipem.api.modules.service.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/metrics")
    public ResponseEntity<DashboardMetricsDTO> getMetrics() {
        return ResponseEntity.ok(dashboardService.getMetrics());
    }

    @GetMapping("/history")
    public ResponseEntity<?> getHistory() {
        return ResponseEntity.ok(dashboardService.getServiceAuditHistory());
    }

    @GetMapping("/reports")
    public ResponseEntity<?> getReports(@RequestParam(defaultValue = "6") int months) {
        List<ServiceReportMonthDTO> reports = dashboardService.getMonthlyServiceReports(months);
        return ResponseEntity.ok(Map.of("reports", reports));
    }

    /**
     * Histórico completo de ações por chamado.
     * Retorna chamados (ativos e finalizados) com sua linha do tempo de eventos
     * (check-in, abastecimento, incidente, check-out) e metadados de paginação.
     *
     * @param page Número da página, base 0 (padrão: 0).
     * @param size Quantidade de chamados por página (padrão: 10).
     */
    @GetMapping("/history/full")
    public ResponseEntity<?> getFullHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(dashboardService.getFullServiceHistory(page, size));
    }
}