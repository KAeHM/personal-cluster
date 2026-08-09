# Taeria

Aplicação web do RPG **Taeria** — mundo, mesas e sessões de um jogo de interpretação
proprietário, criado e conduzido pelo Mestre (GM).

> Documentação técnica: [`README.md`](README.md) · Convenções de código: [`AGENTS.md`](AGENTS.md)

## O que é

O Taeria é o **companheiro digital do meu RPG**. Não é uma plataforma genérica onde
qualquer pessoa cadastra o próprio mundo — é o lar online do universo Taeria, com regras,
lore e história próprias.

O app reúne duas grandes áreas:

### Worldbuild — o mundo em detalhe

Um espaço rico para o Mestre documentar tudo sobre Taeria: territórios, raças, deuses,
fauna e flora (com estruturas taxonômicas), recursos coletáveis, receitas de crafting,
livros, lendas e muito mais. O objetivo é ter um **mundo vivo e consultável**, não um
bloco de texto solto. O **Studio** é onde o Mestre edita o codex; a **Wiki do jogador**
(hub, índice por tipo em `/wiki/kinds/...` e artigo) mostra o que está público ou
compartilhado com cada convidado.

Cada pedaço de lore pode se conectar a outros (como um mapa de ideias) e, quando fizer
sentido para o jogo, também apontar para regras do sistema — sem misturar tudo num único
tipo genérico de “documento”.

### Mesas e sessões — jogar na mesa

O Mestre cria **mesas** (grupos de jogo), convida **jogadores** e cada um cuida dos
próprios **personagens** naquela mesa. Quando chega a hora de jogar, o Mestre **inicia uma
sessão** com os personagens presentes.

O app **não simula batalhas em grid** nem resolve automaticamente o que acontece entre os
personagens. O Mestre continua narrando e decidindo o desfecho das cenas. O que o Taeria
oferece é **apoio mecânico**: por exemplo, um botão que calcula a rolagem de dados quando
o Mestre pede “tente acertar o alvo” — sem precisar folhear o livro de regras. O resultado
vai para o Mestre, que interpreta e segue a história.

## Quem usa

| Papel           | O que faz                                                                                 |
| --------------- | ----------------------------------------------------------------------------------------- |
| **Mestre (GM)** | Worldbuild, criação de mesas, gestão de sessões, visão dos personagens, rolagens de apoio |
| **Jogador**     | Entra nas mesas em que foi convidado, cria e administra os próprios personagens           |

## Fora de escopo (por enquanto)

- Plataforma multi-mundo (outros GMs cadastrando universos próprios)
- Simulador de combate em grid ou resolução automática de interações entre personagens
- Marketplace de sistemas de RPG de terceiros
- Chat/voz integrado (foco em ferramentas de mesa e lore)

## Stack (herdada do boilerplate)

Next.js 16, Supabase Cloud (Auth + Postgres + Realtime + Storage), DDD-lite + Ports &
Adapters. Banco e autenticação rodam no Supabase; o cluster hospeda só a aplicação web.

## Módulos

| Módulo       | Status           | Notas                                                            |
| ------------ | ---------------- | ---------------------------------------------------------------- |
| `auth`       | Ativo (template) | Login via Supabase; perfis em `profiles`                         |
| `users`      | Ativo (template) | Gestão de contas até termos papéis GM/jogador dedicados          |
| `worldbuild` | Ativo            | Kinds CRUD no Studio; codex/entidades na próxima fase            |
| `tables`     | Planejado        | Mesas, convites, personagens por mesa                            |
| `sessions`   | Planejado        | Sessões de jogo com personagens presentes                        |
| `rolls`      | Planejado        | Cálculo de rolagens do sistema Taeria (Mestre decide o desfecho) |

## Decisões deste projeto

- **Um único mundo:** Taeria — não há “projetos” ou mundos por usuário.
- **Mestre único no worldbuild:** o dono do universo edita o lore; jogadores não alteram o mundo.
- **Supabase Cloud:** sem Supabase local no dia a dia; migrations via CLI linkada ao projeto cloud.
- **Deploy:** app no cluster (`infra/taeria/`); secrets com URL e chaves do Supabase Cloud.
- **Auth:** email/senha (Supabase Auth); papéis `admin` (Mestre) e `user` (jogador) em `profiles` até evoluir o modelo.

## Links

- Monorepo: `personal-cluster` · app em `apps/taeria/`
- Deploy: [`docs/cluster-deploy.md`](docs/cluster-deploy.md)
