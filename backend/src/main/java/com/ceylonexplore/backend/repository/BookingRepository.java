package com.ceylonexplore.backend.repository;

import com.ceylonexplore.backend.entity.Booking;
import com.ceylonexplore.backend.entity.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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
    boolean existsByTouristId(Long touristId);
    boolean existsByTourPackageId(Long tourPackageId);

    @Query("""
            select b from Booking b
            join fetch b.tourist t
            join fetch b.tourPackage p
            order by b.id desc
            """)
    List<Booking> findAllWithDetails();

    @Query("""
            select b from Booking b
            join fetch b.tourist t
            join fetch b.tourPackage p
            left join fetch p.destinationEntity
            left join t.userAccount account
            where account.id = :userId
            order by b.travelDate desc, b.id desc
            """)
    List<Booking> findAccountBookings(@Param("userId") Long userId);

    @Query("""
            select b from Booking b
            join fetch b.tourist t
            join fetch b.tourPackage p
            left join fetch p.destinationEntity
            left join t.userAccount account
            where b.bookingReference = :reference
              and account.id = :userId
            """)
    Optional<Booking> findAccountBooking(
            @Param("reference") String reference,
            @Param("userId") Long userId
    );
}
