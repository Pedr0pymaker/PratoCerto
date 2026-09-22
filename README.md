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

    PRODUTO ||--o{ L
```
