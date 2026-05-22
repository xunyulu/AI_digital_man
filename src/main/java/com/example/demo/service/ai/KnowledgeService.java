package com.example.demo.service.ai;

import com.example.demo.entity.KnowledgePoint;
import com.example.demo.repository.KnowledgePointRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class KnowledgeService {

    private final KnowledgePointRepository knowledgePointRepository;

    public String searchContext(Long scenicSpotId, Long attractionId, String query) {
        StringBuilder context = new StringBuilder();

        // Get knowledge points related to the current attraction
        if (attractionId != null) {
            List<KnowledgePoint> points = knowledgePointRepository.findByAttractionId(attractionId);
            appendPoints(context, points, "当前景点相关信息");
        }

        // Get general scenic spot knowledge
        if (scenicSpotId != null) {
            List<KnowledgePoint> allPoints = knowledgePointRepository.findByScenicSpotId(scenicSpotId);
            // Filter out those already included by attraction
            List<KnowledgePoint> generalPoints = allPoints.stream()
                    .filter(p -> attractionId == null || !attractionId.equals(
                            p.getAttraction() != null ? p.getAttraction().getId() : null))
                    .collect(Collectors.toList());
            appendPoints(context, generalPoints, "景区通用信息");
        }

        // Search by keyword
        if (scenicSpotId != null) {
            for (String keyword : query.split("\\s+")) {
                if (keyword.length() >= 2) {
                    List<KnowledgePoint> matched = knowledgePointRepository
                            .searchByKeyword(scenicSpotId, keyword);
                    appendPoints(context, matched, "搜索匹配: " + keyword);
                }
            }
        }

        return context.toString();
    }

    private void appendPoints(StringBuilder sb, List<KnowledgePoint> points, String category) {
        if (points.isEmpty()) return;
        sb.append("【").append(category).append("】\n");
        for (KnowledgePoint p : points) {
            sb.append("- ").append(p.getTitle()).append(": ")
                    .append(p.getContent()).append("\n");
        }
        sb.append("\n");
    }
}
