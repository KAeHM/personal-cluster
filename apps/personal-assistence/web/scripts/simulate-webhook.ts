const BASE_URL = process.env.SIMULATE_WEBHOOK_URL ?? "http://localhost:3000/api/webhooks/whatsapp";
const API_KEY = process.env.EVOLUTION_API_KEY ?? "dev-secret-key-change-me";
const MESSAGE = process.argv[2] ?? "Comecei o relatório mensal";
const PHONE = process.argv[3] ?? "5511999999999";
const MESSAGE_ID = `sim-${Date.now()}`;

async function main() {
  const payload = {
    event: "messages.upsert",
    instance: process.env.EVOLUTION_INSTANCE ?? "timetracker-dev",
    apikey: API_KEY,
    data: {
      key: {
        id: MESSAGE_ID,
        remoteJid: `${PHONE}@s.whatsapp.net`,
        fromMe: false,
      },
      pushName: "Simulate User",
      message: { conversation: MESSAGE },
      messageType: "conversation",
      messageTimestamp: Math.floor(Date.now() / 1000),
    },
  };

  console.log(`→ POST ${BASE_URL}`);
  console.log(`→ Message: "${MESSAGE}"\n`);

  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: API_KEY,
    },
    body: JSON.stringify(payload),
  });

  const body = await response.text();

  console.log(`← ${response.status}`);
  console.log(body);
}

main().catch((error) => {
  console.error("Simulate webhook failed:", error);
  process.exit(1);
});
