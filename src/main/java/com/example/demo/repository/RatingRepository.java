package com.example.demo.repository;

import com.example.demo.entity.Rating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
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

    long count();

    long countByScore(int score);
}
