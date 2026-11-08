package com.ceylonexplore.backend.service;

import com.ceylonexplore.backend.dto.AccountResponse;
import com.ceylonexplore.backend.dto.BookingRequest;
import com.ceylonexplore.backend.dto.BookingResponse;
import com.ceylonexplore.backend.dto.PasswordChangeRequest;
import com.ceylonexplore.backend.dto.ProfileUpdateRequest;
import com.ceylonexplore.backend.dto.UserBookingRequest;
import com.ceylonexplore.backend.dto.UserBookingResponse;
import com.ceylonexplore.backend.dto.UserDashboardResponse;
import com.ceylonexplore.backend.entity.Booking;
import com.ceylonexplore.backend.entity.BookingStatus;
import com.ceylonexplore.backend.entity.Tourist;
import com.ceylonexplore.backend.entity.UserAccount;
import com.ceylonexplore.backend.exception.BookingNotFoundException;
import com.ceylonexplore.backend.repository.BookingRepository;
import com.ceylonexplore.backend.repository.TouristRepository;
import com.ceylonexplore.backend.repository.UserAccountRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Comparator;

@Service
@Transactional(readOnly = true)
public class UserDashboardService {

    private final UserAccountRepository userAccountRepository;
    private final TouristRepository touristRepository;
    private final BookingRepository bookingRepository;
    private final PasswordEncoder passwordEncoder;
    private final BookingService bookingService;

    public UserDashboardService(
            UserAccountRepository userAccountRepository,
            TouristRepository touristRepository,
            BookingRepository bookingRepository,
            PasswordEncoder passwordEncoder,
            BookingService bookingService
    ) {
        this.userAccountRepository = userAccountRepository;
        this.touristRepository = touristRepository;
        this.bookingRepository = bookingRepository;
        this.passwordEncoder = passwordEncoder;
        this.bookingService = bookingService;
    }

    public AccountResponse getProfile(String email) {
        return AccountResponse.from(findAccount(email));
    }

    @Transactional
    public AccountResponse updateProfile(String email, ProfileUpdateRequest request) {
        UserAccount account = findAccount(email);
        account.setFullName(request.fullName().trim());
        account.setPhone(normalizeOptionalText(request.phone()));
        account.setCountry(request.country().trim());
        account.setAddress(normalizeOptionalText(request.address()));
        account.setProfileImage(normalizeOptionalText(request.profileImage()));
        UserAccount saved = userAccountRepository.save(account);

        touristRepository.findByUserAccountId(account.getId()).ifPresent(tourist -> {
            tourist.setFullName(saved.getFullName());
            tourist.setPhone(saved.getPhone());
            tourist.setCountry(saved.getCountry());
            tourist.setAddress(saved.getAddress());
            tourist.setProfileImage(saved.getProfileImage());
            touristRepository.save(tourist);
        });
        return AccountResponse.from(saved);
    }

    @Transactional
    public void changePassword(String email, PasswordChangeRequest request) {
        UserAccount account = findAccount(email);
        if (!passwordEncoder.matches(request.currentPassword(), account.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect.");
        }
        if (!request.newPassword().equals(request.confirmNewPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New passwords do not match.");
        }
        account.setPassword(passwordEncoder.encode(request.newPassword()));
        userAccountRepository.save(account);
    }

    public List<UserBookingResponse> getBookings(String email) {
        UserAccount account = findAccount(email);
        return accountBookings(account).stream().map(this::toResponse).toList();
    }

    @Transactional
    public BookingResponse createBooking(String email, UserBookingRequest request) {
        UserAccount account = findAccount(email);
        Tourist tourist = touristRepository.findByUserAccountId(account.getId()).orElseGet(() -> {
            if (touristRepository.findByEmailIgnoreCase(account.getEmail()).isPresent()) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "A traveler profile already exists for this email. Please contact an administrator to link it to your account before booking."
                );
            }
            if (account.getCountry() == null || account.getCountry().isBlank()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Please add your country to your profile before booking."
                );
            }
            Tourist newTourist = new Tourist();
            newTourist.setFullName(account.getFullName());
            newTourist.setEmail(account.getEmail());
            newTourist.setPhone(account.getPhone());
            newTourist.setCountry(account.getCountry());
            newTourist.setAddress(account.getAddress());
            newTourist.setProfileImage(account.getProfileImage());
            newTourist.setUserAccount(account);
            return touristRepository.save(newTourist);
        });

