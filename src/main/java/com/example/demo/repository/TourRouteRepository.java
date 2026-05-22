package com.example.demo.repository;

import com.example.demo.entity.TourRoute;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TourRouteRepository extends JpaRepository<TourRoute, Long> {
    List<TourRoute> findByScenicSpotIdOrderBySortOrder(Long scenicSpotId);
}
