# Módulo `worldbuild`

Worldbuild do Taeria — tipos de entidade (`kind`), entradas do codex e Studio Create com Gemini.

## Status

- **Kinds CRUD** — `/studio/kinds`
- **Studio Create** — `/studio/create` (chat + rascunho + persistência no codex)
- **Codex** — `codex_entry`, `codex_facet`, `codex_edge`, `studio_session`

## Modelo

```
kind
  └── kind_facet_config (uma linha por facet_type)
```

### Facetas (`facet_type`)

| Tipo         | Papel                                           |
| ------------ | ----------------------------------------------- |
| `lore`       | Conteúdo narrativo                              |
| `system`     | Regras/schemas fechados do RPG                  |
| `lexicon`    | Língua antiga                                   |
| `visual`     | Banner e assets visuais                         |
| `edges`      | Tipos de relação permitidos + schema de payload |
| `embeddings` | Habilita RAG do Studio (chunk + embed pós-save) |

Ao criar um kind, o use case insere **sempre 6 linhas** em `kind_facet_config` (uma por tipo).

### Kinds do seed (`make db-seed`)

O script [`scripts/seed-kinds.ts`](../../scripts/seed-kinds.ts) faz upsert idempotente dos kinds (usuários + kinds). O catálogo taxonômico (Selos/Reinos/Classes) vem em [`scripts/seed-taxonomy.ts`](../../scripts/seed-taxonomy.ts).

Kinds: `lenda`, `personagem`, `lugar`, `livro`, `raca`, `escola`, `habilidade`, `equipamento`, `receita`, `recurso`, `criatura`, `planta`, `divindade`, `organizacao`, `termo`, `taxon`.

### Taxonomia da Ordem dos Seres

| Papel                   | Kind                  | Edge                                           |
| ----------------------- | --------------------- | ---------------------------------------------- |
| Espécie (ficha de jogo) | `criatura` / `planta` | `classified_as` → taxon pai (em geral Classe)  |
| Acima da espécie        | `taxon`               | `taxonomy` filho → pai (Classe → Reino → Selo) |

Caminho completo na wiki = walk `classified_as` + cadeia `taxonomy`. Browse de criatura/planta = `treeGrouped` por Classe; `/wiki/kinds/taxon` = árvore do tratado.

Entradas antigas com `taxonomy` same-kind entre criaturas não são migradas automaticamente — converter manualmente para `classified_as` quando necessário.

### Wiki — config por kind

Arquivo [`application/wiki/wiki-kind-config.ts`](application/wiki/wiki-kind-config.ts) (sem migration):

| Config           | Valores                                                             |
| ---------------- | ------------------------------------------------------------------- |
| Hub              | `historia`, `mundo`, `sistema`, `referencia`                        |
| Browse           | `grid`, `tree`, `treeGrouped`, `recipe`, `equipamento`              |
| Layout de artigo | `default`, `statBlock`, `technique`, `recipe`, `reading`, `lexicon` |

**Convenção `taxonomy`:** edge `from_entry` = filho (mais específico), `to_entry` = pai (mais amplo). Raízes = entradas sem pai no conjunto visível. Ordenação de irmãos: `payload.rank` → `system.ordem` (escola/habilidade) → `title`.

**Convenção `classified_as`:** espécie → nó `taxon`; label na UI “Classificação”.

Browse em árvore: `getWikiKindTreeBrowse` + `buildWikiTaxonomyTree` + `listTaxonomyEdgesForKind` / `listClassifiedAsEdgesForKind` no repositório wiki.

**Layouts de artigo** (`WikiEntryLayoutVariant` em `src/app/wiki/_components/`):

| Modo        | Componente                                   | Kinds                         |
| ----------- | -------------------------------------------- | ----------------------------- |
| `statBlock` | `WikiStatBlock`                              | `personagem`, `criatura`      |
| `technique` | `WikiTechniqueSheet` + breadcrumb taxonômico | `habilidade`                  |
| `recipe`    | `WikiRecipePanel` acima do lore              | `receita`                     |
| `reading`   | hero compacto + prose dominante              | `livro`, `lenda`, `divindade` |
| `lexicon`   | termo/tradução no hero; lore como etimologia | `termo`                       |
| `default`   | scroll view + sidebar + related              | demais                        |

`getWikiEntryBySlug` carrega `taxonomy.ancestors` e `taxonomy.children` para breadcrumb e técnicas derivadas.

Regras globais do sistema (fórmulas PVel/Estamina/Mana, ações base, catálogo de status) ficam no **motor** (`rolls`, futuro) — não viram kind no codex.

### Exemplo de schema `edges`

```json
{
  "allowedTypes": ["related_to", "taxonomy"],
  "payloads": {
    "related_to": {
      "type": "object",
      "properties": { "strength": { "type": "string" } }
    },
    "taxonomy": {
      "type": "object",
      "properties": { "rank": { "type": "string" } }
    }
  }
}
```

