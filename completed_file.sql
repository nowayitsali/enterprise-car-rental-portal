/*
    EECS 3421 Group Project
    Enterprise Rent-A-Car Database Implementation
    Microsoft SQL Server (T-SQL)

    I created this script from our revised ER diagram.
    I included:
      1. Database and table creation
      2. Primary keys, foreign keys, UNIQUE constraints, CHECK constraints, and defaults
      3. Sample data for every table
      4. Management and application queries using several JOIN types, GROUP BY, HAVING,
         subqueries, aggregation, CASE, and date functions

    Notes about small corrections I made:
      - I corrected BrchID to BranchID.
      - I corrected Proivnce to Province.
      - I corrected Service_Tyoe to ServiceType.
      - I kept one ExpiryDate field because the ERD showed it twice for Credit Card.
      - I stored the composite Name and Address attributes as their individual components.
      - I created BranchOpeningHours because OpeningHours is multivalued in the ERD.
      - I calculated derived values such as EstimatedTotal and AddOnSubtotal in queries
        instead of storing values that could become inconsistent.
*/

/* =========================================================
   PART A: TABLE CREATION AND DATA INTEGRITY
   ========================================================= */

-- I created Customer first because reservations, loyalty accounts,
-- and credit cards depend on a valid customer.
CREATE TABLE Customer
(
    CustomerID      INT IDENTITY(1,1) PRIMARY KEY,
    Email           VARCHAR(120) NOT NULL UNIQUE,
    DriversLicense  VARCHAR(30)  NOT NULL UNIQUE
);
GO

-- I separated the composite employee name into FirstName and LastName.
CREATE TABLE Employee
(
    EmployeeID  INT IDENTITY(1,1) PRIMARY KEY,
    FirstName   VARCHAR(50)  NOT NULL,
    LastName    VARCHAR(50)  NOT NULL,
    PhoneNo     VARCHAR(20)  NOT NULL,
    Role        VARCHAR(50)  NOT NULL,
    Email       VARCHAR(120) NOT NULL UNIQUE,

    CONSTRAINT CK_Employee_Role
        CHECK (Role IN ('Manager', 'Rental Agent', 'Maintenance Technician', 'Administrator'))
);
GO

-- I converted the composite branch address into separate relational columns.
CREATE TABLE Branch
(
    BranchID    INT IDENTITY(1,1) PRIMARY KEY,
    BranchName  VARCHAR(100) NOT NULL,
    Street      VARCHAR(120) NOT NULL,
    City        VARCHAR(60)  NOT NULL,
    Province    CHAR(2)      NOT NULL,
    PostalCode  VARCHAR(7)   NOT NULL,
    PhoneNo     VARCHAR(20)  NOT NULL UNIQUE,

    CONSTRAINT CK_Branch_Province
        CHECK (Province IN ('AB','BC','MB','NB','NL','NS','NT','NU','ON','PE','QC','SK','YT'))
);
GO

