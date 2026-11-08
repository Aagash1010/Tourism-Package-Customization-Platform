package com.ceylonexplore.backend.service;

import com.ceylonexplore.backend.dto.PackageItineraryRequest;
import com.ceylonexplore.backend.dto.PackageItineraryResponse;
import com.ceylonexplore.backend.dto.TourPackageRequest;
import com.ceylonexplore.backend.dto.TourPackageResponse;
import com.ceylonexplore.backend.entity.Destination;
import com.ceylonexplore.backend.entity.PackageItinerary;
import com.ceylonexplore.backend.entity.TourPackage;
import com.ceylonexplore.backend.exception.BookingConflictException;
import com.ceylonexplore.backend.exception.DestinationNotFoundException;
import com.ceylonexplore.backend.exception.DuplicateTourPackageException;
import com.ceylonexplore.backend.exception.TourPackageNotFoundException;
import com.ceylonexplore.backend.repository.BookingRepository;
import com.ceylonexplore.backend.repository.DestinationRepository;
import com.ceylonexplore.backend.repository.TourPackageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Transactional(readOnly = true)
public class TourPackageService {

    private static final Pattern DURATION_PATTERN =
            Pattern.compile("(\\d+)\\s*days?(?:\\s*[/,]\\s*(\\d+)\\s*nights?)?", Pattern.CASE_INSENSITIVE);

    private final TourPackageRepository tourPackageRepository;
    private final DestinationRepository destinationRepository;
    private final BookingRepository bookingRepository;

    public TourPackageService(
            TourPackageRepository tourPackageRepository,
            DestinationRepository destinationRepository,
            BookingRepository bookingRepository
    ) {
        this.tourPackageRepository = tourPackageRepository;
        this.destinationRepository = destinationRepository;
        this.bookingRepository = bookingRepository;
    }

