package com.example.demo.repository;

import com.example.demo.entity.Attraction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface AttractionRepository extends JpaRepository<Attraction, Long> {
    List<Attraction> findByScenicSpotIdOrderBySortOrder(Long scenicSpotId);
    Optional<Attraction> findByName(String name);
}
