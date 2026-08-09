package com.neurosys.backend.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SoftwareItemDto {
    private String name;
    private String version;
    private String publisher;
    private String installDate;
}
