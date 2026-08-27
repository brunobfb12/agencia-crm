import http from 'http';

const WEBHOOK_URL = "https://ocrmfacil.com.br/api/webhook/chamada";
// LID de TESTE com número fictício para não bater com cliente real
const LID_TESTE = "99999999999999@lid";

async function testWebhook() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      instancia: "paredao_t9",
      telefone: LID_TESTE,
      jid: LID_TESTE,
      isVideo: false
    });

    const url = new URL(WEBHOOK_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log('Status HTTP:', res.statusCode);
        try {
          const json = JSON.parse(body);
          console.log('Response:', JSON.stringify(json, null, 2));
        } catch {
          console.log('Response:', body);
        }
        resolve();
      });
    });

    req.on('error', (e) => {
      console.error('Erro na requisição:', e.message);
      reject(e);
    });

    req.write(data);
    req.end();
  });
}

console.log('=== TESTE: Chamada @lid que não resolve ===');
console.log('LID de teste:', LID_TESTE);
console.log('Chamando POST /api/webhook/chamada...\n');

try {
  await testWebhook();
  console.log('\n✅ Webhook chamado com sucesso');
  console.log('\n📋 Para verificar no banco:');
  console.log('   SELECT id, telefone, observacoes FROM leads WHERE telefone = "' + LID_TESTE + '";');
  console.log('\n🗑️  Para apagar o teste depois:');
  console.log('   DELETE FROM leads WHERE telefone = "' + LID_TESTE + '";');
  console.log('   DELETE FROM clientes WHERE telefone = "' + LID_TESTE + '";');
} catch (e) {
  console.error('\n❌ Erro:', e.message);
}