    public List<TourPackageResponse> getTourPackages(
            String keyword,
            Long destinationId,
            String category,
            String status,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Integer minDuration,
            Integer maxDuration
    ) {
        validateRanges(minPrice, maxPrice, minDuration, maxDuration);
        return tourPackageRepository.search(
                        normalizeOptionalText(keyword), destinationId, normalizeOptionalText(category),
                        normalizeOptionalText(status), minPrice, maxPrice, minDuration, maxDuration
                ).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<TourPackageResponse> getActiveTourPackages() {
        return tourPackageRepository.findByStatusIgnoreCase("Active").stream().map(this::toResponse).toList();
    }

    public List<TourPackageResponse> getTourPackagesByDestination(Long destinationId) {
        if (!destinationRepository.existsById(destinationId)) {
            throw new DestinationNotFoundException(destinationId);
        }
        return tourPackageRepository.search(null, destinationId, null, null, null, null, null, null)
                .stream().map(this::toResponse).toList();
    }

    public List<TourPackageResponse> getTourPackagesByCategory(String category) {
        return tourPackageRepository.search(null, null, category, null, null, null, null, null)
                .stream().map(this::toResponse).toList();
    }

    public List<TourPackageResponse> getAllTourPackages() {
        return tourPackageRepository.findAll().stream().map(this::toResponse).toList();
    }

    public TourPackageResponse getTourPackageById(Long id) {
        return toResponse(findTourPackage(id));
    }

    @Transactional
    public TourPackageResponse createTourPackage(TourPackageRequest request) {
        String normalizedName = request.name().trim();
        if (tourPackageRepository.existsByNameIgnoreCase(normalizedName)) {
            throw new DuplicateTourPackageException();
        }
        TourPackage tourPackage = new TourPackage();
        applyRequest(tourPackage, request);
        return toResponse(tourPackageRepository.save(tourPackage));
    }

    @Transactional
    public TourPackageResponse updateTourPackage(Long id, TourPackageRequest request) {
        TourPackage existing = findTourPackage(id);
        String normalizedName = request.name().trim();
        if (tourPackageRepository.existsByNameIgnoreCaseAndIdNot(normalizedName, id)) {
            throw new DuplicateTourPackageException();
        }
        applyRequest(existing, request);
        return toResponse(tourPackageRepository.save(existing));
    }

    @Transactional
    public void deleteTourPackage(Long id) {
        TourPackage tourPackage = findTourPackage(id);
        if (bookingRepository.existsByTourPackageId(id)) {
            throw new BookingConflictException("This package has existing bookings and cannot be deleted. Deactivate it instead.");
        }
        tourPackageRepository.delete(tourPackage);
    }

    private TourPackage findTourPackage(Long id) {
        return tourPackageRepository.findById(id)
                .orElseThrow(() -> new TourPackageNotFoundException(id));
    }

    private void applyRequest(TourPackage tourPackage, TourPackageRequest request) {
        LocalDate startDate = request.startDate();
        LocalDate endDate = request.endDate();
        if (startDate != null && endDate != null && startDate.isAfter(endDate)) {
            throw new IllegalArgumentException("Package start date cannot be after its end date.");
        }

        int durationDays = request.durationDays() == null
                ? parseDuration(request.duration()).days() : request.durationDays();
        int durationNights = request.durationNights() == null
                ? parseDuration(request.duration()).nights() : request.durationNights();
        int minTravelers = request.minTravelers() == null ? 1 : request.minTravelers();
        if (durationDays <= 0 || durationNights < 0) {
            throw new IllegalArgumentException("Package duration must have positive days and zero or more nights.");
        }
        if (minTravelers > request.maxTravelers()) {
            throw new IllegalArgumentException("Minimum travelers cannot exceed maximum travelers.");
        }

        Destination destination = request.destinationId() == null
                ? destinationRepository.findFirstByNameIgnoreCase(request.destination().trim()).orElse(null)
                : destinationRepository.findById(request.destinationId())
                        .orElseThrow(() -> new DestinationNotFoundException(request.destinationId()));

        tourPackage.setName(request.name().trim());
        tourPackage.setDescription(trimToNull(request.description()));
        tourPackage.setFullDescription(trimToNull(request.fullDescription()));
        tourPackage.setDestination(destination == null ? request.destination().trim() : destination.getName());
        tourPackage.setDestinationEntity(destination);
        tourPackage.setDuration(request.duration().trim());
        tourPackage.setDurationDays(durationDays);
        tourPackage.setDurationNights(durationNights);
        tourPackage.setPrice(request.price());
        tourPackage.setMaxTravelers(request.maxTravelers());
        tourPackage.setMinTravelers(minTravelers);
        tourPackage.setCategory(trimToNull(request.category()));
        tourPackage.setDifficultyLevel(trimToNull(request.difficultyLevel()));
        tourPackage.setImageUrl(trimToNull(request.imageUrl()));
        tourPackage.setInclusions(trimToNull(request.inclusions()));
        tourPackage.setExclusions(trimToNull(request.exclusions()));
        tourPackage.setStartDate(startDate);
        tourPackage.setEndDate(endDate);
        tourPackage.setStatus(request.status().trim());
        tourPackage.setFeatured(Boolean.TRUE.equals(request.featured()));
        tourPackage.setAccommodation(trimToNull(request.accommodation()));
        tourPackage.setMeals(trimToNull(request.meals()));
        tourPackage.setTransportation(trimToNull(request.transportation()));

        if (request.itinerary() != null) {
            validateItinerary(request.itinerary(), durationDays);
            List<PackageItinerary> entries = new ArrayList<>();
            for (PackageItineraryRequest item : request.itinerary()) {
                PackageItinerary entry = new PackageItinerary();
                entry.setTourPackage(tourPackage);
                entry.setDayNumber(item.dayNumber());
                entry.setTitle(item.title().trim());
                entry.setDescription(trimToNull(item.description()));
                entry.setAccommodation(trimToNull(item.accommodation()));
                entry.setMeals(trimToNull(item.meals()));
                entries.add(entry);
            }
            tourPackage.getItinerary().clear();
            tourPackage.getItinerary().addAll(entries);
        }
    }

    private void validateItinerary(List<PackageItineraryRequest> itinerary, int durationDays) {
        Set<Integer> dayNumbers = new HashSet<>();
        for (PackageItineraryRequest item : itinerary) {
            if (item.dayNumber() > durationDays) {
                throw new IllegalArgumentException("Itinerary day numbers must not exceed the package duration.");
            }
            if (!dayNumbers.add(item.dayNumber())) {
                throw new IllegalArgumentException("Itinerary day numbers must be unique within a package.");
            }
        }
    }

    private TourPackageResponse toResponse(TourPackage tourPackage) {
        List<PackageItineraryResponse> itinerary = tourPackage.getItinerary().stream()
                .sorted(java.util.Comparator.comparing(PackageItinerary::getDayNumber))
                .map(item -> new PackageItineraryResponse(
                        item.getDayNumber(), item.getTitle(), item.getDescription(),
                        item.getAccommodation(), item.getMeals()
                )).toList();
        int days = tourPackage.getDurationDays() == null
                ? parseDuration(tourPackage.getDuration()).days() : tourPackage.getDurationDays();
        int nights = tourPackage.getDurationNights() == null
                ? parseDuration(tourPackage.getDuration()).nights() : tourPackage.getDurationNights();
        String destinationName = tourPackage.getDestinationEntity() == null
                ? tourPackage.getDestination() : tourPackage.getDestinationEntity().getName();
        return new TourPackageResponse(
                tourPackage.getId(), tourPackage.getName(), destinationName,
                tourPackage.getDestinationEntity() == null ? null : tourPackage.getDestinationEntity().getId(),
                tourPackage.getDescription(), tourPackage.getFullDescription(), tourPackage.getDuration(),
                days, nights, tourPackage.getPrice(), tourPackage.getMaxTravelers(),
                tourPackage.getMinTravelers() == null ? 1 : tourPackage.getMinTravelers(),
                tourPackage.getCategory(), tourPackage.getDifficultyLevel(), tourPackage.getImageUrl(),
                tourPackage.getInclusions(), tourPackage.getExclusions(), tourPackage.getStartDate(),
                tourPackage.getEndDate(), tourPackage.getStatus(), Boolean.TRUE.equals(tourPackage.getFeatured()),
                tourPackage.getAccommodation(), tourPackage.getMeals(), tourPackage.getTransportation(),
                itinerary, tourPackage.getCreatedAt(), tourPackage.getUpdatedAt()
        );
    }

    private Duration parseDuration(String duration) {
        Matcher matcher = DURATION_PATTERN.matcher(duration == null ? "" : duration);
        if (matcher.find()) {
            int days = Integer.parseInt(matcher.group(1));
            int nights = matcher.group(2) == null ? Math.max(0, days - 1) : Integer.parseInt(matcher.group(2));
            return new Duration(days, nights);
        }
        Matcher daysOnly = Pattern.compile("(\\d+)").matcher(duration == null ? "" : duration);
        if (daysOnly.find()) {
            int days = Integer.parseInt(daysOnly.group(1));
            return new Duration(days, Math.max(0, days - 1));
        }
        throw new IllegalArgumentException("Duration must include a positive number of days.");
    }

    private void validateRanges(BigDecimal minPrice, BigDecimal maxPrice, Integer minDuration, Integer maxDuration) {
        if (minPrice != null && maxPrice != null && minPrice.compareTo(maxPrice) > 0) {
            throw new IllegalArgumentException("Minimum price cannot exceed maximum price.");
        }
        if (minDuration != null && maxDuration != null && minDuration > maxDuration) {
            throw new IllegalArgumentException("Minimum duration cannot exceed maximum duration.");
        }
    }

    private String normalizeOptionalText(String value) {
        return value == null || value.isBlank() ? null : value.trim().toLowerCase(Locale.ROOT);
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private record Duration(int days, int nights) {
    }
}
