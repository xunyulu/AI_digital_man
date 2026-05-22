package com.example.demo.repository;

import com.example.demo.entity.TourRouteAttraction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TourRouteAttractionRepository extends JpaRepository<TourRouteAttraction, Long> {
    List<TourRouteAttraction> findByRouteIdOrderBySortOrder(Long routeId);

    void deleteByRouteId(Long routeId);
}
