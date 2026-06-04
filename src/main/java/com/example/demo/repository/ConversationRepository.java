package com.example.demo.repository;

import com.example.demo.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    List<Conversation> findByTouristIdOrderByUpdatedAtDesc(Long touristId);

    Page<Conversation> findAllByOrderByUpdatedAtDesc(Pageable pageable);

    Page<Conversation> findByAttractionScenicSpotIdOrderByUpdatedAtDesc(Long scenicSpotId, Pageable pageable);

    long countByStatus(String status);

    long countByAttractionScenicSpotId(Long scenicSpotId);

    long countByAttractionScenicSpotIdAndStatus(Long scenicSpotId, String status);

    @Query("SELECT COUNT(DISTINCT c.tourist.id) FROM Conversation c WHERE c.attraction.scenicSpot.id = :scenicSpotId")
    long countDistinctTouristsByScenicSpotId(@Param("scenicSpotId") Long scenicSpotId);
}
