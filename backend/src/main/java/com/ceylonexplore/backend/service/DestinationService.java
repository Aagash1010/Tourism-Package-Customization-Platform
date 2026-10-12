package com.ceylonexplore.backend.service;

import com.ceylonexplore.backend.entity.Destination;
import com.ceylonexplore.backend.exception.DestinationNotFoundException;
import com.ceylonexplore.backend.repository.DestinationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class DestinationService {

    private final DestinationRepository destinationRepository;

    public DestinationService(DestinationRepository destinationRepository) {
        this.destinationRepository = destinationRepository;
    }

    public List<Destination> getAllDestinations() {
        return destinationRepository.findAll();
    }

    public Destination getDestinationById(Long id) {
        return destinationRepository.findById(id)
                .orElseThrow(() -> new DestinationNotFoundException(id));
    }

    @Transactional
    public Destination createDestination(Destination destination) {
        destination.setName(destination.getName().trim());
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
        existing.setName(destination.getName().trim());
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
        destinationRepository.delete(destination);
    }

    private String normalizeOptionalText(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
