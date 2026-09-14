#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Conectar ao banco N8N
const db = new sqlite3.Database('/var/lib/docker/volumes/n8n_n8n_n8n-data/_data/database.sqlite', (err) => {
  if (err) {
    console.error('Erro ao conectar:', err);
    process.exit(1);
  }
});

const WORKFLOW_ID = 'MdutCohjqU5doIpi';

// Novos nodes a adicionar após "Tem Follow-ups?"
const newNodes = [
  {
    id: "fu-node-0004",
    name: "Iterar Items (Max 5)",
    type: "n8n-nodes-base.loop",
    typeVersion: 1,
    position: [600, 300],
    parameters: {
      loopListMode: "list",
      loopList: "={{ $json.body.items }}",
      maxIterations: 5
    }
  },
  {
    id: "fu-node-0005",
    name: "Preparar para Evolution",
    type: "n8n-nodes-base.set",
    typeVersion: 3,
    position: [800, 300],
    parameters: {
      options: {},
      assignments: {
        assignments: [
          {
            name: "number",
            value: "={{ $json.clienteTelefone }}",
            type: "string"
          },
          {
            name: "text",
            value: "={{ $json.mensagem }}",
            type: "string"
          },
          {
            name: "instancia",
            value: "={{ $json.instancia }}",
            type: "string"
          }
        ]
      }
    }
  },
  {
    id: "fu-node-0006",
    name: "Enviar Mensagem Evolution",
    type: "n8n-nodes-base.httpRequest",
    typeVersion: 4,
    position: [1000, 300],
    parameters: {
      method: "POST",
      url: "={{ 'http://201.76.43.149:8080/message/sendText/' + $json.instancia }}",
      sendBody: true,
      bodyParametersJson: true,
      headers: {
        "Content-Type": "application/json",
        "apikey": "={{ $env.EVOLUTION_API_KEY }}"
      },
      body: {
        json: {
          number: "={{ $json.number }}",
          text: "={{ $json.text }}"
        }
      }
    }
  },
  {
    id: "fu-node-0007",
    name: "Espaçamento 3s",
    type: "n8n-nodes-base.wait",
    typeVersion: 1,
    position: [1200, 300],
    parameters: {
      waitType: "duration",
      duration: 3
    }
  }
];

// Conexões a adicionar
const newConnections = {
  "fu-node-0003": [
    {
      node: "fu-node-0004",
      type: "main",
      index: 0
    }
  ],
  "fu-node-0004": [
    {
      node: "fu-node-0005",
      type: "main",
      index: 0
    }
  ],
  "fu-node-0005": [
    {
      node: "fu-node-0006",
      type: "main",
      index: 0
    }
  ],
  "fu-node-0006": [
    {
      node: "fu-node-0007",
      type: "main",
      index: 0
    }
  ],
  "fu-node-0007": [
    {
      node: "fu-node-0004",
      type: "main",
      index: 0
    }
  ]
};

// Ler workflow atual
db.get(
  `SELECT nodes, connections FROM workflow_entity WHERE id = ?`,
  [WORKFLOW_ID],
  (err, row) => {
    if (err) {
      console.error('Erro ao ler:', err);
      process.exit(1);
    }

    if (!row) {
      console.error('Workflow não encontrado');
      process.exit(1);
    }

    try {
      const currentNodes = JSON.parse(row.nodes || '[]');
      const currentConnections = JSON.parse(row.connections || '{}');

      // Adicionar novos nodes
      const updatedNodes = [...currentNodes, ...newNodes];

      // Adicionar novas conexões
      const updatedConnections = {
        ...currentConnections,
        ...newConnections
      };

      // Atualizar no banco
      db.run(
        `UPDATE workflow_entity SET nodes = ?, connections = ?, updatedAt = datetime('now') WHERE id = ?`,
        [JSON.stringify(updatedNodes), JSON.stringify(updatedConnections), WORKFLOW_ID],
        (err) => {
          if (err) {
            console.error('Erro ao atualizar:', err);
            process.exit(1);
          }
          console.log('✅ Workflow atualizado com sucesso!');
          console.log(`  - ${newNodes.length} novos nodes adicionados`);
          console.log(`  - Conexões configuradas`);
          console.log('\nNodes adicionados:');
          newNodes.forEach(n => console.log(`  • ${n.name} (${n.id})`));
          db.close();
        }
      );
    } catch (e) {
      console.error('Erro ao parsear JSON:', e);
      process.exit(1);
    }
  }
);
