-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `displayName` VARCHAR(191) NULL,
    `locale` ENUM('EN', 'ZH') NOT NULL DEFAULT 'EN',
    `theme` ENUM('SYSTEM', 'LIGHT', 'DARK') NOT NULL DEFAULT 'SYSTEM',
    `timeFormat` ENUM('H12', 'H24') NOT NULL DEFAULT 'H24',
    `timezone` VARCHAR(191) NOT NULL DEFAULT 'Asia/Shanghai',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CoupleSpace` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CoupleSpace_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Membership` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `coupleSpaceId` VARCHAR(191) NOT NULL,
    `role` ENUM('OWNER', 'PARTNER') NOT NULL,
    `status` ENUM('ACTIVE', 'REMOVED') NOT NULL DEFAULT 'ACTIVE',
    `seatNumber` INTEGER NULL,
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Membership_userId_key`(`userId`),
    INDEX `Membership_coupleSpaceId_status_idx`(`coupleSpaceId`, `status`),
    UNIQUE INDEX `Membership_coupleSpaceId_seatNumber_key`(`coupleSpaceId`, `seatNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PasskeyCredential` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `webAuthnUserId` VARCHAR(191) NOT NULL,
    `credentialId` VARCHAR(191) NOT NULL,
    `publicKey` LONGBLOB NOT NULL,
    `counter` INTEGER NOT NULL DEFAULT 0,
    `transports` TEXT NULL,
    `deviceType` VARCHAR(191) NULL,
    `backedUp` BOOLEAN NULL,
    `label` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastUsedAt` DATETIME(3) NULL,

    UNIQUE INDEX `PasskeyCredential_credentialId_key`(`credentialId`),
    INDEX `PasskeyCredential_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Session` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `tokenHash` VARCHAR(191) NOT NULL,
    `userAgent` TEXT NULL,
    `ipAddress` VARCHAR(191) NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Session_tokenHash_key`(`tokenHash`),
    INDEX `Session_userId_expiresAt_idx`(`userId`, `expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuthChallenge` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `kind` VARCHAR(191) NOT NULL,
    `challenge` TEXT NOT NULL,
    `rpId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AuthChallenge_userId_kind_key`(`userId`, `kind`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RecoveryToken` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `tokenHash` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `consumedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `RecoveryToken_tokenHash_key`(`tokenHash`),
    INDEX `RecoveryToken_userId_expiresAt_idx`(`userId`, `expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PairingInvite` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `coupleSpaceId` VARCHAR(191) NOT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `usedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `PairingInvite_code_key`(`code`),
    INDEX `PairingInvite_coupleSpaceId_expiresAt_idx`(`coupleSpaceId`, `expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Memory` (
    `id` VARCHAR(191) NOT NULL,
    `coupleSpaceId` VARCHAR(191) NOT NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `story` TEXT NOT NULL,
    `occurredAt` DATETIME(3) NOT NULL,
    `sortAt` DATETIME(3) NOT NULL,
    `mood` ENUM('ROMANTIC', 'HAPPY', 'PEACEFUL', 'EXCITED', 'NOSTALGIC', 'GRATEFUL', 'TENDER') NOT NULL,
    `locationName` VARCHAR(191) NULL,
    `latitude` DECIMAL(10, 7) NULL,
    `longitude` DECIMAL(10, 7) NULL,
    `coverAssetId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Memory_coverAssetId_key`(`coverAssetId`),
    INDEX `Memory_coupleSpaceId_sortAt_idx`(`coupleSpaceId`, `sortAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MemoryAsset` (
    `id` VARCHAR(191) NOT NULL,
    `coupleSpaceId` VARCHAR(191) NOT NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `memoryId` VARCHAR(191) NULL,
    `storageKey` VARCHAR(191) NOT NULL,
    `originalUrl` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `width` INTEGER NULL,
    `height` INTEGER NULL,
    `byteSize` INTEGER NULL,
    `blurDataUrl` LONGTEXT NULL,
    `variants` JSON NULL,
    `status` ENUM('PENDING', 'PROCESSED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isCover` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `MemoryAsset_storageKey_key`(`storageKey`),
    INDEX `MemoryAsset_coupleSpaceId_createdAt_idx`(`coupleSpaceId`, `createdAt`),
    INDEX `MemoryAsset_memoryId_sortOrder_idx`(`memoryId`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Anniversary` (
    `id` VARCHAR(191) NOT NULL,
    `coupleSpaceId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `note` TEXT NULL,
    `targetDate` DATETIME(3) NOT NULL,
    `type` ENUM('COUNTDOWN', 'COUNTUP') NOT NULL,
    `reminderDays` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Anniversary_coupleSpaceId_targetDate_idx`(`coupleSpaceId`, `targetDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WishlistItem` (
    `id` VARCHAR(191) NOT NULL,
    `coupleSpaceId` VARCHAR(191) NOT NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `note` TEXT NULL,
    `status` ENUM('DREAMING', 'PLANNING', 'COMPLETED') NOT NULL DEFAULT 'DREAMING',
    `priority` INTEGER NOT NULL DEFAULT 2,
    `linkedMemoryId` VARCHAR(191) NULL,
    `linkedAnniversaryId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `WishlistItem_coupleSpaceId_status_priority_idx`(`coupleSpaceId`, `status`, `priority`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NotificationSubscription` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `endpoint` VARCHAR(191) NOT NULL,
    `p256dh` VARCHAR(191) NOT NULL,
    `auth` VARCHAR(191) NOT NULL,
    `userAgent` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `NotificationSubscription_endpoint_key`(`endpoint`),
    INDEX `NotificationSubscription_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NotificationRecord` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `coupleSpaceId` VARCHAR(191) NOT NULL,
    `channel` ENUM('IN_APP', 'WEB_PUSH', 'EMAIL') NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `body` VARCHAR(191) NOT NULL,
    `payload` JSON NULL,
    `status` ENUM('PENDING', 'SENT', 'READ', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `dedupeKey` VARCHAR(191) NULL,
    `scheduledFor` DATETIME(3) NULL,
    `sentAt` DATETIME(3) NULL,
    `readAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `NotificationRecord_dedupeKey_key`(`dedupeKey`),
    INDEX `NotificationRecord_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `NotificationRecord_coupleSpaceId_status_idx`(`coupleSpaceId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `actorUserId` VARCHAR(191) NULL,
    `coupleSpaceId` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `meta` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Membership` ADD CONSTRAINT `Membership_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Membership` ADD CONSTRAINT `Membership_coupleSpaceId_fkey` FOREIGN KEY (`coupleSpaceId`) REFERENCES `CoupleSpace`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PasskeyCredential` ADD CONSTRAINT `PasskeyCredential_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Session` ADD CONSTRAINT `Session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuthChallenge` ADD CONSTRAINT `AuthChallenge_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RecoveryToken` ADD CONSTRAINT `RecoveryToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PairingInvite` ADD CONSTRAINT `PairingInvite_coupleSpaceId_fkey` FOREIGN KEY (`coupleSpaceId`) REFERENCES `CoupleSpace`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PairingInvite` ADD CONSTRAINT `PairingInvite_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Memory` ADD CONSTRAINT `Memory_coupleSpaceId_fkey` FOREIGN KEY (`coupleSpaceId`) REFERENCES `CoupleSpace`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Memory` ADD CONSTRAINT `Memory_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Memory` ADD CONSTRAINT `Memory_coverAssetId_fkey` FOREIGN KEY (`coverAssetId`) REFERENCES `MemoryAsset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MemoryAsset` ADD CONSTRAINT `MemoryAsset_coupleSpaceId_fkey` FOREIGN KEY (`coupleSpaceId`) REFERENCES `CoupleSpace`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MemoryAsset` ADD CONSTRAINT `MemoryAsset_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MemoryAsset` ADD CONSTRAINT `MemoryAsset_memoryId_fkey` FOREIGN KEY (`memoryId`) REFERENCES `Memory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Anniversary` ADD CONSTRAINT `Anniversary_coupleSpaceId_fkey` FOREIGN KEY (`coupleSpaceId`) REFERENCES `CoupleSpace`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WishlistItem` ADD CONSTRAINT `WishlistItem_coupleSpaceId_fkey` FOREIGN KEY (`coupleSpaceId`) REFERENCES `CoupleSpace`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WishlistItem` ADD CONSTRAINT `WishlistItem_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WishlistItem` ADD CONSTRAINT `WishlistItem_linkedMemoryId_fkey` FOREIGN KEY (`linkedMemoryId`) REFERENCES `Memory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WishlistItem` ADD CONSTRAINT `WishlistItem_linkedAnniversaryId_fkey` FOREIGN KEY (`linkedAnniversaryId`) REFERENCES `Anniversary`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NotificationSubscription` ADD CONSTRAINT `NotificationSubscription_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NotificationRecord` ADD CONSTRAINT `NotificationRecord_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NotificationRecord` ADD CONSTRAINT `NotificationRecord_coupleSpaceId_fkey` FOREIGN KEY (`coupleSpaceId`) REFERENCES `CoupleSpace`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_actorUserId_fkey` FOREIGN KEY (`actorUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_coupleSpaceId_fkey` FOREIGN KEY (`coupleSpaceId`) REFERENCES `CoupleSpace`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

