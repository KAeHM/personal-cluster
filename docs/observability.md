# Observabilidade

## Componentes

| Sinal | Coleta e transporte | Armazenamento | Consulta |
| --- | --- | --- | --- |
| Métricas | Prometheus Operator e ServiceMonitors | Prometheus, 7 dias / 25 GB | Grafana |
| Logs | Grafana Alloy pela API de pods | Loki monolítico, 7 dias / 20 GiB | Grafana Explore |
| Traces | OTLP HTTP/gRPC no serviço interno do Alloy | Tempo monolítico, 3 dias / 10 GiB | Grafana Explore |
| Métricas de traces | Metrics Generator do Tempo | Prometheus | Service Graph e PromQL |

O endpoint OTLP é `http://alloy.monitoring.svc.cluster.local:4318` para HTTP/protobuf e `alloy.monitoring.svc.cluster.local:4317` para gRPC. Esses endereços são internos; não crie Ingress para Loki, Tempo, Prometheus ou Alloy.

## Acessos

- Argo CD: `https://argo.kaehm.dev`
- Grafana: `https://grafana.kaehm.dev`

Os dois painéis exigem autenticação. O Prometheus e os backends de telemetria continuam acessíveis somente dentro do cluster ou por `kubectl port-forward` através do kubeconfig dedicado.

## Instrumentação de aplicações

Aplicações devem:

1. emitir logs JSON para `stdout`, incluindo `service`, `environment`, `trace_id` e `span_id` quando houver span ativo;
2. exportar traces por OTLP HTTP para o Alloy;
3. expor métricas Prometheus em uma porta ou rota interna e declarar um `ServiceMonitor` com o rótulo `release: monitoring`;
4. definir `service.name`, `service.version` e `deployment.environment.name` como atributos de recurso;
5. não registrar tokens, cookies, cabeçalhos de autorização ou conteúdo sensível de personagens.

Para produção, use `OTEL_EXPORTER_OTLP_ENDPOINT=http://alloy.monitoring.svc.cluster.local:4318` e `OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf`. Em desenvolvimento local, desabilite a exportação com `OTEL_SDK_DISABLED=true` ou aponte para um collector local.

## Retenção e recuperação

Os PVCs atuais usam `local-path`: eles reduzem custo, mas não são altamente disponíveis e não são cobertos pelo snapshot do etcd. Dashboards e datasources ficam declarados no Git; logs e traces são descartáveis. Antes de aumentar retenção, mova Loki e Tempo para um armazenamento de objetos dedicado e configure limites de custo.
