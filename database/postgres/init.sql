-- PostgreSQL Initialization Script for MediBuddy CareLink

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================================
-- USERS & PROFILES
-- ========================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('CLIENT', 'CARETAKER', 'DOCTOR', 'admin')) DEFAULT 'CLIENT',
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    age INTEGER,
    gender VARCHAR(20),
    village_id VARCHAR(50) DEFAULT 'default',
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================================
-- DOCTORS
-- ========================================================
CREATE TABLE doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    specialization VARCHAR(100),
    hospital_name VARCHAR(150),
    district VARCHAR(100),
    taluk VARCHAR(100),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    availability_status BOOLEAN DEFAULT TRUE,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'DOCTOR',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE family_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    primary_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    member_id UUID REFERENCES users(id) ON DELETE CASCADE,
    relationship VARCHAR(50),
    UNIQUE(primary_user_id, member_id)
);

CREATE TABLE health_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
    factors JSONB,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================================
-- EMERGENCY & CONTACTS
-- ========================================================
CREATE TABLE emergency_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    relationship VARCHAR(50),
    priority INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE emergency_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    condition TEXT,
    symptoms JSONB,
    status VARCHAR(20) CHECK (status IN ('active', 'resolved', 'cancelled')) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    cancelled_at TIMESTAMP
);

-- ========================================================
-- MEDICINES
-- ========================================================
CREATE TABLE medicines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    dosage VARCHAR(50),
    frequency VARCHAR(50),
    times JSONB, -- Array of strings e.g. ["08:00", "20:00"]
    notes TEXT,
    prescribed_by VARCHAR(100),
    start_date DATE,
    end_date DATE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE dose_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medicine_id UUID REFERENCES medicines(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) CHECK (status IN ('taken', 'skipped', 'pending')),
    log_date DATE NOT NULL,
    taken_at TIMESTAMP,
    notes TEXT,
    UNIQUE(medicine_id, log_date)
);

-- ========================================================
-- MESSAGING & CHAT
-- ========================================================
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE conversation_members (
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    member_id UUID REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (conversation_id, member_id)
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'text',
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read BOOLEAN DEFAULT FALSE
);

-- ========================================================
-- COMMUNITY & ANALYTICS
-- ========================================================
CREATE TABLE community_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- usually CHW id
    disease VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    age INTEGER,
    gender VARCHAR(20),
    severity INTEGER,
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Note: triage_logs are stored in MongoDB as specified in the architecture,
-- but we create a backup summary table here for quick SQL analytics if needed.
CREATE TABLE triage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    result JSONB NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50),
    title VARCHAR(255),
    body TEXT,
    data JSONB,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Set timezone to Asia/Kolkata
SET TIME ZONE 'Asia/Kolkata';

-- Default Indexes for performance
CREATE INDEX idx_medicines_user ON medicines(user_id) WHERE active = TRUE;
CREATE INDEX idx_dose_logs_date ON dose_logs(user_id, log_date);
CREATE INDEX idx_triage_logs_date ON triage_logs(created_at);
CREATE INDEX idx_community_cases_disease ON community_cases(disease, reported_at);

