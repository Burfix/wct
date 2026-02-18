-- Seed Data for V&A Waterfront Compliance Tracker
-- Run this in Supabase SQL Editor AFTER running create_schema.sql

-- Create Users (password is 'password123' hashed with bcrypt)
INSERT INTO users (id, email, password, name, role, active, "createdAt", "updatedAt") VALUES
('user-manager-001', 'manager@vawaterfront.co.za', '$2b$10$U/3qp6taFoahxkum.BZX9.rtCUkh/zYf3NpKh/jr7bPIo7mvFsFFq', 'Sarah Williams', 'ADMIN', true, NOW(), NOW()),
('user-officer-001', 'officer1@vawaterfront.co.za', '$2b$10$U/3qp6taFoahxkum.BZX9.rtCUkh/zYf3NpKh/jr7bPIo7mvFsFFq', 'James Thompson', 'OFFICER', true, NOW(), NOW()),
('user-officer-002', 'officer2@vawaterfront.co.za', '$2b$10$U/3qp6taFoahxkum.BZX9.rtCUkh/zYf3NpKh/jr7bPIo7mvFsFFq', 'Amara Ndlovu', 'OFFICER', true, NOW(), NOW()),
('user-officer-003', 'officer3@vawaterfront.co.za', '$2b$10$U/3qp6taFoahxkum.BZX9.rtCUkh/zYf3NpKh/jr7bPIo7mvFsFFq', 'David Chen', 'OFFICER', true, NOW(), NOW()),
('user-officer-004', 'officer4@vawaterfront.co.za', '$2b$10$U/3qp6taFoahxkum.BZX9.rtCUkh/zYf3NpKh/jr7bPIo7mvFsFFq', 'Priya Naidoo', 'OFFICER', true, NOW(), NOW()),
('user-officer-005', 'officer5@vawaterfront.co.za', '$2b$10$U/3qp6taFoahxkum.BZX9.rtCUkh/zYf3NpKh/jr7bPIo7mvFsFFq', 'Michael van der Merwe', 'OFFICER', true, NOW(), NOW()),
('user-officer-006', 'officer6@vawaterfront.co.za', '$2b$10$U/3qp6taFoahxkum.BZX9.rtCUkh/zYf3NpKh/jr7bPIo7mvFsFFq', 'Linda Botha', 'OFFICER', true, NOW(), NOW());

-- Create Zones
INSERT INTO zones (id, name, description, active, "order", "createdAt") VALUES
('zone-001', 'Silo District', NULL, true, 0, NOW()),
('zone-002', 'Victoria Wharf - Upper Level', NULL, true, 1, NOW()),
('zone-003', 'Victoria Wharf - Lower Level', NULL, true, 2, NOW()),
('zone-004', 'Waterfront Food Court', NULL, true, 3, NOW()),
('zone-005', 'Quay 4', NULL, true, 4, NOW()),
('zone-006', 'Quay 5', NULL, true, 5, NOW()),
('zone-007', 'Quay 6', NULL, true, 6, NOW()),
('zone-008', 'Watershed', NULL, true, 7, NOW()),
('zone-009', 'Clock Tower Precinct', NULL, true, 8, NOW()),
('zone-010', 'Granger Bay', NULL, true, 9, NOW()),
('zone-011', 'Pierhead', NULL, true, 10, NOW()),
('zone-012', 'V&A Marina', NULL, true, 11, NOW());

-- Create System Settings
INSERT INTO system_settings (id, key, value, description, "updatedAt") VALUES
('setting-001', 'EXPIRY_THRESHOLD_DAYS', '30', 'Days before expiry to show orange status', NOW()),
('setting-002', 'CRITICAL_ACTION_ESCALATION_DAYS', '7', 'Days before critical actions auto-escalate', NOW());

-- Create Peak Periods
INSERT INTO peak_periods (id, name, "startDate", "endDate", tag, active, "createdAt", "updatedAt") VALUES
('period-001', 'Summer Holiday Season', '2026-12-15', '2027-01-15', 'Holiday', true, NOW(), NOW()),
('period-002', 'Easter Weekend', '2026-04-10', '2026-04-13', 'Holiday', true, NOW(), NOW()),
('period-003', 'Cruise Ship Week', '2026-02-20', '2026-02-27', 'Cruise Week', true, NOW(), NOW());

