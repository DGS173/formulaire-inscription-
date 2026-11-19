/* ============================================================
   KREDITAS — script « contrats »
   - enregistre chaque demande (référence KR-XXXXXXXX + données du contrat)
   - retrouve un contrat à partir de sa référence (même des mois plus tard)
   - envoie le contrat (PDF) par e-mail au client

   Ce script est INDÉPENDANT de votre script actuel (demande / téléverser / banque) :
   il ne peut donc rien casser dans ce qui fonctionne déjà.

   Déploiement : Déployer > Nouveau déploiement > Application Web
                 Exécuter en tant que : Moi
                 Qui a accès : Tout le monde
   ============================================================ */

const CONTACT = "contact@kreditas.online";
const SITE = "https://kreditas.online/";
const REF_RE = /^KR-[A-HJ-NP-Z2-9]{8}$/;

const MAIL = {
  fr: ["Votre contrat KREDITAS", "Bonjour,\n\nVeuillez trouver ci-joint votre contrat de prêt (référence {ref}).\nImprimez-le, signez-le (mention « Lu et approuvé ») puis renvoyez-le nous depuis notre site : {site}\n\nCordialement,\nKREDITAS Micro Finance"],
  en: ["Your KREDITAS contract", "Hello,\n\nPlease find attached your loan contract (reference {ref}).\nPrint it, sign it (write “Read and approved”) and send it back to us from our website: {site}\n\nKind regards,\nKREDITAS Micro Finance"],
  es: ["Su contrato KREDITAS", "Buenos días,\n\nEncontrará adjunto su contrato de préstamo (referencia {ref}).\nImprímalo, fírmelo (escriba «Leído y aprobado») y envíenoslo de nuevo desde nuestro sitio: {site}\n\nAtentamente,\nKREDITAS Micro Finance"],
  lt: ["Jūsų KREDITAS sutartis", "Sveiki,\n\nPrisegame jūsų paskolos sutartį (nuoroda {ref}).\nIšspausdinkite, pasirašykite (įrašykite „Perskaičiau ir sutinku“) ir atsiųskite mums per svetainę: {site}\n\nPagarbiai,\nKREDITAS Micro Finance"],
  de: ["Ihr KREDITAS-Vertrag", "Guten Tag,\n\nanbei Ihr Darlehensvertrag (Referenz {ref}).\nDrucken Sie ihn aus, unterschreiben Sie ihn (mit dem Vermerk „Gelesen und genehmigt“) und senden Sie ihn über unsere Website zurück: {site}\n\nMit freundlichen Grüßen\nKREDITAS Micro Finance"],
  it: ["Il tuo contratto KREDITAS", "Buongiorno,\n\nin allegato trovi il tuo contratto di prestito (riferimento {ref}).\nStampalo, firmalo (scrivi «Letto e approvato») e inviacelo di nuovo dal nostro sito: {site}\n\nCordiali saluti,\nKREDITAS Micro Finance"],
  lv: ["Jūsu KREDITAS līgums", "Labdien,\n\nPielikumā jūsu aizdevuma līgums (atsauce {ref}).\nIzdrukājiet, parakstiet (uzrakstiet „Izlasīts un apstiprināts”) un nosūtiet mums atpakaļ mūsu vietnē: {site}\n\nAr cieņu,\nKREDITAS Micro Finance"],
  ro: ["Contractul dvs. KREDITAS", "Bună ziua,\n\nVă trimitem atașat contractul de împrumut (referința {ref}).\nImprimați-l, semnați-l (scrieți „Citit și aprobat”) și trimiteți-l înapoi de pe site-ul nostru: {site}\n\nCu stimă,\nKREDITAS Micro Finance"],
  et: ["Teie KREDITAS leping", "Tere,\n\nLisatud on teie laenuleping (viitenumber {ref}).\nPrintige see, allkirjastage (kirjutage „Läbi loetud ja heaks kiidetud”) ja saatke meile tagasi meie veebilehel: {site}\n\nLugupidamisega\nKREDITAS Micro Finance"]
};

/* ---------- Réponses ---------- */
function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
function doGet() { return json_({ ok: true, service: "kreditas-contrats" }); }

function doPost(e) {
  let d;
  try { d = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: "json" }); }
  try {
    if (d.action === "enregistrer") return json_(enregistrer_(d));
    if (d.action === "retrouver") return json_(retrouver_(d));
    if (d.action === "envoyer_contrat") return json_(envoyer_(d));
    return json_({ ok: false, error: "action" });
  } catch (err) {
    return json_({ ok: false, error: String((err && err.message) || err) });
  }
}

