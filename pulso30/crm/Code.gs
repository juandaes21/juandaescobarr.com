/**
 * PULSO 30 CRM — Google Apps Script
 * Instalación: Extensiones > Apps Script en el CRM, pegar código, guardar
 * Implementar > Nueva implementación > Aplicación web.
 * Ejecutar como: Yo. Acceso: Cualquier persona. No publicar la hoja.
 * ATENCIÓN: la URL /exec debe conectarse a la web DESPUÉS de autorizar y probar el flujo.
 */
const CFG = Object.freeze({
  SHEET: "Prospectos",
  EMAIL: "juandaes01@hotmail.com",
  ORIGIN: "https://juandaescobarr.com",
  VERSION: "pulso30-consent-v1",
  MAX_PER_EMAIL_DAY: 3,
  MAX_ROWS: 20000
});
const KEYS = [
  "Nombre","Correo","WhatsApp","Rol","Empresa","Sector","Antigüedad","Equipo",
  "Rango de ventas","Reto principal","Objetivo a 90 días","Disponibilidad de datos","Notas adicionales"
];
function safe_(value, max) {
  let s = String(value || "").replace(/[\u0000-\u001F\u007F]/g," ").trim().slice(0,max);
  if (/^[=+\-@]/.test(s)) s = "'"+s; // formula injection protection
  return s;
}
function view_(ok, nonce, message) {
  const data=JSON.stringify({app:"pulso30-lead",ok:!!ok,nonce:String(nonce||"").slice(0,128),message});
  const escaped=data.replace(/</g,"\\u003c").replace(/>/g,"\\u003e");
  const html='<!doctype html><html><head><meta charset="utf-8"></head><body>'+
     '<p>'+ (ok?"Solicitud registrada":"No pudimos registrar tu solicitud") +'</p>'+
     '<script>try{window.top.postMessage('+escaped+','+JSON.stringify(CFG.ORIGIN)+')}catch(e){}</script>'+
     '</body></html>';
  return HtmlService.createHtmlOutput(html).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
function doGet() {
  return ContentService.createTextOutput(JSON.stringify({service:"pulso30-crm",ok:true}))
    .setMimeType(ContentService.MimeType.JSON);
}
function doPost(e) {
  const data=(e && e.parameter)||{},nonce=safe_(data.nonce,128);
  const mutex=LockService.getScriptLock();
  if(!mutex.tryLock(8000)) return view_(false,nonce,"No disponible. Reintenta.");
  try{
    const honeypot=safe_(data.website,300);
    if(honeypot) return view_(true,nonce,"Solicitud recibida.");
    if(safe_(data.consentimiento,5)!=="Si") return view_(false,nonce,"Se requiere consentimiento.");
    if(safe_(data.version_aviso,100)!==CFG.VERSION) return view_(false,nonce,"Versión de consentimiento inválida.");
    const name=safe_(data["Nombre"],90), email=safe_(data["Correo"],150).toLowerCase(),
      empresa=safe_(data["Empresa"],100),meta=safe_(data["Objetivo a 90 días"],600);
    if(name.length<2 || empresa.length<2 || meta.length<8 ||
       !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return view_(false,nonce,"Datos obligatorios inválidos.");
    const sheet=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CFG.SHEET);
    if(!sheet)return view_(false,nonce,"No existe la hoja Prospectos.");
    if(sheet.getLastRow()>=CFG.MAX_ROWS)return view_(false,nonce,"Límite operativo alcanzado.");
    const props=PropertiesService.getScriptProperties();
    const date=Utilities.formatDate(new Date(),"America/Bogota","yyyy-MM-dd");
    const idKey=Utilities.base64EncodeWebSafe(Utilities.computeDigest(
       Utilities.DigestAlgorithm.SHA_256,email+"|"+date)).slice(0,28);
    const key="rate_"+idKey,used=Number(props.getProperty(key)||0);
    if(used>=CFG.MAX_PER_EMAIL_DAY)return view_(false,nonce,"Demasiadas solicitudes.");
    const uuid=Utilities.getUuid();
    const arr=[
      new Date(),uuid,
      safe_(data["Nombre"],90),email,
      safe_(data["WhatsApp"],30),safe_(data["Rol"],90),empresa,
      safe_(data["Sector"],90),safe_(data["Antigüedad"],50),
      safe_(data["Equipo"],30),safe_(data["Rango de ventas"],100),
      safe_(data["Reto principal"],180),meta,
      safe_(data["Disponibilidad de datos"],120),safe_(data["Notas adicionales"],450),
      "Web / Diagnóstico","Nuevo","Media","","","","",
      "Sí",CFG.VERSION
    ];
    sheet.appendRow(arr);
    props.setProperty(key,String(used+1));
    try{
      MailApp.sendEmail({
        to:CFG.EMAIL,
        subject:"PULSO 30 — Nuevo diagnóstico: "+empresa.replace(/[\r\n]/g," "),
        body:"Se registró un prospecto en tu CRM privado.\n"+
        "Empresa: "+empresa+"\nNombre: "+name+"\nCorreo: "+email+
        "\nLead ID: "+uuid+"\n\nAbre la pestaña Prospectos y agenda el seguimiento."
      });
    } catch(notifyError){console.error("Guardado correcto, falló notificación:",notifyError);}
    return view_(true,nonce,"Tu solicitud se ha registrado.");
  }catch(error){
    console.error("PULSO 30 CRM error:",error);
    return view_(false,nonce,"Error de servidor. Intenta de nuevo.");
  }finally{mutex.releaseLock();}
}