-- Create Sample Stores (20 stores as examples - you can add more manually)
INSERT INTO stores (id, "storeCode", name, zone, floor, "storeType", "highFootTraffic", "tradingHours", status, "overallStatus", "priorityScore", "createdAt", "updatedAt", "createdById") VALUES
-- F&B Stores
('store-fb-001', 'FB001', 'Ocean Basket', 'Waterfront Food Court', 'Ground', 'FB', true, '09:00 - 21:00', 'active', 'GREY', 0, NOW(), NOW(), 'user-manager-001'),
('store-fb-002', 'FB002', 'Spur', 'Victoria Wharf - Lower Level', 'Lower', 'FB', true, '09:00 - 21:00', 'active', 'GREY', 0, NOW(), NOW(), 'user-manager-001'),
('store-fb-003', 'FB003', 'Col''Cacchio', 'Quay 5', 'Ground', 'FB', false, '09:00 - 21:00', 'active', 'GREY', 0, NOW(), NOW(), 'user-manager-001'),
('store-fb-004', 'FB004', 'Harbour House', 'Quay 4', 'Ground', 'FB', true, '09:00 - 21:00', 'active', 'GREY', 0, NOW(), NOW(), 'user-manager-001'),
('store-fb-005', 'FB005', 'Tiger''s Milk', 'Victoria Wharf - Upper Level', 'Upper', 'FB', true, '09:00 - 21:00', 'active', 'GREY', 0, NOW(), NOW(), 'user-manager-001'),

-- Retail Stores
('store-rt-001', 'RT001', 'Woolworths', 'Victoria Wharf - Lower Level', 'Lower', 'RETAIL', true, '09:00 - 20:00', 'active', 'GREY', 0, NOW(), NOW(), 'user-manager-001'),
('store-rt-002', 'RT002', 'H&M', 'Victoria Wharf - Upper Level', 'Upper', 'RETAIL', true, '09:00 - 20:00', 'active', 'GREY', 0, NOW(), NOW(), 'user-manager-001'),
('store-rt-003', 'RT003', 'Zara', 'Victoria Wharf - Upper Level', 'Upper', 'RETAIL', true, '09:00 - 20:00', 'active', 'GREY', 0, NOW(), NOW(), 'user-manager-001'),
('store-rt-004', 'RT004', 'Mr Price', 'Victoria Wharf - Lower Level', 'Lower', 'RETAIL', true, '09:00 - 20:00', 'active', 'GREY', 0, NOW(), NOW(), 'user-manager-001'),
('store-rt-005', 'RT005', 'Exclusive Books', 'Watershed', 'Ground', 'RETAIL', false, '09:00 - 20:00', 'active', 'GREY', 0, NOW(), NOW(), 'user-manager-001'),

-- Luxury Stores
('store-lx-001', 'LX001', 'Louis Vuitton', 'Victoria Wharf - Upper Level', 'Upper', 'LUXURY', false, '10:00 - 19:00', 'active', 'GREY', 0, NOW(), NOW(), 'user-manager-001'),
('store-lx-002', 'LX002', 'Gucci', 'Victoria Wharf - Upper Level', 'Upper', 'LUXURY', false, '10:00 - 19:00', 'active', 'GREY', 0, NOW(), NOW(), 'user-manager-001'),
('store-lx-003', 'LX003', 'Rolex', 'Clock Tower Precinct', 'Upper', 'LUXURY', false, '10:00 - 19:00', 'active', 'GREY', 0, NOW(), NOW(), 'user-manager-001'),

-- Services
('store-sv-001', 'SV001', 'FNB', 'Victoria Wharf - Lower Level', 'Ground', 'SERVICES', true, '08:00 - 18:00', 'active', 'GREY', 0, NOW(), NOW(), 'user-manager-001'),
('store-sv-002', 'SV002', 'Virgin Active', 'Granger Bay', 'Ground', 'SERVICES', true, '08:00 - 18:00', 'active', 'GREY', 0, NOW(), NOW(), 'user-manager-001'),
('store-sv-003', 'SV003', 'Dischem Pharmacy', 'Victoria Wharf - Lower Level', 'Lower', 'SERVICES', true, '08:00 - 18:00', 'active', 'GREY', 0, NOW(), NOW(), 'user-manager-001'),

