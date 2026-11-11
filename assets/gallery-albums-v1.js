/* SHANTIK V6 • Gallery-only interactive memory albums. No deployment or global site changes. */
(function(){
 'use strict';
 const gallery=document.getElementById('gallery');
 const dialog=document.getElementById('memoryDialog');
 const originals=gallery&&gallery.querySelectorAll('#memoryOriginals .photo-card');
 if(!gallery||!dialog||!originals||originals.length!==51)return;
 const albumIndexes={birthday:[0,1,2,3,4,5,6],batu:[7,8,9,10],cilegon:[11,12,13,14,15,16],double:[17,18,19,20,21,22,23],wallpaper:[24,25,26,27,28,29,30],sunflower:[31,32,33,34,35,36,37],skincare:[38,39,40,41,42,43],coffee:[44,45,46],birthdayfriend:[47,48,49,50]};
 const albumNames={birthday:'Di Hari Kamuu Dilahirkan',batu:'Tentang Jalan dan Tujuan',cilegon:'Di Setiap Jarak, Ada Kita',double:'Kalau Waktu Bisa Berhenti',wallpaper:'Suatu Hari, Tentang Rumah Kita',sunflower:'Di Antara Bunga, Ada Kamuu',skincare:'Perawatan Kecil, Sayang yang Besar',coffee:'Di Bawah Lampu, Ada Kita',birthdayfriend:'Di Tengah Ramai, Tetap Ada Kita'};
 const posters={
  'pasang-wallpaper-kamar-shasa.mp4':'assets/gallery-previews/pasang-wallpaper-kamar-shasa.jpg',
  'ulang-tahun-shasa-2026-baking-lab.mp4':'assets/gallery-previews/ulang-tahun-shasa-2026-baking-lab.jpg',
  'album6-kebun-bunga-matahari.mp4':'assets/gallery-previews/album6-kebun-bunga-matahari.jpg',
  'album7-skincare.mp4':'assets/gallery-previews/album7-skincare.jpg'
 };
 const albumList=gallery.querySelector('#memoryAlbums');
 const modalMedia=gallery.querySelector('#memoryMedia');
 const modalTitle=gallery.querySelector('#memoryDialogTitle');
 const itemTitle=gallery.querySelector('#memoryItemTitle');
 const itemDate=gallery.querySelector('#memoryItemDate');
 const itemStory=gallery.querySelector('#memoryItemStory');
 const pageNumber=gallery.querySelector('#memoryPageNumber');
 const pageDots=gallery.querySelector('#memoryPageDots');
 const mobileDots=gallery.querySelector('#memoryDots');
 // Standard B: scale the polaroid frame to each image's actual aspect ratio.
 // The original photo stays 100% visible (contain); only the frame dimensions change.
 let mediaLayoutVersion=0;
 function adaptViewer(){
   const el=modalMedia.firstElementChild;
   if(!el)return;
   const photoWidth=(el.tagName==='VIDEO'?el.videoWidth:el.naturalWidth)||0;
   const photoHeight=(el.tagName==='VIDEO'?el.videoHeight:el.naturalHeight)||0;
   const ratio=photoWidth>0&&photoHeight>0?photoWidth/photoHeight:1;
   const framePad=window.innerWidth<=680?16:30;
   const stage=gallery.querySelector('.memory-dialog-stage');
   const maxWidth=Math.max(160,stage.clientWidth-framePad);
   const maxHeight=window.innerWidth<=680?Math.min(window.innerHeight*.59,540):Math.min(window.innerHeight*.70,640);
   const borderWidth=window.innerWidth<=680?10:16;
   const borderHeight=window.innerWidth<=680?16:24;
   const imgW=Math.min(maxWidth-borderWidth,(maxHeight-borderHeight)*ratio);
   const imgH=Math.min(maxHeight-borderHeight,(maxWidth-borderWidth)/ratio);
   modalMedia.style.width=Math.max(140,imgW+borderWidth)+'px';
   modalMedia.style.height=Math.max(140,imgH+borderHeight)+'px';
   modalMedia.dataset.orientation=ratio<.82?'portrait':ratio>1.2?'landscape':'square';
 }
 window.addEventListener('resize',()=>{if(dialog.open)adaptViewer();},{passive:true});
 const close=gallery.querySelector('#memoryClose');
 const prev=gallery.querySelector('#memoryPrev');
 const next=gallery.querySelector('#memoryNext');
 let activeAlbum='birthday',activeIndex=0,lastTrigger=null;
 // Album 1 only: a 24-frame (6x4) birthday spritesheet, played when its book opens.
 const birthdayPanel=gallery.querySelector('#birthdayAnimationPanel');
 const birthdaySprite=gallery.querySelector('#birthdayAnimationSprite');
 const birthdayReplay=gallery.querySelector('#birthdayReplay');
 const birthdayTrigger=gallery.querySelector('[data-birthday-open]');
 const birthdayReduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 // Album 2: independent 24-frame chibi animation, preserving Album 1 unchanged.
 const batuPanel=gallery.querySelector('#batuAnimationPanel');
 const batuSprite=gallery.querySelector('#batuAnimationSprite');
 const batuReplay=gallery.querySelector('#batuReplay');
 const batuTrigger=gallery.querySelector('[data-batu-open]');
 let batuRun=null;
 function batuSetFrame(frame){
  if(!batuSprite)return;
  batuSprite.style.backgroundPosition=(frame%6*20)+'% '+(Math.floor(frame/6)*100/3)+'%';
  batuSprite.dataset.frame=String(frame+1);
 }
 function batuStop(reset=true){
  if(batuRun!==null){cancelAnimationFrame(batuRun);batuRun=null;}
  if(reset)batuSetFrame(0);
 }
 function batuPlay(){
  batuStop();
  if(!batuPanel||batuPanel.hidden||!dialog.open)return;
  if(birthdayReduced.matches){batuSetFrame(0);return;}
  const interval=100, started=performance.now();
  function tick(now){
   if(!dialog.open||batuPanel.hidden||document.hidden){batuRun=null;return;}
   const frame=Math.min(23,Math.floor((now-started)/interval));
   batuSetFrame(frame);
   if(frame<23)batuRun=requestAnimationFrame(tick);
   else batuRun=null;
  }
  batuRun=requestAnimationFrame(tick);
 }
 if(batuReplay)batuReplay.addEventListener('click',function(e){const c=getEventCoord(e,batuReplay);triggerHeartBurst(c.x,c.y,8);batuPlay();});
 if(batuTrigger)batuTrigger.addEventListener('click',()=>openAlbum('batu',batuTrigger));

 // Album 3: original Cilegon chibi spritesheet (6x4); shown only inside open album.
 const cilegonPanel=gallery.querySelector('#cilegonAnimationPanel');
 const cilegonSprite=gallery.querySelector('#cilegonAnimationSprite');
 const cilegonReplay=gallery.querySelector('#cilegonReplay');
 let cilegonRun=null;
 function cilegonSetFrame(frame){
  if(!cilegonSprite)return;
  cilegonSprite.style.backgroundPosition=((frame%6)*20)+'% '+(Math.floor(frame/6)*100/3)+'%';
  cilegonSprite.dataset.frame=String(frame+1);
 }
 function cilegonStop(reset=true){
  if(cilegonRun!==null){cancelAnimationFrame(cilegonRun);cilegonRun=null;}
  if(reset)cilegonSetFrame(0);
 }
 function cilegonPlay(){
  cilegonStop();
  if(!cilegonPanel||cilegonPanel.hidden||!dialog.open)return;
  if(birthdayReduced.matches){cilegonSetFrame(0);return;}
  const interval=100,started=performance.now();
  function tick(now){
   if(!dialog.open||cilegonPanel.hidden||document.hidden){cilegonRun=null;return;}
   const frame=Math.min(23,Math.floor((now-started)/interval));
   cilegonSetFrame(frame);
   if(frame<23)cilegonRun=requestAnimationFrame(tick);
   else cilegonRun=null;
  }
  cilegonRun=requestAnimationFrame(tick);
 }
 if(cilegonReplay)cilegonReplay.addEventListener('click',function(e){const c=getEventCoord(e,cilegonReplay);triggerHeartBurst(c.x,c.y,8);cilegonPlay();});
 // Album 4: user's approved 24-frame gaming spritesheet. Only displayed inside album.
 const doublePanel=gallery.querySelector('#doubleAnimationPanel');
 const doubleSprite=gallery.querySelector('#doubleAnimationSprite');
 const doubleReplay=gallery.querySelector('#doubleReplay');
 let doubleRun=null;
 function doubleSetFrame(frame){
  if(!doubleSprite)return;
  doubleSprite.style.backgroundPosition=((frame%6)*20)+'% '+(Math.floor(frame/6)*100/3)+'%';
  doubleSprite.dataset.frame=String(frame+1);
 }
 function doubleStop(reset=true){
  if(doubleRun!==null){cancelAnimationFrame(doubleRun);doubleRun=null;}
  if(reset)doubleSetFrame(0);
 }
 function doublePlay(){
  doubleStop();
  if(!doublePanel||doublePanel.hidden||!dialog.open)return;
  if(birthdayReduced.matches){doubleSetFrame(0);return;}
  const interval=100,started=performance.now();
  function tick(now){
   if(!dialog.open||doublePanel.hidden||document.hidden){doubleRun=null;return;}
   const frame=Math.min(23,Math.floor((now-started)/interval));
   doubleSetFrame(frame);
   if(frame<23)doubleRun=requestAnimationFrame(tick);
   else doubleRun=null;
  }
  doubleRun=requestAnimationFrame(tick);
 }
 if(doubleReplay)doubleReplay.addEventListener('click',function(e){const c=getEventCoord(e,doubleReplay);triggerHeartBurst(c.x,c.y,8);doublePlay();});
 function isDialogOpen(){
  return Boolean(dialog && (dialog.open || dialog.hasAttribute('open')));
 }
 function playGifSafe(gifEl, gifSrc, posterSrc){
  if(!gifEl || !isDialogOpen()) return;
  if(birthdayReduced.matches){
   if(posterSrc) gifEl.src = posterSrc;
   return;
  }
  gifEl.src = gifSrc;
 }
 function replayGifSafe(gifEl, gifSrc){
  if(!gifEl || !isDialogOpen() || birthdayReduced.matches) return;
  gifEl.src = '';
  requestAnimationFrame(function(){
   gifEl.src = gifSrc;
  });
 }
 // Album 5: display the user's approved animated GIF only when this album opens.
 const wallpaperPanel=gallery.querySelector('#wallpaperAnimationPanel');
 const wallpaperGif=gallery.querySelector('#wallpaperAnimationGif');
 const wallpaperReplay=gallery.querySelector('#wallpaperReplay');
 const wallpaperGifSrc='assets/wallpaper-chibi/album5-wallpaper-24frame.gif';
 const wallpaperStillSrc='assets/wallpaper-chibi/album5-wallpaper-poster.png';
 function wallpaperStop(){if(wallpaperGif)wallpaperGif.src=wallpaperStillSrc;}
 function wallpaperPlay(){playGifSafe(wallpaperGif,wallpaperGifSrc,wallpaperStillSrc);}
 if(wallpaperReplay)wallpaperReplay.addEventListener('click',function(e){const c=getEventCoord(e,wallpaperReplay);triggerHeartBurst(c.x,c.y,8);replayGifSafe(wallpaperGif,wallpaperGifSrc);});
 // Album 6: sunflower GIF in opened album; a separate transparent cutout on cover.
 const sunflowerPanel=gallery.querySelector('#sunflowerAnimationPanel');
 const sunflowerGif=gallery.querySelector('#sunflowerAnimationGif');
 const sunflowerReplay=gallery.querySelector('#sunflowerReplay');
 const sunflowerCoverTrigger=gallery.querySelector('[data-sunflower-open]');
 const sunflowerGifSrc='assets/sunflower-chibi/album6-sunflower-24frame.gif';
 const sunflowerStillSrc='assets/sunflower-chibi/album6-sunflower-poster.png';
 function sunflowerStop(){if(sunflowerGif)sunflowerGif.src=sunflowerStillSrc;}
 function sunflowerPlay(){playGifSafe(sunflowerGif,sunflowerGifSrc,sunflowerStillSrc);}
 if(sunflowerReplay)sunflowerReplay.addEventListener('click',function(e){const c=getEventCoord(e,sunflowerReplay);triggerHeartBurst(c.x,c.y,8);replayGifSafe(sunflowerGif,sunflowerGifSrc);});
 if(sunflowerCoverTrigger)sunflowerCoverTrigger.addEventListener('click',function(e){const c=getEventCoord(e,sunflowerCoverTrigger);triggerHeartBurst(c.x,c.y,10);openAlbum('sunflower',sunflowerCoverTrigger,e);});
 // Album 7: independent transparent 8-frame cover GIF, 24-frame cozy room GIF inside.
 const skincarePanel=gallery.querySelector('#skincareAnimationPanel');
 const skincareGif=gallery.querySelector('#skincareAnimationGif');
 const skincareReplay=gallery.querySelector('#skincareReplay');
 const skincareCoverTrigger=gallery.querySelector('[data-skincare-open]');
 const skincareCoverGif=gallery.querySelector('#skincareCoverGif');
 const skincareGifSrc='assets/skincare-chibi/album7-skincare-room-24frame.gif';
 const skincarePosterSrc='assets/skincare-chibi/album7-room-poster.png';
 function skincareStop(){if(skincareGif)skincareGif.src=skincarePosterSrc;}
 function skincarePlay(){playGifSafe(skincareGif,skincareGifSrc,skincarePosterSrc);}
 if(skincareReplay)skincareReplay.addEventListener('click',function(e){const c=getEventCoord(e,skincareReplay);triggerHeartBurst(c.x,c.y,8);replayGifSafe(skincareGif,skincareGifSrc);});
 if(skincareCoverTrigger)skincareCoverTrigger.addEventListener('click',function(e){const c=getEventCoord(e,skincareCoverTrigger);triggerHeartBurst(c.x,c.y,10);openAlbum('skincare',skincareCoverTrigger,e);});
 if(skincareCoverGif&&birthdayReduced.matches)skincareCoverGif.src='assets/skincare-chibi/album7-cover-poster.png';
 // Album 8: approved café date 24-frame GIF inside opened album only.
 const coffeePanel=gallery.querySelector('#coffeeAnimationPanel');
 const coffeeGif=gallery.querySelector('#coffeeAnimationGif');
 const coffeeReplay=gallery.querySelector('#coffeeReplay');
 const coffeeGifSrc='assets/coffee-date/album8-coffee-date-24frame.gif';
 const coffeeStillSrc='assets/coffee-date/album8-coffee-date-poster.png';
 function coffeeStop(){if(coffeeGif)coffeeGif.src=coffeeStillSrc;}
 function coffeePlay(){playGifSafe(coffeeGif,coffeeGifSrc,coffeeStillSrc);}
 if(coffeeReplay)coffeeReplay.addEventListener('click',function(e){const c=getEventCoord(e,coffeeReplay);triggerHeartBurst(c.x,c.y,8);replayGifSafe(coffeeGif,coffeeGifSrc);});
 // Album 9: approved second animation, Shasa choosing Saladbread. No birthday cake.
 const album9Panel=gallery.querySelector('#album9AnimationPanel');
 const album9Gif=gallery.querySelector('#album9AnimationGif');
 const album9Replay=gallery.querySelector('#album9Replay');
 const album9GifSrc='assets/album9/album9-saladbread-24frame.gif';
 const album9PosterSrc='assets/album9/album9-saladbread-poster.webp';
 function album9Stop(){if(album9Gif)album9Gif.src=album9PosterSrc;}
 function album9Play(){playGifSafe(album9Gif,album9GifSrc,album9PosterSrc);}
 if(album9Replay)album9Replay.addEventListener('click',function(e){const c=getEventCoord(e,album9Replay);triggerHeartBurst(c.x,c.y,8);replayGifSafe(album9Gif,album9GifSrc);});





 let birthdayRun=null;
 function birthdaySetFrame(frame){
  if(!birthdaySprite)return;
  const col=frame%6,row=Math.floor(frame/6);
  birthdaySprite.style.backgroundPosition=(col*20)+'% '+(row*100/3)+'%';
  birthdaySprite.dataset.frame=String(frame+1);
 }
 function birthdayStop(reset=true){
  if(birthdayRun!==null){cancelAnimationFrame(birthdayRun);birthdayRun=null;}
  if(reset)birthdaySetFrame(0);
 }
 function birthdayPlay(){
  birthdayStop();
  if(!birthdayPanel||birthdayPanel.hidden||!dialog.open)return;
  if(birthdayReduced.matches){birthdaySetFrame(0);return;}
  // 10 fps = 2.4 seconds. Play once to avoid a jump between frames 24 and 1.
  const frameTime=100,started=performance.now();
  function step(now){
   if(!dialog.open||birthdayPanel.hidden||document.hidden){birthdayRun=null;return;}
   const frame=Math.min(23,Math.floor((now-started)/frameTime));
   birthdaySetFrame(frame);
   if(frame<23)birthdayRun=requestAnimationFrame(step);
   else birthdayRun=null;
  }
  birthdayRun=requestAnimationFrame(step);
 }
 if(birthdayReplay)birthdayReplay.addEventListener('click',function(e){const c=getEventCoord(e,birthdayReplay);triggerHeartBurst(c.x,c.y,8);birthdayPlay();});
 if(birthdayTrigger)birthdayTrigger.addEventListener('click',function(e){const c=getEventCoord(e,birthdayTrigger);triggerHeartBurst(c.x,c.y,10);openAlbum('birthday',birthdayTrigger,e);});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){birthdayStop(false);batuStop(false);cilegonStop(false);doubleStop(false);wallpaperStop();sunflowerStop();skincareStop();coffeeStop();album9Stop();}});
 function pauseMedia(){modalMedia.querySelectorAll('video').forEach(video=>{try{video.pause();}catch(e){}});}
 function render(){
  const indexes=albumIndexes[activeAlbum];
  const source=originals[indexes[activeIndex]];
  if(!source)return;
  pauseMedia();
  modalMedia.replaceChildren();
  const media=source.querySelector('.photo-frame img, .photo-frame video');
  if(media){
   const clone=media.cloneNode(true);
   clone.removeAttribute('style');
   if(clone.tagName==='IMG'){clone.loading='eager';clone.decoding='async';}
   if(clone.tagName==='VIDEO'){
    clone.controls=true;clone.playsInline=true;clone.preload='metadata';
    const src=clone.querySelector('source')?.getAttribute('src')||'';
    const name=src.split('/').pop();
    if(posters[name])clone.poster=posters[name];
   }
   modalMedia.appendChild(clone);
   const version=++mediaLayoutVersion;
   const relayout=()=>{if(version===mediaLayoutVersion)adaptViewer();};
   if(clone.tagName==='IMG'){
     if(clone.complete && clone.naturalWidth)relayout();
     else clone.addEventListener('load',relayout,{once:true});
   } else if(clone.tagName==='VIDEO'){
     clone.addEventListener('loadedmetadata',relayout,{once:true});
   }
   // Reserve a properly sized area before the photograph finishes loading.
   if(!clone.complete) {
     modalMedia.style.width='min(100%, 390px)';
     modalMedia.style.height='min(56dvh, 490px)';
   }

  }
  if(birthdayPanel)birthdayPanel.hidden=activeAlbum!=='birthday';
  if(batuPanel)batuPanel.hidden=activeAlbum!=='batu';
  if(cilegonPanel)cilegonPanel.hidden=activeAlbum!=='cilegon';
  if(doublePanel)doublePanel.hidden=activeAlbum!=='double';
  if(wallpaperPanel)wallpaperPanel.hidden=activeAlbum!=='wallpaper';
  if(sunflowerPanel)sunflowerPanel.hidden=activeAlbum!=='sunflower';
  if(skincarePanel)skincarePanel.hidden=activeAlbum!=='skincare';
  if(coffeePanel)coffeePanel.hidden=activeAlbum!=='coffee';
  if(album9Panel)album9Panel.hidden=activeAlbum!=='birthdayfriend';
  modalTitle.textContent=albumNames[activeAlbum];
  itemTitle.textContent=source.querySelector('.photo-caption')?.textContent||'';
  itemDate.textContent=source.querySelector('.photo-date')?.textContent||'';
  itemStory.textContent=source.querySelector('.photo-story')?.textContent||'';
  pageNumber.textContent=String(activeIndex+1).padStart(2,'0')+' / '+String(indexes.length).padStart(2,'0');
  pageDots.replaceChildren();
  indexes.forEach((_,i)=>{
   const dot=document.createElement('button');dot.type='button';dot.setAttribute('aria-label','Lihat kenangan '+(i+1));
   dot.setAttribute('aria-current',String(i===activeIndex));
   dot.addEventListener('click',function(e){const coord=getEventCoord(e,dot);triggerHeartBurst(coord.x,coord.y,5);activeIndex=i;render();});
   pageDots.appendChild(dot);
  });
 }

 // Romantic Scrapbook Heart-Burst Particle System
 const heartSymbols = ['♡', '♥', '💕', '💗', '✨', '🌸', '💖'];
 const heartColors = ['#c85f78', '#e27690', '#f49ab0', '#d86582', '#ea8ba4', '#f7b2c4', '#e8a5b8'];

 function triggerHeartBurst(x, y, count) {
  if (birthdayReduced && birthdayReduced.matches) return;
  const numHearts = count || 8;
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < numHearts; i++) {
   const heart = document.createElement('span');
   heart.className = 'gallery-heart-particle';
   heart.textContent = heartSymbols[Math.floor(Math.random() * heartSymbols.length)];
   heart.style.left = x + 'px';
   heart.style.top = y + 'px';
   heart.style.color = heartColors[Math.floor(Math.random() * heartColors.length)];
   heart.style.fontSize = (13 + Math.floor(Math.random() * 11)) + 'px';

   const angle = (Math.PI * 2 * i) / numHearts + (Math.random() * 0.45 - 0.22);
   const distance = 35 + Math.random() * 65;
   const burstX = Math.round(Math.cos(angle) * distance);
   const burstY = Math.round(Math.sin(angle) * distance) - 16;
   const scale = (0.85 + Math.random() * 0.45).toFixed(2);
   const rotStart = Math.floor(Math.random() * 40 - 20) + 'deg';
   const rotMid = Math.floor(Math.random() * 50 - 25) + 'deg';
   const rotEnd = Math.floor(Math.random() * 70 - 35) + 'deg';

   heart.style.setProperty('--burst-x', burstX + 'px');
   heart.style.setProperty('--burst-y', burstY + 'px');
   heart.style.setProperty('--burst-scale', scale);
   heart.style.setProperty('--burst-rot-start', rotStart);
   heart.style.setProperty('--burst-rot-mid', rotMid);
   heart.style.setProperty('--burst-rot-end', rotEnd);

   fragment.appendChild(heart);
   setTimeout(function() {
    if (heart.isConnected) heart.remove();
   }, 950);
  }
  document.body.appendChild(fragment);
 }
 window.triggerHeartBurst = triggerHeartBurst;

 function getEventCoord(event, fallbackEl) {
  let x = 0, y = 0;
  if (event && event.touches && event.touches[0]) {
   x = event.touches[0].clientX;
   y = event.touches[0].clientY;
  } else if (event && event.changedTouches && event.changedTouches[0]) {
   x = event.changedTouches[0].clientX;
   y = event.changedTouches[0].clientY;
  } else if (event && typeof event.clientX === 'number' && (event.clientX > 0 || event.clientY > 0)) {
   x = event.clientX;
   y = event.clientY;
  } else if (fallbackEl) {
   const rect = fallbackEl.getBoundingClientRect();
   x = rect.left + rect.width / 2;
   y = rect.top + rect.height / 2;
  } else {
   x = window.innerWidth / 2;
   y = window.innerHeight / 2;
  }
  return { x: Math.round(x), y: Math.round(y) };
 }

 function openAlbum(name,trigger,event){
  if(!albumIndexes[name])return;
  lastTrigger=trigger;activeAlbum=name;activeIndex=0;dialog.dataset.openAlbum=name;
  const coord=getEventCoord(event,trigger);
  triggerHeartBurst(coord.x,coord.y,10);
  render();
  dialog.classList.toggle('birthday-open',name==='birthday');
  try{
   if(typeof dialog.showModal === 'function'){
    dialog.showModal();
   } else {
    dialog.setAttribute('open','');
   }
  }catch(e){
   dialog.setAttribute('open','');
  }
  dialog.open=true;
  document.body.classList.add('memory-dialog-open');
  requestAnimationFrame(adaptViewer);
  if(swipeHintPill){swipeHintPill.classList.remove("fade-out");clearTimeout(swipeHintTimer);swipeHintTimer=setTimeout(hideSwipeHint,3800);}
  if(close)close.focus();
  if(name==='birthday')birthdayPlay();
  else birthdayStop();
  if(name==='batu')batuPlay();
  else batuStop();
  if(name==='cilegon')cilegonPlay();
  else cilegonStop();
  if(name==='double')doublePlay();
  else doubleStop();
  if(name==='wallpaper')wallpaperPlay();
  else wallpaperStop();
  if(name==='sunflower')sunflowerPlay();
  else sunflowerStop();
  if(name==='skincare')skincarePlay();
  else skincareStop();
  if(name==='coffee')coffeePlay();
  else coffeeStop();
  if(name==='birthdayfriend')album9Play();
  else album9Stop();
 }
 function closeAlbum(){
  birthdayStop();
  batuStop();
  cilegonStop();
  doubleStop();
  wallpaperStop();
  sunflowerStop();
  skincareStop();
  coffeeStop();
  album9Stop();
  pauseMedia();
  try{
   if(dialog.open && typeof dialog.close === 'function') dialog.close();
  }catch(e){}
  dialog.removeAttribute('open');
  dialog.open=false;
  document.body.classList.remove('memory-dialog-open');delete dialog.dataset.openAlbum;
  if(lastTrigger&&lastTrigger.isConnected)lastTrigger.focus({preventScroll:true});
 }
 function changePage(delta){
  const length=albumIndexes[activeAlbum].length;
  activeIndex=(activeIndex+delta+length)%length;
  render();
 }

 // Mobile Swipe & Animated Navigation System for iOS & Android
 const stage=gallery.querySelector('.memory-dialog-stage');
 const swipeShell=gallery.querySelector('.memory-dialog-shell') || stage;
 const swipeHintPill=gallery.querySelector('#memorySwipePill');
 let swipeHintTimer=null;
 let isAnimatingPage=false;

 function hideSwipeHint(){
  if(swipeHintPill && !swipeHintPill.classList.contains('fade-out')){
   swipeHintPill.classList.add('fade-out');
  }
 }

 function changePageWithAnimation(delta){
  if(isAnimatingPage || !modalMedia){
   changePage(delta);
   return;
  }
  hideSwipeHint();
  isAnimatingPage=true;
  const exitDist = delta > 0 ? -85 : 85;
  modalMedia.style.transition = 'transform 0.15s ease-out, opacity 0.15s ease-out';
  modalMedia.style.transform = 'translate3d(' + exitDist + 'px, 0, 0) scale(0.97)';
  modalMedia.style.opacity = '0.2';
  setTimeout(function(){
   changePage(delta);
   if(modalMedia){
    modalMedia.style.transition = 'none';
    modalMedia.style.transform = 'translate3d(' + (delta > 0 ? 65 : -65) + 'px, 0, 0) scale(0.97)';
    modalMedia.style.opacity = '0.2';
    requestAnimationFrame(function(){
     requestAnimationFrame(function(){
      modalMedia.style.transition = 'transform 0.25s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.25s ease';
      modalMedia.style.transform = 'translate3d(0, 0, 0) scale(1) rotate(0deg)';
      modalMedia.style.opacity = '1';
      setTimeout(function(){
       if(modalMedia) modalMedia.style.transition = '';
       isAnimatingPage = false;
      }, 260);
     });
    });
   } else {
    isAnimatingPage = false;
   }
  }, 150);
 }

 gallery.querySelectorAll('.memory-album-open[data-album]').forEach(function(button){
  button.addEventListener('click', function(e){ openAlbum(button.dataset.album, button, e); });
 });
 close.addEventListener('click', closeAlbum);
 prev.addEventListener('click', function(e){
  const coord=getEventCoord(e,prev);
  triggerHeartBurst(coord.x,coord.y,6);
  changePageWithAnimation(-1);
 });
 next.addEventListener('click', function(e){
  const coord=getEventCoord(e,next);
  triggerHeartBurst(coord.x,coord.y,6);
  changePageWithAnimation(1);
 });
 dialog.addEventListener('cancel', function(event){ event.preventDefault(); closeAlbum(); });
 dialog.addEventListener('click', function(event){
  const shell = dialog.querySelector('.memory-dialog-shell');
  if(shell && !shell.contains(event.target)) closeAlbum();
 });
 document.addEventListener('keydown', function(event){
  if(!dialog.open) return;
  if(event.key === 'ArrowRight'){ event.preventDefault(); changePageWithAnimation(1); }
  if(event.key === 'ArrowLeft'){ event.preventDefault(); changePageWithAnimation(-1); }
 });

 // Real-time Touch Dragging & Smooth Gesture Physics
 let touchStartX = 0;
 let touchStartY = 0;
 let touchStartTime = 0;
 let isDragging = false;
 let isGestureDetermined = false;
 let isHorizontalGesture = false;
 let lastSwipeDeltaX = 0;

 swipeShell.addEventListener('touchstart', function(event){
  if (isAnimatingPage || !isDialogOpen()) return;
  // Ignore touches on buttons, links, video controls
  if (event.target.closest('button, a, input, video, .birthday-animation-toolbar')) {
   isDragging = false;
   isGestureDetermined = false;
   return;
  }
  const touch = event.touches[0];
  if (!touch) return;
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
  touchStartTime = performance.now();
  isDragging = true;
  isGestureDetermined = false;
  isHorizontalGesture = false;
  lastSwipeDeltaX = 0;
 }, { passive: true });

 swipeShell.addEventListener('touchmove', function(event){
  if (!isDragging || isAnimatingPage) return;
  const touch = event.touches[0];
  if (!touch) return;
  const deltaX = touch.clientX - touchStartX;
  const deltaY = touch.clientY - touchStartY;

  if (!isGestureDetermined) {
   // If vertical movement is dominant, let native scroll happen without interference
   if (Math.abs(deltaY) > 7 && Math.abs(deltaY) >= Math.abs(deltaX)) {
    isGestureDetermined = true;
    isHorizontalGesture = false;
    isDragging = false;
    return;
   }
   // If horizontal movement is dominant, lock gesture to photo swipe
   if (Math.abs(deltaX) > 7 && Math.abs(deltaX) > Math.abs(deltaY)) {
    isGestureDetermined = true;
    isHorizontalGesture = true;
    if (modalMedia) {
     modalMedia.style.transition = 'none';
     modalMedia.style.willChange = 'transform, opacity';
    }
   }
  }

  if (isHorizontalGesture && modalMedia) {
   if (event.cancelable) event.preventDefault();
   lastSwipeDeltaX = deltaX;
   const dragResistance = 0.88;
   const moveX = deltaX * dragResistance;
   const tilt = moveX * 0.035;
   const fade = Math.max(0.65, 1 - Math.abs(moveX) / 520);
   modalMedia.style.transform = 'translate3d(' + moveX + 'px, 0, 0) rotate(' + tilt + 'deg)';
   modalMedia.style.opacity = String(fade);
  }
 }, { passive: false });

 const finishSwipe = function(event){
  if (!isDragging || !isHorizontalGesture || isAnimatingPage) {
   isDragging = false;
   return;
  }
  isDragging = false;
  isHorizontalGesture = false;
  const touch = event.changedTouches ? event.changedTouches[0] : null;
  const finalDeltaX = touch ? (touch.clientX - touchStartX) : lastSwipeDeltaX;
  const elapsed = Math.max(1, performance.now() - touchStartTime);
  const velocity = Math.abs(finalDeltaX) / elapsed;

  const isTriggered = Math.abs(finalDeltaX) > 46 || (velocity > 0.32 && Math.abs(finalDeltaX) > 22);

  if (isTriggered && modalMedia) {
   hideSwipeHint();
   const sRect = stage ? stage.getBoundingClientRect() : null;
   triggerHeartBurst(sRect ? Math.round(sRect.left + sRect.width/2) : Math.round(window.innerWidth/2), sRect ? Math.round(sRect.top + sRect.height/2) : Math.round(window.innerHeight/2), 7);
   isAnimatingPage = true;
   const direction = finalDeltaX < 0 ? 1 : -1;
   const exitDistance = direction > 0 ? -115 : 115;
   const exitTilt = direction > 0 ? -5 : 5;

   if (window.navigator && typeof window.navigator.vibrate === 'function') {
    try { window.navigator.vibrate(10); } catch(e){}
   }

   modalMedia.style.transition = 'transform 0.16s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.16s ease-out';
   modalMedia.style.transform = 'translate3d(' + exitDistance + '%, 0, 0) rotate(' + exitTilt + 'deg)';
   modalMedia.style.opacity = '0';

   setTimeout(function(){
    changePage(direction);
    if (modalMedia) {
     modalMedia.style.transition = 'none';
     modalMedia.style.transform = 'translate3d(' + (direction > 0 ? 75 : -75) + 'px, 0, 0) scale(0.96)';
     modalMedia.style.opacity = '0.2';
     requestAnimationFrame(function(){
      requestAnimationFrame(function(){
       modalMedia.style.transition = 'transform 0.26s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.26s ease';
       modalMedia.style.transform = 'translate3d(0, 0, 0) scale(1) rotate(0deg)';
       modalMedia.style.opacity = '1';
       setTimeout(function(){
        if (modalMedia) {
         modalMedia.style.willChange = 'auto';
         modalMedia.style.transition = '';
        }
        isAnimatingPage = false;
       }, 270);
      });
     });
    } else {
     isAnimatingPage = false;
    }
   }, 160);
  } else if (modalMedia) {
   modalMedia.style.transition = 'transform 0.24s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.24s ease';
   modalMedia.style.transform = 'translate3d(0, 0, 0) rotate(0deg)';
   modalMedia.style.opacity = '1';
   setTimeout(function(){
    if (modalMedia) {
     modalMedia.style.willChange = 'auto';
     modalMedia.style.transition = '';
    }
   }, 250);
  }
 };

 swipeShell.addEventListener('touchend', finishSwipe, { passive: true });
 stage.addEventListener('click', function(e){
  if(e.target.closest('button, a, video, .birthday-animation-toolbar')) return;
  const coord=getEventCoord(e, stage);
  triggerHeartBurst(coord.x, coord.y, 6);
 });

 swipeShell.addEventListener('touchcancel', finishSwipe, { passive: true });
 // Mobile: native horizontal scroll-snap and accessible progress dots.
 const covers=Array.from(albumList.querySelectorAll('.memory-album'));
 covers.forEach((card,i)=>{
  const dot=document.createElement('button');dot.type='button';
  dot.setAttribute('aria-label','Geser ke album '+albumNames[card.dataset.albumCard]);
  dot.setAttribute('aria-current',String(i===0));
  dot.addEventListener('click',()=>card.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'nearest',inline:'start'}));
  mobileDots.appendChild(dot);
 });
 let scheduled=false;
 albumList.addEventListener('scroll',()=>{
  if(scheduled)return;
  scheduled=true;
  requestAnimationFrame(()=>{
   scheduled=false;
   const x=albumList.scrollLeft;
   let best=0,dist=Infinity;
   covers.forEach((card,i)=>{const d=Math.abs(card.offsetLeft-covers[0].offsetLeft-x);if(d<dist){dist=d;best=i;}});
   mobileDots.querySelectorAll('button').forEach((dot,i)=>dot.setAttribute('aria-current',String(i===best)));
  });
 },{passive:true});
})();