-- ========================================================
-- SEED DATA: DOCTORS (Tamil Nadu Government Facilities)
-- ========================================================
INSERT INTO doctors (name, specialization, hospital_name, district, taluk, latitude, longitude, phone) VALUES
('Dr. Aravazhi K', 'General Medicine', 'Rajiv Gandhi Govt General Hospital', 'Chennai', 'Park Town', 13.0827, 80.2707, '044-25305000'),
('Dr. B.Vanithamalar', 'General Medicine', 'Stanley Medical College Hospital', 'Chennai', 'Royapuram', 13.3103, 80.2885, '044-25281351'),
('Dr. Vani G', 'General Medicine', 'Kilpauk Medical College Hospital', 'Chennai', 'Kilpauk', 13.0827, 80.2631, '044-28364951'),
('Dr. Rajan Sharma', 'General Physician', 'Kalyan PHC', 'Chennai', 'Sholinganallur', 13.0800, 80.2700, '9998887776'),
('Dr. Priya M', 'General Physician', 'MKB Nagar PHC', 'Chennai', 'Perambur', 13.1200, 80.2400, '9444001234'),
('Dr. Mugunthan S', 'General Medicine', 'Chengalpattu Medical College Hospital', 'Chengalpattu', 'Chengalpattu', 12.6818, 80.1254, '044-27429333'),
('Dr. A. Tamilvanan', 'Orthopedics', 'GH Chromepet', 'Chengalpattu', 'Tambaram', 12.9398, 80.1455, '9789721967'),
('Dr. R. Lakshmi', 'Obstetrics', 'GH Cheyyur', 'Chengalpattu', 'Cheyyur', 12.4064, 80.1863, '9947589042'),
('Dr. S. Kumar', 'General Physician', 'GH Madhurantakam', 'Chengalpattu', 'Maduranthakam', 12.4961, 79.9896, '8056169997'),
('Dr. N. Priyadharshini', 'Pediatrics', 'PHC Thirupporur', 'Chengalpattu', 'Thirupporur', 12.7600, 80.2400, '9445012345'),
('Dr. Dhanalakshmi', 'General Medicine', 'GH Pollachi', 'Coimbatore', 'Pollachi', 10.6576, 77.0088, '04259-224204'),
('Dr. Kannan Maharajan', 'General Surgery', 'GH Metupalayam', 'Coimbatore', 'Metupalayam', 11.3036, 76.9527, '9003888788'),
('Dr. Dhuvarakesh', 'General Medicine', 'GH Valparai', 'Coimbatore', 'Valparai', 10.3237, 77.0045, '9445504992'),
('Dr. Vinodh Kumar', 'Emergency Medicine', 'GH Coimbatore', 'Coimbatore', 'Coimbatore North', 11.0168, 76.9558, '0422-2305471'),
('Dr. Selvam R', 'General Medicine', 'Annal Gandhi Memorial GH', 'Tiruchirappalli', 'Trichy Urban', 10.7905, 78.7047, '0431-2771465'),
('Dr. Kathir M', 'General Medicine', 'GH Lalgudi', 'Tiruchirappalli', 'Lalgudi', 10.8680, 78.8170, '0431-2500225'),
('Dr. Sriram S', 'Pediatrics', 'Srirangam GH', 'Tiruchirappalli', 'Srirangam', 10.8570, 78.6912, '0431-2430241'),
('Dr. P.T.Rani', 'General Medicine', 'GH Gingee', 'Viluppuram', 'Gingee', 12.2533, 79.7374, '04145-222015'),
('Dr. Rajesh K', 'General Surgery', 'GH Tindivanam', 'Viluppuram', 'Tindivanam', 12.2455, 79.6504, '04147-222250'),
('Dr. S.Mohamed Raffi', 'General Medicine', 'Govt Rajaji Hospital', 'Madurai', 'Madurai North', 9.9252, 78.1198, '0452-2531471'),
('Dr. Arul J', 'Orthopedics', 'GH Madurai', 'Madurai', 'Madurai South', 9.9194, 78.1198, '0452-2531985'),
('Dr. R.Ravishankar', 'General Medicine', 'GH Dharmapuri', 'Dharmapuri', 'Dharmapuri', 12.1279, 78.1564, '04342-260273'),
('Dr. R.Gopalakrishnan', 'General Medicine', 'GH Dindigul', 'Dindigul', 'Dindigul', 10.3682, 77.9816, '0451-2552100'),
('Dr. K.Saravanan', 'General Physician', 'GH Erode', 'Erode', 'Erode', 11.3410, 77.7155, '0424-2253738'),
('Dr. Indirani A', 'General Medicine', 'GH Karur', 'Karur', 'Karur', 10.9590, 78.0784, '04324-260100'),
('Dr. M.S.Kumar', 'General Medicine', 'GH Pudukkottai', 'Pudukkottai', 'Pudukkottai', 10.5215, 78.8217, '04322-222864'),
('Dr. K.Senthil', 'Cardiology', 'GH Thanjavur', 'Thanjavur', 'Thanjavur', 10.7869, 79.1378, '04362-239031');

-- Additional high-traffic markers from the provided table
INSERT INTO doctors (name, specialization, hospital_name, district, taluk, latitude, longitude, phone) VALUES
('General Doctor', 'General', 'Kalyan PHC', 'Chennai', 'Sholinganallur', 13.0800, 80.2700, '9998887776'),
('General Doctor', 'General', 'GH Cheyyur', 'Chengalpattu', 'Cheyyur', 12.4064, 80.1863, '9947589042'),
('General Doctor', 'General', 'AIIMS Delhi', 'South Delhi', 'Ansari Nagar', 28.5675, 77.2038, '011-26588500'),
('General Doctor', 'General', 'Safdarjung Hospital', 'South Delhi', 'Ansari Nagar', 28.5766, 77.2025, '011-26165060'),
('General Doctor', 'General', 'PGIMER', 'Chandigarh', 'Sector 12', 30.7533, 76.7852, '0172-2747585'),
('General Doctor', 'General', 'GH Coimbatore', 'Coimbatore', 'Coimbatore North', 11.0168, 76.9558, 'Not listed'),
('General Doctor', 'General', 'GH Trivandrum', 'Thiruvananthapuram', 'Kazhakkoottam', 8.5241, 76.9354, '0471-2442550'),
('General Doctor', 'General', '24x7 PHC Kunnathukal', 'Thiruvananthapuram', 'Kunnathukal', 8.5833, 76.9167, '0471-2250077'),
('General Doctor', 'General', 'GH Ariyalur', 'Ariyalur', 'Ariyalur', 11.1057, 79.2088, 'Not listed');
