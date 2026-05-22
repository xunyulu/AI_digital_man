package com.example.demo.repository;

import com.example.demo.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    List<Conversation> findByTouristIdOrderByUpdatedAtDesc(Long touristId);

    Page<Conversation> findAllByOrderByUpdatedAtDesc(Pageable pageable);

    long countByStatus(String status);
}
