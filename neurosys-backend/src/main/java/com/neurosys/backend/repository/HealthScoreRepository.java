package com.neurosys.backend.repository;

import com.neurosys.backend.entity.HealthScore;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HealthScoreRepository extends JpaRepository<HealthScore, String> {
    List<HealthScore> findByComputerIdOrderByCalculatedAtDesc(String computerId, Pageable pageable);

    @Query("SELECT hs FROM HealthScore hs WHERE hs.computer.id = :computerId ORDER BY hs.calculatedAt DESC LIMIT 1")
    Optional<HealthScore> findLatestByComputerId(@Param("computerId") String computerId);
}
