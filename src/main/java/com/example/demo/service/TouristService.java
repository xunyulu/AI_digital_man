package com.example.demo.service;

import com.example.demo.entity.Tourist;
import com.example.demo.repository.TouristRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class TouristService {

    private final TouristRepository touristRepository;

    public Tourist findOrCreateByDeviceId(String deviceId) {
        return touristRepository.findByDeviceId(deviceId)
                .map(tourist -> {
                    tourist.setLastActiveAt(LocalDateTime.now());
                    return touristRepository.save(tourist);
                })
                .orElseGet(() -> touristRepository.save(
                        Tourist.builder()
                                .deviceId(deviceId)
                                .nickname("游客")
                                .build()
                ));
    }
}