## Estrutura

```
worldbuild/
  domain/
    facet-type.ts
    kind.ts
    kind-facet-config.ts
    kind.repository.ts
    errors.ts
  application/
    schemas/kind.schema.ts
    use-cases/
  infrastructure/
    adapters/supabase/kind.repository.ts
    kind.repository.factory.ts
  presentation/
    actions/kind.actions.ts
```

## Studio Create

1. Mestre abre `/studio/create` e escolhe **Assistente** (chat + IA) ou **Formulário** (campos manuais).
2. No assistente: `POST /api/studio/chat` roda o orquestrador (Planner → Context → agentes de faceta); o painel de rascunho usa `createCodexFromDraftAction`.
3. No formulário: escolhe o kind, preenche identidade/facetas/relações/visibilidade e salva com `createCodexEntryAction` (sem IA).

Atalho: `/studio/create?mode=form` ou o botão **Nova entrada** na lista de entradas.

Requer `GOOGLE_GENERATIVE_AI_API_KEY` no servidor só para o modo Assistente. Modelos: `GEMINI_MODEL` (default `gemini-2.5-flash`), `GEMINI_MODEL_PRO` opcional para lore.

### RAG + taxonomia assistida

O context agent consulta o codex por **busca semântica** antes de gerar — a IA escreve lore consistente com o mundo já criado.

- **Indexação:** `create-codex-from-draft` e `update-codex-entry` chamam `embedCodexEntrySafe` ao final (não-fatal — falha só loga). Chunking puro em [`application/ai/entry-chunks.ts`](application/ai/entry-chunks.ts): título + `lore_md` em blocos de ~1200 chars + system/lexicon serializados. Gate: facet `embeddings` do kind (o seed habilita em todos).
- **Modelo:** `gemini-embedding-001` com `outputDimensionality: 1536` (coluna `codex_embedding.embedding vector(1536)`); override via `GEMINI_EMBEDDING_MODEL`.
- **Busca:** RPC `match_codex_entries` (migration `20260715000000`) com índice HNSW por cosseno; port `searchSimilar` / `replaceEmbeddings` no `CodexRepository`. Roda com client admin — entradas privadas participam do contexto (Studio é só do Mestre).
- **Retrieval:** `runContextAgent` embeda `userMessage + planner.summary` e injeta top 8 trechos (~400 chars) no prompt; sem resultados/embeddings, mantém a busca keyword como fallback.
- **Aprofundamento (tools):** antes do `generateObject` de contexto, o context agent roda `deepenCanonWithTools` — loop `generateText` com `getCodexEntry` / `getEntryEdges` sobre candidatas do RAG (máx. 4 steps). Se o LLM falhar ou não chamar tools, enriquece as top 3 candidatas de forma determinística. Os dossiês vão em `GenerationContext.canonNotes` para os agentes escritores.
- **Taxonomia sugerida:** quando o schema `edges` do kind permite `taxonomy`, o context agent lista candidatos a pai (mesmo kind + kind agrupador, ex. `escola` para `habilidade`) e devolve `taxonomyParentSlug` validado. O `edges-resolver` adiciona a edge `taxonomy` respeitando `allowedTypes`, sem duplicar; o Mestre revisa no editor de relações antes de criar.
- **Backfill:** `make embed-backfill` indexa o codex existente ([`scripts/backfill-embeddings.ts`](../../scripts/backfill-embeddings.ts)).
- **Editor de relações:** combobox com busca (`searchCodexEntriesAction`) no lugar do slug livre; campo `rank` (payload) quando tipo = `taxonomy`.

## Entrada

- **Kinds:** Server Actions + `requireRole("admin")`
- **Studio Create:** `POST /api/studio/chat` + `createCodexFromDraftAction`

Sem API `/api/v1` para codex nesta entrega.

## Erros (codex)

| Código                    | Quando                           |
| ------------------------- | -------------------------------- |
| `CODEX_NOT_FOUND`         | entrada inexistente              |
| `CODEX_SLUG_TAKEN`        | slug duplicado no codex          |
| `CODEX_KIND_NOT_FOUND`    | kind do rascunho inválido        |
| `CODEX_VALIDATION_FAILED` | draft não passa na validação Zod |
| `STUDIO_AI_UNAVAILABLE`   | Gemini não configurado           |

## Erros (kinds)

| Código                        | Quando                             |
| ----------------------------- | ---------------------------------- |
| `KIND_NOT_FOUND`              | id inexistente                     |
| `KIND_SLUG_TAKEN`             | slug duplicado                     |
| `KIND_BUILTIN_DELETE`         | excluir kind com `is_builtin=true` |
| `KIND_BUILTIN_SLUG_IMMUTABLE` | alterar slug de kind integrado     |

`KIND_IN_USE` reservado para quando existir `codex_entry` referenciando o kind.
