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
        return new DashboardMetricsDTO(
                carRepository.countByStatus(VehicleStatus.AVAILABLE),
                carRepository.countByStatus(VehicleStatus.MAINTENANCE),
                carRepository.countByStatus(VehicleStatus.IN_USE),
                userRepository.countTechniciansByStatus(EmployeeStatus.AVAILABLE),
                userRepository.countTechniciansByStatus(EmployeeStatus.ON_DUTY),
                refuelingRepository.sumMonthlyFuelSpend(),
                refuelingRepository.avgMonthlyPricePerLiter(),
                refuelingRepository.sumMonthlyLiters()
        );
    }



}
