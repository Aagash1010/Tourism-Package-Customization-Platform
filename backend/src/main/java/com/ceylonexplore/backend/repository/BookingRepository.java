package com.ceylonexplore.backend.repository;

import com.ceylonexplore.backend.entity.Booking;
import com.ceylonexplore.backend.entity.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    Optional<Booking> findByBookingReference(String bookingReference);

    List<Booking> findByTouristId(Long touristId);

    List<Booking> findByTourPackageId(Long tourPackageId);

    List<Booking> findByBookingStatus(BookingStatus bookingStatus);

    List<Booking> findByTravelDate(LocalDate travelDate);

    boolean existsByBookingReference(String bookingReference);
}
