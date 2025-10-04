/*
 Navicat MySQL Data Transfer

 Source Server         : DMZ165 3301 - SCANANDGO-SAAS
 Source Server Type    : MariaDB
 Source Server Version : 101106 (10.11.6-MariaDB-0+deb12u1)
 Source Host           : 202.87.138.165:3301
 Source Schema         : scanandgo_prod

 Target Server Type    : MariaDB
 Target Server Version : 101106 (10.11.6-MariaDB-0+deb12u1)
 File Encoding         : 65001

 Date: 03/10/2025 19:47:13
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
-- ----------------------------
-- Table structure for snapshots
-- ----------------------------
DROP TABLE IF EXISTS `snapshots`;
CREATE TABLE `snapshots`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) NOT NULL,
  `name` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `date` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of snapshots
-- ----------------------------
INSERT INTO `snapshots` VALUES (1, 3, 'photo', '2025-10-03');
-- ----------------------------
-- Table structure for role
-- ----------------------------
DROP TABLE IF EXISTS `role`;
CREATE TABLE `role`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `name`(`name` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of role
-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `password` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `role` int(11) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `username`(`username` ASC) USING BTREE,
  INDEX `role`(`role` ASC) USING BTREE,
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role`) REFERENCES `role` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;



-- ----------------------------
-- Table structure for alembic_version
-- ----------------------------
DROP TABLE IF EXISTS `alembic_version`;
CREATE TABLE `alembic_version`  (
  `version_num` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`version_num`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of alembic_version
-- ----------------------------
INSERT INTO `alembic_version` VALUES ('96847e9a0d11');


-- ----------------------------
-- Table structure for buildings
-- ----------------------------
DROP TABLE IF EXISTS `buildings`;
CREATE TABLE `buildings`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) NOT NULL,
  `name` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `name`(`name` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of buildings
-- ----------------------------
INSERT INTO `buildings` VALUES (1, 3, 'A-Building');

-- ----------------------------
-- Table structure for categories
-- ----------------------------
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) NOT NULL,
  `name` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `name`(`name` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of categories
-- ----------------------------
INSERT INTO `categories` VALUES (1, 3, 'A-Category');
-- ----------------------------
-- Table structure for areas
-- ----------------------------
DROP TABLE IF EXISTS `areas`;
CREATE TABLE `areas`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) NOT NULL,
  `building_id` int(11) NULL DEFAULT NULL,
  `name` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `building_id`(`building_id` ASC) USING BTREE,
  CONSTRAINT `areas_ibfk_1` FOREIGN KEY (`building_id`) REFERENCES `buildings` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;
-- ----------------------------
-- Records of areas
-- ----------------------------
INSERT INTO `areas` VALUES (1, 3, 1, 'A-Floor');
INSERT INTO `areas` VALUES (3, 3, 1, 'B-Floor');
-- ----------------------------
-- Table structure for floors
-- ----------------------------
DROP TABLE IF EXISTS `floors`;
CREATE TABLE `floors`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) NOT NULL,
  `area_id` int(11) NULL DEFAULT NULL,
  `name` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `area_id`(`area_id` ASC) USING BTREE,
  CONSTRAINT `floors_ibfk_1` FOREIGN KEY (`area_id`) REFERENCES `areas` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;
-- ----------------------------
-- Records of floors
-- ----------------------------
INSERT INTO `floors` VALUES (1, 3, 1, 'A-Area');
-- ----------------------------
-- Table structure for detail_locations
-- ----------------------------
DROP TABLE IF EXISTS `detail_locations`;
CREATE TABLE `detail_locations`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) NOT NULL,
  `floor_id` int(11) NULL DEFAULT NULL,
  `name` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `img_data` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `floor_id`(`floor_id` ASC) USING BTREE,
  CONSTRAINT `detail_locations_ibfk_1` FOREIGN KEY (`floor_id`) REFERENCES `floors` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of detail_locations
-- ----------------------------
INSERT INTO `detail_locations` VALUES (1, 3, 1, 'A-Block', '');
INSERT INTO `detail_locations` VALUES (2, 3, 1, 'B-Block', '');

-- ----------------------------
-- Table structure for items
-- ----------------------------
DROP TABLE IF EXISTS `items`;
CREATE TABLE `items`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) NOT NULL,
  `category_id` int(11) NULL DEFAULT NULL,
  `name` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `barcode` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `category_id`(`category_id` ASC) USING BTREE,
  CONSTRAINT `items_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of items
-- ----------------------------
INSERT INTO `items` VALUES (1, 3, 1, 'A-Item', NULL);
INSERT INTO `items` VALUES (2, 3, 1, 'B-Item', NULL);

-- ----------------------------
-- Table structure for operators
-- ----------------------------
DROP TABLE IF EXISTS `operators`;
CREATE TABLE `operators`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) NOT NULL,
  `username` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `password` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `passwordRequest` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `isPasswordRequest` int(11) NULL DEFAULT NULL,
  `isActive` tinyint(4) NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `username`(`username` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of operators
-- ----------------------------
INSERT INTO `operators` VALUES (1, 3, 'adam-operator1', '$pbkdf2-sha256$29000$jvG.9/4/pxQCICTkPCdk7A$GjN1TkFjKUWDRSjPCMMrTaYyw0JQ5NpumNuKeCQyzzU', NULL, 0, 1);
INSERT INTO `operators` VALUES (2, 4, 'vicky@square.nc', '$pbkdf2-sha256$29000$JMQYQ2jNee99713rvdc65w$W232W39xUbudooibOXNYv1jgrWKpYTzp0bsVmK6sXPM', NULL, 0, 0);


-- ----------------------------
-- Table structure for inventories
-- ----------------------------
DROP TABLE IF EXISTS `inventories`;
CREATE TABLE `inventories`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) NOT NULL,
  `category_id` int(11) NULL DEFAULT NULL,
  `item_id` int(11) NULL DEFAULT NULL,
  `building_id` int(11) NULL DEFAULT NULL,
  `area_id` int(11) NULL DEFAULT NULL,
  `floor_id` int(11) NULL DEFAULT NULL,
  `detail_location_id` int(11) NULL DEFAULT NULL,
  `purchase_date` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `last_date` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `ref_client` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `status` int(11) NULL DEFAULT NULL,
  `reg_date` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `inv_date` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `comment` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `rfid` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `barcode` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `operator_id` int(11) NULL DEFAULT NULL,
  `room_assignment` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `category_df_immonet` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `purchase_amount` int(11) NULL DEFAULT NULL,
  `is_throw` tinyint(1) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `area_id`(`area_id` ASC) USING BTREE,
  INDEX `building_id`(`building_id` ASC) USING BTREE,
  INDEX `category_id`(`category_id` ASC) USING BTREE,
  INDEX `detail_location_id`(`detail_location_id` ASC) USING BTREE,
  INDEX `floor_id`(`floor_id` ASC) USING BTREE,
  INDEX `item_id`(`item_id` ASC) USING BTREE,
  INDEX `operator_id`(`operator_id` ASC) USING BTREE,
  CONSTRAINT `inventories_ibfk_1` FOREIGN KEY (`area_id`) REFERENCES `areas` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `inventories_ibfk_2` FOREIGN KEY (`building_id`) REFERENCES `buildings` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `inventories_ibfk_3` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `inventories_ibfk_4` FOREIGN KEY (`detail_location_id`) REFERENCES `detail_locations` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `inventories_ibfk_5` FOREIGN KEY (`floor_id`) REFERENCES `floors` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `inventories_ibfk_6` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `inventories_ibfk_7` FOREIGN KEY (`operator_id`) REFERENCES `operators` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 5 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of inventories
-- ----------------------------
INSERT INTO `inventories` VALUES (2, 3, 1, 1, 1, 1, 1, 2, NULL, NULL, NULL, 3, '2025-03-31 20:24:10.285948', '2025-03-31 20:24:10.285952', 'Test comment..', NULL, 'BAR-123456', 1, NULL, NULL, NULL, 0);
INSERT INTO `inventories` VALUES (3, 3, 1, 1, 1, 1, 1, 2, NULL, NULL, NULL, 3, '2025-03-31 21:05:10.513820', '2025-03-31 21:05:10.513823', 'Test comment..', NULL, 'BAR-123456', 1, NULL, NULL, NULL, 0);
INSERT INTO `inventories` VALUES (4, 3, 1, 1, 1, 1, 1, 1, NULL, NULL, NULL, 2, '2025-03-31 21:08:33.629470', '2025-03-31 21:08:33.629473', 'Test comment..asdf', NULL, 'BAR-123456', 1, NULL, NULL, NULL, 0);

-- ----------------------------
-- Table structure for missing_items
-- ----------------------------
DROP TABLE IF EXISTS `missing_items`;
CREATE TABLE `missing_items`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) NULL DEFAULT NULL,
  `location_id` int(11) NULL DEFAULT NULL,
  `barcode` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of missing_items
-- ----------------------------

SET FOREIGN_KEY_CHECKS = 1;
