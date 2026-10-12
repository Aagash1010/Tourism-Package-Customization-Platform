package com.ceylonexplore.backend.config;

import com.ceylonexplore.backend.entity.AccountRole;
import com.ceylonexplore.backend.entity.UserAccount;
import com.ceylonexplore.backend.repository.UserAccountRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Component
public class InitialAdminInitializer implements ApplicationRunner {

    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final String fullName;
    private final String email;
    private final String password;

    public InitialAdminInitializer(
            UserAccountRepository userAccountRepository,
            PasswordEncoder passwordEncoder,
            @Value("${INITIAL_ADMIN_NAME:}") String fullName,
            @Value("${INITIAL_ADMIN_EMAIL:}") String email,
            @Value("${INITIAL_ADMIN_PASSWORD:}") String password
    ) {
        this.userAccountRepository = userAccountRepository;
        this.passwordEncoder = passwordEncoder;
        this.fullName = fullName;
        this.email = email;
        this.password = password;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (fullName.isBlank() && email.isBlank() && password.isBlank()) {
            return;
        }
        if (fullName.isBlank() || email.isBlank() || password.isBlank()) {
            throw new IllegalStateException(
                    "Set INITIAL_ADMIN_NAME, INITIAL_ADMIN_EMAIL, and INITIAL_ADMIN_PASSWORD together."
            );
        }
        if (password.length() < 8 || password.length() > 72) {
            throw new IllegalStateException("INITIAL_ADMIN_PASSWORD must contain between 8 and 72 characters.");
        }

        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        userAccountRepository.findByEmailIgnoreCase(normalizedEmail).ifPresentOrElse(account -> {
            if (account.getRole() != AccountRole.ADMIN) {
                throw new IllegalStateException(
                        "The configured initial admin email already belongs to a non-admin account."
                );
            }
        }, () -> userAccountRepository.save(new UserAccount(
                fullName.trim(),
                normalizedEmail,
                passwordEncoder.encode(password),
                AccountRole.ADMIN,
                true
        )));
    }
}
