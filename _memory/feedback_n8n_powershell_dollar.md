---
name: N8N Code nodes — nunca usar PowerShell para criar/atualizar
description: PowerShell strips $ signs de strings, corrompendo jsCode com $input e $('Node') — sempre usar .mjs via node
type: feedback
originSessionId: c2281ee2-4a66-497a-9c11-70fa2effe7b4
---
Nunca usar PowerShell (curl, Invoke-WebRequest) para fazer PUT/POST em workflows N8N quando o payload contém Code nodes com `$input` ou `$('NodeName')`.

**Why:** PowerShell interpreta `$input` e `$('NodeName')` como variáveis PS e as substitui por string vazia. O jsCode chega ao N8N como `.item.json` em vez de `$input.item.json`, causando `Unexpected token '.'` em toda execução. O bug é silencioso — a criação do workflow retorna 200 mas o código está corrompido.

**How to apply:** Sempre criar/atualizar workflows N8N via scripts `.mjs` executados com `node scripts/nome.mjs`. O Node.js não interpreta `$` em strings. Exemplo de padrão seguro:
```js
// Em um arquivo .mjs — $ é preservado intacto
const jsCode = String.raw`
const item = $input.item.json;
const ctx = $('Formatar Mensagem').item.json;
`;
```
O `String.raw` é opcional (ambos funcionam em Node.js), mas útil para documentar a intenção.
