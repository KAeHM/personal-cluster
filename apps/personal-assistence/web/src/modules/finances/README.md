# Módulo Finances

Caixinhas (envelope budgeting): CRUD, movimentações, transferências, alocação automática.

## Fase 2 — Alocação automática

- **Fontes de renda** (`/finances/fontes`): fixa/variável, valor esperado
- **Renda fixa mensal**: configuração em settings + alerta de comprometimento
- **Regras por caixinha** (`box.config`): percentual, percentual condicional (Proví), valor fixo, resíduo
- **Registrar renda**: preview + confirmação → movimentações em lote

### Motor de alocação

`domain/allocation-engine.ts` — puro, testável.

Ordem: caixinhas por `priority` desc → regras → caixinha com `receiveRemainder` recebe o resto.

### Exemplo Proví (JSON na caixinha)

```json
{
  "eligibleSourceIds": ["<uuid-salario>"],
  "allocationRules": [{
    "id": "provi-17",
    "type": "percent_conditional",
    "percent": 17,
    "condition": {
      "field": "eligible_income_amount",
      "operator": ">",
      "valueCents": 300000
    }
  }]
}
```

## API

| Rota | Métodos |
|------|---------|
| `/api/finances/income-sources` | GET, POST, PATCH |
| `/api/finances/allocations` | POST (`mode`: preview \| execute) |
| `/api/finances/settings` | GET, PATCH |

## Próxima fase

Forecast mensal, alertas de reajuste, simulador de cenários.