/* ---------- Base (une feuille Google créée automatiquement) ---------- */
function db_() {
  const props = PropertiesService.getScriptProperties();
  let ss = null;
  const id = props.getProperty("SSID");
  if (id) { try { ss = SpreadsheetApp.openById(id); } catch (e) { ss = null; } }
  if (!ss) { ss = SpreadsheetApp.create("KREDITAS - contrats"); props.setProperty("SSID", ss.getId()); }
  let sh = ss.getSheetByName("Contrats");
  if (!sh) {
    sh = ss.getSheets()[0]; sh.setName("Contrats");
    sh.appendRow(["Référence", "E-mail", "Nom", "Prénom", "Date", "Données (JSON)"]);
    sh.setFrozenRows(1);
  }
  return sh;
}
function find_(sh, ref) {
  const cell = sh.createTextFinder(ref).matchEntireCell(true).findNext();
  return (cell && cell.getColumn() === 1 && cell.getRow() > 1) ? cell.getRow() : 0;
}
function clean_(s, n) { return String(s == null ? "" : s).slice(0, n || 120); }
function safe_(s) { s = String(s); return /^[=+\-@]/.test(s) ? "'" + s : s; }
function num_(x) { x = Number(x); return isFinite(x) ? x : null; }

/* ---------- 1. Enregistrer une demande ---------- */
function enregistrer_(d) {
  const ref = clean_(d.ref, 20), r = d.rec || {};
  if (!REF_RE.test(ref) || r.ref !== ref) return { ok: false, error: "ref" };
  const rec = {
    ref: ref, email: clean_(r.email, 120).toLowerCase(), nom: clean_(r.nom), prenom: clean_(r.prenom),
    pays: clean_(r.pays), ville: clean_(r.ville), tel: clean_(r.tel, 40),
    P: num_(r.P), y: num_(r.y), n: num_(r.n), m: num_(r.m), total: num_(r.total), int: num_(r.int), cur: clean_(r.cur, 6)
  };
  if ([rec.P, rec.y, rec.n, rec.m, rec.total, rec.int].some(function (v) { return v === null; }) || !rec.cur || !rec.nom) {
    return { ok: false, error: "data" };
  }
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sh = db_();
    if (find_(sh, ref)) return { ok: true, dup: true };
    sh.appendRow([ref, safe_(rec.email), safe_(rec.nom), safe_(rec.prenom), new Date(), JSON.stringify(rec)]);
  } finally { lock.releaseLock(); }
  return { ok: true };
}

/* ---------- 2. Retrouver un contrat avec sa référence ---------- */
function retrouver_(d) {
  const ref = clean_(d.ref, 20).toUpperCase();
  if (!REF_RE.test(ref)) return { ok: false, error: "notfound" };
  const cache = CacheService.getScriptCache();
  const fails = Number(cache.get("fails") || 0);
  if (fails >= 60) return { ok: false, error: "busy" };           /* freine les essais en rafale */
  const sh = db_(), row = find_(sh, ref);
  if (!row) { cache.put("fails", String(fails + 1), 600); return { ok: false, error: "notfound" }; }
  return { ok: true, rec: JSON.parse(sh.getRange(row, 6).getValue()) };
}

/* ---------- 3. Envoyer le contrat par e-mail ---------- */
function envoyer_(d) {
  const ref = clean_(d.ref, 20).toUpperCase(), em = clean_(d.email, 120).toLowerCase();
  if (!REF_RE.test(ref) || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) return { ok: false, error: "data" };
  const cache = CacheService.getScriptCache(), key = "mail_" + ref, n = Number(cache.get(key) || 0);
  if (n >= 5) return { ok: false, error: "busy" };                /* 5 envois par heure et par référence */
  const sh = db_(), row = find_(sh, ref);
  if (!row) return { ok: false, error: "notfound" };
  const rec = JSON.parse(sh.getRange(row, 6).getValue());
  if (String(rec.email || "").toLowerCase() !== em) return { ok: false, error: "email" };  /* seulement l'e-mail de la demande */
  const html = String(d.html || "");
  if (html.length < 2000 || html.length > 6000000) return { ok: false, error: "html" };
  cache.put(key, String(n + 1), 3600);
  const t = MAIL[d.lang] || MAIL.en, name = "KREDITAS-contrat-" + ref;
  let att;
  try { att = Utilities.newBlob(html, "text/html", name + ".html").getAs("application/pdf").setName(name + ".pdf"); }
  catch (err) { att = Utilities.newBlob(html, "text/html", name + ".html"); }   /* secours : fichier HTML */
  MailApp.sendEmail({
    to: em, subject: t[0] + " — " + ref,
    body: t[1].replace("{ref}", ref).replace("{site}", SITE),
    name: "KREDITAS Micro Finance", replyTo: CONTACT, attachments: [att]
  });
  return { ok: true };
}
