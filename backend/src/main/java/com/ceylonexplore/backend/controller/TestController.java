package com.ceylonexplore.backend.controller;

import org.springframework.dao.DataAccessException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/test")
public class TestController {

    private static final Logger logger = LoggerFactory.getLogger(TestController.class);

    private final JdbcTemplate jdbcTemplate;

    public TestController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public Map<String, Object> testApi() {
        return Map.of(
                "success", true,
                "message", "Ceylon Explore Backend is running successfully!"
        );
    }

    @GetMapping("/database")
    public ResponseEntity<Map<String, Object>> testDatabase() {
        try {
            Integer result = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            if (result == null || result != 1) {
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                        "success", false,
                        "message", "The database connection test did not return the expected result."
                ));
            }
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Database connection is successful."
            ));
        } catch (DataAccessException exception) {
            logger.warn("Database connectivity check failed ({})", exception.getClass().getSimpleName());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                    "success", false,
                    "message", "Unable to connect to the configured database. Check that MySQL is running and the database settings are correct."
            ));
        }
    }
}
