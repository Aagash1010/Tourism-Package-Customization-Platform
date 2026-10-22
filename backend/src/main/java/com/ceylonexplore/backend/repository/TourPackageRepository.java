package com.ceylonexplore.backend.repository;

import com.ceylonexplore.backend.entity.TourPackage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TourPackageRepository extends JpaRepository<TourPackage, Long> {

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
}
