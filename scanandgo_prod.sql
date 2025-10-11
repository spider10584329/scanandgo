-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 11, 2025 at 05:36 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `scanandgo_prod`
--

-- --------------------------------------------------------

--
-- Table structure for table `alembic_version`
--

CREATE TABLE `alembic_version` (
  `version_num` varchar(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC;

--
-- Dumping data for table `alembic_version`
--

INSERT INTO `alembic_version` (`version_num`) VALUES
('96847e9a0d11');

-- --------------------------------------------------------

--
-- Table structure for table `areas`
--

CREATE TABLE `areas` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `building_id` int(11) DEFAULT NULL,
  `name` varchar(120) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC;

--
-- Dumping data for table `areas`
--

INSERT INTO `areas` (`id`, `customer_id`, `building_id`, `name`) VALUES
(9, 3, 18, 'area-1'),
(10, 3, 20, 'area-1');

-- --------------------------------------------------------

--
-- Table structure for table `buildings`
--

CREATE TABLE `buildings` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `name` varchar(120) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC;

--
-- Dumping data for table `buildings`
--

INSERT INTO `buildings` (`id`, `customer_id`, `name`) VALUES
(18, 3, 'A-building'),
(20, 3, 'B-building');

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `name` varchar(120) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `customer_id`, `name`) VALUES
(1, 3, 'A-Category1'),
(32, 3, 'B-Category11');

-- --------------------------------------------------------

--
-- Table structure for table `clients`
--

CREATE TABLE `clients` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `clientname` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `clients`
--

INSERT INTO `clients` (`id`, `customer_id`, `clientname`) VALUES
(4, 3, 'SCANANDGO');

-- --------------------------------------------------------

--
-- Table structure for table `detail_locations`
--

CREATE TABLE `detail_locations` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `floor_id` int(11) DEFAULT NULL,
  `name` varchar(120) NOT NULL,
  `img_data` varchar(120) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC;

--
-- Dumping data for table `detail_locations`
--

INSERT INTO `detail_locations` (`id`, `customer_id`, `floor_id`, `name`, `img_data`) VALUES
(33, 3, 6, 'room-1', NULL),
(34, 3, 7, 'room1', NULL),
(35, 3, 7, 'room2', NULL),
(36, 3, 8, 'room3', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `floors`
--

CREATE TABLE `floors` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `area_id` int(11) DEFAULT NULL,
  `name` varchar(120) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC;

--
-- Dumping data for table `floors`
--

INSERT INTO `floors` (`id`, `customer_id`, `area_id`, `name`) VALUES
(6, 3, 9, 'floor-1'),
(7, 3, 10, 'floor-1'),
(8, 3, 10, 'floor-2');

-- --------------------------------------------------------

--
-- Table structure for table `inventories`
--

CREATE TABLE `inventories` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `item_id` int(11) DEFAULT NULL,
  `building_id` int(11) DEFAULT NULL,
  `area_id` int(11) DEFAULT NULL,
  `floor_id` int(11) DEFAULT NULL,
  `detail_location_id` int(11) DEFAULT NULL,
  `purchase_date` varchar(120) DEFAULT NULL,
  `last_date` varchar(120) DEFAULT NULL,
  `ref_client` varchar(120) DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  `reg_date` varchar(120) DEFAULT NULL,
  `inv_date` varchar(120) DEFAULT NULL,
  `comment` varchar(120) DEFAULT NULL,
  `rfid` varchar(120) DEFAULT NULL,
  `barcode` varchar(120) DEFAULT NULL,
  `operator_id` int(11) DEFAULT NULL,
  `room_assignment` varchar(120) DEFAULT NULL,
  `category_df_immonet` varchar(120) DEFAULT NULL,
  `purchase_amount` int(11) DEFAULT NULL,
  `is_throw` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC;

--
-- Dumping data for table `inventories`
--

INSERT INTO `inventories` (`id`, `customer_id`, `category_id`, `item_id`, `building_id`, `area_id`, `floor_id`, `detail_location_id`, `purchase_date`, `last_date`, `ref_client`, `status`, `reg_date`, `inv_date`, `comment`, `rfid`, `barcode`, `operator_id`, `room_assignment`, `category_df_immonet`, `purchase_amount`, `is_throw`) VALUES
(144, 3, 1, 57, 18, 9, 6, 33, NULL, NULL, NULL, 1, '2025-10-11', '2025-10-11', NULL, NULL, '3231', NULL, NULL, NULL, NULL, NULL),
(145, 3, 1, 51, 20, 10, 7, 34, NULL, NULL, NULL, 1, '2025-10-11', '2025-10-11', NULL, NULL, '123478', NULL, NULL, NULL, NULL, NULL),
(146, 3, 1, 52, 18, 9, 6, 33, NULL, NULL, NULL, 1, '2025-10-11', '2025-10-11', NULL, NULL, '123477', NULL, NULL, NULL, NULL, NULL),
(147, 3, 1, 55, 18, 9, 6, 33, NULL, NULL, NULL, 1, '2025-10-11', '2025-10-11', NULL, NULL, '21312', NULL, NULL, NULL, NULL, NULL),
(148, 3, 32, 53, 18, 9, 6, 33, NULL, NULL, NULL, 1, '2025-10-11', '2025-10-11', NULL, NULL, '123456', NULL, NULL, NULL, NULL, NULL),
(149, 3, 1, 56, 20, 10, 7, 34, NULL, NULL, NULL, 1, '2025-10-11', '2025-10-11', NULL, NULL, '234234', NULL, NULL, NULL, NULL, NULL),
(150, 3, 32, 54, 20, 10, 7, 34, NULL, NULL, NULL, 1, '2025-10-11', '2025-10-11', NULL, NULL, '156463', NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `items`
--

CREATE TABLE `items` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `name` varchar(120) NOT NULL,
  `barcode` varchar(120) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC;

--
-- Dumping data for table `items`
--

INSERT INTO `items` (`id`, `customer_id`, `category_id`, `name`, `barcode`) VALUES
(51, 3, 1, 'item1', '123478'),
(52, 3, 1, 'item2', '123477'),
(53, 3, 32, 'item3', '123456'),
(54, 3, 32, 'item-4', '156463'),
(55, 3, 1, 'item2', '21312'),
(56, 3, 1, 'item-5', '234234'),
(57, 3, 1, 'item', '3231'),
(58, 3, 32, 'item-5', '123123');

-- --------------------------------------------------------

--
-- Table structure for table `missing_items`
--

CREATE TABLE `missing_items` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `detail_location_id` int(11) NOT NULL,
  `barcode` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC;

--
-- Dumping data for table `missing_items`
--

INSERT INTO `missing_items` (`id`, `customer_id`, `detail_location_id`, `barcode`) VALUES
(6, 3, 33, '123477');

-- --------------------------------------------------------

--
-- Table structure for table `operators`
--

CREATE TABLE `operators` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `username` varchar(120) NOT NULL,
  `password` varchar(120) NOT NULL,
  `passwordRequest` varchar(255) DEFAULT NULL,
  `isPasswordRequest` int(11) DEFAULT NULL,
  `isActive` tinyint(4) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC;

--
-- Dumping data for table `operators`
--

INSERT INTO `operators` (`id`, `customer_id`, `username`, `password`, `passwordRequest`, `isPasswordRequest`, `isActive`) VALUES
(2, 4, 'vicky@square.nc', '$pbkdf2-sha256$29000$JMQYQ2jNee99713rvdc65w$W232W39xUbudooibOXNYv1jgrWKpYTzp0bsVmK6sXPM', NULL, 0, 0),
(8, 3, 'aaa', '$2b$10$C4JexXUXhQvw4GUZLyn.D.3w1yMhaFyiWVs4SEQ6riXir8GQAwWfa', NULL, 0, 0),
(9, 1, 'agent1', '$2b$12$98tUMMNAKqrbOHw9VYnoJuNkjylUK.SkGBRWuln1Lsr4djkA6TSlO', NULL, NULL, 1);

-- --------------------------------------------------------

--
-- Table structure for table `role`
--

CREATE TABLE `role` (
  `id` int(11) NOT NULL,
  `name` varchar(120) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC;

--
-- Dumping data for table `role`
--

INSERT INTO `role` (`id`, `name`) VALUES
(1, 'admin'),
(3, 'agent'),
(2, 'manager'),
(4, 'user');

-- --------------------------------------------------------

--
-- Table structure for table `snapshots`
--

CREATE TABLE `snapshots` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `name` varchar(120) DEFAULT NULL,
  `date` varchar(120) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC;

--
-- Dumping data for table `snapshots`
--

INSERT INTO `snapshots` (`id`, `customer_id`, `name`, `date`) VALUES
(12, 3, 'All conditions checked. No quantity errors.', '2025-10-11');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(120) NOT NULL,
  `password` varchar(120) NOT NULL,
  `role` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `role`) VALUES
(1, 'admin@scanandgo.com', '$2b$12$QlrpQQktaW9KwkZ4QryZjuuR2K/S3ND8fw7XWuF5303b0v.OvNn52', 1),
(2, 'spider10584329@gmail.com', '$2b$12$g/2OiwEvs7bQrWpoh6utBeZ9mCHfveEAktFf7m99rZfNZ2Cpo4HNe', 4),
(3, 'ikonicnem@gmail.com', '$2b$12$CTudrtSFZ2PcBelNwbXTJ.sBYM.TXBDNCFeeWhpC8zOq9Yae7mSPK', 4);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `alembic_version`
--
ALTER TABLE `alembic_version`
  ADD PRIMARY KEY (`version_num`) USING BTREE;

--
-- Indexes for table `areas`
--
ALTER TABLE `areas`
  ADD PRIMARY KEY (`id`) USING BTREE,
  ADD KEY `building_id` (`building_id`) USING BTREE;

--
-- Indexes for table `buildings`
--
ALTER TABLE `buildings`
  ADD PRIMARY KEY (`id`) USING BTREE,
  ADD UNIQUE KEY `name` (`name`) USING BTREE;

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`) USING BTREE,
  ADD UNIQUE KEY `name` (`name`) USING BTREE;

--
-- Indexes for table `clients`
--
ALTER TABLE `clients`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `detail_locations`
--
ALTER TABLE `detail_locations`
  ADD PRIMARY KEY (`id`) USING BTREE,
  ADD KEY `floor_id` (`floor_id`) USING BTREE;

--
-- Indexes for table `floors`
--
ALTER TABLE `floors`
  ADD PRIMARY KEY (`id`) USING BTREE,
  ADD KEY `area_id` (`area_id`) USING BTREE;

--
-- Indexes for table `inventories`
--
ALTER TABLE `inventories`
  ADD PRIMARY KEY (`id`) USING BTREE,
  ADD KEY `area_id` (`area_id`) USING BTREE,
  ADD KEY `building_id` (`building_id`) USING BTREE,
  ADD KEY `category_id` (`category_id`) USING BTREE,
  ADD KEY `detail_location_id` (`detail_location_id`) USING BTREE,
  ADD KEY `floor_id` (`floor_id`) USING BTREE,
  ADD KEY `item_id` (`item_id`) USING BTREE,
  ADD KEY `operator_id` (`operator_id`) USING BTREE;

--
-- Indexes for table `items`
--
ALTER TABLE `items`
  ADD PRIMARY KEY (`id`) USING BTREE,
  ADD KEY `category_id` (`category_id`) USING BTREE;

--
-- Indexes for table `missing_items`
--
ALTER TABLE `missing_items`
  ADD PRIMARY KEY (`id`) USING BTREE,
  ADD KEY `detail_location_id` (`detail_location_id`);

--
-- Indexes for table `operators`
--
ALTER TABLE `operators`
  ADD PRIMARY KEY (`id`) USING BTREE,
  ADD UNIQUE KEY `username` (`username`) USING BTREE;

--
-- Indexes for table `role`
--
ALTER TABLE `role`
  ADD PRIMARY KEY (`id`) USING BTREE,
  ADD UNIQUE KEY `name` (`name`) USING BTREE;

--
-- Indexes for table `snapshots`
--
ALTER TABLE `snapshots`
  ADD PRIMARY KEY (`id`) USING BTREE;

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`) USING BTREE,
  ADD UNIQUE KEY `username` (`username`) USING BTREE,
  ADD KEY `role` (`role`) USING BTREE;

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `areas`
--
ALTER TABLE `areas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `buildings`
--
ALTER TABLE `buildings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT for table `clients`
--
ALTER TABLE `clients`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `detail_locations`
--
ALTER TABLE `detail_locations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `floors`
--
ALTER TABLE `floors`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `inventories`
--
ALTER TABLE `inventories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=151;

--
-- AUTO_INCREMENT for table `items`
--
ALTER TABLE `items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=59;

--
-- AUTO_INCREMENT for table `missing_items`
--
ALTER TABLE `missing_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `operators`
--
ALTER TABLE `operators`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `role`
--
ALTER TABLE `role`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `snapshots`
--
ALTER TABLE `snapshots`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `areas`
--
ALTER TABLE `areas`
  ADD CONSTRAINT `areas_ibfk_1` FOREIGN KEY (`building_id`) REFERENCES `buildings` (`id`);

--
-- Constraints for table `detail_locations`
--
ALTER TABLE `detail_locations`
  ADD CONSTRAINT `detail_locations_ibfk_1` FOREIGN KEY (`floor_id`) REFERENCES `floors` (`id`);

--
-- Constraints for table `floors`
--
ALTER TABLE `floors`
  ADD CONSTRAINT `floors_ibfk_1` FOREIGN KEY (`area_id`) REFERENCES `areas` (`id`);

--
-- Constraints for table `inventories`
--
ALTER TABLE `inventories`
  ADD CONSTRAINT `inventories_ibfk_1` FOREIGN KEY (`area_id`) REFERENCES `areas` (`id`),
  ADD CONSTRAINT `inventories_ibfk_2` FOREIGN KEY (`building_id`) REFERENCES `buildings` (`id`),
  ADD CONSTRAINT `inventories_ibfk_3` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`),
  ADD CONSTRAINT `inventories_ibfk_4` FOREIGN KEY (`detail_location_id`) REFERENCES `detail_locations` (`id`),
  ADD CONSTRAINT `inventories_ibfk_5` FOREIGN KEY (`floor_id`) REFERENCES `floors` (`id`),
  ADD CONSTRAINT `inventories_ibfk_6` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`),
  ADD CONSTRAINT `inventories_ibfk_7` FOREIGN KEY (`operator_id`) REFERENCES `operators` (`id`);

--
-- Constraints for table `items`
--
ALTER TABLE `items`
  ADD CONSTRAINT `items_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`);

--
-- Constraints for table `missing_items`
--
ALTER TABLE `missing_items`
  ADD CONSTRAINT `missing_items_ibfk_1` FOREIGN KEY (`detail_location_id`) REFERENCES `detail_locations` (`id`);

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role`) REFERENCES `role` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
