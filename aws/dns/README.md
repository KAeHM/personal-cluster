# Route 53

O domínio público é `kaehm.dev`. O registro e a hosted zone foram criados inicialmente na conta de gerenciamento da AWS Organization. `stack.yaml` cria registros multivalue para os dois nós de borda na conta que hospeda a zona.

O registro não pode ser transferido entre contas AWS até 22 de outubro de 2026, mas isso não impede o uso normal do DNS. A hosted zone não acompanha uma futura transferência do registro; sua migração deve ser uma operação separada e planejada.

Health checks podem ser habilitados em uma segunda alteração para evitar custo antes da primeira aplicação pública.
