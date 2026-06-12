"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface VendedorData {
  id: string;
  nome: string;
  instanciaVendedor: string;
  empresaNome: string;
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');

.conectar-wrap {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #04040c;
  color: #f0f0ff;
  font-family: 'DM Sans', sans-serif;
  overflow: hidden;
  position: relative;
  color-scheme: dark;
  padding: 20px;
}

.conectar-grid {
  content: '';
  position: fixed;
  inset: 0;
  background-image: linear-gradient(rgba(99,102,241,.04) 1px,transparent 1px),
    linear-gradient(90deg,rgba(99,102,241,.04) 1px,transparent 1px);
  background-size: 56px 56px;
  pointer-events: none;
  z-index: 0;
}

.conectar-orb {
  position: fixed;
  border-radius: 50%;
  filter: blur(90px);
  pointer-events: none;
  opacity: 0.35;
}

.conectar-o1 {
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(99,102,241,.3), transparent);
  top: -200px;
  left: -180px;
}

.conectar-o2 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(34,211,238,.2), transparent);
  bottom: 5%;
  right: -100px;
}

.conectar-card {
  width: 100%;
  max-width: 420px;
  background: rgba(255,255,255,.035);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 24px 80px rgba(0,0,0,.5);
  position: relative;
  z-index: 2;
  text-align: center;
}

.conectar-logo {
  font-family: 'Syne', sans-serif;
  font-size: 1.25rem;
  font-weight: 800;
  background: linear-gradient(135deg, #818cf8, #22d3ee);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-decoration: none;
  display: block;
  margin-bottom: 24px;
}

.conectar-title {
  font-family: 'Syne', sans-serif;
  font-weight: 700;
  font-size: 1.1rem;
  color: #f0f0ff;
  margin-bottom: 8px;
}

.conectar-sub {
  font-size: 0.85rem;
  color: rgba(240,240,255,.4);
  margin-bottom: 24px;
}

.conectar-err {
  background: rgba(239,68,68,.1);
  border: 1px solid rgba(239,68,68,.25);
  color: #f87171;
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 0.82rem;
  margin-bottom: 20px;
}

.conectar-qr-wrap {
  margin: 24px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.conectar-qr-box {
  background: white;
  padding: 12px;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,.4);
}

.conectar-qr-box img {
  width: 200px;
  height: 200px;
  display: block;
}

.conectar-instructions {
  font-size: 0.82rem;
  color: rgba(240,240,255,.7);
  line-height: 1.6;
  text-align: left;
  background: rgba(99,102,241,.05);
  border: 1px solid rgba(99,102,241,.15);
  border-radius: 10px;
  padding: 12px 14px;
  margin-top: 12px;
}

.conectar-success {
  background: rgba(52,211,153,.1);
  border: 1px solid rgba(52,211,153,.25);
  color: #34d399;
  border-radius: 12px;
  padding: 14px;
  font-size: 0.9rem;
  font-weight: 500;
}

.conectar-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid #818cf8;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
  margin-right: 6px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 640px) {
  .conectar-card {
    padding: 24px;
  }
  .conectar-qr-box img {
    width: 160px;
    height: 160px;
  }
}
`;

export default function ConectarPage() {
  const params = useParams();
  const token = params.token as string;

  const [vendedor, setVendedor] = useState<VendedorData | null>(null);
  const [qrcode, setQrcode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [conectado, setConectado] = useState(false);
  const [pollingActive, setPollingActive] = useState(false);

  // Buscar dados do vendedor
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/conectar/${token}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Erro ao buscar dados");
          setLoading(false);
          return;
        }
        setVendedor(data);
        setLoading(false);

        // Buscar QR via endpoint proxy
        buscarQr();
        setPollingActive(true);
      } catch (err) {
        setError("Erro ao conectar. Tente novamente.");
        setLoading(false);
      }
    })();
  }, [token]);

  // Buscar QR Code via proxy
  const buscarQr = async () => {
    try {
      const res = await fetch(`/api/conectar/${token}/qr`);
      if (res.ok) {
        const data = await res.json();
        setQrcode(data?.qrcode ?? null);
      }
    } catch (err) {
      console.error("Erro ao buscar QR:", err);
    }
  };

  // Polling de status via proxy
  useEffect(() => {
    if (!vendedor || !pollingActive || conectado) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/conectar/${token}/status`);
        const data = await res.json();

        if (data?.state === "open") {
          setConectado(true);
          setPollingActive(false);

          // Marcar instância como conectada no banco
          if (data.vendedorId) {
            await fetch(`/api/vendedores/${data.vendedorId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ instanciaConectadaEm: new Date().toISOString() }),
            });
          }
        }
      } catch (err) {
        console.error("Erro no polling:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [vendedor, pollingActive, conectado, token]);

  if (loading) {
    return (
      <div className="conectar-wrap">
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <div className="conectar-grid" />
        <div className="conectar-orb conectar-o1" />
        <div className="conectar-orb conectar-o2" />
        <div className="conectar-card">
          <div className="conectar-title" style={{ textAlign: "center" }}>
            <span className="conectar-spinner" />
            Carregando...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="conectar-wrap">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="conectar-grid" />
      <div className="conectar-orb conectar-o1" />
      <div className="conectar-orb conectar-o2" />

      <div className="conectar-card">
        <a href="/" className="conectar-logo">FácilCRM</a>

        {error ? (
          <>
            <div className="conectar-title">Opa! 🔒</div>
            <div className="conectar-err">{error}</div>
          </>
        ) : conectado ? (
          <>
            <div className="conectar-title">✅ Conectado!</div>
            <div className="conectar-success">
              Sua instância do WhatsApp foi conectada com sucesso!
              <br />
              Você já pode fechar esta tela e começar a atender clientes.
            </div>
          </>
        ) : (
          <>
            <div className="conectar-title">Conectar WhatsApp</div>
            <div className="conectar-sub">
              Oi <strong>{vendedor?.nome}</strong>! 👋
              <br />
              Escaneie o QR Code abaixo com o WhatsApp que você usa para atender.
            </div>

            {qrcode ? (
              <div className="conectar-qr-wrap">
                <div className="conectar-qr-box">
                  <img src={qrcode} alt="QR Code" />
                </div>
                <div className="conectar-instructions">
                  <strong>Como conectar:</strong>
                  <br />
                  1. Abra o WhatsApp no celular que você usa para atender
                  <br />
                  2. Toque em <strong>⋮</strong> → Aparelhos conectados
                  <br />
                  3. Clique em <strong>Conectar aparelho</strong>
                  <br />
                  4. Escaneie o código acima
                  <br />
                  <br />
                  ⏳ Aguardando conexão... (QR expira em ~20 segundos)
                </div>
              </div>
            ) : (
              <div className="conectar-err">
                Não foi possível carregar o QR Code. Tente recarregar a página.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
