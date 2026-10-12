package com.ceylonexplore.backend.service;

import com.ceylonexplore.backend.entity.Tourist;
import com.ceylonexplore.backend.exception.DuplicateTouristEmailException;
import com.ceylonexplore.backend.exception.TouristNotFoundException;
import com.ceylonexplore.backend.repository.TouristRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class TouristService {

    private final TouristRepository touristRepository;

    public TouristService(TouristRepository touristRepository) {
        this.touristRepository = touristRepository;
    }

    public List<Tourist> getAllTourists() {
        return touristRepository.findAll();
    }

    public Tourist getTouristById(Long id) {
        return touristRepository.findById(id)
                .orElseThrow(() -> new TouristNotFoundException(id));
    }

    @Transactional
    public Tourist createTourist(Tourist tourist) {
        String email = normalizeEmail(tourist.getEmail());
        if (touristRepository.existsByEmailIgnoreCase(email)) {
            throw new DuplicateTouristEmailException();
        }

        tourist.setId(null);
        tourist.setEmail(email);
        tourist.setFullName(tourist.getFullName().trim());
        tourist.setPhone(normalizeOptionalText(tourist.getPhone()));
        tourist.setCountry(normalizeOptionalText(tourist.getCountry()));

        return touristRepository.save(tourist);
    }

    @Transactional
    public Tourist updateTourist(Long id, Tourist tourist) {
        Tourist existingTourist = getTouristById(id);
        String email = normalizeEmail(tourist.getEmail());
        if (touristRepository.existsByEmailIgnoreCaseAndIdNot(email, id)) {
            throw new DuplicateTouristEmailException();
        }

        existingTourist.setFullName(tourist.getFullName().trim());
        existingTourist.setEmail(email);
        existingTourist.setPhone(normalizeOptionalText(tourist.getPhone()));
        existingTourist.setCountry(normalizeOptionalText(tourist.getCountry()));

        return touristRepository.save(existingTourist);
    }

    @Transactional
    public void deleteTourist(Long id) {
        Tourist tourist = getTouristById(id);
        touristRepository.delete(tourist);
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(java.util.Locale.ROOT);
    }

    private String normalizeOptionalText(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
