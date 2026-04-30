package com.ipem.api.modules.service.service;

import com.ipem.api.modules.service.dto.CheckInOutRequestDTO;
import com.ipem.api.modules.service.dto.ServiceReportEntryDTO;
import com.ipem.api.modules.service.dto.ServiceReportMonthDTO;
import com.ipem.api.modules.service.model.Service;
import com.ipem.api.modules.service.repository.ServiceRepository;
import com.ipem.api.modules.user.repository.UserRepository;
import com.ipem.api.modules.vehicle.repository.CarRepository;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@org.springframework.stereotype.Service
public class ServiceService {

    private final ServiceRepository serviceRepository;
    private final CarRepository carRepository;
    private final UserRepository userRepository;

    public ServiceService(ServiceRepository serviceRepository, CarRepository carRepository, UserRepository userRepository) {
        this.serviceRepository = serviceRepository;
        this.carRepository = carRepository;
        this.userRepository = userRepository;
    }

    // CHECK-IN
    public Service startService(CheckInOutRequestDTO dto) {
        var car = carRepository.findById(dto.carPrefix())
                .orElseThrow(() -> new RuntimeException("Carro não encontrado"));
        var user = userRepository.findById(dto.userRegistration())
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        Service newService = Service.builder()
                .car(car)
                .user(user)
                .departureTime(LocalDateTime.now())
                .departureKm(dto.recordKm())
                .description(dto.note())
                .build();

        return serviceRepository.save(newService);
    }

    public Service finishService(Long serviceId, Float kmFinal) {
        Service service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new RuntimeException("Serviço não encontrado"));

        service.setArrivalTime(LocalDateTime.now());
        service.setCompletionTime(LocalDateTime.now());
        service.setArrivalKm(kmFinal);

        var car = service.getCar();
        car.setCurrentKm(kmFinal);
        car.setVehicleStatus(com.ipem.api.modules.vehicle.model.enums.VehicleStatus.AVAILABLE);
        carRepository.save(car);

        return serviceRepository.save(service);
    }

    public List<ServiceReportMonthDTO> getMonthlyServiceReports(int months) {
        var formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        var monthNameFormatter = DateTimeFormatter.ofPattern("MMMM", new Locale("pt", "BR"));
        var reports = new ArrayList<ServiceReportMonthDTO>();

        for (int offset = months - 1; offset >= 0; offset--) {
            YearMonth yearMonth = YearMonth.now().minusMonths(offset);
            var start = yearMonth.atDay(1).atStartOfDay();
            var end = yearMonth.atEndOfMonth().plusDays(1).atStartOfDay();
            var services = serviceRepository.findByDepartureTimeBetween(start, end);

            int totalCalls = services.size();
            int completedCalls = (int) services.stream().filter(s -> s.getCompletionTime() != null).count();
            int openCalls = totalCalls - completedCalls;

            String monthLabel = yearMonth.format(monthNameFormatter);
            boolean isCurrentMonth = yearMonth.equals(YearMonth.now());
            String status = isCurrentMonth
                    ? openCalls > 0
                    ? String.format("O mês de %s ainda não foi fechado", monthLabel)
                    : String.format("O mês de %s foi fechado", monthLabel)
                    : openCalls > 0
                    ? String.format("Mês de %s com %d chamados em aberto", monthLabel, openCalls)
                    : String.format("Mês de %s fechado", monthLabel);

            var entries = new ArrayList<ServiceReportEntryDTO>();
            for (var service : services) {
                String departureTime = service.getDepartureTime() != null ? formatter.format(service.getDepartureTime()) : "";
                String arrivalTime = service.getArrivalTime() != null ? formatter.format(service.getArrivalTime()) : "";
                String completionTime = service.getCompletionTime() != null ? formatter.format(service.getCompletionTime()) : "";
                String statusLabel = service.getCompletionTime() != null ? "Finalizado" : "Aberto";

                entries.add(new ServiceReportEntryDTO(
                        service.getId(),
                        service.getCar() != null ? service.getCar().getPrefix() : "",
                        service.getUser() != null ? service.getUser().getRegistration() : "",
                        service.getUser() != null ? service.getUser().getName() : "",
                        service.getDescription(),
                        departureTime,
                        arrivalTime,
                        completionTime,
                        statusLabel,
                        service.getDepartureKm(),
                        service.getArrivalKm(),
                        service.getDestinationRequester()
                ));
            }

            reports.add(new ServiceReportMonthDTO(
                    monthLabel,
                    yearMonth.getYear(),
                    totalCalls,
                    completedCalls,
                    openCalls,
                    isCurrentMonth,
                    status,
                    entries
            ));
        }

        return reports;
    }
}