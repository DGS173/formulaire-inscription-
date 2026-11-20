/* KREDITAS — tout arrive par e-mail + e-mails automatiques au client (confirmation, rappel de signature, merci) */
const OWNER_EMAIL = "lapatience195@gmail.com";
const SITE_URL = "https://kreditas.online/";
const MIMES = ["application/pdf", "image/jpeg", "image/png"];
const RAPPELS_H = [24, 72, 168];   /* rappels de signature : 24 h, 3 jours et 7 jours après le téléchargement du contrat */

/* À lancer UNE seule fois dans l'éditeur (bouton Exécuter) : Google demande l'autorisation d'envoyer des e-mails */
function autoriser() {
  MailApp.sendEmail(OWNER_EMAIL, "KREDITAS : le script est autorisé", "Le script peut maintenant vous envoyer les demandes et les contrats signés par e-mail, et écrire aux clients.");
}

/* À lancer UNE seule fois après autoriser() : active la vérification automatique des rappels (toutes les 6 heures) */
function activerRappels() {
  ScriptApp.getProjectTriggers().forEach(t => { if (t.getHandlerFunction() === "rappels") ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger("rappels").timeBased().everyHours(6).create();
}

/* Facultatif : vous envoie à vous-même un exemple des 3 messages clients (en français) */
function essai() {
  ["dem", "rap", "ok"].forEach(t => { const m = msg_(t, "fr", "Marie", "KR-TEST1234"); MailApp.sendEmail(OWNER_EMAIL, "[ESSAI] " + m[0], m[1]); });
}

/* ---------- Messages aux clients (12 langues) ---------- */
const MSG = {
fr: { dem: ["KREDITAS : votre demande a bien été reçue ({r})", "Bonjour {p},\n\nNous avons bien reçu votre demande de crédit. Votre numéro de référence est : {r}\nConservez-le : il vous permettra de retrouver votre contrat.\n\nNous reviendrons vers vous par e-mail pour la suite.\n\nKREDITAS"],
      rap: ["KREDITAS : n'oubliez pas de signer votre contrat ({r})", "Bonjour {p},\n\nVous avez téléchargé votre contrat (référence {r}), mais nous n'avons pas encore reçu la version signée.\nPour poursuivre votre dossier, merci de nous renvoyer le contrat signé depuis la page « Mon contrat » : {u}\n\nSi vous l'avez déjà envoyé, ignorez simplement ce message.\n\nKREDITAS"],
      ok:  ["KREDITAS : merci, votre contrat signé a bien été reçu ({r})", "Bonjour {p},\n\nMerci ! Nous avons bien reçu votre contrat signé (référence {r}).\nNous reviendrons vers vous par e-mail pour la suite de votre dossier.\n\nKREDITAS"] },
en: { dem: ["KREDITAS: we have received your request ({r})", "Hello {p},\n\nWe have received your loan request. Your reference number is: {r}\nKeep it safe: you will need it to find your contract.\n\nWe will get back to you by email.\n\nKREDITAS"],
      rap: ["KREDITAS: please sign your contract ({r})", "Hello {p},\n\nYou downloaded your contract (reference {r}) but we have not yet received the signed copy.\nTo continue with your file, please send us the signed contract from the “My contract” page: {u}\n\nIf you have already sent it, please ignore this message.\n\nKREDITAS"],
      ok:  ["KREDITAS: thank you, we have received your signed contract ({r})", "Hello {p},\n\nThank you! We have received your signed contract (reference {r}).\nWe will get back to you by email about the next steps.\n\nKREDITAS"] },
lt: { dem: ["KREDITAS: gavome jūsų paraišką ({r})", "Sveiki, {p},\n\nGavome jūsų paskolos paraišką. Jūsų paraiškos numeris: {r}\nIšsaugokite jį – jo prireiks sutarčiai surasti.\n\nSusisieksime su jumis el. paštu.\n\nKREDITAS"],
      rap: ["KREDITAS: nepamirškite pasirašyti sutarties ({r})", "Sveiki, {p},\n\nAtsisiuntėte sutartį (paraiškos Nr. {r}), tačiau pasirašytos sutarties dar negavome.\nNorėdami tęsti, atsiųskite pasirašytą sutartį puslapyje „Mano sutartis“: {u}\n\nJei sutartį jau atsiuntėte, šio laiško galite nepaisyti.\n\nKREDITAS"],
      ok:  ["KREDITAS: ačiū, gavome jūsų pasirašytą sutartį ({r})", "Sveiki, {p},\n\nAčiū! Gavome jūsų pasirašytą sutartį (paraiškos Nr. {r}).\nDėl tolesnių veiksmų susisieksime el. paštu.\n\nKREDITAS"] },
lv: { dem: ["KREDITAS: mēs saņēmām jūsu pieteikumu ({r})", "Labdien, {p}!\n\nMēs saņēmām jūsu aizdevuma pieteikumu. Jūsu pieteikuma numurs: {r}\nSaglabājiet to – tas būs vajadzīgs, lai atrastu līgumu.\n\nAr jums sazināsimies pa e-pastu.\n\nKREDITAS"],
      rap: ["KREDITAS: neaizmirstiet parakstīt līgumu ({r})", "Labdien, {p}!\n\nJūs lejupielādējāt līgumu (pieteikuma Nr. {r}), taču parakstīto līgumu vēl neesam saņēmuši.\nLai turpinātu, nosūtiet parakstīto līgumu lapā „Mans līgums”: {u}\n\nJa līgums jau ir nosūtīts, lūdzu, ignorējiet šo ziņu.\n\nKREDITAS"],
      ok:  ["KREDITAS: paldies, mēs saņēmām jūsu parakstīto līgumu ({r})", "Labdien, {p}!\n\nPaldies! Mēs saņēmām jūsu parakstīto līgumu (pieteikuma Nr. {r}).\nPar turpmākajām darbībām sazināsimies pa e-pastu.\n\nKREDITAS"] },
it: { dem: ["KREDITAS: abbiamo ricevuto la tua richiesta ({r})", "Ciao {p},\n\nAbbiamo ricevuto la tua richiesta di prestito. Il tuo numero di riferimento è: {r}\nConservalo: ti servirà per ritrovare il tuo contratto.\n\nTi risponderemo via e-mail.\n\nKREDITAS"],
      rap: ["KREDITAS: non dimenticare di firmare il contratto ({r})", "Ciao {p},\n\nHai scaricato il contratto (riferimento {r}) ma non abbiamo ancora ricevuto la copia firmata.\nPer proseguire, invia il contratto firmato dalla pagina «Il mio contratto»: {u}\n\nSe lo hai già inviato, ignora questo messaggio.\n\nKREDITAS"],
      ok:  ["KREDITAS: grazie, abbiamo ricevuto il tuo contratto firmato ({r})", "Ciao {p},\n\nGrazie! Abbiamo ricevuto il tuo contratto firmato (riferimento {r}).\nTi contatteremo via e-mail per i prossimi passaggi.\n\nKREDITAS"] },
de: { dem: ["KREDITAS: Ihr Antrag ist eingegangen ({r})", "Guten Tag {p},\n\nwir haben Ihren Kreditantrag erhalten. Ihre Referenznummer lautet: {r}\nBitte bewahren Sie sie auf: Sie benötigen sie, um Ihren Vertrag wiederzufinden.\n\nWir melden uns per E-Mail bei Ihnen.\n\nKREDITAS"],
      rap: ["KREDITAS: bitte unterschreiben Sie Ihren Vertrag ({r})", "Guten Tag {p},\n\nSie haben Ihren Vertrag (Referenz {r}) heruntergeladen, wir haben die unterschriebene Fassung aber noch nicht erhalten.\nUm fortzufahren, senden Sie uns den unterschriebenen Vertrag bitte über die Seite „Mein Vertrag“: {u}\n\nFalls Sie ihn bereits gesendet haben, ignorieren Sie diese Nachricht bitte.\n\nKREDITAS"],
      ok:  ["KREDITAS: danke, Ihr unterschriebener Vertrag ist eingegangen ({r})", "Guten Tag {p},\n\nvielen Dank! Wir haben Ihren unterschriebenen Vertrag (Referenz {r}) erhalten.\nÜber die nächsten Schritte informieren wir Sie per E-Mail.\n\nKREDITAS"] },
pt: { dem: ["KREDITAS: recebemos o seu pedido ({r})", "Olá {p},\n\nRecebemos o seu pedido de crédito. O seu número de referência é: {r}\nGuarde-o: vai precisar dele para encontrar o seu contrato.\n\nEntraremos em contacto por e-mail.\n\nKREDITAS"],
      rap: ["KREDITAS: não se esqueça de assinar o contrato ({r})", "Olá {p},\n\nDescarregou o seu contrato (referência {r}), mas ainda não recebemos a versão assinada.\nPara continuar, envie-nos o contrato assinado na página «O meu contrato»: {u}\n\nSe já o enviou, ignore esta mensagem.\n\nKREDITAS"],
      ok:  ["KREDITAS: obrigado, recebemos o seu contrato assinado ({r})", "Olá {p},\n\nObrigado! Recebemos o seu contrato assinado (referência {r}).\nEntraremos em contacto por e-mail sobre os próximos passos.\n\nKREDITAS"] },
ru: { dem: ["KREDITAS: мы получили вашу заявку ({r})", "Здравствуйте, {p}!\n\nМы получили вашу заявку на кредит. Номер вашей заявки: {r}\nСохраните его: он понадобится, чтобы найти ваш договор.\n\nМы свяжемся с вами по электронной почте.\n\nKREDITAS"],
      rap: ["KREDITAS: не забудьте подписать договор ({r})", "Здравствуйте, {p}!\n\nВы скачали договор (заявка {r}), но подписанный экземпляр мы ещё не получили.\nЧтобы продолжить, отправьте подписанный договор на странице «Мой договор»: {u}\n\nЕсли вы уже отправили его, проигнорируйте это письмо.\n\nKREDITAS"],
      ok:  ["KREDITAS: спасибо, мы получили ваш подписанный договор ({r})", "Здравствуйте, {p}!\n\nСпасибо! Мы получили ваш подписанный договор (заявка {r}).\nО дальнейших шагах мы сообщим по электронной почте.\n\nKREDITAS"] },
uk: { dem: ["KREDITAS: ми отримали вашу заявку ({r})", "Вітаємо, {p}!\n\nМи отримали вашу заявку на кредит. Номер вашої заявки: {r}\nЗбережіть його: він знадобиться, щоб знайти ваш договір.\n\nМи зв’яжемося з вами електронною поштою.\n\nKREDITAS"],
      rap: ["KREDITAS: не забудьте підписати договір ({r})", "Вітаємо, {p}!\n\nВи завантажили договір (заявка {r}), але підписаного примірника ми ще не отримали.\nЩоб продовжити, надішліть підписаний договір на сторінці «Мій договір»: {u}\n\nЯкщо ви вже його надіслали, проігноруйте цей лист.\n\nKREDITAS"],
      ok:  ["KREDITAS: дякуємо, ми отримали ваш підписаний договір ({r})", "Вітаємо, {p}!\n\nДякуємо! Ми отримали ваш підписаний договір (заявка {r}).\nПро подальші кроки повідомимо електронною поштою.\n\nKREDITAS"] },
ro: { dem: ["KREDITAS: am primit cererea dumneavoastră ({r})", "Bună ziua, {p},\n\nAm primit cererea dumneavoastră de credit. Numărul dumneavoastră de referință este: {r}\nPăstrați-l: veți avea nevoie de el pentru a regăsi contractul.\n\nVă vom contacta prin e-mail.\n\nKREDITAS"],
      rap: ["KREDITAS: nu uitați să semnați contractul ({r})", "Bună ziua, {p},\n\nAți descărcat contractul (referința {r}), dar nu am primit încă exemplarul semnat.\nPentru a continua, trimiteți-ne contractul semnat din pagina „Contractul meu”: {u}\n\nDacă l-ați trimis deja, ignorați acest mesaj.\n\nKREDITAS"],
      ok:  ["KREDITAS: mulțumim, am primit contractul semnat ({r})", "Bună ziua, {p},\n\nMulțumim! Am primit contractul dumneavoastră semnat (referința {r}).\nVă vom contacta prin e-mail cu privire la pașii următori.\n\nKREDITAS"] },
hr: { dem: ["KREDITAS: zaprimili smo vaš zahtjev ({r})", "Poštovani {p},\n\nzaprimili smo vaš zahtjev za kredit. Vaš referentni broj je: {r}\nSačuvajte ga: trebat će vam za pronalazak ugovora.\n\nJavit ćemo vam se e-poštom.\n\nKREDITAS"],
      rap: ["KREDITAS: ne zaboravite potpisati ugovor ({r})", "Poštovani {p},\n\npreuzeli ste ugovor (referenca {r}), ali potpisani primjerak još nismo zaprimili.\nKako biste nastavili, pošaljite potpisani ugovor na stranici „Moj ugovor”: {u}\n\nAko ste ga već poslali, zanemarite ovu poruku.\n\nKREDITAS"],
      ok:  ["KREDITAS: hvala, zaprimili smo vaš potpisani ugovor ({r})", "Poštovani {p},\n\nHvala! Zaprimili smo vaš potpisani ugovor (referenca {r}).\nO daljnjim koracima javit ćemo vam se e-poštom.\n\nKREDITAS"] },
lb: { dem: ["KREDITAS: mir hunn Är Demande kritt ({r})", "Moien {p},\n\nmir hunn Är Prêt-Demande kritt. Är Referenznummer ass: {r}\nHuelt se gutt op: Dir braucht se, fir Äre Kontrakt erëmzefannen.\n\nMir mellen eis per E-Mail bei Iech.\n\nKREDITAS"],
      rap: ["KREDITAS: vergiesst net Äre Kontrakt z'ennerschreiwen ({r})", "Moien {p},\n\nDir hutt Äre Kontrakt erofgelueden (Referenz {r}), mä mir hunn nach net déi ënnerschriwwen Versioun kritt.\nFir virunzefueren, schéckt eis w.e.g. de ënnerschriwwene Kontrakt op der Säit „Mäi Kontrakt“: {u}\n\nWann Dir en schonn higeschéckt hutt, ignoréiert dës Noriicht w.e.g.\n\nKREDITAS"],
      ok:  ["KREDITAS: Merci, mir hunn Äre ënnerschriwwene Kontrakt kritt ({r})", "Moien {p},\n\nMerci! Mir hunn Äre ënnerschriwwene Kontrakt (Referenz {r}) kritt.\nIwwer déi nächst Schrëtt mellen mir eis per E-Mail.\n\nKREDITAS"] }
};

function msg_(type, lang, prenom, ref) {
  const L = MSG[String(lang || "").toLowerCase().slice(0, 2)] || MSG.en, m = L[type];
  const f = s => s.replace(/\{p\}/g, prenom || "").replace(/\{r\}/g, ref).replace(/\{u\}/g, SITE_URL).replace(/\s+([,!])/g, "$1").replace(/,!/g, "!");
  return [f(m[0]), f(m[1])];
}

/* Écrit au client (sans jamais bloquer le reste) ; garde de la réserve d'envois pour vos propres notifications */
function toClient_(email, type, lang, prenom, ref) {
  try {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "")) return false;
    if (MailApp.getRemainingDailyQuota() < 20) return false;
    const m = msg_(type, lang, prenom, ref);
    MailApp.sendEmail({ to: email, replyTo: OWNER_EMAIL, name: "KREDITAS", subject: m[0], body: m[1] });
    return true;
  } catch (err) { return false; }
}

