/* KREDITAS — espace client sécurisé (Google Sheets + Google Drive + Gmail) */
const OWNER_EMAIL = "lapatience195@gmail.com";
const SITE_URL = "https://dgs173.github.io/formulaire-inscription-/";      // <-- mettez ici l'adresse de votre site
const TZ = "Europe/Vilnius";
const STATUTS = ["Nouvelle", "Acceptée", "Contrat demandé", "Contrat prêt", "Signé reçu", "Refusée"];
const HEAD = ["Référence","Date","Statut","Nom","Prénom","Email","Téléphone","Pays","Ville","Travail","Montant","Durée","Mensualité","Salaire","Langue","Contrat demandé le","Signé reçu le","Consentement"];
const FOLDER_OUT = "KREDITAS - Contrats à envoyer";
const FOLDER_IN = "KREDITAS - Contrats signés";
const MIMES = ["application/pdf", "image/jpeg", "image/png"];

/* ---- Textes des e-mails envoyés au client : [reçue, acceptée, contrat prêt, nouveau message] = "titre|phrase" ---- */
const TPL = {
 fr:["Demande reçue|Votre demande de prêt est en cours de traitement. Nous reviendrons vers vous très bientôt.","Demande acceptée|Bonne nouvelle : votre demande est acceptée. Rendez-vous dans votre espace client pour obtenir votre contrat.","Contrat disponible|Votre contrat est prêt. Téléchargez-le dans votre espace client, signez-le puis renvoyez-le au même endroit.","Nouveau message|Vous avez un nouveau message de l’équipe KREDITAS dans votre espace client."],
 en:["Request received|Your loan request is being processed. We will get back to you very soon.","Request accepted|Good news: your request has been accepted. Go to your client area to get your contract.","Contract available|Your contract is ready. Download it in your client area, sign it and send it back in the same place.","New message|You have a new message from the KREDITAS team in your client area."],
 lt:["Paraiška gauta|Jūsų paskolos paraiška nagrinėjama. Netrukus su jumis susisieksime.","Paraiška patvirtinta|Gera žinia: jūsų paraiška patvirtinta. Eikite į savo kliento zoną, kad gautumėte sutartį.","Sutartis paruošta|Jūsų sutartis paruošta. Atsisiųskite ją kliento zonoje, pasirašykite ir atsiųskite ten pat.","Nauja žinutė|Kliento zonoje turite naują KREDITAS komandos žinutę."],
 lb:["Ufro kritt|Är Prêt-Ufro gëtt beaarbecht. Mir mellen eis ganz geschwënn.","Ufro akzeptéiert|Gutt Noriicht: Är Ufro ass akzeptéiert. Gitt an Äre Clientsraum fir Äre Kontrakt ze kréien.","Kontrakt disponibel|Äre Kontrakt ass prett. Luet en an Ärem Clientsraum erof, ënnerschreift en a schéckt en do zréck.","Neie Message|Dir hutt en neie Message vum KREDITAS-Team an Ärem Clientsraum."],
 lv:["Pieteikums saņemts|Jūsu aizdevuma pieteikums tiek apstrādāts. Drīzumā ar jums sazināsimies.","Pieteikums apstiprināts|Labas ziņas: jūsu pieteikums ir apstiprināts. Dodieties uz savu klienta zonu, lai saņemtu līgumu.","Līgums gatavs|Jūsu līgums ir gatavs. Lejupielādējiet to klienta zonā, parakstiet un nosūtiet turpat.","Jauna ziņa|Klienta zonā jums ir jauna KREDITAS komandas ziņa."],
 it:["Richiesta ricevuta|La tua richiesta di prestito è in elaborazione. Ti ricontatteremo presto.","Richiesta accettata|Buone notizie: la tua richiesta è stata accettata. Vai nella tua area cliente per ottenere il contratto.","Contratto disponibile|Il tuo contratto è pronto. Scaricalo nella tua area cliente, firmalo e rinvialo nello stesso posto.","Nuovo messaggio|Hai un nuovo messaggio del team KREDITAS nella tua area cliente."],
 de:["Antrag erhalten|Ihr Kreditantrag wird bearbeitet. Wir melden uns in Kürze bei Ihnen.","Antrag angenommen|Gute Nachricht: Ihr Antrag wurde angenommen. Holen Sie Ihren Vertrag in Ihrem Kundenbereich ab.","Vertrag verfügbar|Ihr Vertrag ist bereit. Laden Sie ihn in Ihrem Kundenbereich herunter, unterschreiben Sie ihn und senden Sie ihn dort zurück.","Neue Nachricht|Sie haben eine neue Nachricht des KREDITAS-Teams in Ihrem Kundenbereich."],
 pt:["Pedido recebido|O seu pedido de crédito está em tratamento. Entraremos em contacto muito em breve.","Pedido aceite|Boas notícias: o seu pedido foi aceite. Aceda à sua área de cliente para obter o contrato.","Contrato disponível|O seu contrato está pronto. Descarregue-o na sua área de cliente, assine-o e envie-o no mesmo local.","Nova mensagem|Tem uma nova mensagem da equipa KREDITAS na sua área de cliente."],
 ru:["Заявка получена|Ваша заявка на кредит обрабатывается. Мы свяжемся с вами в ближайшее время.","Заявка одобрена|Хорошие новости: ваша заявка одобрена. Перейдите в личный кабинет, чтобы получить договор.","Договор готов|Ваш договор готов. Скачайте его в личном кабинете, подпишите и отправьте обратно там же.","Новое сообщение|У вас новое сообщение от команды KREDITAS в личном кабинете."],
 uk:["Заявку отримано|Вашу заявку на кредит обробляють. Ми зв’яжемося з вами найближчим часом.","Заявку схвалено|Гарна новина: вашу заявку схвалено. Перейдіть у кабінет клієнта, щоб отримати договір.","Договір готовий|Ваш договір готовий. Завантажте його в кабінеті клієнта, підпишіть і надішліть туди ж.","Нове повідомлення|У кабінеті клієнта є нове повідомлення від команди KREDITAS."],
 ro:["Cerere primită|Cererea dvs. de credit este în curs de procesare. Vă vom contacta foarte curând.","Cerere acceptată|Vești bune: cererea dvs. a fost acceptată. Intrați în spațiul de client pentru a obține contractul.","Contract disponibil|Contractul dvs. este gata. Descărcați-l din spațiul de client, semnați-l și trimiteți-l în același loc.","Mesaj nou|Aveți un mesaj nou din partea echipei KREDITAS în spațiul de client."],
 hr:["Zahtjev primljen|Vaš zahtjev za kredit se obrađuje. Javit ćemo vam se vrlo brzo.","Zahtjev odobren|Dobre vijesti: vaš zahtjev je odobren. Idite u svoj klijentski prostor po ugovor.","Ugovor dostupan|Vaš ugovor je spreman. Preuzmite ga u klijentskom prostoru, potpišite i pošaljite na isto mjesto.","Nova poruka|Imate novu poruku tima KREDITAS u klijentskom prostoru."]
};

