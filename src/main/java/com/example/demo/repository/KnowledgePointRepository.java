package com.example.demo.repository;

import com.example.demo.entity.KnowledgePoint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface KnowledgePointRepository extends JpaRepository<KnowledgePoint, Long> {

    List<KnowledgePoint> findByScenicSpotId(Long scenicSpotId);

    List<KnowledgePoint> findByAttractionId(Long attractionId);

    @Query("SELECT k FROM KnowledgePoint k WHERE k.scenicSpot.id = :spotId " +
           "AND (LOWER(k.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(k.content) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(k.tags) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<KnowledgePoint> searchByKeyword(@Param("spotId") Long spotId, @Param("keyword") String keyword);
}
