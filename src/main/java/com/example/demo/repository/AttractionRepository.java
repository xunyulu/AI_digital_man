package com.example.demo.repository;

import com.example.demo.entity.Attraction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface AttractionRepository extends JpaRepository<Attraction, Long> {
    List<Attraction> findByScenicSpotIdOrderBySortOrder(Long scenicSpotId);
    Optional<Attraction> findByName(String name);

    @Query("SELECT a FROM Attraction a JOIN FETCH a.scenicSpot WHERE a.id = :id")
    Optional<Attraction> findByIdWithScenicSpot(@Param("id") Long id);
}
