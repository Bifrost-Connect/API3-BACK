package com.ipem.api.modules.vehicle.service;

import com.ipem.api.modules.vehicle.model.Car;
import com.ipem.api.modules.vehicle.model.CarType;
import com.ipem.api.modules.vehicle.repository.CarRepository;
import com.ipem.api.modules.vehicle.repository.CarTypeRepository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class VehicleService {

    private final CarRepository carRepository;
    private final CarTypeRepository carTypeRepository;

    public VehicleService(CarRepository carRepository,
                          CarTypeRepository carTypeRepository) {
        this.carRepository = carRepository;
        this.carTypeRepository = carTypeRepository;
    }

    // =========================================================
    // ATUALIZAR KM / OBS
    // =========================================================
    @Transactional
    public void updateKmAndObs(String prefix, Float km, String obs) {
        Car car = carRepository.findById(prefix)
                .orElseThrow(() -> new RuntimeException("Veículo não encontrado com o prefixo: " + prefix));

        car.setCurrentKm(km);
        car.setObservations(obs);
        carRepository.save(car);
    }

    // =========================================================
    // CADASTRO
    // =========================================================
    @Transactional
    public Car register(Car car) {
        if (car.getType() != null && car.getType().getId() != null) {
            CarType type = carTypeRepository.findById(car.getType().getId())
                    .orElseThrow(() -> new RuntimeException("Tipo de veículo inválido"));
            car.setType(type);
        }

        car.setAvailable(true);
        car.setCurrentKm(0.0f);
        car.setIsActive(true);

        return carRepository.save(car);
    }

    // =========================================================
    // LISTAR VEÍCULOS
    // =========================================================
    public List<Car> findAllCars() {
        return carRepository.findAll();
    }

    // =========================================================
    // BUSCAR POR PREFIXO
    // =========================================================
    public Car findByPrefix(String prefix) {
        return carRepository.findById(prefix)
                .orElseThrow(() -> new RuntimeException("Veículo não encontrado"));
    }

    // =========================================================
    // TIPOS
    // =========================================================
    public List<CarType> findAllActiveTypes() {
        return carTypeRepository.findAll();
    }

    // =========================================================
    // ABASTECIMENTO
    // =========================================================
    public void registerFuel(String prefix, Double value, String dateStr) {
        Car car = carRepository.findById(prefix)
                .orElseThrow(() -> new RuntimeException("Veículo não encontrado"));



        car.setCurrentKm(car.getCurrentKm());
        carRepository.save(car);
    }

    // =========================================================
    // SERVIÇO ATUAL (MOCK)
    // =========================================================
    public Map<String, Object> getCurrentService() {
        Map<String, Object> chamado = new HashMap<>();
        chamado.put("id", 1);
        chamado.put("description", "Atendimento em rota - Fiscalização");
        chamado.put("status", "EM_ANDAMENTO");
        return chamado;
    }
}