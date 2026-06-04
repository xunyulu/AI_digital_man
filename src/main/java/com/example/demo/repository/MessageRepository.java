package com.example.demo.repository;

import com.example.demo.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByConversationIdOrderByCreatedAtAsc(Long conversationId);
    List<Message> findTop50ByRoleOrderByCreatedAtDesc(String role, Pageable pageable);

    @Query("SELECT m FROM Message m WHERE m.conversation.attraction.scenicSpot.id = :scenicSpotId " +
           "AND m.role = :role ORDER BY m.createdAt DESC")
    List<Message> findTopByAttractionScenicSpotIdAndRoleOrderByCreatedAtDesc(
            @Param("scenicSpotId") Long scenicSpotId,
            @Param("role") String role,
            Pageable pageable);
}
