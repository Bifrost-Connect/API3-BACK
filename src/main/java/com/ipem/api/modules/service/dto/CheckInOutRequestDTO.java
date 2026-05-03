package com.ipem.api.modules.service.dto;

public record CheckInOutRequestDTO(
        String carPrefix,
        Float recordKm,
        String note
) {}