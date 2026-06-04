package com.example.demo.repository;

import com.example.demo.entity.Tourist;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface TouristRepository extends JpaRepository<Tourist, Long> {
    Optional<Tourist> findByDeviceId(String deviceId);
    Optional<Tourist> findByUsername(String username);
    boolean existsByUsername(String username);
}
