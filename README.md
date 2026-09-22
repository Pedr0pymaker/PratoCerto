# 🍽️ PratoCerto

> **Sistema inteligente de gestão de estoque e redução de desperdícios para estabelecimentos alimentícios.**

O **PratoCerto** é um sistema desenvolvido com o objetivo de auxiliar restaurantes, lanchonetes, padarias e outros estabelecimentos alimentícios no controle de estoque, acompanhamento de perdas, planejamento de compras e redução do desperdício de alimentos.

A proposta é transformar o controle de estoque, que muitas vezes é realizado de forma manual e pouco integrada, em um processo mais **simples, automatizado, acessível e orientado por dados**.

---

## 📌 Status do projeto

🟡 **Em desenvolvimento**

O projeto encontra-se na etapa de planejamento e estruturação inicial.

O desenvolvimento será realizado de forma incremental, utilizando Git e GitHub para controle de versão.

---

# 🎯 Objetivos

## Objetivo geral

Desenvolver um sistema de gestão de estoque para estabelecimentos alimentícios que auxilie no controle de produtos, identificação de perdas, planejamento de compras e redução do desperdício de alimentos por meio de automação e recursos de Inteligência Artificial.

## Objetivos específicos

* 📦 Facilitar o controle de estoque.
* 🧾 Automatizar parte do cadastro de compras.
* 📉 Registrar e analisar perdas de produtos.
* ⏰ Identificar produtos próximos do vencimento.
* 🛒 Auxiliar no planejamento de compras.
* 🍳 Relacionar receitas aos ingredientes utilizados.
* 📊 Disponibilizar relatórios e indicadores.
* 🤖 Utilizar Inteligência Artificial como ferramenta de apoio à decisão.
* 📱 Disponibilizar uma interface adaptada para dispositivos móveis.
* ♿ Desenvolver uma interface acessível e de fácil utilização.
* 🌱 Incentivar práticas de redução de desperdício e melhor aproveitamento dos alimentos.

---

# 💡 Problema

Estabelecimentos alimentícios precisam controlar diariamente produtos, quantidades, validade, compras, consumo e perdas.

Quando essas informações são controladas manualmente ou encontram-se dispersas em diferentes ferramentas, torna-se mais difícil identificar:

* quais produtos estão próximos do vencimento;
* quais itens apresentam maior desperdício;
* quanto dinheiro foi perdido;
* quais produtos precisam ser comprados;
* quais ingredientes possuem maior consumo;
* como o estoque está se comportando ao longo do tempo.

O PratoCerto busca centralizar essas informações em uma única plataforma.

---

# 🚀 Proposta

O sistema pretende unir:

```text
              ┌─────────────────────┐
              │      PratoCerto     │
              └──────────┬──────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   📦 Estoque       📊 Análises       🤖 IA
        │                │                │
        ▼                ▼                ▼
   Produtos          Relatórios      Recomendações
   Lotes             Indicadores     Consultas
   Validades         Perdas          Apoio à decisão
        │                │                │
        └────────────────┼────────────────┘
                         ▼
              🌱 Redução de desperdícios
```

---

# 🧩 Principais funcionalidades

## 📦 Gestão de estoque

* Cadastro de produtos.
* Categorias.
* Unidades de medida.
* Controle por lotes.
* Entrada e saída de produtos.
* Registro de consumo.
* Ajustes de estoque.
* Histórico de movimentações.
* Controle de validade.
* Apoio ao método FIFO.

## 🧾 Gestão de compras

O sistema deverá permitir o registro de compras manualmente e, posteriormente, possibilitar a utilização de fotografia de notas fiscais.

### Fluxo planejado

```text
📷 Foto da nota
      ↓
🤖 OCR / IA
      ↓
📄 Informações interpretadas
      ↓
👤 Conferência do usuário
      ↓
✏️ Correção / vinculação de produtos
      ↓
✅ Confirmação
      ↓
📦 Criação dos lotes
      ↓
📈 Atualização do estoque
```

> **Regra importante:** a interpretação realizada pela IA não deverá alterar o estoque definitivo sem a confirmação do usuário.

---

# 📉 Controle de perdas

As perdas poderão ser registradas por diferentes motivos:

```text
VENCIMENTO
DETERIORAÇÃO
SOBRA
PREPARO / ACIDENTE
OUTRO
```

Cada perda deverá permitir o acompanhamento de:

* produto;
* lote;
* quantidade;
* motivo;
* valor estimado;
* usuário responsável;
* data e hora;
* observações.

---

# 🍳 Receitas e consumo

O sistema poderá relacionar receitas aos produtos utilizados.

Exemplo:

```text
Receita: Pizza Calabresa

        ┌─────────────────────┐
        │   Pizza Calabresa   │
        └──────────┬──────────┘
                   │
       ┌───────────┼───────────┐
       ▼           ▼           ▼
   Farinha      Queijo      Calabresa
    500 g        300 g        200 g
```

