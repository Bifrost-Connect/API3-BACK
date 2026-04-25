package com.ipem.api.modules.service.controller;

import com.ipem.api.modules.service.model.Service;
import com.ipem.api.modules.service.service.ServiceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/service")
@CrossOrigin(origins = "*")
public class ServiceController {

    private final ServiceService serviceService;

    public ServiceController(ServiceService serviceService) {
        this.serviceService = serviceService;
    }

    @PostMapping("/finalize")
    public ResponseEntity<?> finalizeService(@RequestBody Service service) {
        try {
            if (service.getCar() == null || service.getCar().getPrefix() == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Vehicle prefix is required."));
            }

            Service savedService = serviceService.save(service);

            return ResponseEntity.ok(Map.of(
                    "message", "Service completed successfully!",
                    "id", savedService.getId()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Error processing checkout: " + e.getMessage()
            ));
        }
    }
}