/* ---------- Suivi des demandes (pour les rappels) ---------- */
function getRec_(ref) { const v = PropertiesService.getScriptProperties().getProperty("r_" + ref); try { return v ? JSON.parse(v) : null; } catch (e) { return null; } }
function setRec_(ref, rec) { PropertiesService.getScriptProperties().setProperty("r_" + ref, JSON.stringify(rec)); }
function locked_(fn) { const l = LockService.getScriptLock(); l.waitLock(10000); try { return fn(); } finally { l.releaseLock(); } }

/* Lancée automatiquement toutes les 6 h : envoie les rappels de signature aux clients qui n'ont pas renvoyé leur contrat */
function rappels() {
  locked_(() => {
    const props = PropertiesService.getScriptProperties(), all = props.getProperties(), now = Date.now();
    Object.keys(all).forEach(key => {
      if (key.indexOf("r_") !== 0) return;
      let rec; try { rec = JSON.parse(all[key]); } catch (e) { props.deleteProperty(key); return; }
      const ref = key.slice(2);
      if (now - (rec.c || 0) > 90 * 86400000) { props.deleteProperty(key); return; }   /* ménage : dossiers de plus de 90 jours */
      if (rec.s || !rec.d) return;                                                      /* contrat déjà signé, ou jamais téléchargé */
      const k = rec.k || 0;
      if (k >= RAPPELS_H.length || now < rec.d + RAPPELS_H[k] * 3600000) return;
      if (MailApp.getRemainingDailyQuota() < 20) return;
      if (toClient_(rec.e, "rap", rec.l, rec.p, ref)) { rec.k = k + 1; rec.t = now; props.setProperty(key, JSON.stringify(rec)); }
    });
  });
}