A partir dessas relações, o sistema poderá auxiliar na estimativa do consumo de ingredientes.

---

# 🤖 PratoCerto IA

A Inteligência Artificial será utilizada principalmente como **ferramenta de apoio à decisão**, e não como substituta da confirmação humana em operações críticas.

Exemplos de perguntas:

> "Quais produtos tiveram mais desperdício este mês?"

> "Quanto perdi com alimentos vencidos?"

> "Compare as perdas de agosto e setembro."

> "Quais produtos estão próximos do vencimento?"

> "O que merece atenção hoje?"

A IA deverá utilizar os dados disponíveis no sistema e informar quando não houver dados suficientes para responder.

### Princípios

```text
                 🤖 PratoCerto IA
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
      Dados reais    Contexto      Permissões
          │             │             │
          └─────────────┼─────────────┘
                        ▼
                 Análise / resposta
                        │
                        ▼
                 👤 Decisão humana
```

A IA não deverá inventar informações, números ou causas que não estejam sustentados pelos dados disponíveis.

---

# 🗄️ Modelo de dados

O modelo inicial foi planejado para representar estabelecimentos, usuários, produtos, lotes, movimentações, perdas, receitas e compras.

```mermaid
erDiagram
    ESTABELECIMENTO ||--o{ USUARIO : possui
    ESTABELECIMENTO ||--o{ PRODUTO : possui
    ESTABELECIMENTO ||--o{ RECEITA : possui
    ESTABELECIMENTO ||--o{ COMPRA : realiza

    PRODUTO ||--o{ LOTE_ESTOQUE : possui
    PRODUTO ||--o{ MOVIMENTACAO_ESTOQUE : movimenta
    PRODUTO ||--o{ PERDA : registra
    PRODUTO ||--o{ RECEITA_INGREDIENTE : utiliza
    PRODUTO ||--o{ ITEM_COMPRA : comprado

    LOTE_ESTOQUE ||--o{ MOVIMENTACAO_ESTOQUE : movimenta
    LOTE_ESTOQUE ||--o{ PERDA : origina

    USUARIO ||--o{ MOVIMENTACAO_ESTOQUE : realiza
    USUARIO ||--o{ PERDA : registra
    USUARIO ||--o{ COMPRA : registra

    RECEITA ||--o{ RECEITA_INGREDIENTE : possui

    COMPRA ||--o{ ITEM_COMPRA : possui
    ITEM_COMPRA ||--o| LOTE_ESTOQUE : origina

    Entidades principais
Entidade	Finalidade
ESTABELECIMENTO	Representa o estabelecimento
USUARIO	Usuários e permissões
PRODUTO	Produtos controlados pelo sistema
LOTE_ESTOQUE	Controle de quantidade, validade e custo por lote
MOVIMENTACAO_ESTOQUE	Histórico das movimentações
PERDA	Registro de desperdícios
RECEITA	Cadastro de receitas
RECEITA_INGREDIENTE	Relação entre receitas e produtos
COMPRA	Registro de compras
ITEM_COMPRA	Produtos pertencentes a uma compra

O estoque atual não será armazenado como uma segunda fonte de informação em PRODUTO. Ele será obtido a partir das quantidades dos lotes.

🏗️ Arquitetura planejada
┌──────────────────────────────────────────┐
│              INTERFACE                   │
│       Web / Desktop / Mobile             │
└────────────────────┬─────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────┐
│          APLICAÇÃO / API                 │
│       Next.js + TypeScript               │
└──────────────┬───────────────┬───────────┘
               │               │
               ▼               ▼
        ┌─────────────┐  ┌──────────────┐
        │ PostgreSQL  │  │ Serviços de  │
        │             │  │ IA / OCR     │
        └─────────────┘  └──────────────┘
Tecnologias planejadas
Tecnologia	Utilização
Next.js	Aplicação web
TypeScript	Desenvolvimento
PostgreSQL	Banco de dados
Prisma	Acesso ao banco
NextAuth	Autenticação
Tailwind CSS	Interface
Zod	Validação
Git	Controle de versão
GitHub	Hospedagem do código
🔐 Segurança

A segurança será considerada desde as primeiras etapas do desenvolvimento.

Entre as medidas planejadas:

Hash seguro de senhas.
Controle de acesso por usuário e perfil.
Validação de dados no servidor.
Queries parametrizadas/ORM.
Uso de variáveis de ambiente.
Controle de permissões por estabelecimento.
Registro de operações importantes.
Prevenção de estoque negativo.
Confirmação de operações críticas.

O projeto também considera referências de segurança para aplicações web, como o OWASP Top 10, atualmente em sua versão 2025.

♿ Acessibilidade

A interface deverá buscar atender diferentes necessidades de utilização.

Entre as medidas planejadas:

contraste adequado;
textos legíveis;
ícones acompanhados de texto;
navegação por teclado;
não depender somente de cores para transmitir informações;
redução de animações quando necessário;
organização visual simples;
interface responsiva;
utilização de recursos compatíveis com tecnologias assistivas quando possível.
🧠 Desenvolvimento com Inteligência Artificial

O desenvolvimento do PratoCerto considera a utilização de ferramentas de Inteligência Artificial como apoio ao processo de Engenharia de Software.

Entretanto, as decisões técnicas, testes, validações e alterações no projeto deverão ser revisadas pelos desenvolvedores.

Essa abordagem é relevante porque pesquisas sobre Engenharia de Software para sistemas baseados em IA apontam desafios específicos relacionados a testes, qualidade, manutenção e gerenciamento de dados. Martínez-Fernández et al. realizaram uma pesquisa sistemática sobre práticas de Engenharia de Software aplicadas a sistemas baseados em IA, enquanto Nascimento et al. analisaram desafios e práticas de Engenharia de Software para sistemas de IA e Machine Learning.

Pesquisas mais recentes também investigam o uso de Large Language Models (LLMs) em diferentes atividades da Engenharia de Software, incluindo seus benefícios e limitações.

Para o uso responsável de IA no próprio sistema, será considerada como referência a estrutura NIST AI Risk Management Framework, que organiza atividades relacionadas à gestão de riscos de IA nas funções Govern, Map, Measure e Manage.

📚 Referências bibliográficas
Engenharia de Software e Inteligência Artificial

MARTÍNEZ-FERNÁNDEZ, Silverio et al. Software Engineering for AI-Based Systems: A Survey. ACM Transactions on Software Engineering and Methodology, 2022. DOI: 10.1145/3492439.

NASCIMENTO, Elizamary; NGUYEN-DUC, Anh; SUNDBØ, Ingrid; CONTE, Tayana. Software engineering for artificial intelligence and machine learning software: A systematic literature review. 2020.

HOU, Xinyi et al. Large Language Models for Software Engineering: A Systematic Literature Review. ACM Transactions on Software Engineering and Methodology, 2024. DOI: 10.1145/3695988.

Inteligência Artificial responsável

TABASSI, Elham. Artificial Intelligence Risk Management Framework (AI RMF 1.0). National Institute of Standards and Technology, 2023. NIST AI 100-1.

Segurança

OWASP FOUNDATION. OWASP Top 10:2025. Open Worldwide Application Security Project.

🛣️ Roadmap
                    PRATOCERTO
                        │
        ┌───────────────┴───────────────┐
        │                               │
        ▼                               ▼
   📋 Planejamento                 🗃️ Estrutura
        │                               │
        └───────────────┬───────────────┘
                        ▼
                 🔐 Autenticação
                        │
                        ▼
                 📦 Estoque
                        │
                        ▼
                  📉 Perdas
                        │
                        ▼
                 📊 Relatórios
                        │
                        ▼
                 🧾 Compras
                        │
                        ▼
                  📱 Mobile
                        │
                        ▼
                 🤖 IA / OCR
                        │
                        ▼
              🌱 Reaproveitamento
Futuras oportunidades de melhoria
📷 Leitura automática de notas fiscais.
🔎 Leitura de códigos de barras.
📱 Aplicativo/mobile mais completo.
🧠 Assistente de IA com consultas em linguagem natural.
🛒 Lista de compras inteligente.
📊 Indicadores avançados de desperdício.
🔄 Integração com sistemas de ponto de venda (PDV).
📦 Sugestões de reposição de estoque.
🌱 Recursos para reaproveitamento e doação.
📈 Indicadores históricos e comparativos.
🔗 Integração com fornecedores.
⚡ Automação de processos repetitivos.
🏆 Futuro Índice PratoCerto para acompanhamento da eficiência do estabelecimento.
🧪 Metodologia de desenvolvimento

O desenvolvimento será realizado de maneira incremental.

Cada etapa deverá:

possuir um objetivo definido;
gerar uma alteração pequena e verificável;
ser testada antes da próxima etapa;
ser registrada no Git;
passar por revisão;
respeitar a especificação oficial (spec.md).
📋 Especificação
       ↓
🧩 Pequena implementação
       ↓
🧪 Teste
       ↓
🔎 Revisão
       ↓
✅ Aprovação
       ↓
💾 Commit
       ↓
➡️ Próxima etapa
📁 Documentação do projeto

Os principais documentos do projeto incluem:

PratoCerto/
│
├── README.md
├── spec.md
│
└── documentação/
    └── documento-mestre

O arquivo spec.md representa a especificação técnica oficial do sistema e deverá ser utilizado como referência durante o desenvolvimento.

👥 Projeto acadêmico

Projeto: PratoCerto
Área: Desenvolvimento de Sistemas / Tecnologia da Informação
Instituição: IFRO – Campus Porto Velho Calama
Curso: Técnico em Informática Integrado ao Ensino Médio

📌 Repositório

O desenvolvimento do projeto está sendo realizado neste repositório do GitHub.

Status: desenvolvimento em andamento.
