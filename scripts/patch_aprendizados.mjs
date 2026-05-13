import { readFileSync, writeFileSync } from 'fs';

const SRC = 'C:/Users/USUARIO/Downloads/print/wf_current.json';
const OUT = 'C:/Users/USUARIO/agencia-crm/workflow_current.json';

// Strip BOM if present
const raw = readFileSync(SRC, 'utf8').replace(/^﻿/, '');
const wf = JSON.parse(raw);

const APRENDIZADOS_DEF = `
const aprendizados = empresa.aprendizados || '';
const aprendizadosSection = aprendizados
  ? '\\nPADROES DE VENDAS BEM-SUCEDIDAS (aprenda com isso para fechar mais vendas):\\n' + aprendizados.split('\\n---\\n').filter(Boolean).map(function(a, i) { return (i+1) + '. ' + a; }).join('\\n')
  : '';`;

// Anchor: the memoriaSection variable definition ends with : '';
// We insert aprendizadosSection right after.
const AFTER_MEMORIA_DEF = `  : '';

const sistemaParts`;
const AFTER_MEMORIA_DEF_NEW = `  : '';
${APRENDIZADOS_DEF}

const sistemaParts`;

// Anchor: in sistemaParts array, memoriaSection is the last dynamic section before ''
// We insert aprendizadosSection right after memoriaSection,
const IN_SISTEMA_PARTS = `  memoriaSection,
  '',
  'FLUXO DE ATENDIMENTO:'`;
const IN_SISTEMA_PARTS_NEW = `  memoriaSection,
  aprendizadosSection,
  '',
  'FLUXO DE ATENDIMENTO:'`;

let patched = 0;

function patchNode(nodes) {
  for (const node of nodes) {
    if (node.name === 'Montar Prompt Claude' && node.parameters?.jsCode) {
      let code = node.parameters.jsCode;
      if (code.includes('aprendizadosSection')) {
        console.log(`  [SKIP] "${node.name}" já tem aprendizadosSection`);
        continue;
      }
      if (!code.includes(AFTER_MEMORIA_DEF)) {
        console.error(`  [ERROR] Âncora AFTER_MEMORIA_DEF não encontrada em "${node.name}"`);
        continue;
      }
      code = code.replace(AFTER_MEMORIA_DEF, AFTER_MEMORIA_DEF_NEW);
      if (!code.includes(IN_SISTEMA_PARTS)) {
        console.error(`  [ERROR] Âncora IN_SISTEMA_PARTS não encontrada em "${node.name}"`);
        continue;
      }
      code = code.replace(IN_SISTEMA_PARTS, IN_SISTEMA_PARTS_NEW);
      node.parameters.jsCode = code;
      patched++;
      console.log(`  [OK] Patched "${node.name}"`);
    }
    // Recurse into sub-workflows if any
    if (node.parameters?.workflowInfo || node.nodes) {
      patchNode(node.nodes || []);
    }
  }
}

// Handle top-level nodes array
if (Array.isArray(wf.nodes)) {
  patchNode(wf.nodes);
}

// Handle wrapped workflow export (some N8N versions wrap in { data: { nodes: [] } })
if (wf.data?.nodes) {
  patchNode(wf.data.nodes);
}

// Handle versioned workflows (N8N stores activeVersion separately)
if (wf.activeVersion?.nodes) {
  patchNode(wf.activeVersion.nodes);
}

console.log(`\nTotal patched: ${patched} node(s)`);
writeFileSync(OUT, JSON.stringify(wf, null, 2), 'utf8');
console.log(`Saved to: ${OUT}`);
