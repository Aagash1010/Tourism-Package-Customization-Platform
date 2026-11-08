package com.ceylonexplore.backend.controller;

import com.ceylonexplore.backend.dto.AccountResponse;
import com.ceylonexplore.backend.dto.TouristAccountLinkRequest;
import com.ceylonexplore.backend.dto.TouristRequest;
import com.ceylonexplore.backend.dto.TouristResponse;
import com.ceylonexplore.backend.entity.TouristStatus;
import com.ceylonexplore.backend.service.TouristAccountLinkService;
import com.ceylonexplore.backend.service.TouristService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/tourists")
@PreAuthorize("hasRole('ADMIN')")
public class TouristController {

    private final TouristService touristService;
    private final TouristAccountLinkService touristAccountLinkService;

    public TouristController(TouristService touristService, TouristAccountLinkService touristAccountLinkService) {
        this.touristService = touristService;
        this.touristAccountLinkService = touristAccountLinkService;
    }

    @GetMapping
    public List<TouristResponse> getAllTourists() {
        return touristService.getAllTourists();
    }

    @GetMapping("/search")
    public List<TouristResponse> searchTourists(@RequestParam(required = false) String keyword) {
        return touristService.searchTourists(keyword);
    }

    @GetMapping("/country/{country}")
    public List<TouristResponse> getTouristsByCountry(@PathVariable String country) {
        return touristService.getTouristsByCountry(country);
    }

    @GetMapping("/status/{status}")
    public List<TouristResponse> getTouristsByStatus(@PathVariable TouristStatus status) {
        return touristService.getTouristsByStatus(status);
    }

    @GetMapping("/{id}")
    public TouristResponse getTouristById(@PathVariable Long id) {
        return touristService.getTouristById(id);
    }

    @PostMapping
    public ResponseEntity<TouristResponse> createTourist(@Valid @RequestBody TouristRequest request) {
        TouristResponse createdTourist = touristService.createTourist(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(createdTourist.id())
                .toUri();
        return ResponseEntity.created(location).body(createdTourist);
    }

    @PutMapping("/{id}")
    public TouristResponse updateTourist(@PathVariable Long id, @Valid @RequestBody TouristRequest request) {
        return touristService.updateTourist(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTourist(@PathVariable Long id) {
        touristService.deleteTourist(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/account")
    public AccountResponse linkAccount(
            @PathVariable Long id,
            @Valid @RequestBody TouristAccountLinkRequest request
    ) {
        return touristAccountLinkService.linkAccount(id, request);
    }
}
