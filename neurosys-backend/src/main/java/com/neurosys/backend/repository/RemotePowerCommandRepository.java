package com.neurosys.backend.repository;

import com.neurosys.backend.entity.RemotePowerCommand;
import com.neurosys.backend.enums.PowerCommandStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RemotePowerCommandRepository extends JpaRepository<RemotePowerCommand, String> {

    Optional<RemotePowerCommand> findFirstByComputerAgentIdAndStatusOrderByCreatedAtAsc(String agentId, PowerCommandStatus status);

    Optional<RemotePowerCommand> findFirstByComputerIdAndStatusInOrderByCreatedAtDesc(String computerId, List<PowerCommandStatus> statuses);

    List<RemotePowerCommand> findByComputerIdOrderByCreatedAtDesc(String computerId);
}
