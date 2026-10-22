package com.ceylonexplore.backend.service;

import com.ceylonexplore.backend.entity.TourPackage;
import com.ceylonexplore.backend.exception.TourPackageNotFoundException;
import com.ceylonexplore.backend.repository.TourPackageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class TourPackageService {

    private final TourPackageRepository tourPackageRepository;

    public TourPackageService(TourPackageRepository tourPackageRepository) {
        this.tourPackageRepository = tourPackageRepository;
    }

    public List<TourPackage> getAllTourPackages() {
        return tourPackageRepository.findAll();
    }

    public TourPackage getTourPackageById(Long id) {
        return tourPackageRepository.findById(id)
                .orElseThrow(() -> new TourPackageNotFoundException(id));
    }

    @Transactional
    public TourPackage createTourPackage(TourPackage tourPackage) {
        String normalizedName = normalizeOptionalText(tourPackage.getName());
        if (tourPackageRepository.existsByNameIgnoreCase(normalizedName)) {
            throw new IllegalArgumentException("A tour package with this name already exists.");
        }

        tourPackage.setName(normalizedName);
        tourPackage.setDescription(normalizeOptionalText(tourPackage.getDescription()));
        tourPackage.setDestination(normalizeOptionalText(tourPackage.getDestination()));
        tourPackage.setDuration(normalizeOptionalText(tourPackage.getDuration()));
        tourPackage.setStatus(normalizeOptionalText(tourPackage.getStatus()));
        tourPackage.setImageUrl(normalizeOptionalText(tourPackage.getImageUrl()));
        return tourPackageRepository.save(tourPackage);
    }

    @Transactional
    public TourPackage updateTourPackage(Long id, TourPackage tourPackage) {
        TourPackage existing = getTourPackageById(id);
        String normalizedName = normalizeOptionalText(tourPackage.getName());
        if (tourPackageRepository.existsByNameIgnoreCaseAndIdNot(normalizedName, id)) {
            throw new IllegalArgumentException("A different tour package with this name already exists.");
        }

        existing.setName(normalizedName);
        existing.setDescription(normalizeOptionalText(tourPackage.getDescription()));
        existing.setDestination(normalizeOptionalText(tourPackage.getDestination()));
        existing.setDuration(normalizeOptionalText(tourPackage.getDuration()));
        existing.setPrice(tourPackage.getPrice());
        existing.setMaxTravelers(tourPackage.getMaxTravelers());
        existing.setStatus(normalizeOptionalText(tourPackage.getStatus()));
        existing.setImageUrl(normalizeOptionalText(tourPackage.getImageUrl()));
        return tourPackageRepository.save(existing);
    }

    @Transactional
    public void deleteTourPackage(Long id) {
        TourPackage tourPackage = getTourPackageById(id);
        tourPackageRepository.delete(tourPackage);
    }

    private String normalizeOptionalText(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
