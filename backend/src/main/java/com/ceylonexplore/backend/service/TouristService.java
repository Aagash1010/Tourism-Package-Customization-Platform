package com.ceylonexplore.backend.service;

import com.ceylonexplore.backend.dto.TouristRequest;
import com.ceylonexplore.backend.dto.TouristResponse;
import com.ceylonexplore.backend.entity.TouristStatus;
import com.ceylonexplore.backend.entity.Tourist;
import com.ceylonexplore.backend.exception.DuplicateTouristEmailException;
import com.ceylonexplore.backend.exception.TouristInUseException;
import com.ceylonexplore.backend.exception.TouristNotFoundException;
import com.ceylonexplore.backend.repository.BookingRepository;
import com.ceylonexplore.backend.repository.TouristRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
@Transactional(readOnly = true)
public class TouristService {

    private final TouristRepository touristRepository;
    private final BookingRepository bookingRepository;

    public TouristService(TouristRepository touristRepository, BookingRepository bookingRepository) {
        this.touristRepository = touristRepository;
        this.bookingRepository = bookingRepository;
    }

    public List<TouristResponse> getAllTourists() {
        return touristRepository.findAll().stream().map(TouristResponse::from).toList();
    }

    public TouristResponse getTouristById(Long id) {
        return touristRepository.findById(id)
                .map(TouristResponse::from)
                .orElseThrow(() -> new TouristNotFoundException(id));
    }

    @Transactional
    public TouristResponse createTourist(TouristRequest request) {
        String email = normalizeEmail(request.email());
        if (touristRepository.existsByEmailIgnoreCase(email)) {
            throw new DuplicateTouristEmailException();
        }

        Tourist tourist = new Tourist();
        applyRequest(tourist, request, true);
        tourist.setEmail(email);
        return TouristResponse.from(touristRepository.save(tourist));
    }

    @Transactional
    public TouristResponse updateTourist(Long id, TouristRequest request) {
        Tourist existingTourist = findTourist(id);
        String email = normalizeEmail(request.email());
        if (touristRepository.existsByEmailIgnoreCaseAndIdNot(email, id)) {
            throw new DuplicateTouristEmailException();
        }

        applyRequest(existingTourist, request, false);
        existingTourist.setEmail(email);
        return TouristResponse.from(touristRepository.save(existingTourist));
    }

    @Transactional
    public void deleteTourist(Long id) {
        Tourist tourist = findTourist(id);
        if (bookingRepository.existsByTouristId(id)) {
            throw new TouristInUseException(id);
        }
        touristRepository.delete(tourist);
    }

    public List<TouristResponse> searchTourists(String keyword) {
        String normalized = keyword == null ? "" : keyword.trim();
        List<Tourist> tourists = normalized.isEmpty()
                ? touristRepository.findAll()
                : touristRepository.searchByKeyword(normalized);
        return tourists.stream().map(TouristResponse::from).toList();
    }

    public List<TouristResponse> getTouristsByCountry(String country) {
        return touristRepository.findByCountryIgnoreCase(country.trim()).stream()
                .map(TouristResponse::from)
                .toList();
    }

    public List<TouristResponse> getTouristsByStatus(TouristStatus status) {
        return touristRepository.findByStatus(status).stream()
                .map(TouristResponse::from)
                .toList();
    }

    private Tourist findTourist(Long id) {
        return touristRepository.findById(id)
                .orElseThrow(() -> new TouristNotFoundException(id));
    }

    private void applyRequest(Tourist tourist, TouristRequest request, boolean creating) {
        tourist.setFullName(request.fullName().trim());
        tourist.setPhone(normalizeOptionalText(request.phone()));
        tourist.setCountry(request.country().trim());
        tourist.setAddress(normalizeOptionalText(request.address()));
        tourist.setDateOfBirth(request.dateOfBirth());
        tourist.setGender(normalizeOptionalText(request.gender()));
        tourist.setProfileImage(normalizeOptionalText(request.profileImage()));
        if (creating) {
            tourist.setStatus(request.status() == null ? TouristStatus.ACTIVE : request.status());
        } else if (request.status() != null) {
            tourist.setStatus(request.status());
        }
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeOptionalText(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
