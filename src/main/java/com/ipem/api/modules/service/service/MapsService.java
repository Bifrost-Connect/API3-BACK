package com.ipem.api.modules.service.service;

import com.ipem.api.modules.service.dto.DashboardMetricsDTO;
import com.ipem.api.modules.service.dto.ServiceReportEntryDTO;
import com.ipem.api.modules.service.dto.ServiceReportMonthDTO;
import com.ipem.api.modules.service.repository.RecordRepository;
import com.ipem.api.modules.service.repository.RefuelingRepository;
import com.ipem.api.modules.service.repository.ServiceAddressesRepository;
import com.ipem.api.modules.service.repository.ServiceRepository;
import com.ipem.api.modules.user.repository.UserRepository;
import com.ipem.api.modules.vehicle.repository.CarRepository;
import jakarta.persistence.EntityManager;

import org.springframework.stereotype.Service;

@Service
public class MapsService {

    private final ServiceRepository serviceRepository;
    private final ServiceAddressesRepository serviceAddressesRepository;
    private final CarRepository carRepository;
    private final UserRepository userRepository;
    private final RecordRepository recordRepository;
    private final RefuelingRepository refuelingRepository;
    private final EntityManager entityManager;

    /**
     * Injeção de dependências via construtor (Melhor prática do Spring, garante imutabilidade).
     */
    public MapsService(ServiceRepository serviceRepository, ServiceAddressesRepository serviceAddressesRepository, CarRepository carRepository,
                       UserRepository userRepository, RecordRepository recordRepository,
                       RefuelingRepository refuelingRepository, EntityManager entityManager) {
        this.serviceRepository = serviceRepository;
        this.serviceAddressesRepository = serviceAddressesRepository;
        this.carRepository = carRepository;
        this.userRepository = userRepository;
        this.recordRepository = recordRepository;
        this.refuelingRepository = refuelingRepository;
        this.entityManager = entityManager;
    }

}