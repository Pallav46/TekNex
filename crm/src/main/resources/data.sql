-- Insert Dealers
INSERT INTO dealers (name, email, phone, location, date_of_joining, deals_closed, deals_pursued, active_deals, total_revenue, created_at, updated_at) VALUES
('Premium Auto Hub', 'contact@premiumautohub.com', '+91-9876543210', 'Mumbai, Maharashtra', '2020-01-15', 150, 200, 25, 75000000.00, NOW(), NOW()),
('Elite Motors', 'info@elitemotors.com', '+91-9876543211', 'Delhi, NCR', '2019-06-20', 200, 280, 30, 95000000.00, NOW(), NOW()),
('Royal Wheels', 'sales@royalwheels.com', '+91-9876543212', 'Bangalore, Karnataka', '2021-03-10', 120, 180, 20, 60000000.00, NOW(), NOW()),
('Crown Automobiles', 'contact@crownauto.com', '+91-9876543213', 'Pune, Maharashtra', '2020-09-05', 100, 150, 18, 50000000.00, NOW(), NOW());

-- Insert Sales Executives (password: 'password123' hashed with BCrypt)
INSERT INTO sales_executives (name, email, password, phone, dealer_id, date_of_joining, deals_closed, deals_pursued, active_deals, performance_score, available, expertise, created_at, updated_at) VALUES
('Rajesh Kumar', 'rajesh.kumar@premiumautohub.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.QLKpLpQ8HX5N3q0xR3tTc3HK4pzzKNe', '+91-8765432100', 1, '2020-02-01', 45, 60, 8, 85.5, true, 'SUV,Sedan,Luxury', NOW(), NOW()),
('Priya Sharma', 'priya.sharma@premiumautohub.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.QLKpLpQ8HX5N3q0xR3tTc3HK4pzzKNe', '+91-8765432101', 1, '2020-03-15', 38, 55, 7, 78.2, true, 'Hatchback,Sedan,Electric', NOW(), NOW()),
('Amit Patel', 'amit.patel@elitemotors.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.QLKpLpQ8HX5N3q0xR3tTc3HK4pzzKNe', '+91-8765432102', 2, '2019-07-10', 52, 70, 9, 88.7, true, 'SUV,Electric,Luxury', NOW(), NOW()),
('Sneha Reddy', 'sneha.reddy@elitemotors.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.QLKpLpQ8HX5N3q0xR3tTc3HK4pzzKNe', '+91-8765432103', 2, '2019-09-20', 48, 65, 10, 82.5, true, 'Sedan,Hatchback,Compact', NOW(), NOW()),
('Vikram Singh', 'vikram.singh@royalwheels.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.QLKpLpQ8HX5N3q0xR3tTc3HK4pzzKNe', '+91-8765432104', 3, '2021-04-01', 35, 50, 6, 75.3, true, 'SUV,MUV,Commercial', NOW(), NOW()),
('Anita Desai', 'anita.desai@royalwheels.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.QLKpLpQ8HX5N3q0xR3tTc3HK4pzzKNe', '+91-8765432105', 3, '2021-05-10', 30, 45, 5, 72.8, true, 'Hatchback,Sedan,Electric', NOW(), NOW()),
('Suresh Nair', 'suresh.nair@crownauto.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.QLKpLpQ8HX5N3q0xR3tTc3HK4pzzKNe', '+91-8765432106', 4, '2020-10-01', 28, 42, 4, 70.5, true, 'Sedan,SUV,Luxury', NOW(), NOW()),
('Kavita Iyer', 'kavita.iyer@crownauto.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.QLKpLpQ8HX5N3q0xR3tTc3HK4pzzKNe', '+91-8765432107', 4, '2020-11-15', 25, 40, 4, 68.9, true, 'Hatchback,Compact,Electric', NOW(), NOW());

-- Insert Customers (password: 'customer123' hashed with BCrypt)
INSERT INTO customers (name, email, password, phone, address, created_at, updated_at) VALUES
('Arjun Mehta', 'arjun.mehta@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+91-9123456789', 'Andheri West, Mumbai', NOW(), NOW()),
('Neha Gupta', 'neha.gupta@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+91-9123456790', 'Dwarka, Delhi', NOW(), NOW()),
('Rahul Verma', 'rahul.verma@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+91-9123456791', 'Whitefield, Bangalore', NOW(), NOW()),
('Pooja Joshi', 'pooja.joshi@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+91-9123456792', 'Koregaon Park, Pune', NOW(), NOW()),
('Sanjay Kapoor', 'sanjay.kapoor@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+91-9123456793', 'Bandra, Mumbai', NOW(), NOW()),
('Divya Rao', 'divya.rao@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+91-9123456794', 'Indiranagar, Bangalore', NOW(), NOW()),
('Karan Shah', 'karan.shah@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+91-9123456795', 'Saket, Delhi', NOW(), NOW()),
('Anjali Kulkarni', 'anjali.kulkarni@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+91-9123456796', 'Viman Nagar, Pune', NOW(), NOW());
