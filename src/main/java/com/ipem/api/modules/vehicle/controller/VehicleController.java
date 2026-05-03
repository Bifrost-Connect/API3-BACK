package com.ipem.api.modules.vehicle.controller;

import com.ipem.api.modules.vehicle.model.Car;
import com.ipem.api.modules.vehicle.service.VehicleService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/vehicle")
@CrossOrigin(origins = "*")
public class VehicleController {

    private final VehicleService vehicleService;

    public VehicleController(VehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }

    @PatchMapping("/{prefix}/update-data")
    public ResponseEntity<?> updateData(@PathVariable String prefix, @RequestBody Map<String, Object> data) {
        try {
            // Logs de depuração para o seu console do IntelliJ
            System.out.println(">>> Tentando atualizar veículo: " + prefix);

            if (data.get("mileage") == null) {
                return ResponseEntity.badRequest().body("{\"error\": \"Mileage field is required.\"}");
            }

            // Converte os dados do Map com segurança
            Float mileage = Float.parseFloat(data.get("mileage").toString());
            String observations = data.get("observations") != null ? data.get("observations").toString() : "";

            // Chama o service (Certifique-se que o service usa o prefixo para dar o UPDATE)
            vehicleService.updateKmAndObs(prefix.trim(), mileage, observations);

            return ResponseEntity.ok().body("{\"message\": \"Data saved successfully!\"}");
        } catch (Exception e) {
            e.printStackTrace(); // Mostra o erro detalhado no console do Java
            return ResponseEntity.status(500).body("{\"error\": \"Server error: " + e.getMessage() + "\"}");
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerCar(@RequestBody Car car) {
        try {
            vehicleService.register(car);
            return ResponseEntity.ok().body("{\"message\": \"Vehicle registered successfully!\"}");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("{\"error\": \"Registration error: " + e.getMessage() + "\"}");
        }
    }
}