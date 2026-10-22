package com.ceylonexplore.backend.service;

import com.ceylonexplore.backend.entity.Destination;
import com.ceylonexplore.backend.exception.DuplicateDestinationException;
import com.ceylonexplore.backend.exception.DestinationInUseException;
import com.ceylonexplore.backend.exception.DestinationNotFoundException;
import com.ceylonexplore.backend.repository.DestinationRepository;
import com.ceylonexplore.backend.repository.TourPackageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class DestinationService {

    private final DestinationRepository destinationRepository;
    private final TourPackageRepository tourPackageRepository;

    public DestinationService(
            DestinationRepository destinationRepository,
            TourPackageRepository tourPackageRepository
    ) {
        this.destinationRepository = destinationRepository;
        this.tourPackageRepository = tourPackageRepository;
    }

    public List<Destination> getAllDestinations() {
        return destinationRepository.findAll();
    }

    public List<Destination> searchDestinations(String keyword) {
        String normalizedKeyword = keyword == null ? "" : keyword.trim();
        return normalizedKeyword.isEmpty()
                ? getAllDestinations()
                : destinationRepository.search(normalizedKeyword);
    }

    public List<Destination> getDestinationsByCategory(String category) {
        return destinationRepository.findByCategoryIgnoreCase(category.trim());
    }

    public List<Destination> getActiveDestinations() {
        return destinationRepository.findByStatusIgnoreCase("Active");
    }

    public Destination getDestinationById(Long id) {
        return destinationRepository.findById(id)
                .orElseThrow(() -> new DestinationNotFoundException(id));
    }

    @Transactional
    public Destination createDestination(Destination destination) {
        String normalizedName = destination.getName().trim();
        if (destinationRepository.existsByNameIgnoreCase(normalizedName)) {
            throw new DuplicateDestinationException("A destination with this name already exists.");
        }
        destination.setName(normalizedName);
        destination.setDistrict(destination.getDistrict().trim());
        destination.setProvince(destination.getProvince().trim());
        destination.setCategory(destination.getCategory().trim());
        destination.setShortDescription(destination.getShortDescription().trim());
        destination.setFullDescription(normalizeOptionalText(destination.getFullDescription()));
        destination.setBestTime(destination.getBestTime().trim());
        destination.setDuration(destination.getDuration().trim());
        destination.setOpeningHours(normalizeOptionalText(destination.getOpeningHours()));
        destination.setAddress(destination.getAddress().trim());
        destination.setImageUrl(normalizeOptionalText(destination.getImageUrl()));
        destination.setStatus(destination.getStatus().trim());
        return destinationRepository.save(destination);
    }

    @Transactional
    public Destination updateDestination(Long id, Destination destination) {
        Destination existing = getDestinationById(id);
        String normalizedName = destination.getName().trim();
        if (destinationRepository.existsByNameIgnoreCaseAndIdNot(normalizedName, id)) {
            throw new DuplicateDestinationException("A different destination with this name already exists.");
        }
        if (!existing.getName().equalsIgnoreCase(normalizedName)
                && tourPackageRepository.existsByDestinationIgnoreCase(existing.getName())) {
            throw new DestinationInUseException(
                    "This destination cannot be renamed because a tour package references it."
            );
        }
        existing.setName(normalizedName);
        existing.setDistrict(destination.getDistrict().trim());
        existing.setProvince(destination.getProvince().trim());
        existing.setCategory(destination.getCategory().trim());
        existing.setShortDescription(destination.getShortDescription().trim());
        existing.setFullDescription(normalizeOptionalText(destination.getFullDescription()));
        existing.setEntryFee(destination.getEntryFee());
        existing.setBestTime(destination.getBestTime().trim());
        existing.setDuration(destination.getDuration().trim());
        existing.setOpeningHours(normalizeOptionalText(destination.getOpeningHours()));
        existing.setAddress(destination.getAddress().trim());
        existing.setLatitude(destination.getLatitude());
        existing.setLongitude(destination.getLongitude());
        existing.setFeatured(destination.getFeatured());
        existing.setStatus(destination.getStatus().trim());
        existing.setImageUrl(normalizeOptionalText(destination.getImageUrl()));
        return destinationRepository.save(existing);
    }

    @Transactional
    public void deleteDestination(Long id) {
        Destination destination = getDestinationById(id);
        if (tourPackageRepository.existsByDestinationIgnoreCase(destination.getName())) {
            throw new DestinationInUseException(
                    "This destination cannot be deleted because a tour package references it."
            );
        }
        destinationRepository.delete(destination);
    }

    private String normalizeOptionalText(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
