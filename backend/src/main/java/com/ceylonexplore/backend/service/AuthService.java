package com.ceylonexplore.backend.service;

import com.ceylonexplore.backend.dto.AccountResponse;
import com.ceylonexplore.backend.dto.RegisterRequest;
import com.ceylonexplore.backend.entity.AccountRole;
import com.ceylonexplore.backend.entity.UserAccount;
import com.ceylonexplore.backend.exception.DuplicateAccountEmailException;
import com.ceylonexplore.backend.repository.UserAccountRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
@Transactional(readOnly = true)
public class AuthService {

    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserAccountRepository userAccountRepository, PasswordEncoder passwordEncoder) {
        this.userAccountRepository = userAccountRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public AccountResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (userAccountRepository.existsByEmailIgnoreCase(email)) {
            throw new DuplicateAccountEmailException();
        }

        UserAccount account = new UserAccount(
                request.fullName().trim(),
                email,
                passwordEncoder.encode(request.password()),
                AccountRole.USER,
                true
        );
        return AccountResponse.from(userAccountRepository.save(account));
    }

    public AccountResponse getAccountResponse(String email) {
        UserAccount account = userAccountRepository.findByEmailIgnoreCase(normalizeEmail(email))
                .orElseThrow(() -> new IllegalStateException("Authenticated account is no longer available."));
        return AccountResponse.from(account);
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