-- I created a separate table for OpeningHours because the ERD marks it as multivalued.
CREATE TABLE BranchOpeningHours
(
    BranchID     INT         NOT NULL,
    DayOfWeek    VARCHAR(9)  NOT NULL,
    OpeningTime  TIME        NULL,
    ClosingTime  TIME        NULL,
    IsClosed     BIT         NOT NULL DEFAULT 0,

    CONSTRAINT PK_BranchOpeningHours
        PRIMARY KEY (BranchID, DayOfWeek),

    CONSTRAINT FK_BranchOpeningHours_Branch
        FOREIGN KEY (BranchID) REFERENCES Branch(BranchID),

    CONSTRAINT CK_BranchOpeningHours_Day
        CHECK (DayOfWeek IN
              ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')),

    CONSTRAINT CK_BranchOpeningHours_Time
        CHECK
        (
            (IsClosed = 1 AND OpeningTime IS NULL AND ClosingTime IS NULL)
            OR
            (IsClosed = 0 AND OpeningTime IS NOT NULL
                          AND ClosingTime IS NOT NULL
                          AND ClosingTime > OpeningTime)
        )
);
GO

CREATE TABLE VehicleClass
(
    ClassID              INT IDENTITY(1,1) PRIMARY KEY,
    ClassName            VARCHAR(50)    NOT NULL UNIQUE,
    DailyRate            DECIMAL(10,2)  NOT NULL,
    TransmissionType     VARCHAR(20)    NOT NULL,
    FuelType             VARCHAR(20)    NOT NULL,
    SeatingCapacity      TINYINT        NOT NULL,

    CONSTRAINT CK_VehicleClass_DailyRate
        CHECK (DailyRate > 0),

    CONSTRAINT CK_VehicleClass_Transmission
        CHECK (TransmissionType IN ('Automatic', 'Manual')),

    CONSTRAINT CK_VehicleClass_Fuel
        CHECK (FuelType IN ('Gasoline', 'Diesel', 'Hybrid', 'Electric')),

    CONSTRAINT CK_VehicleClass_Seating
        CHECK (SeatingCapacity BETWEEN 2 AND 15)
);
GO

-- I placed BranchID and ClassID in Vehicle to implement the
-- Assigned To and Belongs To one-to-many relationships.
CREATE TABLE Vehicle
(
    VIN           CHAR(17)     PRIMARY KEY,
    LicensePlate  VARCHAR(15)  NOT NULL UNIQUE,
    Status        VARCHAR(25)  NOT NULL DEFAULT 'Available',
    BranchID      INT          NOT NULL,
    ClassID       INT          NOT NULL,

    CONSTRAINT FK_Vehicle_Branch
        FOREIGN KEY (BranchID) REFERENCES Branch(BranchID),

    CONSTRAINT FK_Vehicle_VehicleClass
        FOREIGN KEY (ClassID) REFERENCES VehicleClass(ClassID),

    CONSTRAINT CK_Vehicle_Status
        CHECK (Status IN ('Available', 'Reserved', 'Rented', 'Maintenance', 'Inactive'))
);
GO

-- I made CustomerID unique here to preserve the optional one-to-one
-- relationship between Customer and LoyalAccount.
CREATE TABLE LoyalAccount
(
    AccountID      INT IDENTITY(1,1) PRIMARY KEY,
    CustomerID     INT          NOT NULL UNIQUE,
    Tier           VARCHAR(20)  NOT NULL DEFAULT 'Silver',
    PointsBalance  INT          NOT NULL DEFAULT 0,

    CONSTRAINT FK_LoyalAccount_Customer
        FOREIGN KEY (CustomerID) REFERENCES Customer(CustomerID),

    CONSTRAINT CK_LoyalAccount_Tier
        CHECK (Tier IN ('Silver', 'Gold', 'Platinum')),

    CONSTRAINT CK_LoyalAccount_Points
        CHECK (PointsBalance >= 0)
);
GO

-- I associated each saved credit card with its customer.
-- I only store the final four digits rather than a full card number.
CREATE TABLE CreditCard
(
    CreditCardID          INT IDENTITY(1,1) PRIMARY KEY,
    CustomerID            INT          NOT NULL,
    CardLastFour          CHAR(4)      NOT NULL,
    ExpiryDate            DATE         NOT NULL,
    CardType              VARCHAR(20)  NOT NULL,
    BillingStreet         VARCHAR(120) NOT NULL,
    BillingCity           VARCHAR(60)  NOT NULL,
    BillingProvince       CHAR(2)      NOT NULL,
    BillingPostalCode     VARCHAR(7)   NOT NULL,

    CONSTRAINT FK_CreditCard_Customer
        FOREIGN KEY (CustomerID) REFERENCES Customer(CustomerID),

    CONSTRAINT UQ_CreditCard_CustomerCard
        UNIQUE (CustomerID, CardLastFour, ExpiryDate),

    CONSTRAINT CK_CreditCard_LastFour
        CHECK (CardLastFour NOT LIKE '%[^0-9]%'),

    CONSTRAINT CK_CreditCard_Type
        CHECK (CardType IN ('Visa', 'Mastercard', 'American Express')),

    CONSTRAINT CK_CreditCard_Province
        CHECK (BillingProvince IN
              ('AB','BC','MB','NB','NL','NS','NT','NU','ON','PE','QC','SK','YT'))
);
GO

CREATE TABLE PromoCode
(
    PromoCodeID    INT IDENTITY(1,1) PRIMARY KEY,
    Code           VARCHAR(30)   NOT NULL UNIQUE,
    DiscountType   VARCHAR(15)   NOT NULL,
    DiscountValue  DECIMAL(10,2) NOT NULL,
    StartDate      DATE          NOT NULL,
    EndDate        DATE          NOT NULL,
    Status         VARCHAR(15)   NOT NULL DEFAULT 'Active',

    CONSTRAINT CK_PromoCode_DiscountType
        CHECK (DiscountType IN ('Percentage', 'Fixed')),

    CONSTRAINT CK_PromoCode_DiscountValue
        CHECK
        (
            (DiscountType = 'Percentage' AND DiscountValue > 0 AND DiscountValue <= 100)
            OR
            (DiscountType = 'Fixed' AND DiscountValue > 0)
        ),

    CONSTRAINT CK_PromoCode_Dates
        CHECK (EndDate >= StartDate),

    CONSTRAINT CK_PromoCode_Status
        CHECK (Status IN ('Active', 'Inactive', 'Expired'))
);
GO

-- I use separate pickup and drop-off foreign keys because the same Branch
-- entity performs two different roles in a reservation.
CREATE TABLE Reservation
(
    ResNum           INT IDENTITY(1001,1) PRIMARY KEY,
    CustomerID       INT           NOT NULL,
    VIN              CHAR(17)      NOT NULL,
    PickupBranchID   INT           NOT NULL,
    DropoffBranchID  INT           NOT NULL,
    PromoCodeID      INT           NULL,
    PickupDateTime   DATETIME2(0)  NOT NULL,
    DropoffDateTime  DATETIME2(0)  NOT NULL,
    ReservationDate  DATETIME2(0)  NOT NULL DEFAULT SYSDATETIME(),
    ReservationStatus VARCHAR(20)  NOT NULL DEFAULT 'Pending',
    SpecialRequest   VARCHAR(300)  NULL,

    CONSTRAINT FK_Reservation_Customer
        FOREIGN KEY (CustomerID) REFERENCES Customer(CustomerID),

    CONSTRAINT FK_Reservation_Vehicle
        FOREIGN KEY (VIN) REFERENCES Vehicle(VIN),

    CONSTRAINT FK_Reservation_PickupBranch
        FOREIGN KEY (PickupBranchID) REFERENCES Branch(BranchID),

    CONSTRAINT FK_Reservation_DropoffBranch
        FOREIGN KEY (DropoffBranchID) REFERENCES Branch(BranchID),

    CONSTRAINT FK_Reservation_PromoCode
        FOREIGN KEY (PromoCodeID) REFERENCES PromoCode(PromoCodeID),

    CONSTRAINT CK_Reservation_Dates
        CHECK (DropoffDateTime > PickupDateTime),

    CONSTRAINT CK_Reservation_Status
        CHECK (ReservationStatus IN
              ('Pending', 'Confirmed', 'Active', 'Completed', 'Cancelled'))
);
GO

CREATE TABLE AddOnService
(
    AddOnID      INT IDENTITY(1,1) PRIMARY KEY,
    AddOnName    VARCHAR(80)   NOT NULL UNIQUE,
    DailyFee     DECIMAL(10,2) NOT NULL,
    Description  VARCHAR(250)  NULL,

    CONSTRAINT CK_AddOnService_DailyFee
        CHECK (DailyFee >= 0)
);
GO

-- I implemented the many-to-many relationship between Reservation and
-- AddOnService through the ReservationAddOn bridge table.
CREATE TABLE ReservationAddOn
(
    ResNum    INT NOT NULL,
    AddOnID   INT NOT NULL,
    Quantity  INT NOT NULL DEFAULT 1,

    CONSTRAINT PK_ReservationAddOn
        PRIMARY KEY (ResNum, AddOnID),

    CONSTRAINT FK_ReservationAddOn_Reservation
        FOREIGN KEY (ResNum) REFERENCES Reservation(ResNum),

    CONSTRAINT FK_ReservationAddOn_AddOnService
        FOREIGN KEY (AddOnID) REFERENCES AddOnService(AddOnID),

    CONSTRAINT CK_ReservationAddOn_Quantity
        CHECK (Quantity > 0)
);
GO

-- I connected each maintenance record to both the vehicle serviced
-- and the employee who recorded or performed the service.
CREATE TABLE MaintenanceRecord
(
    MaintenanceID    INT IDENTITY(1,1) PRIMARY KEY,
    VIN              CHAR(17)      NOT NULL,
    EmployeeID       INT           NOT NULL,
    ServiceType      VARCHAR(80)   NOT NULL,
    MaintenanceDate  DATE          NOT NULL,
    ServiceCost      DECIMAL(10,2) NOT NULL DEFAULT 0,
    Notes            VARCHAR(300)  NULL,

    CONSTRAINT FK_MaintenanceRecord_Vehicle
        FOREIGN KEY (VIN) REFERENCES Vehicle(VIN),

    CONSTRAINT FK_MaintenanceRecord_Employee
        FOREIGN KEY (EmployeeID) REFERENCES Employee(EmployeeID),

    CONSTRAINT CK_MaintenanceRecord_Cost
        CHECK (ServiceCost >= 0)
);
GO

-- I allowed multiple payments for one reservation because a customer may
-- pay a deposit first and the remaining balance later.
CREATE TABLE Payment
(
    PaymentID             INT IDENTITY(1,1) PRIMARY KEY,
    ResNum                INT           NOT NULL,
    CreditCardID          INT           NULL,
    PaymentDate           DATETIME2(0)  NOT NULL DEFAULT SYSDATETIME(),
    TransactionReference  VARCHAR(60)   NOT NULL UNIQUE,
    PaymentStatus         VARCHAR(20)   NOT NULL,
    PaymentType           VARCHAR(20)   NOT NULL,
    Amount                DECIMAL(10,2) NOT NULL,

    CONSTRAINT FK_Payment_Reservation
        FOREIGN KEY (ResNum) REFERENCES Reservation(ResNum),

    CONSTRAINT FK_Payment_CreditCard
        FOREIGN KEY (CreditCardID) REFERENCES CreditCard(CreditCardID),

    CONSTRAINT CK_Payment_Status
        CHECK (PaymentStatus IN ('Pending', 'Completed', 'Failed', 'Refunded')),

    CONSTRAINT CK_Payment_Type
        CHECK (PaymentType IN ('Deposit', 'Full Payment', 'Balance', 'Refund')),

    CONSTRAINT CK_Payment_Amount
        CHECK (Amount > 0),

    -- I require a credit card for ordinary payments, but not necessarily for refunds.
    CONSTRAINT CK_Payment_CardRequired
        CHECK (PaymentType = 'Refund' OR CreditCardID IS NOT NULL)
);
GO

/* =========================================================
   PART B: INDEXES
   ========================================================= */

-- I added indexes to columns that are frequently used for searches and joins.
CREATE INDEX IX_Reservation_CustomerID
    ON Reservation(CustomerID);

CREATE INDEX IX_Reservation_PickupDateTime
    ON Reservation(PickupDateTime);

CREATE INDEX IX_Reservation_VIN
    ON Reservation(VIN);

CREATE INDEX IX_Payment_ResNum
    ON Payment(ResNum);

CREATE INDEX IX_MaintenanceRecord_VIN
    ON MaintenanceRecord(VIN);
GO

/* =========================================================
   PART C: SAMPLE DATA FOR ALL TABLES
   ========================================================= */

INSERT INTO Customer (Email, DriversLicense)
VALUES
('nabeela.ansari@email.com', 'ON-A1234-56789'),
('ali.khan@email.com',       'ON-B2345-67890'),
('sarah.ahmed@email.com',    'ON-C3456-78901'),
('omar.hassan@email.com',    'ON-D4567-89012'),
('maryam.noor@email.com',    'ON-E5678-90123'),
('daniel.lee@email.com',     'ON-F6789-01234');
GO

INSERT INTO Employee (FirstName, LastName, PhoneNo, Role, Email)
VALUES
('Denis',  'Tse',      '905-555-1001', 'Manager',                'denis.tse@enterprise.ca'),
('Aisha',  'Malik',    '905-555-1002', 'Rental Agent',           'aisha.malik@enterprise.ca'),
('Harib',  'Chaudhry', '905-555-1003', 'Maintenance Technician', 'harib.chaudhry@enterprise.ca'),
('Emily',  'Chen',     '416-555-1004', 'Rental Agent',           'emily.chen@enterprise.ca'),
('Marcus', 'Brown',    '416-555-1005', 'Maintenance Technician', 'marcus.brown@enterprise.ca');
GO

INSERT INTO Branch
    (BranchName, Street, City, Province, PostalCode, PhoneNo)
VALUES
('Brampton Downtown', '100 Main St N',       'Brampton',    'ON', 'L6V 1N2', '905-555-2001'),
('Vaughan Cityview',   '55 Cityview Blvd',    'Vaughan',     'ON', 'L4H 0Z4', '905-555-2002'),
('Mississauga Derry',  '2185 Derry Rd W',     'Mississauga', 'ON', 'L5N 7A6', '905-555-2003'),
('Toronto Airport',    '6301 Silver Dart Dr', 'Mississauga', 'ON', 'L5P 1B2', '416-555-2004');
GO

-- I inserted a few representative operating-hour rows for every branch.
INSERT INTO BranchOpeningHours
    (BranchID, DayOfWeek, OpeningTime, ClosingTime, IsClosed)
VALUES
(1, 'Monday',   '08:00', '18:00', 0),
(1, 'Tuesday',  '08:00', '18:00', 0),
(1, 'Saturday', '09:00', '15:00', 0),
(1, 'Sunday',   NULL,    NULL,    1),
(2, 'Monday',   '08:00', '18:00', 0),
(2, 'Tuesday',  '08:00', '18:00', 0),
(2, 'Saturday', '09:00', '15:00', 0),
(2, 'Sunday',   NULL,    NULL,    1),
(3, 'Monday',   '08:00', '19:00', 0),
(3, 'Tuesday',  '08:00', '19:00', 0),
(3, 'Saturday', '09:00', '16:00', 0),
(3, 'Sunday',   NULL,    NULL,    1),
(4, 'Monday',   '06:00', '23:00', 0),
(4, 'Tuesday',  '06:00', '23:00', 0),
(4, 'Saturday', '06:00', '23:00', 0),
(4, 'Sunday',   '06:00', '23:00', 0);
GO

INSERT INTO VehicleClass
    (ClassName, DailyRate, TransmissionType, FuelType, SeatingCapacity)
VALUES
('Economy',      49.99, 'Automatic', 'Gasoline', 5),
('Compact SUV',  74.99, 'Automatic', 'Gasoline', 5),
('Luxury Sedan', 119.99,'Automatic', 'Gasoline', 5),
('Minivan',      99.99, 'Automatic', 'Gasoline', 7),
('Electric',     89.99, 'Automatic', 'Electric', 5);
GO

INSERT INTO Vehicle
    (VIN, LicensePlate, Status, BranchID, ClassID)
VALUES
('1HGBH41JXMN109186', 'CABC101', 'Available',   1, 1),
('2T1BURHE5JC075621', 'CABC202', 'Reserved',    1, 2),
('1N4AL3AP8JC123456', 'CABC303', 'Rented',      2, 3),
('5FNRL6H25KB012345', 'CABC404', 'Available',   3, 4),
('5YJ3E1EA7KF123456', 'EVON505', 'Maintenance', 4, 5),
('3FA6P0H73JR123456', 'CABC606', 'Available',   2, 1),
('KM8J3CA45JU123456', 'CABC707', 'Available',   3, 2),
('2C4RC1BG5KR123456', 'CABC808', 'Available',   4, 4);
GO

INSERT INTO LoyalAccount (CustomerID, Tier, PointsBalance)
VALUES
(1, 'Gold',     2750),
(2, 'Silver',    850),
(3, 'Platinum', 6200),
(5, 'Gold',     3100);
GO

INSERT INTO CreditCard
    (CustomerID, CardLastFour, ExpiryDate, CardType,
     BillingStreet, BillingCity, BillingProvince, BillingPostalCode)
VALUES
(1, '4242', '2028-08-31', 'Visa',             '12 Queen St',   'Brampton',    'ON', 'L6X 1A1'),
(2, '5454', '2027-11-30', 'Mastercard',       '44 King Rd',    'Vaughan',     'ON', 'L4J 2B2'),
(3, '3782', '2029-05-31', 'American Express', '88 Lakeshore',  'Mississauga', 'ON', 'L5B 3C3'),
(4, '1111', '2028-01-31', 'Visa',             '30 Yonge St',   'Toronto',     'ON', 'M5E 1D1'),
(5, '2222', '2027-09-30', 'Mastercard',       '76 Bovaird Dr', 'Brampton',    'ON', 'L6R 2K1'),
(6, '3333', '2029-03-31', 'Visa',             '20 Steeles Ave','Brampton',    'ON', 'L6Y 0A1');
GO

INSERT INTO PromoCode
    (Code, DiscountType, DiscountValue, StartDate, EndDate, Status)
VALUES
('SUMMER15', 'Percentage', 15.00, '2026-06-01', '2026-08-31', 'Active'),
('WELCOME25','Fixed',      25.00, '2026-01-01', '2026-12-31', 'Active'),
('WEEKEND10','Percentage', 10.00, '2026-05-01', '2026-09-30', 'Active'),
('OLDPROMO', 'Percentage', 20.00, '2025-01-01', '2025-12-31', 'Expired');
GO

INSERT INTO Reservation
    (CustomerID, VIN, PickupBranchID, DropoffBranchID, PromoCodeID,
     PickupDateTime, DropoffDateTime, ReservationDate,
     ReservationStatus, SpecialRequest)
VALUES
(1, '1HGBH41JXMN109186', 1, 1, 1,
 '2026-07-18 09:00', '2026-07-21 09:00', '2026-07-10 14:30',
 'Confirmed', 'Child safety seat requested'),

(2, '2T1BURHE5JC075621', 1, 2, NULL,
 '2026-07-20 10:00', '2026-07-25 10:00', '2026-07-11 12:15',
 'Confirmed', NULL),

(3, '1N4AL3AP8JC123456', 2, 3, 2,
 '2026-07-14 08:30', '2026-07-18 08:30', '2026-07-05 16:45',
 'Active', 'Airport drop-off'),

(1, '5FNRL6H25KB012345', 3, 3, 3,
 '2026-06-10 09:00', '2026-06-13 09:00', '2026-06-01 11:00',
 'Completed', NULL),

(4, '3FA6P0H73JR123456', 2, 2, NULL,
 '2026-05-02 12:00', '2026-05-04 12:00', '2026-04-27 10:10',
 'Completed', 'GPS requested'),

(5, 'KM8J3CA45JU123456', 3, 4, 1,
 '2026-08-01 07:00', '2026-08-08 07:00', '2026-07-12 18:05',
 'Pending', NULL),

(2, '2C4RC1BG5KR123456', 4, 4, NULL,
 '2026-04-10 15:00', '2026-04-15 15:00', '2026-04-01 09:20',
 'Cancelled', 'Wheelchair-accessible option requested'),

(3, '1HGBH41JXMN109186', 1, 1, 3,
 '2026-03-01 09:00', '2026-03-06 09:00', '2026-02-20 08:50',
 'Completed', NULL),

(5, '5FNRL6H25KB012345', 3, 1, NULL,
 '2026-02-14 10:00', '2026-02-17 10:00', '2026-02-02 13:30',
 'Completed', 'Extra luggage space required');
GO

INSERT INTO AddOnService (AddOnName, DailyFee, Description)
VALUES
('Child Safety Seat',  12.00, 'Child safety seat installed before pickup'),
('GPS Navigation',     10.00, 'Portable GPS navigation device'),
('Additional Driver',  15.00, 'Adds one authorized driver'),
('Roadside Plus',       8.00, 'Enhanced roadside assistance'),
('Wi-Fi Hotspot',      14.00, 'Mobile internet hotspot');
GO

INSERT INTO ReservationAddOn (ResNum, AddOnID, Quantity)
VALUES
(1001, 1, 1),
(1001, 4, 1),
(1002, 3, 1),
(1003, 2, 1),
(1003, 5, 1),
(1004, 1, 2),
(1005, 2, 1),
(1006, 3, 1),
(1006, 4, 1),
(1008, 4, 1),
(1009, 5, 1);
GO

INSERT INTO MaintenanceRecord
    (VIN, EmployeeID, ServiceType, MaintenanceDate, ServiceCost, Notes)
VALUES
('1HGBH41JXMN109186', 3, 'Oil Change',          '2026-01-15',  89.99, 'Routine oil and filter change'),
('2T1BURHE5JC075621', 3, 'Tire Rotation',       '2026-02-18',  59.99, 'Tires rotated and pressure checked'),
('1N4AL3AP8JC123456', 5, 'Brake Inspection',    '2026-03-10', 149.50, 'Front brake pads inspected'),
('5YJ3E1EA7KF123456', 5, 'Battery Diagnostics', '2026-07-12', 320.00, 'Vehicle held for additional testing'),
('1HGBH41JXMN109186', 3, 'Safety Inspection',   '2026-06-25', 120.00, 'Passed provincial safety inspection'),
('5FNRL6H25KB012345', 5, 'Oil Change',           '2026-05-20',  94.99, 'Routine service'),
('KM8J3CA45JU123456', 3, 'Air Filter',           '2026-04-30',  65.00, 'Engine air filter replaced');
GO

INSERT INTO Payment
    (ResNum, CreditCardID, PaymentDate, TransactionReference,
     PaymentStatus, PaymentType, Amount)
VALUES
(1001, 1, '2026-07-10 14:35', 'TXN-1001-DEP',  'Completed', 'Deposit',      75.00),
(1002, 2, '2026-07-11 12:20', 'TXN-1002-FULL', 'Completed', 'Full Payment',374.95),
(1003, 3, '2026-07-05 16:50', 'TXN-1003-DEP',  'Completed', 'Deposit',     100.00),
(1003, 3, '2026-07-14 08:20', 'TXN-1003-BAL',  'Completed', 'Balance',     354.96),
(1004, 1, '2026-06-01 11:05', 'TXN-1004-FULL', 'Completed', 'Full Payment',315.97),
(1005, 4, '2026-04-27 10:15', 'TXN-1005-FULL', 'Completed', 'Full Payment',109.98),
(1006, 5, '2026-07-12 18:10', 'TXN-1006-DEP',  'Pending',   'Deposit',     125.00),
(1007, 2, '2026-04-01 09:25', 'TXN-1007-DEP',  'Refunded',  'Deposit',     100.00),
(1008, 3, '2026-02-20 08:55', 'TXN-1008-FULL', 'Completed', 'Full Payment',264.95),
(1009, 5, '2026-02-02 13:35', 'TXN-1009-FULL', 'Completed', 'Full Payment',341.97);
GO

/* =========================================================
   PART D: SAMPLE APPLICATION AND MANAGEMENT QUERIES
   The assignment requires at least five queries. I included ten
   so the group can choose the strongest ones for the final report.
   ========================================================= */

-- QUERY 1: Detailed reservation report using multiple INNER JOINs and LEFT JOINs.
-- I wrote this query so a rental agent can view the customer, vehicle,
-- class, pickup branch, drop-off branch, and optional promo in one result.
SELECT
    r.ResNum,
    c.Email AS CustomerEmail,
    v.LicensePlate,
    vc.ClassName,
    pb.BranchName AS PickupBranch,
    db.BranchName AS DropoffBranch,
    r.PickupDateTime,
    r.DropoffDateTime,
    r.ReservationStatus,
    pc.Code AS PromoCode
FROM Reservation AS r
INNER JOIN Customer AS c
    ON r.CustomerID = c.CustomerID
INNER JOIN Vehicle AS v
    ON r.VIN = v.VIN
INNER JOIN VehicleClass AS vc
    ON v.ClassID = vc.ClassID
INNER JOIN Branch AS pb
    ON r.PickupBranchID = pb.BranchID
INNER JOIN Branch AS db
    ON r.DropoffBranchID = db.BranchID
LEFT JOIN PromoCode AS pc
    ON r.PromoCodeID = pc.PromoCodeID
ORDER BY r.PickupDateTime;
GO

-- QUERY 2: Reservation totals by customer using GROUP BY and HAVING.
-- I used HAVING because management only wants customers who have made
-- at least two reservations.
SELECT
    c.CustomerID,
    c.Email,
    COUNT(r.ResNum) AS NumberOfReservations
FROM Customer AS c
INNER JOIN Reservation AS r
    ON c.CustomerID = r.CustomerID
GROUP BY c.CustomerID, c.Email
HAVING COUNT(r.ResNum) >= 2
ORDER BY NumberOfReservations DESC;
GO

-- QUERY 3: Revenue collected by branch.
-- I joined completed payments to the pickup branch so management can
-- compare revenue generated by each location.
SELECT
    b.BranchID,
    b.BranchName,
    COUNT(DISTINCT r.ResNum) AS PaidReservations,
    SUM(p.Amount) AS TotalCollected
FROM Branch AS b
INNER JOIN Reservation AS r
    ON b.BranchID = r.PickupBranchID
INNER JOIN Payment AS p
    ON r.ResNum = p.ResNum
WHERE p.PaymentStatus = 'Completed'
GROUP BY b.BranchID, b.BranchName
HAVING SUM(p.Amount) > 100
ORDER BY TotalCollected DESC;
GO

-- QUERY 4: LEFT JOIN showing every vehicle, including vehicles with no maintenance.
-- I used a LEFT JOIN so vehicles are not excluded when they have no record yet.
SELECT
    v.VIN,
    v.LicensePlate,
    v.Status,
    COUNT(m.MaintenanceID) AS NumberOfServices,
    MAX(m.MaintenanceDate) AS MostRecentService
FROM Vehicle AS v
LEFT JOIN MaintenanceRecord AS m
    ON v.VIN = m.VIN
GROUP BY v.VIN, v.LicensePlate, v.Status
ORDER BY NumberOfServices DESC, v.LicensePlate;
GO

-- QUERY 5: Available vehicles by branch and vehicle class.
-- I grouped the available fleet so staff can see inventory levels.
SELECT
    b.BranchName,
    vc.ClassName,
    COUNT(v.VIN) AS AvailableVehicleCount
FROM Branch AS b
INNER JOIN Vehicle AS v
    ON b.BranchID = v.BranchID
INNER JOIN VehicleClass AS vc
    ON v.ClassID = vc.ClassID
WHERE v.Status = 'Available'
GROUP BY b.BranchName, vc.ClassName
HAVING COUNT(v.VIN) >= 1
ORDER BY b.BranchName, vc.ClassName;
GO

-- QUERY 6: Calculate an estimated reservation total.
-- I calculate the derived EstimatedTotal instead of storing it.
-- The calculation includes rental days, add-ons, and the optional promotion.
WITH ReservationBase AS
(
    SELECT
        r.ResNum,
        DATEDIFF(DAY, r.PickupDateTime, r.DropoffDateTime) AS RentalDays,
        vc.DailyRate,
        COALESCE
        (
            SUM(aos.DailyFee * ra.Quantity *
                DATEDIFF(DAY, r.PickupDateTime, r.DropoffDateTime)),
            0
        ) AS AddOnTotal,
        pc.DiscountType,
        pc.DiscountValue
    FROM Reservation AS r
    INNER JOIN Vehicle AS v
        ON r.VIN = v.VIN
    INNER JOIN VehicleClass AS vc
        ON v.ClassID = vc.ClassID
    LEFT JOIN ReservationAddOn AS ra
        ON r.ResNum = ra.ResNum
    LEFT JOIN AddOnService AS aos
        ON ra.AddOnID = aos.AddOnID
    LEFT JOIN PromoCode AS pc
        ON r.PromoCodeID = pc.PromoCodeID
    GROUP BY
        r.ResNum,
        r.PickupDateTime,
        r.DropoffDateTime,
        vc.DailyRate,
        pc.DiscountType,
        pc.DiscountValue
)
SELECT
    ResNum,
    RentalDays,
    DailyRate,
    CAST(RentalDays * DailyRate AS DECIMAL(10,2)) AS BaseRentalTotal,
    CAST(AddOnTotal AS DECIMAL(10,2)) AS AddOnTotal,
    CAST
    (
        CASE
            WHEN DiscountType = 'Percentage'
                THEN ((RentalDays * DailyRate) + AddOnTotal)
                     * (1 - DiscountValue / 100.0)
            WHEN DiscountType = 'Fixed'
                THEN
                    CASE
                        WHEN ((RentalDays * DailyRate) + AddOnTotal) - DiscountValue < 0
                            THEN 0
                        ELSE ((RentalDays * DailyRate) + AddOnTotal) - DiscountValue
                    END
            ELSE (RentalDays * DailyRate) + AddOnTotal
        END
        AS DECIMAL(10,2)
    ) AS EstimatedTotal
FROM ReservationBase
ORDER BY ResNum;
GO

-- QUERY 7: Customers with no loyalty account.
-- I used a LEFT JOIN and IS NULL to find customers who could be targeted
-- for loyalty-program enrollment.
SELECT
    c.CustomerID,
    c.Email,
    c.DriversLicense
FROM Customer AS c
LEFT JOIN LoyalAccount AS la
    ON c.CustomerID = la.CustomerID
WHERE la.AccountID IS NULL
ORDER BY c.CustomerID;
GO

-- QUERY 8: Employees and the maintenance work they recorded.
-- I aggregate maintenance activity to help management review workload.
SELECT
    e.EmployeeID,
    CONCAT(e.FirstName, ' ', e.LastName) AS EmployeeName,
    e.Role,
    COUNT(m.MaintenanceID) AS ServicesRecorded,
    COALESCE(SUM(m.ServiceCost), 0) AS TotalServiceCost
FROM Employee AS e
LEFT JOIN MaintenanceRecord AS m
    ON e.EmployeeID = m.EmployeeID
GROUP BY e.EmployeeID, e.FirstName, e.LastName, e.Role
ORDER BY ServicesRecorded DESC, EmployeeName;
GO

-- QUERY 9: Most frequently selected add-on services.
-- I used GROUP BY and HAVING so only add-ons ordered at least twice appear.
SELECT
    aos.AddOnID,
    aos.AddOnName,
    SUM(ra.Quantity) AS TotalUnitsSelected,
    COUNT(DISTINCT ra.ResNum) AS ReservationsUsingAddOn
FROM AddOnService AS aos
INNER JOIN ReservationAddOn AS ra
    ON aos.AddOnID = ra.AddOnID
GROUP BY aos.AddOnID, aos.AddOnName
HAVING SUM(ra.Quantity) >= 2
ORDER BY TotalUnitsSelected DESC;
GO

-- QUERY 10: Reservations whose completed payments are below the calculated total.
-- I included a subquery and aggregation to help identify outstanding balances.
WITH CalculatedTotals AS
(
    SELECT
        r.ResNum,
        CAST
        (
            DATEDIFF(DAY, r.PickupDateTime, r.DropoffDateTime) * vc.DailyRate
            + COALESCE
              (
                  SUM
                  (
                      aos.DailyFee * ra.Quantity *
                      DATEDIFF(DAY, r.PickupDateTime, r.DropoffDateTime)
                  ),
                  0
              )
            AS DECIMAL(10,2)
        ) AS GrossTotal
    FROM Reservation AS r
    INNER JOIN Vehicle AS v
        ON r.VIN = v.VIN
    INNER JOIN VehicleClass AS vc
        ON v.ClassID = vc.ClassID
    LEFT JOIN ReservationAddOn AS ra
        ON r.ResNum = ra.ResNum
    LEFT JOIN AddOnService AS aos
        ON ra.AddOnID = aos.AddOnID
    GROUP BY
        r.ResNum,
        r.PickupDateTime,
        r.DropoffDateTime,
        vc.DailyRate
),
PaymentsReceived AS
(
    SELECT
        ResNum,
        SUM
        (
            CASE
                WHEN PaymentStatus = 'Completed' THEN Amount
                ELSE 0
            END
        ) AS AmountPaid
    FROM Payment
    GROUP BY ResNum
)
SELECT
    r.ResNum,
    c.Email AS CustomerEmail,
    ct.GrossTotal,
    COALESCE(pr.AmountPaid, 0) AS AmountPaid,
    ct.GrossTotal - COALESCE(pr.AmountPaid, 0) AS OutstandingBeforeDiscount
FROM Reservation AS r
INNER JOIN Customer AS c
    ON r.CustomerID = c.CustomerID
INNER JOIN CalculatedTotals AS ct
    ON r.ResNum = ct.ResNum
LEFT JOIN PaymentsReceived AS pr
    ON r.ResNum = pr.ResNum
WHERE COALESCE(pr.AmountPaid, 0) < ct.GrossTotal
  AND r.ReservationStatus <> 'Cancelled'
ORDER BY OutstandingBeforeDiscount DESC;
GO

/* =========================================================
   OPTIONAL APPLICATION OPERATIONS
   ========================================================= */

-- I included this parameterized-style search as an example of what the
-- interface can run when a customer searches for available vehicles.
DECLARE @RequestedBranchID INT = 2;
DECLARE @RequestedClassID  INT = 1;

SELECT
    v.VIN,
    v.LicensePlate,
    vc.ClassName,
    vc.DailyRate,
    b.BranchName
FROM Vehicle AS v
INNER JOIN VehicleClass AS vc
    ON v.ClassID = vc.ClassID
INNER JOIN Branch AS b
    ON v.BranchID = b.BranchID
WHERE v.Status = 'Available'
  AND v.BranchID = @RequestedBranchID
  AND v.ClassID = @RequestedClassID;
GO

-- I included a transaction example to show how a reservation and deposit
-- can be inserted safely as one operation.
BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @NewReservation TABLE (ResNum INT);

    INSERT INTO Reservation
        (CustomerID, VIN, PickupBranchID, DropoffBranchID, PromoCodeID,
         PickupDateTime, DropoffDateTime, ReservationStatus, SpecialRequest)
    OUTPUT inserted.ResNum INTO @NewReservation(ResNum)
    VALUES
        (6, '3FA6P0H73JR123456', 2, 2, NULL,
         '2026-09-05 10:00', '2026-09-07 10:00',
         'Confirmed', NULL);

    DECLARE @NewResNum INT =
        (SELECT TOP (1) ResNum FROM @NewReservation);

    INSERT INTO Payment
        (ResNum, CreditCardID, TransactionReference,
         PaymentStatus, PaymentType, Amount)
    VALUES
        (@NewResNum, 6, CONCAT('TXN-', @NewResNum, '-DEP'),
         'Completed', 'Deposit', 50.00);

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    THROW;
END CATCH;
GO

-- I use this final statement as a quick check that all tables were populated.
SELECT 'Customer' AS TableName, COUNT(*) AS RowCount FROM Customer
UNION ALL
SELECT 'Employee', COUNT(*) FROM Employee
UNION ALL
SELECT 'Branch', COUNT(*) FROM Branch
UNION ALL
SELECT 'BranchOpeningHours', COUNT(*) FROM BranchOpeningHours
UNION ALL
SELECT 'VehicleClass', COUNT(*) FROM VehicleClass
UNION ALL
SELECT 'Vehicle', COUNT(*) FROM Vehicle
UNION ALL
SELECT 'LoyalAccount', COUNT(*) FROM LoyalAccount
UNION ALL
SELECT 'CreditCard', COUNT(*) FROM CreditCard
UNION ALL
SELECT 'PromoCode', COUNT(*) FROM PromoCode
UNION ALL
SELECT 'Reservation', COUNT(*) FROM Reservation
UNION ALL
SELECT 'AddOnService', COUNT(*) FROM AddOnService
UNION ALL
SELECT 'ReservationAddOn', COUNT(*) FROM ReservationAddOn
UNION ALL
SELECT 'MaintenanceRecord', COUNT(*) FROM MaintenanceRecord
UNION ALL
SELECT 'Payment', COUNT(*) FROM Payment;
GO
