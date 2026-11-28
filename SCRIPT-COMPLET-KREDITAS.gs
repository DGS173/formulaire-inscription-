/* KREDITAS — script des demandes : e-mails professionnels (logo), étapes pas à pas, rappels quotidiens
   Fichiers du projet : Code.gs (ce fichier) · Messages.gs (votre bloc "const MSG = {...};" actuel, inchangé)
                        Etapes.gs · Logo.gs */
const OWNER_EMAIL = "lapatience195@gmail.com";   // vous recevez les demandes, contrats signés et coordonnées bancaires
const SENDER = "contact@kreditas.online";        // adresse visible par le client (alias « Envoyer en tant que » à valider dans Gmail)
const SITE_URL = "https://kreditas.online/";
const MIMES = ["application/pdf", "image/jpeg", "image/png"];
const RAPPEL_JOURS = 60;                          // un rappel par jour pendant 2 mois
const EMAIL_OK = /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9\-]+(\.[A-Za-z0-9\-]+)*\.[A-Za-z]{2,}$/;   // adresses ASCII valides uniquement (évite les rejets « domaine introuvable »)
const GAP_H = 23;                                 // intervalle minimal entre deux rappels

/* À lancer UNE fois : Google demande les autorisations (e-mails + Drive pour joindre le contrat) */
function autoriser() {
  DriveApp.getRootFolder();
  GmailApp.getAliases();
  MailApp.sendEmail(OWNER_EMAIL, "KREDITAS : le script est autorisé", "Le script peut maintenant vous envoyer les demandes et écrire aux clients.");
}
/* À lancer UNE fois après autoriser() : vérification des rappels toutes les 6 h */
function activerRappels() {
  ScriptApp.getProjectTriggers().forEach(t => { if (t.getHandlerFunction() === "rappels") ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger("rappels").timeBased().everyHours(6).create();
}
/* Facultatif : vous envoie un exemple des 3 messages clients + du message d’approbation */
function essai() {
  ["dem", "rap", "ok", "appr"].forEach(t => toClient_(OWNER_EMAIL, t, "fr", "Marie", "KR-TEST1234"));
}

/* ---------- Textes ---------- */
function L2_(lang) { return String(lang || "").toLowerCase().slice(0, 2); }
function msg_(type, lang, prenom, ref) {
  const l = L2_(lang), src = type === "appr" ? (APPR[l] || APPR.en) : (MSG[l] || MSG.en)[type];
  const f = s => s.replace(/\{p\}/g, prenom || "").replace(/\{r\}/g, ref).replace(/\{u\}/g, SITE_URL).replace(/\s+([,!])/g, "$1").replace(/,!/g, "!");
  return [f(src[0]), f(src[1])];
}
const esc_ = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* ---------- Mise en page HTML avec logo ---------- */
function btn_(url, label) {
  return '<a href="' + esc_(url) + '" style="display:inline-block;background:#0f5c57;color:#ffffff;text-decoration:none;font-weight:bold;padding:10px 20px;border-radius:8px;font-size:14px">' + esc_(label) + '</a>';
}
function html_(type, lang, text, ref) {
  const l = STEP[L2_(lang)] ? L2_(lang) : "en", S = STEP[l];
  const paras = text.split("\n\n").filter(p => p.trim() && p.trim() !== "KREDITAS");
  let body = paras.map(p => '<p style="margin:0 0 14px">' + esc_(p).replace(/\n/g, "<br>") + "</p>").join("");
  if (type === "dem") {
    const urls = [SITE_URL + "#iban", SITE_URL + "#contrat", SITE_URL + "#contrat", SITE_URL + "#contrat"];
    body += '<p style="margin:18px 0 10px;font-weight:bold">' + esc_(S.i) + "</p>";
    body += '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">' + S.s.map((x, i) => {
      const t = x.split("|");
      return '<tr><td valign="top" width="44" style="padding:10px 0"><div style="width:30px;height:30px;line-height:30px;border-radius:50%;background:#f2c14e;color:#0b3d3a;font-weight:bold;text-align:center">' + (i + 1) + '</div></td>' +
        '<td valign="top" style="padding:10px 8px 10px 0;border-bottom:1px solid #e3e8e6"><b>' + esc_(t[0]) + "</b><br>" + esc_(t[1]) + '<br><a href="' + esc_(urls[i]) + '" style="color:#0f5c57;font-weight:bold">' + esc_(S.open) + " →</a></td></tr>";
    }).join("") + "</table>";
    body += '<p style="margin:16px 0 0;background:#fdf3d6;border-radius:8px;padding:10px 12px">' + esc_(S.note) + "</p>";
    body += '<p style="margin:14px 0 0;color:#5b6b68;font-size:13px">' + esc_(S.help) + "</p>";
  } else if (type === "rap" || type === "appr") {
    body += '<p style="text-align:center;margin:18px 0">' + btn_(SITE_URL + "#contrat", S.open + " →") + "</p>";
  }
  return '<div style="background:#f4f7f6;padding:18px 8px;font-family:Arial,Helvetica,sans-serif"><div style="max-width:620px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #dfe6e4">' +
    '<div style="background:#0f5c57;text-align:center"><img src="cid:logo" alt="KREDITAS" width="360" style="max-width:100%;height:auto;display:block;margin:auto"></div>' +
    '<div style="padding:24px 22px;color:#1d2b29;font-size:15px;line-height:1.6">' + body + '<p style="margin:18px 0 0;font-weight:bold;color:#0f5c57">KREDITAS MICRO FINANCE</p></div>' +
    '<div style="background:#f4f7f6;padding:12px;text-align:center;font-size:12px;color:#5b6b68">' + esc_(SENDER) + " · " + esc_(SITE_URL) + "</div></div></div>";
}
function logo_() { return Utilities.newBlob(Utilities.base64Decode(LOGO_B64), "image/png", "logo.png"); }

/* Envoi : depuis contact@kreditas.online si l’alias est validé dans Gmail, sinon depuis le compte du script */
function send_(to, subject, plain, html, attachments) {
  const o = { name: "KREDITAS", replyTo: SENDER, htmlBody: html, inlineImages: { logo: logo_() } };
  if (attachments && attachments.length) o.attachments = attachments;
  try { GmailApp.sendEmail(to, subject, plain, Object.assign({ from: SENDER }, o)); }
  catch (e1) { GmailApp.sendEmail(to, subject, plain, o); }
}
/* Écrit au client sans jamais bloquer le reste */
function toClient_(email, type, lang, prenom, ref, attachments) {
  try {
    if (!EMAIL_OK.test(email || "")) return false;
    if (MailApp.getRemainingDailyQuota() < 20) return false;
    const m = msg_(type, lang, prenom, ref);
    send_(email, m[0], m[1], html_(type, lang, m[1], ref), attachments);
    return true;
  } catch (err) { return false; }
}

/* ---------- Suivi des demandes ---------- */
function getRec_(ref) { const v = PropertiesService.getScriptProperties().getProperty("r_" + ref); try { return v ? JSON.parse(v) : null; } catch (e) { return null; } }
function setRec_(ref, rec) { PropertiesService.getScriptProperties().setProperty("r_" + ref, JSON.stringify(rec)); }
function locked_(fn) { const l = LockService.getScriptLock(); l.waitLock(10000); try { return fn(); } finally { l.releaseLock(); } }
function dropFile_(id) { try { if (id) DriveApp.getFileById(id).setTrashed(true); } catch (e) {} }

/* Toutes les 6 h : un rappel par jour (60 jours) tant que le contrat téléchargé n’est pas signé et renvoyé ; le contrat est joint */
function rappels() {
  locked_(() => {
    const props = PropertiesService.getScriptProperties(), all = props.getProperties(), now = Date.now();
    Object.keys(all).forEach(key => {
      if (key.indexOf("r_") !== 0) return;
      let rec; try { rec = JSON.parse(all[key]); } catch (e) { props.deleteProperty(key); return; }
      const ref = key.slice(2);
      if (now - (rec.c || 0) > 90 * 86400000) { dropFile_(rec.f); props.deleteProperty(key); return; }
      if (rec.s || !rec.d) return;
      if (!EMAIL_OK.test(rec.e || "")) { rec.s = 1; props.setProperty(key, JSON.stringify(rec)); return; }   // adresse invalide : plus de rappels
      const k = rec.k || 0;
      if (k >= RAPPEL_JOURS) { dropFile_(rec.f); rec.f = ""; props.setProperty(key, JSON.stringify(rec)); return; }
      if (now < (rec.t || rec.d) + GAP_H * 3600000) return;
      if (MailApp.getRemainingDailyQuota() < 20) return;
      let att = null; try { if (rec.f) att = [DriveApp.getFileById(rec.f).getBlob()]; } catch (e) {}
      if (toClient_(rec.e, "rap", rec.l, rec.p, ref, att)) { rec.k = k + 1; rec.t = now; props.setProperty(key, JSON.stringify(rec)); }
    });
  });
}

/* DÉCISION : à lancer à la main (éditeur : approuver("KR-XXXXXXXX")) APRÈS avoir vérifié le dossier.
   Envoie au client le message d’approbation « Félicitations 🎊 ». */
function approuver(ref) {
  const rec = getRec_(String(ref).toUpperCase());
  if (!rec) throw new Error("Référence introuvable");
  toClient_(rec.e, "appr", rec.l, rec.p, String(ref).toUpperCase());
  rec.a = 1; setRec_(String(ref).toUpperCase(), rec);
}

function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function txt_(v, max) { return String(v == null ? "" : v).replace(/[\u0000-\u001f]+/g, " ").trim().slice(0, max); }
function mod97_(s) { let r = 0; for (let i = 0; i < s.length; i++) { const c = s.charAt(i), v = c >= "A" ? c.charCodeAt(0) - 55 : Number(c); r = (v > 9 ? r * 100 + v : r * 10 + v) % 97; } return r; }
/* ---------- ANNONCES : un e-mail envoyé depuis votre Gmail = une notification pour tous les utilisateurs de l’application ----------
   Comment faire : depuis lapatience195@gmail.com, envoyez un e-mail À VOUS-MÊME (à lapatience195@gmail.com)
   avec l’objet :  ANNONCE : votre titre      et, dans le message, le texte de l’annonce.
   Dans les 5 minutes, tous les utilisateurs qui ont activé les notifications la reçoivent. */
const ONESIGNAL_APP_ID = "d66d8b84-7473-4fa4-a671-bb545c69a9bc";
const ONESIGNAL_REST_KEY = "os_v2_app_2zwyxbduonh2jjtrxnkfy2njxtbwkgfnv3xeg3e34eilpbirrtpkwtx2cxihckhbfldtevk6vxhurmehkirpg2dnsim7flsuqvp5gqy";   // OneSignal > Settings > Keys & IDs > REST API Key

/* À lancer UNE fois : vérifie les annonces toutes les 5 minutes */
function activerAnnonces() {
  ScriptApp.getProjectTriggers().forEach(t => { if (t.getHandlerFunction() === "annonces") ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger("annonces").timeBased().everyMinutes(5).create();
}
function osPost_(obj) {
  const key = String(ONESIGNAL_REST_KEY).replace(/[\s"'“”]/g, "");
  if (!key || key.indexOf("COLLEZ") >= 0) throw new Error("La clé OneSignal n’est pas collée dans ONESIGNAL_REST_KEY.");
  const scheme = key.indexOf("os_") === 0 ? "Key " : "Basic ";
  const r = UrlFetchApp.fetch("https://api.onesignal.com/notifications?c=push", {
    method: "post", contentType: "application/json", muteHttpExceptions: true, headers: { Authorization: scheme + key },
    payload: JSON.stringify(Object.assign({ app_id: ONESIGNAL_APP_ID, target_channel: "push", url: SITE_URL }, obj))
  });
  return r.getResponseCode() >= 200 && r.getResponseCode() < 300 ? "" : r.getContentText().slice(0, 300);
}
function pushAll_(title, body) { return osPost_({ included_segments: ["Subscribed Users"], headings: { en: title }, contents: { en: body } }); }
/* Notification envoyée au téléphone du client (si l’application/les notifications sont activées) */
const APPR_PUSH = {"fr": "Félicitations 🎊 Votre demande est approuvée. Ouvrez votre e-mail pour les étapes suivantes.", "en": "Congratulations 🎊 Your request is approved. Open your e-mail for the next steps.", "lt": "Sveikiname 🎊 Jūsų paraiška patvirtinta. Kitų žingsnių ieškokite el. pašte.", "lb": "Gratulatioun 🎊 Är Ufro ass guttgeheescht. Kuckt an Ärer E-Mail fir déi nächst Schrëtt.", "lv": "Apsveicam 🎊 Jūsu pieteikums ir apstiprināts. Nākamos soļus skatiet e-pastā.", "it": "Congratulazioni 🎊 La tua richiesta è approvata. Apri la tua e-mail per i prossimi passaggi.", "de": "Glückwunsch 🎊 Ihr Antrag ist genehmigt. Die nächsten Schritte finden Sie in Ihrer E-Mail.", "pt": "Parabéns 🎊 O seu pedido foi aprovado. Abra o seu e-mail para os próximos passos.", "ru": "Поздравляем 🎊 Ваша заявка одобрена. Следующие шаги — в вашем e-mail.", "uk": "Вітаємо 🎊 Вашу заявку схвалено. Наступні кроки — у вашому e-mail.", "ro": "Felicitări 🎊 Cererea dvs. este aprobată. Deschideți e-mailul pentru pașii următori.", "hr": "Čestitamo 🎊 Vaš zahtjev je odobren. Sljedeće korake pronađite u e-pošti."};
function pushOne_(ref, lang) {
  try { const t = APPR_PUSH[L2_(lang)] || APPR_PUSH.en; osPost_({ include_aliases: { external_id: [ref] }, headings: { en: "KREDITAS" }, contents: { en: t } }); } catch (e) {}
}
/* Facultatif : envoie tout de suite une notification de test à tous les abonnés */
function testAnnonce() { const e = pushAll_("KREDITAS", "Test : les notifications fonctionnent ✔"); if (e) throw new Error(e); }

function annonces() {
  const label = GmailApp.getUserLabelByName("ANNONCE-ENVOYEE") || GmailApp.createLabel("ANNONCE-ENVOYEE");
  GmailApp.search("from:me to:me subject:ANNONCE -label:ANNONCE-ENVOYEE newer_than:2d", 0, 5).forEach(th => {
    const m = th.getMessages()[0];
    if (String(m.getFrom()).toLowerCase().indexOf(OWNER_EMAIL) < 0) return;
    const title = m.getSubject().replace(/^\s*(re|fwd?)\s*:\s*/i, "").replace(/^\s*annonce\s*[:\-–]?\s*/i, "").trim().slice(0, 60) || "KREDITAS";
    let body = m.getPlainBody().split(/\n--\s*\n|\nOn .* wrote:|\nLe .* a écrit/)[0].replace(/\s+/g, " ").trim().slice(0, 300);
    if (!body) body = title;
    const err = pushAll_(title, body);
    th.addLabel(label);
    if (err) MailApp.sendEmail(OWNER_EMAIL, "KREDITAS : l’annonce n’a pas pu être envoyée", "Titre : " + title + "\n\nErreur OneSignal : " + err);
  });
}

/* ---------- ANNONCES PAR E-MAIL (personnes qui vous connaissent et sont d’accord) ----------
   1) Lancez creerListePromo : un Google Sheet est créé et son lien vous est envoyé par e-mail.
   2) Onglet « E-mails » : colonne A = e-mail, B = prénom (facultatif), C = langue (fr, en, lt, lb, lv, it, de, pt, ru, uk, ro, hr ; vide = fr).
   3) Lancez essaiPromo (vous recevez l’annonce), puis envoyerPromo (50 par jour au maximum) ou activerPromoQuotidien (envoi automatique chaque jour à 9 h).
   Chaque adresse n’est contactée qu’une fois ; si quelqu’un répond STOP, il n’est plus jamais contacté. */
const PROMO_PAR_JOUR = 50;
const PROMO = {"fr": ["KREDITAS Micro Finance : demandez votre crédit en ligne", "Bonjour {p},", "Je me permets de vous présenter KREDITAS Micro Finance : faites votre demande de crédit en ligne en quelques minutes, suivez votre dossier, signez votre contrat en ligne et recevez nos annonces sur votre téléphone en installant l’application.", "Visiter le site", "Un crédit vous engage et doit être remboursé. Vérifiez vos capacités de remboursement avant de vous engager.", "Vous recevez ce message parce que nous nous connaissons. Pour ne plus en recevoir, répondez simplement STOP."], "en": ["KREDITAS Micro Finance: request your loan online", "Hello {p},", "Allow me to introduce KREDITAS Micro Finance: submit your loan request online in a few minutes, follow your file, sign your contract online and receive our announcements on your phone by installing the app.", "Visit the website", "A loan is a commitment and must be repaid. Check your ability to repay before committing.", "You are receiving this message because we know each other. To stop receiving it, simply reply STOP."], "lt": ["KREDITAS Micro Finance: pateikite paskolos paraišką internetu", "Sveiki, {p},", "Noriu jums pristatyti KREDITAS Micro Finance: paskolos paraišką pateikite internetu per kelias minutes, sekite savo bylą, pasirašykite sutartį internetu ir gaukite mūsų skelbimus telefone įdiegę programėlę.", "Aplankyti svetainę", "Paskola yra įsipareigojimas, kurį reikia grąžinti. Prieš apsispręsdami įvertinkite savo galimybes grąžinti.", "Gaunate šį laišką, nes mes pažįstami. Jei nebenorite gauti, tiesiog atsakykite STOP."], "lb": ["KREDITAS Micro Finance: Ufro fir Äre Kredit online", "Moien {p},", "Ech wëll Iech KREDITAS Micro Finance virstellen: stellt Är Kreditsufro online a puer Minutten, verfolgt Äre Dossier, ënnerschreift Äre Kontrakt online a kritt eis Annoncen um Handy, wann Dir d’App installéiert.", "De Site besichen", "E Kredit verflicht Iech a muss zréckbezuelt ginn. Préift Är Réckzuelungsméiglechkeeten, ier Dir Iech engagéiert.", "Dir kritt dës Noriicht, well mir eis kennen. Fir se net méi ze kréien, äntwert einfach STOP."], "lv": ["KREDITAS Micro Finance: pieprasiet kredītu tiešsaistē", "Labdien, {p},", "Atļaujiet iepazīstināt ar KREDITAS Micro Finance: iesniedziet kredīta pieteikumu tiešsaistē dažās minūtēs, sekojiet savai lietai, parakstiet līgumu tiešsaistē un saņemiet mūsu paziņojumus telefonā, instalējot lietotni.", "Apmeklēt vietni", "Kredīts ir saistība, kas jāatmaksā. Pirms apņematies, izvērtējiet savas atmaksas iespējas.", "Šo ziņu saņemat, jo mēs pazīstam viens otru. Lai vairs nesaņemtu, vienkārši atbildiet STOP."], "it": ["KREDITAS Micro Finance: richiedi il tuo prestito online", "Ciao {p},", "Mi permetto di presentarti KREDITAS Micro Finance: fai la richiesta di prestito online in pochi minuti, segui la tua pratica, firma il contratto online e ricevi i nostri annunci sul telefono installando l’app.", "Visita il sito", "Un prestito è un impegno e va rimborsato. Verifica la tua capacità di rimborso prima di impegnarti.", "Ricevi questo messaggio perché ci conosciamo. Per non riceverne più, rispondi semplicemente STOP."], "de": ["KREDITAS Micro Finance: Kredit online beantragen", "Guten Tag {p},", "gestatten Sie mir, Ihnen KREDITAS Micro Finance vorzustellen: Beantragen Sie Ihren Kredit in wenigen Minuten online, verfolgen Sie Ihre Akte, unterschreiben Sie Ihren Vertrag online und erhalten Sie unsere Ankündigungen auf Ihrem Handy, wenn Sie die App installieren.", "Website besuchen", "Ein Kredit verpflichtet Sie und muss zurückgezahlt werden. Prüfen Sie Ihre Rückzahlungsfähigkeit, bevor Sie sich verpflichten.", "Sie erhalten diese Nachricht, weil wir uns kennen. Wenn Sie sie nicht mehr erhalten möchten, antworten Sie einfach mit STOP."], "pt": ["KREDITAS Micro Finance: peça o seu crédito online", "Olá {p},", "Permita-me apresentar a KREDITAS Micro Finance: faça o seu pedido de crédito online em poucos minutos, acompanhe o seu processo, assine o contrato online e receba os nossos anúncios no telemóvel ao instalar a aplicação.", "Visitar o site", "Um crédito é um compromisso e deve ser reembolsado. Verifique a sua capacidade de reembolso antes de se comprometer.", "Recebe esta mensagem porque nos conhecemos. Para deixar de a receber, responda simplesmente STOP."], "ru": ["KREDITAS Micro Finance: оформите кредит онлайн", "Здравствуйте, {p}!", "Позвольте представить KREDITAS Micro Finance: подайте заявку на кредит онлайн за несколько минут, следите за своим делом, подпишите договор онлайн и получайте наши объявления на телефон, установив приложение.", "Посетить сайт", "Кредит — это обязательство, его нужно вернуть. Оцените свои возможности погашения, прежде чем принимать решение.", "Вы получили это сообщение, потому что мы знакомы. Чтобы больше его не получать, просто ответьте STOP."], "uk": ["KREDITAS Micro Finance: оформіть кредит онлайн", "Вітаємо, {p}!", "Дозвольте представити KREDITAS Micro Finance: подайте заявку на кредит онлайн за кілька хвилин, стежте за своєю справою, підпишіть договір онлайн і отримуйте наші оголошення на телефон, установивши застосунок.", "Відвідати сайт", "Кредит — це зобов’язання, його потрібно повернути. Оцініть свої можливості погашення, перш ніж ухвалювати рішення.", "Ви отримали це повідомлення, бо ми знайомі. Щоб більше його не отримувати, просто дайте відповідь STOP."], "ro": ["KREDITAS Micro Finance: solicitați creditul online", "Bună ziua, {p},", "Vă prezint KREDITAS Micro Finance: depuneți cererea de credit online în câteva minute, urmăriți dosarul, semnați contractul online și primiți anunțurile noastre pe telefon instalând aplicația.", "Vizitați site-ul", "Un credit este un angajament și trebuie rambursat. Verificați-vă capacitatea de rambursare înainte de a vă angaja.", "Primiți acest mesaj pentru că ne cunoaștem. Pentru a nu-l mai primi, răspundeți pur și simplu STOP."], "hr": ["KREDITAS Micro Finance: zatražite kredit online", "Poštovani {p},", "Dopustite da vam predstavim KREDITAS Micro Finance: podnesite zahtjev za kredit online za nekoliko minuta, pratite svoj dosje, potpišite ugovor online i primajte naše obavijesti na telefonu instaliranjem aplikacije.", "Posjetite web-stranicu", "Kredit je obveza i mora se vratiti. Provjerite svoju sposobnost otplate prije nego se obvežete.", "Primate ovu poruku jer se poznajemo. Za prestanak primanja jednostavno odgovorite STOP."]};
const WA_TEXTE = "Bonjour ! Je vous invite à découvrir KREDITAS Micro Finance : demande de crédit en ligne, suivi du dossier et contrat signé en ligne. Visitez : https://kreditas.online/";

function listePromo_() {
  const pr = PropertiesService.getScriptProperties(); let ss = null; const id = pr.getProperty("PROMO_SSID");
  if (id) { try { ss = SpreadsheetApp.openById(id); } catch (e) { ss = null; } }
  if (!ss) {
    ss = SpreadsheetApp.create("KREDITAS - liste promo"); pr.setProperty("PROMO_SSID", ss.getId());
    const sh = ss.getSheets()[0]; sh.setName("E-mails");
    sh.getRange(1, 1, 1, 4).setValues([["E-mail", "Prénom", "Langue (fr, en, lt, lb, lv, it, de, pt, ru, uk, ro, hr)", "Statut"]]).setFontWeight("bold"); sh.setFrozenRows(1);
    const w = ss.insertSheet("WhatsApp");
    w.getRange(1, 1, 1, 3).setValues([["Numéro (international, ex. 33612345678)", "Prénom", "Lien : touchez pour ouvrir WhatsApp"]]).setFontWeight("bold"); w.setFrozenRows(1);
    const f = []; for (let r = 2; r <= 300; r++) f.push(['=IF(A' + r + '="","",HYPERLINK("https://wa.me/"&REGEXREPLACE(A' + r + '&"","[^0-9]","")&"?text="&ENCODEURL("' + WA_TEXTE.replace(/"/g, "") + '"),"Envoyer sur WhatsApp"))']);
    w.getRange(2, 3, 299, 1).setFormulas(f);
  }
  return ss;
}
function creerListePromo() {
  const ss = listePromo_();
  MailApp.sendEmail(OWNER_EMAIL, "KREDITAS : votre liste d’annonces est prête", "Ouvrez ce lien et collez les adresses e-mail dans la colonne A de l’onglet « E-mails » (les numéros WhatsApp dans l’onglet « WhatsApp ») :\n" + ss.getUrl());
}
function promoMail_(to, prenom, lang) {
  const k = String(lang || "fr").toLowerCase().slice(0, 2), t = PROMO[k] || PROMO.fr;
  const hello = t[1].replace("{p}", prenom || "").replace(/\s+([,!])/g, "$1");
  const text = hello + "\n\n" + t[2] + "\n\n" + SITE_URL + "\n\n" + t[4] + "\n\n" + t[5];
  const html = '<div style="background:#f4f7f6;padding:18px 8px;font-family:Arial,Helvetica,sans-serif"><div style="max-width:620px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #dfe6e4">' +
    '<div style="background:#0f5c57;text-align:center"><img src="cid:logo" alt="KREDITAS" width="360" style="max-width:100%;height:auto;display:block;margin:auto"></div>' +
    '<div style="padding:24px 22px;color:#1d2b29;font-size:15px;line-height:1.6"><p style="margin:0 0 14px">' + esc_(hello) + '</p><p style="margin:0 0 18px">' + esc_(t[2]) + '</p>' +
    '<p style="text-align:center;margin:20px 0">' + btn_(SITE_URL, t[3] + " →") + '</p><p style="margin:16px 0 0;background:#fdf3d6;border-radius:8px;padding:10px 12px;font-size:13px">' + esc_(t[4]) + '</p>' +
    '<p style="margin:16px 0 0;font-weight:bold;color:#0f5c57">KREDITAS MICRO FINANCE</p></div>' +
    '<div style="background:#f4f7f6;padding:12px;text-align:center;font-size:12px;color:#5b6b68">' + esc_(t[5]) + '<br>' + esc_(SENDER) + '</div></div></div>';
  send_(to, t[0], text, html);
}
function essaiPromo() { promoMail_(OWNER_EMAIL, "Marie", "fr"); }
function stopPromo_(sh) {
  const stops = {};
  GmailApp.search("in:inbox newer_than:60d STOP", 0, 40).forEach(th => th.getMessages().forEach(m => {
    const f = (String(m.getFrom()).match(/[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+/) || [""])[0].toLowerCase();
    if (f && (/^\s*stop/i.test(m.getPlainBody()) || /^\s*(re:\s*)?stop/i.test(m.getSubject()))) stops[f] = 1;
  }));
  const v = sh.getDataRange().getValues();
  for (let i = 1; i < v.length; i++) { const em = String(v[i][0] || "").trim().toLowerCase(); if (em && stops[em] && String(v[i][3]) !== "STOP") sh.getRange(i + 1, 4).setValue("STOP"); }
}
function envoyerPromo() {
  const sh = listePromo_().getSheetByName("E-mails"); stopPromo_(sh);
  const pr = PropertiesService.getScriptProperties(), day = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  let c = pr.getProperty("PROMO_DAY") === day ? Number(pr.getProperty("PROMO_N") || 0) : 0;
  const v = sh.getDataRange().getValues();
  for (let i = 1; i < v.length && c < PROMO_PAR_JOUR; i++) {
    const em = String(v[i][0] || "").trim().toLowerCase().replace(/[\s\u200B-\u200D\u2060\uFEFF\u00A0]/g, "");
    if (!em || String(v[i][3] || "")) continue;
    if (!EMAIL_OK.test(em)) { sh.getRange(i + 1, 4).setValue("adresse invalide"); continue; }
    if (MailApp.getRemainingDailyQuota() < 20) break;
    try { promoMail_(em, String(v[i][1] || "").trim(), v[i][2]); sh.getRange(i + 1, 4).setValue("envoyé " + day); c++; }
    catch (e) { sh.getRange(i + 1, 4).setValue("erreur"); }
  }
  pr.setProperty("PROMO_DAY", day); pr.setProperty("PROMO_N", String(c));
}
function activerPromoQuotidien() {
  ScriptApp.getProjectTriggers().forEach(t => { if (t.getHandlerFunction() === "envoyerPromo") ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger("envoyerPromo").timeBased().everyDays(1).atHour(9).create();
}

function approuverRef_(ref) {
  const rec = getRec_(ref);
  if (!rec) return "introuvable";
  if (rec.a) return "deja";
  if (!toClient_(rec.e, "appr", rec.l, rec.p, ref)) return "echec";
  rec.a = 1; locked_(() => setRec_(ref, rec));
  pushOne_(ref, rec.l);
  return "ok";
}
/* Approbation en répondant « OK » à l’e-mail de la demande (sans quitter Gmail) — à activer une fois : activerApprobationParReponse */
function activerApprobationParReponse() {
  ScriptApp.getProjectTriggers().forEach(t => { if (t.getHandlerFunction() === "approbationsParReponse") ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger("approbationsParReponse").timeBased().everyMinutes(1).create();
}
function approbationsParReponse() {
  const label = GmailApp.getUserLabelByName("DEMANDE-TRAITEE") || GmailApp.createLabel("DEMANDE-TRAITEE");
  GmailApp.search('from:me to:me subject:"Nouvelle demande de crédit" -label:DEMANDE-TRAITEE newer_than:14d', 0, 20).forEach(th => {
    const ms = th.getMessages(); if (ms.length < 2) return;
    const last = ms[ms.length - 1];
    if (String(last.getFrom()).toLowerCase().indexOf(OWNER_EMAIL) < 0) return;
    const w = (last.getPlainBody().trim().split(/\s+/)[0] || "").replace(/[^A-Za-zÀ-ÿ]/g, "").toLowerCase();
    if (["ok", "oui", "yes", "approuve", "approuver", "approuvé"].indexOf(w) < 0) return;
    const m = th.getFirstMessageSubject().match(/KR-[A-Z0-9]{8}/); if (!m) return;
    const r = approuverRef_(m[0]);
    if (r === "ok" || r === "deja") th.addLabel(label);
  });
}
/* ---------- Approbation en un clic (lien sécurisé dans l’e-mail que vous recevez) ---------- */
function token_(ref) {
  const pr = PropertiesService.getScriptProperties();
  let k = pr.getProperty("SECRET");
  if (!k) { k = Utilities.getUuid() + Utilities.getUuid(); pr.setProperty("SECRET", k); }
  return Utilities.computeHmacSha256Signature(ref, k).map(b => ("0" + (b & 0xff).toString(16)).slice(-2)).join("").slice(0, 32);
}
function approveUrl_(ref) { return ScriptApp.getService().getUrl() + "?a=approuver&ref=" + encodeURIComponent(ref) + "&t=" + token_(ref); }
function page_(html) {
  return HtmlService.createHtmlOutput('<meta name="viewport" content="width=device-width,initial-scale=1"><div style="font-family:Arial,sans-serif;max-width:480px;margin:40px auto;padding:20px;text-align:center;font-size:18px;line-height:1.5">' + html + "</div>");
}
function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.a !== "approuver") return out_({ ok: true, mode: "email" });
  const ref = String(p.ref || "").toUpperCase();
  if (!/^KR-[A-Z0-9]{8}$/.test(ref) || String(p.t || "") !== token_(ref)) return page_("Lien invalide.");
  const rec = getRec_(ref);
  if (!rec) return page_("Dossier introuvable (demande trop ancienne).");
  if (rec.a) return page_("Cette demande est déjà approuvée : le client a déjà reçu son message.");
  const r = approuverRef_(ref);
  if (r === "echec") return page_("L’envoi a échoué (limite d’e-mails atteinte ?). Réessayez plus tard.");
  return page_("✅ Demande <b>" + esc_(ref) + "</b> approuvée.<br>Le client a reçu son e-mail de félicitations (et une notification sur son téléphone s’il a activé l’application).");
}

function doPost(e) {
  try {
    const q = JSON.parse(e.postData.contents), ref = String(q.ref || "").toUpperCase(), cache = CacheService.getScriptCache();
    const anon = ref === "SANS-REF" && (q.action === "televerser" || q.action === "banque");
    if (!anon && !/^KR-[A-Z0-9]{8}$/.test(ref)) return out_({ ok: false });
    const EMAIL_RE = EMAIL_OK;

    /* 1) Nouvelle demande : vous êtes notifié ; le client reçoit le message de confirmation avec les étapes */
    if (q.action === "demande") {
      const d = q.data || {}, email = txt_(d["Email"], 120).toLowerCase();
      if (!EMAIL_RE.test(email) || d["Consentement"] !== "Oui") return out_({ ok: false });
      if (!cache.get("d_" + ref)) {
        cache.put("d_" + ref, "1", 21600);
        const n = Number(cache.get("dm_" + email) || 0);
        if (n >= 5) return out_({ ok: false });
        cache.put("dm_" + email, String(n + 1), 3600);
        const lines = Object.keys(d).filter(k => k.charAt(0) !== "_").map(k => k + " : " + txt_(d[k], 200));
        const aUrl = approveUrl_(ref);
        MailApp.sendEmail({ to: OWNER_EMAIL, replyTo: email,
          subject: "Nouvelle demande de crédit : " + txt_(d["Prénom"], 40) + " " + txt_(d["Nom de famille"], 40) + " (" + ref + ")",
          body: "Référence : " + ref + "\n\n" + lines.join("\n") + "\n\nPour APPROUVER cette demande (après vérification) : " + aUrl,
          htmlBody: '<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6"><p><b>Référence : ' + esc_(ref) + "</b></p><p>" + lines.map(esc_).join("<br>") + "</p>" +
            '<p style="margin:22px 0"><a href="' + esc_(aUrl) + '" style="background:#1a8f4c;color:#fff;text-decoration:none;font-weight:bold;padding:14px 26px;border-radius:8px;display:inline-block">✅ Approuver cette demande</a></p>' +
            '<p style="color:#7a4b00;font-size:13px">Vérifiez le dossier avant d’approuver : le client recevra aussitôt le message « Félicitations, votre demande est approuvée ». Vous pouvez aussi approuver en répondant simplement OK à cet e-mail.</p></div>' });
        const prenom = txt_(d["Prénom"], 40), lang = txt_(d["Langue du visiteur"], 5).toLowerCase();
        locked_(() => setRec_(ref, { e: email, l: lang, p: prenom, c: Date.now(), d: 0, k: 0, s: 0, f: "" }));
        toClient_(email, "dem", lang, prenom, ref);
      }
      return out_({ ok: true });
    }

    /* 2) Contrat téléchargé : démarre les rappels quotidiens et garde une copie PDF à joindre */
    if (q.action === "contrat_telecharge") {
      const email = txt_(q.email, 120).toLowerCase();
      return out_({ ok: locked_(() => {
        const rec = getRec_(ref);
        if (!rec || rec.e !== email) return false;
        if (!rec.d && !rec.s) rec.d = Date.now();
        if (q.html && !rec.f && !rec.s) {
          try {
            const pdf = Utilities.newBlob(String(q.html), "text/html", "contrat.html").getAs("application/pdf").setName("Contrat_KREDITAS_" + ref + ".pdf");
            rec.f = DriveApp.createFile(pdf).getId();
          } catch (err) {}
        }
        setRec_(ref, rec);
        return true;
      }) });
    }

    /* 3) Contrat signé reçu : arrêt des rappels, remerciement, suppression de la copie temporaire */
    if (q.action === "televerser") {
      const rec = anon ? null : getRec_(ref), email = txt_(q.email, 120).toLowerCase() || (rec ? rec.e : "");
      if ((email && !EMAIL_RE.test(email)) || (!anon && !email) || MIMES.indexOf(q.mime) < 0 || !q.data || String(q.data).length > 6000000) return out_({ ok: false });
      const key = "up_" + ref, n = Number(cache.get(key) || 0);
      if (n >= (anon ? 80 : 12)) return out_({ ok: false });
      cache.put(key, String(n + 1), 21600);
      const safe = String(q.name || "contrat").replace(/[^\w.\-]+/g, "_").slice(0, 60);
      const blob = Utilities.newBlob(Utilities.base64Decode(q.data), q.mime, ref + "_signe_" + safe);
      const opts = { to: OWNER_EMAIL,
        subject: "Contrat signé reçu : " + txt_(q.nom, 60) + " (" + ref + ")",
        body: "Le client a renvoyé son contrat signé.\n\nNom : " + txt_(q.nom, 80) + "\nE-mail : " + (email || "(non renseigné)") + "\nRéférence : " + ref + "\n\nLe fichier est en pièce jointe." + (email ? " Pour répondre au client, répondez simplement à cet e-mail." : ""),
        attachments: [blob] };
      if (email) opts.replyTo = email;
      MailApp.sendEmail(opts);
      if (email) {
        let first = false, fid = "";
        locked_(() => {
          const r = getRec_(ref);
          if (r) { first = !r.s; r.s = 1; fid = r.f; r.f = ""; setRec_(ref, r); }
          else if (!cache.get("thx_" + ref + email)) { first = true; cache.put("thx_" + ref + email, "1", 21600); }
        });
        dropFile_(fid);
        if (first) toClient_(email, "ok", rec ? rec.l : "", rec ? rec.p : txt_(q.nom, 40).split(" ")[0], ref === "SANS-REF" ? "" : ref);
      }
      return out_({ ok: true, status: "Signé reçu" });
    }

    /* 4) Coordonnées bancaires */
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

/* Étapes à suivre (message long de confirmation) + message d’approbation — 12 langues */
const STEP = {
fr:{i:"Voici les étapes à suivre, une par une, pour finaliser votre dossier en quelques minutes :",
 s:["Vos coordonnées bancaires|Indiquez le compte (à votre nom) sur lequel vous souhaitez recevoir le virement.","Lisez votre contrat|Il est déjà établi à votre nom : montant, durée et mensualités y figurent.","Signez-le|Signez en ligne avec le doigt ou la souris, ou imprimez-le et signez à la main.","Envoyez-le|Renvoyez le contrat signé. Notre équipe le vérifie puis vous répond par e-mail."],
 open:"Ouvrir", note:"Le remboursement débute trois mois après la date de votre demande, puis le 15 de chaque mois.", help:"Une question ? Répondez simplement à cet e-mail ou utilisez le chat du site. Pensez à vérifier vos courriers indésirables."},
en:{i:"Here are the steps to follow, one by one, to complete your file in a few minutes:",
 s:["Your bank details|Enter the account (in your name) where you wish to receive the transfer.","Read your contract|It is already drawn up in your name: amount, term and monthly payments are included.","Sign it|Sign online with your finger or mouse, or print it and sign by hand.","Send it|Send back the signed contract. Our team checks it and replies by e-mail."],
 open:"Open", note:"Repayment begins three months after the date of your request, then on the 15th of each month.", help:"A question? Simply reply to this e-mail or use the chat on the site. Please also check your spam folder."},
lt:{i:"Štai žingsniai, kuriuos reikia atlikti vienas po kito, kad baigtumėte bylą per kelias minutes:",
 s:["Jūsų banko duomenys|Nurodykite sąskaitą (jūsų vardu), į kurią norite gauti pavedimą.","Perskaitykite sutartį|Ji jau parengta jūsų vardu: nurodyta suma, trukmė ir mėnesinės įmokos.","Pasirašykite|Pasirašykite internetu pirštu ar pele arba atsispausdinkite ir pasirašykite ranka.","Išsiųskite|Atsiųskite pasirašytą sutartį. Mūsų komanda ją patikrins ir atsakys el. paštu."],
 open:"Atidaryti", note:"Grąžinimas prasideda praėjus trims mėnesiams nuo paraiškos datos, vėliau – kiekvieno mėnesio 15 d.", help:"Turite klausimą? Tiesiog atsakykite į šį laišką arba naudokite pokalbių langą svetainėje. Patikrinkite ir šlamšto aplanką."},
lv:{i:"Šeit ir soļi, kas jāveic pa vienam, lai dažās minūtēs pabeigtu pieteikumu:",
 s:["Jūsu bankas dati|Norādiet kontu (uz jūsu vārda), uz kuru vēlaties saņemt pārskaitījumu.","Izlasiet līgumu|Tas jau sagatavots uz jūsu vārda: norādīta summa, termiņš un ikmēneša maksājumi.","Parakstiet|Parakstiet tiešsaistē ar pirkstu vai peli vai izdrukājiet un parakstiet ar roku.","Nosūtiet|Nosūtiet parakstīto līgumu. Mūsu komanda to pārbaudīs un atbildēs e-pastā."],
 open:"Atvērt", note:"Atmaksa sākas trīs mēnešus pēc pieteikuma datuma, pēc tam katra mēneša 15. datumā.", help:"Jautājums? Vienkārši atbildiet uz šo e-pastu vai izmantojiet tērzēšanu vietnē. Pārbaudiet arī surogātpasta mapi."},
it:{i:"Ecco i passaggi da seguire, uno alla volta, per completare la pratica in pochi minuti:",
 s:["Le tue coordinate bancarie|Indica il conto (intestato a te) su cui vuoi ricevere il bonifico.","Leggi il contratto|È già redatto a tuo nome: importo, durata e rate mensili sono indicati.","Firmalo|Firma online con il dito o il mouse, oppure stampalo e firma a mano.","Invialo|Rinvia il contratto firmato. Il nostro team lo verifica e risponde via e-mail."],
 open:"Apri", note:"Il rimborso inizia tre mesi dopo la data della richiesta, poi il 15 di ogni mese.", help:"Una domanda? Rispondi semplicemente a questa e-mail o usa la chat del sito. Controlla anche la cartella spam."},
de:{i:"Hier sind die Schritte, die Sie nacheinander ausführen, um Ihre Akte in wenigen Minuten abzuschließen:",
 s:["Ihre Bankverbindung|Geben Sie das Konto (auf Ihren Namen) an, auf das die Überweisung erfolgen soll.","Vertrag lesen|Er ist bereits auf Ihren Namen ausgestellt: Betrag, Laufzeit und Monatsraten sind enthalten.","Unterschreiben|Unterschreiben Sie online mit Finger oder Maus oder drucken Sie ihn aus und unterschreiben von Hand.","Senden|Senden Sie den unterschriebenen Vertrag zurück. Unser Team prüft ihn und antwortet per E-Mail."],
 open:"Öffnen", note:"Die Rückzahlung beginnt drei Monate nach dem Antragsdatum, danach jeweils am 15. jedes Monats.", help:"Eine Frage? Antworten Sie einfach auf diese E-Mail oder nutzen Sie den Chat auf der Website. Prüfen Sie auch Ihren Spam-Ordner."},
pt:{i:"Eis os passos a seguir, um a um, para concluir o seu processo em poucos minutos:",
 s:["Os seus dados bancários|Indique a conta (em seu nome) onde pretende receber a transferência.","Leia o contrato|Já está elaborado em seu nome: montante, prazo e prestações mensais constam do documento.","Assine|Assine online com o dedo ou o rato, ou imprima e assine à mão.","Envie|Envie o contrato assinado. A nossa equipa verifica-o e responde por e-mail."],
 open:"Abrir", note:"O reembolso começa três meses após a data do pedido e depois no dia 15 de cada mês.", help:"Tem alguma dúvida? Basta responder a este e-mail ou usar o chat do site. Verifique também a pasta de spam."},
ru:{i:"Вот шаги, которые нужно выполнить по очереди, чтобы завершить оформление за несколько минут:",
 s:["Ваши банковские реквизиты|Укажите счёт (на ваше имя), на который хотите получить перевод.","Прочитайте договор|Он уже оформлен на ваше имя: указаны сумма, срок и ежемесячные платежи.","Подпишите|Подпишите онлайн пальцем или мышью либо распечатайте и подпишите от руки.","Отправьте|Отправьте подписанный договор. Наша команда проверит его и ответит по e-mail."],
 open:"Открыть", note:"Погашение начинается через три месяца после даты заявки, затем 15 числа каждого месяца.", help:"Вопрос? Просто ответьте на это письмо или воспользуйтесь чатом на сайте. Проверьте также папку «Спам»."},
uk:{i:"Ось кроки, які потрібно виконати по черзі, щоб завершити оформлення за кілька хвилин:",
 s:["Ваші банківські реквізити|Вкажіть рахунок (на ваше ім’я), на який хочете отримати переказ.","Прочитайте договір|Він уже оформлений на ваше ім’я: вказано суму, строк і щомісячні платежі.","Підпишіть|Підпишіть онлайн пальцем або мишею чи роздрукуйте та підпишіть від руки.","Надішліть|Надішліть підписаний договір. Наша команда перевірить його й відповість на e-mail."],
 open:"Відкрити", note:"Погашення починається через три місяці після дати заявки, далі 15 числа кожного місяця.", help:"Питання? Просто дайте відповідь на цей лист або скористайтеся чатом на сайті. Перевірте також папку «Спам»."},
ro:{i:"Iată pașii de urmat, unul câte unul, pentru a finaliza dosarul în câteva minute:",
 s:["Datele dvs. bancare|Indicați contul (pe numele dvs.) în care doriți să primiți transferul.","Citiți contractul|Este deja întocmit pe numele dvs.: suma, durata și ratele lunare sunt incluse.","Semnați-l|Semnați online cu degetul sau mouse-ul ori imprimați-l și semnați de mână.","Trimiteți-l|Retrimiteți contractul semnat. Echipa noastră îl verifică și vă răspunde prin e-mail."],
 open:"Deschide", note:"Rambursarea începe la trei luni după data cererii, apoi pe 15 ale fiecărei luni.", help:"O întrebare? Răspundeți pur și simplu la acest e-mail sau folosiți chatul de pe site. Verificați și dosarul spam."},
hr:{i:"Evo koraka koje treba slijediti, jedan po jedan, kako biste završili dosje za nekoliko minuta:",
 s:["Vaši bankovni podaci|Navedite račun (na vaše ime) na koji želite primiti uplatu.","Pročitajte ugovor|Već je sastavljen na vaše ime: navedeni su iznos, rok i mjesečne rate.","Potpišite ga|Potpišite online prstom ili mišem ili ga ispišite i potpišite rukom.","Pošaljite ga|Pošaljite potpisani ugovor. Naš tim ga provjerava i odgovara e-poštom."],
 open:"Otvori", note:"Otplata započinje tri mjeseca nakon datuma zahtjeva, a zatim 15. u svakom mjesecu.", help:"Pitanje? Jednostavno odgovorite na ovu poruku ili upotrijebite chat na web-stranici. Provjerite i mapu neželjene pošte."},
lb:{i:"Hei sinn d’Schrëtt, ee fir een, fir Äre Dossier a puer Minutten ofzeschléissen:",
 s:["Är Bankdonnéeën|Gitt d’Konto (opÄren Numm) un, op dat Dir d’Iwwerweisung wëllt kréien.","Liest Äre Kontrakt|En ass schonn opÄren Numm ausgestallt: Montant, Dauer a Monatsraten stinn dra.","Ënnerschreift en|Ënnerschreift online mam Fanger oder der Maus, oder dréckt en aus an ënnerschreift mat der Hand.","Schéckt en|Schéckt de ënnerschriwwene Kontrakt zréck. Eis Equipe kontrolléiert en an äntwert per E-Mail."],
 open:"Opmaachen", note:"D’Réckzuelung fänkt dräi Méint no dem Datum vun Ärer Ufro un, duerno all 15. vum Mount.", help:"Eng Fro? Äntwert einfach op dës E-Mail oder benotzt de Chat um Site. Kuckt och am Spam-Dossier no."}
};

/* Message d’approbation : à envoyer UNIQUEMENT après vérification du dossier (voir approuver() dans Code.gs) */
const APPR = {
fr:["Félicitations, votre demande de crédit est approuvée ({r}) 🎊","Bonjour {p},\n\nFélicitations ! 🎊 Après étude de votre dossier (référence {r}), nous avons le plaisir de vous annoncer que votre demande de crédit est approuvée.\n\nPour finaliser, il vous reste simplement à : 1) indiquer vos coordonnées bancaires, 2) lire votre contrat, 3) le signer, 4) nous le renvoyer, depuis la page « Mon contrat » : {u}\n\nDès réception de votre contrat signé et après vérification, nous procédons au virement sur le compte que vous avez indiqué. Le remboursement débute trois mois après la date de votre demande, puis le 15 de chaque mois.\n\nMerci de votre confiance.\n\nKREDITAS"],
en:["Congratulations, your loan request is approved ({r}) 🎊","Hello {p},\n\nCongratulations! 🎊 After reviewing your file (reference {r}), we are pleased to inform you that your loan request has been approved.\n\nTo finalise, you simply need to: 1) enter your bank details, 2) read your contract, 3) sign it, 4) send it back, from the “My contract” page: {u}\n\nOnce we receive your signed contract and have checked it, we transfer the funds to the account you provided. Repayment begins three months after the date of your request, then on the 15th of each month.\n\nThank you for your trust.\n\nKREDITAS"]
};

/* Logo KREDITAS (PNG) intégré au script : aucun hébergement nécessaire, il s’affiche dans chaque e-mail */
const LOGO_B64 = "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";