-- Attractions
('store-at-001', 'AT001', 'Two Oceans Aquarium', 'Quay 4', NULL, 'ATTRACTION', true, '09:00 - 18:00', 'active', 'GREY', 0, NOW(), NOW(), 'user-manager-001'),
('store-at-002', 'AT002', 'Zeitz MOCAA', 'Silo District', NULL, 'ATTRACTION', true, '09:00 - 18:00', 'active', 'GREY', 0, NOW(), NOW(), 'user-manager-001'),
('store-at-003', 'AT003', 'Watershed Craft Market', 'Watershed', NULL, 'ATTRACTION', true, '09:00 - 18:00', 'active', 'GREY', 0, NOW(), NOW(), 'user-manager-001'),
('store-at-004', 'AT004', 'Cape Wheel', 'Waterfront Food Court', NULL, 'ATTRACTION', true, '09:00 - 18:00', 'active', 'GREY', 0, NOW(), NOW(), 'user-manager-001');

-- Assign stores to officers
INSERT INTO store_assignments (id, "storeId", "userId", "assignedAt", "assignedBy", active) VALUES
('assign-001', 'store-fb-001', 'user-officer-001', NOW(), 'user-manager-001', true),
('assign-002', 'store-fb-002', 'user-officer-002', NOW(), 'user-manager-001', true),
('assign-003', 'store-fb-003', 'user-officer-003', NOW(), 'user-manager-001', true),
('assign-004', 'store-fb-004', 'user-officer-004', NOW(), 'user-manager-001', true),
('assign-005', 'store-fb-005', 'user-officer-005', NOW(), 'user-manager-001', true),
('assign-006', 'store-rt-001', 'user-officer-006', NOW(), 'user-manager-001', true),
('assign-007', 'store-rt-002', 'user-officer-001', NOW(), 'user-manager-001', true),
('assign-008', 'store-rt-003', 'user-officer-002', NOW(), 'user-manager-001', true),
('assign-009', 'store-rt-004', 'user-officer-003', NOW(), 'user-manager-001', true),
('assign-010', 'store-rt-005', 'user-officer-004', NOW(), 'user-manager-001', true),
('assign-011', 'store-lx-001', 'user-officer-005', NOW(), 'user-manager-001', true),
('assign-012', 'store-lx-002', 'user-officer-006', NOW(), 'user-manager-001', true),
('assign-013', 'store-lx-003', 'user-officer-001', NOW(), 'user-manager-001', true),
('assign-014', 'store-sv-001', 'user-officer-002', NOW(), 'user-manager-001', true),
('assign-015', 'store-sv-002', 'user-officer-003', NOW(), 'user-manager-001', true),
('assign-016', 'store-sv-003', 'user-officer-004', NOW(), 'user-manager-001', true),
('assign-017', 'store-at-001', 'user-officer-005', NOW(), 'user-manager-001', true),
('assign-018', 'store-at-002', 'user-officer-006', NOW(), 'user-manager-001', true),
('assign-019', 'store-at-003', 'user-officer-001', NOW(), 'user-manager-001', true),
('assign-020', 'store-at-004', 'user-officer-002', NOW(), 'user-manager-001', true);

-- Create Compliance Items for F&B stores (with varied statuses)
INSERT INTO compliance_items (id, "storeId", category, "subCategory", status, required, "expiryDate", "lastVerifiedDate", "createdAt", "updatedAt") VALUES
-- Store FB001 - Ocean Basket (GREEN)
('comp-fb001-001', 'store-fb-001', 'OHS_RISK_ASSESSMENT', NULL, 'GREEN', true, NOW() + INTERVAL '200 days', NOW(), NOW(), NOW()),
('comp-fb001-002', 'store-fb-001', 'EXTRACTION_CERT', NULL, 'GREEN', true, NOW() + INTERVAL '180 days', NOW(), NOW(), NOW()),
('comp-fb001-003', 'store-fb-001', 'FIRE_SUPPRESSION_CERT', NULL, 'GREEN', true, NOW() + INTERVAL '220 days', NOW(), NOW(), NOW()),
('comp-fb001-004', 'store-fb-001', 'FIRE_EQUIPMENT', NULL, 'GREEN', true, NOW() + INTERVAL '150 days', NOW(), NOW(), NOW()),
('comp-fb001-005', 'store-fb-001', 'TRAINING', NULL, 'GREEN', true, NOW() + INTERVAL '190 days', NOW(), NOW(), NOW()),
('comp-fb001-006', 'store-fb-001', 'FIRST_AID', NULL, 'GREEN', true, NOW() + INTERVAL '160 days', NOW(), NOW(), NOW()),

