package com.example.demo.service;

import com.example.demo.entity.Attraction;
import com.example.demo.repository.AttractionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MapQueryService {

    private final AttractionRepository attractionRepository;

    private static final double EARTH_RADIUS_KM = 6371.0;

    public String queryRoute(String originName, String destinationName) {
        Attraction origin = findAttraction(originName);
        Attraction dest = findAttraction(destinationName);

        if (origin == null || dest == null) {
            return "未找到相关景点坐标信息";
        }

        if (origin.getLatitude() == null || origin.getLongitude() == null
                || dest.getLatitude() == null || dest.getLongitude() == null) {
            return origin.getName() + "或" + dest.getName() + "缺少坐标信息";
        }

        double distance = haversine(origin.getLatitude(), origin.getLongitude(),
                dest.getLatitude(), dest.getLongitude());
        int walkMinutes = (int) Math.ceil(distance / 5.0 * 60); // 5 km/h walking

        return String.format("从%s到%s直线距离约%.1f公里，步行约%d分钟。",
                origin.getName(), dest.getName(), distance, walkMinutes);
    }

    private Attraction findAttraction(String name) {
        return attractionRepository.findByName(name).orElse(null);
    }

    private double haversine(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_KM * c;
    }
}
