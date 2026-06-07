---
name: feedback-commits
description: Nunca fazer commit ou push sem o usuario pedir explicitamente
metadata:
  type: feedback
---

Nunca executar `git commit` ou `git push` sem o usuario solicitar explicitamente.

**Why:** O usuario quer controle total sobre quando o historico do repositorio e alterado. Fazer commit automaticamente apos uma mudanca e indesejado, mesmo que o trabalho esteja concluido.

**How to apply:** Ao terminar alteracoes de codigo, apenas informar o que foi feito. Aguardar o usuario dizer "commit" ou equivalente antes de rodar qualquer comando git que altere o historico ou o repositorio remoto.
