# Entrega de aplicações

1. Pull request no repositório da aplicação executa lint, testes e build sem credenciais do cluster.
2. Merge em `main` publica imagem no GHCR usando `GITHUB_TOKEN`.
3. O digest da imagem é promovido por alteração GitOps revisável.
4. Argo CD lê o repositório de configuração com GitHub App ou deploy key somente leitura.
5. QA pode usar auto-sync. Produção começa com sync manual e plano de reversão.

O repositório da plataforma controla `AppProject`, destinos e repositórios permitidos. O repositório da aplicação controla Deployments, Services, Ingresses, migrations e dashboards específicos.
