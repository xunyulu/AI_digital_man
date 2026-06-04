package com.example.demo.repository;

import com.example.demo.entity.TokenEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

public interface TokenRepository extends JpaRepository<TokenEntity, String> {

    @Modifying
    @Transactional
    @Query("DELETE FROM TokenEntity t WHERE t.expireTime < :now")
    int deleteExpired(LocalDateTime now);

    @Modifying
    @Transactional
    void deleteByUsername(String username);
}
