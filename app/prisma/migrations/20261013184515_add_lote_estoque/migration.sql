-- CreateTable
CREATE TABLE `lotes_estoque` (
    `id` VARCHAR(191) NOT NULL,
    `produtoId` VARCHAR(191) NOT NULL,
    `quantidadeInicial` DECIMAL(10, 3) NOT NULL,
    `quantidadeAtual` DECIMAL(10, 3) NOT NULL,
    `dataEntrada` DATETIME(3) NOT NULL,
    `dataValidade` DATETIME(3) NULL,
    `custoUnitario` DECIMAL(10, 2) NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `lotes_estoque_produtoId_idx`(`produtoId`),
    INDEX `lotes_estoque_dataValidade_idx`(`dataValidade`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `lotes_estoque` ADD CONSTRAINT `lotes_estoque_produtoId_fkey` FOREIGN KEY (`produtoId`) REFERENCES `produtos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
