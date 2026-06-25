# Observabilidade do cluster

Stack de monitoramento no namespace `monitoring`:

| Componente  | Função                          | Acesso interno                                      |
| ----------- | ------------------------------- | --------------------------------------------------- |
| Grafana Alloy | Coleta logs + recebe OTLP     | `http://alloy.monitoring.svc.cluster.local:4318`    |
| Loki        | Armazena logs                   | `http://loki.monitoring.svc.cluster.local:3100`     |
| Prometheus  | Scrape de métricas              | `http://prometheus-server.monitoring.svc.cluster.local:80` |
| Tempo       | Armazena traces                 | `http://tempo.monitoring.svc.cluster.local:3200`    |
| Grafana     | UI (Tailscale)                  | `https://grafana.tail412374.ts.net`                 |

## ArgoCD

Apps em `infra/argocd-apps/`:

- `observability-manifests` — ConfigMap do Alloy (`alloy-config.river`)
- `alloy` — DaemonSet em todos os nodes
- `tempo` — single-binary com storage local
- `loki`, `prometheus`, `grafana` — já existentes (atualizados)

## Apps derivadas do boilerplate

Configure no Deployment:

```yaml
env:
  - name: LOG_LEVEL
    value: "info"
  - name: OTEL_SERVICE_NAME
    value: "<app-slug>-web"
  - name: OTEL_EXPORTER_OTLP_ENDPOINT
    value: "http://alloy.monitoring.svc.cluster.local:4318"
  - name: OTEL_EXPORTER_OTLP_PROTOCOL
    value: "http/protobuf"
```

No Service, annotations para Prometheus:

```yaml
metadata:
  annotations:
    prometheus.io/scrape: "true"
    prometheus.io/port: "3000"
    prometheus.io/path: "/api/metrics"
```

## Queries LogQL

Logs JSON do Pino — filtre por namespace e serviço:

```logql
{namespace="meu-app"} | json | service="meu-app-web"
{namespace="meu-app"} | json | trace_id="abc123"
{namespace="monitoring"} | json
```

## Validação

1. **Alloy:** `kubectl get pods -n monitoring -l app.kubernetes.io/name=alloy` — um pod por node
2. **Loki:** Grafana → Explore → Loki → `{namespace="monitoring"}`
3. **Prometheus:** Status → Targets → job `kubernetes-pods` com pods anotados UP
4. **Tempo:** enviar span de teste:

```bash
kubectl run otel-test --rm -it --restart=Never --image=curlimages/curl -- \
  curl -X POST http://alloy.monitoring.svc.cluster.local:4318/v1/traces \
  -H "Content-Type: application/x-protobuf" --data-binary @/dev/null
```

Ou verifique traces de apps com `OTEL_EXPORTER_OTLP_ENDPOINT` configurado.

## Configuração Alloy

Fonte: [`alloy-config.river`](alloy-config.river) — montada via Kustomize em ConfigMap `alloy-config`.
