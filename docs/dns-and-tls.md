# DNS e HTTPS automáticos

O domínio público da plataforma é `kaehm.dev`. Cada aplicação declara o endereço completo que deseja publicar; o cluster não depende de uma zona estática como `*.apps.kaehm.dev`.

## Fluxo

1. A aplicação adiciona um `Ingress` com `external-dns.kaehm.dev/publish: "true"`.
2. O ExternalDNS cria ou atualiza no Route 53 um registro `A` para os dois nós de borda.
3. O cert-manager resolve o desafio ACME DNS-01 no Route 53 e obtém o certificado do Let's Encrypt.
4. O Traefik passa a servir o endereço em HTTPS.

O modo inicial do ExternalDNS é `upsert-only`: ele cria e atualiza, mas não apaga registros. Após validar a propriedade TXT e a recuperação, a política pode mudar para `sync` junto com a permissão IAM de `DELETE`.

## Exemplo de aplicação

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: taeria-api
  namespace: prod
  annotations:
    external-dns.kaehm.dev/publish: "true"
    external-dns.kubernetes.io/ttl: "60"
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  ingressClassName: traefik
  tls:
    - hosts: [api.taeria.kaehm.dev]
      secretName: taeria-api-tls
  rules:
    - host: api.taeria.kaehm.dev
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: taeria-api
                port:
                  number: 3000
```

O registro `*.kaehm.dev` não cobre `api.taeria.kaehm.dev`. Esse nome aninhado funciona porque o ExternalDNS cria o registro exato e o cert-manager emite um certificado específico para ele.

## AWS

`aws/dns/stack.yaml` mantém dois usuários técnicos na conta de gerenciamento, onde está a hosted zone:

- `personal-contabo-external-dns`, limitado a criar e atualizar registros de aplicações sob `kaehm.dev`;
- `personal-contabo-cert-manager`, limitado aos registros TXT `_acme-challenge`.

As access keys foram criadas uma única vez em 9 de outubro de 2026, seladas para os namespaces `external-dns` e `cert-manager` e removidas dos arquivos temporários. Nenhum valor em texto puro entra no Git.
