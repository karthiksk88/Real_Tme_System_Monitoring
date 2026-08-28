package com.neurosys.backend.repository;

import com.neurosys.backend.entity.SoftwareInventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface SoftwareInventoryRepository extends JpaRepository<SoftwareInventory, String> {

    @Query("SELECT s FROM SoftwareInventory s WHERE s.computer.id = :computerId")
    List<SoftwareInventory> findByComputerId(@Param("computerId") String computerId);

    @Modifying
    @Transactional
    @Query("DELETE FROM SoftwareInventory s WHERE s.computer.id = :computerId")
    void deleteByComputerId(@Param("computerId") String computerId);

    @Query("SELECT s FROM SoftwareInventory s WHERE LOWER(s.name) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<SoftwareInventory> searchByName(@Param("query") String query);

    @Query("SELECT s FROM SoftwareInventory s JOIN s.computer c WHERE LOWER(s.name) LIKE LOWER(CONCAT('%', :query, '%')) AND c.deleted = false")
    List<SoftwareInventory> searchActiveByName(@Param("query") String query);

    @Query("SELECT DISTINCT s.name FROM SoftwareInventory s")
    List<String> findDistinctSoftwareNames();

    @Query("SELECT MAX(s.lastScannedAt) FROM SoftwareInventory s")
    java.util.Optional<java.time.Instant> findLatestScanTime();
}
