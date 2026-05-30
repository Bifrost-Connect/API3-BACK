package com.ipem.api.modules.service.repository;

import com.ipem.api.modules.service.model.Incident;
import com.ipem.api.modules.service.model.enums.IncidentType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface IncidentRepository extends JpaRepository<Incident, Long> {

    List<Incident> findByIncidentTypeAndIsActiveTrue(IncidentType type);

    List<Incident> findByRequestSupportTrueAndIsActiveTrue();

    // Busca todos os incidentes vinculados a um chamado específico (para o histórico completo)
    @org.springframework.data.jpa.repository.Query(value = "SELECT * FROM incidents WHERE service_id = :serviceId AND is_active = true ORDER BY created_at ASC", nativeQuery = true)
    List<Incident> findByServiceIdAndIsActiveTrue(@org.springframework.data.repository.query.Param("serviceId") Long serviceId);
}