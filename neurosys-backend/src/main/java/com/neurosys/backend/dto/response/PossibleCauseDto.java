package com.neurosys.backend.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PossibleCauseDto {
    private String cause;
    private int probabilityPercent;
}
