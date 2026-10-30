INSERT INTO tourists (full_name, email, phone, country, created_at)
SELECT 'Alice Fernando', 'alice.fernando@example.com', '+94771234567', 'Sri Lanka', NOW()
WHERE NOT EXISTS (SELECT 1 FROM tourists WHERE email = 'alice.fernando@example.com');

INSERT INTO tourists (full_name, email, phone, country, created_at)
SELECT 'Daniel Wijesinghe', 'daniel.wijesinghe@example.com', '+94777654321', 'Sri Lanka', NOW()
WHERE NOT EXISTS (SELECT 1 FROM tourists WHERE email = 'daniel.wijesinghe@example.com');

INSERT INTO tourists (full_name, email, phone, country, created_at)
SELECT 'Nadee Jayawardena', 'nadee.jayawardena@example.com', '+94773451234', 'Sri Lanka', NOW()
WHERE NOT EXISTS (SELECT 1 FROM tourists WHERE email = 'nadee.jayawardena@example.com');

INSERT INTO tour_packages (name, description, destination, duration, price, max_travelers, status, image_url, created_at)
SELECT 'Cultural Triangle Escape', 'A heritage-rich itinerary covering Sigiriya, Kandy, and Dambulla.', 'Cultural Triangle', '5 days / 4 nights', 32000.00, 6, 'Active', 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963', NOW()
WHERE NOT EXISTS (SELECT 1 FROM tour_packages WHERE name = 'Cultural Triangle Escape');

INSERT INTO tour_packages (name, description, destination, duration, price, max_travelers, status, image_url, created_at)
SELECT 'Southern Coast Serenity', 'A scenic coastal package featuring Galle, Mirissa, and Unawatuna.', 'Southern Coast', '4 days / 3 nights', 42000.00, 4, 'Active', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e', NOW()
WHERE NOT EXISTS (SELECT 1 FROM tour_packages WHERE name = 'Southern Coast Serenity');

INSERT INTO tour_packages (name, description, destination, duration, price, max_travelers, status, image_url, created_at)
SELECT 'Hill Country Retreat', 'A cool-climate escape through Ella, Nuwara Eliya, and Haputale.', 'Hill Country', '6 days / 5 nights', 51000.00, 5, 'Active', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb', NOW()
WHERE NOT EXISTS (SELECT 1 FROM tour_packages WHERE name = 'Hill Country Retreat');

INSERT INTO bookings (booking_reference, tourist_id, tour_package_id, number_of_people, booking_date, travel_date, total_amount, discount, amount_paid, booking_status, payment_status, special_requests, created_at, updated_at)
SELECT 'BK-2026-1001', t.id, tp.id, 2, NOW(), '2026-11-15', 64000.00, 0.00, 64000.00, 'CONFIRMED', 'PAID', 'Window seat requested on the return flight.', NOW(), NOW()
FROM tourists t, tour_packages tp
WHERE t.email = 'alice.fernando@example.com'
  AND tp.name = 'Cultural Triangle Escape'
  AND NOT EXISTS (SELECT 1 FROM bookings WHERE booking_reference = 'BK-2026-1001');

INSERT INTO bookings (booking_reference, tourist_id, tour_package_id, number_of_people, booking_date, travel_date, total_amount, discount, amount_paid, booking_status, payment_status, special_requests, created_at, updated_at)
SELECT 'BK-2026-1002', t.id, tp.id, 3, NOW(), '2026-12-02', 126000.00, 8000.00, 118000.00, 'CONFIRMED', 'PAID', 'Please arrange a sunset dinner reservation.', NOW(), NOW()
FROM tourists t, tour_packages tp
WHERE t.email = 'daniel.wijesinghe@example.com'
  AND tp.name = 'Southern Coast Serenity'
  AND NOT EXISTS (SELECT 1 FROM bookings WHERE booking_reference = 'BK-2026-1002');

INSERT INTO bookings (booking_reference, tourist_id, tour_package_id, number_of_people, booking_date, travel_date, total_amount, discount, amount_paid, booking_status, payment_status, special_requests, created_at, updated_at)
SELECT 'BK-2026-1003', t.id, tp.id, 2, NOW(), '2027-01-10', 102000.00, 0.00, 0.00, 'PENDING', 'UNPAID', 'Need a deluxe room upgrade if available.', NOW(), NOW()
FROM tourists t, tour_packages tp
WHERE t.email = 'nadee.jayawardena@example.com'
  AND tp.name = 'Hill Country Retreat'
  AND NOT EXISTS (SELECT 1 FROM bookings WHERE booking_reference = 'BK-2026-1003');
