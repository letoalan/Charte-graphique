"use strict";
// Optional example.photo extension; existing 1.0.0 files remain readable.
(() => {
 const baseValidate=validate,baseRender=render;
 function readPhoto(photo){
  if(photo===undefined||photo===null)return null;
  if(typeof photo!=="object"||Array.isArray(photo)||typeof photo.dataUrl!=="string"||photo.dataUrl.length>1450000||!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(photo.dataUrl))throw Error("Photographie d’usage invalide ou trop volumineuse.");
  for(const key of ["alt","credit"])if(typeof photo[key]!=="string"||photo[key].length>500)throw Error("Description ou crédit de photographie invalide (500 caractères maximum).");
  return {dataUrl:photo.dataUrl,alt:photo.alt,credit:photo.credit};
 }
 validate=function(data){const next=baseValidate(data),photo=readPhoto(data.example.photo);if(photo)next.example.photo=photo;return next};
 const style=document.createElement("style");style.textContent=".usage-photo-img{display:block;width:100%;height:100%;object-fit:cover}.landscape.has-usage-photo>div,.landscape.has-usage-photo>span,.sample-art.has-usage-photo>span{display:none}.sample-art.has-usage-photo:after{display:none}.usage-photo-credit{font:10px/1.5 system-ui,sans-serif;margin:6px 0 10px;overflow-wrap:anywhere}.usage-photo-controls{margin-top:18px;padding-top:6px;border-top:1px solid #d7e0e5}.usage-photo-controls h4{font-size:13px;margin:10px 0}.usage-photo-controls label{display:block;font-size:11px;font-weight:650;margin-top:12px}.usage-photo-controls .btn{margin-top:10px}";document.head.append(style);
 const controls=document.createElement("div");controls.className="usage-photo-controls";
 controls.innerHTML='<h4>Photographie d’usage</h4><p class="help">PNG, JPEG ou WebP, 8 Mo maximum. Image optimisée localement en JPEG : 1 600 px maximum sur le grand côté, 1 Mo maximum après traitement. Aperçu recadré au centre. Aucun envoi au serveur.</p><label class="upload">Importer une photographie<input id="usagePhotoFile" type="file" accept="image/png,image/jpeg,image/webp"><span class="file-info" id="usagePhotoInfo">Aucune photographie</span></label><label>Description alternative<input id="usagePhotoAlt" maxlength="500" placeholder="Décrire le contenu utile de la photographie"></label><label>Crédit / droits d’utilisation<input id="usagePhotoCredit" maxlength="500" placeholder="Auteur, source, licence…"></label><button class="btn quiet" type="button" id="removeUsagePhoto">Retirer la photographie</button><p class="help">Utilisez une image dont vous détenez les droits. Le JSON contient un champ optionnel example.photo (dataUrl, alt, credit). Un ancien éditeur ou un autre outil peut ignorer ce champ. Les anciennes chartes sans photo restent importables.</p>';
 document.querySelector('[data-path="imagery.guidelines"]').closest(".fields").append(controls);
 const fileInput=$("usagePhotoFile"),altInput=$("usagePhotoAlt"),creditInput=$("usagePhotoCredit"),removeButton=$("removeUsagePhoto");
 const targets=[document.querySelector(".landscape"),document.querySelector(".sample-art")];
 const views=targets.map(target=>{const img=document.createElement("img");img.className="usage-photo-img";img.hidden=true;const credit=document.createElement("p");credit.className="usage-photo-credit";credit.hidden=true;target.append(img);target.after(credit);return {target,img,credit}});
 function updatePhoto(){
  const photo=state.example.photo||null;
  for(const {target,img,credit}of views){target.classList.toggle("has-usage-photo",Boolean(photo));img.hidden=!photo;img.style.display=photo?"block":"none";if(photo){if(img.getAttribute("src")!==photo.dataUrl)img.src=photo.dataUrl;img.alt=photo.alt;target.removeAttribute("aria-hidden")}else{img.removeAttribute("src");img.alt="";target.setAttribute("aria-hidden","true")}credit.textContent=photo?photo.credit:"";credit.hidden=!photo||!photo.credit;}
  altInput.disabled=!photo;creditInput.disabled=!photo;removeButton.disabled=!photo;
  if(document.activeElement!==altInput)altInput.value=photo?photo.alt:"";if(document.activeElement!==creditInput)creditInput.value=photo?photo.credit:"";
  $("usagePhotoInfo").textContent=photo?"Photographie intégrée au document et au JSON":"Aucune photographie";
 }
 render=function(){baseRender();updatePhoto()};
 for(const [input,key]of [[altInput,"alt"],[creditInput,"credit"]])input.addEventListener("input",()=>{if(!state.example.photo)return;state.example.photo[key]=input.value;render();save()});
 removeButton.onclick=()=>{delete state.example.photo;fileInput.value="";render();save();message("Photographie retirée. Les illustrations de démonstration sont restaurées.")};
 fileInput.onchange=async()=>{const file=fileInput.files[0];if(!file)return;if(!["image/png","image/jpeg","image/webp"].includes(file.type)||file.size>8*1048576){message("Choisissez un PNG, JPEG ou WebP de 8 Mo maximum.");fileInput.value="";return}if(pendingUploads>0){message("Attendez la fin de l’import en cours.");fileInput.value="";return}
  fileInput.disabled=true;altInput.disabled=true;creditInput.disabled=true;removeButton.disabled=true;setBusy(1);const url=URL.createObjectURL(file);
  try{const image=new Image();image.src=url;await image.decode();if(!image.naturalWidth||!image.naturalHeight||image.naturalWidth*image.naturalHeight>40000000)throw Error("Image invalide ou supérieure à 40 millions de pixels.");const factor=Math.min(1,1600/Math.max(image.naturalWidth,image.naturalHeight)),canvas=document.createElement("canvas");canvas.width=Math.max(1,Math.round(image.naturalWidth*factor));canvas.height=Math.max(1,Math.round(image.naturalHeight*factor));const ctx=canvas.getContext("2d");if(!ctx)throw Error("Traitement d’image indisponible.");ctx.fillStyle="#FFFFFF";ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);let dataUrl;for(const quality of [.85,.75,.65,.5]){dataUrl=canvas.toDataURL("image/jpeg",quality);if(dataUrl.length<=1400000)break}if(dataUrl.length>1400000)throw Error("Image encore trop volumineuse après optimisation.");const photo=readPhoto({dataUrl,alt:"",credit:""});state.example.photo=photo;render();save();if($("saveState").textContent!=="Export conseillé")message("Photographie intégrée. Complétez sa description et son crédit, puis exportez votre JSON.")}catch(e){message("Import de la photographie refusé : "+e.message)}finally{URL.revokeObjectURL(url);fileInput.value="";fileInput.disabled=false;setBusy(-1);updatePhoto()}
 };
 // Restore the optional field after the base application's initial validation.
 try{const raw=localStorage.getItem(STORAGE);if(raw){const restored=validate(JSON.parse(raw));if(restored.example.photo){state=restored;syncForm()}}}catch(e){message("Photographie du brouillon non restaurée : "+e.message)}
 render();
})();
