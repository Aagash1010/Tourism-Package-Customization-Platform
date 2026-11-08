package com.ceylonexplore.backend.repository;

import com.ceylonexplore.backend.entity.Hotel;
import com.ceylonexplore.backend.entity.HotelStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HotelRepository extends JpaRepository<Hotel, Long> {
    List<Hotel> findByStatus(HotelStatus status);
    boolean existsByHotelNameIgnoreCase(String hotelName);
    boolean existsByHotelNameIgnoreCaseAndIdNot(String hotelName, Long id);
}
