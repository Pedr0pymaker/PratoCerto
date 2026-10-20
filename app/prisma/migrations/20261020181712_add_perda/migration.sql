-- CreateTable
CREATE TABLE `perdas` (
    `id` VARCHAR(191) NOT NULL,
    `produtoId` VARCHAR(191) NOT NULL,
    `usuarioId` VARCHAR(191) NOT NULL,
    `quantidade` DECIMAL(10, 3) NOT NULL,
    `motivo` VARCHAR(30) NOT NULL,
    `custoEstimado` DECIMAL(10, 2) NOT NULL,
    `observacao` VARCHAR(500) NULL,
    `dataHora` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `perdas_produtoId_idx`(`produtoId`),
    INDEX `perdas_usuarioId_idx`(`usuarioId`),
    INDEX `perdas_motivo_idx`(`motivo`),
    INDEX `perdas_dataHora_idx`(`dataHora`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `perdas` ADD CONSTRAINT `perdas_produtoId_fkey` FOREIGN KEY (`produtoId`) REFERENCES `produtos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `perdas` ADD CONSTRAINT `perdas_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
