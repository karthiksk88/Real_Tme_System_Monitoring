package com.neurosys.backend.service;

import com.neurosys.backend.dto.request.AgentRegistrationRequest;
import com.neurosys.backend.dto.response.AgentRegistrationResponse;

public interface AgentRegistrationService {
    AgentRegistrationResponse registerAgent(AgentRegistrationRequest request);
}