-- Store FB002 - Spur (ORANGE - expiring soon)
('comp-fb002-001', 'store-fb-002', 'OHS_RISK_ASSESSMENT', NULL, 'ORANGE', true, NOW() + INTERVAL '15 days', NOW(), NOW(), NOW()),
('comp-fb002-002', 'store-fb-002', 'EXTRACTION_CERT', NULL, 'GREEN', true, NOW() + INTERVAL '180 days', NOW(), NOW(), NOW()),
('comp-fb002-003', 'store-fb-002', 'FIRE_SUPPRESSION_CERT', NULL, 'ORANGE', true, NOW() + INTERVAL '20 days', NOW(), NOW(), NOW()),
('comp-fb002-004', 'store-fb-002', 'FIRE_EQUIPMENT', NULL, 'GREEN', true, NOW() + INTERVAL '150 days', NOW(), NOW(), NOW()),
('comp-fb002-005', 'store-fb-002', 'TRAINING', NULL, 'GREEN', true, NOW() + INTERVAL '190 days', NOW(), NOW(), NOW()),
('comp-fb002-006', 'store-fb-002', 'FIRST_AID', NULL, 'ORANGE', true, NOW() + INTERVAL '10 days', NOW(), NOW(), NOW()),

-- Store FB003 - Col'Cacchio (RED - expired or missing)
('comp-fb003-001', 'store-fb-003', 'OHS_RISK_ASSESSMENT', NULL, 'RED', true, NOW() - INTERVAL '30 days', NOW(), NOW(), NOW()),
('comp-fb003-002', 'store-fb-003', 'EXTRACTION_CERT', NULL, 'RED', true, NULL, NULL, NOW(), NOW()),
('comp-fb003-003', 'store-fb-003', 'FIRE_SUPPRESSION_CERT', NULL, 'GREEN', true, NOW() + INTERVAL '180 days', NOW(), NOW(), NOW()),
('comp-fb003-004', 'store-fb-003', 'FIRE_EQUIPMENT', NULL, 'RED', true, NOW() - INTERVAL '15 days', NOW(), NOW(), NOW()),
('comp-fb003-005', 'store-fb-003', 'TRAINING', NULL, 'GREEN', true, NOW() + INTERVAL '190 days', NOW(), NOW(), NOW()),
('comp-fb003-006', 'store-fb-003', 'FIRST_AID', NULL, 'GREEN', true, NOW() + INTERVAL '160 days', NOW(), NOW(), NOW()),

-- Retail stores - standard compliance (OHS, Fire Equipment, Training, First Aid)
-- Store RT001 - Woolworths (GREEN)
('comp-rt001-001', 'store-rt-001', 'OHS_RISK_ASSESSMENT', NULL, 'GREEN', true, NOW() + INTERVAL '200 days', NOW(), NOW(), NOW()),
('comp-rt001-002', 'store-rt-001', 'FIRE_EQUIPMENT', NULL, 'GREEN', true, NOW() + INTERVAL '150 days', NOW(), NOW(), NOW()),
('comp-rt001-003', 'store-rt-001', 'TRAINING', NULL, 'GREEN', true, NOW() + INTERVAL '190 days', NOW(), NOW(), NOW()),
('comp-rt001-004', 'store-rt-001', 'FIRST_AID', NULL, 'GREEN', true, NOW() + INTERVAL '160 days', NOW(), NOW(), NOW()),

-- Store RT002 - H&M (ORANGE)
('comp-rt002-001', 'store-rt-002', 'OHS_RISK_ASSESSMENT', NULL, 'ORANGE', true, NOW() + INTERVAL '20 days', NOW(), NOW(), NOW()),
('comp-rt002-002', 'store-rt-002', 'FIRE_EQUIPMENT', NULL, 'GREEN', true, NOW() + INTERVAL '150 days', NOW(), NOW(), NOW()),
('comp-rt002-003', 'store-rt-002', 'TRAINING', NULL, 'GREEN', true, NOW() + INTERVAL '190 days', NOW(), NOW(), NOW()),
('comp-rt002-004', 'store-rt-002', 'FIRST_AID', NULL, 'ORANGE', true, NOW() + INTERVAL '15 days', NOW(), NOW(), NOW());

-- Display seed completion message
SELECT '✅ Seed data created successfully!' AS message,
       (SELECT COUNT(*) FROM users) AS total_users,
       (SELECT COUNT(*) FROM stores) AS total_stores,
       (SELECT COUNT(*) FROM compliance_items) AS total_compliance_items;
