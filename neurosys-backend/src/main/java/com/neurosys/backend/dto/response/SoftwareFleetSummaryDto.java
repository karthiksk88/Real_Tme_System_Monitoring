package com.neurosys.backend.dto.response;

import com.neurosys.backend.entity.Computer;
import com.neurosys.backend.entity.SoftwareInventory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SoftwareFleetSummaryDto {
    private int totalComputers;
    private long totalScannedRecords;
    private int totalDistinctSoftware;
    private String lastScannedAt;
    private List<Computer> computers;
    private List<SoftwareInventory> softwareList;
}
