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

-- MEDICAL REPORTS TABLE
CREATE TABLE IF NOT EXISTS medical_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    report_name VARCHAR(255) NOT NULL,
    report_date DATE NOT NULL,
    file_path TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
('Dr. K.Senthil', 'Cardiology', 'GH Thanjavur', 'Thanjavur', 'Thanjavur', 10.7869, 79.1378, '04362-239031'),
-- KANYAKUMARI
('Dr. A. Mary Sheela', 'General Medicine', 'GH Nagercoil', 'Kanyakumari', 'Agastheeswaram', 8.1773, 77.4307, '04652-242031'),
('Dr. R. Rajesh Kumar', 'Pediatrics', 'GH Padmanabhapuram', 'Kanyakumari', 'Thovalai', 8.2333, 77.5333, '04652-223456'),
('Dr. S. Lakshmi', 'Obstetrics', 'PHC Rajakkamangalam', 'Kanyakumari', 'Rajakkamangalam', 8.1158, 77.3804, '04652-264123'),
('Dr. V. Suresh', 'General Surgery', 'GH Colachel', 'Kanyakumari', 'Colachel', 8.1823, 77.2065, '04651-222345'),
('Dr. P. Anitha', 'General Physician', 'PHC Munchirai', 'Kanyakumari', 'Munchirai', 8.3167, 77.1667, '9445012345'),
-- KALLAKURICHI
('Dr. M. Rajendran', 'General Medicine', 'GH Kallakurichi', 'Kallakurichi', 'Kallakurichi', 11.7398, 78.9598, '04323-222001'),
('Dr. K. Priya', 'Pediatrics', 'PHC Alathur', 'Kallakurichi', 'Chinnasalem', 11.6333, 78.8500, '9445023456'),
('Dr. R. Siva', 'Orthopedics', 'PHC Kachirapalayam', 'Kallakurichi', 'Kachirapalayam', 11.4000, 78.7667, '9445034567'),
('Dr. N. Geetha', 'Obstetrics', 'PHC Manalurpet', 'Kallakurichi', 'Manalurpet', 11.7333, 78.9833, '9445045678'),
-- KANCHIPURAM
('Dr. T. Venkatesan', 'General Medicine', 'GH Kanchipuram', 'Kanchipuram', 'Kanchipuram', 12.8348, 79.7179, '044-27237420'),
('Dr. L. Meenakshi', 'General Surgery', 'GH Uthiramerur', 'Kanchipuram', 'Uthiramerur', 12.5967, 79.7533, '044-27552121'),
('Dr. S. Murugan', 'Pediatrics', 'PHC Walajabad', 'Kanchipuram', 'Walajabad', 12.7333, 79.9833, '9445056789'),
-- KRISHNAGIRI
('Dr. G. Palani', 'General Medicine', 'GH Krishnagiri', 'Krishnagiri', 'Krishnagiri', 12.5267, 78.2160, '04343-232200'),
('Dr. R. Anjali', 'Obstetrics', 'GH Dharmapuri', 'Krishnagiri', 'Dharmapuri', 12.1279, 78.1564, '04342-260273'),
('Dr. K. Mani', 'Orthopedics', 'PHC Vellore', 'Krishnagiri', 'Vellore', 12.9165, 79.1325, '9445067890'),
-- MAYILADUTHURAI
('Dr. P. Suresh Kumar', 'General Medicine', 'GH Mayiladuthurai', 'Mayiladuthurai', 'Mayiladuthurai', 11.1061, 79.6504, '04364-222001'),
('Dr. V. Uma', 'Pediatrics', 'PHC Seerkazhi', 'Mayiladuthurai', 'Seerkazhi', 11.2405, 79.7963, '9445078901'),
-- NAGAPATTINAM
('Dr. A. Ramachandran', 'General Medicine', 'GH Nagapattinam', 'Nagapattinam', 'Nagapattinam', 10.7905, 79.8426, '04365-242201'),
('Dr. S. Jayalakshmi', 'Obstetrics', 'PHC Vedaranyam', 'Nagapattinam', 'Vedaranyam', 10.3618, 79.8489, '9445089012'),
-- NAMAKKAL
('Dr. R. Balakrishnan', 'General Medicine', 'GH Namakkal', 'Namakkal', 'Namakkal', 11.2164, 78.1651, '04286-230200'),
('Dr. N. Saroja', 'General Surgery', 'GH Rasipuram', 'Namakkal', 'Rasipuram', 11.4553, 78.1835, '04287-222345'),
-- NILGIRIS
('Dr. M. Thangaraj', 'General Medicine', 'GH Udhagamandalam', 'Nilgiris', 'Udhagamandalam', 11.4077, 76.6941, '0423-2442241'),
('Dr. K. Revathi', 'Pediatrics', 'GH Coonoor', 'Nilgiris', 'Coonoor', 11.3430, 76.7705, '0423-2230567'),
-- PERAMBALUR
('Dr. S. Krishnan', 'General Medicine', 'GH Perambalur', 'Perambalur', 'Perambalur', 11.1116, 78.9005, '04328-222001'),
('Dr. P. Geetha', 'Obstetrics', 'PHC Ariyalur', 'Perambalur', 'Ariyalur', 11.1057, 79.2088, '9445090123'),
-- PUDUKKOTTAI
('Dr. R. Anbu', 'Orthopedics', 'PHC Aranthangi', 'Pudukkottai', 'Aranthangi', 10.4170, 78.9830, '9445101234'),
-- RAMANATHAPURAM
('Dr. V. Rajendran', 'General Medicine', 'GH Ramanathapuram', 'Ramanathapuram', 'Ramanathapuram', 9.3617, 78.8289, '04567-222001'),
('Dr. L. Saraswathi', 'Pediatrics', 'PHC Rameswaram', 'Ramanathapuram', 'Rameswaram', 9.2878, 79.3179, '9445112345'),
-- RANIPET
('Dr. K. Senthil', 'Cardiology', 'GH Ranipet', 'Ranipet', 'Ranipet', 12.9258, 79.1621, '04172-222001'),
('Dr. T. Meena', 'General Surgery', 'PHC Arcot', 'Ranipet', 'Arcot', 12.9014, 79.3159, '9445123456'),
-- SALEM
('Dr. G. Murugesan', 'General Medicine', 'GH Salem', 'Salem', 'Salem', 11.6643, 78.1460, '0427-2333333'),
('Dr. R. Kavitha', 'Obstetrics', 'GH Mettur', 'Salem', 'Mettur', 11.7864, 77.8003, '9445134567'),
-- SIVAGANGA
('Dr. P. Loganathan', 'General Medicine', 'GH Sivaganga', 'Sivaganga', 'Sivaganga', 10.0854, 78.4769, '04575-222001'),
('Dr. S. Rajalakshmi', 'Pediatrics', 'PHC Manamadurai', 'Sivaganga', 'Manamadurai', 9.9833, 78.3833, '9445145678'),
-- TENKASI
('Dr. A. Vijayakumar', 'General Medicine', 'GH Tenkasi', 'Tenkasi', 'Tenkasi', 8.9676, 77.3141, '04633-222001'),
('Dr. N. Prema', 'General Surgery', 'PHC Sankarankovil', 'Tenkasi', 'Sankarankovil', 8.9500, 77.5500, '9445156789'),
-- THENI
('Dr. R. Subramanian', 'General Medicine', 'GH Theni', 'Theni', 'Theni', 10.0107, 77.9850, '04546-222001'),
('Dr. M. Anuradha', 'Obstetrics', 'PHC Bodi', 'Theni', 'Bodi', 9.8833, 77.3167, '9445167890'),
-- THOOTHUKUDI
('Dr. S. Paulraj', 'General Medicine', 'GH Thoothukudi', 'Thoothukudi', 'Thoothukudi', 8.7642, 78.1348, '0461-222001'),
('Dr. V. Shanthi', 'Pediatrics', 'GH Tiruchendur', 'Thoothukudi', 'Tiruchendur', 8.4975, 78.1337, '9445178901'),
-- TIRUNELVELI
('Dr. K. Ramasamy', 'General Medicine', 'GH Tirunelveli', 'Tirunelveli', 'Tirunelveli', 8.7139, 77.7515, '0462-2501354'),
('Dr. P. Rani', 'Orthopedics', 'GH Cheranmahadevi', 'Tirunelveli', 'Cheranmahadevi', 8.7167, 77.5500, '9445189012'),
-- TIRUPATHUR
('Dr. M. Govindan', 'General Medicine', 'GH Tirupathur', 'Tirupathur', 'Tirupathur', 12.4917, 78.5667, '04179-222001'),
('Dr. S. Tamilselvi', 'Obstetrics', 'PHC Jolarpet', 'Tirupathur', 'Jolarpet', 12.5667, 78.5833, '9445190123'),
-- TIRUPPUR
('Dr. R. Dhanalakshmi', 'General Medicine', 'GH Palladam', 'Tiruppur', 'Palladam', 10.9905, 77.3195, '04255-222001'),
('Dr. V. Thirugnanasambandham', 'Anesthesia', 'GH Kangeyam', 'Tiruppur', 'Kangeyam', 10.9980, 77.6430, '9942360709'),
-- TIRUVALLUR
('Dr. A. Selvam', 'General Medicine', 'GH Thiruvallur', 'Tiruvallur', 'Thiruvallur', 13.1425, 80.0106, '044-27660255'),
('Dr. N. Logeshwaran', 'General Physician', 'PHC Gummidipoondi', 'Tiruvallur', 'Gummidipoondi', 13.4083, 80.1167, '9445201234'),
-- VELLORE
('Dr. T. Palaniappan', 'General Medicine', 'GH Vellore', 'Vellore', 'Vellore', 12.9165, 79.1325, '0416-2223444'),
('Dr. R. Indirani', 'Pediatrics', 'GH Gudiyatham', 'Vellore', 'Gudiyatham', 12.9417, 79.1833, '9445212345'),
-- VIRUDHUNAGAR
('Dr. S. Manikandan', 'General Medicine', 'GH Virudhunagar', 'Virudhunagar', 'Virudhunagar', 9.5833, 77.9667, '04562-222001'),
('Dr. L. Vasanthi', 'Obstetrics', 'PHC Sattur', 'Virudhunagar', 'Sattur', 9.3667, 77.8000, '9445223456');

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
