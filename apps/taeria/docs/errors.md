# Catálogo de erros

Documento gerado automaticamente por `npm run errors:doc`.

## common

| Código              | Chave      | HTTP | Severidade | Expõe ao cliente | Mensagem                                             | Descrição                                                                          |
| ------------------- | ---------- | ---- | ---------- | ---------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `COMMON_INTERNAL`   | INTERNAL   | 500  | unexpected | não              | Ocorreu um erro interno. Tente novamente mais tarde. | Erro inesperado ou falha não categorizada. Investigar logs pelo errorId ou digest. |
| `COMMON_NOT_FOUND`  | NOT_FOUND  | 404  | expected   | sim              | Recurso não encontrado.                              | Recurso solicitado não existe ou não está disponível.                              |
| `COMMON_VALIDATION` | VALIDATION | 422  | expected   | sim              | Os dados enviados são inválidos.                     | Falha de validação de entrada (schema, formato ou regra de negócio).               |

## auth

| Código              | Chave        | HTTP | Severidade | Expõe ao cliente | Mensagem                                          | Descrição                                                      |
| ------------------- | ------------ | ---- | ---------- | ---------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| `AUTH_UNAUTHORIZED` | UNAUTHORIZED | 401  | expected   | sim              | Autenticação necessária.                          | Sessão ausente ou inválida. Usuário precisa estar autenticado. |
| `AUTH_FORBIDDEN`    | FORBIDDEN    | 403  | expected   | sim              | Você não tem permissão para acessar este recurso. | Usuário autenticado sem a role ou permissão exigida.           |

## users

| Código             | Chave       | HTTP | Severidade | Expõe ao cliente | Mensagem                   | Descrição                                           |
| ------------------ | ----------- | ---- | ---------- | ---------------- | -------------------------- | --------------------------------------------------- |
| `USER_NOT_FOUND`   | NOT_FOUND   | 404  | expected   | sim              | Usuário não encontrado.    | Nenhum usuário corresponde ao id informado.         |
| `USER_EMAIL_TAKEN` | EMAIL_TAKEN | 409  | expected   | sim              | Este email já está em uso. | Tentativa de criar usuário com email já cadastrado. |
