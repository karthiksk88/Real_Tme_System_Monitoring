package com.neurosys.backend.repository;

import com.neurosys.backend.entity.RemotePowerAudit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RemotePowerAuditRepository extends JpaRepository<RemotePowerAudit, String> {

    List<RemotePowerAudit> findByComputerIdOrderByTimestampDesc(String computerId);

    List<RemotePowerAudit> findAllByOrderByTimestampDesc();
}
