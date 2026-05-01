package com.ipem.api.modules.service.service;

import com.ipem.api.modules.service.dto.DashboardMetricsDTO;
import com.ipem.api.modules.service.repository.RefuelingRepository;
import com.ipem.api.modules.user.model.enums.EmployeeStatus;
import com.ipem.api.modules.user.repository.UserRepository;
import com.ipem.api.modules.vehicle.model.enums.VehicleStatus;
import com.ipem.api.modules.vehicle.repository.CarRepository;
import org.springframework.stereotype.Service;

@Service
public class DashboardService {

    private final CarRepository carRepository;
    private final UserRepository userRepository;
    private final RefuelingRepository refuelingRepository;

    public DashboardService(CarRepository carRepository, UserRepository userRepository, RefuelingRepository refuelingRepository) {
        this.carRepository = carRepository;
        this.userRepository = userRepository;
        this.refuelingRepository = refuelingRepository;
    }

    public DashboardMetricsDTO getMetrics(){
        Double monthlyFuelSpend = refuelingRepository.sumMonthlyFuelSpend();
        Double averagePricePerLiter = refuelingRepository.avgMonthlyPricePerLiter();
        Double totalLitersRefueled = refuelingRepository.sumMonthlyLiters();

        Long availableCars = carRepository.countByStatus(VehicleStatus.AVAILABLE);
        Long maintenanceCars = carRepository.countByStatus(VehicleStatus.MAINTENANCE);
        Long inUseCars = carRepository.countByStatus(VehicleStatus.IN_USE);

        return new DashboardMetricsDTO(
                availableCars != null ? availableCars.intValue() : 0,
                maintenanceCars != null ? maintenanceCars.intValue() : 0,
                inUseCars != null ? inUseCars.intValue() : 0,

                (int) userRepository.countTechniciansByStatus(EmployeeStatus.AVAILABLE),
                (int) userRepository.countTechniciansByStatus(EmployeeStatus.ON_DUTY),

                monthlyFuelSpend != null ? monthlyFuelSpend : 0.0,
                averagePricePerLiter != null ? averagePricePerLiter : 0.0,
                totalLitersRefueled != null ? totalLitersRefueled : 0.0
        );
    }
}