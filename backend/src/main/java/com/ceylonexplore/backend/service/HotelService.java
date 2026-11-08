package com.ceylonexplore.backend.service;

import com.ceylonexplore.backend.dto.HotelRequest;
import com.ceylonexplore.backend.dto.HotelResponse;
import com.ceylonexplore.backend.entity.Hotel;
import com.ceylonexplore.backend.entity.HotelStatus;
import com.ceylonexplore.backend.entity.HotelType;
import com.ceylonexplore.backend.exception.DuplicateHotelException;
import com.ceylonexplore.backend.exception.HotelInUseException;
import com.ceylonexplore.backend.exception.HotelNotFoundException;
import com.ceylonexplore.backend.repository.HotelRepository;
import com.ceylonexplore.backend.repository.RoomRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@Transactional(readOnly = true)
public class HotelService {

    private final HotelRepository hotelRepository;
    private final RoomRepository roomRepository;

    public HotelService(HotelRepository hotelRepository, RoomRepository roomRepository) {
        this.hotelRepository = hotelRepository;
        this.roomRepository = roomRepository;
    }

    public List<HotelResponse> getHotels(
            String keyword, String city, String country, Integer starRating, HotelType hotelType, HotelStatus status
    ) {
        Stream<Hotel> hotels = hotelRepository.findAll().stream();
        String normalizedKeyword = normalizeOptionalText(keyword);
        String normalizedCity = normalizeOptionalText(city);
        String normalizedCountry = normalizeOptionalText(country);
        if (normalizedKeyword != null) {
            String match = normalizedKeyword.toLowerCase(Locale.ROOT);
            hotels = hotels.filter(hotel -> contains(hotel.getHotelName(), match)
                    || contains(hotel.getCity(), match)
                    || contains(hotel.getCountry(), match)
                    || contains(hotel.getAddress(), match));
        }
        if (normalizedCity != null) {
            hotels = hotels.filter(hotel -> contains(hotel.getCity(), normalizedCity));
        }
        if (normalizedCountry != null) {
            hotels = hotels.filter(hotel -> contains(hotel.getCountry(), normalizedCountry));
        }
        if (starRating != null) {
            hotels = hotels.filter(hotel -> hotel.getStarRating().equals(starRating));
        }
        if (hotelType != null) {
            hotels = hotels.filter(hotel -> hotel.getHotelType() == hotelType);
        }
        if (status != null) {
            hotels = hotels.filter(hotel -> hotel.getStatus() == status);
        }
        return hotels.map(this::toResponse).toList();
    }

    public List<HotelResponse> getActiveHotels(
            String keyword, String city, String country, Integer starRating, HotelType hotelType
    ) {
        return getHotels(keyword, city, country, starRating, hotelType, HotelStatus.ACTIVE);
    }

    public HotelResponse getHotel(Long id) {
        return toResponse(findHotel(id));
    }

    @Transactional
    public HotelResponse createHotel(HotelRequest request) {
        String hotelName = request.hotelName().trim();
        if (hotelRepository.existsByHotelNameIgnoreCase(hotelName)) {
            throw new DuplicateHotelException();
        }
        Hotel hotel = new Hotel();
        applyRequest(hotel, request);
        return toResponse(hotelRepository.save(hotel));
    }

    @Transactional
    public HotelResponse updateHotel(Long id, HotelRequest request) {
        Hotel hotel = findHotel(id);
        String hotelName = request.hotelName().trim();
        if (hotelRepository.existsByHotelNameIgnoreCaseAndIdNot(hotelName, id)) {
            throw new DuplicateHotelException();
        }
        applyRequest(hotel, request);
        return toResponse(hotelRepository.save(hotel));
    }

    @Transactional
    public void deleteHotel(Long id) {
        Hotel hotel = findHotel(id);
        if (roomRepository.existsByHotelId(id)) {
            throw new HotelInUseException();
        }
        hotelRepository.delete(hotel);
    }

    Hotel findHotel(Long id) {
        return hotelRepository.findById(id).orElseThrow(() -> new HotelNotFoundException(id));
    }

    private void applyRequest(Hotel hotel, HotelRequest request) {
        hotel.setHotelName(request.hotelName().trim());
        hotel.setDescription(trimToNull(request.description()));
        hotel.setEmail(request.email().trim().toLowerCase(Locale.ROOT));
        hotel.setPhone(request.phone().trim());
        hotel.setAddress(request.address().trim());
        hotel.setCity(request.city().trim());
        hotel.setDistrict(request.district().trim());
        hotel.setProvince(request.province().trim());
        hotel.setCountry(request.country().trim());
        hotel.setStarRating(request.starRating());
        hotel.setHotelType(request.hotelType());
        hotel.setImageUrl(trimToNull(request.imageUrl()));
        hotel.setFacilities(request.facilities() == null ? Set.of() : request.facilities().stream()
                .map(String::trim).filter(value -> !value.isEmpty()).collect(Collectors.toCollection(java.util.LinkedHashSet::new)));
        hotel.setCheckInTime(request.checkInTime());
        hotel.setCheckOutTime(request.checkOutTime());
        hotel.setWebsite(trimToNull(request.website()));
        hotel.setFeatured(request.featured() != null && request.featured());
        hotel.setStatus(request.status() == null ? HotelStatus.ACTIVE : request.status());
    }

    private HotelResponse toResponse(Hotel hotel) {
        return new HotelResponse(
                hotel.getId(), hotel.getHotelName(), hotel.getDescription(), hotel.getEmail(), hotel.getPhone(),
                hotel.getAddress(), hotel.getCity(), hotel.getDistrict(), hotel.getProvince(), hotel.getCountry(),
                hotel.getStarRating(), hotel.getHotelType(), hotel.getImageUrl(), Set.copyOf(hotel.getFacilities()),
                hotel.getCheckInTime(), hotel.getCheckOutTime(), hotel.getWebsite(), hotel.getFeatured(),
                hotel.getStatus(), roomRepository.countByHotelId(hotel.getId()), hotel.getCreatedAt(), hotel.getUpdatedAt()
        );
    }

    private String normalizeOptionalText(String value) {
        return value == null || value.isBlank() ? null : value.trim().toLowerCase(Locale.ROOT);
    }

    private boolean contains(String value, String normalizedMatch) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(normalizedMatch);
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