        BookingRequest bookingRequest = new BookingRequest(
                tourist.getId(),
                request.packageId(),
                request.numberOfPeople(),
                LocalDateTime.now().withNano(0),
                request.travelDate(),
                request.specialRequests(),
                null,
                null,
                BigDecimal.ZERO,
                BigDecimal.ZERO
        );
        return bookingService.createBooking(bookingRequest);
    }

    public List<UserBookingResponse> getUpcomingBookings(String email) {
        LocalDate today = LocalDate.now();
        return getBookings(email).stream()
                .filter(booking -> BookingStatus.CONFIRMED.name().equals(booking.bookingStatus()))
                .filter(booking -> booking.travelDate().isAfter(today))
                .sorted(Comparator.comparing(UserBookingResponse::travelDate))
                .toList();
    }

    public List<UserBookingResponse> getBookingHistory(String email) {
        LocalDate today = LocalDate.now();
        return getBookings(email).stream()
                .filter(booking -> BookingStatus.COMPLETED.name().equals(booking.bookingStatus())
                        || booking.travelDate().isBefore(today))
                .toList();
    }

    public UserBookingResponse getBooking(String email, String bookingReference) {
        UserAccount account = findAccount(email);
        Booking booking = bookingRepository.findAccountBooking(
                        bookingReference.trim(),
                        account.getId()
                )
                .orElseThrow(() -> new BookingNotFoundException(bookingReference));
        return toResponse(booking);
    }

    public UserDashboardResponse getDashboard(String email) {
        List<UserBookingResponse> bookings = getBookings(email);
        LocalDate today = LocalDate.now();
        List<UserBookingResponse> upcoming = bookings.stream()
                .filter(booking -> BookingStatus.CONFIRMED.name().equals(booking.bookingStatus()))
                .filter(booking -> booking.travelDate().isAfter(today))
                .sorted(Comparator.comparing(UserBookingResponse::travelDate))
                .toList();
        List<UserBookingResponse> recent = bookings.stream()
                .sorted(Comparator.comparing(
                        UserBookingResponse::bookingDate,
                        Comparator.nullsLast(Comparator.reverseOrder())
                ))
                .limit(5)
                .toList();
        return new UserDashboardResponse(
                bookings.size(),
                upcoming.size(),
                bookings.stream().filter(booking -> BookingStatus.COMPLETED.name().equals(booking.bookingStatus())).count(),
                bookings.stream().filter(booking -> BookingStatus.PENDING.name().equals(booking.bookingStatus())).count(),
                recent,
                upcoming.stream().limit(3).toList()
        );
    }

    private List<Booking> accountBookings(UserAccount account) {
        return bookingRepository.findAccountBookings(account.getId());
    }

    private UserAccount findAccount(String email) {
        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        return userAccountRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account was not found."));
    }

    private UserBookingResponse toResponse(Booking booking) {
        Tourist tourist = booking.getTourist();
        var tourPackage = booking.getTourPackage();
        var destination = tourPackage.getDestinationEntity();
        String destinationName = destination == null ? tourPackage.getDestination() : destination.getName();
        return new UserBookingResponse(
                booking.getBookingReference(),
                tourist.getFullName(),
                tourist.getEmail(),
                tourist.getPhone(),
                tourist.getCountry(),
                tourPackage.getName(),
                destinationName,
                destination == null ? null : destination.getProvince(),
                destination == null ? null : destination.getDistrict(),
                destination == null ? null : destination.getAddress(),
                tourPackage.getImageUrl(),
                destination == null ? null : destination.getImageUrl(),
                tourPackage.getDurationDays(),
                booking.getBookingDate(),
                booking.getTravelDate(),
                booking.getNumberOfPeople(),
                booking.getTotalAmount(),
                booking.getBookingStatus().name(),
                booking.getPaymentStatus().name(),
                booking.getSpecialRequests(),
                booking.getCreatedAt()
        );
    }

    private String normalizeOptionalText(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
