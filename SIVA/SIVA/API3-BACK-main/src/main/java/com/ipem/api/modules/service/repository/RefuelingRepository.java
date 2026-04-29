package com.ipem.api.modules.service.repository;

import com.ipem.api.modules.service.model.Refueling;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface RefuelingRepository extends JpaRepository<Refueling, Long> {

    @Query("SELECT a FROM Refueling a JOIN a.record r WHERE r.service.car.prefix = :prefix ORDER BY r.recordDate DESC")
    List<Refueling> findLatestRefuelingsByCar(String prefix);

    @Query("SELECT COALESCE(SUM(r.totalAmount), 0.0) FROM Refueling r WHERE MONTH(r.createdAt) = MONTH(CURRENT_DATE()) AND YEAR(r.createdAt) = YEAR(CURRENT_DATE())")
    Double sumMonthlyFuelSpend();

    @Query("SELECT COALESCE(SUM(r.liters), 0.0) FROM Refueling r WHERE MONTH(r.createdAt) = MONTH(CURRENT_DATE()) AND YEAR(r.createdAt) = YEAR(CURRENT_DATE())")
    Double sumMonthlyLiters();

    @Query("SELECT COALESCE(AVG(r.pricePerLiter), 0.0) FROM Refueling r WHERE MONTH(r.createdAt) = MONTH(CURRENT_DATE()) AND YEAR(r.createdAt) = YEAR(CURRENT_DATE())")
    Double avgMonthlyPricePerLiter();
}