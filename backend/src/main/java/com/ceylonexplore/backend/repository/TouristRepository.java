package com.ceylonexplore.backend.repository;

import com.ceylonexplore.backend.entity.Tourist;
import com.ceylonexplore.backend.entity.TouristStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TouristRepository extends JpaRepository<Tourist, Long> {

    Optional<Tourist> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCaseAndIdNot(String email, Long id);

    List<Tourist> findByCountryIgnoreCase(String country);

    List<Tourist> findByStatus(TouristStatus status);

    @Query("""
            select t from Tourist t
            where lower(t.fullName) like lower(concat('%', :keyword, '%'))
               or lower(t.email) like lower(concat('%', :keyword, '%'))
               or lower(coalesce(t.phone, '')) like lower(concat('%', :keyword, '%'))
               or lower(t.country) like lower(concat('%', :keyword, '%'))
            order by t.id
            """)
    List<Tourist> searchByKeyword(@Param("keyword") String keyword);
}
