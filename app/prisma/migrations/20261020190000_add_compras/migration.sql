CREATE TABLE `pedidos_compra` (
    `id` VARCHAR(191) NOT NULL,
    `fornecedor` VARCHAR(200) NULL,
    `dataPedido` DATETIME(3) NOT NULL,
    `observacoes` VARCHAR(500) NULL,
    `status` ENUM('PENDENTE', 'RECEBIDO', 'CANCELADO') NOT NULL DEFAULT 'PENDENTE',
    `total` DECIMAL(12, 2) NOT NULL,
    `dataRecebimento` DATETIME(3) NULL,
    `dataCancelamento` DATETIME(3) NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,

    INDEX `pedidos_compra_status_dataPedido_idx`(`status`, `dataPedido`),
    INDEX `pedidos_compra_dataPedido_idx`(`dataPedido`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `itens_pedido_compra` (
    `id` VARCHAR(191) NOT NULL,
    `pedidoId` VARCHAR(191) NOT NULL,
    `produtoId` VARCHAR(191) NOT NULL,
    `quantidade` DECIMAL(10, 3) NOT NULL,
    `custoUnitario` DECIMAL(10, 2) NOT NULL,
    `total` DECIMAL(12, 2) NOT NULL,
    `dataValidade` DATETIME(3) NULL,

    INDEX `itens_pedido_compra_pedidoId_idx`(`pedidoId`),
    INDEX `itens_pedido_compra_produtoId_idx`(`produtoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `itens_pedido_compra` ADD CONSTRAINT `itens_pedido_compra_pedidoId_fkey`
    FOREIGN KEY (`pedidoId`) REFERENCES `pedidos_compra`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `itens_pedido_compra` ADD CONSTRAINT `itens_pedido_compra_produtoId_fkey`
    FOREIGN KEY (`produtoId`) REFERENCES `produtos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
