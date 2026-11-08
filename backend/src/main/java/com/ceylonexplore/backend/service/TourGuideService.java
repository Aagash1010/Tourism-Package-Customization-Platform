package com.ceylonexplore.backend.service;

import com.ceylonexplore.backend.dto.TourGuideRequest;
import com.ceylonexplore.backend.dto.TourGuideResponse;
import com.ceylonexplore.backend.entity.TourGuide;
import com.ceylonexplore.backend.entity.TourGuideAvailabilityStatus;
import com.ceylonexplore.backend.exception.DuplicateTourGuideEmailException;
import com.ceylonexplore.backend.exception.DuplicateTourGuideLicenseException;
import com.ceylonexplore.backend.exception.DuplicateTourGuideNicException;
import com.ceylonexplore.backend.exception.TourGuideNotFoundException;
import com.ceylonexplore.backend.repository.TourGuideRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.TreeMap;

@Service
@Transactional(readOnly = true)
public class TourGuideService {

    private final TourGuideRepository tourGuideRepository;

    public TourGuideService(TourGuideRepository tourGuideRepository) {
        this.tourGuideRepository = tourGuideRepository;
    }

    public List<TourGuideResponse> getAllTourGuides() {
        return toResponses(tourGuideRepository.findAll());
    }

    public TourGuideResponse getTourGuideById(Long id) {
        return toResponse(findTourGuide(id));
    }

    public List<TourGuideResponse> searchTourGuidesByName(String name) {
        String normalizedName = normalizeOptionalText(name);
        return normalizedName == null
                ? getAllTourGuides()
                : toResponses(tourGuideRepository.findByFullNameContainingIgnoreCase(normalizedName));
    }

    public List<TourGuideResponse> getTourGuidesByAvailability(TourGuideAvailabilityStatus status) {
        return toResponses(tourGuideRepository.findByAvailabilityStatus(status));
    }

    public List<TourGuideResponse> getTourGuidesBySpecialization(String specialization) {
        String normalizedSpecialization = normalizeOptionalText(specialization);
        return normalizedSpecialization == null
                ? List.of()
                : toResponses(tourGuideRepository.findBySpecializationIgnoreCase(normalizedSpecialization));
    }

    public List<TourGuideResponse> getAvailableTourGuides() {
        return getTourGuidesByAvailability(TourGuideAvailabilityStatus.AVAILABLE);
    }

    @Transactional
    public TourGuideResponse createTourGuide(TourGuideRequest request) {
        String email = normalizeEmail(request.email());
        String nicNumber = normalizeNicNumber(request.nicNumber());
        String licenseNumber = normalizeLicenseNumber(request.licenseNumber());
        ensureEmailAvailable(email);
        ensureNicAvailable(nicNumber);
        ensureLicenseAvailable(licenseNumber);

        TourGuide tourGuide = new TourGuide();
        applyRequest(tourGuide, request);
        tourGuide.setEmail(email);
        tourGuide.setNicNumber(nicNumber);
        tourGuide.setLicenseNumber(licenseNumber);
        tourGuide.setAvailabilityStatus(
                request.availabilityStatus() == null
                        ? TourGuideAvailabilityStatus.AVAILABLE
                        : request.availabilityStatus()
        );
        tourGuide.setEmploymentStatus(normalizeEmploymentStatus(request.employmentStatus()));
        return toResponse(tourGuideRepository.save(tourGuide));
    }

    @Transactional
    public TourGuideResponse updateTourGuide(Long id, TourGuideRequest request) {
        TourGuide existing = findTourGuide(id);
        String email = normalizeEmail(request.email());
        String nicNumber = normalizeNicNumber(request.nicNumber());
        String licenseNumber = normalizeLicenseNumber(request.licenseNumber());
        if (tourGuideRepository.existsByEmailIgnoreCaseAndIdNot(email, id)) {
            throw new DuplicateTourGuideEmailException();
        }
        if (tourGuideRepository.existsByNicNumberIgnoreCaseAndIdNot(nicNumber, id)) {
            throw new DuplicateTourGuideNicException();
        }
        if (tourGuideRepository.existsByLicenseNumberIgnoreCaseAndIdNot(licenseNumber, id)) {
            throw new DuplicateTourGuideLicenseException();
        }

        applyRequest(existing, request);
        existing.setEmail(email);
        existing.setNicNumber(nicNumber);
        existing.setLicenseNumber(licenseNumber);
        if (request.availabilityStatus() != null) {
            existing.setAvailabilityStatus(request.availabilityStatus());
        }
        existing.setEmploymentStatus(normalizeEmploymentStatus(request.employmentStatus()));
        return toResponse(tourGuideRepository.save(existing));
    }

    @Transactional
    public void deleteTourGuide(Long id) {
        tourGuideRepository.delete(findTourGuide(id));
    }

