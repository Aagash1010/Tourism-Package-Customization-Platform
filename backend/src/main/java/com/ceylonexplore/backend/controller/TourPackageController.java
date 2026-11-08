package com.ceylonexplore.backend.controller;

import com.ceylonexplore.backend.dto.TourPackageRequest;
import com.ceylonexplore.backend.dto.TourPackageResponse;
import com.ceylonexplore.backend.service.TourPackageService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.math.BigDecimal;
import java.net.URI;
import java.util.List;

@RestController
@RequestMapping({"/api/tour-packages", "/api/packages"})
public class TourPackageController {

    private final TourPackageService tourPackageService;

    public TourPackageController(TourPackageService tourPackageService) {
        this.tourPackageService = tourPackageService;
    }

    @GetMapping
    public List<TourPackageResponse> getTourPackages(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long destinationId,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Integer minDuration,
            @RequestParam(required = false) Integer maxDuration
    ) {
        return tourPackageService.getTourPackages(
                keyword, destinationId, category, status, minPrice, maxPrice, minDuration, maxDuration
        );
    }

    @GetMapping("/active")
    public List<TourPackageResponse> getActiveTourPackages() {
        return tourPackageService.getActiveTourPackages();
    }

    @GetMapping("/search")
    public List<TourPackageResponse> searchTourPackages(@RequestParam String keyword) {
        return tourPackageService.getTourPackages(keyword, null, null, null, null, null, null, null);
    }

    @GetMapping("/destination/{destinationId}")
    public List<TourPackageResponse> getTourPackagesByDestination(@PathVariable Long destinationId) {
        return tourPackageService.getTourPackagesByDestination(destinationId);
    }

    @GetMapping("/category/{category}")
    public List<TourPackageResponse> getTourPackagesByCategory(@PathVariable String category) {
        return tourPackageService.getTourPackagesByCategory(category);
    }

    @GetMapping("/{id}")
    public TourPackageResponse getTourPackageById(@PathVariable Long id) {
        return tourPackageService.getTourPackageById(id);
    }

    @PostMapping
    public ResponseEntity<TourPackageResponse> createTourPackage(
            @Valid @RequestBody TourPackageRequest request
    ) {
        TourPackageResponse created = tourPackageService.createTourPackage(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(created.id())
                .toUri();
        return ResponseEntity.created(location).body(created);
    }

    @PutMapping("/{id}")
    public TourPackageResponse updateTourPackage(
            @PathVariable Long id,
            @Valid @RequestBody TourPackageRequest request
    ) {
        return tourPackageService.updateTourPackage(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTourPackage(@PathVariable Long id) {
        tourPackageService.deleteTourPackage(id);
        return ResponseEntity.noContent().build();
    }
}
