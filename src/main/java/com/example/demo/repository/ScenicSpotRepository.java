package com.example.demo.repository;

import com.example.demo.entity.ScenicSpot;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ScenicSpotRepository extends JpaRepository<ScenicSpot, Long> {
    List<ScenicSpot> findByLocationCity(String city);
    List<ScenicSpot> findByCategory(String category);
}
