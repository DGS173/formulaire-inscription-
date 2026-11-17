/* KREDITAS — version simple : tout arrive par e-mail (aucune feuille Google, aucun dossier Drive) */
const OWNER_EMAIL = "lapatience195@gmail.com";
const MIMES = ["application/pdf", "image/jpeg", "image/png"];

/* À lancer UNE seule fois dans l'éditeur (bouton Exécuter) : Google demande l'autorisation d'envoyer des e-mails */
function autoriser() {
  MailApp.sendEmail(OWNER_EMAIL, "KREDITAS : le script est autorisé", "Le script peut maintenant vous envoyer les demandes et les contrats signés par e-mail.");
}

function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function txt_(v, max) { return String(v == null ? "" : v).replace(/[\u0000-\u001f]+/g, " ").trim().slice(0, max); }

function mod97_(s) { let r = 0; for (let i = 0; i < s.length; i++) { const c = s.charAt(i), v = c >= "A" ? c.charCodeAt(0) - 55 : Number(c); r = (v > 9 ? r * 100 + v : r * 10 + v) % 97; } return r; }

function doGet() { return out_({ ok: true, mode: "email" }); }

function doPost(e) {
  try {
    const q = JSON.parse(e.postData.contents), ref = String(q.ref || "").toUpperCase(), cache = CacheService.getScriptCache();
    if (!/^KR-[A-Z0-9]{8}$/.test(ref)) return out_({ ok: false });

    /* 1) Nouvelle demande */
    if (q.action === "demande") {
      const d = q.data || {}, email = txt_(d["Email"], 120).toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || d["Consentement"] !== "Oui") return out_({ ok: false });
      if (!cache.get("d_" + ref)) {
        cache.put("d_" + ref, "1", 21600);
        const n = Number(cache.get("dm_" + email) || 0);
        if (n >= 5) return out_({ ok: false });                                  // anti-abus : 5 demandes / heure / e-mail
        cache.put("dm_" + email, String(n + 1), 3600);
        const lines = Object.keys(d).filter(k => k.charAt(0) !== "_").map(k => k + " : " + txt_(d[k], 200));
        MailApp.sendEmail({ to: OWNER_EMAIL, replyTo: email,
          subject: "Nouvelle demande de crédit : " + txt_(d["Prénom"], 40) + " " + txt_(d["Nom de famille"], 40) + " (" + ref + ")",
          body: "Référence : " + ref + "\n\n" + lines.join("\n") });
      }
      return out_({ ok: true });
    }

    /* 2) Contrat signé renvoyé par le client : reçu en pièce jointe */
    if (q.action === "televerser") {
      const email = txt_(q.email, 120).toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || MIMES.indexOf(q.mime) < 0 || !q.data || String(q.data).length > 6000000) return out_({ ok: false });
      const n = Number(cache.get("up_" + ref) || 0);
      if (n >= 12) return out_({ ok: false });                                    // anti-abus : 12 fichiers par référence / 6 h
      cache.put("up_" + ref, String(n + 1), 21600);
      const safe = String(q.name || "contrat").replace(/[^\w.\-]+/g, "_").slice(0, 60);
      const blob = Utilities.newBlob(Utilities.base64Decode(q.data), q.mime, ref + "_signe_" + safe);
      MailApp.sendEmail({ to: OWNER_EMAIL, replyTo: email,
        subject: "Contrat signé reçu : " + txt_(q.nom, 60) + " (" + ref + ")",
        body: "Le client a renvoyé son contrat signé.\n\nNom : " + txt_(q.nom, 80) + "\nE-mail : " + email + "\nRéférence : " + ref + "\n\nLe fichier est en pièce jointe. Pour répondre au client, répondez simplement à cet e-mail.",
        attachments: [blob] });
      return out_({ ok: true, status: "Signé reçu" });
    }
    /* 3) Coordonnées bancaires du client (après contrat signé) */
    if (q.action === "banque") {
      const email = txt_(q.email, 120).toLowerCase(), nom = txt_(q.nom, 80), noi = q.noiban === true;
      const iban = String(q.iban || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 40), bic = String(q.bic || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || nom.length < 3 || iban.length < 6) return out_({ ok: false, error: "données" });
      if (!/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(bic)) return out_({ ok: false, error: "BIC" });
      if (!noi && mod97_(iban.slice(4) + iban.slice(0, 4)) !== 1) return out_({ ok: false, error: "IBAN" });
      const n = Number(cache.get("bk_" + ref) || 0);
      if (n >= 5) return out_({ ok: false, error: "limite" });
      cache.put("bk_" + ref, String(n + 1), 21600);
      MailApp.sendEmail({ to: OWNER_EMAIL, replyTo: email,
        subject: "Coordonnées bancaires reçues : " + nom + " (" + ref + ")",
        body: "Le client a envoyé ses coordonnées pour le virement.\n\nTitulaire : " + nom + "\nIBAN / compte : " + iban + "\nBIC / SWIFT : " + bic + "\nPays : " + txt_(q.pays, 60) + "\nPays sans IBAN : " + (noi ? "oui" : "non") + "\nE-mail : " + email + "\nRéférence : " + ref + "\n\nVérifiez que le nom du titulaire correspond au nom de la demande avant tout virement." });
      return out_({ ok: true, status: "Banque reçue" });
    }
    return out_({ ok: false });
  } catch (err) {
    return out_({ ok: false, error: String(err).slice(0, 120) });
  }
}
