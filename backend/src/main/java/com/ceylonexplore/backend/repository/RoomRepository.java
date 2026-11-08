package com.ceylonexplore.backend.repository;

import com.ceylonexplore.backend.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoomRepository extends JpaRepository<Room, Long> {
    List<Room> findByHotelId(Long hotelId);
    long countByHotelId(Long hotelId);
    boolean existsByHotelId(Long hotelId);
    boolean existsByHotelIdAndRoomNumberIgnoreCase(Long hotelId, String roomNumber);
    boolean existsByHotelIdAndRoomNumberIgnoreCaseAndIdNot(Long hotelId, String roomNumber, Long id);
}
