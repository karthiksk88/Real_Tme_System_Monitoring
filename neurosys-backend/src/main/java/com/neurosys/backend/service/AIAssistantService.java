package com.neurosys.backend.service;

import com.neurosys.backend.dto.request.ChatMessageRequest;
import com.neurosys.backend.dto.response.ChatMessageResponse;

public interface AIAssistantService {
    ChatMessageResponse processUserQuery(ChatMessageRequest request);
}
