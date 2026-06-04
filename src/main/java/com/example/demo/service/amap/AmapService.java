package com.example.demo.service.amap;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@Service
public class AmapService {

    @Value("${amap.web-service-key}")
    private String apiKey;

    private final WebClient webClient = WebClient.builder()
            .baseUrl("https://restapi.amap.com")
            .build();

    /**
     * 步行路线规划
     * @return 高德API原始响应，包含route.paths[0].distance/duration/steps/polyline
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> getWalkingRoute(double originLng, double originLat,
                                                double destLng, double destLat) {
        String origin = originLng + "," + originLat;
        String destination = destLng + "," + destLat;

        Map<String, Object> response = webClient.get()
                .uri(uri -> uri.path("/v3/direction/walking")
                        .queryParam("key", apiKey)
                        .queryParam("origin", origin)
                        .queryParam("destination", destination)
                        .build())
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        return response;
    }
}
