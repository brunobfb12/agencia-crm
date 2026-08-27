const resp = await fetch("https://ocrmfacil.com.br/api/admin/migrate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    secret: "crm2026migra",
    sql: `ALTER TABLE "Cliente" ADD COLUMN IF NOT EXISTS "telefonePrincipal" TEXT;`
  })
});
const result = await resp.json();
console.log(result);
