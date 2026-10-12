package com.ceylonexplore.backend.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "destinations")
public class Destination {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private Long id;

    @NotBlank(message = "Destination name is required.")
    @Size(max = 120, message = "Destination name must not exceed 120 characters.")
    @Column(nullable = false, length = 120)
    private String name;

    @NotBlank(message = "District is required.")
    @Size(max = 60, message = "District must not exceed 60 characters.")
    @Column(nullable = false, length = 60)
    private String district;

    @NotBlank(message = "Province is required.")
    @Size(max = 60, message = "Province must not exceed 60 characters.")
    @Pattern(
            regexp = "Central|Eastern|North Central|Northern|North Western|Sabaragamuwa|Southern|Uva|Western",
            message = "Province must be one of Sri Lanka's provinces."
    )
    @Column(nullable = false, length = 60)
    private String province;

    @NotBlank(message = "Destination category is required.")
    @Size(max = 80, message = "Category must not exceed 80 characters.")
    @Pattern(
            regexp = "Historical and Cultural|Beach|Wildlife|Nature and Adventure|Hill Country|Religious",
            message = "Select a supported destination category."
    )
    @Column(nullable = false, length = 80)
    private String category;

    @NotBlank(message = "Short description is required.")
    @Size(max = 240, message = "Short description must not exceed 240 characters.")
    @Column(name = "short_description", nullable = false, length = 240)
    private String shortDescription;

    @Size(max = 2000, message = "Full description must not exceed 2000 characters.")
    @Column(name = "full_description", length = 2000)
    private String fullDescription;

    @NotNull(message = "Entry fee is required.")
    @DecimalMin(value = "0.00", message = "Entry fee must be zero or more.")
    @Digits(integer = 10, fraction = 2, message = "Entry fee must have at most 10 integer digits and 2 decimal places.")
    @Column(name = "entry_fee", nullable = false, precision = 12, scale = 2)
    private BigDecimal entryFee;

    @NotBlank(message = "Best time to visit is required.")
    @Size(max = 100, message = "Best time to visit must not exceed 100 characters.")
    @Column(name = "best_time", nullable = false, length = 100)
    private String bestTime;

    @NotBlank(message = "Recommended visit duration is required.")
    @Size(max = 80, message = "Recommended visit duration must not exceed 80 characters.")
    @Column(nullable = false, length = 80)
    private String duration;

    @Size(max = 100, message = "Opening hours must not exceed 100 characters.")
    @Column(name = "opening_hours", length = 100)
    private String openingHours;

    @NotBlank(message = "Address or location is required.")
    @Size(max = 180, message = "Address must not exceed 180 characters.")
    @Column(nullable = false, length = 180)
    private String address;

    @DecimalMin(value = "-90.0", message = "Latitude must be between -90 and 90.")
    @DecimalMax(value = "90.0", message = "Latitude must be between -90 and 90.")
    @Digits(integer = 3, fraction = 7, message = "Latitude must have at most 3 integer digits and 7 decimal places.")
    @Column(precision = 10, scale = 7)
    private BigDecimal latitude;

    @DecimalMin(value = "-180.0", message = "Longitude must be between -180 and 180.")
    @DecimalMax(value = "180.0", message = "Longitude must be between -180 and 180.")
    @Digits(integer = 3, fraction = 7, message = "Longitude must have at most 3 integer digits and 7 decimal places.")
    @Column(precision = 10, scale = 7)
    private BigDecimal longitude;

    @NotNull(message = "Featured status is required.")
    @Column(nullable = false)
    private Boolean featured = false;

    @NotBlank(message = "Destination status is required.")
    @Pattern(regexp = "Active|Inactive", message = "Destination status must be Active or Inactive.")
    @Column(nullable = false, length = 8)
    private String status = "Active";

    @Size(max = 500, message = "Image URL must not exceed 500 characters.")
    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    protected Destination() {
    }

    @PrePersist
    private void setCreatedAt() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
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

    public String getDistrict() {
        return district;
    }

    public void setDistrict(String district) {
        this.district = district;
    }

    public String getProvince() {
        return province;
    }

    public void setProvince(String province) {
        this.province = province;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getShortDescription() {
        return shortDescription;
    }

    public void setShortDescription(String shortDescription) {
        this.shortDescription = shortDescription;
    }

    public String getFullDescription() {
        return fullDescription;
    }

    public void setFullDescription(String fullDescription) {
        this.fullDescription = fullDescription;
    }

    public BigDecimal getEntryFee() {
        return entryFee;
    }

    public void setEntryFee(BigDecimal entryFee) {
        this.entryFee = entryFee;
    }

    public String getBestTime() {
        return bestTime;
    }

    public void setBestTime(String bestTime) {
        this.bestTime = bestTime;
    }

    public String getDuration() {
        return duration;
    }

    public void setDuration(String duration) {
        this.duration = duration;
    }

    public String getOpeningHours() {
        return openingHours;
    }

    public void setOpeningHours(String openingHours) {
        this.openingHours = openingHours;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public BigDecimal getLatitude() {
        return latitude;
    }

    public void setLatitude(BigDecimal latitude) {
        this.latitude = latitude;
    }

    public BigDecimal getLongitude() {
        return longitude;
    }

    public void setLongitude(BigDecimal longitude) {
        this.longitude = longitude;
    }

    public Boolean getFeatured() {
        return featured;
    }

    public void setFeatured(Boolean featured) {
        this.featured = featured;
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
}
