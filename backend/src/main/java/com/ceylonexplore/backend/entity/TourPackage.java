package com.ceylonexplore.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.CascadeType;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "tour_packages",
        uniqueConstraints = @UniqueConstraint(name = "uk_tour_packages_name", columnNames = "name")
)
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class TourPackage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private Long id;

    @NotBlank(message = "Package name is required.")
    @Size(max = 120, message = "Package name must not exceed 120 characters.")
    @Column(nullable = false, length = 120)
    private String name;

    @Size(max = 1000, message = "Description must not exceed 1000 characters.")
    @Column(length = 1000)
    private String description;

    @Column(name = "full_description", length = 2000)
    private String fullDescription;

    @NotBlank(message = "Destination is required.")
    @Size(max = 100, message = "Destination must not exceed 100 characters.")
    @Column(nullable = false, length = 100)
    private String destination;

    @NotBlank(message = "Duration is required.")
    @Size(max = 60, message = "Duration must not exceed 60 characters.")
    @Column(nullable = false, length = 60)
    private String duration;

    @NotNull(message = "Package price is required.")
    @DecimalMin(value = "0.00", message = "Package price must be zero or greater.")
    @Digits(integer = 10, fraction = 2, message = "Package price must have at most 10 integer digits and 2 decimal places.")
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @NotNull(message = "Maximum travelers is required.")
    @Min(value = 1, message = "Maximum travelers must be at least 1.")
    @Column(name = "max_travelers", nullable = false)
    private Integer maxTravelers;

    @NotBlank(message = "Status is required.")
    @Pattern(regexp = "Active|Inactive", message = "Package status must be Active or Inactive.")
    @Column(nullable = false, length = 8)
    private String status = "Active";

    @Size(max = 500, message = "Image URL must not exceed 500 characters.")
    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "duration_days")
    private Integer durationDays;

    @Column(name = "duration_nights")
    private Integer durationNights;

    @Column(name = "min_travelers")
    private Integer minTravelers = 1;

    @Column(name = "package_category", length = 80)
    private String category;

    @Column(name = "difficulty_level", length = 40)
    private String difficultyLevel;

    @Column(name = "inclusions", length = 2000)
    private String inclusions;

    @Column(name = "exclusions", length = 2000)
    private String exclusions;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(nullable = false)
    private Boolean featured = false;

    @Column(length = 3)
    private String accommodation;

    @Column(length = 3)
    private String meals;

    @Column(length = 3)
    private String transportation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "destination_id")
    @JsonIgnore
    private Destination destinationEntity;

    @OneToMany(mappedBy = "tourPackage", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<PackageItinerary> itinerary = new ArrayList<>();

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public TourPackage() {
    }

    public void setId(Long id) {
        this.id = id;
    }

    @PrePersist
    private void setCreatedAt() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
    }

    @PreUpdate
    private void setUpdatedAt() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getFullDescription() { return fullDescription; }
    public void setFullDescription(String fullDescription) { this.fullDescription = fullDescription; }

    public String getDestination() {
        return destination;
    }

    public void setDestination(String destination) {
        this.destination = destination;
    }

    public String getDuration() {
        return duration;
    }

    public void setDuration(String duration) {
        this.duration = duration;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public Integer getMaxTravelers() {
        return maxTravelers;
    }

    public void setMaxTravelers(Integer maxTravelers) {
        this.maxTravelers = maxTravelers;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public Integer getDurationDays() { return durationDays; }
    public void setDurationDays(Integer durationDays) { this.durationDays = durationDays; }
    public Integer getDurationNights() { return durationNights; }
    public void setDurationNights(Integer durationNights) { this.durationNights = durationNights; }
    public Integer getMinTravelers() { return minTravelers; }
    public void setMinTravelers(Integer minTravelers) { this.minTravelers = minTravelers; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getDifficultyLevel() { return difficultyLevel; }
    public void setDifficultyLevel(String difficultyLevel) { this.difficultyLevel = difficultyLevel; }
    public String getInclusions() { return inclusions; }
    public void setInclusions(String inclusions) { this.inclusions = inclusions; }
    public String getExclusions() { return exclusions; }
    public void setExclusions(String exclusions) { this.exclusions = exclusions; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    public Boolean getFeatured() { return featured; }
    public void setFeatured(Boolean featured) { this.featured = featured; }
    public String getAccommodation() { return accommodation; }
    public void setAccommodation(String accommodation) { this.accommodation = accommodation; }
    public String getMeals() { return meals; }
    public void setMeals(String meals) { this.meals = meals; }
    public String getTransportation() { return transportation; }
    public void setTransportation(String transportation) { this.transportation = transportation; }
    public Destination getDestinationEntity() { return destinationEntity; }
    public void setDestinationEntity(Destination destinationEntity) { this.destinationEntity = destinationEntity; }
    public List<PackageItinerary> getItinerary() { return itinerary; }
    public void setItinerary(List<PackageItinerary> itinerary) { this.itinerary = itinerary; }
}
