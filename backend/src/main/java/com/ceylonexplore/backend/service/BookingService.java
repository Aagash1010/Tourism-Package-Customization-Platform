package com.ceylonexplore.backend.service;

import com.ceylonexplore.backend.dto.BookingRequest;
import com.ceylonexplore.backend.dto.BookingResponse;
import com.ceylonexplore.backend.entity.Booking;
import com.ceylonexplore.backend.entity.BookingStatus;
import com.ceylonexplore.backend.entity.PaymentStatus;
import com.ceylonexplore.backend.entity.TourPackage;
import com.ceylonexplore.backend.entity.Tourist;
import com.ceylonexplore.backend.exception.BookingConflictException;
import com.ceylonexplore.backend.exception.BookingNotFoundException;
import com.ceylonexplore.backend.exception.InvalidBookingException;
import com.ceylonexplore.backend.exception.TourPackageNotFoundException;
import com.ceylonexplore.backend.exception.TouristNotFoundException;
import com.ceylonexplore.backend.repository.BookingRepository;
import com.ceylonexplore.backend.repository.TourPackageRepository;
import com.ceylonexplore.backend.repository.TouristRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@Transactional(readOnly = true)
public class BookingService {

    private static final String BOOKING_PREFIX = "BK";

    private final BookingRepository bookingRepository;
    private final TouristRepository touristRepository;
    private final TourPackageRepository tourPackageRepository;

    public BookingService(
            BookingRepository bookingRepository,
            TouristRepository touristRepository,
            TourPackageRepository tourPackageRepository
    ) {
        this.bookingRepository = bookingRepository;
        this.touristRepository = touristRepository;
        this.tourPackageRepository = tourPackageRepository;
    }

    public List<BookingResponse> getAllBookings() {
        List<Booking> bookings = bookingRepository.findAll();
        List<BookingResponse> responses = new ArrayList<>();
        for (Booking booking : bookings) {
            responses.add(toResponse(booking));
        }
        return responses;
    }

    public BookingResponse getBookingById(Long id) {
        return toResponse(findBookingEntityById(id));
    }

    public BookingResponse getBookingByReference(String bookingReference) {
        Booking booking = bookingRepository.findByBookingReference(bookingReference)
                .orElseThrow(() -> new BookingNotFoundException(bookingReference));
        return toResponse(booking);
    }

