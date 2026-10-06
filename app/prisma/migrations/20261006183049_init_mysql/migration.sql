-- CreateTable
CREATE TABLE `produtos` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(200) NOT NULL,
    `categoria` VARCHAR(100) NOT NULL,
    `unidadeMedida` VARCHAR(50) NOT NULL,
    `estoqueMinimo` DECIMAL(10, 3) NOT NULL,
    `estoqueIdeal` DECIMAL(10, 3) NOT NULL,
    `custoReferencia` DECIMAL(10, 2) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,

    INDEX `produtos_ativo_idx`(`ativo`),
    INDEX `produtos_categoria_idx`(`categoria`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuarios` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(150) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `senhaHash` VARCHAR(255) NOT NULL,
    `perfil` VARCHAR(20) NOT NULL DEFAULT 'FUNCIONARIO',
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,

    UNIQUE INDEX `usuarios_email_key`(`email`),
    INDEX `usuarios_email_idx`(`email`),
    INDEX `usuarios_perfil_idx`(`perfil`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
