package com.ucocs.worksphere.dto.hr;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PayrollBatchResponse {
    private List<PayrollRecordResponse> records = new ArrayList<>();
    private List<String> errors = new ArrayList<>();
}
