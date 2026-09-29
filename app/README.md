# PratoCerto

Sistema web responsivo de gestão de estoque para restaurantes, lanchonetes, padarias e estabelecimentos de alimentação. Foco em reduzir desperdícios e facilitar o controle de estoque.

## Stack

- **Framework:** [Next.js 16](https://nextjs.org/) com App Router
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS v4
- **Banco de dados:** PostgreSQL (a configurar — veja abaixo)
- **Deploy:** [Vercel](https://vercel.com/) + [Neon PostgreSQL](https://neon.tech/) (recomendado)

## Pré-requisitos

- Node.js >= 18
- npm >= 9
- (Para usar o banco) PostgreSQL local ou conta no [Neon](https://neon.tech/)

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

Abra `.env.local` e configure ao menos a `DATABASE_URL` quando o banco estiver disponível.  
**Nota:** Na Etapa 1, o projeto funciona sem banco de dados configurado.

### 4. Execute o servidor de desenvolvimento

```bash
npm run dev
```

O sistema estará disponível em **http://localhost:3000**.

## Estrutura do projeto

```
app/
├── src/
│   ├── app/                    # App Router do Next.js
│   │   ├── (painel)/           # Grupo de rotas do painel de controle
│   │   │   ├── layout.tsx      # Layout compartilhado (sidebar + header)
│   │   │   ├── dashboard/      # Página do Dashboard
│   │   │   ├── estoque/        # Módulo de Estoque
│   │   │   ├── perdas/         # Módulo de Perdas
│   │   │   ├── compras/        # Módulo de Compras
│   │   │   ├── receitas/       # Módulo de Receitas
│   │   │   ├── relatorios/     # Módulo de Relatórios
│   │   │   ├── ia/             # PratoCerto IA
│   │   │   ├── usuarios/       # Gestão de Usuários
│   │   │   └── configuracoes/  # Configurações
│   │   ├── layout.tsx          # Layout raiz
│   │   ├── page.tsx            # Landing page
│   │   └── globals.css         # Estilos globais e tokens de design
│   ├── components/
│   │   ├── AppShell.tsx        # Layout do painel (sidebar + topbar + main)
│   │   ├── Sidebar.tsx         # Navegação lateral
│   │   └── ComingSoon.tsx      # Placeholder para módulos futuros
│   └── lib/
│       └── db.ts               # Configuração da conexão com PostgreSQL
├── .env.example                # Referência de variáveis de ambiente
├── .gitignore
├── next.config.ts
├── package.json
└── tsconfig.json
```

## Etapas de desenvolvimento

| Etapa | Status | Descrição |
|-------|--------|-----------|
| 1 | ✅ Concluída | Estrutura inicial, navegação, landing page |
| 2 | 🔜 Próxima | Login e autenticação segura |
| 3 | ⏳ Futura | Cadastro de produtos |
| 4 | ⏳ Futura | Fluxo completo de estoque (entradas/saídas) |
| 5 | ⏳ Futura | Registro de perdas |
| 6 | ⏳ Futura | Controle de validade e alertas |
| 7 | ⏳ Futura | Dashboard com dados reais |
| 8 | ⏳ Futura | Interface mobile aprimorada |
| 9 | ⏳ Futura | Entrada por foto de nota fiscal (OCR) |
| 10 | ⏳ Futura | Receitas e baixa automática |
| 11 | ⏳ Futura | Relatórios avançados |
| 12 | ⏳ Futura | Lista de compras |
| 13 | ⏳ Futura | PratoCerto IA |

## Configuração do banco de dados

O banco de dados será implementado na **Etapa 2**. Por enquanto, o arquivo `src/lib/db.ts` está preparado para receber a conexão.

### Para desenvolvimento local
1. Instale o PostgreSQL
2. Crie um banco chamado `pratocerto`
3. Configure `DATABASE_URL` no `.env.local`:
   ```
   DATABASE_URL=postgresql://usuario:senha@localhost:5432/pratocerto
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
