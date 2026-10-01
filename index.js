const json = (data, status=200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {"content-type":"application/json;charset=UTF-8","access-control-allow-origin":"*"}
  });

function esc(v){ return String(v ?? "").trim(); }

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/api/order") {
      try {
        const form = await request.formData();
        const type = esc(form.get("type"));
        const name = esc(form.get("name"));
        const phone = esc(form.get("phone"));
        const item = esc(form.get("item"));
        if (!name || !phone || !item) return json({error:"Ad soyad, telefon ve işlem/ürün zorunlu."},400);

        const sales = type === "Toptan / Perakende Satış";
        const appointment = form.get("appointment") === "1";
        const receipt = form.get("receipt");

        if (sales && !receipt) return json({error:"Havale/EFT siparişlerinde PDF dekont zorunludur."},400);
        if (receipt && receipt.type !== "application/pdf") return json({error:"Sadece PDF dekont kabul edilir."},400);
        if (receipt && receipt.size > 8 * 1024 * 1024) return json({error:"PDF en fazla 8 MB olabilir."},400);

        let receiptKey = null;
        if (receipt && receipt.size) {
          receiptKey = `dekont/${Date.now()}-${crypto.randomUUID()}.pdf`;
          await env.RECEIPTS.put(receiptKey, receipt.stream(), {
            httpMetadata: {contentType:"application/pdf"}
          });
        }

        const now = new Date().toISOString();
        const r = await env.DB.prepare(`
          INSERT INTO orders
          (created_at,type,name,phone,brand,model,item,note,appointment,appointment_date,appointment_time,
           city,district,neighborhood,postal_code,address,payment,receipt_key,status)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `).bind(
          now,type,name,phone,esc(form.get("brand")),esc(form.get("model")),item,esc(form.get("note")),
          appointment?1:0,esc(form.get("appointment_date")),esc(form.get("appointment_time")),
          sales?esc(form.get("city")):"",sales?esc(form.get("district")):"",
          sales?esc(form.get("neighborhood")):"",sales?esc(form.get("postal_code")):"",
          sales?esc(form.get("address")):"",sales?"Havale / EFT":"",receiptKey,"Yeni"
        ).run();

        const iban = (await env.DB.prepare("SELECT value FROM settings WHERE key='iban'").first())?.value || "";
        const waText =
`Merhaba, Ekip Toptan Ticaret panelinden yeni bildirim geldi.

📌 İşlem: ${type}
👤 Ad Soyad: ${name}
📞 Telefon: ${phone}
📱 Marka: ${esc(form.get("brand")) || "-"}
📱 Model: ${esc(form.get("model")) || "-"}
🛠️ İşlem / Ürün: ${item}
📝 Açıklama: ${esc(form.get("note")) || "-"}

📅 Randevu: ${appointment ? "EVET" : "HAYIR"}
Tarih: ${esc(form.get("appointment_date")) || "-"}
Saat: ${esc(form.get("appointment_time")) || "-"}

${sales ? `🚚 Kargo
${esc(form.get("city"))} / ${esc(form.get("district"))} / ${esc(form.get("neighborhood"))}
Posta Kodu: ${esc(form.get("postal_code"))}
Adres: ${esc(form.get("address"))}

💳 Havale / EFT
IBAN: ${iban}
📄 PDF dekont sisteme yüklendi.` : ""}`;

        return json({ok:true, id:r.meta?.last_row_id, whatsapp:`https://wa.me/905360273918?text=${encodeURIComponent(waText)}`});
      } catch(e) {
        return json({error:"Kayıt sırasında hata oluştu.", detail:String(e)},500);
      }
    }

    if (request.method === "GET" && url.pathname === "/api/iban") {
      const row = await env.DB.prepare("SELECT value FROM settings WHERE key='iban'").first();
      return json({iban: row?.value || ""});
    }

    if (request.method === "POST" && url.pathname === "/api/iban") {
      const body = await request.json();
      const iban = esc(body.iban);
      await env.DB.prepare("INSERT INTO settings(key,value) VALUES('iban',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value")
        .bind(iban).run();
      return json({ok:true});
    }

    if (request.method === "GET" && url.pathname === "/api/orders") {
      const rows = await env.DB.prepare("SELECT * FROM orders ORDER BY id DESC LIMIT 200").all();
      return json(rows.results || []);
    }

    if (request.method === "PATCH" && url.pathname.startsWith("/api/orders/")) {
      const id = Number(url.pathname.split("/").pop());
      const body = await request.json();
      const status = esc(body.status);
      await env.DB.prepare("UPDATE orders SET status=? WHERE id=?").bind(status,id).run();
      return json({ok:true});
    }

    return env.ASSETS.fetch(request);
  }
};
