package com.ceylonexplore.backend.service;

import com.ceylonexplore.backend.dto.RoomRequest;
import com.ceylonexplore.backend.dto.RoomResponse;
import com.ceylonexplore.backend.entity.Hotel;
import com.ceylonexplore.backend.entity.HotelStatus;
import com.ceylonexplore.backend.entity.Room;
import com.ceylonexplore.backend.entity.RoomStatus;
import com.ceylonexplore.backend.entity.RoomType;
import com.ceylonexplore.backend.exception.DuplicateRoomException;
import com.ceylonexplore.backend.exception.HotelNotFoundException;
import com.ceylonexplore.backend.exception.RoomNotFoundException;
import com.ceylonexplore.backend.repository.HotelRepository;
import com.ceylonexplore.backend.repository.RoomRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;

@Service
@Transactional(readOnly = true)
public class RoomService {

    private final RoomRepository roomRepository;
    private final HotelRepository hotelRepository;

    public RoomService(RoomRepository roomRepository, HotelRepository hotelRepository) {
        this.roomRepository = roomRepository;
        this.hotelRepository = hotelRepository;
    }

    public List<RoomResponse> getRooms(
            Long hotelId, RoomType roomType, RoomStatus status, BigDecimal minPrice, BigDecimal maxPrice,
            Boolean availableOnly
    ) {
        validatePriceRange(minPrice, maxPrice);
        return roomRepository.findAll().stream()
                .filter(room -> hotelId == null || room.getHotel().getId().equals(hotelId))
                .filter(room -> roomType == null || room.getRoomType() == roomType)
                .filter(room -> status == null || room.getStatus() == status)
                .filter(room -> minPrice == null || room.getPricePerNight().compareTo(minPrice) >= 0)
                .filter(room -> maxPrice == null || room.getPricePerNight().compareTo(maxPrice) <= 0)
                .filter(room -> !Boolean.TRUE.equals(availableOnly)
                        || (room.getStatus() == RoomStatus.AVAILABLE && room.getAvailableRooms() > 0))
                .map(this::toResponse).toList();
    }

    public List<RoomResponse> getRoomsForHotel(
            Long hotelId, RoomType roomType, BigDecimal minPrice, BigDecimal maxPrice
    ) {
        validatePriceRange(minPrice, maxPrice);
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new HotelNotFoundException(hotelId));
        if (hotel.getStatus() != HotelStatus.ACTIVE) {
            throw new HotelNotFoundException(hotelId);
        }
        return roomRepository.findByHotelId(hotelId).stream()
                .filter(room -> room.getStatus() == RoomStatus.AVAILABLE && room.getAvailableRooms() > 0)
                .filter(room -> roomType == null || room.getRoomType() == roomType)
                .filter(room -> minPrice == null || room.getPricePerNight().compareTo(minPrice) >= 0)
                .filter(room -> maxPrice == null || room.getPricePerNight().compareTo(maxPrice) <= 0)
                .map(this::toResponse).toList();
    }

    public RoomResponse getRoom(Long id) {
        return toResponse(findRoom(id));
    }

    @Transactional
    public RoomResponse createRoom(Long hotelId, RoomRequest request) {
        Hotel hotel = hotelRepository.findById(hotelId).orElseThrow(() -> new HotelNotFoundException(hotelId));
        String roomNumber = request.roomNumber().trim();
        if (roomRepository.existsByHotelIdAndRoomNumberIgnoreCase(hotelId, roomNumber)) {
            throw new DuplicateRoomException();
        }
        Room room = new Room();
        room.setHotel(hotel);
        applyRequest(room, request);
        return toResponse(roomRepository.save(room));
    }

    @Transactional
    public RoomResponse updateRoom(Long id, RoomRequest request) {
        Room room = findRoom(id);
        String roomNumber = request.roomNumber().trim();
        if (roomRepository.existsByHotelIdAndRoomNumberIgnoreCaseAndIdNot(
                room.getHotel().getId(), roomNumber, id
        )) {
            throw new DuplicateRoomException();
        }
        applyRequest(room, request);
        return toResponse(roomRepository.save(room));
    }

    @Transactional
    public void deleteRoom(Long id) {
        roomRepository.delete(findRoom(id));
    }

    private Room findRoom(Long id) {
        return roomRepository.findById(id).orElseThrow(() -> new RoomNotFoundException(id));
    }

    private void validatePriceRange(BigDecimal minPrice, BigDecimal maxPrice) {
        if (minPrice != null && maxPrice != null && minPrice.compareTo(maxPrice) > 0) {
            throw new IllegalArgumentException("Minimum price cannot exceed maximum price.");
        }
    }

    private void applyRequest(Room room, RoomRequest request) {
        room.setRoomNumber(request.roomNumber().trim());
        room.setRoomType(request.roomType());
        room.setCapacity(request.capacity());
        room.setPricePerNight(request.pricePerNight());
        room.setAvailableRooms(request.availableRooms());
        room.setDescription(request.description() == null || request.description().isBlank()
                ? null : request.description().trim());
        room.setStatus(request.status() == null ? RoomStatus.AVAILABLE : request.status());
    }

    private RoomResponse toResponse(Room room) {
        return new RoomResponse(
                room.getId(), room.getHotel().getId(), room.getHotel().getHotelName(), room.getRoomNumber(),
                room.getRoomType(), room.getCapacity(), room.getPricePerNight(), room.getAvailableRooms(),
                room.getDescription(), room.getStatus(), room.getCreatedAt(), room.getUpdatedAt()
        );
    }
}
