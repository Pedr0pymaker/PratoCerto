# PratoCerto

Sistema web responsivo de gestão de estoque para restaurantes, lanchonetes, padarias e estabelecimentos de alimentação. Foco em reduzir desperdícios e facilitar o controle de estoque.

## Stack

- **Framework:** [Next.js 16](https://nextjs.org/) com App Router
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS v4
- **Banco de dados:** MySQL 8.0 (via Prisma ORM)
- **Autenticação:** JWT seguro em cookies HTTP-Only com hash de senhas via bcrypt
- **Deploy:** [Vercel](https://vercel.com/) + MySQL gerenciado (ex: PlanetScale, Railway, AWS RDS)

## Pré-requisitos

- Node.js >= 18
- npm >= 9
- MySQL Server local (ou remoto) rodando na porta 3306

## Como executar localmente

### 1. Clone o repositório

```bash
git clone https://github.com/Pedr0pymaker/PratoCerto.git
cd PratoCerto/app
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Copie o arquivo de exemplo e preencha com seus dados:

```bash
cp .env.example .env.local
```

Abra `.env.local` e configure a `DATABASE_URL` do MySQL e o `AUTH_SECRET`:
```env
DATABASE_URL="mysql://root:suasenha@localhost:3306/pratocerto"
AUTH_SECRET="chave_secreta_longa_e_aleatoria_com_mais_de_32_caracteres"
```

### 4. Aplique as migrações no MySQL e crie o primeiro Gerente

```bash
npx prisma migrate dev
npm run seed:admin
```

O comando `npm run seed:admin` criará o usuário GERENTE inicial com credenciais exibidas com segurança no terminal.

### 5. Execute o servidor de desenvolvimento

```bash
npm run dev
```

O sistema estará disponível em **http://localhost:3000**.

## Perfis de Usuário

O PratoCerto suporta dois tipos de usuário com permissões diferenciadas:

- **GERENTE:** Acesso completo a todos os módulos, incluindo Gestão de Usuários (`/usuarios`), criação e gerenciamento de contas, relatórios e estoque.
- **FUNCIONARIO:** Acesso operacional aos módulos de estoque, compras, perdas e receitas. Não tem acesso à tela ou endpoints de gestão de usuários.

## Estrutura do projeto

```
app/
├── prisma/
│   ├── migrations/             # Migrações versionadas do MySQL
│   └── schema.prisma           # Modelos de dados (Produto, Usuario)
├── src/
│   ├── app/                    # App Router do Next.js
│   │   ├── (painel)/           # Grupo de rotas protegidas
│   │   │   ├── layout.tsx      # Layout compartilhado com controle de sessão
│   │   │   ├── dashboard/      # Página do Dashboard
│   │   │   ├── estoque/        # Módulo de Estoque (Produtos)
│   │   │   ├── usuarios/       # Gestão de Usuários (Apenas GERENTE)
│   │   │   └── ...             # Demais módulos
│   │   ├── api/
│   │   │   ├── auth/           # Login, logout e verificação de sessão (/me)
│   │   │   ├── produtos/       # Cadastro e consulta de produtos
│   │   │   └── usuarios/       # CRUD de usuários com controle de perfil
│   │   ├── login/              # Tela de login
│   │   ├── layout.tsx          # Layout raiz
│   │   └── globals.css         # Estilos globais
│   ├── components/             # Componentes reutilizáveis
│   ├── lib/
│   │   ├── auth.ts             # Funções de hash (bcrypt) e JWT (jose)
│   │   ├── db.ts               # Conexão com MySQL via Prisma Client
│   │   └── validations/        # Schemas de validação de dados
│   └── middleware.ts           # Proteção de rotas e controle de acesso
├── scripts/
│   └── seed-admin.mjs          # Script seguro de criação do primeiro gerente
├── .env.example                # Referência de variáveis de ambiente
├── package.json
└── tsconfig.json
```

## Etapas de desenvolvimento

| Etapa | Status | Descrição |
|-------|--------|-----------|
| 1 | ✅ Concluída | Estrutura inicial, navegação, layout responsivo |
| 2 | ✅ Concluída | Cadastro e consulta de produtos com persistência em banco |
| 3 | ✅ Concluída | Migração para MySQL, autenticação JWT, cookies HTTP-Only e perfis (GERENTE e FUNCIONARIO) |
| 4 | ⏳ Futura | Fluxo completo de estoque (entradas, saídas e lotes FIFO) |
| 5 | ⏳ Futura | Registro e motivos de perdas |
| 6 | ⏳ Futura | Controle de validade e alertas |
| 7 | ⏳ Futura | Dashboard com métricas reais |
| 8 | ⏳ Futura | Interface mobile aprimorada |
| 9 | ⏳ Futura | Entrada por foto de nota fiscal (OCR) |
| 10 | ⏳ Futura | Receitas e baixa automática |
| 11 | ⏳ Futura | Relatórios avançados |
| 12 | ⏳ Futura | Lista de compras |
| 13 | ⏳ Futura | PratoCerto IA |

## Configuração do banco de dados (MySQL)

1. Instale o MySQL 8.0 ou utilize um serviço compatível na nuvem
2. Crie um banco chamado `pratocerto`:
   ```sql
   CREATE DATABASE pratocerto CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Configure `DATABASE_URL` no `.env.local`:
   ```
   DATABASE_URL="mysql://usuario:senha@localhost:3306/pratocerto"
   ```
4. Execute as migrações:
   ```bash
   npx prisma migrate dev
   ```

### Para produção (Vercel + Neon)
1. Crie um projeto no [Neon](https://neon.tech/)
2. Copie a connection string fornecida
3. Configure como variável de ambiente no painel da Vercel

## Variáveis de ambiente necessárias

Consulte o arquivo [`.env.example`](.env.example) para a lista completa.

## Deploy na Vercel

1. Conecte o repositório à Vercel
2. Configure as variáveis de ambiente no painel da Vercel
3. Deploy automático a cada push na branch `main`

## Especificação do sistema

A especificação completa está em [`../ideia_principal/spec 1.1.md`](../ideia_principal/spec%201.1.md).

---

Desenvolvido com foco em **redução de desperdícios** e **acessibilidade** para o setor de alimentação.