    private TourGuide findTourGuide(Long id) {
        return tourGuideRepository.findById(id)
                .orElseThrow(() -> new TourGuideNotFoundException(id));
    }

    private void ensureEmailAvailable(String email) {
        if (tourGuideRepository.existsByEmailIgnoreCase(email)) {
            throw new DuplicateTourGuideEmailException();
        }
    }

    private void ensureNicAvailable(String nicNumber) {
        if (tourGuideRepository.existsByNicNumberIgnoreCase(nicNumber)) {
            throw new DuplicateTourGuideNicException();
        }
    }

    private void ensureLicenseAvailable(String licenseNumber) {
        if (tourGuideRepository.existsByLicenseNumberIgnoreCase(licenseNumber)) {
            throw new DuplicateTourGuideLicenseException();
        }
    }

    private void applyRequest(TourGuide tourGuide, TourGuideRequest request) {
        tourGuide.setFullName(request.fullName().trim());
        tourGuide.setPhoneNumber(request.phoneNumber().trim());
        tourGuide.setAddress(request.address().trim());
        tourGuide.setCity(request.city().trim());
        tourGuide.setDistrict(request.district().trim());
        tourGuide.setNationality(request.nationality().trim());
        tourGuide.setGender(request.gender().trim());
        tourGuide.setDateOfBirth(request.dateOfBirth());
        tourGuide.setLanguages(normalizeLanguages(request.languages()));
        tourGuide.setWorkingDays(normalizeLanguages(request.workingDays()));
        tourGuide.setPreferredTourTypes(normalizeLanguages(request.preferredTourTypes()));
        tourGuide.setSpecialization(request.specialization().trim());
        tourGuide.setQualification(request.qualification().trim());
        tourGuide.setExperienceYears(request.experienceYears());
        tourGuide.setDailyRate(request.dailyRate());
        tourGuide.setProfileImage(normalizeOptionalText(request.profileImage()));
        tourGuide.setCertifications(normalizeOptionalText(request.certifications()));
        tourGuide.setMaxGroupSize(request.maxGroupSize());
        tourGuide.setRating(request.rating());
        tourGuide.setDescription(normalizeOptionalText(request.description()));
    }

    private LinkedHashSet<String> normalizeLanguages(List<String> languages) {
        TreeMap<String, String> uniqueLanguages = new TreeMap<>(String.CASE_INSENSITIVE_ORDER);
        for (String language : languages) {
            String normalizedLanguage = language.trim();
            uniqueLanguages.putIfAbsent(normalizedLanguage, normalizedLanguage);
        }
        return new LinkedHashSet<>(uniqueLanguages.values());
    }

    private List<TourGuideResponse> toResponses(List<TourGuide> tourGuides) {
        return tourGuides.stream()
                .map(this::toResponse)
                .toList();
    }

    private TourGuideResponse toResponse(TourGuide tourGuide) {
        List<String> languages = tourGuide.getLanguages().stream()
                .sorted(Comparator.comparing(language -> language.toLowerCase(Locale.ROOT)))
                .toList();
        return new TourGuideResponse(
                tourGuide.getId(),
                tourGuide.getFullName(),
                tourGuide.getEmail(),
                tourGuide.getPhoneNumber(),
                tourGuide.getAddress(),
                tourGuide.getCity(),
                tourGuide.getDistrict(),
                tourGuide.getNationality(),
                tourGuide.getNicNumber(),
                tourGuide.getGender(),
                tourGuide.getDateOfBirth(),
                tourGuide.getLicenseNumber(),
                tourGuide.getQualification(),
                languages,
                sorted(tourGuide.getWorkingDays()),
                sorted(tourGuide.getPreferredTourTypes()),
                tourGuide.getSpecialization(),
                tourGuide.getExperienceYears(),
                tourGuide.getDailyRate(),
                tourGuide.getProfileImage(),
                tourGuide.getAvailabilityStatus(),
                tourGuide.getEmploymentStatus(),
                tourGuide.getMaxGroupSize(),
                tourGuide.getRating(),
                tourGuide.getCertifications(),
                tourGuide.getDescription(),
                tourGuide.getCreatedAt(),
                tourGuide.getUpdatedAt()
        );
    }

    private List<String> sorted(java.util.Set<String> values) {
        return values.stream()
                .sorted(String.CASE_INSENSITIVE_ORDER)
                .toList();
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeNicNumber(String nicNumber) {
        return nicNumber.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeLicenseNumber(String licenseNumber) {
        return licenseNumber.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeEmploymentStatus(String employmentStatus) {
        return employmentStatus == null || employmentStatus.isBlank()
                ? "Active"
                : employmentStatus.trim();
    }

    private String normalizeOptionalText(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
