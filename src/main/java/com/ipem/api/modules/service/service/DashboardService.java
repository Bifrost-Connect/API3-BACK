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
        double monthlyFuelSpend = refuelingRepository.sumMonthlyFuelSpend();
        double averagePricePerLiter = refuelingRepository.avgMonthlyPricePerLiter();
        double totalLitersRefueled = refuelingRepository.sumMonthlyLiters();

        Long available = carRepository.countByStatus(VehicleStatus.AVAILABLE);
        Long maintenance = carRepository.countByStatus(VehicleStatus.MAINTENANCE);
        Long inUse = carRepository.countByStatus(VehicleStatus.IN_USE);

        return new DashboardMetricsDTO(
                available != null ? available : 0L,
                maintenance != null ? maintenance : 0L,
                inUse != null ? inUse : 0L,
                userRepository.countTechniciansByStatus(EmployeeStatus.AVAILABLE),
                userRepository.countTechniciansByStatus(EmployeeStatus.ON_DUTY),
                monthlyFuelSpend,
                averagePricePerLiter,
                totalLitersRefueled
        );
    }
}