/* ---- À lancer UNE fois : crée la feuille, les dossiers, l'alerte automatique et demande les autorisations ---- */
function setup() {
  sh_(); msgs_(); folder_(FOLDER_OUT); folder_(FOLDER_IN);
  ScriptApp.getProjectTriggers().forEach(t => { if (t.getHandlerFunction() === "onEditInstall") ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger("onEditInstall").forSpreadsheet(SpreadsheetApp.getActive()).onEdit().create();
}

function textSheet_(name, head, validCol, validList) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let s = ss.getSheetByName(name);
  if (!s) {
    s = ss.insertSheet(name);
    s.getRange(1, 1, s.getMaxRows(), head.length).setNumberFormat("@");   // tout en texte : aucune formule possible
    s.appendRow(head); s.setFrozenRows(1);
    s.getRange(2, validCol, 1000, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(validList, true).build());
  }
  return s;
}
function sh_() { return textSheet_("Demandes", HEAD, 3, STATUTS); }
function msgs_() { return textSheet_("Messages", ["Référence", "Date", "De", "Texte"], 3, ["Client", "Équipe"]); }
function folder_(n) { const it = DriveApp.getFoldersByName(n); return it.hasNext() ? it.next() : DriveApp.createFolder(n); }
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function now_() { return Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd HH:mm"); }
function txt_(v, max) { return String(v == null ? "" : v).replace(/[\u0000-\u001f]+/g, " ").trim().slice(0, max); }

function find_(s, ref, email) {
  const v = s.getDataRange().getValues(), em = String(email || "").trim().toLowerCase();
  for (let i = 1; i < v.length; i++) {
    if (String(v[i][0]) === ref && String(v[i][5]).trim().toLowerCase() === em) return { row: i + 1, st: String(v[i][2]), lang: String(v[i][14]) };
  }
  return null;
}
function thread_(ref) {
  const v = msgs_().getDataRange().getValues(), r = [];
  for (let i = 1; i < v.length; i++) if (String(v[i][0]) === ref && v[i][3]) r.push({ t: String(v[i][1]), f: String(v[i][2]) === "Client" ? "C" : "E", x: String(v[i][3]) });
  return r.slice(-100);
}
function mailClient_(ref, email, lang, type) {            // type : 0 reçue, 1 acceptée, 2 contrat prêt, 3 nouveau message
  try {
    if (!email || MailApp.getRemainingDailyQuota() < 10) return;
    const p = (TPL[lang] || TPL.en)[type].split("|");
    MailApp.sendEmail({ to: email, subject: "KREDITAS – " + p[0], name: "KREDITAS", replyTo: OWNER_EMAIL,
      body: p[1] + "\n\nRef: " + ref + "\n" + SITE_URL + "\n\nKREDITAS" });
  } catch (e) {}
}

/* ---- Alertes automatiques quand VOUS modifiez la feuille ---- */
function onEditInstall(e) {
  const r = e.range, sh = r.getSheet(), n = sh.getName(), row = r.getRow();
  if (row < 2) return;
  if (n === "Demandes" && r.getColumn() === 3) {
    const v = String(r.getValue()), d = sh.getRange(row, 1, 1, 15).getValues()[0];
    if (v === "Acceptée") mailClient_(String(d[0]), String(d[5]), String(d[14]), 1);
    if (v === "Contrat prêt") mailClient_(String(d[0]), String(d[5]), String(d[14]), 2);
  }
  if (n === "Messages" && r.getColumn() === 4) {
    const m = sh.getRange(row, 1, 1, 4).getValues()[0];
    if (String(m[2]) === "Équipe" && m[3]) {
      const v = sh_().getDataRange().getValues();
      for (let i = 1; i < v.length; i++) if (String(v[i][0]) === String(m[0])) { mailClient_(String(m[0]), String(v[i][5]), String(v[i][14]), 3); break; }
    }
  }
}

function doGet() { return out_({ ok: true }); }

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const q = JSON.parse(e.postData.contents), s = sh_(), ref = String(q.ref || "").toUpperCase(), cache = CacheService.getScriptCache();
    if (!/^KR-[A-Z0-9]{8}$/.test(ref)) return out_({ ok: false });

    if (q.action === "demande") {
      const d = q.data || {}, email = txt_(d["Email"], 120).toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || d["Consentement"] !== "Oui") return out_({ ok: false });
      const v = s.getDataRange().getValues(), today = now_().slice(0, 10);
      let exists = false, same = 0;
      for (let i = 1; i < v.length; i++) {
        if (String(v[i][0]) === ref) exists = true;
        if (String(v[i][5]).toLowerCase() === email && String(v[i][1]).slice(0, 10) === today) same++;
      }
      if (!exists) {
        if (same >= 5) return out_({ ok: false });               // limite anti-abus : 5 demandes / jour / e-mail
        const lang = TPL[d["Langue du visiteur"]] ? d["Langue du visiteur"] : "en";
        s.appendRow([ref, now_(), "Nouvelle", txt_(d["Nom de famille"], 80), txt_(d["Prénom"], 80), email, txt_(d["Téléphone"], 40), txt_(d["Pays"], 80),
          txt_(d["Ville"], 80), txt_(d["Travail"], 80), txt_(d["Montant demandé"], 40), txt_(d["Durée"], 40), txt_(d["Mensualité"], 40), txt_(d["Salaire mensuel"], 40), lang, "", "", "Oui " + now_()]);
        const lines = Object.keys(d).filter(k => k.charAt(0) !== "_").map(k => k + " : " + txt_(d[k], 200));
        MailApp.sendEmail(OWNER_EMAIL, "Nouvelle demande de crédit : " + txt_(d["Prénom"], 40) + " " + txt_(d["Nom de famille"], 40) + " (" + ref + ")",
          "Référence : " + ref + "\n\n" + lines.join("\n") + "\n\nPour accepter la demande : ouvrez le Google Sheet et choisissez « Acceptée » dans la colonne Statut (le client sera prévenu par e-mail).");
        mailClient_(ref, email, lang, 0);
      }
      return out_({ ok: true });
    }

    const lockKey = "f_" + ref, fails = Number(cache.get(lockKey) || 0);
    if (fails >= 5) return out_({ ok: false, locked: true });      // 5 essais ratés = blocage 15 minutes
    const f = find_(s, ref, q.email);
    if (!f) { cache.put(lockKey, String(fails + 1), 900); return out_({ ok: false }); }
    cache.remove(lockKey);
    let st = f.st;

    if (q.action === "demander" && st === "Acceptée") {
      s.getRange(f.row, 3).setValue("Contrat demandé"); s.getRange(f.row, 16).setValue(now_()); st = "Contrat demandé";
      MailApp.sendEmail(OWNER_EMAIL, "Contrat demandé : " + ref,
        "Le client demande son contrat (" + ref + ").\n1) Déposez le PDF dans le dossier Drive « " + FOLDER_OUT + " » avec le nom " + ref + ".pdf\n2) Choisissez « Contrat prêt » dans la colonne Statut (le client sera prévenu par e-mail).");
    }
    if (q.action === "telecharger" && (st === "Contrat prêt" || st === "Signé reçu")) {
      const it = folder_(FOLDER_OUT).getFiles();
      while (it.hasNext()) {
        const file = it.next();
        if (file.getName().indexOf(ref) === 0) {
          const b = file.getBlob();
          return out_({ ok: true, status: st, name: file.getName(), mime: b.getContentType(), data: Utilities.base64Encode(b.getBytes()) });
        }
      }
      return out_({ ok: true, status: st, missing: true });
    }
    if (q.action === "televerser" && st === "Contrat prêt" && q.data && String(q.data).length < 6000000 && MIMES.indexOf(q.mime) > -1) {
      const safe = String(q.name || "contrat").replace(/[^\w.\-]+/g, "_").slice(0, 60);
      const file = folder_(FOLDER_IN).createFile(Utilities.newBlob(Utilities.base64Decode(q.data), q.mime, ref + "_signe_" + safe));
      s.getRange(f.row, 3).setValue("Signé reçu"); s.getRange(f.row, 17).setValue(now_()); st = "Signé reçu";
      MailApp.sendEmail(OWNER_EMAIL, "Contrat signé reçu : " + ref, "Le client a renvoyé son contrat signé (" + ref + ").\n" + file.getUrl() + "\n\nUne discussion est maintenant ouverte dans l'espace du client (feuille « Messages »).");
    }
    if (q.action === "message" && st === "Signé reçu") {
      const t = txt_(q.text, 1000);
      if (t && !cache.get("m_" + ref) && thread_(ref).length < 100) {
        cache.put("m_" + ref, "1", 5);                               // 1 message toutes les 5 secondes maximum
        msgs_().appendRow([ref, now_(), "Client", t]);
        MailApp.sendEmail(OWNER_EMAIL, "Nouveau message du client " + ref, t + "\n\nPour répondre : feuille « Messages » → ajoutez une ligne : " + ref + " | date | Équipe | votre texte.");
      }
    }
    const res = { ok: true, status: st };
    if (st === "Signé reçu") res.msgs = thread_(ref);
    return out_(res);
  } catch (err) {
    return out_({ ok: false });
  } finally {
    lock.releaseLock();
  }
}
