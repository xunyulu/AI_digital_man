package com.example.demo.repository;

import com.example.demo.entity.Rating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface RatingRepository extends JpaRepository<Rating, Long> {

    Page<Rating> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<Rating> findByAttractionId(Long attractionId);

    @Query("SELECT AVG(r.score) FROM Rating r")
    Double getAverageScore();

    @Query("SELECT r.score, COUNT(r) FROM Rating r GROUP BY r.score ORDER BY r.score")
    List<Object[]> getScoreDistribution();

    @Query("SELECT r.score, COUNT(r) FROM Rating r WHERE r.attraction.scenicSpot.id = :scenicSpotId GROUP BY r.score ORDER BY r.score")
    List<Object[]> getScoreDistributionByScenicSpotId(@Param("scenicSpotId") Long scenicSpotId);

    long count();

    long countByScore(int score);

    long countByAttractionScenicSpotId(Long scenicSpotId);

    @Query("SELECT AVG(r.score) FROM Rating r WHERE r.attraction.scenicSpot.id = :scenicSpotId")
    Double getAverageScoreByScenicSpotId(@Param("scenicSpotId") Long scenicSpotId);

    @Query("SELECT r.score, COUNT(r) FROM Rating r LEFT JOIN r.attraction a LEFT JOIN a.scenicSpot ass LEFT JOIN r.scenicSpot ss WHERE ss.id = :scenicSpotId OR ass.id = :scenicSpotId GROUP BY r.score ORDER BY r.score")
    List<Object[]> getScoreDistributionByAnyScenicSpotId(@Param("scenicSpotId") Long scenicSpotId);

    @Query("SELECT COUNT(r) FROM Rating r LEFT JOIN r.attraction a LEFT JOIN a.scenicSpot ass LEFT JOIN r.scenicSpot ss WHERE ss.id = :scenicSpotId OR ass.id = :scenicSpotId")
    long countByAnyScenicSpotId(@Param("scenicSpotId") Long scenicSpotId);

    @Query("SELECT AVG(r.score) FROM Rating r LEFT JOIN r.attraction a LEFT JOIN a.scenicSpot ass LEFT JOIN r.scenicSpot ss WHERE ss.id = :scenicSpotId OR ass.id = :scenicSpotId")
    Double getAverageScoreByAnyScenicSpotId(@Param("scenicSpotId") Long scenicSpotId);
}
