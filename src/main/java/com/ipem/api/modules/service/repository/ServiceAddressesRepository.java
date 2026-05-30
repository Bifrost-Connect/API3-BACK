package com.ipem.api.modules.service.repository;

import com.ipem.api.modules.service.model.Refueling;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ServiceAddressesRepository extends JpaRepository<Refueling, Long> {
}
