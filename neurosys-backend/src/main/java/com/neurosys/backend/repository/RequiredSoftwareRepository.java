package com.neurosys.backend.repository;

import com.neurosys.backend.entity.RequiredSoftware;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RequiredSoftwareRepository extends JpaRepository<RequiredSoftware, String> {

    List<RequiredSoftware> findByLabName(String labName);

    boolean existsByLabNameAndSoftwareName(String labName, String softwareName);
}
