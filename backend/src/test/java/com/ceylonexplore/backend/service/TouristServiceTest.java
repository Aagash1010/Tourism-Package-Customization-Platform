package com.ceylonexplore.backend.service;

import com.ceylonexplore.backend.entity.Tourist;
import com.ceylonexplore.backend.exception.DuplicateTouristEmailException;
import com.ceylonexplore.backend.exception.TouristNotFoundException;
import com.ceylonexplore.backend.repository.TouristRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TouristServiceTest {

    @Mock
    private TouristRepository touristRepository;

    @InjectMocks
    private TouristService touristService;

    @Test
    void getAllTouristsReturnsRepositoryRecords() {
        List<Tourist> tourists = List.of(mock(Tourist.class), mock(Tourist.class));
        when(touristRepository.findAll()).thenReturn(tourists);

        assertSame(tourists, touristService.getAllTourists());
    }

    @Test
    void getTouristByIdReturnsExistingTourist() {
        Tourist tourist = mock(Tourist.class);
        when(touristRepository.findById(7L)).thenReturn(Optional.of(tourist));

        assertSame(tourist, touristService.getTouristById(7L));
    }

    @Test
    void createTouristRejectsAnEmailAlreadyInUse() {
        Tourist request = mock(Tourist.class);
        when(request.getEmail()).thenReturn("TEST@example.com");
        when(touristRepository.existsByEmailIgnoreCase("test@example.com")).thenReturn(true);

        assertThrows(DuplicateTouristEmailException.class, () -> touristService.createTourist(request));
        verify(touristRepository, never()).save(any(Tourist.class));
    }

    @Test
    void createTouristNormalizesNameAndEmail() {
        Tourist request = tourist(" Test Tourist ", " TEST@example.com ");
        when(request.getPhone()).thenReturn(" 0771234567 ");
        when(request.getCountry()).thenReturn(" Sri Lanka ");
        when(touristRepository.existsByEmailIgnoreCase("test@example.com")).thenReturn(false);
        when(touristRepository.save(request)).thenReturn(request);

        touristService.createTourist(request);

        verify(request).setId(null);
        verify(request).setFullName("Test Tourist");
        verify(request).setEmail("test@example.com");
        verify(request).setPhone("0771234567");
        verify(request).setCountry("Sri Lanka");
    }

    @Test
    void updateTouristAllowsKeepingTheCurrentEmail() {
        Long id = 7L;
        Tourist existing = mock(Tourist.class);
        Tourist request = tourist("Updated Tourist", "test@example.com");
        when(request.getPhone()).thenReturn(null);
        when(request.getCountry()).thenReturn(null);
        when(touristRepository.findById(id)).thenReturn(Optional.of(existing));
        when(touristRepository.existsByEmailIgnoreCaseAndIdNot("test@example.com", id)).thenReturn(false);
        when(touristRepository.save(existing)).thenReturn(existing);

        touristService.updateTourist(id, request);

        verify(existing).setFullName("Updated Tourist");
        verify(existing).setEmail("test@example.com");
        verify(touristRepository).save(existing);
    }

    @Test
    void updateTouristRejectsAnotherTouristsEmail() {
        Long id = 7L;
        Tourist existing = mock(Tourist.class);
        Tourist request = mock(Tourist.class);
        when(request.getEmail()).thenReturn("used@example.com");
        when(touristRepository.findById(id)).thenReturn(Optional.of(existing));
        when(touristRepository.existsByEmailIgnoreCaseAndIdNot("used@example.com", id)).thenReturn(true);

        assertThrows(DuplicateTouristEmailException.class, () -> touristService.updateTourist(id, request));
        verify(touristRepository, never()).save(any(Tourist.class));
    }

    @Test
    void deleteTouristDeletesExistingTourist() {
        Tourist tourist = mock(Tourist.class);
        when(touristRepository.findById(7L)).thenReturn(Optional.of(tourist));

        touristService.deleteTourist(7L);

        verify(touristRepository).delete(tourist);
    }

    @Test
    void getTouristByIdRejectsMissingTourist() {
        when(touristRepository.findById(404L)).thenReturn(Optional.empty());

        assertThrows(TouristNotFoundException.class, () -> touristService.getTouristById(404L));
    }

    @Test
    void deleteTouristRejectsMissingTourist() {
        when(touristRepository.findById(404L)).thenReturn(Optional.empty());

        assertThrows(TouristNotFoundException.class, () -> touristService.deleteTourist(404L));
        verify(touristRepository, never()).delete(any(Tourist.class));
    }

    private Tourist tourist(String fullName, String email) {
        Tourist tourist = mock(Tourist.class);
        when(tourist.getFullName()).thenReturn(fullName);
        when(tourist.getEmail()).thenReturn(email);
        return tourist;
    }
}