    public List<BookingResponse> getBookingsByTourist(Long touristId) {
        return bookingRepository.findByTouristId(touristId).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<BookingResponse> getBookingsByPackage(Long packageId) {
        return bookingRepository.findByTourPackageId(packageId).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<BookingResponse> getBookingsByStatus(String statusText) {
        BookingStatus status = parseBookingStatus(statusText);
        return bookingRepository.findByBookingStatus(status).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<BookingResponse> searchBookings(String keyword) {
        String normalized = keyword == null ? "" : keyword.trim();
        if (normalized.isEmpty()) {
            return getAllBookings();
        }
        return bookingRepository.findAll().stream()
                .filter(booking -> booking.getBookingReference() != null && booking.getBookingReference().toLowerCase(Locale.ROOT).contains(normalized.toLowerCase(Locale.ROOT)))
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public BookingResponse createBooking(BookingRequest request) {
        validateRequest(request);

        Tourist tourist = touristRepository.findById(request.touristId())
                .orElseThrow(() -> new TouristNotFoundException(request.touristId()));
        TourPackage tourPackage = tourPackageRepository.findById(request.packageId())
                .orElseThrow(() -> new TourPackageNotFoundException(request.packageId()));

        if (request.numberOfPeople() > tourPackage.getMaxTravelers()) {
            throw new BookingConflictException("Number of people exceeds the package capacity of " + tourPackage.getMaxTravelers() + ".");
        }

        BigDecimal totalAmount = calculateTotalAmount(tourPackage.getPrice(), request.numberOfPeople());
        if (totalAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw new InvalidBookingException("Total amount cannot be negative.");
        }

        Booking booking = new Booking();
        booking.setBookingReference(generateUniqueBookingReference());
        booking.setTourist(tourist);
        booking.setTourPackage(tourPackage);
        booking.setNumberOfPeople(request.numberOfPeople());
        booking.setBookingDate(request.bookingDate().atStartOfDay());
        booking.setTravelDate(request.travelDate());
        booking.setTotalAmount(totalAmount);
        booking.setDiscount(BigDecimal.ZERO);
        booking.setAmountPaid(BigDecimal.ZERO);
        booking.setBookingStatus(BookingStatus.PENDING);
        booking.setPaymentStatus(PaymentStatus.UNPAID);
        booking.setSpecialRequests(normalizeOptionalText(request.specialRequests()));

        return toResponse(bookingRepository.save(booking));
    }

    @Transactional
    public BookingResponse updateBooking(Long id, BookingRequest request) {
        Booking existingBooking = findBookingEntityById(id);
        validateRequest(request);

        Tourist tourist = touristRepository.findById(request.touristId())
                .orElseThrow(() -> new TouristNotFoundException(request.touristId()));
        TourPackage tourPackage = tourPackageRepository.findById(request.packageId())
                .orElseThrow(() -> new TourPackageNotFoundException(request.packageId()));

        if (request.numberOfPeople() > tourPackage.getMaxTravelers()) {
            throw new BookingConflictException("Number of people exceeds the package capacity of " + tourPackage.getMaxTravelers() + ".");
        }

        if (existingBooking.getBookingStatus() == BookingStatus.COMPLETED) {
            throw new BookingConflictException("Completed bookings cannot be modified without appropriate authorization.");
        }
        if (existingBooking.getBookingStatus() == BookingStatus.CANCELLED) {
            throw new BookingConflictException("Cancelled bookings cannot be modified through a normal update.");
        }

        BigDecimal totalAmount = calculateTotalAmount(tourPackage.getPrice(), request.numberOfPeople());
        existingBooking.setTourist(tourist);
        existingBooking.setTourPackage(tourPackage);
        existingBooking.setNumberOfPeople(request.numberOfPeople());
        existingBooking.setBookingDate(request.bookingDate().atStartOfDay());
        existingBooking.setTravelDate(request.travelDate());
        existingBooking.setTotalAmount(totalAmount);
        existingBooking.setSpecialRequests(normalizeOptionalText(request.specialRequests()));
        existingBooking.setUpdatedAt(LocalDateTime.now());

        return toResponse(bookingRepository.save(existingBooking));
    }

    @Transactional
    public void deleteBooking(Long id) {
        Booking booking = findBookingEntityById(id);
        if (booking.getBookingStatus() == BookingStatus.COMPLETED || booking.getPaymentStatus() == PaymentStatus.PAID) {
            throw new BookingConflictException("Completed or paid bookings cannot be deleted.");
        }
        bookingRepository.delete(booking);
    }

    private Booking findBookingEntityById(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new BookingNotFoundException(id));
    }

    private void validateRequest(BookingRequest request) {
        if (request == null) {
            throw new InvalidBookingException("Booking request body is required.");
        }
        if (request.touristId() == null) {
            throw new InvalidBookingException("Tourist ID is required.");
        }
        if (request.packageId() == null) {
            throw new InvalidBookingException("Tour package ID is required.");
        }
        if (request.numberOfPeople() == null || request.numberOfPeople() <= 0) {
            throw new InvalidBookingException("Number of people must be greater than zero.");
        }
        if (request.travelDate() == null) {
            throw new InvalidBookingException("Travel date is required.");
        }
        if (request.bookingDate() == null) {
            throw new InvalidBookingException("Booking date is required.");
        }
        if (request.travelDate().isBefore(LocalDate.now()) || request.travelDate().isEqual(LocalDate.now())) {
            throw new InvalidBookingException("Travel date must be in the future.");
        }
        if (request.bookingDate().isAfter(request.travelDate())) {
            throw new InvalidBookingException("Travel date cannot be earlier than the booking date.");
        }
    }

    private BookingStatus parseBookingStatus(String statusText) {
        if (statusText == null || statusText.isBlank()) {
            throw new InvalidBookingException("Booking status is required.");
        }
        try {
            return BookingStatus.valueOf(statusText.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new InvalidBookingException("Invalid booking status: " + statusText);
        }
    }

    private String generateUniqueBookingReference() {
        String reference;
        do {
            long suffix = System.currentTimeMillis() % 9_999_999L + 1_000_000L;
            reference = BOOKING_PREFIX + "-" + suffix;
        } while (bookingRepository.existsByBookingReference(reference));
        return reference;
    }

    private BigDecimal calculateTotalAmount(BigDecimal packagePrice, Integer numberOfPeople) {
        if (packagePrice == null) {
            packagePrice = BigDecimal.ZERO;
        }
        return packagePrice.multiply(BigDecimal.valueOf(numberOfPeople)).setScale(2);
    }

    private String normalizeOptionalText(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private BookingResponse toResponse(Booking booking) {
        return new BookingResponse(
                booking.getId(),
                booking.getBookingReference(),
                booking.getTourist() != null ? booking.getTourist().getId() : null,
                booking.getTourist() != null ? booking.getTourist().getFullName() : null,
                booking.getTourPackage() != null ? booking.getTourPackage().getId() : null,
                booking.getTourPackage() != null ? booking.getTourPackage().getName() : null,
                booking.getTourPackage() != null ? booking.getTourPackage().getPrice() : null,
                booking.getNumberOfPeople(),
                booking.getBookingDate(),
                booking.getTravelDate(),
                booking.getTotalAmount(),
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                booking.getBookingStatus() != null ? booking.getBookingStatus().name() : null,
                booking.getPaymentStatus() != null ? booking.getPaymentStatus().name() : null,
                booking.getSpecialRequests(),
                booking.getCreatedAt(),
                booking.getUpdatedAt()
        );
    }
}
