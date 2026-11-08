package com.ceylonexplore.backend.service;

import com.ceylonexplore.backend.dto.AccountResponse;
import com.ceylonexplore.backend.dto.TouristAccountLinkRequest;
import com.ceylonexplore.backend.entity.AccountRole;
import com.ceylonexplore.backend.entity.Tourist;
import com.ceylonexplore.backend.exception.TouristNotFoundException;
import com.ceylonexplore.backend.repository.TouristRepository;
import com.ceylonexplore.backend.repository.UserAccountRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class TouristAccountLinkService {

    private final TouristRepository touristRepository;
    private final UserAccountRepository userAccountRepository;

    public TouristAccountLinkService(
            TouristRepository touristRepository,
            UserAccountRepository userAccountRepository
    ) {
        this.touristRepository = touristRepository;
        this.userAccountRepository = userAccountRepository;
    }

    public AccountResponse linkAccount(Long touristId, TouristAccountLinkRequest request) {
        Tourist tourist = touristRepository.findById(touristId)
                .orElseThrow(() -> new TouristNotFoundException(touristId));
        var account = userAccountRepository.findById(request.accountId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User account was not found."));
        if (account.getRole() != AccountRole.USER) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only traveler accounts can be linked to a tourist.");
        }
        if (touristRepository.existsByUserAccountIdAndIdNot(account.getId(), touristId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This account is already linked to another tourist.");
        }
        tourist.setUserAccount(account);
        touristRepository.save(tourist);
        return AccountResponse.from(account);
    }
}
