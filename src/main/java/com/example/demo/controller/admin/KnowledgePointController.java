package com.example.demo.controller.admin;

import com.example.demo.dto.response.ApiResponse;
import com.example.demo.entity.KnowledgePoint;
import com.example.demo.repository.KnowledgePointRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/knowledge-points")
@RequiredArgsConstructor
public class KnowledgePointController {

    private final KnowledgePointRepository knowledgePointRepository;

    @GetMapping
    @Transactional(readOnly = true)
    public ApiResponse<List<KnowledgePoint>> list(@RequestParam(required = false) Long scenicSpotId) {
        if (scenicSpotId != null) {
            return ApiResponse.success(knowledgePointRepository.findByScenicSpotId(scenicSpotId));
        }
        return ApiResponse.success(knowledgePointRepository.findAll());
    }

    @PostMapping
    public ApiResponse<KnowledgePoint> create(@RequestBody KnowledgePoint kp) {
        return ApiResponse.success(knowledgePointRepository.save(kp));
    }

    @PutMapping("/{id}")
    public ApiResponse<KnowledgePoint> update(@PathVariable Long id, @RequestBody KnowledgePoint kp) {
        kp.setId(id);
        return ApiResponse.success(knowledgePointRepository.save(kp));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        knowledgePointRepository.deleteById(id);
        return ApiResponse.success(null);
    }
}