function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function txt_(v, max) { return String(v == null ? "" : v).replace(/[\u0000-\u001f]+/g, " ").trim().slice(0, max); }

function mod97_(s) { let r = 0; for (let i = 0; i < s.length; i++) { const c = s.charAt(i), v = c >= "A" ? c.charCodeAt(0) - 55 : Number(c); r = (v > 9 ? r * 100 + v : r * 10 + v) % 97; } return r; }

function doGet() { return out_({ ok: true, mode: "email" }); }

function doPost(e) {
  try {
    const q = JSON.parse(e.postData.contents), ref = String(q.ref || "").toUpperCase(), cache = CacheService.getScriptCache();
    const anon = ref === "SANS-REF" && (q.action === "televerser" || q.action === "banque");   /* client sans numéro de référence */
    if (!anon && !/^KR-[A-Z0-9]{8}$/.test(ref)) return out_({ ok: false });
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    /* 1) Nouvelle demande */
    if (q.action === "demande") {
      const d = q.data || {}, email = txt_(d["Email"], 120).toLowerCase();
      if (!EMAIL_RE.test(email) || d["Consentement"] !== "Oui") return out_({ ok: false });
      if (!cache.get("d_" + ref)) {
        cache.put("d_" + ref, "1", 21600);
        const n = Number(cache.get("dm_" + email) || 0);
        if (n >= 5) return out_({ ok: false });                                  // anti-abus : 5 demandes / heure / e-mail
        cache.put("dm_" + email, String(n + 1), 3600);
        const lines = Object.keys(d).filter(k => k.charAt(0) !== "_").map(k => k + " : " + txt_(d[k], 200));
        MailApp.sendEmail({ to: OWNER_EMAIL, replyTo: email,
          subject: "Nouvelle demande de crédit : " + txt_(d["Prénom"], 40) + " " + txt_(d["Nom de famille"], 40) + " (" + ref + ")",
          body: "Référence : " + ref + "\n\n" + lines.join("\n") });
        /* mémorise la demande (pour les rappels) et envoie la confirmation au client */
        const prenom = txt_(d["Prénom"], 40), lang = txt_(d["Langue du visiteur"], 5).toLowerCase();
        locked_(() => setRec_(ref, { e: email, l: lang, p: prenom, c: Date.now(), d: 0, k: 0, s: 0 }));
        toClient_(email, "dem", lang, prenom, ref);
      }
      return out_({ ok: true });
    }

    /* 2) Le client a téléchargé / reçu son contrat : démarre les rappels de signature */
    if (q.action === "contrat_telecharge") {
      const email = txt_(q.email, 120).toLowerCase();
      return out_({ ok: locked_(() => {
        const rec = getRec_(ref);
        if (!rec || rec.e !== email) return false;
        if (!rec.d && !rec.s) { rec.d = Date.now(); setRec_(ref, rec); }
        return true;
      }) });
    }

    /* 3) Contrat signé renvoyé par le client : reçu en pièce jointe */
    if (q.action === "televerser") {
      const rec = anon ? null : getRec_(ref), email = txt_(q.email, 120).toLowerCase() || (rec ? rec.e : "");
      if ((email && !EMAIL_RE.test(email)) || (!anon && !email) || MIMES.indexOf(q.mime) < 0 || !q.data || String(q.data).length > 6000000) return out_({ ok: false });
      const key = "up_" + ref, n = Number(cache.get(key) || 0);
      if (n >= (anon ? 80 : 12)) return out_({ ok: false });                      // anti-abus : 12 fichiers par référence / 6 h
      cache.put(key, String(n + 1), 21600);
      const safe = String(q.name || "contrat").replace(/[^\w.\-]+/g, "_").slice(0, 60);
      const blob = Utilities.newBlob(Utilities.base64Decode(q.data), q.mime, ref + "_signe_" + safe);
      const opts = { to: OWNER_EMAIL,
        subject: "Contrat signé reçu : " + txt_(q.nom, 60) + " (" + ref + ")",
        body: "Le client a renvoyé son contrat signé.\n\nNom : " + txt_(q.nom, 80) + "\nE-mail : " + (email || "(non renseigné)") + "\nRéférence : " + ref + "\n\nLe fichier est en pièce jointe." + (email ? " Pour répondre au client, répondez simplement à cet e-mail." : ""),
        attachments: [blob] };
      if (email) opts.replyTo = email;
      MailApp.sendEmail(opts);
      /* arrête les rappels et remercie le client (une seule fois par dossier) */
      if (email) {
        let first = false;
        locked_(() => {
          const r = getRec_(ref);
          if (r) { first = !r.s; r.s = 1; setRec_(ref, r); }
          else if (!cache.get("thx_" + ref + email)) { first = true; cache.put("thx_" + ref + email, "1", 21600); }
        });
        if (first) toClient_(email, "ok", rec ? rec.l : "", rec ? rec.p : txt_(q.nom, 40).split(" ")[0], ref === "SANS-REF" ? "" : ref);
      }
      return out_({ ok: true, status: "Signé reçu" });
    }

    /* 4) Coordonnées bancaires du client (après contrat signé) */
    if (q.action === "banque") {
      const email = txt_(q.email, 120).toLowerCase(), nom = txt_(q.nom, 80), noi = q.noiban === true;
      const iban = String(q.iban || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 40), bic = String(q.bic || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11);
      if ((email && !EMAIL_RE.test(email)) || (!anon && !email) || nom.length < 3 || iban.length < 6) return out_({ ok: false, error: "données" });
      if (!/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(bic)) return out_({ ok: false, error: "BIC" });
      if (!noi && mod97_(iban.slice(4) + iban.slice(0, 4)) !== 1) return out_({ ok: false, error: "IBAN" });
      const key = "bk_" + ref, n = Number(cache.get(key) || 0);
      if (n >= (anon ? 40 : 5)) return out_({ ok: false, error: "limite" });
      cache.put(key, String(n + 1), 21600);
      const opts = { to: OWNER_EMAIL,
        subject: "Coordonnées bancaires reçues : " + nom + " (" + ref + ")",
        body: "Le client a envoyé ses coordonnées pour le virement.\n\nTitulaire : " + nom + "\nIBAN / compte : " + iban + "\nBIC / SWIFT : " + bic + "\nPays : " + txt_(q.pays, 60) + "\nPays sans IBAN : " + (noi ? "oui" : "non") + "\nE-mail : " + (email || "(non renseigné)") + "\nRéférence : " + ref + "\n\nVérifiez que le nom du titulaire correspond au nom de la demande avant tout virement." };
      if (email) opts.replyTo = email;
      MailApp.sendEmail(opts);
      return out_({ ok: true, status: "Banque reçue" });
    }
    return out_({ ok: false });
  } catch (err) {
    return out_({ ok: false, error: String(err).slice(0, 120) });
  }
}
