package com.ceylonexplore.backend.entity;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(
        name = "tour_guides",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_tour_guides_email", columnNames = "email"),
                @UniqueConstraint(name = "uk_tour_guides_nic_number", columnNames = "nic_number"),
                @UniqueConstraint(name = "uk_tour_guides_license_number", columnNames = "license_number")
        }
)
public class TourGuide {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "full_name", nullable = false, length = 120)
    private String fullName;

    @Column(nullable = false, length = 254)
    private String email;

    @Column(name = "phone_number", nullable = false, length = 30)
    private String phoneNumber;

    @Column(nullable = false, length = 500)
    private String address;

    @Column(name = "nic_number", nullable = false, length = 30)
    private String nicNumber;

    @Column(nullable = false, length = 30)
    private String gender;

    @Column(nullable = false, length = 80)
    private String nationality;

    @Column(nullable = false, length = 80)
    private String city;

    @Column(nullable = false, length = 80)
    private String district;

    @Column(name = "license_number", nullable = false, length = 80)
    private String licenseNumber;

    @Column(nullable = false, length = 120)
    private String qualification;

    @Column(name = "date_of_birth", nullable = false)
    private LocalDate dateOfBirth;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(
            name = "tour_guide_languages",
            joinColumns = @JoinColumn(name = "tour_guide_id", nullable = false)
    )
    @Column(name = "language", nullable = false, length = 50)
    private Set<String> languages = new LinkedHashSet<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(
            name = "tour_guide_working_days",
            joinColumns = @JoinColumn(name = "tour_guide_id", nullable = false)
    )
    @Column(name = "working_day", nullable = false, length = 15)
    private Set<String> workingDays = new LinkedHashSet<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(
            name = "tour_guide_preferred_tour_types",
            joinColumns = @JoinColumn(name = "tour_guide_id", nullable = false)
    )
    @Column(name = "tour_type", nullable = false, length = 80)
    private Set<String> preferredTourTypes = new LinkedHashSet<>();

    @Column(nullable = false, length = 120)
    private String specialization;

    @Column(name = "experience_years", nullable = false)
    private Integer experienceYears;

    @Column(name = "daily_rate", nullable = false, precision = 12, scale = 2)
    private BigDecimal dailyRate;

    @Column(name = "certifications", length = 1000)
    private String certifications;

    @Column(name = "employment_status", nullable = false, length = 10)
    private String employmentStatus = "Active";

    @Column(name = "max_group_size", nullable = false)
    private Integer maxGroupSize;

    @Column(precision = 3, scale = 2)
    private BigDecimal rating;

    @Column(name = "profile_image", length = 500)
    private String profileImage;

    @Enumerated(EnumType.STRING)
    @Column(name = "availability_status", nullable = false, length = 20)
    private TourGuideAvailabilityStatus availabilityStatus = TourGuideAvailabilityStatus.AVAILABLE;

    @Column(length = 2000)
    private String description;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public TourGuide() {
    }

    @PrePersist
    private void setCreatedMeta() {
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

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getNicNumber() {
        return nicNumber;
    }

    public void setNicNumber(String nicNumber) {
        this.nicNumber = nicNumber;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getNationality() {
        return nationality;
    }

    public void setNationality(String nationality) {
        this.nationality = nationality;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getDistrict() {
        return district;
    }

    public void setDistrict(String district) {
        this.district = district;
    }

    public String getLicenseNumber() {
        return licenseNumber;
    }

    public void setLicenseNumber(String licenseNumber) {
        this.licenseNumber = licenseNumber;
    }

    public String getQualification() {
        return qualification;
    }

    public void setQualification(String qualification) {
        this.qualification = qualification;
    }

    public LocalDate getDateOfBirth() {
        return dateOfBirth;
    }

    public void setDateOfBirth(LocalDate dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }

    public Set<String> getLanguages() {
        return languages;
    }

    public void setLanguages(Set<String> languages) {
        this.languages = new LinkedHashSet<>(languages);
    }

    public Set<String> getWorkingDays() {
        return workingDays;
    }

    public void setWorkingDays(Set<String> workingDays) {
        this.workingDays = new LinkedHashSet<>(workingDays);
    }

    public Set<String> getPreferredTourTypes() {
        return preferredTourTypes;
    }

    public void setPreferredTourTypes(Set<String> preferredTourTypes) {
        this.preferredTourTypes = new LinkedHashSet<>(preferredTourTypes);
    }

    public String getSpecialization() {
        return specialization;
    }

    public void setSpecialization(String specialization) {
        this.specialization = specialization;
    }

    public Integer getExperienceYears() {
        return experienceYears;
    }

    public void setExperienceYears(Integer experienceYears) {
        this.experienceYears = experienceYears;
    }

    public BigDecimal getDailyRate() {
        return dailyRate;
    }

    public void setDailyRate(BigDecimal dailyRate) {
        this.dailyRate = dailyRate;
    }

    public String getCertifications() {
        return certifications;
    }

    public void setCertifications(String certifications) {
        this.certifications = certifications;
    }

    public String getEmploymentStatus() {
        return employmentStatus;
    }

    public void setEmploymentStatus(String employmentStatus) {
        this.employmentStatus = employmentStatus;
    }

    public Integer getMaxGroupSize() {
        return maxGroupSize;
    }

    public void setMaxGroupSize(Integer maxGroupSize) {
        this.maxGroupSize = maxGroupSize;
    }

    public BigDecimal getRating() {
        return rating;
    }

    public void setRating(BigDecimal rating) {
        this.rating = rating;
    }

    public String getProfileImage() {
        return profileImage;
    }

    public void setProfileImage(String profileImage) {
        this.profileImage = profileImage;
    }

    public TourGuideAvailabilityStatus getAvailabilityStatus() {
        return availabilityStatus;
    }

    public void setAvailabilityStatus(TourGuideAvailabilityStatus availabilityStatus) {
        this.availabilityStatus = availabilityStatus;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
