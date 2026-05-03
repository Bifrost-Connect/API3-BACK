package com.ipem.api.modules.vehicle.service;

import com.ipem.api.modules.vehicle.model.Car;
import com.ipem.api.modules.vehicle.model.CarType;
import com.ipem.api.modules.vehicle.repository.CarRepository;
import com.ipem.api.modules.vehicle.repository.CarTypeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class VehicleService {

    private final CarRepository carRepository;
    private final CarTypeRepository carTypeRepository;

    public VehicleService(CarRepository carRepository, CarTypeRepository carTypeRepository) {
        this.carRepository = carRepository;
        this.carTypeRepository = carTypeRepository;
    }

    @Transactional
    public void updateKmAndObs(String prefix, Float km, String obs) {
        // Busca o Carro pelo prefixo (ID) usando o seu CarroRepository
        Car car = carRepository.findById(prefix)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with prefix: " + prefix));

        // Atualiza os campos conforme sua classe Carro
        car.setCurrentKm(km);
        car.setObservations(obs);

        // Salva as alterações no MySQL
        carRepository.save(car);
    }

    @Transactional
    public Car register(Car car) {
        // FIX TRANSIENT OBJECT:
        if (car.getType() != null) {
            if (car.getType().getId() == null) {
                // Salva o TipoCarro antes do Carro para evitar o TransientObjectException
                carTypeRepository.save(car.getType());
            } else {
                // Busca o tipo existente no banco para garantir que está "managed"
                CarType existingType = carTypeRepository.findById(car.getType().getId())
                        .orElseThrow(() -> new RuntimeException("Car type not found"));
                car.setType(existingType);
            }
        }

        car.setAvailable(true);
        car.setCurrentKm(0.0f);
        return carRepository.save(car);
    }

    public Car save(Car car) {
        return carRepository.save(car);
    }
}