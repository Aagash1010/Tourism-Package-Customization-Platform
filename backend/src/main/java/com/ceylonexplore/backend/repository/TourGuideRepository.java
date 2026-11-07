package com.ceylonexplore.backend.repository;

import com.ceylonexplore.backend.entity.TourGuide;
import com.ceylonexplore.backend.entity.TourGuideAvailabilityStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TourGuideRepository extends JpaRepository<TourGuide, Long> {

    Optional<TourGuide> findByEmailIgnoreCase(String email);

    Optional<TourGuide> findByNicNumberIgnoreCase(String nicNumber);

    List<TourGuide> findByFullNameContainingIgnoreCase(String name);

    List<TourGuide> findByAvailabilityStatus(TourGuideAvailabilityStatus availabilityStatus);

    List<TourGuide> findBySpecializationIgnoreCase(String specialization);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCaseAndIdNot(String email, Long id);

    boolean existsByNicNumberIgnoreCase(String nicNumber);

    boolean existsByNicNumberIgnoreCaseAndIdNot(String nicNumber, Long id);

    boolean existsByLicenseNumberIgnoreCase(String licenseNumber);

    boolean existsByLicenseNumberIgnoreCaseAndIdNot(String licenseNumber, Long id);
}
