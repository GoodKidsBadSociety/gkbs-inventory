// GKBS INVENTORY v1.81
import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";

// Prevent iOS auto-zoom on input focus
if (typeof document !== "undefined") {
  const meta = document.querySelector("meta[name=viewport]");
  if (meta) meta.content = "width=device-width, initial-scale=1, maximum-scale=1";
}
const MAX_HISTORY = 50;
const APP_VERSION = "v3.9.4";
const ONLINE_EXCLUSIVE_PRODUCTS = [
  "CHROME LOOSE FIT T-SHIRT",
  "BURNING POLICE CAR LOOSE FIT T-SHIRT",
  "BLACKMAIL LOOSE FIT T-SHIRT",
  "CAPTCHA BASTARDS LOOSE FIT T-SHIRT",
  "SPRAYED VAN LOOSE FIT T-SHIRT",
  "13:12 LOOSE FIT T-SHIRT"
];


// ─── Font System: Archivo Expanded + Space Grotesk ──────────────
const F_HEAD = "'Archivo', sans-serif";
const F_BODY = "'Space Grotesk', sans-serif";
const F_HEAD_STYLE = { fontFamily: F_HEAD, fontStretch: "125%" };

// ─── Shopify Cache (5min TTL) ────────────────────────────────────
const _shopCache={};
function shopCacheGet(key){const e=_shopCache[key];if(!e)return null;if(Date.now()-e.ts>300000){delete _shopCache[key];return null;}return e.data;}
function shopCacheSet(key,data){_shopCache[key]={data,ts:Date.now()};}
const DEFAULT_SIZES = ["XXS","XS","S","M","L","XL","XXL","XXXL"];
const SZ=(s)=>s==="XXXL"?"3XL":s;
const DEFAULT_CATEGORIES = ["T-Shirt","Hoodie","Crewneck","Longsleeve","Shorts","Jacket","Cap","Bag","Other"];
// Categories that use color variants instead of sizes (XXS-XXXL)
const DEFAULT_VARIANT_CATS = ["Cap","Bag","Other"];
const LOW_STOCK = 3;
const PRESET_COLORS = ["#000000","#ffffff","#e5e5e5","#6b7280","#4078e0","#10b981","#e84142","#f08328","#eab308","#8b5cf6","#ec4899","#a16207","#1e3a5f","#d4a574"];
const STATUS_STYLE = {"Geplant":{bg:"#f0f0f0",color:"#666"},"In Produktion":{bg:"#fef9c3",color:"#a16207"},"Fertig":{bg:"#ddfce6",color:"#1a9a50"}};
const PRIORITY = {"Hoch":{bg:"#fef1f0",color:"#e84142",dot:"#e84142"},"Mittel":{bg:"#fef6ed",color:"#f08328",dot:"#f08328"},"Niedrig":{bg:"#f0f0f0",color:"#888",dot:"#bbb"}};
const VEREDELUNG_TYPES = ["Drucken","Sticken"];
const mkQty = () => Object.fromEntries(DEFAULT_SIZES.map(s=>[s,0]));
const mkId = () => Math.random().toString(36).slice(2,8);

// ─── Google Sheets Config ─────────────────────────────────────────
const SHEETS_URL = "https://script.google.com/macros/s/AKfycbyD2V3HWqSCi_5tlj5rkbVk1HuJoOomE6p8mWATzjCS4aDX0Vz-4uuV5XUlbTx5JKsI/exec";

async function sheetsLoad() {
  const url = SHEETS_URL;
  if (!url) return null;
  try {
    const r = await fetch(url + "?action=load", {
      redirect: "follow",
      method: "GET",
    });
    const text = await r.text();
    try { return JSON.parse(text); } catch { return null; }
  } catch { return null; }
}

async function sheetsLogActivity(user, action){
  try{
    await fetch(SHEETS_URL,{
      method:"POST",
      redirect:"follow",
      headers:{"Content-Type":"text/plain"},
      body:JSON.stringify({action:"log",user,actionText:action,ts:new Date().toISOString()})
    });
  }catch(e){}
}

async function sheetsSave(products, prods, dtfItems, bestellungen, categories, verluste, promoGifts, variantCats, bedarfQty) {
  const url = SHEETS_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ action: "save", products, prods, dtfItems, bestellungen, categories, verluste, promoGifts, variantCats, bedarfQty: bedarfQty || {} }),
    });
  } catch(e) { console.warn("Sheets sync failed:", e); }
}




// ─── Stanley/Stella Presets ───────────────────────────────────────
const STANLEY_STELLA_PRESETS = [
  // ── T-Shirts ──────────────────────────────────────────────────
  {
    id:"STTU169", category:"T-Shirt", name:"Creator 2.0", fit:"Unisex · Medium Fit · 180g",
    colors:[
      {code:"C001",name:"White",hex:"#f8f8f8",price:3.83},
      {code:"C018",name:"Off White",hex:"#f0ede4",price:3.83},
      {code:"C504",name:"Vintage White",hex:"#ede8dc",price:3.83},
      {code:"C054",name:"Natural Raw",hex:"#f0e8cc",price:3.83},
      {code:"C002",name:"Black",hex:"#111111",price:4.15},
      {code:"C253",name:"Anthracite",hex:"#4a4a4a",price:4.15},
      {code:"C727",name:"French Navy",hex:"#1a2a4a",price:4.15},
      {code:"C244",name:"Burgundy",hex:"#6e1a2a",price:4.15},
      {code:"C028",name:"Desert Dust",hex:"#c8b89a",price:4.15},
      {code:"C223",name:"Khaki",hex:"#8a7a5a",price:4.15},
      {code:"C036",name:"Glazed Green",hex:"#4a7a5a",price:4.15},
      {code:"C063",name:"Lavender",hex:"#b0a0cc",price:4.15},
      {code:"C005",name:"Cotton Pink",hex:"#f2c4c4",price:4.15},
      {code:"C150",name:"Earthy Red",hex:"#8b3a2a",price:4.15},
      {code:"C089",name:"Aloe",hex:"#8db49a",price:4.15},
      {code:"C145",name:"Aqua Blue",hex:"#5abcd8",price:4.15},
      {code:"C156",name:"Blue Grey",hex:"#6a7a8a",price:4.15},
      {code:"C728",name:"Blue Ice",hex:"#a8d4e8",price:4.15},
      {code:"C149",name:"Blue Soul",hex:"#2a5a8a",price:4.15},
      {code:"C053",name:"Bright Blue",hex:"#1a6adc",price:4.15},
      {code:"C129",name:"Bubble Pink",hex:"#f0a0b8",price:4.15},
      {code:"C151",name:"Deep Plum",hex:"#4a1a3a",price:4.15},
      {code:"C136",name:"Deep Teal",hex:"#1a4a4a",price:4.15},
      {code:"C153",name:"Faded Olive",hex:"#8a8a5a",price:4.15},
      {code:"C143",name:"Fiesta",hex:"#e84a2a",price:4.15},
      {code:"C101",name:"Fraiche Peche",hex:"#f8c0a0",price:4.15},
      {code:"C144",name:"Green Bay",hex:"#2a5a3a",price:4.15},
      {code:"C730",name:"Heritage Brown",hex:"#7a5a3a",price:4.15},
      {code:"C155",name:"Honey Paper",hex:"#f0d890",price:4.15},
      {code:"C715",name:"India Ink Grey",hex:"#3a3a4a",price:4.15},
      {code:"C112",name:"Latte",hex:"#c8a878",price:4.15},
      {code:"C355",name:"Lilac Dream",hex:"#c0a8d8",price:4.15},
      {code:"C729",name:"Mindful Blue",hex:"#3a6a9a",price:4.15},
      {code:"C138",name:"Misty Grey",hex:"#b0b0b8",price:4.15},
      {code:"C735",name:"Misty Jade",hex:"#8ac8b8",price:4.15},
      {code:"C135",name:"Mocha",hex:"#7a5040",price:4.15},
      {code:"C142",name:"Nispero",hex:"#d8a060",price:4.15},
      {code:"C048",name:"Ochre",hex:"#c8900a",price:4.15},
      {code:"C357",name:"Pool Blue",hex:"#60b8d0",price:4.15},
      {code:"C115",name:"Purple Love",hex:"#6a3a8a",price:4.15},
      {code:"C004",name:"Red",hex:"#cc2020",price:4.15},
      {code:"C116",name:"Red Brown",hex:"#7a3020",price:4.15},
      {code:"C204",name:"Spectra Yellow",hex:"#f8d000",price:4.15},
      {code:"C702",name:"Stargazer",hex:"#1a3a5a",price:4.15},
      {code:"C358",name:"Stone",hex:"#b0a898",price:4.15},
      {code:"C137",name:"Verdant Green",hex:"#3a7a3a",price:4.15},
      {code:"C356",name:"Viva Yellow",hex:"#f8c820",price:4.15},
      {code:"C088",name:"Worker Blue",hex:"#2a3a7a",price:4.15},
      {code:"C250",name:"Heather Grey",hex:"#b8b8c0",price:4.15},
      {code:"C146",name:"Cool Heather Grey",hex:"#a8b0b8",price:4.15},
      {code:"C652",name:"Dark Heather Blue",hex:"#3a4a6a",price:4.15},
      {code:"C651",name:"Dark Heather Grey",hex:"#5a5a60",price:4.15},
    ]
  },
  {
    id:"STTU788", category:"T-Shirt", name:"Freestyler", fit:"Unisex · Relaxed Fit · 240g",
    colors:[
      {code:"C054",name:"Natural Raw",hex:"#f0e8cc",price:7.88},
      {code:"C001",name:"White",hex:"#f8f8f8",price:7.88},
      {code:"C089",name:"Aloe",hex:"#8db49a",price:8.35},
      {code:"C002",name:"Black",hex:"#111111",price:8.35},
      {code:"C244",name:"Burgundy",hex:"#6e1a2a",price:8.35},
      {code:"C361",name:"Cream",hex:"#f0e8c0",price:8.35},
      {code:"C028",name:"Desert Dust",hex:"#c8b89a",price:8.35},
      {code:"C101",name:"Fraiche Peche",hex:"#f8c0a0",price:8.35},
      {code:"C727",name:"French Navy",hex:"#1a2a4a",price:8.35},
      {code:"C036",name:"Glazed Green",hex:"#4a7a5a",price:8.35},
      {code:"C730",name:"Heritage Brown",hex:"#7a5a3a",price:8.35},
      {code:"C085",name:"Kaffa Coffee",hex:"#5a3a2a",price:8.35},
      {code:"C223",name:"Khaki",hex:"#8a7a5a",price:8.35},
      {code:"C729",name:"Mindful Blue",hex:"#3a6a9a",price:8.35},
      {code:"C735",name:"Misty Jade",hex:"#8ac8b8",price:8.35},
      {code:"C135",name:"Mocha",hex:"#7a5040",price:8.35},
      {code:"C702",name:"Stargazer",hex:"#1a3a5a",price:8.35},
      {code:"C088",name:"Worker Blue",hex:"#2a3a7a",price:8.35},
      {code:"C146",name:"Cool Heather Grey",hex:"#a8b0b8",price:8.35},
      {code:"C651",name:"Dark Heather Grey",hex:"#5a5a60",price:8.35},
      {code:"C250",name:"Heather Grey",hex:"#b8b8c0",price:8.35},
      {code:"C731",name:"Heather Haze",hex:"#c0b8c8",price:8.35},
    ]
  },
  {
    id:"STTU073", category:"T-Shirt", name:"Freestyler Vintage", fit:"Unisex · Relaxed Fit · 240g",
    colors:[
      {code:"C162",name:"G. Dyed Anthracite",hex:"#6a6a6a",price:9.40},
      {code:"C140",name:"G. Dyed Black Rock",hex:"#2a2a2a",price:9.40},
      {code:"C158",name:"G. Dyed Blue Grey",hex:"#6a7a8a",price:9.40},
      {code:"C732",name:"G. Dyed Blue Stone",hex:"#7ab0c8",price:9.40},
      {code:"C109",name:"G. Dyed Khaki",hex:"#9a8a5a",price:9.40},
      {code:"C733",name:"G. Dyed Latte",hex:"#c8a878",price:9.40},
      {code:"C157",name:"G. Dyed Misty Grey",hex:"#b0b0b8",price:9.40},
      {code:"C161",name:"G. Dyed Purple Love",hex:"#7a5a9a",price:9.40},
    ]
  },
  {
    id:"STTU171", category:"T-Shirt", name:"Sparker 2.0", fit:"Unisex · Relaxed Fit · 215g",
    colors:[
      {code:"C054",name:"Natural Raw",hex:"#f0e8cc",price:5.83},
      {code:"C018",name:"Off White",hex:"#f0ede4",price:5.83},
      {code:"C001",name:"White",hex:"#f8f8f8",price:5.83},
      {code:"C089",name:"Aloe",hex:"#8db49a",price:6.62},
      {code:"C253",name:"Anthracite",hex:"#4a4a4a",price:6.62},
      {code:"C728",name:"Blue Ice",hex:"#a8d4e8",price:6.62},
      {code:"C002",name:"Black",hex:"#111111",price:6.62},
      {code:"C727",name:"French Navy",hex:"#1a2a4a",price:6.62},
      {code:"C144",name:"Green Bay",hex:"#2a5a3a",price:6.62},
      {code:"C730",name:"Heritage Brown",hex:"#7a5a3a",price:6.62},
      {code:"C223",name:"Khaki",hex:"#8a7a5a",price:6.62},
      {code:"C112",name:"Latte",hex:"#c8a878",price:6.62},
      {code:"C138",name:"Misty Grey",hex:"#b0b0b8",price:6.62},
      {code:"C135",name:"Mocha",hex:"#7a5040",price:6.62},
      {code:"C142",name:"Nispero",hex:"#d8a060",price:6.62},
      {code:"C129",name:"Bubble Pink",hex:"#f0a0b8",price:6.62},
      {code:"C143",name:"Fiesta",hex:"#e84a2a",price:6.62},
      {code:"C357",name:"Pool Blue",hex:"#60b8d0",price:6.62},
      {code:"C115",name:"Purple Love",hex:"#6a3a8a",price:6.62},
      {code:"C086",name:"Red Earth",hex:"#8b3020",price:6.62},
      {code:"C702",name:"Stargazer",hex:"#1a3a5a",price:6.62},
      {code:"C358",name:"Stone",hex:"#b0a898",price:6.62},
      {code:"C134",name:"Violet",hex:"#5a4a8a",price:6.62},
      {code:"C088",name:"Worker Blue",hex:"#2a3a7a",price:6.62},
    ]
  },
  // ── Hoodies ───────────────────────────────────────────────────
  {
    id:"STSU177", category:"Hoodie", name:"Cruiser 2.0", fit:"Unisex · Medium Fit · 350g",
    colors:[
      {code:"C054",name:"Natural Raw",hex:"#f0e8cc",price:16.75},
      {code:"C018",name:"Off White",hex:"#f0ede4",price:16.75},
      {code:"C001",name:"White",hex:"#f8f8f8",price:16.75},
      {code:"C089",name:"Aloe",hex:"#8db49a",price:16.75},
      {code:"C253",name:"Anthracite",hex:"#4a4a4a",price:16.75},
      {code:"C145",name:"Aqua Blue",hex:"#5abcd8",price:16.75},
      {code:"C002",name:"Black",hex:"#111111",price:16.75},
      {code:"C156",name:"Blue Grey",hex:"#6a7a8a",price:16.75},
      {code:"C728",name:"Blue Ice",hex:"#a8d4e8",price:16.75},
      {code:"C149",name:"Blue Soul",hex:"#2a5a8a",price:16.75},
      {code:"C053",name:"Bright Blue",hex:"#1a6adc",price:16.75},
      {code:"C129",name:"Bubble Pink",hex:"#f0a0b8",price:16.75},
      {code:"C244",name:"Burgundy",hex:"#6e1a2a",price:16.75},
      {code:"C005",name:"Cotton Pink",hex:"#f2c4c4",price:16.75},
      {code:"C151",name:"Deep Plum",hex:"#4a1a3a",price:16.75},
      {code:"C136",name:"Deep Teal",hex:"#1a4a4a",price:16.75},
      {code:"C028",name:"Desert Dust",hex:"#c8b89a",price:16.75},
      {code:"C150",name:"Earthy Red",hex:"#8b3a2a",price:16.75},
      {code:"C153",name:"Faded Olive",hex:"#8a8a5a",price:16.75},
      {code:"C143",name:"Fiesta",hex:"#e84a2a",price:16.75},
      {code:"C101",name:"Fraiche Peche",hex:"#f8c0a0",price:16.75},
      {code:"C727",name:"French Navy",hex:"#1a2a4a",price:16.75},
      {code:"C036",name:"Glazed Green",hex:"#4a7a5a",price:16.75},
      {code:"C144",name:"Green Bay",hex:"#2a5a3a",price:16.75},
      {code:"C730",name:"Heritage Brown",hex:"#7a5a3a",price:16.75},
      {code:"C155",name:"Honey Paper",hex:"#f0d890",price:16.75},
      {code:"C715",name:"India Ink Grey",hex:"#3a3a4a",price:16.75},
      {code:"C223",name:"Khaki",hex:"#8a7a5a",price:16.75},
      {code:"C112",name:"Latte",hex:"#c8a878",price:16.75},
      {code:"C063",name:"Lavender",hex:"#b0a0cc",price:16.75},
      {code:"C355",name:"Lilac Dream",hex:"#c0a8d8",price:16.75},
      {code:"C729",name:"Mindful Blue",hex:"#3a6a9a",price:16.75},
      {code:"C138",name:"Misty Grey",hex:"#b0b0b8",price:16.75},
      {code:"C735",name:"Misty Jade",hex:"#8ac8b8",price:16.75},
      {code:"C135",name:"Mocha",hex:"#7a5040",price:16.75},
      {code:"C142",name:"Nispero",hex:"#d8a060",price:16.75},
      {code:"C048",name:"Ochre",hex:"#c8900a",price:16.75},
      {code:"C357",name:"Pool Blue",hex:"#60b8d0",price:16.75},
      {code:"C115",name:"Purple Love",hex:"#6a3a8a",price:16.75},
      {code:"C004",name:"Red",hex:"#cc2020",price:16.75},
      {code:"C116",name:"Red Brown",hex:"#7a3020",price:16.75},
      {code:"C702",name:"Stargazer",hex:"#1a3a5a",price:16.75},
      {code:"C358",name:"Stone",hex:"#b0a898",price:16.75},
      {code:"C356",name:"Viva Yellow",hex:"#f8c820",price:16.75},
      {code:"C088",name:"Worker Blue",hex:"#2a3a7a",price:16.75},
      {code:"C250",name:"Heather Grey",hex:"#b8b8c0",price:16.75},
      {code:"C146",name:"Cool Heather Grey",hex:"#a8b0b8",price:16.75},
      {code:"C651",name:"Dark Heather Grey",hex:"#5a5a60",price:16.75},
      {code:"C731",name:"Heather Haze",hex:"#c0b8c8",price:16.75},
      {code:"C650",name:"Mid Heather Grey",hex:"#909098",price:16.75},
    ]
  },
  {
    id:"STSU797", category:"Hoodie", name:"Cooper Dry", fit:"Unisex · Oversized · 400g",
    colors:[
      {code:"C001",name:"White",hex:"#f8f8f8",price:24.89},
      {code:"C089",name:"Aloe",hex:"#8db49a",price:24.89},
      {code:"C002",name:"Black",hex:"#111111",price:24.89},
      {code:"C053",name:"Bright Blue",hex:"#1a6adc",price:24.89},
      {code:"C078",name:"Butter",hex:"#f8e890",price:24.89},
      {code:"C028",name:"Desert Dust",hex:"#c8b89a",price:24.89},
      {code:"C101",name:"Fraiche Peche",hex:"#f8c0a0",price:24.89},
      {code:"C727",name:"French Navy",hex:"#1a2a4a",price:24.89},
      {code:"C085",name:"Kaffa Coffee",hex:"#5a3a2a",price:24.89},
      {code:"C086",name:"Red Earth",hex:"#8b3020",price:24.89},
      {code:"C702",name:"Stargazer",hex:"#1a3a5a",price:24.89},
      {code:"C088",name:"Worker Blue",hex:"#2a3a7a",price:24.89},
      {code:"C250",name:"Heather Grey",hex:"#b8b8c0",price:24.89},
    ]
  },
  {
    id:"STSU209", category:"Hoodie", name:"Slammer 2.0", fit:"Unisex · Oversized · 350g",
    colors:[
      {code:"C054",name:"Natural Raw",hex:"#f0e8cc",price:19.85},
      {code:"C001",name:"White",hex:"#f8f8f8",price:19.85},
      {code:"C002",name:"Black",hex:"#111111",price:19.85},
      {code:"C728",name:"Blue Ice",hex:"#a8d4e8",price:19.85},
      {code:"C361",name:"Cream",hex:"#f0e8c0",price:19.85},
      {code:"C359",name:"Dusk",hex:"#8a7a9a",price:19.85},
      {code:"C727",name:"French Navy",hex:"#1a2a4a",price:19.85},
      {code:"C223",name:"Khaki",hex:"#8a7a5a",price:19.85},
      {code:"C729",name:"Mindful Blue",hex:"#3a6a9a",price:19.85},
      {code:"C138",name:"Misty Grey",hex:"#b0b0b8",price:19.85},
      {code:"C735",name:"Misty Jade",hex:"#8ac8b8",price:19.85},
      {code:"C135",name:"Mocha",hex:"#7a5040",price:19.85},
      {code:"C360",name:"Pink Joy",hex:"#f0a0b0",price:19.85},
      {code:"C358",name:"Stone",hex:"#b0a898",price:19.85},
      {code:"C134",name:"Violet",hex:"#5a4a8a",price:19.85},
      {code:"C146",name:"Cool Heather Grey",hex:"#a8b0b8",price:19.85},
      {code:"C250",name:"Heather Grey",hex:"#b8b8c0",price:19.85},
    ]
  },
  {
    id:"STSU211", category:"Hoodie", name:"Slammer 2.0 Vintage", fit:"Unisex · Oversized · 380g",
    colors:[
      {code:"C162",name:"G. Dyed Anthracite",hex:"#6a6a6a",price:23.84},
      {code:"C140",name:"G. Dyed Black Rock",hex:"#2a2a2a",price:23.84},
      {code:"C732",name:"G. Dyed Blue Stone",hex:"#7ab0c8",price:23.84},
      {code:"C733",name:"G. Dyed Latte",hex:"#c8a878",price:23.84},
      {code:"C157",name:"G. Dyed Misty Grey",hex:"#b0b0b8",price:23.84},
    ]
  },
  // ── Crewnecks ─────────────────────────────────────────────────
  {
    id:"STSU208", category:"Crewneck", name:"Radder 2.0", fit:"Unisex · Oversized · 350g",
    colors:[
      {code:"C054",name:"Natural Raw",hex:"#f0e8cc",price:15.65},
      {code:"C001",name:"White",hex:"#f8f8f8",price:15.65},
      {code:"C002",name:"Black",hex:"#111111",price:15.65},
      {code:"C728",name:"Blue Ice",hex:"#a8d4e8",price:15.65},
      {code:"C361",name:"Cream",hex:"#f0e8c0",price:15.65},
      {code:"C359",name:"Dusk",hex:"#8a7a9a",price:15.65},
      {code:"C727",name:"French Navy",hex:"#1a2a4a",price:15.65},
      {code:"C223",name:"Khaki",hex:"#8a7a5a",price:15.65},
      {code:"C729",name:"Mindful Blue",hex:"#3a6a9a",price:15.65},
      {code:"C138",name:"Misty Grey",hex:"#b0b0b8",price:15.65},
      {code:"C735",name:"Misty Jade",hex:"#8ac8b8",price:15.65},
      {code:"C135",name:"Mocha",hex:"#7a5040",price:15.65},
      {code:"C360",name:"Pink Joy",hex:"#f0a0b0",price:15.65},
      {code:"C358",name:"Stone",hex:"#b0a898",price:15.65},
      {code:"C134",name:"Violet",hex:"#5a4a8a",price:15.65},
      {code:"C146",name:"Cool Heather Grey",hex:"#a8b0b8",price:15.65},
      {code:"C250",name:"Heather Grey",hex:"#b8b8c0",price:15.65},
    ]
  },
  {
    id:"STSU210", category:"Crewneck", name:"Radder 2.0 Vintage", fit:"Unisex · Oversized · 380g",
    colors:[
      {code:"C162",name:"G. Dyed Anthracite",hex:"#6a6a6a",price:18.48},
      {code:"C140",name:"G. Dyed Black Rock",hex:"#2a2a2a",price:18.48},
      {code:"C732",name:"G. Dyed Blue Stone",hex:"#7ab0c8",price:18.48},
      {code:"C733",name:"G. Dyed Latte",hex:"#c8a878",price:18.48},
      {code:"C157",name:"G. Dyed Misty Grey",hex:"#b0b0b8",price:18.48},
    ]
  },
  {
    id:"STSU798", category:"Crewneck", name:"Ledger Dry", fit:"Unisex · Oversized · 400g",
    colors:[
      {code:"C001",name:"White",hex:"#f8f8f8",price:19.48},
      {code:"C089",name:"Aloe",hex:"#8db49a",price:19.48},
      {code:"C002",name:"Black",hex:"#111111",price:19.48},
      {code:"C028",name:"Desert Dust",hex:"#c8b89a",price:19.48},
      {code:"C727",name:"French Navy",hex:"#1a2a4a",price:19.48},
      {code:"C085",name:"Kaffa Coffee",hex:"#5a3a2a",price:19.48},
      {code:"C086",name:"Red Earth",hex:"#8b3020",price:19.48},
      {code:"C702",name:"Stargazer",hex:"#1a3a5a",price:19.48},
      {code:"C088",name:"Worker Blue",hex:"#2a3a7a",price:19.48},
      {code:"C250",name:"Heather Grey",hex:"#b8b8c0",price:19.48},
    ]
  },
  {
    id:"STSU795", category:"Crewneck", name:"Miller Dry", fit:"Unisex · Oversized · 400g",
    colors:[
      {code:"C089",name:"Aloe",hex:"#8db49a",price:21.63},
      {code:"C002",name:"Black",hex:"#111111",price:21.63},
      {code:"C028",name:"Desert Dust",hex:"#c8b89a",price:21.63},
      {code:"C727",name:"French Navy",hex:"#1a2a4a",price:21.63},
      {code:"C086",name:"Red Earth",hex:"#8b3020",price:21.63},
      {code:"C250",name:"Heather Grey",hex:"#b8b8c0",price:21.63},
    ]
  },
  // ── Bags ───────────────────────────────────────────────────────
  {
    id:"STAU760", category:"Bag", name:"Tote Bag", fit:"Unisex · One Size · 300g",
    colors:[
      {code:"C007",name:"Natural",hex:"#f0e8cc",price:2.94},
      {code:"C001",name:"White",hex:"#f8f8f8",price:2.94},
      {code:"C002",name:"Black",hex:"#111111",price:2.94},
      {code:"C591",name:"Midnight Blue",hex:"#1a1a4a",price:2.94},
      {code:"C250",name:"Heather Grey",hex:"#b8b8c0",price:2.94},
    ]
  },
  {
    id:"STAU117", category:"Bag", name:"Shopping Bag 2.0", fit:"Unisex · One Size · 400g",
    colors:[
      {code:"C054",name:"Natural Raw",hex:"#f0e8cc",price:4.62},
      {code:"C145",name:"Aqua Blue",hex:"#5abcd8",price:4.62},
      {code:"C002",name:"Black",hex:"#111111",price:4.62},
      {code:"C244",name:"Burgundy",hex:"#6e1a2a",price:4.62},
      {code:"C136",name:"Deep Teal",hex:"#1a4a4a",price:4.62},
      {code:"C359",name:"Dusk",hex:"#8a7a9a",price:4.62},
      {code:"C727",name:"French Navy",hex:"#1a2a4a",price:4.62},
      {code:"C144",name:"Green Bay",hex:"#2a5a3a",price:4.62},
      {code:"C112",name:"Latte",hex:"#c8a878",price:4.62},
      {code:"C088",name:"Worker Blue",hex:"#2a3a7a",price:4.62},
    ]
  },
  // ─── Beechfield Caps ─────────────────────────────────────────────
  {
    id:"BC653", category:"Cap", name:"Dad Cap", fit:"One Size · 80g · 100% Chino cotton",
    productId:"", // Beechfield - no ST code, skip CSV
    colors:[
      {code:"",name:"Beige",hex:"#e8dcc8",price:2.91},
      {code:"",name:"Black",hex:"#111111",price:2.91},
      {code:"",name:"Bottle Green",hex:"#1a4a2a",price:2.91},
      {code:"",name:"Classic Red",hex:"#cc2222",price:2.91},
      {code:"",name:"Desert Sand",hex:"#c8a878",price:2.91},
      {code:"",name:"Lavender",hex:"#b8a0cc",price:2.91},
      {code:"",name:"Navy",hex:"#1a2a4a",price:2.91},
      {code:"",name:"Olive Green",hex:"#5a6a2a",price:2.91},
      {code:"",name:"Pastel Blue",hex:"#aaccee",price:2.91},
      {code:"",name:"Pastel Lemon",hex:"#eeeea0",price:2.91},
      {code:"",name:"Pastel Mint",hex:"#a0e8c0",price:2.91},
      {code:"",name:"Pastel Pink",hex:"#f0c0cc",price:2.91},
      {code:"",name:"Peach",hex:"#f0a888",price:2.91},
      {code:"",name:"True Pink",hex:"#e8589a",price:2.91},
      {code:"",name:"White",hex:"#f8f8f8",price:2.91},
    ]
  },
  {
    id:"BC655", category:"Cap", name:"Vintage Dad Cap", fit:"One Size · 93g · 100% Brushed washed cotton",
    productId:"", // Beechfield - no ST code, skip CSV
    colors:[
      {code:"",name:"Vintage Black",hex:"#2a2a2a",price:3.40},
      {code:"",name:"Vintage Bottle Green",hex:"#2a5a3a",price:3.40},
      {code:"",name:"Vintage Brown",hex:"#5a3a1a",price:3.40},
      {code:"",name:"Vintage Cornflower",hex:"#6a8acc",price:3.40},
      {code:"",name:"Vintage Denim",hex:"#5a7a9a",price:3.40},
      {code:"",name:"Vintage Dusky Pink",hex:"#e0a0a8",price:3.40},
      {code:"",name:"Vintage Grey",hex:"#8a8a8a",price:3.40},
      {code:"",name:"Vintage Jungle Camo",hex:"#4a5a3a",price:3.40},
      {code:"",name:"Vintage Light Blue",hex:"#aac8e0",price:3.40},
      {code:"",name:"Vintage Light Denim",hex:"#8aaac0",price:3.40},
      {code:"",name:"Vintage Mustard",hex:"#c8a020",price:3.40},
      {code:"",name:"Vintage Olive",hex:"#6a7a3a",price:3.40},
      {code:"",name:"Vintage Orange",hex:"#e07030",price:3.40},
      {code:"",name:"Vintage Peach",hex:"#e8a888",price:3.40},
      {code:"",name:"Vintage Red",hex:"#aa3030",price:3.40},
      {code:"",name:"Vintage Sage Green",hex:"#8aaa8a",price:3.40},
      {code:"",name:"Vintage Sand",hex:"#d8c8a0",price:3.40},
      {code:"",name:"Vintage Stone",hex:"#a09880",price:3.40},
      {code:"",name:"Vintage True Pink",hex:"#e06090",price:3.40},
    ]
  },
];

// ─── Stanley/Stella CSV Export ────────────────────────────────────
function exportStanleyStellaCsv(bedarfMap, isCapMap, products, projectName, csvSelected) {
  const rows = [];
  rows.push("ProductId,Quantity,UnitOfMeasureId,VariantId,Project");

  const sizeMap = { XXS:"XXS", XS:"XS", S:"1S", M:"1M", L:"1L", XL:"1X", XXL:"2X", XXXL:"3X" };

  Object.entries(bedarfMap).forEach(([blankId, sizeNeeds]) => {
    const blank = products.find(p => p.id === blankId);
    if(!blank || !blank.stProductId) return;
    const isCap = isCapMap[blankId];

    Object.entries(sizeNeeds).forEach(([key, needed]) => {
      if(!needed || needed <= 0) return;
      if(csvSelected && Object.keys(csvSelected).length>0 && !csvSelected[blankId+"__"+key]) return;
      // Calculate avail and toOrder
      const isCapKey = key.startsWith("cap_");
      const capColor = isCapKey ? (blank.capColors||[]).find(cc=>"cap_"+cc.id+"_"+cc.name===key) : null;
      const avail = isCapKey ? (capColor?.stock||0) : ((blank.stock||{})[key]||0);
      const minStockVal = isCapKey ? 0 : ((blank.minStock||{})[key]||0);
      const toOrder = Math.max(0, needed + minStockVal - avail);
      if(toOrder <= 0) return;

      let variantId = "";
      if(isCapKey) {
        // For caps: stColorCode is per-cap-color or use blank stColorCode
        const colorCode = capColor?.stColorCode || blank.stColorCode || "";
        variantId = colorCode;
      } else {
        const stSize = sizeMap[key] || key;
        variantId = (blank.stColorCode || "") + stSize;
      }

      rows.push(`${blank.stProductId},${toOrder},PCS,${variantId},${projectName}`);
    });
  });

  const csv = rows.join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${projectName.replace(/[/:]/g,"")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}


// ─── Shared style constants ───────────────────────────────────────
const S = {
  col4:  {display:"flex",flexDirection:"column",gap:4},
  col5:  {display:"flex",flexDirection:"column",gap:5},
  col6:  {display:"flex",flexDirection:"column",gap:6},
  col8:  {display:"flex",flexDirection:"column",gap:8},
  col10: {display:"flex",flexDirection:"column",gap:10},
  col12: {display:"flex",flexDirection:"column",gap:12},
  col14: {display:"flex",flexDirection:"column",gap:14},
  row4:  {display:"flex",alignItems:"center",gap:4},
  row6:  {display:"flex",alignItems:"center",gap:6},
  row8:  {display:"flex",alignItems:"center",gap:8},
  row10: {display:"flex",alignItems:"center",gap:10},
  row12: {display:"flex",alignItems:"center",gap:12},
  sizeTag: {fontSize:13,fontWeight:800,color:"#444",width:36},
  secLabel: {fontSize:11,color:"#bbb",marginBottom:8,fontWeight:700,letterSpacing:0.8},
  printH: {fontSize:22,fontWeight:900,marginBottom:2,letterSpacing:-0.5},
  printSub: {fontSize:11,color:"#888",marginBottom:16},
  cardHdr: {display:"flex",alignItems:"center",gap:10,marginBottom:12},
  pill: (ok)=>({background:ok?"#ddfce6":"#fef1f0",borderRadius:8,padding:"4px 10px",textAlign:"center",minWidth:52}),
  pillNum: (ok)=>({...F_HEAD_STYLE,fontSize:18,fontWeight:900,color:ok?"#1a9a50":"#e84142",lineHeight:1}),
  pillLbl: (ok)=>({fontSize:9,color:ok?"#1a9a50":"#e84142",fontWeight:700}),
};

// ─── Style tokens ─────────────────────────────────────────────────
const R="#e84142",OR="#f08328",GR="#1a9a50",GY="#bbb";
const sCol=(v,lo=LOW_STOCK)=>v===0?R:v<=lo?OR:"#111";
const capBg=(c,a)=>c?"#f0fdf4":a?"#fef1f0":"#f8f8f8";
const capBd=(c,a)=>`1px solid ${c?"#bbf7d0":a?"#fcc8c6":"transparent"}`;
const btn=(w,red=false,dis=false)=>({width:w,height:w,borderRadius:7,border:"none",
  background:red?(dis?"#f0f0f0":"#fef1f0"):(dis?"#f0f0f0":"#ddfce6"),
  color:red?(dis?"#ccc":R):(dis?"#ccc":GR),
  fontSize:w>30?22:w>25?18:14,cursor:dis?"not-allowed":"pointer",
  display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800});
const iconBtn=(red=false)=>({width:38,height:38,borderRadius:10,border:"none",background:red?"#fef1f0":"#f0f0f0",
  color:red?R:"#111",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0,fontSize:16,fontWeight:800});
const PENCIL=()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const CHECK=()=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;

// ─── Plump Fill Icons (stroke 2.2 + light fill) ─────────────────
const IC_PROD=({size=16,color="currentColor"})=><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/></svg>;
const IC_BOX=({size=16,color="currentColor"})=><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>;
const IC_CART=({size=16,color="currentColor"})=><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1" fill={color}/><circle cx="19" cy="21" r="1" fill={color}/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>;
const IC_CHART=({size=16,color="currentColor"})=><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 18v-1"/><path d="M14 18v-3"/><path d="M10 13V9"/><path d="M14 13v-1"/></svg>;
const IC_DOLLAR=({size=16,color="currentColor"})=><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
const IC_SHOP=({size=16,color="currentColor"})=><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>;
const IC_PRINT=({size=16,color="currentColor"})=><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>;
const IC_STITCH=({size=16,color="currentColor"})=><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 8.5-8.5"/><circle cx="14.5" cy="9.5" r="1"/><path d="m14.5 9.5 5-5"/><path d="m18 3 3 3"/><path d="M3 16c4-1 6-3.5 8-6"/></svg>;
const IC_CHECK_CIRCLE=({size=16,color="#22c55e"})=><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>;
const IC_WARN=({size=16,color="#e84142"})=><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>;
const IC_LOSS=({size=16,color="currentColor"})=><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>;
const IC_CLOCK=({size=16,color="currentColor"})=><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IC_LINK=({size=14,color="currentColor"})=><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>;
const IC_RULER=({size=14,color="currentColor"})=><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z"/><path d="m14.5 12.5 2-2"/><path d="m11.5 9.5 2-2"/><path d="m8.5 6.5 2-2"/><path d="m17.5 15.5 2-2"/></svg>;
const IC_GIFT=({size=16,color="currentColor"})=><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/></svg>;
const IC_CLOUD=({size=16,color="currentColor"})=><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>;
const IC_FOLDER=({size=16,color="currentColor"})=><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>;
const IC_SEARCH=({size=16,color="currentColor"})=><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
const IC_REFRESH=({size=16,color="currentColor"})=><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>;
const IC_TRASH=({size=16,color="currentColor"})=><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>;
const IC_TSHIRT=({size=16,color="currentColor"})=><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.38 3.46 16 2 12 5.5 8 2l-4.38 1.46a2 2 0 0 0-1.34 1.88v14.8a1 1 0 0 0 1.17.98L8 20l4-3 4 3 4.45 1.12a1 1 0 0 0 1.17-.98V5.34a2 2 0 0 0-1.24-1.88Z"/></svg>;
const IC_THREAD=({size=16,color="currentColor"})=><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4.8Z"/><path d="M4 22V12c0-2 1-4 4-4h3"/><path d="M15 6c0 3 2 4 4 4s4-1 4-4-2-4-4-4-4 1-4 4Z"/><path d="M11 8c-3 0-4 2-4 4v4c0 2 1 4 4 4"/></svg>;
const IC_DOWN=({size=14,color="currentColor"})=><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>;
const IC_LAYOUT=({size=16,color="currentColor"})=><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>;
const IC_SETTINGS=({size=16,color="currentColor"})=><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>;
const IC_PAINT=({size=16,color="currentColor"})=><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 11-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2c.8.8 2 .8 2.8 0L19 11Z"/><path d="m5 2 5 5"/><path d="M2 13h15"/><path d="M22 20a2 2 0 1 1-4 0c0-1.6 2-3 2-3s2 1.4 2 3"/></svg>;

// Stock badge: solid house shape with white number inside
function StockBadge({value,size=22}){
  const c=sCol(value);
  return <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",position:"relative",width:size,height:size}}>
    <svg width={size} height={size} viewBox="0 0 24 24" fill={c} stroke="none">
      <path d="M12 2L2 10V22H22V10L12 2Z"/>
    </svg>
    <span style={{position:"absolute",top:size*0.42,fontSize:size*0.44,fontWeight:900,color:"#fff",lineHeight:1,fontFamily:"'DIN Alternate','DIN Next',system-ui,sans-serif"}}>{value}</span>
  </div>;
}
const IC_CLIPBOARD=({size=16,color="currentColor"})=><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>;
const IC_HANGER=({size=16,color="currentColor"})=><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3c0 1.1.6 2.1 1.5 2.6L12 8l9.3 6.2a2 2 0 0 1-1.1 3.8H3.8a2 2 0 0 1-1.1-3.8L12 8"/></svg>;
const IC_PACKAGE=({size=16,color="currentColor"})=><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m16.5 9.4-9-5.19"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>;
const IC_GRID4=({size=16,color="currentColor"})=><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
const IC_TREND_DOWN=({size=16,color="currentColor"})=><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>;
const IC_ROLL=({size=16,color="currentColor"})=><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>;
const IC_SHIRT=({size=16,color="currentColor"})=><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2l5 4-3 2v12a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V8L4 6l5-4"/><path d="M9 2a4 4 0 0 0 6 0"/></svg>;
const SLabel=({s})=><div style={{fontSize:11,color:GY,marginBottom:8,fontWeight:700,letterSpacing:0.8}}>{s}</div>;

const DEMO_PRODUCTS = [
  {id:"1",name:"Classic Logo Tee",category:"T-Shirt",color:"Black",colorHex:"#111111",buyPrice:12.50,stock:{XXS:2,XS:5,S:3,M:18,L:10,XL:4,XXL:2,XXXL:1},minStock:{XXS:2,XS:5,S:10,M:10,L:8,XL:5,XXL:3,XXXL:2}},
  {id:"2",name:"Natur Loose Fit Tee",category:"T-Shirt",color:"Natural",colorHex:"#e8dcc8",buyPrice:14.00,stock:{XXS:0,XS:2,S:3,M:5,L:4,XL:2,XXL:0,XXXL:0},minStock:{XXS:2,XS:3,S:5,M:5,L:5,XL:3,XXL:2,XXXL:1}},
  {id:"3",name:"Heavy Cap",category:"Cap",colorHex:"#222222",buyPrice:8.00,capColors:[{id:"c1",name:"Black",hex:"#111111",stock:5},{id:"c2",name:"White",hex:"#f8f8f8",stock:3},{id:"c3",name:"Navy",hex:"#1e3a5f",stock:2}]},
];
const DEMO_PRODS = [
  {id:"p1",name:"Gemeindebau T-Shirt",blankId:"2",status:"Geplant",priority:"Hoch",notes:"SS25 Drop",veredelung:["Drucken"],designUrl:"",colorHex:"#e8dcc8",photos:[],isCapOrder:false,qty:{XXS:0,XS:0,S:5,M:5,L:3,XL:2,XXL:0,XXXL:0},done:{XXS:0,XS:0,S:0,M:0,L:0,XL:0,XXL:0,XXXL:0}},
  {id:"p2",name:"GKBS Logo Cap",blankId:"3",status:"Geplant",priority:"Mittel",notes:"",veredelung:["Sticken"],designUrl:"",colorHex:"#222222",photos:[],isCapOrder:true,capColors:[{id:"o1",name:"Black",hex:"#111111",qty:5,done:0},{id:"o2",name:"White",hex:"#f8f8f8",qty:3,done:0}]},
];


// ─── Helpers ─────────────────────────────────────────────────────
const totalStock = (p) => (p.capColors?.length>0)
  ? (p.capColors||[]).reduce((a,c)=>a+c.stock,0)
  : Object.values(p.stock||{}).reduce((a,b)=>a+b,0);
const totalProdQty = (p) => p.isCapOrder
  ? (p.capColors||[]).reduce((a,c)=>a+c.qty,0)
  : DEFAULT_SIZES.reduce((a,s)=>a+((p.qty||{})[s]||0),0);
const totalProdDone = (p) => p.isCapOrder
  ? (p.capColors||[]).reduce((a,c)=>a+c.done,0)
  : DEFAULT_SIZES.reduce((a,s)=>a+((p.done||{})[s]||0),0);
// ─── Mobile hook ──────────────────────────────────────────────────
function useIsMobile() {
  const [w,setW] = useState(typeof window!=="undefined"?window.innerWidth:800);
  useEffect(()=>{
    const h=()=>setW(window.innerWidth);
    window.addEventListener("resize",h);
    return ()=>window.removeEventListener("resize",h);
  },[]);
  return w < 900;
}

// ─── Helpers ──────────────────────────────────────────────────────
function ColorDot({hex,size=28}){
  if(!hex)return null;
  return <div style={{width:size,height:size,borderRadius:"50%",flexShrink:0,background:hex,border:"2px solid #444",boxShadow:"0 1px 3px rgba(0,0,0,0.12)"}}/>;
}
function PriorityBadge({priority}){
  const s=PRIORITY[priority]||PRIORITY["Niedrig"];
  return <span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,background:s.bg,color:s.color,borderRadius:20,padding:"3px 9px",fontWeight:800}}><span style={{width:6,height:6,borderRadius:"50%",background:s.dot,display:"inline-block"}}/>{priority}</span>;
}
function VeredBadge({type}){
  const styles={"Drucken":{bg:"#edf4fe",color:"#4078e0"},"Sticken":{bg:"#f6f0fd",color:"#9b5de5"}};
  const s=styles[type]||{bg:"#f0f0f0",color:"#666"};
  return <span style={{fontSize:11,background:s.bg,color:s.color,borderRadius:6,padding:"3px 8px",fontWeight:700,display:"inline-flex",alignItems:"center",gap:4}}>{type==="Drucken"?<IC_PRINT size={12} color={s.color}/>:<IC_STITCH size={12} color={s.color}/>}{type}</span>;
}


// ─── Lightbox ─────────────────────────────────────────────────────
function Lightbox({src,onClose,photos,startIndex}){
  const [idx,setIdx]=useState(startIndex||0);
  const touchStart=useRef(null);
  const swiped=useRef(false);
  const srcs=photos&&photos.length>0?photos:(src?[src]:[]);
  const isOpen=photos?startIndex!=null:!!src;
  useEffect(()=>{if(startIndex!=null)setIdx(startIndex);},[startIndex]);
  useEffect(()=>{
    if(!isOpen)return;
    const handler=(e)=>{
      if(e.key==="Escape")onClose();
      if(e.key==="ArrowLeft")setIdx(i=>i>0?i-1:srcs.length-1);
      if(e.key==="ArrowRight")setIdx(i=>i<srcs.length-1?i+1:0);
    };
    window.addEventListener("keydown",handler);
    return()=>window.removeEventListener("keydown",handler);
  },[isOpen,srcs.length]);
  if(!isOpen||srcs.length===0)return null;
  const prev=()=>setIdx(i=>i>0?i-1:srcs.length-1);
  const next=()=>setIdx(i=>i<srcs.length-1?i+1:0);
  const onTouchStart=(e)=>{touchStart.current=e.touches[0].clientX;swiped.current=false;};
  const onTouchEnd=(e)=>{if(touchStart.current==null)return;const diff=e.changedTouches[0].clientX-touchStart.current;touchStart.current=null;if(Math.abs(diff)>40){swiped.current=true;diff>0?prev():next();}};
  const handleClose=(e)=>{if(swiped.current){swiped.current=false;return;}onClose();};
  return(
    <div onClick={handleClose} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,padding:20,touchAction:"pan-y"}}>
      <img src={srcs[idx]} alt="" onClick={e=>e.stopPropagation()} style={{maxWidth:"90%",maxHeight:"90%",borderRadius:12,objectFit:"contain",boxShadow:"0 8px 60px rgba(0,0,0,0.5)",userSelect:"none",WebkitUserDrag:"none"}}/>
      <button onClick={(e)=>{e.stopPropagation();onClose();}} style={{position:"absolute",top:12,right:12,width:44,height:44,borderRadius:22,border:"none",background:"rgba(255,255,255,0.2)",color:"#fff",fontSize:22,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,backdropFilter:"blur(4px)",WebkitBackdropFilter:"blur(4px)"}}>✕</button>
      {srcs.length>1&&<>
        <button onClick={e=>{e.stopPropagation();prev();}} style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",width:40,height:40,borderRadius:"50%",border:"none",background:"rgba(255,255,255,0.15)",color:"#fff",fontSize:22,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
        <button onClick={e=>{e.stopPropagation();next();}} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",width:40,height:40,borderRadius:"50%",border:"none",background:"rgba(255,255,255,0.15)",color:"#fff",fontSize:22,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>›</button>
        <div style={{position:"absolute",bottom:20,display:"flex",gap:6}}>
          {srcs.map((_,i)=><div key={i} onClick={e=>{e.stopPropagation();setIdx(i);}} style={{width:8,height:8,borderRadius:"50%",background:i===idx?"#fff":"rgba(255,255,255,0.35)",cursor:"pointer"}}/>)}
        </div>
      </>}
    </div>
  );
}

// ─── Cap Color Editor ─────────────────────────────────────────────
function CapColorEditor({colors,onChange,mode,showMinStock=false}){
  const inp={background:"#fff",border:"1px solid #e0e0e0",borderRadius:8,color:"#111",padding:"8px 10px",fontSize:14,outline:"none",boxSizing:"border-box"};
  const addColor=()=>onChange([...colors,mode==="stock"?{id:mkId(),name:"Neue Farbe",hex:"#888888",stock:0,minStock:0}:{id:mkId(),name:"Neue Farbe",hex:"#888888",qty:0,done:0,minStock:0}]);
  const update=(id,f,v)=>onChange(colors.map(c=>c.id===id?{...c,[f]:v}:c));
  const remove=(id)=>onChange(colors.filter(c=>c.id!==id));
  const adj=(id,f,d)=>{const c=colors.find(x=>x.id===id);update(id,f,Math.max(0,(c?.[f]||0)+d));};
  const field=mode==="stock"?"stock":"qty";
  return(
    <div style={S.col8}>
      {colors.map(c=>(
        <div key={c.id} style={{background:"#f8f8f8",borderRadius:12,padding:"10px 12px",display:"flex",flexDirection:"column",gap:8}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <input type="color" value={c.hex} onChange={e=>update(c.id,"hex",e.target.value)} style={{width:36,height:36,borderRadius:"50%",border:"2px solid #444",cursor:"pointer",padding:2,flexShrink:0}}/>
            <input style={{...inp,flex:1,minWidth:80}} value={c.name} onChange={e=>update(c.id,"name",e.target.value)} placeholder="Name"/>
            <button type="button" onClick={()=>remove(c.id)} style={{background:"none",border:"none",color:"#ccc",cursor:"pointer",fontSize:20,padding:"0 2px",lineHeight:1,flexShrink:0}}>✕</button>
          </div>
          <div style={{display:"flex",gap:8}}>
            <div style={{flex:1}}>
              <div style={{fontSize:9,fontWeight:700,color:"#bbb",letterSpacing:0.8,marginBottom:4}}>BESTAND</div>
              <div style={{display:"flex",alignItems:"center",gap:6,background:"#fff",borderRadius:8,padding:"6px 10px",border:"1px solid #e8e8e8"}}>
                <button type="button" onClick={()=>adj(c.id,field,-1)} style={{width:28,height:28,borderRadius:6,border:"none",background:"#fef1f0",color:"#e84142",fontSize:16,cursor:"pointer",fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
                <span style={{fontSize:18,fontWeight:900,color:"#111",flex:1,textAlign:"center"}}>{c[field]||0}</span>
                <button type="button" onClick={()=>adj(c.id,field,1)} style={{width:28,height:28,borderRadius:6,border:"none",background:"#ddfce6",color:"#1a9a50",fontSize:16,cursor:"pointer",fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
              </div>
            </div>
            {showMinStock&&(
              <div style={{flex:1}}>
                <div style={{fontSize:9,fontWeight:700,color:"#bbb",letterSpacing:0.8,marginBottom:4}}>SOLLBESTAND</div>
                <div style={{display:"flex",alignItems:"center",gap:6,background:"#fff",borderRadius:8,padding:"6px 10px",border:"1px solid #e8e8e8"}}>
                  <button type="button" onClick={()=>adj(c.id,"minStock",-1)} style={{width:28,height:28,borderRadius:6,border:"none",background:"#fef6ed",color:"#f08328",fontSize:16,cursor:"pointer",fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
                  <span style={{fontSize:18,fontWeight:900,color:"#f08328",flex:1,textAlign:"center"}}>{c.minStock||0}</span>
                  <button type="button" onClick={()=>adj(c.id,"minStock",1)} style={{width:28,height:28,borderRadius:6,border:"none",background:"#fef6ed",color:"#f08328",fontSize:16,cursor:"pointer",fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
      <button type="button" onClick={addColor} style={{padding:"12px",borderRadius:10,border:"2px dashed #d0d0d0",background:"#fafafa",color:"#888",cursor:"pointer",fontWeight:700,fontSize:14,textAlign:"center"}}>+ Farbe hinzufügen</button>
    </div>
  );
}

// ─── Stock Cell – adapts to mobile ───────────────────────────────
function StockCell({size,value,minVal,onInc,onDec,onSet,mobile}){
  const isOut=value===0,isLow=!isOut&&value<=LOW_STOCK,belowMin=minVal>0&&value<minVal;
  const [editing,setEditing]=useState(false);
  const [draft,setDraft]=useState("");
  const inputRef=useRef(null);

  const startEdit=()=>{setDraft(String(value));setEditing(true);setTimeout(()=>{inputRef.current?.select();},30);};
  const commitEdit=()=>{const n=parseInt(draft);if(!isNaN(n)&&n>=0)onSet(n);setEditing(false);};
  const handleKey=(e)=>{if(e.key==="Enter")commitEdit();if(e.key==="Escape")setEditing(false);};

  if(mobile){
    return(
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:isOut?"#f0f0f0":"#f8f8f8",borderRadius:10,padding:"8px 12px",position:"relative",opacity:isOut?0.6:1}}>
        <span style={{...F_HEAD_STYLE,fontSize:22,color:isOut?"#bbb":"#555",fontWeight:800,width:56,flexShrink:0}}>{SZ(size)}</span>
        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center"}}>
          {editing?(
            <input ref={inputRef} type="number" inputMode="numeric" pattern="[0-9]*" value={draft}
              data-inlineedit="1" onChange={e=>setDraft(e.target.value)} onBlur={commitEdit} onKeyDown={handleKey}
              style={{...F_HEAD_STYLE,fontSize:28,fontWeight:900,color:isOut?"#bbb":sCol(value),lineHeight:1,textAlign:"center",border:"none",background:"transparent",outline:"none",width:"100%",minWidth:0}}/>
          ):(
            <span onDoubleClick={startEdit} style={{...F_HEAD_STYLE,fontSize:28,fontWeight:900,color:isOut?"#bbb":sCol(value),lineHeight:1,cursor:"text"}}>
              {value}
            </span>
          )}
          {minVal>0&&<span style={{fontSize:10,color:"#bbb",fontWeight:700,marginTop:1}}>SOLL: <strong style={{color:belowMin?"#e84142":"#888"}}>{minVal}</strong></span>}
        </div>
        <div style={{display:"flex",gap:6}}>
          <button onClick={onDec} style={btn(36,true)}>−</button>
          <button onClick={onInc} style={btn(36)}>+</button>
        </div>
      </div>
    );
  }
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"space-between",gap:0,background:isOut?"#f0f0f0":"#f8f8f8",borderRadius:12,padding:"8px 8px",flex:1,minWidth:0,position:"relative",height:92,opacity:isOut?0.6:1}}>
      <span style={{...F_HEAD_STYLE,fontSize:16,color:isOut?"#bbb":"#666",fontWeight:800,lineHeight:1}}>{SZ(size)}</span>
      {editing?(
        <input ref={inputRef} type="number" inputMode="numeric" pattern="[0-9]*" value={draft}
          data-inlineedit="1" onChange={e=>setDraft(e.target.value)} onBlur={commitEdit} onKeyDown={handleKey}
          style={{...F_HEAD_STYLE,fontSize:28,fontWeight:900,color:isOut?"#bbb":sCol(value),lineHeight:1,border:"none",background:"transparent",outline:"none",textAlign:"center",width:"100%"}}/>
      ):(
        <span onDoubleClick={startEdit} style={{...F_HEAD_STYLE,fontSize:28,fontWeight:900,color:isOut?"#bbb":sCol(value),lineHeight:1,cursor:"text"}}>{value}</span>
      )}
      <div style={{display:"flex",gap:4}}>
        <button onClick={onDec} style={btn(30,true)}>−</button>
        <button onClick={onInc} style={btn(30)}>+</button>
      </div>
    </div>
  );
}



// ─── BlankPicker – custom dropdown with color circles ────────────
function BlankPicker({products,value,onChange}){
  const [open,setOpen]=useState(false);
  const ref=useRef(null);
  const sel=products.find(p=>p.id===value);
  useEffect(()=>{
    if(!open)return;
    const h=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};
    document.addEventListener("mousedown",h);document.addEventListener("touchstart",h);
    return()=>{document.removeEventListener("mousedown",h);document.removeEventListener("touchstart",h);};
  },[open]);
  return(
    <div ref={ref} style={{position:"relative"}}>
      <div onClick={()=>setOpen(!open)} style={{width:"100%",padding:"10px 12px",borderRadius:10,border:"1.5px solid #e8e8e8",background:"#f8f8f8",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",gap:8,boxSizing:"border-box"}}>
        {sel?<><div style={{width:14,height:14,borderRadius:"50%",background:sel.colorHex||"#888",border:"1.5px solid #ccc",flexShrink:0}}/><span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sel.name} — {sel.color||"–"} — {sel.category}</span></>:<span style={{color:"#bbb"}}>-- Blank wählen --</span>}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,transform:open?"rotate(180deg)":"none",transition:"transform 0.15s"}}><path d="m6 9 6 6 6-6"/></svg>
      </div>
      {open&&<div style={{position:"absolute",top:"100%",left:0,right:0,background:"#fff",border:"1px solid #e8e8e8",borderRadius:10,boxShadow:"0 4px 16px rgba(0,0,0,0.1)",maxHeight:240,overflowY:"auto",zIndex:10,marginTop:2}}>
        <div onClick={()=>{onChange("");setOpen(false);}} style={{padding:"9px 12px",cursor:"pointer",fontSize:13,color:"#bbb",borderBottom:"1px solid #f0f0f0"}}>-- Blank wählen --</div>
        {products.map(p=>(
          <div key={p.id} onClick={()=>{onChange(p.id);setOpen(false);}} style={{padding:"9px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:8,background:value===p.id?"#f0f7ff":"#fff",fontSize:13}}>
            <div style={{width:14,height:14,borderRadius:"50%",background:p.colorHex||"#888",border:"1.5px solid #ccc",flexShrink:0}}/>
            <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name} — {p.color||"–"} — {p.category}</span>
          </div>
        ))}
      </div>}
    </div>
  );
}

// ─── PieDot – pie chart circle for any capColors array ──────────
function PieDot({capColors,fallbackHex="#888",size=28,valueKey="stock"}){
  const allColorsRaw=(capColors||[]);
  // For qty-based views, only show colors that have qty>0
  const allColors=valueKey==="qty"?allColorsRaw.filter(c=>(c[valueKey]||0)>0):allColorsRaw;
  if(allColors.length===0) return <ColorDot hex={fallbackHex} size={size}/>;
  if(allColors.length===1) return <ColorDot hex={allColors[0].hex} size={size}/>;
  // Use actual values if available, otherwise equal weight so all colors always show
  const total=allColors.reduce((a,c)=>a+(c[valueKey]||0),0);
  const colors=allColors;
  const getVal=(c)=>total>0?(c[valueKey]||0)||0:1; // equal slice if all zero
  const r=size/2;
  let angle=-Math.PI/2;
  const effectiveTotal=total>0?total:colors.length;
  const paths=colors.map(c=>{
    const slice=(getVal(c)/effectiveTotal)*2*Math.PI;
    const x1=r+r*Math.cos(angle),y1=r+r*Math.sin(angle);
    angle+=slice;
    const x2=r+r*Math.cos(angle),y2=r+r*Math.sin(angle);
    const large=slice>Math.PI?1:0;
    return <path key={c.id} d={`M${r},${r} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z`} fill={c.hex}/>;
  });
  // Divider lines from center to edge at each segment boundary
  let lineAngle=-Math.PI/2;
  const lines=colors.map(c=>{
    const slice=(getVal(c)/effectiveTotal)*2*Math.PI;
    const x=r+r*Math.cos(lineAngle),y=r+r*Math.sin(lineAngle);
    lineAngle+=slice;
    return <line key={c.id} x1={r} y1={r} x2={x} y2={y} stroke="white" strokeWidth="1.5"/>;
  });
  return(
    <svg width={size} height={size} style={{flexShrink:0,display:"block",overflow:"hidden",borderRadius:"50%"}}>
      {paths}
      {lines}
      <circle cx={r} cy={r} r={r-1} fill="none" stroke="#444" strokeWidth="2"/>
    </svg>
  );
}
// ─── SmartDot – auto picks between ColorDot and PieDot ───────────
function SmartDot({item,size=28}){
  const isCap=(item.capColors?.length>0)||item.isCapOrder;
  if(!isCap) return <ColorDot hex={item.colorHex} size={size}/>;
  const key=item.isCapOrder?"qty":"stock";
  return <PieDot capColors={item.capColors} fallbackHex={item.colorHex} size={size} valueKey={key}/>;
}

// ─── Prod Cell – same look as StockCell ──────────────────────────
// ─── Inline editable number for Cap stock/done ───────────────────
function CapStockNum({value, soll, color, onSet, fontSize=28}){
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const ref = useRef(null);
  const start = () => { if(!onSet) return; setDraft(String(value)); setEditing(true); setTimeout(()=>ref.current?.select(),30); };
  const commit = () => { const n=parseInt(draft); if(!isNaN(n)&&n>=0) onSet&&onSet(n); setEditing(false); };
  const display = editing
    ? <input ref={ref} type="number" inputMode="numeric" value={draft}
        onChange={e=>setDraft(e.target.value)} onBlur={commit}
        onKeyDown={e=>{if(e.key==="Enter")commit();if(e.key==="Escape")setEditing(false);}}
        style={{...F_HEAD_STYLE,width:50,fontSize,fontWeight:900,color,border:"none",borderBottom:"2px solid #3b82f6",outline:"none",background:"transparent",textAlign:"center"}}/>
    : <span onDoubleClick={start} style={{...F_HEAD_STYLE,fontSize,fontWeight:900,color,lineHeight:1,cursor:onSet?"text":"default"}} title={onSet?"Doppelklick zum Bearbeiten":""}>{value}</span>;
  return soll!==undefined
    ? <span style={{lineHeight:1}}>{display}<span style={{fontSize,color:"#333",fontWeight:900}}>/{soll}</span></span>
    : display;
}

// ─── Inline editable number for ProdCell ─────────────────────────
function ProdCellNum({value, soll, color, onSet, fontSize=28}){
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const ref = useRef(null);
  const start = () => { setDraft(String(value)); setEditing(true); setTimeout(()=>ref.current?.select(),30); };
  const commit = () => { const n=parseInt(draft); if(!isNaN(n)&&n>=0) onSet&&onSet(n); setEditing(false); };
  if(!onSet) return <span style={{...F_HEAD_STYLE,fontSize,fontWeight:900,color,lineHeight:1}}>{value}<span style={{fontSize,color:"#333",fontWeight:900}}>/{soll}</span></span>;
  return editing
    ? <><input ref={ref} type="number" inputMode="numeric" value={draft}
        onChange={e=>setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e=>{if(e.key==="Enter")commit();if(e.key==="Escape")setEditing(false);}}
        style={{...F_HEAD_STYLE,width:50,fontSize,fontWeight:900,color,border:"none",borderBottom:"2px solid #3b82f6",outline:"none",background:"transparent",textAlign:"center"}}/><span style={{fontSize,color:"#333",fontWeight:900}}>/{soll}</span></>
    : <span onDoubleClick={start} style={{...F_HEAD_STYLE,fontSize,fontWeight:900,color,lineHeight:1,cursor:"text"}} title="Doppelklick zum Bearbeiten">{value}<span style={{fontSize,color:"#333",fontWeight:900}}>/{soll}</span></span>;
}

function ProdCell({size,soll,done,avail,onInc,onDec,onSet,disabled,mobile}){
  const complete=soll>0&&done>=soll;
  const atLimit=disabled&&!complete;
  const color=complete?GR:atLimit?"#e84142":"#111";
  if(mobile){
    return(
      <div style={{display:"flex",alignItems:"center",gap:10,background:complete?"#f0fdf4":atLimit?"#fef1f0":"#f8f8f8",borderRadius:14,padding:"12px 16px",border:`1.5px solid ${complete?"#bbf7d0":atLimit?"#fcc8c6":"#f0f0f0"}`}}>
        <span style={{...F_HEAD_STYLE,fontSize:22,color:atLimit?"#e84142":"#333",fontWeight:900,width:56,flexShrink:0}}>{SZ(size)}</span>
        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"baseline"}}>
            <ProdCellNum value={done} soll={soll} color={color} onSet={onSet} fontSize={32}/>
          </div>
          <span style={{fontSize:10,color:"#bbb",fontWeight:700,marginTop:2}}>ON STOCK: <strong style={{color:avail===0?"#e84142":"#888"}}>{avail}</strong></span>
        </div>
        <div style={{display:"flex",gap:6,flexShrink:0}}>
          <button onClick={onDec} style={btn(36,true)}>−</button>
          <button onClick={onInc} disabled={disabled} style={btn(36,false,disabled)}>+</button>
        </div>
      </div>
    );
  }
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"space-between",gap:4,background:complete?"#f0fdf4":atLimit?"#fef1f0":"#f8f8f8",borderRadius:14,padding:"10px 8px 8px",flex:1,minWidth:0,position:"relative",border:`1px solid ${complete?"#bbf7d0":atLimit?"#fcc8c6":"transparent"}`}}>
      <span style={{...F_HEAD_STYLE,fontSize:16,color:"#666",fontWeight:800}}>{SZ(size)}</span>
      <div style={{textAlign:"center",lineHeight:1,margin:"4px 0"}}>
        <ProdCellNum value={done} soll={soll} color={color} onSet={onSet} fontSize={28}/>
      </div>
      <div style={{display:"flex",gap:4}}>
        <button onClick={onDec} style={btn(30,true)}>−</button>
        <button onClick={onInc} disabled={disabled} style={btn(30,false,disabled)}>+</button>
      </div>
      <span style={{fontSize:9,color:"#bbb",fontWeight:700,marginTop:2}}>ON STOCK: <strong style={{color:avail===0?"#e84142":"#888"}}>{avail}</strong></span>
      {complete&&<span style={{position:"absolute",top:3,left:5,fontSize:9,color:"#1a9a50"}}>✓</span>}
      {atLimit&&<span style={{position:"absolute",top:3,left:5,fontSize:9,color:"#e84142"}}>⚠</span>}
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────
function ProductCard({product,onUpdate,onDelete,onEdit}){
  const mobile=useIsMobile();
  const isCap=(product.capColors?.length>0);
  const total=totalStock(product);
  const vals=isCap?(product.capColors||[]).map(c=>c.stock):Object.values(product.stock||{});
  const allOut=vals.every(v=>v===0),someOut=!allOut&&vals.some(v=>v===0),hasLow=!allOut&&!someOut&&vals.some(v=>v>0&&v<=LOW_STOCK);
  const adj=(size,d)=>onUpdate({...product,stock:{...(product.stock||{}),[size]:Math.max(0,((product.stock||{})[size]||0)+d)}});
  const adjCap=(id,d)=>onUpdate({...product,capColors:(product.capColors||[]).map(c=>c.id===id?{...c,stock:Math.max(0,c.stock+d)}:c)});
  return(
    <div style={{background:"#fff",borderRadius:16,padding:mobile?16:20,border:"1px solid #ebebeb",boxShadow:"0 1px 4px rgba(0,0,0,0.06)",display:"flex",flexDirection:"column",gap:12}}>
      {/* Header */}
      <div style={S.row10}>
        {!mobile&&<div style={{cursor:"grab",color:"#ccc",fontSize:16,flexShrink:0}}>⠿</div>}
        <SmartDot item={product} size={mobile?24:28}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{...F_HEAD_STYLE,fontSize:mobile?15:17,fontWeight:800,color:"#111",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{product.name}</div>
          <div style={{display:"flex",gap:5,alignItems:"center",marginTop:2,flexWrap:"wrap"}}>
            {product.color&&<span style={{fontSize:11,color:"#bbb"}}>{product.color}</span>}
            {isCap&&<span style={{fontSize:10,background:"#f0f0f0",color:"#666",borderRadius:6,padding:"2px 7px",fontWeight:700}}>{product.category?.toUpperCase()||"VARIANT"}</span>}
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:16,flexShrink:0}}>
          <div style={{textAlign:"right"}}>
            <div style={{...F_HEAD_STYLE,fontSize:mobile?26:30,fontWeight:900,color:"#111",lineHeight:1}}>{total}</div>
            <div style={{fontSize:10,color:"#bbb",fontWeight:700}}>TOTAL</div>
          </div>
          <div style={S.col4}>
            <button onClick={onEdit} style={iconBtn()}><PENCIL/></button>
          </div>
        </div>
      </div>
      {/* Stock grid */}
      {isCap?(
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {(product.capColors||[]).map(c=>{
            const isOut=c.stock===0;
            const isLow=!isOut&&c.stock<=LOW_STOCK;
            return(
              <div key={c.id} style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"space-between",gap:0,background:isOut?"#f0f0f0":"#f8f8f8",borderRadius:12,padding:"10px 8px",flex:1,minWidth:mobile?60:70,height:110,opacity:isOut?0.6:1}}>
                <div style={{width:20,height:20,borderRadius:"50%",background:c.hex,border:"2px solid #444"}}/>
                <span style={{fontSize:10,color:isOut?"#bbb":"#555",fontWeight:800,textAlign:"center",lineHeight:1.2}}>{c.name}</span>
                <CapStockNum value={c.stock} color={isOut?"#bbb":sCol(c.stock)} fontSize={mobile?24:28} onSet={v=>onUpdate({...product,capColors:(product.capColors||[]).map(x=>x.id===c.id?{...x,stock:Math.max(0,v)}:x)})}/>
                <div style={{display:"flex",gap:4}}>
                  <button onClick={()=>adjCap(c.id,-1)} style={btn(30,true,isOut)}>−</button>
                  <button onClick={()=>adjCap(c.id,1)} style={btn(30)}>+</button>
                </div>
              </div>
            );
          })}
        </div>
      ):mobile?(
        // Mobile: vertical list instead of 8-column grid
        <div style={S.col6}>
          {DEFAULT_SIZES.map(size=><StockCell key={size} mobile size={size} value={(product.stock??{})[size]??0} minVal={(product.minStock??{})[size]??0} onInc={()=>adj(size,1)} onDec={()=>adj(size,-1)} onSet={(v)=>onUpdate({...product,stock:{...(product.stock||{}),[size]:v}})}/>)}
        </div>
      ):(
        // Desktop: horizontal grid
        <div style={{display:"flex",gap:4}}>
          {DEFAULT_SIZES.map(size=><StockCell key={size} size={size} value={(product.stock??{})[size]??0} minVal={(product.minStock??{})[size]??0} onInc={()=>adj(size,1)} onDec={()=>adj(size,-1)} onSet={(v)=>onUpdate({...product,stock:{...(product.stock||{}),[size]:v}})}/>)}
        </div>
      )}
      {/* Mobile reorder link */}

    </div>
  );
}

// ─── Production Card ──────────────────────────────────────────────
function ProductionCard({prod,blank,dtfItem,onDelete,onEdit,onUpdate,onConfirmProduce}){
  const mobile=useIsMobile();
  const [lightbox,setLightbox]=useState(null);
  const isCap=prod.isCapOrder;
  const totalQty=totalProdQty(prod);
  const totalDone=totalProdDone(prod);
  const progress=totalQty>0?Math.round(totalDone/totalQty*100):0;
  const allDone=totalDone>=totalQty&&totalQty>0;
  const activeSizes=DEFAULT_SIZES.filter(s=>((prod.qty||{})[s]||0)>0);

  const getFeasibility=()=>{
    if(!blank||totalQty===0)return "unknown";
    if(isCap){
      const oc=(prod.capColors||[]).filter(cc=>cc.qty>0);
      if(!oc.length)return "unknown";
      let ok=0,none=0;
      oc.forEach(cc=>{const bs=(blank.capColors||[]).find(bc=>bc.id===cc.id||bc.name===cc.name);(bs?.stock||0)>=cc.qty?ok++:none++;});
      if(none===oc.length)return "none";if(ok===oc.length)return "ok";return "partial";
    }
    if(!activeSizes.length)return "unknown";
    let ok=0,none=0;
    activeSizes.forEach(s=>{((blank.stock??{})[s]??0)>=(prod.qty||{})[s]?ok++:none++;});
    if(none===activeSizes.length)return "none";if(ok===activeSizes.length)return "ok";return "partial";
  };
  const feasibility=getFeasibility();
  // Calculate total blank stock available vs needed
  const blankNeeded = totalQty;
  const blankAvail = blank ? (isCap
    ? (prod.capColors||[]).filter(cc=>cc.qty>0).reduce((a,cc)=>{const bs=(blank.capColors||[]).find(bc=>bc.id===cc.id||bc.name===cc.name);return a+(bs?.stock||0);},0)
    : DEFAULT_SIZES.reduce((a,s)=>a+Math.min(((blank.stock||{})[s]||0),(prod.qty||{})[s]||0),0)
  ) : 0;
  const fOk = feasibility==="ok";
  const fUnknown = feasibility==="unknown";

  const maxDone=(size)=>{const mQ=(prod.qty||{})[size]||0;const mS=(blank?.stock||{})[size]??mQ;return Math.min(mQ,mS);};
  const adjDone=(size,d)=>onUpdate({...prod,done:{...(prod.done||{}),[size]:Math.min(maxDone(size),Math.max(0,((prod.done||{})[size]||0)+d))}});
  const adjCapDone=(id,d)=>onUpdate({...prod,capColors:(prod.capColors||[]).map(c=>{
    if(c.id!==id)return c;
    const bs=(blank?.capColors||[]).find(bc=>bc.id===c.id);
    const max=Math.min(c.qty,bs?.stock??c.qty);
    return {...c,done:Math.min(max,Math.max(0,c.done+d))};
  })});

  // Shared button styles matching ProductCard
  const btnMinus=btn(30,true);
  const btnPlus=(d)=>btn(30,false,d);

  return(
    <div style={{background:"#fff",borderRadius:16,border:"1px solid #e5e5e5",overflow:"hidden",display:"flex",flexDirection:"column"}}>

      {/* ── Header ── */}
      <div style={{padding:mobile?"16px 16px 0":"16px 20px 0"}}>
        <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
          {!mobile&&<div style={{cursor:"grab",color:"#ccc",fontSize:16,flexShrink:0,marginTop:12}}>⠿</div>}
          <SmartDot item={prod} size={mobile?44:52}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{...F_HEAD_STYLE,fontSize:mobile?18:22,fontWeight:900,color:"#111",letterSpacing:-0.3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{prod.name}</div>
            <div style={{display:"flex",alignItems:"center",gap:6,marginTop:3,flexWrap:"wrap"}}>
              {blank&&<span style={{fontSize:13,color:"#999",fontWeight:500}}>{blank.name} {blank.color}</span>}
              {!blank&&<span style={{fontSize:13,color:"#bbb"}}>Kein Blank</span>}
              {blank?.category&&<span style={{fontSize:11,background:"#f0f0f0",color:"#666",borderRadius:6,padding:"2px 8px",fontWeight:700}}>{blank.category}</span>}
            </div>
          </div>
          <div style={{display:"flex",gap:6,flexShrink:0}}>
            <button onClick={onEdit} style={{width:38,height:38,borderRadius:10,border:"none",background:"#f8f8f8",color:"#111",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><PENCIL/></button>
            <button onClick={onDelete} style={{width:38,height:38,borderRadius:10,border:"none",background:"#fef1f0",color:"#e84142",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800}}>✕</button>
          </div>
        </div>

        {/* Badges row */}
        <div style={{display:"flex",gap:6,marginTop:12,flexWrap:"wrap",alignItems:"center"}}>
          <PriorityBadge priority={prod.priority}/>
          {(prod.veredelung||[]).map(v=><VeredBadge key={v} type={v}/>)}
          {prod.shopifyProductLink&&<span style={{fontSize:11,fontWeight:700,background:"#f0fdf4",color:"#1a9a50",borderRadius:6,padding:"3px 8px",display:"inline-flex",alignItems:"center",gap:4}}><span style={{width:6,height:6,borderRadius:"50%",background:"#1a9a50"}}/>Shopify</span>}
          {!prod.shopifyProductLink&&<span style={{fontSize:11,fontWeight:700,background:"#fef1f0",color:"#e84142",borderRadius:6,padding:"3px 8px",display:"inline-flex",alignItems:"center",gap:4}}><span style={{width:6,height:6,borderRadius:"50%",background:"#e84142"}}/>Shopify</span>}
        </div>

        {/* Notes + Design link */}
        {(prod.notes||prod.designUrl)&&<div style={{marginTop:8,display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
          {prod.notes&&<div style={{fontSize:11,color:"#bbb",fontStyle:"italic"}}>{prod.notes}</div>}
          {prod.designUrl&&<a href={prod.designUrl.startsWith("http")?prod.designUrl:"https://"+prod.designUrl} target="_blank" rel="noopener noreferrer" style={{fontSize:11,color:"#4078e0",display:"inline-flex",alignItems:"center",gap:3}}><IC_LINK size={11} color="#4078e0"/> Design</a>}
        </div>}


      </div>

      {/* Photos */}
      {prod.photos?.length>0&&(
        <div style={{padding:mobile?"8px 16px":"8px 20px"}}>
          <div style={{display:"flex",gap:6,overflowX:"auto"}}>
            {prod.photos.map((src,i)=><img key={i} src={src} alt="" onClick={()=>setLightbox(i)} style={{height:60,width:60,objectFit:"cover",borderRadius:8,border:"1px solid #ebebeb",flexShrink:0,cursor:"zoom-in"}}/>)}
          </div>
          <Lightbox photos={prod.photos} startIndex={lightbox} onClose={()=>setLightbox(null)}/>
        </div>
      )}

      {/* Counter + Progress bar */}
      {totalQty>0&&(
        <div style={{padding:mobile?"8px 16px 4px":"8px 20px 4px"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{flex:1}}>
              <div style={{height:4,background:"#f0f0f0",borderRadius:4,overflow:"hidden"}}>
                <div style={{height:4,background:"#1a9a50",borderRadius:4,width:`${progress}%`,transition:"width 0.3s"}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#ccc",fontWeight:600,marginTop:4}}>
                <span>{progress}% erledigt</span><span>{totalQty-totalDone} verbleibend</span>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"baseline",gap:1,flexShrink:0}}>
              <span style={{...F_HEAD_STYLE,fontSize:mobile?30:36,fontWeight:900,color:allDone?"#1a9a50":"#111",lineHeight:1}}>{totalDone}</span>
              <span style={{...F_HEAD_STYLE,fontSize:mobile?30:36,fontWeight:900,color:"#999",lineHeight:1}}>/{totalQty}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Sizes / Cap colors ── */}
      <div style={{padding:mobile?"12px 16px 16px":"12px 20px 20px"}}>
      {isCap?(
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {(prod.capColors||[]).filter(c=>c.qty>0).map(c=>{
            const bs=(blank?.capColors||[]).find(bc=>bc.id===c.id||bc.name===c.name);
            const avail=bs?.stock??0;
            const max=Math.min(c.qty,avail);
            const atLimit=c.done>=max;
            const complete=c.qty>0&&c.done>=c.qty;
            return(
              <div key={c.id} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5,background:capBg(complete,atLimit&&!complete),borderRadius:12,padding:"10px 8px",flex:1,minWidth:mobile?60:70,border:capBd(complete,atLimit&&!complete),position:"relative"}}>
                <div style={{width:20,height:20,borderRadius:"50%",background:c.hex,border:"2px solid #444"}}/>
                <span style={{fontSize:10,color:"#555",fontWeight:800,textAlign:"center",lineHeight:1.2}}>{c.name}</span>
                <div style={{lineHeight:1,textAlign:"center"}}>
                  <CapStockNum value={c.done} soll={c.qty} color={complete?"#1a9a50":atLimit?"#e84142":"#111"} fontSize={mobile?24:28} onSet={prod.status!=="Fertig"?v=>onUpdate({...prod,capColors:(prod.capColors||[]).map(x=>x.id===c.id?{...x,done:Math.min(max,Math.max(0,v))}:x)})  :null}/>
                </div>
                <StockBadge value={avail} size={20}/>
                {prod.status!=="Fertig"&&(
                  <div style={{display:"flex",gap:4}}>
                    <button onClick={()=>adjCapDone(c.id,-1)} style={btnMinus}>−</button>
                    <button onClick={()=>adjCapDone(c.id,1)} disabled={atLimit} style={btnPlus(atLimit)}>+</button>
                  </div>
                )}
                {complete&&<span style={{position:"absolute",top:3,right:5,fontSize:9}}>✓</span>}
                {atLimit&&!complete&&<span style={{position:"absolute",top:3,right:5,fontSize:9,color:"#e84142"}}>⚠</span>}
              </div>
            );
          })}
        </div>
      ):mobile?(
        <div style={S.col6}>
          {DEFAULT_SIZES.map(size=>{
            const soll=(prod.qty||{})[size]||0,done=(prod.done||{})[size]||0,avail=(blank?.stock??{})[size]??0;
            if(soll===0&&done===0)return null;
            const lim=done>=maxDone(size);
            return <ProdCell key={size} mobile size={size} soll={soll} done={done} avail={avail}
              disabled={lim} onDec={()=>adjDone(size,-1)} onInc={()=>adjDone(size,1)} onSet={v=>onUpdate({...prod,done:{...(prod.done||{}),[size]:Math.min(maxDone(size),Math.max(0,v))}})}/>;
          })}
        </div>
      ):(
        <div style={{display:"flex",gap:4}}>
          {DEFAULT_SIZES.map(size=>{
            const soll=(prod.qty||{})[size]||0,done=(prod.done||{})[size]||0,avail=(blank?.stock??{})[size]??0;
            if(soll===0&&done===0)return(
              <div key={size} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,background:"#fafafa",borderRadius:12,padding:"8px 4px",opacity:0.3}}>
                <span style={{...F_HEAD_STYLE,fontSize:16,color:"#bbb",fontWeight:800}}>{SZ(size)}</span>
                <span style={{fontSize:32,fontWeight:900,color:"#ddd",lineHeight:1}}>—</span>
              </div>
            );
            const lim=done>=maxDone(size);
            return <ProdCell key={size} size={size} soll={soll} done={done} avail={avail}
              disabled={lim} onDec={()=>adjDone(size,-1)} onInc={()=>adjDone(size,1)} onSet={v=>onUpdate({...prod,done:{...(prod.done||{}),[size]:Math.min(maxDone(size),Math.max(0,v))}})}/>;
          })}
        </div>
      )}
      </div>

      {/* ── Actions ── */}
      <div style={{padding:mobile?"8px 16px 16px":"8px 20px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap",borderTop:"1px solid #f0f0f0"}}>
        <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
          {!fUnknown&&<span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"4px 9px",borderRadius:20,fontSize:11,fontWeight:800,background:fOk?"#ddfce6":"#fef1f0",color:fOk?"#1a9a50":"#e84142",border:`1px solid ${fOk?"#bbf7d0":"#fcc8c6"}`}}>
            {fOk?<IC_CHECK_CIRCLE size={13} color="#1a9a50"/>:<IC_WARN size={13} color="#e84142"/>} Blanks ({blankNeeded}/{blankAvail})
          </span>}
          {fUnknown&&<span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"4px 9px",borderRadius:20,fontSize:11,fontWeight:800,background:"#f8f8f8",color:"#bbb",border:"1px solid #e8e8e8"}}>— Kein Blank</span>}
          {dtfItem&&(()=>{
            const needed=totalQty;
            const avail=dtfItem.stock||0;
            const ok=avail>=needed;
            return <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"4px 9px",borderRadius:20,fontSize:11,fontWeight:800,background:ok?"#ddfce6":"#fef1f0",color:ok?"#1a9a50":"#e84142",border:`1px solid ${ok?"#bbf7d0":"#fcc8c6"}`}}>
              {ok?<IC_CHECK_CIRCLE size={13} color="#1a9a50"/>:<IC_WARN size={13} color="#e84142"/>} DTF ({needed}/{avail})
            </span>;
          })()}
        </div>
        <div style={{display:"flex",gap:6}}>
          {prod.status!=="Fertig"&&<button onClick={onConfirmProduce} style={{padding:"9px 18px",borderRadius:9,border:"none",background:"#1a9a50",color:"#fff",cursor:"pointer",fontWeight:800,fontSize:14,display:"flex",alignItems:"center",gap:6}}><CHECK/>Bestätigen</button>}
          {prod.status==="Fertig"&&<span style={{fontSize:12,color:"#1a9a50",fontWeight:700}}>✓ Abgeschlossen</span>}
        </div>
      </div>
    </div>
  );
}

// ─── Archived Card (compact) ──────────────────────────────────────
function ArchivedCard({prod,blank,onDelete}){
  const [open,setOpen]=useState(false);
  const isCap=prod.isCapOrder;
  const totalQty=totalProdQty(prod);
  const activeSizes=DEFAULT_SIZES.filter(s=>((prod.qty||{})[s]||0)>0);
  return(
    <div style={{background:"#fafafa",borderRadius:12,border:"1px solid #ebebeb",overflow:"hidden"}}>
      {/* Header row – clickable */}
      <div onClick={()=>setOpen(o=>!o)} style={{padding:"12px 16px",display:"flex",alignItems:"center",gap:10,cursor:"pointer",userSelect:"none"}}>
        <span style={{fontSize:11,color:"#ccc",width:12}}>{open?"▾":"▸"}</span>
        <SmartDot item={prod} size={20}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,fontWeight:700,color:"#555"}}>{prod.name}</div>
          <div style={{fontSize:11,color:"#bbb"}}>{blank?.name} · {totalQty} Stk</div>
        </div>
        {prod.completedAt&&<span style={{fontSize:10,color:"#bbb",textAlign:"right",lineHeight:1.4}}><span style={{display:"block"}}>{new Date(prod.completedAt).toLocaleDateString("de-AT")}</span><span style={{display:"block",fontWeight:700}}>{new Date(prod.completedAt).toLocaleTimeString("de-AT",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}</span></span>}
        <button onClick={e=>{e.stopPropagation();onDelete();}} style={{width:28,height:28,borderRadius:7,border:"1px solid #e8e8e8",background:"#f0f0f0",color:"#e84142",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800}}>✕</button>
      </div>
      {/* Expanded detail */}
      {open&&(
        <div style={{borderTop:"1px solid #ebebeb",padding:"10px 16px 14px",background:"#fff"}}>
          {isCap?(
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {(prod.capColors||[]).map(cc=>(
                <div key={cc.id} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,background:"#f8f8f8",borderRadius:10,padding:"8px 10px",minWidth:60,flex:1}}>
                  <div style={{width:16,height:16,borderRadius:"50%",background:cc.hex,border:"2px solid #444"}}/>
                  <span style={{fontSize:10,color:"#555",fontWeight:800,textAlign:"center"}}>{cc.name}</span>
                  <span style={{fontSize:22,fontWeight:900,color:"#111",lineHeight:1}}>{cc.qty}</span>
                  <span style={{fontSize:9,color:"#bbb",fontWeight:700}}>STK</span>
                </div>
              ))}
            </div>
          ):(
            <div style={S.col5}>
              {activeSizes.map(size=>{
                const qty=(prod.qty||{})[size]||0;
                const done=(prod.done||{})[size]||0;
                return(
                  <div key={size} style={{display:"flex",alignItems:"center",gap:10,background:"#f8f8f8",borderRadius:8,padding:"7px 12px"}}>
                    <span style={{fontSize:12,fontWeight:800,color:"#555",width:36}}>{SZ(size)}</span>
                    <span style={{fontSize:18,fontWeight:900,color:"#111",flex:1}}>{qty} <span style={{fontSize:10,color:"#bbb",fontWeight:400}}>Stk</span></span>
                    {done>0&&<span style={{fontSize:10,color:"#1a9a50",fontWeight:700}}>✓ {done} erledigt</span>}
                  </div>
                );
              })}
            </div>
          )}
          {prod.notes&&<div style={{fontSize:11,color:"#bbb",fontStyle:"italic",marginTop:8}}>📝 {prod.notes}</div>}
        </div>
      )}
    </div>
  );
}

// ─── Modals ───────────────────────────────────────────────────────
function ModalWrap({onClose,onSave,children,footer,width=600}){
  const mobile=useIsMobile();
  const onSaveRef=useRef(onSave);
  const onCloseRef=useRef(onClose);
  useEffect(()=>{onSaveRef.current=onSave;},[onSave]);
  useEffect(()=>{onCloseRef.current=onClose;},[onClose]);
  useEffect(()=>{
    const handler=(e)=>{
      if(e.key==="Escape"){onCloseRef.current();return;}
      if(e.key==="Enter"&&!e.isComposing){
        const tag=document.activeElement?.tagName;
        if(tag==="TEXTAREA"||tag==="SELECT")return;
        // skip if focused element is an inline-edit input (has data-inlineedit)
        if(document.activeElement?.dataset?.inlineedit)return;
        if(onSaveRef.current){e.preventDefault();onSaveRef.current();}
      }
    };
    window.addEventListener("keydown",handler);
    return()=>window.removeEventListener("keydown",handler);
  },[]);
  return(
    <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.4)",zIndex:500,display:"flex",alignItems:mobile?"flex-end":"center",justifyContent:"center"}} onClick={onClose}>
      <div style={{
        background:"#fff",
        borderRadius:mobile?"20px 20px 0 0":18,
        width:mobile?"100%":width,
        maxWidth:"100vw",
        height:mobile?"92dvh":undefined,
        maxHeight:mobile?"92dvh":"90vh",
        display:"flex",
        flexDirection:"column",
        boxShadow:"0 -4px 40px rgba(0,0,0,0.18)",
        overflow:"hidden",
        position:"relative",
        zIndex:301,
      }} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"flex-end",alignItems:"center",gap:8,padding:"16px 16px 8px",flexShrink:0,borderBottom:"1px solid #f0f0f0"}}>
          {onSave&&<button onClick={onSave} style={{width:36,height:36,borderRadius:"50%",border:"none",background:"#1a9a50",color:"#fff",fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,lineHeight:1,flexShrink:0}}>✓</button>}
          <button onClick={onClose} style={{width:36,height:36,borderRadius:"50%",border:"none",background:"#e84142",color:"#fff",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,lineHeight:1,flexShrink:0}}>✕</button>
        </div>
        <div style={{overflowY:"auto",WebkitOverflowScrolling:"touch",padding:mobile?"14px 16px 8px":"16px 26px 16px",display:"flex",flexDirection:"column",gap:14,flex:1,minHeight:0}}>
          {children}
        </div>

        {footer&&<div style={{padding:"12px 16px 20px",flexShrink:0,borderTop:"1px solid #f0f0f0",background:"#fff"}}>
          {footer}
        </div>}
      </div>
    </div>
  );
}

// ─── QtyRow – editable qty row in production modal ───────────────
function QtyRow({size,avail,over,value,onDec,onInc,onSet}){
  const [editing,setEditing]=useState(false);
  const [draft,setDraft]=useState("");
  const inputRef=useRef(null);
  const startEdit=()=>{setDraft(String(value));setEditing(true);setTimeout(()=>{inputRef.current?.select();},30);};
  const commit=()=>{const n=parseInt(draft);if(!isNaN(n)&&n>=0)onSet(n);setEditing(false);};
  return(
    <div style={{display:"flex",alignItems:"center",gap:10,background:over?"#fef1f0":"#f8f8f8",borderRadius:10,padding:"8px 12px",border:`1px solid ${over?"#fcc8c6":"transparent"}`}}>
      <span style={S.sizeTag}>{SZ(size)}</span>
      <span style={{fontSize:11,color:"#bbb",flex:1}}>Lager: {avail}</span>
      <button type="button" onClick={onDec} style={{width:32,height:32,borderRadius:8,border:"none",background:"#fef1f0",color:"#e84142",fontSize:18,cursor:"pointer",fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
      {editing
        ? <input ref={inputRef} type="number" inputMode="numeric" pattern="[0-9]*" value={draft}
            onChange={e=>setDraft(e.target.value)} onBlur={commit} data-inlineedit="1" onKeyDown={e=>{if(e.key==="Enter")commit();if(e.key==="Escape")setEditing(false);}}
            style={{fontSize:20,fontWeight:900,color:over?"#e84142":"#111",width:36,textAlign:"center",border:"none",background:"transparent",outline:"none"}}/>
        : <span onDoubleClick={startEdit} style={{fontSize:20,fontWeight:900,color:over?"#e84142":"#111",width:36,textAlign:"center",cursor:"text"}}>{value}</span>
      }
      <button type="button" onClick={onInc} style={{width:32,height:32,borderRadius:8,border:"none",background:"#ddfce6",color:"#1a9a50",fontSize:18,cursor:"pointer",fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
    </div>
  );
}


// ─── Shopify Product Picker (for Production Modal) ────────────────
function ShopifyProdPicker({sheetsUrl, value, onChange}){
  const [shopifyProds, setShopifyProds] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selLocRef = useRef(value?.locationId ? {id:value.locationId, name:value.locationName} : null);

  const load = async () => {
    if(open){ setOpen(false); return; }
    if(shopifyProds.length>0){
      // If we have prods but no location yet, fetch locations
      if(!selLocRef.current){
        fetch(`${sheetsUrl}?action=shopify_locations`,{redirect:"follow"}).then(r=>r.text()).then(t=>{
          const d=JSON.parse(t);
          if(d.locations&&d.locations.length>0){ setLocations(d.locations); selLocRef.current=d.locations[0]; }
        }).catch(()=>{});
      }
      setOpen(true); return;
    }
    setLoading(true);
    try {
      const d1 = await fetch(`${sheetsUrl}?action=shopify_products`,{redirect:"follow"}).then(r=>r.text()).then(JSON.parse);
      if(d1.products) setShopifyProds(d1.products);
      const d2 = await fetch(`${sheetsUrl}?action=shopify_locations`,{redirect:"follow"}).then(r=>r.text()).then(JSON.parse);
      if(d2.locations && d2.locations.length>0){
        setLocations(d2.locations);
        selLocRef.current = d2.locations[0];
      }
    } catch(e){}
    setLoading(false);
    setOpen(true);
  };

  const select = (prod) => {
    const loc = selLocRef.current;
    onChange({
      shopifyProductId: String(prod.id),
      title: prod.title,
      variants: (prod.variants||[]).map(v=>({
        id: String(v.id),
        title: v.title,
        inventory_item_id: String(v.inventory_item_id)
      })),
      locationId: loc ? String(loc.id) : "",
      locationName: loc ? loc.name : ""
    });
    setOpen(false);
    setSearch("");
  };

  const clear = (e) => { e.stopPropagation(); onChange(null); };

  const filtered = shopifyProds.filter(sp=>!search||sp.title.toLowerCase().includes(search.toLowerCase()));

  return(
    <div>
      {/* Trigger */}
      <button type="button" onClick={load}
        style={{width:"100%",padding:"11px 14px",borderRadius:10,border:`1.5px solid ${value?"#bbf7d0":"#e8e8e8"}`,background:value?"#f0fdf4":"#f8f8f8",color:value?"#1a9a50":"#888",cursor:"pointer",fontWeight:700,fontSize:13,textAlign:"left",display:"flex",alignItems:"center",gap:8}}>
        {loading?"⟳ Laden...": value
          ? <><span style={{flex:1}}>✓ {value.title}</span><span style={{fontSize:11,opacity:0.6}}>({value.variants?.length} Varianten)</span></>
          : <span style={{flex:1}}>Shopify Produkt auswählen...</span>}
        {value && <span onClick={clear} style={{fontSize:16,color:"#e84142",lineHeight:1,padding:"0 4px"}}>✕</span>}
        {!value && <span style={{fontSize:12,color:"#bbb"}}>{open?"▲":"▼"}</span>}
      </button>

      {/* Inline expanded list — no absolute positioning */}
      {open && (
        <div style={{border:"1px solid #e8e8e8",borderRadius:10,marginTop:4,overflow:"hidden",background:"#fff"}}>
          <div style={{padding:"8px 10px",borderBottom:"1px solid #f0f0f0"}}>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Suchen..."
              style={{width:"100%",padding:"7px 10px",borderRadius:8,border:"1px solid #e8e8e8",fontSize:13,outline:"none",boxSizing:"border-box"}}/>
          </div>
          <div style={{maxHeight:220,overflowY:"auto"}}>
            {filtered.length===0 && <div style={{padding:20,color:"#ccc",textAlign:"center",fontSize:13}}>Keine Treffer</div>}
            {filtered.map(sp=>(
              <div key={sp.id} onClick={()=>select(sp)}
                style={{padding:"10px 14px",cursor:"pointer",borderBottom:"1px solid #f5f5f5",display:"flex",alignItems:"center",gap:10,background:"#fff"}}
                onMouseEnter={e=>e.currentTarget.style.background="#f0fdf4"}
                onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                {sp.images?.[0]?.src
                  ?<img src={sp.images[0].src} style={{width:28,height:28,borderRadius:5,objectFit:"cover",flexShrink:0}} alt=""/>
                  :<div style={{width:28,height:28,borderRadius:5,background:"#f0f0f0",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><IC_TSHIRT size={14} color="#bbb"/></div>}
                <span style={{fontSize:13,fontWeight:600}}>{sp.title}</span>
              </div>
            ))}
          </div>
          {locations.length>1&&(
            <div style={{padding:"8px 14px",borderTop:"1px solid #f0f0f0",display:"flex",gap:6,flexWrap:"wrap"}}>
              {locations.map(loc=>(
                <button key={loc.id} type="button" onClick={()=>{selLocRef.current=loc;}}
                  style={{padding:"4px 10px",borderRadius:7,border:`1.5px solid ${selLocRef.current?.id===loc.id?"#111":"#e8e8e8"}`,background:selLocRef.current?.id===loc.id?"#111":"#f8f8f8",color:selLocRef.current?.id===loc.id?"#fff":"#555",cursor:"pointer",fontWeight:700,fontSize:12}}>
                  {loc.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


function ProductionModal({products,dtfItems=[],initial,onClose,onSave}){
  const editing=!!initial;
  const [modalLightbox,setModalLightbox]=useState(null);
  const [name,setName]=useState(initial?.name||"");
  const [blankId,setBlankId]=useState(initial?.blankId||products[0]?.id||"");
  const [notes,setNotes]=useState(initial?.notes||"");
  const [priority,setPriority]=useState(initial?.priority||"Mittel");
  const [veredelung,setVeredelung]=useState(initial?.veredelung||["Drucken"]);
  const [dtfId,setDtfId]=useState(initial?.dtfId||"");
  const [designUrl,setDesignUrl]=useState(initial?.designUrl||"");
  const [colorHex,setColorHex]=useState(initial?.colorHex||"#000000");
  const [photos,setPhotos]=useState(initial?.photos||[]);
  const [qty,setQty]=useState(initial?.qty||mkQty());
  const [done,setDone]=useState(initial?.done||mkQty());
  const [shopifyProductLink,setShopifyProductLink]=useState(initial?.shopifyProductLink||null); // {shopifyProductId, title, variants:[{id,title,inventory_item_id}], locationId}
  const getCapColorsFromBlank=(blankProd,existingCapColors)=>{
    if(!blankProd||!(blankProd.capColors?.length>0))return existingCapColors||[];
    // Map blank's capColors to order format, preserving qty/done if already set
    return (blankProd.capColors||[]).map(bc=>{
      const existing=(existingCapColors||[]).find(ec=>ec.id===bc.id||ec.name===bc.name);
      return {id:bc.id,name:bc.name,hex:bc.hex,qty:existing?.qty||0,done:existing?.done||0};
    });
  };
  const [capColors,setCapColors]=useState(()=>{
    const initBlank=products.find(p=>p.id===(initial?.blankId||products[0]?.id));
    return getCapColorsFromBlank(initBlank, initial?.capColors);
  });
  const fileRef=useRef();
  const blank=products.find(p=>p.id===blankId);
  const isCap=(blank?.capColors?.length>0);
  const inp={background:"#f8f8f8",border:"1px solid #e8e8e8",borderRadius:10,color:"#111",padding:"11px 14px",fontSize:16,width:"100%",outline:"none",boxSizing:"border-box"};
  const toggleV=(v)=>setVeredelung(vs=>vs.includes(v)?vs.filter(x=>x!==v):[...vs,v]);
  const compressPhoto=(file)=>new Promise((resolve)=>{
    const img=new Image();const r=new FileReader();
    r.onload=ev=>{
      img.onload=()=>{
        const MAX=800;let w=img.width,h=img.height;
        if(w>MAX||h>MAX){const s=Math.min(MAX/w,MAX/h);w=Math.round(w*s);h=Math.round(h*s);}
        const c=document.createElement("canvas");c.width=w;c.height=h;
        const ctx=c.getContext("2d");ctx.drawImage(img,0,0,w,h);
        resolve(c.toDataURL("image/jpeg",0.75));
      };
      img.src=ev.target.result;
    };
    r.readAsDataURL(file);
  });
  const handlePhotos=async(e)=>{const files=Array.from(e.target.files);const rem=5-photos.length;for(const f of files.slice(0,rem)){const compressed=await compressPhoto(f);setPhotos(ps=>[...ps,compressed]);}};
  const doSaveProd = () => {
    if(!name.trim()||!blankId||veredelung.length===0) return;
    onSave({id:initial?.id||Date.now().toString(),name:name.trim(),blankId,notes,priority,status:initial?.status||"Geplant",veredelung,designUrl,colorHex:blank?.colorHex||"#000000",photos,dtfId:dtfId||null,isCapOrder:isCap,qty,done,capColors,shopifyProductLink:shopifyProductLink||null});
  };
  return(
    <ModalWrap onClose={onClose} onSave={doSaveProd} width={640} footer={<div style={{display:"flex",gap:10}}><button type="button" onClick={()=>onClose()} style={{flex:1,padding:13,borderRadius:10,border:"1px solid #e8e8e8",background:"none",color:"#888",cursor:"pointer",fontWeight:700,fontSize:14}}>Abbrechen</button><button type="button" onClick={()=>doSaveProd()} style={{flex:2,padding:13,borderRadius:10,border:"none",background:"#1a9a50",color:"#fff",cursor:"pointer",fontWeight:800,fontSize:15}}>{editing?"✓ Speichern":"✓ Anlegen"}</button></div>}>
      <div style={{...F_HEAD_STYLE,fontSize:17,fontWeight:800,color:"#111"}}>{editing?"Auftrag bearbeiten":"Neuer Produktionsauftrag"}</div>
      <input style={inp} placeholder="Name" value={name} onChange={e=>setName(e.target.value)}/>
      <input style={inp} placeholder="Notiz (optional)" value={notes} onChange={e=>setNotes(e.target.value)}/>
      <div>
        <div style={S.secLabel}>PRIORITÄT</div>
        <div style={{display:"flex",gap:6}}>
          {["Hoch","Mittel","Niedrig"].map(p=>{const s=PRIORITY[p];return <button key={p} type="button" onClick={()=>setPriority(p)} style={{flex:1,padding:"10px",borderRadius:9,border:`1.5px solid ${priority===p?s.dot:"#e8e8e8"}`,background:priority===p?s.bg:"#fff",color:priority===p?s.color:"#999",cursor:"pointer",fontWeight:700,fontSize:13}}>{p}</button>;})}
        </div>
      </div>
      <div>
        <div style={S.secLabel}>VEREDELUNG</div>
        <div style={{display:"flex",gap:8}}>
          {VEREDELUNG_TYPES.map(v=>{const active=veredelung.includes(v);const sc={"Drucken":{ac:"#4078e0",bg:"#edf4fe"},"Sticken":{ac:"#9b5de5",bg:"#f6f0fd"}}[v];return <button key={v} type="button" onClick={()=>toggleV(v)} style={{flex:1,padding:"11px",borderRadius:10,border:`1.5px solid ${active?sc.ac:"#e8e8e8"}`,background:active?sc.bg:"#fff",color:active?sc.ac:"#999",cursor:"pointer",fontWeight:700,fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>{v==="Drucken"?<><IC_PRINT size={12} color={active?"#4078e0":"#999"}/> Drucken</>:<><IC_STITCH size={12} color={active?"#9b5de5":"#999"}/> Sticken</>}</button>;})}

        {veredelung.includes("Drucken")&&dtfItems.length>0&&<div>
          <div style={S.secLabel}>DTF TRANSFER VERKNÜPFEN</div>
          <select value={dtfId} onChange={e=>setDtfId(e.target.value)}
            style={{width:"100%",padding:"12px 14px",borderRadius:10,border:"1.5px solid #e8e8e8",fontSize:14,fontWeight:600,outline:"none",background:"#fff",appearance:"none"}}>
            <option value="">— Kein DTF —</option>
            {dtfItems.map(d=><option key={d.id} value={d.id}>{d.name} ({d.stock} Stk)</option>)}
          </select>
        </div>}
        </div>
      </div>
      <div>
        <div style={S.secLabel}>BLANK VERKNÜPFEN</div>
        <select value={blankId} onChange={e=>{
          const p=products.find(x=>x.id===e.target.value);
          setBlankId(e.target.value);
          if(p?.capColors?.length>0) setCapColors(getCapColorsFromBlank(p, capColors));
        }} style={{width:"100%",padding:"12px 14px",borderRadius:10,border:"1.5px solid #e8e8e8",fontSize:14,fontWeight:600,outline:"none",background:"#fff",appearance:"none",cursor:"pointer"}}>
          <option value="">— Blank auswählen —</option>
          {products.map(p=>(
            <option key={p.id} value={p.id}>{p.name}{p.color?" · "+p.color:""} · {p.category}</option>
          ))}
        </select>
        {blank&&<div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",borderRadius:10,background:"#f8f8f8",border:"1px solid #e8e8e8",marginTop:6}}>
          <SmartDot item={blank} size={20}/>
          <div><div style={{fontSize:13,fontWeight:700}}>{blank.name}</div><div style={{fontSize:11,color:"#bbb"}}>{blank.color||""} · {blank.category}</div></div>
        </div>}
      </div>
      {/* Shopify Verknüpfung */}
      <div>
        <div style={S.secLabel}>SHOPIFY PRODUKT VERKNÜPFEN</div>
        <ShopifyProdPicker
          sheetsUrl={SHEETS_URL}
          value={shopifyProductLink}
          onChange={setShopifyProductLink}
        />
      </div>
      {isCap?(
        <div>
          <div style={S.secLabel}>FARBEN & MENGEN</div>
          <div style={S.col6}>
            {capColors.length===0&&<div style={{fontSize:12,color:"#bbb",padding:"10px",textAlign:"center"}}>Keine Farben im Bestandsprodukt hinterlegt</div>}
            {capColors.map(cc=>{
              const avail=(blank?.capColors||[]).find(bc=>bc.id===cc.id)?.stock||0;
              const over=(cc.qty||0)>avail;
              return(
                <div key={cc.id} style={{display:"flex",alignItems:"center",gap:10,background:over?"#fef1f0":"#f8f8f8",borderRadius:10,padding:"10px 12px",border:`1px solid ${over?"#fcc8c6":"transparent"}`}}>
                  <div style={{width:24,height:24,borderRadius:"50%",background:cc.hex,border:"2px solid #444",flexShrink:0}}/>
                  <span style={{fontSize:13,fontWeight:700,color:"#333",flex:1}}>{cc.name}</span>
                  <span style={{fontSize:11,color:"#bbb"}}>Lager: <b style={{color:avail===0?"#e84142":avail<=3?"#f08328":"#111"}}>{avail}</b></span>
                  <button type="button" onClick={()=>setCapColors(cs=>cs.map(x=>x.id===cc.id?{...x,qty:Math.max(0,(x.qty||0)-1)}:x))} style={btn(32,true)}>−</button>
                  <span style={{fontSize:20,fontWeight:900,color:over?"#e84142":"#111",width:30,textAlign:"center"}}>{cc.qty||0}</span>
                  <button type="button" onClick={()=>setCapColors(cs=>cs.map(x=>x.id===cc.id?{...x,qty:(x.qty||0)+1}:x))} style={btn(32)}>+</button>
                </div>
              );
            })}
          </div>
        </div>
      ):(
        <div>
          <div style={S.secLabel}>SOLL-MENGE PRO GRÖSSE</div>
          <div style={S.col5}>
            {DEFAULT_SIZES.map(size=>{
              const avail=(blank?.stock||{})[size]??0,over=(qty[size]||0)>avail;
              return <QtyRow key={size} size={size} avail={avail} over={over} value={qty[size]||0}
                onDec={()=>setQty(q=>({...q,[size]:Math.max(0,(q[size]||0)-1)}))}
                onInc={()=>setQty(q=>({...q,[size]:(q[size]||0)+1}))}
                onSet={(v)=>setQty(q=>({...q,[size]:v}))}/>;
            })}
          </div>
        </div>
      )}
      <div>
        <div style={S.secLabel}>FOTOS (max. 5)</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
          {photos.map((src,i)=><div key={i} style={{position:"relative"}}>
              <img src={src} alt="" onClick={()=>setModalLightbox(i)} style={{width:64,height:64,objectFit:"cover",borderRadius:10,border:"1px solid #ebebeb",cursor:"zoom-in"}}/>
              <button type="button" onClick={()=>setPhotos(ps=>ps.filter((_,j)=>j!==i))} style={{position:"absolute",top:-6,right:-6,width:20,height:20,borderRadius:"50%",border:"none",background:"#e84142",color:"#fff",cursor:"pointer",fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800}}>✕</button>
            </div>)}
          <Lightbox photos={photos} startIndex={modalLightbox} onClose={()=>setModalLightbox(null)}/>
          {photos.length<5&&<button type="button" onClick={()=>fileRef.current.click()} style={{width:64,height:64,borderRadius:10,border:"2px dashed #e8e8e8",background:"#fafafa",color:"#bbb",cursor:"pointer",fontSize:24,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>}
          <input ref={fileRef} type="file" accept="image/*" multiple style={{display:"none"}} onChange={handlePhotos}/>
        </div>
      </div>
    </ModalWrap>
  );
}

function ProductModal({categories,variantCats,initial,onClose,onSave,onDelete}){
  const editing=!!initial;
  const [name,setName]=useState(initial?.name||"");
  const [category,setCategory]=useState(initial?.category||categories[0]||"");
  const [color,setColor]=useState(initial?.color||"");
  const [colorHex,setColorHex]=useState(initial?.colorHex||"#000000");
  const [buyPrice,setBuyPrice]=useState(initial?.buyPrice!=null?String(initial.buyPrice):"");
  const [stProductId,setStProductId]=useState(initial?.stProductId||"");
  const [stColorCode,setStColorCode]=useState(initial?.stColorCode||"");
  const [stock,setStock]=useState(initial?.stock||mkQty());
  const [minStock,setMinStock]=useState(initial?.minStock||mkQty());
  const [capColors,setCapColors]=useState(initial?.capColors||[{id:mkId(),name:"Black",hex:"#111111",stock:0}]);
  // Variant categories use color variants; all others use sizes (XXS-XXXL)
  const isCap=(variantCats||DEFAULT_VARIANT_CATS).includes(category);
  const [showPresets, setShowPresets] = useState(false);
  const [presetProduct, setPresetProduct] = useState(null);
  const [presetCat, setPresetCat] = useState("T-Shirt");
  const [confirmDeleteInModal, setConfirmDeleteInModal] = useState(false);
  const inp={background:"#f8f8f8",border:"1px solid #e8e8e8",borderRadius:10,color:"#111",padding:"11px 14px",fontSize:16,width:"100%",outline:"none",boxSizing:"border-box"};

  const applyPreset = (preset, colorObj) => {
    const newCat = preset.category || presetCat;
    setCategory(newCat);
    setName(preset.name);
    setColor(colorObj.name);
    setColorHex(colorObj.hex);
    setStProductId(preset.productId||preset.id||"");
    setStColorCode(colorObj.code||"");
    if(colorObj.price!=null) setBuyPrice(String(colorObj.price));
    // Bag & Cap: load ALL colors from preset as capColors
    if((variantCats||DEFAULT_VARIANT_CATS).includes(newCat)){
      setCapColors(preset.colors.map(c=>({id:mkId(),name:c.name,hex:c.hex,stColorCode:c.code||"",stock:0,minStock:0})));
    }
    setShowPresets(false);
    setPresetProduct(null);
  };

  const doSave = () => {
    onSave({id:initial?.id||Date.now().toString(),name:(name||"Neues Produkt").trim(),category,color,colorHex,buyPrice:parseFloat(buyPrice)||null,stProductId:stProductId.trim(),stColorCode:stColorCode.trim(),stock:isCap?{}:stock,minStock:isCap?{}:minStock,capColors:isCap?capColors:null});
  };

  return(
    <ModalWrap onClose={onClose} onSave={doSave} width={620} footer={<div style={{display:"flex",flexDirection:"column",gap:10}}>
      <div style={{display:"flex",gap:10}}><button type="button" onClick={()=>onClose()} style={{flex:1,padding:13,borderRadius:10,border:"1px solid #e8e8e8",background:"none",color:"#888",cursor:"pointer",fontWeight:700,fontSize:14}}>Abbrechen</button><button type="button" onClick={()=>doSave()} style={{flex:2,padding:13,borderRadius:10,border:"none",background:"#1a9a50",color:"#fff",cursor:"pointer",fontWeight:800,fontSize:15}}>✓ {editing?"Speichern":"Hinzufügen"}</button></div>
      {editing&&onDelete&&!confirmDeleteInModal&&<button type="button" onClick={()=>setConfirmDeleteInModal(true)} style={{width:"100%",padding:11,borderRadius:10,border:"1px solid #fee2e2",background:"#fff",color:"#e84142",cursor:"pointer",fontWeight:700,fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e84142" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg> Produkt löschen</button>}
      {editing&&confirmDeleteInModal&&<div style={{display:"flex",gap:8,background:"#fef1f0",borderRadius:10,padding:10,alignItems:"center"}}><span style={{fontSize:13,color:"#e84142",fontWeight:700,flex:1}}>Wirklich löschen?</span><button type="button" onClick={()=>setConfirmDeleteInModal(false)} style={{padding:"8px 14px",borderRadius:8,border:"1px solid #e8e8e8",background:"#fff",color:"#888",cursor:"pointer",fontWeight:700,fontSize:12}}>Nein</button><button type="button" onClick={()=>{onDelete();onClose();}} style={{padding:"8px 14px",borderRadius:8,border:"none",background:"#e84142",color:"#fff",cursor:"pointer",fontWeight:800,fontSize:12}}>Ja, löschen</button></div>}
    </div>}>
      <div style={{...F_HEAD_STYLE,fontSize:17,fontWeight:800,color:"#111"}}>{editing?"Produkt bearbeiten":"Neues Produkt"}</div>

      {/* Stanley/Stella Preset Picker */}
      {!editing&&(
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {/* Category buttons – show all cats that have S/S presets */}
          {!presetProduct&&(()=>{
            const presetCats=[...new Set(STANLEY_STELLA_PRESETS.map(p=>p.category))];
            return <div style={{display:"flex",gap:0,borderBottom:"2px solid #f0f0f0",overflowX:"auto"}}>
              {presetCats.map(cat=>(
                <button key={cat} type="button"
                  onClick={()=>{setPresetCat(cat);setShowPresets(true);}}
                  style={{flex:1,padding:"8px 4px",border:"none",background:"transparent",
                    borderBottom:showPresets&&presetCat===cat?"2px solid #111":"2px solid transparent",
                    marginBottom:-2,
                    color:showPresets&&presetCat===cat?"#111":"#bbb",
                    fontWeight:showPresets&&presetCat===cat?800:600,fontSize:12,cursor:"pointer",transition:"all 0.15s",whiteSpace:"nowrap",minWidth:0}}>
                  {cat}
                </button>
              ))}
            </div>;
          })()}
          {/* Product list */}
          {showPresets&&!presetProduct&&(
            <div style={{background:"#fff",border:"1px solid #e8e8e8",borderRadius:12,overflow:"hidden",boxShadow:"0 4px 16px rgba(0,0,0,0.08)"}}>
              {STANLEY_STELLA_PRESETS.filter(p=>p.category===presetCat).map(p=>{
                const isVarCat=(variantCats||DEFAULT_VARIANT_CATS).includes(presetCat);
                return(
                <button key={p.id} type="button"
                  onClick={()=>{ if(isVarCat){applyPreset(p,p.colors[0]);}else{setPresetProduct(p);} }}
                  style={{width:"100%",padding:"12px 14px",border:"none",borderTop:"1px solid #f0f0f0",background:"#fff",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:10}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:800,color:"#111"}}>{p.name}</div>
                    <div style={{fontSize:11,color:"#bbb"}}>{p.id} · {p.fit} · {p.colors.length} Farben</div>
                  </div>
                  {isVarCat
                    ? <span style={{fontSize:11,background:"#ddfce6",color:"#1a9a50",borderRadius:6,padding:"2px 8px",fontWeight:700}}>Alle laden</span>
                    : <span style={{color:"#bbb"}}>›</span>}
                </button>
                );})}
            </div>
          )}
          {/* Color picker - only for size-based categories */}
          {showPresets&&presetProduct&&!(variantCats||DEFAULT_VARIANT_CATS).includes(presetCat)&&(
            <div style={{background:"#fff",border:"1px solid #e8e8e8",borderRadius:12,overflow:"hidden",boxShadow:"0 4px 16px rgba(0,0,0,0.08)"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderBottom:"1px solid #f0f0f0"}}>
                <button type="button" onClick={()=>setPresetProduct(null)} style={{border:"none",background:"none",cursor:"pointer",color:"#888",fontSize:13}}>‹ zurück</button>
                <div style={{fontSize:13,fontWeight:800,color:"#111"}}>{presetProduct.name}</div>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:8,padding:12,maxHeight:220,overflowY:"auto"}}>
                {presetProduct.colors.map(c=>(
                  <button key={c.code} type="button" onClick={()=>applyPreset(presetProduct,c)}
                    title={c.name+" ("+c.code+")"}
                    style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"8px 10px",borderRadius:10,border:"1px solid #ebebeb",background:"#fff",cursor:"pointer",minWidth:72,flex:"0 0 auto"}}>
                    <div style={{width:28,height:28,borderRadius:"50%",background:c.hex,border:"2px solid #e0e0e0",boxShadow:"inset 0 1px 3px rgba(0,0,0,0.15)"}}/>
                    <div style={{fontSize:9,fontWeight:700,color:"#555",textAlign:"center",lineHeight:1.2}}>{c.name}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <input style={inp} placeholder="Produktname" value={name} onChange={e=>setName(e.target.value)}/>
      <div style={{display:"flex",gap:10}}>
        <select style={{...inp,flex:1}} value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select>
        <div style={{flex:1,position:"relative"}}><span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:"#bbb",fontSize:14,fontWeight:700,pointerEvents:"none"}}>€</span><input style={{...inp,paddingLeft:28}} placeholder="EK-Preis" type="number" min="0" step="0.01" value={buyPrice} onChange={e=>setBuyPrice(e.target.value)}/></div>
      </div>
      {!isCap&&(
        <div style={S.col8}>
          <input style={inp} placeholder="Farbname (z.B. Black, Natural)" value={color} onChange={e=>setColor(e.target.value)}/>
          <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
            {PRESET_COLORS.map(c=><button key={c} type="button" onClick={()=>setColorHex(c)} style={{width:28,height:28,borderRadius:7,border:colorHex===c?"2.5px solid #111":"1px solid #ddd",background:c,cursor:"pointer",padding:0}}/>)}
            <input type="color" value={colorHex} onChange={e=>setColorHex(e.target.value)} style={{width:28,height:28,borderRadius:7,border:"1px solid #ddd",cursor:"pointer",padding:0}}/>
            <ColorDot hex={colorHex} size={24}/>
          </div>
        </div>
      )}
      {isCap?(
        <div>
          <div style={S.secLabel}>FARBEN, BESTAND & SOLLBESTAND</div>
          <CapColorEditor colors={capColors} onChange={setCapColors} mode="stock" showMinStock={true}/>
        </div>
      ):(
        <div>
          <div style={S.secLabel}>BESTAND</div>
          <div style={S.col5}>
            {DEFAULT_SIZES.map(size=>(
              <QtyRow key={size} size={size} avail={0} over={false} value={stock[size]||0}
                onDec={()=>setStock(s=>({...s,[size]:Math.max(0,(s[size]||0)-1)}))}
                onInc={()=>setStock(s=>({...s,[size]:(s[size]||0)+1}))}
                onSet={(v)=>setStock(s=>({...s,[size]:v}))}/>
            ))}
          </div>
        </div>
      )}
      {!isCap&&(
        <div>
          <div style={S.secLabel}>SOLLBESTAND (Min.)</div>
          <div style={S.col5}>
            {DEFAULT_SIZES.map(size=>(
              <QtyRow key={size} size={size} avail={0} over={false} value={minStock[size]||0}
                onDec={()=>setMinStock(s=>({...s,[size]:Math.max(0,(s[size]||0)-1)}))}
                onInc={()=>setMinStock(s=>({...s,[size]:(s[size]||0)+1}))}
                onSet={(v)=>setMinStock(s=>({...s,[size]:v}))}/>
            ))}
          </div>
        </div>
      )}
    </ModalWrap>
  );
}

function CategoryModal({categories,variantCats,onClose,onSave}){
  const [cats,setCats]=useState([...categories]);
  const [vCats,setVCats]=useState([...(variantCats||[])]);
  const [newCat,setNewCat]=useState("");
  const [newCatType,setNewCatType]=useState("sizes"); // "sizes" | "variants"
  const inp={background:"#f8f8f8",border:"1px solid #e8e8e8",borderRadius:10,color:"#111",padding:"11px 14px",fontSize:14,outline:"none"};
  const addCat=()=>{
    const n=newCat.trim();if(!n||cats.includes(n))return;
    setCats([...cats,n]);
    if(newCatType==="variants") setVCats([...vCats,n]);
    setNewCat("");setNewCatType("sizes");
  };
  const removeCat=(i)=>{const name=cats[i];setCats(cats.filter((_,j)=>j!==i));setVCats(vCats.filter(v=>v!==name));};
  const toggleType=(name)=>{setVCats(vc=>vc.includes(name)?vc.filter(v=>v!==name):[...vc,name]);};
  return(
    <ModalWrap onClose={onClose} width={420}>
      <div style={{...F_HEAD_STYLE,fontSize:17,fontWeight:800,color:"#111"}}>Kategorien</div>
      <div style={{display:"flex",flexDirection:"column",gap:7}}>
        {cats.map((c,i)=>{
          const isVar=vCats.includes(c);
          return <div key={i} style={{display:"flex",alignItems:"center",gap:8,background:"#f8f8f8",borderRadius:10,padding:"10px 12px"}}>
            <span style={{flex:1,fontSize:14,fontWeight:600}}>{c}</span>
            <button type="button" onClick={()=>toggleType(c)}
              style={{padding:"3px 8px",borderRadius:6,border:"1px solid #ddd",background:isVar?"#f0f0f0":"#fff",color:"#666",fontSize:10,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>
              {isVar?"Farben":"Größen"}
            </button>
            <button type="button" onClick={()=>removeCat(i)} style={{background:"none",border:"none",color:"#ccc",cursor:"pointer",fontSize:18}}>✕</button>
          </div>;
        })}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        <div style={{display:"flex",gap:8}}>
          <input style={{...inp,flex:1}} placeholder="Neue Kategorie..." value={newCat} onChange={e=>setNewCat(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")addCat();}}/>
          <button type="button" onClick={addCat} style={{padding:"11px 16px",borderRadius:10,border:"none",background:"#111",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:14}}>+</button>
        </div>
        {newCat.trim()&&<div style={{display:"flex",gap:0,background:"#f0f0f0",borderRadius:10,padding:3}}>
          {[["sizes","Größen (XXS–3XL)",IC_SHIRT],["variants","Farbvarianten",IC_PAINT]].map(([v,lbl,Icon])=>(
            <button key={v} type="button" onClick={()=>setNewCatType(v)} style={{flex:1,padding:"7px 12px",borderRadius:8,border:"none",background:newCatType===v?"#fff":"transparent",color:newCatType===v?"#111":"#666",cursor:"pointer",fontWeight:700,fontSize:12,boxShadow:newCatType===v?"0 1px 3px rgba(0,0,0,0.08)":"none",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
              <Icon size={12} color={newCatType===v?"#111":"#999"}/>{lbl}
            </button>
          ))}
        </div>}
      </div>
      <div style={{display:"flex",gap:10}}>
        <button type="button" onClick={onClose} style={{flex:1,padding:13,borderRadius:10,border:"1px solid #e8e8e8",background:"none",color:"#888",cursor:"pointer",fontWeight:700}}>Abbrechen</button>
        <button type="button" onClick={()=>onSave(cats,vCats)} style={{flex:2,padding:13,borderRadius:10,border:"none",background:"#111",color:"#fff",cursor:"pointer",fontWeight:800,fontSize:14}}>Speichern</button>
      </div>
    </ModalWrap>
  );
}

function DeleteConfirmModal({name,onConfirm,onCancel}){
  return(
    <ModalWrap onClose={onCancel} width={360}>
      <div style={{width:48,height:48,borderRadius:"50%",background:"#fef1f0",display:"flex",alignItems:"center",justifyContent:"center"}}><IC_TRASH size={22} color="#e84142"/></div>
      <div><div style={{...F_HEAD_STYLE,fontSize:17,fontWeight:800,color:"#111",marginBottom:4}}>Löschen?</div><div style={{fontSize:14,color:"#888"}}><strong style={{color:"#111"}}>{name}</strong> wird dauerhaft entfernt.</div></div>
      <div style={{display:"flex",gap:10}}>
        <button type="button" onClick={onCancel} style={{flex:1,padding:13,borderRadius:10,border:"1px solid #e8e8e8",background:"none",color:"#666",cursor:"pointer",fontWeight:700}}>Abbrechen</button>
        <button type="button" onClick={onConfirm} style={{flex:1,padding:13,borderRadius:10,border:"none",background:"#e84142",color:"#fff",cursor:"pointer",fontWeight:800}}>Löschen</button>
      </div>
    </ModalWrap>
  );
}

function ConfirmProduceModal({prod,blank,onConfirm,onCancel}){
  const isCap=prod.isCapOrder;
  const capDoneItems=(prod.capColors||[]).filter(c=>c.done>0);
  const sizDoneItems=DEFAULT_SIZES.filter(s=>((prod.done||{})[s]||0)>0);
  const hasAny=isCap?capDoneItems.length>0:sizDoneItems.length>0;
  const hasShopify=!!prod.shopifyProductLink;
  const shopifyTitle=prod.shopifyProductLink?.title||"";

  // Check if all done sizes have matching variants
  const variants=prod.shopifyProductLink?.variants||[];
  const missingSizes=!isCap&&hasShopify?sizDoneItems.filter(s=>!variants.find(v=>
    v.title.toLowerCase()===s.toLowerCase()||v.title.toLowerCase().split("/")[0].trim()===s.toLowerCase()
  )):[];
  const shopifyReady=hasShopify&&missingSizes.length===0;

  return(
    <ModalWrap onClose={onCancel} width={420}>
      <div style={{fontSize:16,fontWeight:800,color:"#111"}}>Abschließen & Bestand abziehen</div>
      <div style={{fontSize:13,color:"#888",lineHeight:1.6}}>Erledigte Stücke werden von <strong style={{color:"#111"}}>{blank?.name}</strong> abgezogen:</div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {!hasAny&&<span style={{fontSize:13,color:"#bbb"}}>Noch nichts erledigt</span>}
        {isCap?capDoneItems.map(c=><div key={c.id} style={{background:"#f8f8f8",borderRadius:9,padding:"8px 12px",display:"flex",alignItems:"center",gap:8}}><div style={{width:16,height:16,borderRadius:"50%",background:c.hex,border:"1.5px solid #444"}}/><div><div style={{fontSize:10,color:"#bbb",fontWeight:700}}>{c.name}</div><div style={{fontSize:18,fontWeight:900,color:"#111"}}>{c.done}</div></div></div>)
        :sizDoneItems.map(s=><div key={s} style={{background:"#f8f8f8",borderRadius:9,padding:"8px 12px",textAlign:"center"}}><div style={{fontSize:10,color:"#bbb",fontWeight:700}}>{s}</div><div style={{fontSize:18,fontWeight:900,color:"#111"}}>{(prod.done||{})[s]}</div></div>)}
      </div>

      {/* Shopify Status */}
      {!isCap&&hasAny&&(
        hasShopify&&shopifyReady
          ?<div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",gap:8}}>
              <span style={{width:8,height:8,borderRadius:"50%",background:"#1a9a50",display:"inline-block",flexShrink:0}}/>
              <div style={{fontSize:12,color:"#1a9a50",fontWeight:700}}>Shopify Bestand wird aktualisiert: <strong>{shopifyTitle}</strong></div>
            </div>
          :hasShopify&&missingSizes.length>0
            ?<div style={{background:"#fef6ed",border:"1px solid #fed7aa",borderRadius:10,padding:"10px 14px"}}>
                <div style={{fontSize:12,color:"#f08328",fontWeight:700}}>⚠ Shopify: Varianten nicht gefunden für {missingSizes.map(SZ).join(", ")}</div>
                <div style={{fontSize:11,color:"#f08328",marginTop:2}}>Bestand wird nicht vollständig aktualisiert.</div>
              </div>
            :<div style={{background:"#fef1f0",border:"1px solid #fecaca",borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",gap:8}}>
                <span style={{width:8,height:8,borderRadius:"50%",background:"#e84142",display:"inline-block",flexShrink:0}}/>
                <div style={{fontSize:12,color:"#e84142",fontWeight:700}}>Kein Shopify Produkt verknüpft — Bestand wird nicht aktualisiert.</div>
              </div>
      )}

      <div style={{fontSize:12,color:"#f08328",fontWeight:600}}>⚠ Kann nicht rückgängig gemacht werden.</div>
      <div style={{display:"flex",gap:10}}>
        <button type="button" onClick={onCancel} style={{flex:1,padding:13,borderRadius:10,border:"1px solid #e8e8e8",background:"none",color:"#666",cursor:"pointer",fontWeight:700}}>Abbrechen</button>
        <button type="button" onClick={onConfirm} disabled={!hasAny} style={{flex:2,padding:13,borderRadius:10,border:"none",background:hasAny?"#111":"#f0f0f0",color:hasAny?"#fff":"#bbb",cursor:hasAny?"pointer":"not-allowed",fontWeight:800,fontSize:14}}>✓ Bestätigen</button>
      </div>
    </ModalWrap>
  );
}

function BestellbedarfModal({prods,products,onClose}){
  const activeProds=prods.filter(p=>p.status!=="Fertig");
  const [openSize,setOpenSize]=useState(null);
  const bedarfMap={};
  const breakdownMap={};
  const isCapMap={};
  activeProds.forEach(prod=>{
    if(!bedarfMap[prod.blankId])bedarfMap[prod.blankId]={};
    if(!breakdownMap[prod.blankId])breakdownMap[prod.blankId]={};
    if(prod.isCapOrder){
      isCapMap[prod.blankId]=true;
      (prod.capColors||[]).forEach(cc=>{
        const key="cap_"+cc.id+"_"+cc.name;
        const q=cc.qty||0;
        bedarfMap[prod.blankId][key]=(bedarfMap[prod.blankId][key]||0)+q;
        if(q>0){
          if(!breakdownMap[prod.blankId][key])breakdownMap[prod.blankId][key]=[];
          breakdownMap[prod.blankId][key].push({name:prod.name,qty:q,colorHex:cc.hex,colorName:cc.name});
        }
      });
    } else {
      DEFAULT_SIZES.forEach(s=>{
        const q=(prod.qty||{})[s]||0;
        bedarfMap[prod.blankId][s]=(bedarfMap[prod.blankId][s]||0)+q;
        if(q>0){
          if(!breakdownMap[prod.blankId][s])breakdownMap[prod.blankId][s]=[];
          breakdownMap[prod.blankId][s].push({name:prod.name,qty:q,colorHex:prod.colorHex});
        }
      });
    }
  });
  return(
    <ModalWrap onClose={onClose} width={660}>
      <div style={{...F_HEAD_STYLE,fontSize:17,fontWeight:800,color:"#111"}}>Bestellbedarf</div>
      {Object.keys(bedarfMap).length===0&&<div style={{color:"#bbb",fontSize:14,textAlign:"center",padding:40}}>Keine aktiven Aufträge</div>}
      {Object.entries(bedarfMap).map(([blankId,sizeNeeds])=>{
        const blank=products.find(p=>p.id===blankId);if(!blank)return null;
        const isCap=isCapMap[blankId]||false;
        const relKeys=Object.keys(sizeNeeds).filter(k=>(sizeNeeds[k]||0)>0);
        return(
          <div key={blankId} style={{background:"#f8f8f8",borderRadius:14,padding:16}}>
            <div style={S.cardHdr}>
              <SmartDot item={blank} size={22}/>
              <div><div style={{...F_HEAD_STYLE,fontSize:15,fontWeight:800,color:"#111"}}>{blank.name}</div><div style={{fontSize:11,color:"#bbb"}}>{blank.color} · {blank.category}</div></div>
              
              <button type="button" disabled={allOrdered}
                style={{marginLeft:"auto",padding:"6px 14px",borderRadius:9,border:"none",background:allOrdered?"#e0e0e0":"#111",color:allOrdered?"#bbb":"#fff",fontSize:12,fontWeight:800,cursor:allOrdered?"not-allowed":"pointer",flexShrink:0,letterSpacing:0.5,opacity:allOrdered?0.6:1}}
                onClick={()=>{
                  if(allOrdered)return;
                  relKeys.forEach(key=>{
                    if(alreadyOrdered(key))return;
                    const needed=sizeNeeds[key]||0;
                    const isCapKey=key.startsWith("cap_");
                    const capColor=isCapKey?(blank.capColors||[]).find(cc=>"cap_"+cc.id+"_"+cc.name===key):null;
                    const avail=isCapKey?(capColor?.stock||0):((blank.stock||{})[key]||0);
                    const minStockVal=isCapKey?0:((blank.minStock||{})[key]||0);
                    const toOrderWithMin=Math.max(0,needed+minStockVal-avail);
                    if(toOrderWithMin>0) onBestellen(blank,key,isCapKey,capColor,toOrderWithMin);
                  });
                }}>{allOrdered?"✓ bestellt":"ALL"}</button>
            </div>
            <div style={S.col6}>
              {relKeys.map(key=>{
                const needed=sizeNeeds[key]||0;
                const isCapKey=key.startsWith("cap_");
                const capColor=isCapKey?(blank.capColors||[]).find(cc=>"cap_"+cc.id+"_"+cc.name===key):null;
                const avail=isCapKey?(capColor?.stock||0):((blank.stock||{})[key]||0);
                const minStock=isCapKey?0:((blank.minStock||{})[key]||0);
                const label=isCapKey?(capColor?.name||key.split("_").slice(2).join("_")):SZ(key);
                const toOrder=Math.max(0,needed-avail);
                const toOrderWithMin=Math.max(0,needed+minStock-avail);
                const ok=toOrder===0;
                const okWithMin=toOrderWithMin===0;
                return(
                <div key={key} style={{background:"#fff",borderRadius:10,border:`1px solid ${ok?"#bbf7d0":"#fcc8c6"}`,overflow:"hidden"}}>
                  <div onClick={()=>setOpenSize(o=>o===`${blankId}-${key}`?null:`${blankId}-${key}`)}
                    style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",cursor:"pointer",userSelect:"none"}}>
                    <span style={{fontSize:12,color:"#bbb",width:12}}>{openSize===`${blankId}-${key}`?"▾":"▸"}</span>
                    {isCapKey&&capColor?<ColorDot hex={capColor.hex} size={16}/>:null}
                    <span style={S.sizeTag}>{label}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:11,color:"#888"}}>Produktion: <strong style={{color:"#111"}}>{needed}</strong> · Lager: <strong style={{color:avail>=needed?"#1a9a50":"#e84142"}}>{avail}</strong></div>
                      {minStock>0&&<div style={{fontSize:10,color:"#bbb",marginTop:1}}>Sollbestand: {minStock} Stk</div>}
                    </div>
                    <div style={S.pill(ok)}>
                      <div style={S.pillLbl(ok)}>PRODUKTION</div>
                      <div style={S.pillNum(ok)}>{toOrder}</div>
                    </div>
                    {minStock>0&&<div style={{background:okWithMin?"#ddfce6":"#f0fdf4",borderRadius:8,padding:"4px 10px",textAlign:"center",minWidth:52,border:`1px solid ${okWithMin?"#bbf7d0":"#bbf7d0"}`}}>
                      <div style={{fontSize:9,color:okWithMin?"#1a9a50":"#1a9a50",fontWeight:700}}>MAX</div>
                      <div style={{...F_HEAD_STYLE,fontSize:18,fontWeight:900,color:okWithMin?"#1a9a50":"#1a9a50",lineHeight:1}}>{toOrderWithMin}</div>
                    </div>}
                  </div>
                  {openSize===`${blankId}-${key}`&&(
                    <div style={{borderTop:"1px solid #f0f0f0",padding:"8px 14px 10px 14px",background:"#fafafa",display:"flex",flexDirection:"column",gap:5}}>
                      <div style={{fontSize:10,color:"#bbb",fontWeight:700,letterSpacing:0.6,marginBottom:2}}>AUFTRÄGE</div>
                      {(breakdownMap[blankId]?.[key]||[]).map((item,i)=>(
                        <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 8px",background:"#fff",borderRadius:8,border:"1px solid #ebebeb"}}>
                          <ColorDot hex={item.colorHex} size={14}/>
                          <span style={{flex:1,fontSize:12,fontWeight:600,color:"#333"}}>{item.name}</span>
                          <span style={{fontSize:13,fontWeight:900,color:"#111"}}>{item.qty} Stk</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );})}
            </div>
          </div>
        );
      })}
      <div style={{display:"flex",gap:8}}>

        <button type="button" onClick={onClose} style={{flex:1,padding:13,borderRadius:10,border:"1px solid #e8e8e8",background:"none",color:"#888",cursor:"pointer",fontWeight:700,fontSize:14}}>Schließen</button>
      </div>
    </ModalWrap>
  );
}


// ─── DTF Modal ────────────────────────────────────────────────────
function DtfModal({initial, onClose, onSave}){
  const [name, setName] = useState(initial?.name || "");
  const [stock, setStock] = useState(initial?.stock || 0);
  const [minStock, setMinStock] = useState(initial?.minStock || 0);
  const [designsPerMeter, setDesignsPerMeter] = useState(initial?.designsPerMeter || 1);
  const [pricePerMeter, setPricePerMeter] = useState(initial?.pricePerMeter!=null?String(initial.pricePerMeter):"9");

  const dpm = Math.max(1, designsPerMeter);
  const ppm = parseFloat(pricePerMeter)||null;
  const pricePerPiece = ppm!=null ? ppm/dpm : null;

  const save = () => {
    if(!name.trim()) return;
    onSave({ id: initial?.id || Date.now().toString(), name: name.trim(), stock, minStock, designsPerMeter, pricePerMeter: ppm });
  };

  return(
    <ModalWrap onClose={onClose} width={400} onSave={save} footer={<div style={{display:"flex",gap:10}}><button type="button" onClick={()=>onClose()} style={{flex:1,padding:13,borderRadius:10,border:"1px solid #e8e8e8",background:"none",color:"#888",cursor:"pointer",fontWeight:700,fontSize:14}}>Abbrechen</button><button type="button" onClick={()=>save()} style={{flex:2,padding:13,borderRadius:10,border:"none",background:"#1a9a50",color:"#fff",cursor:"pointer",fontWeight:800,fontSize:15}}>{initial?"✓ Speichern":"✓ Anlegen"}</button></div>}>
      <div style={{...F_HEAD_STYLE,fontSize:17,fontWeight:800}}>{initial ? "DTF bearbeiten" : "DTF anlegen"}</div>
      <div>
        <div style={{fontSize:11,color:"#bbb",fontWeight:700,letterSpacing:0.8,marginBottom:6}}>NAME</div>
        <input
          style={{background:"#f8f8f8",border:"1.5px solid #e8e8e8",borderRadius:10,color:"#111",padding:"12px 14px",fontSize:15,width:"100%",outline:"none",boxSizing:"border-box"}}
          placeholder="z.B. Gemeindebau Front Print"
          value={name}
          onChange={e=>setName(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&save()}
          autoFocus={false}
        />
      </div>
      <div>
        <div style={{fontSize:11,color:"#bbb",fontWeight:700,letterSpacing:0.8,marginBottom:8}}>STÜCKZAHL</div>
        <DtfStockInput value={stock} onChange={setStock}/>
      </div>
      <div>
        <div style={{fontSize:11,color:"#bbb",fontWeight:700,letterSpacing:0.8,marginBottom:8}}>SOLLBESTAND (MIN)</div>
        <DtfStockInput value={minStock} onChange={setMinStock}/>
      </div>
      <div>
        <div style={{fontSize:11,color:"#bbb",fontWeight:700,letterSpacing:0.8,marginBottom:4}}>DESIGNS PRO METER</div>
        <div style={{fontSize:11,color:"#bbb",marginBottom:8}}>Wie viele Folien/Designs passen auf 1 Meter?</div>
        <DtfStockInput value={designsPerMeter} onChange={v=>setDesignsPerMeter(Math.max(1,v))}/>
      </div>
      <div>
        <div style={{fontSize:11,color:"#bbb",fontWeight:700,letterSpacing:0.8,marginBottom:4}}>PREIS PRO METER (€)</div>
        <div style={{position:"relative"}}>
          <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:"#bbb",fontSize:14,fontWeight:700,pointerEvents:"none"}}>€</span>
          <input type="number" min="0" step="0.01" placeholder="z.B. 10.00" value={pricePerMeter} onChange={e=>setPricePerMeter(e.target.value)}
            style={{background:"#f8f8f8",border:"1.5px solid #e8e8e8",borderRadius:10,color:"#111",padding:"12px 14px",paddingLeft:28,fontSize:15,width:"100%",outline:"none",boxSizing:"border-box"}}/>
        </div>
        {pricePerPiece!=null&&<div style={{fontSize:11,color:"#4078e0",marginTop:6,fontWeight:700}}>= €{pricePerPiece.toFixed(2)} pro Folie/Design</div>}
      </div>
    </ModalWrap>
  );
}

function DtfStockInput({value, onChange}){
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef(null);
  const startEdit = () => { setDraft(String(value)); setEditing(true); setTimeout(()=>inputRef.current?.select(),30); };
  const commit = () => { const n=parseInt(draft); if(!isNaN(n)&&n>=0) onChange(n); setEditing(false); };
  return(
    <div style={{display:"flex",alignItems:"center",gap:12,justifyContent:"center",background:"#f8f8f8",borderRadius:12,padding:"16px"}}>
      <button type="button" onClick={()=>onChange(Math.max(0,value-1))} style={{width:44,height:44,borderRadius:10,border:"none",background:"#fef1f0",color:"#e84142",fontSize:24,cursor:"pointer",fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
      {editing
        ? <input ref={inputRef} type="number" inputMode="numeric" pattern="[0-9]*" value={draft}
            onChange={e=>setDraft(e.target.value)}
            onBlur={commit}
            data-inlineedit="1" onKeyDown={e=>{if(e.key==="Enter")commit();if(e.key==="Escape")setEditing(false);}}
            style={{width:90,textAlign:"center",fontSize:32,fontWeight:900,border:"2px solid #3b82f6",borderRadius:12,padding:"10px 8px",outline:"none",background:"#fff"}}/>
        : <span onDoubleClick={startEdit} style={{width:90,textAlign:"center",fontSize:32,fontWeight:900,color:"#111",cursor:"text",padding:"10px 8px",borderRadius:12,border:"2px solid transparent",display:"inline-block"}}
            title="Doppelklick zum Bearbeiten">{value}</span>
      }
      <button type="button" onClick={()=>onChange(value+1)} style={{width:44,height:44,borderRadius:10,border:"none",background:"#ddfce6",color:"#1a9a50",fontSize:24,cursor:"pointer",fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
    </div>
  );
}

// ─── DTF Card ─────────────────────────────────────────────────────
function DtfStockNum({value, onChange}){
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const ref = useRef(null);
  const start = () => { setDraft(String(value)); setEditing(true); setTimeout(()=>ref.current?.select(),30); };
  const commit = () => { const n=parseInt(draft); if(!isNaN(n)&&n>=0) onChange(n); setEditing(false); };
  return editing
    ? <input ref={ref} type="number" inputMode="numeric" value={draft}
        onChange={e=>setDraft(e.target.value)}
        onBlur={commit}
        data-inlineedit="1" onKeyDown={e=>{if(e.key==="Enter")commit();if(e.key==="Escape")setEditing(false);}}
        style={{width:90,textAlign:"center",fontSize:32,fontWeight:900,border:"2px solid #3b82f6",borderRadius:12,padding:"8px",outline:"none",background:"#fff"}}/>
    : <span onDoubleClick={start} style={{...F_HEAD_STYLE,fontSize:32,fontWeight:900,color:"#111",cursor:"text",display:"inline-block",minWidth:60,textAlign:"center"}} title="Doppelklick zum Bearbeiten">{value}</span>;
}

function DtfCard({item, onUpdate, onDelete, onEdit, linkedProds}){
  const mobile = useIsMobile();
  const adj = (d) => onUpdate({...item, stock: Math.max(0, item.stock + d)});

  return(
    <div style={{background:"#fff",borderRadius:14,padding:mobile?"14px 14px":"16px 20px",border:"1px solid #ebebeb",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
        <div style={{width:36,height:36,borderRadius:10,background:"#111",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><IC_PRINT size={18} color="#fff"/></div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:14,fontWeight:800,color:"#111"}}>{item.name}</div>
          {linkedProds.length>0&&<div style={{fontSize:11,color:"#4078e0",fontWeight:600,marginTop:2}}>
            <IC_LINK size={11} color="#4078e0"/> {linkedProds.map(p=>p.name).join(", ")}
          </div>}
          {item.designsPerMeter>1&&<div style={{fontSize:11,color:"#888",marginTop:2}}><IC_RULER size={11} color="#888"/> {item.designsPerMeter} Designs/m</div>}
        </div>
        <button onClick={onEdit} style={{padding:"6px 12px",borderRadius:8,border:"1px solid #e8e8e8",background:"#fff",color:"#555",fontSize:12,fontWeight:700,cursor:"pointer"}}><PENCIL/></button>
        <button onClick={onDelete} style={{padding:"6px 10px",borderRadius:8,border:"1px solid #fee2e2",background:"#fff",color:"#e84142",fontSize:12,fontWeight:700,cursor:"pointer"}}>✕</button>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:16,background:"#f8f8f8",borderRadius:12,padding:"12px 16px"}}>
        <button onClick={()=>adj(-1)} style={{width:44,height:44,borderRadius:10,border:"none",background:"#fef1f0",color:"#e84142",fontSize:24,cursor:"pointer",fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
        <div style={{flex:1,textAlign:"center"}}>
          <DtfStockNum value={item.stock} onChange={v=>onUpdate({...item,stock:Math.max(0,v)})}/>
          <div style={{fontSize:10,color:"#bbb",fontWeight:700,marginTop:2}}>STÜCK AUF LAGER</div>
        </div>
        <button onClick={()=>adj(1)} style={{width:44,height:44,borderRadius:10,border:"none",background:"#ddfce6",color:"#1a9a50",fontSize:24,cursor:"pointer",fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
      </div>
    </div>
  );
}

// ─── DTF View ─────────────────────────────────────────────────────
function DtfView({dtfItems, prods, onUpdate, onDelete, onEdit, onAdd}){
  const mobile = useIsMobile();
  return(
    <div style={mobile?{display:"flex",flexDirection:"column",gap:12}:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:12}}>
      {dtfItems.length===0&&(
        <div style={{color:"#ccc",fontSize:14,padding:60,textAlign:"center",gridColumn:"1 / -1"}}>
          <div style={{marginBottom:12}}><IC_PRINT size={40} color="#ccc"/></div>
          Noch keine DTF-Transfers angelegt
        </div>
      )}
      {dtfItems.map(item=>{
        const linkedProds = prods.filter(p=>p.dtfId===item.id && p.status!=="Fertig");
        return <DtfCard key={item.id} item={item}
          onUpdate={onUpdate}
          onDelete={()=>onDelete(item.id)}
          onEdit={()=>onEdit(item)}
          linkedProds={linkedProds}/>;
      })}
    </div>
  );
}


// ─── Verluste View ───────────────────────────────────────────────
function VerlustTab({products, dtfItems, verluste, setVerluste, promoGifts, setPromoGifts}){
  const [showAddFehler, setShowAddFehler] = useState(false);
  const [showAddPromo, setShowAddPromo] = useState(false);
  const [grouped, setGrouped] = useState(false);
  const [fProd, setFProd] = useState("");
  const [fGrund, setFGrund] = useState("Druckfehler");
  const [fDtf, setFDtf] = useState("");
  const [fAnzahl, setFAnzahl] = useState(1);
  const [fNotiz, setFNotiz] = useState("");
  const [pName, setPName] = useState("");
  const [pInfo, setPInfo] = useState("");
  const [pPreis, setPPreis] = useState("");
  const [pAnzahl, setPAnzahl] = useState(1);
  const STICK_PAUSCHALE = 1.60;

  const getDtfPreis = (dtf) => {
    if(!dtf||!dtf.pricePerMeter) return 0;
    return dtf.pricePerMeter / Math.max(1,dtf.designsPerMeter||1);
  };
  const calcFehlerPreis = () => {
    const prod = products.find(p=>p.id===fProd);
    const dtf = dtfItems.find(d=>d.id===fDtf);
    const blankPreis = prod?.buyPrice||0;
    if(fGrund==="Kaputtes Blank") return blankPreis;
    if(fGrund==="Stickfehler") return blankPreis + STICK_PAUSCHALE;
    if(fGrund==="Druckfehler") return blankPreis + getDtfPreis(dtf);
    return blankPreis;
  };
  const addFehler = () => {
    if(!fProd) return;
    if(fGrund==="Druckfehler"&&!fDtf) return;
    const prod = products.find(p=>p.id===fProd);
    const dtf = dtfItems.find(d=>d.id===fDtf);
    const preisProStk = calcFehlerPreis();
    setVerluste(v=>[{id:Date.now().toString(),produktId:prod.id,produktName:prod.name,produktHex:prod.colorHex||"#ccc",grund:fGrund,dtfName:dtf?.name||null,anzahl:fAnzahl,preisProStk,gesamt:preisProStk*fAnzahl,notiz:fNotiz,datum:new Date().toISOString()},...v]);
    setFProd("");setFGrund("Druckfehler");setFDtf("");setFAnzahl(1);setFNotiz("");
    setShowAddFehler(false);
  };
  const addPromo = () => {
    if(!pName.trim()) return;
    setPromoGifts(g=>[{id:Date.now().toString(),name:pName.trim(),info:pInfo.trim(),preis:parseFloat(pPreis)||0,anzahl:pAnzahl,gesamt:(parseFloat(pPreis)||0)*pAnzahl,datum:new Date().toISOString()},...g]);
    setPName("");setPInfo("");setPPreis("");setPAnzahl(1);
    setShowAddPromo(false);
  };

  const totalFehler = verluste.reduce((a,v)=>a+v.gesamt,0);
  const totalPromo = promoGifts.reduce((a,g)=>a+g.gesamt,0);
  const inp = {padding:"10px 14px",borderRadius:10,border:"1.5px solid #e8e8e8",fontSize:14,outline:"none",width:"100%",boxSizing:"border-box"};

  // Combined + sorted list
  const allItems = [
    ...verluste.map(v=>({...v,_type:"fehler",_date:v.datum,_amount:v.gesamt})),
    ...promoGifts.map(g=>({...g,_type:"promo",_date:g.datum,_amount:g.gesamt}))
  ].sort((a,b)=>new Date(b._date)-new Date(a._date));

  const renderItem = (item) => {
    if(item._type==="fehler") return(
      <div key={item.id} style={{background:"#fff",borderRadius:12,padding:"12px 16px",border:"1px solid #ebebeb",display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:10,height:10,borderRadius:"50%",background:item.produktHex,flexShrink:0,border:"1px solid #ddd"}}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,fontWeight:800,color:"#111",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.produktName}</div>
          <div style={{fontSize:11,color:"#bbb"}}>{item.grund}{item.dtfName?` + ${item.dtfName}`:""}{item.notiz?` · ${item.notiz}`:""} · {new Date(item.datum).toLocaleDateString("de-AT")}</div>
        </div>
        <div style={{textAlign:"right",flexShrink:0}}>
          <div style={{fontSize:14,fontWeight:800,color:"#e84142"}}>−€{item.gesamt.toFixed(2)}</div>
          <div style={{fontSize:11,color:"#bbb"}}>{item.anzahl} Stk · €{(item.preisProStk||0).toFixed(2)}/St</div>
        </div>
        <button onClick={()=>setVerluste(vv=>vv.filter(x=>x.id!==item.id))} style={{width:28,height:28,borderRadius:"50%",border:"none",background:"#fef1f0",color:"#e84142",cursor:"pointer",fontSize:14,fontWeight:900,flexShrink:0}}>✕</button>
      </div>
    );
    return(
      <div key={item.id} style={{background:"#fff",borderRadius:12,padding:"12px 16px",border:"1px solid #ebebeb",display:"flex",alignItems:"center",gap:12}}>
        <IC_GIFT size={16} color="#f08328"/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,fontWeight:800,color:"#111",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</div>
          <div style={{fontSize:11,color:"#bbb"}}>{item.info?`${item.info} · `:""}{new Date(item.datum).toLocaleDateString("de-AT")}</div>
        </div>
        <div style={{textAlign:"right",flexShrink:0}}>
          <div style={{fontSize:14,fontWeight:800,color:"#f08328"}}>−€{item.gesamt.toFixed(2)}</div>
          <div style={{fontSize:11,color:"#bbb"}}>{item.anzahl} Stk · €{item.preis.toFixed(2)}/St</div>
        </div>
        <button onClick={()=>setPromoGifts(gg=>gg.filter(x=>x.id!==item.id))} style={{width:28,height:28,borderRadius:"50%",border:"none",background:"#fef6ed",color:"#f08328",cursor:"pointer",fontSize:14,fontWeight:900,flexShrink:0}}>✕</button>
      </div>
    );
  };

  return(
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      {/* Action buttons */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
        <button onClick={()=>setShowAddFehler(true)} style={{padding:"10px 12px",borderRadius:10,border:"1px solid #fecaca",background:"#fef1f0",color:"#e84142",fontSize:12,fontWeight:800,cursor:"pointer"}}>+ Fehler</button>
        <button onClick={()=>setShowAddPromo(true)} style={{padding:"10px 12px",borderRadius:10,border:"1px solid #fed7aa",background:"#fef6ed",color:"#f08328",fontSize:12,fontWeight:800,cursor:"pointer"}}>+ Promo</button>
        <button onClick={()=>setGrouped(g=>!g)} style={{padding:"10px 12px",borderRadius:10,border:"1px solid #e8e8e8",background:grouped?"#f0f0f0":"#fff",color:"#555",fontSize:12,fontWeight:800,cursor:"pointer"}}>{grouped?"↕ Gemischt":"↕ Gruppiert"}</button>
      </div>

      {allItems.length===0&&<div style={{textAlign:"center",padding:40,color:"#ccc",fontSize:14}}>Keine Einträge</div>}

      {!grouped&&<div style={{display:"flex",flexDirection:"column",gap:8}}>
        {allItems.map(renderItem)}
      </div>}

      {grouped&&<>
        {verluste.length>0&&<div style={{display:"flex",flexDirection:"column",gap:8}}>
          <div style={{fontSize:11,fontWeight:700,color:"#e84142",letterSpacing:0.8,padding:"4px 2px"}}>PRODUKTIONSFEHLER · −€{totalFehler.toFixed(2)}</div>
          {verluste.map(v=>renderItem({...v,_type:"fehler"}))}
        </div>}
        {promoGifts.length>0&&<div style={{display:"flex",flexDirection:"column",gap:8,marginTop:verluste.length>0?8:0}}>
          <div style={{fontSize:11,fontWeight:700,color:"#f08328",letterSpacing:0.8,padding:"4px 2px"}}>PROMO & GIFTS · −€{totalPromo.toFixed(2)}</div>
          {promoGifts.map(g=>renderItem({...g,_type:"promo"}))}
        </div>}
      </>}
      {showAddFehler&&(
        <ModalWrap onClose={()=>setShowAddFehler(false)} onSave={addFehler} width={480}>
          <div style={{...F_HEAD_STYLE,fontSize:16,fontWeight:800}}>Produktionsfehler eintragen</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <select style={inp} value={fProd} onChange={e=>setFProd(e.target.value)}>
              <option value="">— Produkt (Blank) wählen —</option>
              {products.map(p=>(<option key={p.id} value={p.id}>{p.name}{p.buyPrice!=null?` (€${p.buyPrice.toFixed(2)}/St)`:""}</option>))}
            </select>
            <select style={inp} value={fGrund} onChange={e=>{setFGrund(e.target.value);setFDtf("");}}>
              <option>Druckfehler</option>
              <option>Stickfehler</option>
              <option>Kaputtes Blank</option>
            </select>
            {fGrund==="Druckfehler"&&(
              <select style={inp} value={fDtf} onChange={e=>setFDtf(e.target.value)}>
                <option value="">— DTF Design wählen —</option>
                {(dtfItems||[]).filter(d=>d.pricePerMeter).map(d=>{
                  const p=d.pricePerMeter/Math.max(1,d.designsPerMeter||1);
                  return <option key={d.id} value={d.id}>{d.name} (€{p.toFixed(2)}/Design)</option>;
                })}
              </select>
            )}
            {fGrund==="Stickfehler"&&(
              <div style={{background:"#f8f8f8",borderRadius:10,padding:"10px 14px",fontSize:12,color:"#888"}}>
                Stickpauschale: <strong style={{color:"#111"}}>€{STICK_PAUSCHALE.toFixed(2)}</strong>
              </div>
            )}
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <label style={{fontSize:12,color:"#888",fontWeight:700,flexShrink:0}}>Anzahl</label>
              <button onClick={()=>setFAnzahl(a=>Math.max(1,a-1))} style={{width:32,height:32,borderRadius:8,border:"none",background:"#fef1f0",color:"#e84142",fontSize:18,cursor:"pointer",fontWeight:800}}>−</button>
              <span style={{fontSize:20,fontWeight:900,minWidth:30,textAlign:"center"}}>{fAnzahl}</span>
              <button onClick={()=>setFAnzahl(a=>a+1)} style={{width:32,height:32,borderRadius:8,border:"none",background:"#ddfce6",color:"#1a9a50",fontSize:18,cursor:"pointer",fontWeight:800}}>+</button>
            </div>
            <input style={inp} placeholder="Notiz (optional)" value={fNotiz} onChange={e=>setFNotiz(e.target.value)}/>
            {fProd&&<div style={{background:"#fef1f0",borderRadius:10,padding:"10px 14px",fontSize:13,fontWeight:700,color:"#e84142"}}>
              Verlust: €{(calcFehlerPreis()*fAnzahl).toFixed(2)}
              <span style={{fontSize:11,fontWeight:400,color:"#bbb",marginLeft:8}}>({fAnzahl} × €{calcFehlerPreis().toFixed(2)})</span>
            </div>}
          </div>
          <div style={{display:"flex",gap:10,marginTop:4}}>
            <button type="button" onClick={()=>setShowAddFehler(false)} style={{flex:1,padding:12,borderRadius:10,border:"1px solid #e8e8e8",background:"none",color:"#888",cursor:"pointer",fontWeight:700,fontSize:14}}>Abbrechen</button>
            <button type="button" onClick={addFehler} style={{flex:2,padding:12,borderRadius:10,border:"none",background:"#e84142",color:"#fff",cursor:"pointer",fontWeight:800,fontSize:14}}>Eintragen</button>
          </div>
        </ModalWrap>
      )}
      {showAddPromo&&(
        <ModalWrap onClose={()=>setShowAddPromo(false)} onSave={addPromo} width={480}>
          <div style={{...F_HEAD_STYLE,fontSize:16,fontWeight:800}}>Promo Gift eintragen</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <input style={inp} placeholder="Name (z.B. @influencer)" value={pName} onChange={e=>setPName(e.target.value)}/>
            <input style={inp} placeholder="Info (z.B. Hoodie Black XL)" value={pInfo} onChange={e=>setPInfo(e.target.value)}/>
            <div style={{display:"flex",gap:10}}>
              <div style={{flex:1,position:"relative"}}>
                <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:"#bbb",fontSize:14,fontWeight:700}}>€</span>
                <input style={{...inp,paddingLeft:28}} placeholder="Preis" type="number" min="0" step="0.01" value={pPreis} onChange={e=>setPPreis(e.target.value)}/>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <button onClick={()=>setPAnzahl(a=>Math.max(1,a-1))} style={{width:32,height:32,borderRadius:8,border:"none",background:"#fef6ed",color:"#f08328",fontSize:18,cursor:"pointer",fontWeight:800}}>−</button>
                <span style={{fontSize:20,fontWeight:900,minWidth:30,textAlign:"center"}}>{pAnzahl}</span>
                <button onClick={()=>setPAnzahl(a=>a+1)} style={{width:32,height:32,borderRadius:8,border:"none",background:"#fef6ed",color:"#f08328",fontSize:18,cursor:"pointer",fontWeight:800}}>+</button>
              </div>
            </div>
            {pPreis&&<div style={{background:"#fef6ed",borderRadius:10,padding:"10px 14px",fontSize:13,fontWeight:700,color:"#f08328"}}>Gesamt: €{((parseFloat(pPreis)||0)*pAnzahl).toFixed(2)}</div>}
          </div>
          <div style={{display:"flex",gap:10,marginTop:4}}>
            <button type="button" onClick={()=>setShowAddPromo(false)} style={{flex:1,padding:12,borderRadius:10,border:"1px solid #e8e8e8",background:"none",color:"#888",cursor:"pointer",fontWeight:700,fontSize:14}}>Abbrechen</button>
            <button type="button" onClick={addPromo} style={{flex:2,padding:12,borderRadius:10,border:"none",background:"#f08328",color:"#fff",cursor:"pointer",fontWeight:800,fontSize:14}}>Eintragen</button>
          </div>
        </ModalWrap>
      )}
      <div style={{background:"#f0f0f0",borderRadius:14,padding:"18px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><div style={{fontSize:11,color:"#555",fontWeight:700,letterSpacing:0.8}}>GESAMTVERLUST</div><div style={{fontSize:11,color:"#999",marginTop:3}}>Fehler: −€{totalFehler.toFixed(2)} · Promo: −€{totalPromo.toFixed(2)}</div></div>
        <div style={{...F_HEAD_STYLE,fontSize:32,fontWeight:900,color:"#e84142"}}>−€{(totalFehler+totalPromo).toFixed(2)}</div>
      </div>
    </div>
  );
}

function FinanceView({products, dtfItems=[], verluste=[], setVerluste, promoGifts=[], setPromoGifts, sheetsUrl}){
  const mobile = useIsMobile();
  const [open,setOpen]=useState({});
  const [finTab,setFinTab]=useState("dashboard");
  const toggle=(id)=>setOpen(o=>({...o,[id]:!o[id]}));
  const grandTotal=products.reduce((a,p)=>{if(p.buyPrice==null)return a;const q=totalStock(p);return a+q*p.buyPrice;},0);
  const grandQty=products.reduce((a,p)=>a+(totalStock(p)),0);
  const dtfTotal=(dtfItems||[]).reduce((a,d)=>{
    if(!d.pricePerMeter) return a;
    return a+(d.pricePerMeter/Math.max(1,d.designsPerMeter||1))*(d.stock||0);
  },0);
  // Shopify finance state
  const [shopProds,setShopProds]=useState([]);
  const [shopLoading,setShopLoading]=useState(false);
  const [shopOpen,setShopOpen]=useState({});
  // Cache-only shopify (Shopify tab fills the cache)
  useEffect(()=>{
    const cached=shopCacheGet("shopify_products");
    if(cached){setShopProds(cached);return;}
  },[finTab]);
  // Poll for cache if empty
  useEffect(()=>{
    if(shopProds.length>0)return;
    const iv=setInterval(()=>{const c=shopCacheGet("shopify_products");if(c){setShopProds(c);clearInterval(iv);}},1000);
    return ()=>clearInterval(iv);
  },[shopProds.length]);
  // Filter out Online Exclusives
  const shopFiltered=shopProds.filter(sp=>!ONLINE_EXCLUSIVE_PRODUCTS.some(oe=>sp.title.toUpperCase().includes(oe.toUpperCase())));
  const shopGrandQty=shopFiltered.reduce((a,sp)=>(sp.variants||[]).reduce((b,v)=>b+(v.inventory_quantity||0),0)+a,0);
  const shopGrandValue=shopFiltered.reduce((a,sp)=>(sp.variants||[]).reduce((b,v)=>b+(v.inventory_quantity||0)*parseFloat(v.price||0),0)+a,0);
  return(
    <div style={S.col12}>
      <div style={{display:"flex",gap:6,background:"#e8e8e8",borderRadius:12,padding:4,overflowX:"auto"}}>
        {[["dashboard","Dashboard",IC_GRID4],["blanks","Blanks",IC_SHIRT],["dtf","DTF",IC_ROLL],["shopify","Shopify",IC_SHOP],["verluste","Verluste",IC_TREND_DOWN]].map(([v,lbl,Icon])=>(
          <button key={v} onClick={()=>setFinTab(v)} style={{flex:"1 0 auto",padding:"8px 12px",borderRadius:9,border:"none",background:finTab===v?"#fff":"transparent",color:finTab===v?"#111":"#666",cursor:"pointer",fontWeight:700,fontSize:12,boxShadow:finTab===v?"0 1px 3px rgba(0,0,0,0.08)":"none",display:"flex",alignItems:"center",justifyContent:"center",gap:4,whiteSpace:"nowrap"}}><Icon size={12} color={finTab===v?"#111":"#999"}/>{lbl}</button>
        ))}
      </div>
      {finTab==="dashboard"&&(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {/* Verlust totals for dashboard */}
          {(()=>{
            const verlusteTotal=verluste.reduce((a,v)=>a+v.gesamt,0)+promoGifts.reduce((a,g)=>a+g.gesamt,0);
            const allTotal=grandTotal+dtfTotal+shopGrandValue-verlusteTotal;
            return <>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div style={{background:"#fff",borderRadius:14,padding:mobile?"14px 14px":"18px 20px",border:"1px solid #ebebeb"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><IC_TSHIRT size={16} color="#111"/><div style={{fontSize:11,color:"#999",fontWeight:700,letterSpacing:0.5}}>BLANKS</div></div>
                  <div style={{...F_HEAD_STYLE,fontSize:mobile?20:28,fontWeight:900,color:"#1a9a50"}}>€{grandTotal.toFixed(2)}</div>
                  <div style={{fontSize:11,color:"#bbb",marginTop:4}}>{grandQty} Stück</div>
                </div>
                <div style={{background:"#fff",borderRadius:14,padding:mobile?"14px 14px":"18px 20px",border:"1px solid #ebebeb"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><IC_PRINT size={16} color="#111"/><div style={{fontSize:11,color:"#999",fontWeight:700,letterSpacing:0.5}}>DTF</div></div>
                  <div style={{...F_HEAD_STYLE,fontSize:mobile?20:28,fontWeight:900,color:"#1a9a50"}}>€{dtfTotal.toFixed(2)}</div>
                  <div style={{fontSize:11,color:"#bbb",marginTop:4}}>{(dtfItems||[]).reduce((a,d)=>a+(d.stock||0),0)} Stück</div>
                </div>
                <div style={{background:"#fff",borderRadius:14,padding:mobile?"14px 14px":"18px 20px",border:"1px solid #ebebeb"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><IC_SHOP size={16} color="#96bf48"/><div style={{fontSize:11,color:"#999",fontWeight:700,letterSpacing:0.5}}>SHOPIFY</div></div>
                  <div style={{...F_HEAD_STYLE,fontSize:mobile?20:28,fontWeight:900,color:"#1a9a50"}}>€{shopGrandValue.toFixed(2)}</div>
                  <div style={{fontSize:11,color:"#bbb",marginTop:4}}>{shopGrandQty} Stück{shopProds.length===0?" · Laden...":""}</div>
                </div>
                <div style={{background:"#fff",borderRadius:14,padding:mobile?"14px 14px":"18px 20px",border:"1px solid #ebebeb"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><IC_LOSS size={16} color="#e84142"/><div style={{fontSize:11,color:"#999",fontWeight:700,letterSpacing:0.5}}>VERLUSTE</div></div>
                  <div style={{...F_HEAD_STYLE,fontSize:mobile?20:28,fontWeight:900,color:"#e84142"}}>−€{verlusteTotal.toFixed(2)}</div>
                  <div style={{fontSize:11,color:"#bbb",marginTop:4}}>{verluste.length+promoGifts.length} Einträge</div>
                </div>
              </div>
              <div style={{background:"#ddfce6",borderRadius:14,padding:mobile?"18px 16px":"22px 24px",display:"flex",justifyContent:"space-between",alignItems:"center",border:"1px solid #bbf7d0",gap:10}}>
                <div style={{flexShrink:0}}>
                  <div style={{fontSize:12,color:"#1a9a50",fontWeight:700,letterSpacing:0.8}}>GRAND TOTAL</div>

                </div>
                <div style={{...F_HEAD_STYLE,fontSize:mobile?26:38,fontWeight:900,color:"#111"}}>€{allTotal.toFixed(2)}</div>
              </div>
            </>;
          })()}
        </div>
      )}
      {finTab==="dtf"&&(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {(dtfItems||[]).filter(d=>d.pricePerMeter).map(d=>{
            const preisProDesign=d.pricePerMeter/Math.max(1,d.designsPerMeter||1);
            return(
              <div key={d.id} style={{background:"#fff",borderRadius:12,padding:"12px 16px",border:"1px solid #ebebeb",display:"flex",alignItems:"center",gap:12}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{...F_HEAD_STYLE,fontSize:13,fontWeight:800,color:"#111"}}>{d.name}</div>
                  <div style={{fontSize:11,color:"#bbb"}}>€{d.pricePerMeter?.toFixed(2)}/m · {d.designsPerMeter||1} Design/m → <strong style={{color:"#111"}}>€{preisProDesign.toFixed(2)}/Design</strong></div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontSize:14,fontWeight:800,color:"#111"}}>€{(preisProDesign*(d.stock||0)).toFixed(2)}</div>
                  <div style={{fontSize:11,color:"#bbb"}}>{d.stock||0} Stk</div>
                </div>
              </div>
            );
          })}
          {(dtfItems||[]).filter(d=>!d.pricePerMeter).length>0&&(
            <div style={{fontSize:12,color:"#bbb",textAlign:"center",padding:"8px 0"}}>
              {(dtfItems||[]).filter(d=>!d.pricePerMeter).length} Design(s) ohne Meterpreis hinterlegt
            </div>
          )}
          <div style={{background:"#f0f0f0",borderRadius:14,padding:"18px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div><div style={{fontSize:11,color:"#555",fontWeight:700,letterSpacing:0.8}}>DTF LAGERBESTAND</div><div style={{fontSize:11,color:"#999",marginTop:3}}>{(dtfItems||[]).filter(d=>d.pricePerMeter).reduce((a,d)=>a+(d.stock||0),0)} Stück total</div></div>
            <div style={{...F_HEAD_STYLE,fontSize:32,fontWeight:900,color:"#1a9a50"}}>€{dtfTotal.toFixed(2)}</div>
          </div>
        </div>
      )}
      {finTab==="blanks"&&<>{products.map(p=>{
        const isCap=(p.capColors?.length>0);
        const qty=isCap?(p.capColors||[]).reduce((a,c)=>a+c.stock,0):Object.values(p.stock||{}).reduce((a,b)=>a+b,0);
        const tot=p.buyPrice!=null?qty*p.buyPrice:null;
        const isOpen=open[p.id];
        return(
          <div key={p.id} style={{background:"#fff",borderRadius:14,border:"1px solid #ebebeb",overflow:"hidden"}}>
            <div onClick={()=>toggle(p.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"14px 16px",cursor:"pointer",userSelect:"none"}}>
              <span style={{fontSize:12,color:"#bbb"}}>{isOpen?"▾":"▸"}</span>
              <SmartDot item={p} size={20}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{...F_HEAD_STYLE,fontSize:14,fontWeight:700,color:"#111",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                <div style={{fontSize:11,color:"#bbb"}}>{p.color||p.category}</div>
              </div>
              <span style={{fontSize:11,background:"#f0f0f0",color:"#555",borderRadius:6,padding:"2px 8px",fontWeight:700,flexShrink:0}}>{p.category}</span>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontSize:14,fontWeight:800,color:"#111"}}>{tot!=null?`€${tot.toFixed(2)}`:"—"}</div>
                <div style={{fontSize:11,color:"#bbb"}}>{qty} Stk{p.buyPrice!=null?` · €${p.buyPrice.toFixed(2)}/St`:""}</div>
              </div>
            </div>
            {isOpen&&(
              <div style={{background:"#fafafa",padding:"8px 16px 14px",borderTop:"1px solid #f0f0f0"}}>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {isCap?(p.capColors||[]).map(c=>{const sv=p.buyPrice!=null?c.stock*p.buyPrice:null;return(
                    <div key={c.id} style={{background:"#fff",border:"1px solid #ebebeb",borderRadius:10,padding:"8px 10px",textAlign:"center",minWidth:70,flex:1}}>
                      <div style={{display:"flex",alignItems:"center",gap:5,justifyContent:"center",marginBottom:3}}><div style={{width:12,height:12,borderRadius:"50%",background:c.hex,border:"1.5px solid #444"}}/><div style={{fontSize:10,color:"#bbb",fontWeight:800}}>{c.name}</div></div>
                      <div style={{fontSize:20,fontWeight:900,color:c.stock===0?"#e84142":c.stock<=LOW_STOCK?"#f08328":"#111"}}>{c.stock}</div>
                      {sv!=null&&<div style={{fontSize:10,color:"#bbb",marginTop:2}}>€{sv.toFixed(2)}</div>}
                    </div>
                  )})
                  :DEFAULT_SIZES.map(size=>{const s=(p.stock||{})[size]??0,sv=p.buyPrice!=null?s*p.buyPrice:null;return(
                    <div key={size} style={{background:"#fff",border:"1px solid #ebebeb",borderRadius:10,padding:"8px 10px",textAlign:"center",minWidth:60,flex:1}}>
                      <div style={{fontSize:10,color:"#bbb",fontWeight:800,marginBottom:3}}>{SZ(size)}</div>
                      <div style={{fontSize:20,fontWeight:900,color:s===0?"#e84142":s<=LOW_STOCK?"#f08328":"#111"}}>{s}</div>
                      {sv!=null&&<div style={{fontSize:10,color:"#bbb",marginTop:2}}>€{sv.toFixed(2)}</div>}
                    </div>
                  )})}
                </div>
              </div>
            )}
          </div>
        );
      })}
      <div style={{background:"#f0f0f0",borderRadius:14,padding:"18px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><div style={{fontSize:11,color:"#555",fontWeight:700,letterSpacing:0.8}}>BLANKS LAGERWERT</div><div style={{fontSize:11,color:"#999",marginTop:3}}>{grandQty} Stück total</div></div>
        <div style={{...F_HEAD_STYLE,fontSize:32,fontWeight:900,color:"#1a9a50"}}>€{grandTotal.toFixed(2)}</div>
      </div>
      </>}
      {finTab==="verluste"&&(()=>{
        const STICK_PAUSCHALE=1.60;
        const getDtfPreis=(dtf)=>dtf?.pricePerMeter?dtf.pricePerMeter/Math.max(1,dtf.designsPerMeter||1):0;
        const calcFehlerPreis=(fProd,fGrund,fDtf,products,dtfItems)=>{
          const prod=products.find(p=>p.id===fProd);
          const dtf=(dtfItems||[]).find(d=>d.id===fDtf);
          const blankPreis=prod?.buyPrice||0;
          if(fGrund==="Kaputtes Blank") return blankPreis;
          if(fGrund==="Stickfehler") return blankPreis+STICK_PAUSCHALE;
          if(fGrund==="Druckfehler") return blankPreis+getDtfPreis(dtf);
          return blankPreis;
        };
        return <VerlustTab products={products} dtfItems={dtfItems} verluste={verluste} setVerluste={setVerluste} promoGifts={promoGifts} setPromoGifts={setPromoGifts}/>;
      })()}
      {finTab==="shopify"&&(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {shopLoading&&<div style={{textAlign:"center",padding:40,color:"#bbb"}}>⟳ Lade Shopify Produkte...</div>}
          {!shopLoading&&shopFiltered.map(sp=>{
            const variants=sp.variants||[];
            const totalQty=variants.reduce((a,v)=>a+(v.inventory_quantity||0),0);
            const totalValue=variants.reduce((a,v)=>a+(v.inventory_quantity||0)*parseFloat(v.price||0),0);
            const isOpen=shopOpen[sp.id];
            return(
              <div key={sp.id} style={{background:"#fff",borderRadius:14,border:"1px solid #ebebeb",overflow:"hidden"}}>
                <div onClick={()=>setShopOpen(o=>({...o,[sp.id]:!o[sp.id]}))} style={{display:"flex",alignItems:"center",gap:10,padding:"14px 16px",cursor:"pointer",userSelect:"none"}}>
                  <span style={{fontSize:12,color:"#bbb"}}>{isOpen?"▾":"▸"}</span>
                  {sp.images?.[0]?.src
                    ?<img src={sp.images[0].src} style={{width:28,height:28,borderRadius:6,objectFit:"cover",flexShrink:0}} alt=""/>
                    :<div style={{width:28,height:28,borderRadius:6,background:"#f0f0f0",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><IC_TSHIRT size={14} color="#bbb"/></div>}
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:700,color:"#111",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sp.title}</div>
                    <div style={{fontSize:11,color:"#bbb"}}>{variants.length} Varianten</div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{...F_HEAD_STYLE,...F_HEAD_STYLE,fontSize:14,fontWeight:800,color:"#111"}}>€{totalValue.toFixed(2)}</div>
                    <div style={{fontSize:11,color:"#bbb"}}>{totalQty} Stk</div>
                  </div>
                </div>
                {isOpen&&(
                  <div style={{background:"#fafafa",borderTop:"1px solid #f0f0f0"}}>
                    {variants.map(v=>{
                      const qty=v.inventory_quantity||0;
                      const price=parseFloat(v.price||0);
                      const lineTotal=qty*price;
                      return(
                        <div key={v.id} style={{display:"flex",alignItems:"center",padding:"8px 16px",borderTop:"1px solid #f0f0f0",fontSize:13}}>
                          <div style={{flex:1,minWidth:0,fontWeight:600,color:"#333"}}>{v.title||"Default"}</div>
                          <div style={{width:50,textAlign:"right",fontSize:12,color:"#888"}}>{qty} Stk</div>
                          <div style={{width:60,textAlign:"right",fontSize:12,color:"#888"}}>€{price.toFixed(2)}</div>
                          <div style={{width:80,textAlign:"right",fontSize:13,fontWeight:800,color:"#111"}}>€{lineTotal.toFixed(2)}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          {!shopLoading&&<div style={{background:"#f0f0f0",borderRadius:14,padding:"18px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div><div style={{fontSize:11,color:"#555",fontWeight:700,letterSpacing:0.8}}>SHOPIFY WARENWERT</div><div style={{fontSize:11,color:"#bbb",marginTop:3}}>{shopGrandQty} Stück · {shopFiltered.length} Produkte</div></div>
            <div style={{...F_HEAD_STYLE,fontSize:32,fontWeight:900,color:"#1a9a50"}}>€{shopGrandValue.toFixed(2)}</div>
          </div>}
        </div>
      )}
    </div>
  );
}



// ─── Restock Order Modal ─────────────────────────────────────────
function RestockOrderModal({product, variants, blank, dtf, restockMin, restockDefault, onConfirm, onClose}){
  const mobile = useIsMobile();
  const blankMinStock = blank?.minStock||{};
  const parseSize = (title) => {
    const parts = (title||"").split("/").map(p=>p.trim().toUpperCase());
    for(const p of parts){ if(restockMin[p]!==undefined) return p; }
    return null;
  };
  const initQty = {};
  (variants||[]).forEach(v=>{
    const sz = parseSize(v.title);
    const label = sz || v.title.split("/").pop().trim();
    // Use blank's SOLL stock for deficit, fall back to restock min
    const sollVal = sz ? (blankMinStock[sz]||0) : 0;
    const minVal = sz ? restockMin[sz] : restockDefault;
    const target = sollVal > 0 ? sollVal : minVal;
    const current = v.inventory_quantity||0;
    const deficit = Math.max(0, target - current);
    initQty[label] = deficit;
  });
  const [qty, setQty] = useState(initQty);
  const setSize = (label, val) => setQty(q=>({...q,[label]:Math.max(0,val)}));
  const totalQty = Object.values(qty).reduce((a,b)=>a+b,0);

  return(
    <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.5)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}>
      <div style={{background:"#fff",borderRadius:18,width:500,maxWidth:"95vw",maxHeight:"88vh",display:"flex",flexDirection:"column",boxShadow:"0 8px 40px rgba(0,0,0,0.2)"}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:"18px 20px 14px",borderBottom:"1px solid #f0f0f0",flexShrink:0}}>
          <div style={{...F_HEAD_STYLE,fontSize:16,fontWeight:800}}>Restock Auftrag</div>
          <div style={{fontSize:12,color:"#bbb",marginTop:2}}>{product.title} → {blank.name}</div>
        </div>
        <div style={{overflowY:"auto",padding:"16px 20px",flex:1}}>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {Object.entries(qty).map(([label, val])=>{
              const v = (variants||[]).find(x=>(parseSize(x.title)||x.title.split("/").pop().trim())===label);
              const current = v?.inventory_quantity||0;
              const sollVal = blankMinStock[label.toUpperCase()]||0;
              const minVal = restockMin[label.toUpperCase()]!==undefined ? restockMin[label.toUpperCase()] : restockDefault;
              const target = sollVal > 0 ? sollVal : minVal;
              return(
                <div key={label} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,
                  background:val>0?"#fef6ed":"#f8f8f8",border:`1px solid ${val>0?"#fcd5a8":"#e8e8e8"}`,
                  borderRadius:12,padding:"10px 6px",flex:1,minWidth:mobile?60:70}}>
                  <span style={{...F_HEAD_STYLE,fontSize:14,fontWeight:800,color:val>0?"#8c4318":"#666"}}>{label}</span>
                  <div style={{fontSize:10,color:"#bbb"}}>{current}/{target}</div>
                  <div style={{display:"flex",alignItems:"center",gap:4}}>
                    <button onClick={()=>setSize(label,val-1)} style={{width:26,height:26,borderRadius:7,border:"none",background:"#fef1f0",color:"#e84142",fontSize:16,cursor:"pointer",fontWeight:800}}>−</button>
                    <span style={{...F_HEAD_STYLE,fontSize:22,fontWeight:900,minWidth:28,textAlign:"center",color:val>0?"#f08328":"#ccc"}}>{val}</span>
                    <button onClick={()=>setSize(label,val+1)} style={{width:26,height:26,borderRadius:7,border:"none",background:"#ddfce6",color:"#1a9a50",fontSize:16,cursor:"pointer",fontWeight:800}}>+</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{padding:"12px 20px 20px",borderTop:"1px solid #f0f0f0",flexShrink:0,display:"flex",gap:10}}>
          <button type="button" onClick={onClose} style={{flex:1,padding:13,borderRadius:10,border:"1px solid #e8e8e8",background:"none",color:"#888",cursor:"pointer",fontWeight:700,fontSize:14}}>Abbrechen</button>
          <button type="button" disabled={totalQty===0} onClick={()=>onConfirm(qty)}
            style={{flex:2,padding:13,borderRadius:10,border:"none",background:totalQty>0?"#1a9a50":"#e0e0e0",color:totalQty>0?"#fff":"#bbb",cursor:totalQty>0?"pointer":"not-allowed",fontWeight:800,fontSize:15}}>
            Auftrag erstellen · {totalQty} Stk
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Restock View ─────────────────────────────────────────────────
const RESTOCK_MIN = {XXS:2,XS:2,S:3,M:4,L:5,XL:4,XXL:2,XXXL:1};
const RESTOCK_DEFAULT = 5;

function RestockView({sheetsUrl, products, dtfItems, shopifyLinks, onAddProd}){
  const mobile = useIsMobile();
  const [shopProds,setShopProds]=useState([]);
  const [loading,setLoading]=useState(false);
  const [reloading,setReloading]=useState(false);
  const [search,setSearch]=useState("");
  const [restockModal,setRestockModal]=useState(null);
  const [hiddenIds,setHiddenIds]=useState([]);
  const [showHidden,setShowHidden]=useState(false);

  // Load from cache, or fetch directly from Shopify API
  useEffect(()=>{
    const cached=shopCacheGet("shopify_products");
    if(cached){setShopProds(cached);setLoading(false);return;}
    // No cache – fetch directly
    if(sheetsUrl){
      setLoading(true);
      fetch(`${sheetsUrl}?action=shopify_products`,{redirect:"follow"})
        .then(r=>r.text()).then(t=>{const d=JSON.parse(t);if(d.products){setShopProds(d.products);shopCacheSet("shopify_products",d.products);}setLoading(false);})
        .catch(()=>setLoading(false));
    }
    // Load hidden IDs from Sheets if available
    if(!sheetsUrl)return;
    fetch(`${sheetsUrl}?action=restock_hidden`,{redirect:"follow"})
      .then(r=>r.text()).then(t=>{try{const d=JSON.parse(t);if(d.hidden)setHiddenIds(d.hidden);}catch(e){}})
      .catch(()=>{});
  },[sheetsUrl]);

  // Reload Shopify products fresh from API
  const reloadShopify = async () => {
    if(!sheetsUrl||reloading)return;
    setReloading(true);
    try{
      const r=await fetch(`${sheetsUrl}?action=shopify_products`,{redirect:"follow"});
      const t=await r.text();
      const d=JSON.parse(t);
      if(d.products){setShopProds(d.products);shopCacheSet("shopify_products",d.products);}
    }catch(e){console.warn("Restock reload failed",e);}
    setReloading(false);
  };

  // Re-check cache periodically (picks up data loaded by Shopify tab)
  useEffect(()=>{
    if(shopProds.length>0)return;
    const iv=setInterval(()=>{const c=shopCacheGet("shopify_products");if(c){setShopProds(c);setLoading(false);clearInterval(iv);}},1000);
    return ()=>clearInterval(iv);
  },[shopProds.length]);

  const saveHidden = async (ids) => {
    setHiddenIds(ids);
    if(!sheetsUrl)return;
    try{await fetch(sheetsUrl,{method:"POST",redirect:"follow",headers:{"Content-Type":"text/plain"},body:JSON.stringify({action:"restock_save_hidden",hidden:ids})});}catch(e){console.log("saveHidden not available yet");}
  };
  const hideProduct = (productId) => saveHidden([...hiddenIds, String(productId)]);
  const unhideProduct = (productId) => saveHidden(hiddenIds.filter(id=>id!==String(productId)));

  // Parse size from variant title (check all segments)
  const parseSize = (title) => {
    const parts = (title||"").split("/").map(p=>p.trim().toUpperCase());
    for(const p of parts){ if(RESTOCK_MIN[p]!==undefined) return p; }
    return null;
  };

  // Build restock items: variants below min stock
  const restockItems = useMemo(()=>{
    const items = [];
    shopProds.forEach(sp=>{
      const variants = sp.variants||[];
      const lowVariants = variants.filter(v=>{
        const size = parseSize(v.title);
        const min = size ? RESTOCK_MIN[size] : RESTOCK_DEFAULT;
        return (v.inventory_quantity||0) < min;
      });
      if(lowVariants.length>0){
        items.push({product:sp, variants:lowVariants});
      }
    });
    return items;
  },[shopProds]);

  const filtered = search
    ? restockItems.filter(r=>!hiddenIds.includes(String(r.product.id))&&r.product.title.toLowerCase().includes(search.toLowerCase()))
    : restockItems.filter(r=>!hiddenIds.includes(String(r.product.id)));

  const hiddenItems = restockItems.filter(r=>hiddenIds.includes(String(r.product.id)));

  const totalLowVariants = filtered.reduce((a,r)=>a+r.variants.length,0);

  if(loading||(!sheetsUrl&&shopProds.length===0)) return <div style={{textAlign:"center",padding:60,color:"#bbb"}}>{!sheetsUrl?"Shopify nicht verfügbar im Demo-Modus":"Shopify Produkte laden... Öffne den Shopify-Tab zum Laden."}</div>;

  const displayItems = showHidden ? hiddenItems : filtered;

  return(
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      <div style={{background:"#fef6ed",borderRadius:12,padding:"12px 16px",border:"1px solid #fed7aa",display:"flex",alignItems:"center",gap:10}}>
        <IC_WARN size={16} color="#f08328"/>
        <div style={{fontSize:13,color:"#8c4318",fontWeight:600}}>{totalLowVariants} Variante{totalLowVariants!==1?"n":""} unter Mindestbestand bei {filtered.length} Produkt{filtered.length!==1?"en":""}</div>
      </div>

      <div style={{display:"flex",gap:6,alignItems:"center"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Produkt suchen..."
          style={{padding:"10px 14px",borderRadius:10,border:"1px solid #e8e8e8",fontSize:14,outline:"none",flex:1,boxSizing:"border-box",background:"#f8f8f8"}}/>
        <button onClick={reloadShopify} disabled={reloading} title="Shopify Daten neu laden" style={{padding:"10px 12px",borderRadius:10,border:"1px solid #e8e8e8",background:reloading?"#f8f8f8":"#fff",color:reloading?"#ccc":"#555",cursor:reloading?"not-allowed":"pointer",fontSize:12,fontWeight:700,whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:5}}>
          <IC_REFRESH size={13} color={reloading?"#ccc":"#555"} style={reloading?{animation:"spin 1s linear infinite"}:{}}/>{reloading?"...":""}
        </button>
        <button onClick={()=>setShowHidden(!showHidden)} style={{padding:"10px 14px",borderRadius:10,border:`1px solid ${showHidden?"#e84142":"#e8e8e8"}`,background:showHidden?"#fef1f0":"#fff",color:showHidden?"#e84142":"#888",fontSize:12,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:5}}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
          Hidden{hiddenItems.length>0?` (${hiddenItems.length})`:""}
        </button>
      </div>

      {displayItems.length===0&&<div style={{color:"#ccc",fontSize:14,padding:60,textAlign:"center"}}>{showHidden?"Keine versteckten Produkte":"Alle Produkte ausreichend bestockt"}</div>}

      {displayItems.map(({product:sp, variants:lowVars})=>{
        const allVars = sp.variants||[];
        const totalInv = allVars.reduce((a,v)=>a+(v.inventory_quantity||0),0);
        const img = sp.image?.src || sp.images?.[0]?.src;
        // Group variants by color
        const ALL_SIZES_SET = new Set(["XXS","XS","S","M","L","XL","XXL","XXXL","OS","ONE SIZE","O/S"]);
        const getColor = (v) => {
          const parts = (v.title||"").split("/").map(p=>p.trim());
          if(parts.length<=1){if(ALL_SIZES_SET.has((parts[0]||"").toUpperCase())) return "_default_"; return parts[0]||"_default_";}
          const firstIsSize = ALL_SIZES_SET.has(parts[0].toUpperCase());
          if(firstIsSize) return parts.length>1?parts.slice(1).join("/"):"_default_";
          const lastIsSize = ALL_SIZES_SET.has(parts[parts.length-1].toUpperCase());
          if(lastIsSize) return parts.slice(0,-1).join("/");
          return parts[0];
        };
        const colorMap = {};
        allVars.forEach(v=>{const color=getColor(v);if(!colorMap[color])colorMap[color]=[];colorMap[color].push(v);});
        const colorGroups = Object.entries(colorMap);
        const hasMultipleColors = colorGroups.length > 1;
        return(
          <div key={sp.id} style={{background:"#fff",borderRadius:16,border:"1px solid #ebebeb",overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
            {/* Product header */}
            <div style={{padding:"14px 18px",display:"flex",alignItems:"center",gap:12}}>
              {img?<img src={img} style={{width:40,height:40,borderRadius:10,objectFit:"cover",flexShrink:0}}/>
                  :<div style={{width:40,height:40,borderRadius:10,background:"#f0f0f0",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><IC_TSHIRT size={18} color="#ccc"/></div>}
              <div style={{flex:1,minWidth:0}}>
                <div style={{...F_HEAD_STYLE,fontSize:15,fontWeight:800,color:"#111",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sp.title}</div>
                <div style={{fontSize:11,color:"#bbb",marginTop:2}}>{allVars.length} Varianten{hasMultipleColors?` · ${colorGroups.length} Farben`:""} · {totalInv} Stk</div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{...F_HEAD_STYLE,fontSize:24,fontWeight:900,color:"#f08328",lineHeight:1}}>{lowVars.length}</div>
                <div style={{fontSize:10,color:"#bbb",fontWeight:700,letterSpacing:0.5,marginTop:2}}>LOW</div>
              </div>
              {showHidden?
                <button onClick={()=>unhideProduct(sp.id)} title="Wieder anzeigen" style={{width:32,height:32,borderRadius:8,border:"1px solid #dcfce7",background:"#f0fdf4",color:"#1a9a50",cursor:"pointer",fontSize:14,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>↩</button>
              :
                <button onClick={()=>hideProduct(sp.id)} title="Ausblenden" style={{width:32,height:32,borderRadius:8,border:"1px solid #e8e8e8",background:"#fff",color:"#bbb",cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                </button>
              }
            </div>
            {/* Color groups */}
            {(()=>{
              const isColorOnly = hasMultipleColors && colorGroups.every(([,cvs])=>cvs.length===1);
              if(isColorOnly){
                // Color-only: one flat row of color tiles + single link info
                const productLink = shopifyLinks.find(l=>String(l.shopifyProductId)===String(sp.id)&&l.linkLevel!=="color");
                const blank = productLink?products.find(p=>p.id===productLink.gkbsProductId):null;
                const dtf = blank?(dtfItems||[]).find(d=>(blank.veredelung||[]).includes("Drucken")&&d.linkedProducts?.includes(blank.id)):null;
                return(
                  <div style={{borderTop:"1px solid #f0f0f0"}}>
                    <div style={{display:"flex",alignItems:"center",padding:"8px 18px",gap:8}}>
                      {blank?<div style={{fontSize:11,color:"#888",flex:1}}>
                        <IC_LINK size={10} color="#4078e0"/> <span style={{color:"#4078e0",fontWeight:700}}>{blank.name}</span>
                        {dtf&&<span style={{color:"#bbb"}}> · DTF: {dtf.name}</span>}
                      </div>:<div style={{flex:1,fontSize:11,color:"#ccc",fontStyle:"italic"}}>Kein Blank verknüpft</div>}
                      {blank&&<button onClick={()=>setRestockModal({product:sp,variants:allVars,blank,dtf,lowVars})} style={{padding:"5px 12px",borderRadius:8,border:"none",background:"#1a9a50",color:"#fff",cursor:"pointer",fontWeight:800,fontSize:11,flexShrink:0,display:"flex",alignItems:"center",gap:4}}>
                        <IC_PROD size={11} color="#fff"/> Auftrag
                      </button>}
                    </div>
                    <div style={{padding:"6px 18px 14px",display:"flex",gap:6,flexWrap:"wrap",flexDirection:mobile?"column":"row"}}>
                      {colorGroups.map(([color, cvars])=>{
                        const v=cvars[0];
                        const qty=v.inventory_quantity||0;
                        const min=RESTOCK_DEFAULT;
                        const isOut=qty===0;
                        const label=color==="_default_"?"Default":color;
                        if(mobile) return(
                          <div key={color} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:10,background:isOut?"#f0f0f0":"#f8f8f8",opacity:isOut?0.6:1}}>
                            <span style={{...F_HEAD_STYLE,fontSize:14,fontWeight:800,color:isOut?"#bbb":"#333",minWidth:40}}>{label}</span>
                            <div style={{flex:1,fontSize:11,color:"#888"}}>Min: <strong style={{color:qty<min?"#e84142":"#bbb"}}>{min}</strong></div>
                            <span style={{...F_HEAD_STYLE,fontSize:20,fontWeight:900,color:isOut?"#bbb":qty<min?"#f08328":"#1a9a50"}}>{qty}</span>
                          </div>
                        );
                        return(
                          <div key={color} style={{
                            display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"space-between",gap:2,
                            background:isOut?"#f0f0f0":"#f8f8f8",
                            borderRadius:12,padding:"8px 8px 6px",flex:1,minWidth:0,position:"relative",height:92,opacity:isOut?0.6:1
                          }}>
                            <span style={{...F_HEAD_STYLE,fontSize:14,color:isOut?"#bbb":"#666",fontWeight:800,lineHeight:1}}>{label}</span>
                            <span style={{...F_HEAD_STYLE,fontSize:28,fontWeight:900,color:isOut?"#bbb":qty<min?"#f08328":"#1a9a50",lineHeight:1}}>{qty}</span>
                            {min>0&&<span style={{fontSize:9,color:qty<min?"#e84142":"#bbb",fontWeight:700}}>MIN: {min}</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }
              // Size-based: per-color sections
              return colorGroups.map(([color, cvars])=>{
              const groupInv = cvars.reduce((a,v)=>a+(v.inventory_quantity||0),0);
              const colorLink = shopifyLinks.find(l=>String(l.shopifyProductId)===String(sp.id)&&l.colorGroup===color&&l.linkLevel==="color");
              const productLink = shopifyLinks.find(l=>String(l.shopifyProductId)===String(sp.id)&&l.linkLevel!=="color");
              const effectiveLink = colorLink || productLink;
              const blank = effectiveLink?products.find(p=>p.id===effectiveLink.gkbsProductId):null;
              const dtf = blank?(dtfItems||[]).find(d=>(blank.veredelung||[]).includes("Drucken")&&d.linkedProducts?.includes(blank.id)):null;
              return(
                <div key={color} style={{borderTop:"1px solid #f0f0f0"}}>
                  {/* Color header */}
                  <div style={{display:"flex",alignItems:"center",padding:"8px 18px",gap:8,background:hasMultipleColors?"#fafafa":"transparent"}}>
                    {hasMultipleColors&&<IC_PAINT size={12} color="#555"/>}
                    {hasMultipleColors&&<span style={{fontSize:13,fontWeight:800,color:"#333"}}>{color==="_default_"?"Standard":color}</span>}
                    {blank?<div style={{fontSize:11,color:"#888",flex:1}}>
                      <IC_LINK size={10} color="#4078e0"/> <span style={{color:"#4078e0",fontWeight:700}}>{blank.name}</span>
                      {dtf&&<span style={{color:"#bbb"}}> · DTF: {dtf.name}</span>}
                    </div>:<div style={{flex:1,fontSize:11,color:"#ccc",fontStyle:"italic"}}>Kein Blank verknüpft</div>}
                    {hasMultipleColors&&<span style={{...F_HEAD_STYLE,fontSize:14,fontWeight:900,color:groupInv===0?"#e84142":groupInv<5?"#f08328":"#888"}}>{groupInv}</span>}
                    {blank&&<button onClick={()=>setRestockModal({product:sp,variants:cvars,blank,dtf,lowVars:cvars.filter(v=>{const sz=parseSize(v.title);const min=sz?RESTOCK_MIN[sz]:RESTOCK_DEFAULT;return(v.inventory_quantity||0)<min;})})} style={{padding:"5px 12px",borderRadius:8,border:"none",background:"#1a9a50",color:"#fff",cursor:"pointer",fontWeight:800,fontSize:11,flexShrink:0,display:"flex",alignItems:"center",gap:4}}>
                      <IC_PROD size={11} color="#fff"/> Auftrag
                    </button>}
                  </div>
                  {/* Size cells for this color group */}
                  <div style={{padding:"6px 18px 14px",display:"flex",gap:6,flexWrap:"wrap",flexDirection:mobile?"column":"row"}}>
                    {cvars.map(v=>{
                      const size = parseSize(v.title);
                      const sizeLabel = size || v.title.split("/").pop().trim();
                      const min = size ? RESTOCK_MIN[size] : RESTOCK_DEFAULT;
                      const qty = v.inventory_quantity||0;
                      const isOut = qty===0;
                      if(mobile) return(
                        <div key={v.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:10,background:isOut?"#f0f0f0":"#f8f8f8",opacity:isOut?0.6:1}}>
                          <span style={{...F_HEAD_STYLE,fontSize:14,fontWeight:800,color:isOut?"#bbb":"#333",minWidth:40}}>{sizeLabel}</span>
                          <div style={{flex:1,fontSize:11,color:"#888"}}>Min: <strong style={{color:qty<min?"#e84142":"#bbb"}}>{min}</strong></div>
                          <span style={{...F_HEAD_STYLE,fontSize:20,fontWeight:900,color:isOut?"#bbb":qty<min?"#f08328":"#1a9a50"}}>{qty}</span>
                        </div>
                      );
                      return(
                        <div key={v.id} style={{
                          display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"space-between",gap:2,
                          background:isOut?"#f0f0f0":"#f8f8f8",
                          borderRadius:12,padding:"8px 8px 6px",flex:1,minWidth:0,position:"relative",height:92,opacity:isOut?0.6:1
                        }}>
                          <span style={{...F_HEAD_STYLE,fontSize:16,color:isOut?"#bbb":"#666",fontWeight:800,lineHeight:1}}>{sizeLabel}</span>
                          <span style={{...F_HEAD_STYLE,fontSize:28,fontWeight:900,color:isOut?"#bbb":qty<min?"#f08328":"#1a9a50",lineHeight:1}}>{qty}</span>
                          {min>0&&<span style={{fontSize:9,color:qty<min?"#e84142":"#bbb",fontWeight:700}}>MIN: {min}</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            });})()}
          </div>
        );
      })}
      {restockModal&&<RestockOrderModal
        product={restockModal.product}
        variants={restockModal.variants}
        blank={restockModal.blank}
        dtf={restockModal.dtf}
        restockMin={RESTOCK_MIN}
        restockDefault={RESTOCK_DEFAULT}
        onClose={()=>setRestockModal(null)}
        onConfirm={(qty)=>{
          const {blank,dtf,product:sp}=restockModal;
          if(onAddProd)onAddProd({
            id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),
            name:"Restock: "+sp.title,blankId:blank.id,
            qty,done:{},status:"Offen",priority:"Hoch",
            veredelung:blank.veredelung||[],
            dtfDesignId:dtf?.id||null,dtfDesignName:dtf?.name||null,
            shopifyProductLink:null,
            createdAt:new Date().toISOString()
          });
          setRestockModal(null);
        }}
      />}
    </div>
  );
}


// ─── Scroll To Top Button ─────────────────────────────────────────
function ScrollTopButton(){
  const [show,setShow]=useState(false);
  useEffect(()=>{
    const onScroll=()=>setShow(window.scrollY>300);
    window.addEventListener("scroll",onScroll,{passive:true});
    return()=>window.removeEventListener("scroll",onScroll);
  },[]);
  if(!show)return null;
  return(
    <button onClick={()=>window.scrollTo({top:0,behavior:"smooth"})}
      style={{position:"fixed",bottom:24,right:16,width:42,height:42,borderRadius:"50%",background:"#111",color:"#fff",border:"none",fontSize:18,cursor:"pointer",zIndex:200,boxShadow:"0 2px 12px rgba(0,0,0,0.2)",display:"flex",alignItems:"center",justifyContent:"center"}}>
      ↑
    </button>
  );
}


// ─── Shopify View ─────────────────────────────────────────────────
function ShopifyView({products, prods, shopifyLinks, setShopifyLinks, setShopifyBadge, onAddProd, onSetBlankStock, sheetsUrl, orderFilter}){
  const mobile = useIsMobile();
  const [tab, setTab] = useState("products");
  const [shopifyProds, setShopifyProds] = useState([]);
  const [shopifyOrders, setShopifyOrders] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(null); // null=unknown, true, false
  const [syncMsg, setSyncMsg] = useState(null);
  const [linkModal, setLinkModal] = useState(null);
  const [prodSearch, setProdSearch] = useState("");
  const [expandedProds, setExpandedProds] = useState({});
  const [orderSubTab, setOrderSubTab] = useState("oe"); // "oe" | "all"
  const toggleExpand = (id) => setExpandedProds(prev=>({...prev,[id]:!prev[id]}));

  const apiFetch = async (action, params="") => {
    if(!sheetsUrl) return {};
    const r = await fetch(`${sheetsUrl}?action=${action}${params}`, {redirect:"follow"});
    return JSON.parse(await r.text());
  };
  const apiPost = async (body) => {
    if(!sheetsUrl) return {};
    const r = await fetch(sheetsUrl, {method:"POST", redirect:"follow", headers:{"Content-Type":"text/plain"}, body:JSON.stringify(body)});
    return JSON.parse(await r.text());
  };

  const loadAll = async (force) => {
    if(!sheetsUrl){setConnected(false);setLoading(false);return;}
    if(!force){
      const cp=shopCacheGet("shopify_products"),cl=shopCacheGet("shopify_locations");
      if(cp&&cl){setShopifyProds(cp);setLocations(cl);
        const cachedLinks=shopCacheGet("shopify_links");
        if(cachedLinks)setShopifyLinks(cachedLinks);
        setConnected(true);setLoading(false);return;}
    }
    setLoading(true); setError(null);
    try {
      const d1 = await apiFetch("shopify_products");
      if(d1.error){setError(d1.error);setConnected(false);}
      else{setShopifyProds(d1.products||[]);shopCacheSet("shopify_products",d1.products||[]);setConnected(true);}
      const locs = await apiFetch("shopify_locations");
      setLocations(locs.locations||[]);shopCacheSet("shopify_locations",locs.locations||[]);
      const linksData = await apiFetch("shopify_links");
      if(linksData.links){setShopifyLinks(linksData.links);shopCacheSet("shopify_links",linksData.links);}
    } catch(e) { setError(String(e)); setConnected(false); }
    setLoading(false);
  };

  const loadOrders = async (force) => {
    if(!sheetsUrl)return;
    if(!force){const co=shopCacheGet("shopify_orders");if(co){setShopifyOrders(co);return;}}
    setLoading(true); setError(null);
    try {
      const data = await apiFetch("shopify_orders","&status=open");
      if(data.error) setError(data.error);
      else{setShopifyOrders(data.orders||[]);shopCacheSet("shopify_orders",data.orders||[]);}
    } catch(e) { setError(String(e)); }
    setLoading(false);
  };

  const saveLinks = async (links) => {
    setShopifyLinks(links);shopCacheSet("shopify_links",links);
    await apiPost({action:"shopify_save_links", links});
  };

  const syncToShopify = async (link, qty) => {
    setSyncMsg("⟳ Synchronisiere...");
    const res = await apiPost({action:"shopify_adjust_inventory", location_id:link.shopifyLocationId, inventory_item_id:link.shopifyInventoryItemId, available_adjustment:qty});
    setSyncMsg(res.inventory_level?"✓ +"+qty+" zu Shopify addiert!":"⚠ Fehler beim Sync");
    setTimeout(()=>setSyncMsg(null),4000);
  };

  const [blankPickerData, setBlankPickerData] = useState(null); // {order, line, size}

  const createOrderFromLine = (order, line) => {
    // Extract size from variant title (e.g. "S / Black" → "S")
    // Extract size from variant title - try each part against known sizes
    const ALL_SIZES_CHECK = ["XXS","XS","S","M","L","XL","XXL","XXXL"];
    const variantParts = (line.variant_title||"").split("/").map(p=>p.trim());
    const size = variantParts.find(p=>ALL_SIZES_CHECK.some(s=>s.toLowerCase()===p.toLowerCase())) || variantParts[variantParts.length-1] || "M";
    // Show blank picker popup
    setBlankPickerData({order, line, size});
  };

  const confirmCreateOrder = (blankId) => {
    if(!blankPickerData) return;
    const {order, line, size} = blankPickerData;
    const blank = products.find(p=>p.id===blankId);
    // Build shopifyProductLink for auto-push on completion
    const shopifyProductLink = {
      shopifyProductId: String(line.product_id),
      title: line.title,
      variants: shopifyProds.find(p=>p.id==line.product_id)?.variants?.map(v=>({
        id:String(v.id), title:v.title, inventory_item_id:String(v.inventory_item_id)
      }))||[],
      locationId: locations[0]?.id ? String(locations[0].id) : "",
      locationName: locations[0]?.name||""
    };
    // Build full qty with all sizes, only ordered size gets qty
    const ALL_SIZES = ["XXS","XS","S","M","L","XL","XXL","XXXL"];
    const normalizedSize = ALL_SIZES.find(s=>s.toLowerCase()===size.toLowerCase())||size;
    const fullQty = Object.fromEntries(ALL_SIZES.map(s=>[s, s===normalizedSize?(line.quantity||1):0]));
    const fullDone = Object.fromEntries(ALL_SIZES.map(s=>[s,0]));
    const newProd = {
      id:"shopify_"+order.id+"_"+line.id,
      name:line.title,
      blankId: blankId||"",
      notes:`Shopify ${order.name} · ${normalizedSize}`,
      priority:"Hoch",
      status:"Geplant",
      veredelung:["Drucken"],
      colorHex:blank?.colorHex||"#888",
      isOnlineExclusive:true,
      shopifyOrderId:String(order.id),
      shopifyOrderName:order.name,
      shopifyProductLink,
      qty:fullQty,
      done:fullDone
    };
    onAddProd(newProd);
    setBlankPickerData(null);
    setSyncMsg("✓ Auftrag erstellt: "+newProd.name);
    setTimeout(()=>setSyncMsg(null),4000);
  };

  useEffect(()=>{ loadAll(); },[]);
  useEffect(()=>{ if(tab==="orders") loadOrders(); },[tab]);
  // Update parent badge with order qty (respects filter)
  useEffect(()=>{
    if(!setShopifyBadge) return;
    const norm=s=>(s||"").toUpperCase().replace(/[^A-Z0-9]/g,"");
    const oeNorms=ONLINE_EXCLUSIVE_PRODUCTS.map(norm);
    const unfulfilled=shopifyOrders.filter(o=>o.fulfillment_status!=="fulfilled");
    const count = unfulfilled.reduce((a,o)=>a+(o.line_items||[]).filter(l=>oeNorms.includes(norm(l.title))).reduce((b,l)=>b+(l.quantity||0),0),0);
    setShopifyBadge(count);
  },[shopifyOrders]);

  return(
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      {blankPickerData&&(
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.5)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setBlankPickerData(null)}>
          <div style={{background:"#fff",borderRadius:18,width:440,maxWidth:"95vw",boxShadow:"0 8px 40px rgba(0,0,0,0.2)"}} onClick={e=>e.stopPropagation()}>
            <div style={{padding:"18px 20px 14px",borderBottom:"1px solid #f0f0f0"}}>
              <div style={{...F_HEAD_STYLE,fontSize:16,fontWeight:800}}>Blank auswählen</div>
              <div style={{fontSize:12,color:"#bbb",marginTop:2}}>
                {blankPickerData.line.title} · Größe: <b style={{color:"#111"}}>{SZ(blankPickerData.size)}</b> · {blankPickerData.line.quantity}×
              </div>
            </div>
            <div style={{maxHeight:340,overflowY:"auto",padding:"12px 16px",display:"flex",flexDirection:"column",gap:6}}>
              {products.filter(p=>!(p.capColors?.length>0)).map(p=>{
                const stock = Object.values(p.stock||{}).reduce((a,b)=>a+b,0);
                const sizeStock = (p.stock||{})[blankPickerData.size]||0;
                return(
                  <button key={p.id} type="button" onClick={()=>confirmCreateOrder(p.id)}
                    style={{padding:"12px 14px",borderRadius:11,border:"1.5px solid #e8e8e8",background:"#f8f8f8",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:10}}>
                    <SmartDot item={p} size={18}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:800}}>{p.name}</div>
                      <div style={{fontSize:11,color:"#bbb"}}>{p.color||""} · {p.category}</div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <div style={{fontSize:10,color:"#bbb"}}>Gr. {SZ(blankPickerData.size)}</div>
                      <div style={{fontSize:18,fontWeight:900,color:sizeStock===0?"#e84142":sizeStock<3?"#f08328":"#1a9a50"}}>{sizeStock}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            <div style={{padding:"12px 20px 20px",borderTop:"1px solid #f0f0f0"}}>
              <button type="button" onClick={()=>setBlankPickerData(null)} style={{width:"100%",padding:12,borderRadius:10,border:"1px solid #e8e8e8",background:"none",color:"#888",cursor:"pointer",fontWeight:700,fontSize:14}}>Abbrechen</button>
            </div>
          </div>
        </div>
      )}
      {linkModal&&<ShopifyLinkModal prod={linkModal} products={products} sheetsUrl={sheetsUrl} links={shopifyLinks} shopifyProds={shopifyProds} locations={locations} onSave={async(links)=>{await saveLinks(links);setLinkModal(null);}} onClose={()=>setLinkModal(null)}/>}

      {/* Header */}
      <div style={{background:"#fff",borderRadius:14,padding:"14px 18px",border:"1px solid #ebebeb",display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:36,height:36,borderRadius:10,background:"#96bf48",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><IC_SHOP size={18} color="#fff"/></div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{...F_HEAD_STYLE,fontSize:15,fontWeight:800}}>Shopify Sync</div>
          <div style={{fontSize:11,color:"#bbb",display:"flex",alignItems:"center",gap:6,marginTop:2}}>
            <span style={{width:8,height:8,borderRadius:"50%",background:connected===true?"#1a9a50":connected===false?"#e84142":"#d1d5db",display:"inline-block",flexShrink:0}}/>
            <span>{connected===true?"Verbunden":connected===false?"Nicht verbunden":"..."} · {shopifyProds.length} Produkte</span>
          </div>
        </div>
        {syncMsg&&<div style={{fontSize:12,fontWeight:700,color:syncMsg.startsWith("✓")?"#1a9a50":"#f08328",padding:"6px 12px",background:syncMsg.startsWith("✓")?"#f0fdf4":"#fef6ed",borderRadius:8}}>{syncMsg}</div>}
        <button onClick={async()=>{await loadAll(true);await loadOrders(true);}} style={{padding:"8px 12px",borderRadius:9,border:"1px solid #e8e8e8",background:"#fff",color:"#555",cursor:"pointer",fontWeight:700,fontSize:13,display:"flex",alignItems:"center",gap:5}}><IC_REFRESH size={14} color="#555"/> Reload</button>
      </div>

      {/* Sub-tabs */}
      <div style={{display:"flex",gap:0,background:"#f0f0f0",borderRadius:12,padding:4}}>
        {[["products","Produkte",IC_HANGER,0],["orders","Bestellungen",IC_PACKAGE,(()=>{const norm=s=>(s||"").toUpperCase().replace(/[^A-Z0-9]/g,"");const oeNorms=ONLINE_EXCLUSIVE_PRODUCTS.map(norm);return shopifyOrders.filter(o=>o.fulfillment_status!=="fulfilled").reduce((a,o)=>a+(o.line_items||[]).filter(l=>oeNorms.includes(norm(l.title))).reduce((b,l)=>b+(l.quantity||0),0),0);})()]].map(([t,lbl,Icon,count])=>(
          <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:"7px 18px",borderRadius:9,border:"none",background:tab===t?"#fff":"transparent",color:tab===t?"#111":"#666",cursor:"pointer",fontWeight:700,fontSize:13,boxShadow:tab===t?"0 1px 3px rgba(0,0,0,0.08)":"none",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
            <Icon size={13} color={tab===t?"#111":"#999"}/>{lbl}{count>0&&<span style={{background:"#e84142",color:"#fff",borderRadius:20,padding:"1px 6px",fontSize:9,fontWeight:800}}>{count}</span>}
          </button>
        ))}
      </div>

      {error&&<div style={{background:"#fef1f0",border:"1px solid #fecaca",borderRadius:10,padding:"12px 16px",color:"#e84142",fontSize:13}}>⚠ {error} — Token korrekt eingetragen?</div>}
      {loading&&<div style={{textAlign:"center",padding:40,color:"#bbb"}}>⟳ Laden...</div>}

      {/* Products */}
      {tab==="products"&&!loading&&(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <input value={prodSearch} onChange={e=>setProdSearch(e.target.value)} placeholder="Produkt suchen..." style={{padding:"10px 14px",borderRadius:10,border:"1px solid #e8e8e8",fontSize:14,outline:"none",width:"100%",boxSizing:"border-box",background:"#f8f8f8"}}/>
          {shopifyProds.filter(sp=>!prodSearch||sp.title.toLowerCase().includes(prodSearch.toLowerCase())).length===0&&<div style={{color:"#ccc",fontSize:14,padding:60,textAlign:"center"}}>Keine Treffer</div>}
          {shopifyProds.filter(sp=>!prodSearch||sp.title.toLowerCase().includes(prodSearch.toLowerCase())).map(sp=>{
            const link = shopifyLinks.find(l=>l.shopifyProductId==sp.id&&l.linkLevel!=="variant");
            const gkbs = link ? products.find(p=>p.id===link.gkbsProductId) : null;
            const expanded = !!expandedProds[sp.id];
            const variants = sp.variants||[];
            const totalInv = variants.reduce((a,v)=>a+(v.inventory_quantity||0),0);
            const varLinkCount = shopifyLinks.filter(l=>l.shopifyProductId==String(sp.id)&&l.linkLevel==="color").length;
            return(
              <div key={sp.id} style={{background:"#fff",borderRadius:12,border:"1px solid #ebebeb",overflow:"hidden"}}>
                <div onClick={()=>toggleExpand(sp.id)} style={{padding:"14px 16px",display:"flex",gap:12,alignItems:"center",cursor:"pointer",userSelect:"none"}}>
                  {sp.images?.[0]?.src
                    ?<img src={sp.images[0].src} style={{width:48,height:48,borderRadius:8,objectFit:"cover",flexShrink:0}} alt=""/>
                    :<div style={{width:48,height:48,borderRadius:8,background:"#f0f0f0",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><IC_TSHIRT size={20} color="#bbb"/></div>}
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:800}}>{sp.title}</div>
                    <div style={{fontSize:11,color:"#bbb"}}>{variants.length} Varianten · {sp.status}</div>
                    {gkbs&&<div style={{fontSize:11,color:"#1a9a50",marginTop:2,fontWeight:700}}>✓ {gkbs.name}</div>}
                    {!gkbs&&varLinkCount>0&&<div style={{fontSize:11,color:"#4078e0",marginTop:2,fontWeight:700}}><IC_LINK size={11} color="#4078e0"/> {varLinkCount} Farbe{varLinkCount>1?"n":""} verknüpft</div>}
                  </div>
                  <div style={{textAlign:"right",flexShrink:0,marginRight:8}}>
                    <div style={{fontSize:10,color:"#bbb"}}>Gesamt</div>
                    <div style={{fontSize:20,fontWeight:900,color:totalInv===0?"#e84142":totalInv<10?"#f08328":"#111",lineHeight:1}}>{totalInv}</div>
                  </div>
                  <span style={{fontSize:14,color:"#bbb",flexShrink:0,transition:"transform 0.2s",transform:expanded?"rotate(180deg)":"rotate(0deg)"}}>▼</span>
                  <button onClick={e=>{e.stopPropagation();setLinkModal({...sp,_shopifyProd:true});}}
                    style={{width:40,height:40,borderRadius:10,border:"1px solid",borderColor:link?"#bbf7d0":varLinkCount>0?"#8db8f0":"#e8e8e8",background:link?"#f0fdf4":varLinkCount>0?"#edf4fe":"#f8f8f8",color:link?"#1a9a50":varLinkCount>0?"#4078e0":"#999",cursor:"pointer",fontWeight:700,fontSize:18,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>
                    <IC_LINK size={14} color="#4078e0"/>
                  </button>
                </div>
                {expanded&&variants.length>0&&(()=>{
                  // Group variants by color – extract from "Size / Color" format
                  const ALL_SIZES_SET = new Set(["XXS","XS","S","M","L","XL","XXL","XXXL","OS","ONE SIZE","O/S"]);
                  const getColor = (v) => {
                    const parts = (v.title||"").split("/").map(p=>p.trim());
                    if(parts.length <= 1) {
                      // No slash – if it's just a size, group together
                      if(ALL_SIZES_SET.has((parts[0]||"").toUpperCase())) return "_default_";
                      return parts[0] || "_default_";
                    }
                    // Check which part is a size – the other is the color
                    const firstIsSize = ALL_SIZES_SET.has(parts[0].toUpperCase());
                    const lastIsSize = ALL_SIZES_SET.has(parts[parts.length-1].toUpperCase());
                    if(firstIsSize && !lastIsSize) return parts.slice(1).join(" / ");
                    if(!firstIsSize && lastIsSize) return parts.slice(0, -1).join(" / ");
                    return parts[0];
                  };
                  const getSize = (v) => {
                    const parts = (v.title||"").split("/").map(p=>p.trim());
                    if(parts.length <= 1) return parts[0] || "";
                    const firstIsSize = ALL_SIZES_SET.has(parts[0].toUpperCase());
                    if(firstIsSize) return parts[0];
                    const lastIsSize = ALL_SIZES_SET.has(parts[parts.length-1].toUpperCase());
                    if(lastIsSize) return parts[parts.length-1];
                    return parts[parts.length-1];
                  };
                  const colorMap = {};
                  variants.forEach(v=>{
                    const color = getColor(v);
                    if(!colorMap[color]) colorMap[color] = [];
                    colorMap[color].push(v);
                  });
                  const colorGroups = Object.entries(colorMap);
                  const hasMultipleColors = colorGroups.length > 1;
                  const isColorOnly = hasMultipleColors && colorGroups.every(([,cvs])=>cvs.length===1);

                  return(
                  <div style={{borderTop:"1px solid #f0f0f0",padding:"6px 0"}}>
                    {isColorOnly
                      ?/* Color-only product: flat row per color */
                      colorGroups.map(([color, cvars],ci)=>{
                        const v=cvars[0];
                        const qty=v.inventory_quantity||0;
                        const colorLink = shopifyLinks.find(l=>l.shopifyProductId==String(sp.id)&&l.colorGroup===color&&l.linkLevel==="color");
                        const adjShopInvC=async(delta)=>{
                          if(!sheetsUrl)return;
                          const nq=Math.max(0,qty+delta);
                          setShopifyProds(ps=>ps.map(p=>p.id===sp.id?{...p,variants:(p.variants||[]).map(vv=>vv.id===v.id?{...vv,inventory_quantity:nq}:vv)}:p));
                          const updated=(shopCacheGet("shopify_products")||[]).map(p=>String(p.id)===String(sp.id)?{...p,variants:(p.variants||[]).map(vv=>vv.id===v.id?{...vv,inventory_quantity:nq}:vv)}:p);
                          shopCacheSet("shopify_products",updated);
                          try{await fetch(sheetsUrl,{method:"POST",redirect:"follow",headers:{"Content-Type":"text/plain"},body:JSON.stringify({action:"shopify_set_inventory",inventory_item_id:v.inventory_item_id,quantity:nq})});}catch(e){}
                        };
                        return(
                          <div key={color} style={{display:"flex",alignItems:"center",padding:"7px 16px",background:ci%2===0?"#fff":"#fafafa",fontSize:13,gap:8}}>
                            <IC_PAINT size={11} color="#888"/>
                            <div style={{flex:1,minWidth:0,fontWeight:600,color:"#333"}}>{color==="_default_"?"Default":color}</div>
                            <div style={{fontSize:12,color:"#888",flexShrink:0}}>€{Number(v.price||0).toFixed(0)}</div>
                            <div style={{display:"flex",alignItems:"center",gap:3,flexShrink:0}}>
                              <button onClick={e=>{e.stopPropagation();adjShopInvC(-1);}} disabled={qty===0} style={{width:22,height:22,borderRadius:6,border:"none",background:qty===0?"#f0f0f0":"#fef1f0",color:qty===0?"#ccc":"#e84142",fontSize:14,cursor:qty===0?"not-allowed":"pointer",fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>−</button>
                              <span style={{...F_HEAD_STYLE,fontSize:15,fontWeight:900,minWidth:28,textAlign:"center",color:qty===0?"#e84142":qty<=3?"#f08328":"#1a9a50"}}>{qty}</span>
                              <button onClick={e=>{e.stopPropagation();adjShopInvC(1);}} style={{width:22,height:22,borderRadius:6,border:"none",background:"#ddfce6",color:"#1a9a50",fontSize:14,cursor:"pointer",fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>+</button>
                            </div>
                            <button onClick={e=>{e.stopPropagation();setLinkModal({...sp,_shopifyProd:true,_colorGroup:color,_colorVariants:cvars});}}
                              style={{width:28,height:28,borderRadius:7,border:"1px solid",borderColor:colorLink?"#8db8f0":"#e8e8e8",background:colorLink?"#edf4fe":"#f8f8f8",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0,flexShrink:0}}>
                              <IC_LINK size={11} color="#4078e0"/>
                            </button>
                          </div>
                        );
                      })
                      :/* Size-based product: color group headers + variant rows */
                      colorGroups.map(([color, cvars])=>{
                      const groupInv = cvars.reduce((a,v)=>a+(v.inventory_quantity||0),0);
                      const colorLink = shopifyLinks.find(l=>l.shopifyProductId==String(sp.id)&&l.colorGroup===color&&l.linkLevel==="color");
                      const effectiveLink = colorLink || link;
                      const linkedGkbs = effectiveLink ? products.find(p=>p.id===effectiveLink.gkbsProductId) : null;
                      return(
                        <div key={color}>
                          {/* Color group header */}
                          {hasMultipleColors&&<div style={{display:"flex",alignItems:"center",padding:"8px 16px",background:"#fafafa",borderTop:"1px solid #f0f0f0",gap:8}}>
                            <IC_PAINT size={12} color="#888"/>
                            <div style={{flex:1,minWidth:0}}>
                              <span style={{fontSize:12,fontWeight:800,color:"#333"}}>{color}</span>
                              {linkedGkbs&&<span style={{fontSize:10,color:"#4078e0",fontWeight:700,marginLeft:8}}><IC_LINK size={9} color="#4078e0"/> {linkedGkbs.name}</span>}
                            </div>
                            <span style={{...F_HEAD_STYLE,fontSize:15,fontWeight:900,color:groupInv===0?"#e84142":groupInv<5?"#f08328":"#111"}}>{groupInv}</span>
                            <button onClick={e=>{e.stopPropagation();setLinkModal({...sp,_shopifyProd:true,_colorGroup:color,_colorVariants:cvars});}}
                              style={{width:30,height:30,borderRadius:8,border:"1px solid",borderColor:colorLink?"#8db8f0":"#e8e8e8",background:colorLink?"#edf4fe":"#f8f8f8",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0,flexShrink:0}}>
                              <IC_LINK size={12} color="#4078e0"/>
                            </button>
                          </div>}
                          {/* Variants – single line per variant */}
                          {cvars.map((v,vi)=>{
                            const qty = v.inventory_quantity||0;
                            const sizePart = getSize(v);
                            const colorPart = hasMultipleColors ? color : "";
                            const label = hasMultipleColors ? `${colorPart} / ${sizePart}` : (v.title||"Default");
                            const adjShopInv=async(delta)=>{
                              if(!sheetsUrl)return;
                              const nq=Math.max(0,qty+delta);
                              setShopifyProds(ps=>ps.map(p=>p.id===sp.id?{...p,variants:(p.variants||[]).map(vv=>vv.id===v.id?{...vv,inventory_quantity:nq}:vv)}:p));
                              const updated=(shopCacheGet("shopify_products")||[]).map(p=>String(p.id)===String(sp.id)?{...p,variants:(p.variants||[]).map(vv=>vv.id===v.id?{...vv,inventory_quantity:nq}:vv)}:p);
                              shopCacheSet("shopify_products",updated);
                              try{await fetch(sheetsUrl,{method:"POST",redirect:"follow",headers:{"Content-Type":"text/plain"},body:JSON.stringify({action:"shopify_set_inventory",inventory_item_id:v.inventory_item_id,quantity:nq})});}catch(e){}
                            };
                            return(
                              <div key={v.id} style={{display:"flex",alignItems:"center",padding:"7px 16px",background:vi%2===0?"#fff":"#fafafa",fontSize:13,gap:8}}>
                                <div style={{flex:1,minWidth:0,fontWeight:600,color:"#333",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{label}</div>
                                <div style={{fontSize:12,color:"#888",flexShrink:0}}>€{Number(v.price||0).toFixed(0)}</div>
                                <div style={{display:"flex",alignItems:"center",gap:3,flexShrink:0}}>
                                  <button onClick={e=>{e.stopPropagation();adjShopInv(-1);}} disabled={qty===0} style={{width:22,height:22,borderRadius:6,border:"none",background:qty===0?"#f0f0f0":"#fef1f0",color:qty===0?"#ccc":"#e84142",fontSize:14,cursor:qty===0?"not-allowed":"pointer",fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>−</button>
                                  <span style={{...F_HEAD_STYLE,fontSize:15,fontWeight:900,minWidth:28,textAlign:"center",color:qty===0?"#e84142":qty<=3?"#f08328":"#1a9a50"}}>{qty}</span>
                                  <button onClick={e=>{e.stopPropagation();adjShopInv(1);}} style={{width:22,height:22,borderRadius:6,border:"none",background:"#ddfce6",color:"#1a9a50",fontSize:14,cursor:"pointer",fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>+</button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                    {/* Footer */}
                    <div style={{display:"flex",padding:"8px 16px",borderTop:"1px solid #f0f0f0",background:"#fafafa",fontSize:12,fontWeight:700}}>
                      <div style={{flex:1,color:"#888"}}>{variants.length} Varianten{hasMultipleColors?` · ${colorGroups.length} Farben`:""}</div>
                      <div style={{width:55,textAlign:"right",color:"#111"}}>{totalInv} Stk</div>
                      
                    </div>
                  </div>
                );})()}
              </div>
            );
          })}
        </div>
      )}

      {/* Orders */}
      {tab==="orders"&&!loading&&(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {/* Order sub-tabs */}
          <div style={{display:"flex",gap:0,background:"#f0f0f0",borderRadius:10,padding:3}}>
            {[["oe","Online Exclusive"],["all","Alle Orders"]].map(([v,lbl])=>(
              <button key={v} onClick={()=>setOrderSubTab(v)} style={{flex:1,padding:"7px 14px",borderRadius:8,border:"none",background:orderSubTab===v?"#fff":"transparent",color:orderSubTab===v?"#111":"#666",cursor:"pointer",fontWeight:700,fontSize:12,boxShadow:orderSubTab===v?"0 1px 3px rgba(0,0,0,0.08)":"none"}}>{lbl}</button>
            ))}
          </div>
          {(()=>{
            const normalize=(t)=>t.toUpperCase().replace(/\s+/g," ").trim().split(" - ")[0].trim();
            const isOE=(t)=>ONLINE_EXCLUSIVE_PRODUCTS.map(normalize).includes(normalize(t));
            const displayOrders = orderSubTab==="all"
              ? shopifyOrders.filter(o=>o.line_items?.length>0)
              : shopifyOrders.map(o=>({...o,line_items:(o.line_items||[]).filter(l=>isOE(l.title))})).filter(o=>o.line_items.length>0);
            if(displayOrders.length===0) return <div style={{color:"#ccc",fontSize:14,padding:60,textAlign:"center"}}>{orderSubTab==="all"?"Keine offenen Bestellungen":"Keine Online Exclusive Bestellungen"}</div>;
            return displayOrders.map(order=>(
            <div key={order.id} style={{background:"#fff",borderRadius:12,border:"1px solid #ebebeb",overflow:"hidden"}}>
              <div style={{padding:"12px 16px",background:"#f9f9f9",display:"flex",alignItems:"center",gap:10}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:800}}>{order.name}</div>
                  <div style={{fontSize:11,color:"#bbb"}}>{order.customer?.first_name} {order.customer?.last_name} · {new Date(order.created_at).toLocaleDateString("de-AT")}</div>
                </div>
                <span style={{fontSize:11,background:order.fulfillment_status?"#f0fdf4":"#fef6ed",color:order.fulfillment_status?"#1a9a50":"#f08328",borderRadius:6,padding:"3px 8px",fontWeight:700}}>
                  {order.fulfillment_status||"Offen"}
                </span>
              </div>
              {(order.line_items||[]).map(line=>{
                const link = shopifyLinks.find(l=>l.shopifyProductId==line.product_id);
                const gkbs = link ? products.find(p=>p.id===link.gkbsProductId) : null;
                const already = prods.some(p=>p.shopifyOrderId===String(order.id)&&p.name.includes(line.title));
                return(
                  <div key={line.id} style={{padding:"10px 16px",display:"flex",alignItems:"center",gap:10,borderTop:"1px solid #f5f5f5"}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:700}}>{line.title}</div>
                      <div style={{fontSize:11,color:"#888"}}>{line.variant_title} · {line.quantity}×</div>
                      {gkbs&&<div style={{fontSize:10,color:"#1a9a50",marginTop:1}}>Blank: {gkbs.name}</div>}
                      {line.properties?.some(p=>p.name==="_online_exclusive")||!gkbs
                        ?<span style={{fontSize:9,background:"#f0f9ff",color:"#0369a1",borderRadius:4,padding:"2px 5px",fontWeight:800}}>🌐 ONLINE EXCLUSIVE</span>
                        :null}
                    </div>
                    {!already
                      ?<button onClick={()=>createOrderFromLine(order,line)}
                          style={{padding:"6px 12px",borderRadius:8,border:"none",background:"#1a9a50",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:12,flexShrink:0}}>
                          + Auftrag
                        </button>
                      :<span style={{fontSize:11,color:"#1a9a50",fontWeight:700,flexShrink:0}}>✓ Erstellt</span>}
                  </div>
                );
              })}
            </div>
          ));})()}
        </div>
      )}

      {/* Sync */}
    </div>
  );
}

// ─── Shopify Link Modal ────────────────────────────────────────────
function ShopifyLinkModal({prod, products, sheetsUrl, links, shopifyProds:spIn, locations:locsIn, onSave, onClose}){
  const [shopifyProds,setShopifyProds] = useState(spIn||[]);
  const [locs,setLocs] = useState(locsIn||[]);
  const [loading,setLoading] = useState((!spIn||spIn.length===0));
  const preColorGroup = prod?._colorGroup||null;
  const preColorVariants = prod?._colorVariants||null;
  const [selSP,setSelSP] = useState(prod?._shopifyProd?prod:null);
  const [selVar,setSelVar] = useState(null);
  const [selLoc,setSelLoc] = useState(null);
  const [selGkbs,setSelGkbs] = useState(prod?._shopifyProd?null:prod?.id);
  const [linkSearch,setLinkSearch] = useState("");
  const [linkDropOpen,setLinkDropOpen] = useState(false);
  const [linkLevel,setLinkLevel] = useState(preColorGroup?"color":"product");
  const isFromShopify = !!prod?._shopifyProd;

  useEffect(()=>{
    if(shopifyProds.length>0&&locs.length>0){setLoading(false);return;}
    (async()=>{
      setLoading(true);
      try{
        const d1 = await fetch(`${sheetsUrl}?action=shopify_products`,{redirect:"follow"}).then(r=>r.text()).then(JSON.parse);
        if(d1.products) setShopifyProds(d1.products);
        const d2 = await fetch(`${sheetsUrl}?action=shopify_locations`,{redirect:"follow"}).then(r=>r.text()).then(JSON.parse);
        if(d2.locations){setLocs(d2.locations);if(d2.locations.length>=1)setSelLoc(d2.locations[0]);}
        if(isFromShopify) setSelSP(prod);
      }catch(e){}
      setLoading(false);
    })();
  },[]);

  // Auto-select first variant when linking from Shopify
  const effectiveVar = selVar || (isFromShopify&&selSP?(selSP.variants||[])[0]:null);
  const canSave = linkLevel==="color"
    ? selSP&&(isFromShopify?selGkbs:true)
    : selSP&&effectiveVar&&(isFromShopify?selGkbs:true);

  const doSave = () => {
    if(!canSave) return;
    const gkbsId = isFromShopify?selGkbs:prod?.id;

    if(linkLevel==="color"&&preColorGroup){
      // Color-group link: one link for all variants of this color
      const firstVar = preColorVariants?.[0];
      const newLink = {
        gkbsProductId:gkbsId,
        shopifyProductId:String(selSP.id),
        shopifyVariantId:firstVar?String(firstVar.id):"",
        shopifyInventoryItemId:firstVar?String(firstVar.inventory_item_id):"",
        shopifyLocationId:selLoc?String(selLoc.id):(locs[0]?String(locs[0].id):""),
        label:`${selSP.title} – ${preColorGroup}`,
        linkLevel:"color",
        colorGroup:preColorGroup,
        colorVariantIds:(preColorVariants||[]).map(v=>String(v.id))
      };
      const updated = [...links.filter(l=>!(l.shopifyProductId===String(selSP.id)&&l.colorGroup===preColorGroup&&l.linkLevel==="color")), newLink];
      onSave(updated);
    } else {
      // Product-level link
      const useVar = effectiveVar;
      if(!useVar) return;
      const newLink = {
        gkbsProductId:gkbsId,
        shopifyProductId:String(selSP.id),
        shopifyVariantId:String(useVar.id),
        shopifyInventoryItemId:String(useVar.inventory_item_id),
        shopifyLocationId:selLoc?String(selLoc.id):(locs[0]?String(locs[0].id):""),
        label:`${selSP.title} – ${useVar.title}`,
        linkLevel:"product"
      };
      const updated = [...links.filter(l=>!(l.gkbsProductId===gkbsId&&l.linkLevel==="product")), newLink];
      onSave(updated);
    }
  };

  const doRemoveColorLink = () => {
    if(!preColorGroup) return;
    const updated = links.filter(l=>!(l.shopifyProductId===String(selSP?.id||prod?.id)&&l.colorGroup===preColorGroup&&l.linkLevel==="color"));
    onSave(updated);
  };

  const existingColorLink = preColorGroup&&selSP ? links.find(l=>l.shopifyProductId==String(selSP.id)&&l.colorGroup===preColorGroup&&l.linkLevel==="color") : null;

  return(
    <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.5)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}>
      <div style={{background:"#fff",borderRadius:18,width:460,maxWidth:"95vw",maxHeight:"88vh",display:"flex",flexDirection:"column",boxShadow:"0 8px 40px rgba(0,0,0,0.2)"}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:"18px 20px 14px",borderBottom:"1px solid #f0f0f0",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{...F_HEAD_STYLE,fontSize:16,fontWeight:800}}>{preColorGroup?"Farbe":"Shopify"} verknüpfen</div>
            <div style={{fontSize:12,color:"#bbb",marginTop:2}}>
              {prod?.name||prod?.title}
              {preColorGroup&&<span style={{color:"#4078e0",fontWeight:700}}> → {preColorGroup} ({preColorVariants?.length} Varianten)</span>}
            </div>
          </div>
          <div style={{display:"flex",gap:6}}>
            {canSave&&<button onClick={doSave} style={{width:32,height:32,borderRadius:"50%",border:"none",background:"#1a9a50",color:"#fff",fontSize:16,cursor:"pointer",fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center"}}>✓</button>}
            <button onClick={onClose} style={{width:32,height:32,borderRadius:"50%",border:"none",background:"#f0f0f0",color:"#666",fontSize:16,cursor:"pointer",fontWeight:900}}>✕</button>
          </div>
        </div>
        <div style={{overflowY:"auto",padding:"16px 20px",display:"flex",flexDirection:"column",gap:14,flex:1}}>
          {loading&&<div style={{textAlign:"center",padding:40,color:"#bbb"}}>⟳ Lade Shopify Daten...</div>}
          {!loading&&<>
            {/* Color group info */}
            {preColorGroup&&<div style={{background:"#edf4fe",borderRadius:10,padding:"12px 16px",border:"1px solid #bfdbfe"}}>
              <div style={{fontSize:11,color:"#4078e0",fontWeight:700,marginBottom:4,display:"flex",alignItems:"center",gap:4}}><IC_PAINT size={12} color="#4078e0"/> FARBGRUPPE</div>
              <div style={{fontSize:14,fontWeight:800,color:"#1e40af"}}>{preColorGroup}</div>
              <div style={{fontSize:11,color:"#60a5fa",marginTop:4,display:"flex",flexWrap:"wrap",gap:4}}>
                {(preColorVariants||[]).map(v=><span key={v.id} style={{background:"#dbeafe",borderRadius:4,padding:"1px 6px",fontSize:10}}>{(v.title||"").split("/")[0].trim()} ({v.inventory_quantity||0})</span>)}
              </div>
            </div>}
            {isFromShopify&&<div>
              <div style={{fontSize:11,color:"#bbb",fontWeight:700,letterSpacing:0.8,marginBottom:8}}>GKBS PRODUKT (Blank)</div>
              <BlankPicker products={products} value={selGkbs} onChange={setSelGkbs}/>
            </div>}
            {!isFromShopify&&<div>
              <div style={{fontSize:11,color:"#bbb",fontWeight:700,letterSpacing:0.8,marginBottom:8}}>SHOPIFY PRODUKT</div>
              <div style={{position:"relative"}}>
                <input value={linkSearch} onChange={e=>{setLinkSearch(e.target.value);setLinkDropOpen(true);}} onFocus={()=>setLinkDropOpen(true)}
                  placeholder="Shopify Produkt suchen..." style={{width:"100%",padding:"10px 12px",borderRadius:10,border:"1.5px solid #e8e8e8",background:"#f8f8f8",fontSize:14,outline:"none",boxSizing:"border-box"}}/>
                {selSP&&!linkDropOpen&&<div style={{fontSize:12,color:"#1a9a50",fontWeight:700,marginTop:4}}>✓ {selSP.title}</div>}
                {linkDropOpen&&<div style={{position:"absolute",top:"100%",left:0,right:0,background:"#fff",border:"1px solid #e8e8e8",borderRadius:10,boxShadow:"0 4px 16px rgba(0,0,0,0.1)",maxHeight:200,overflowY:"auto",zIndex:10,marginTop:2}}>
                  {shopifyProds.filter(sp=>!linkSearch||sp.title.toLowerCase().includes(linkSearch.toLowerCase())).slice(0,20).map(sp=>(
                    <div key={sp.id} onClick={()=>{setSelSP(sp);setSelVar(null);setLinkSearch(sp.title);setLinkDropOpen(false);}}
                      style={{padding:"9px 12px",cursor:"pointer",fontSize:13,fontWeight:selSP?.id===sp.id?800:400,background:selSP?.id===sp.id?"#f0fdf4":"#fff",borderBottom:"1px solid #f5f5f5"}}
                      onMouseEnter={e=>e.currentTarget.style.background="#f9f9f9"}
                      onMouseLeave={e=>e.currentTarget.style.background=selSP?.id===sp.id?"#f0fdf4":"#fff"}>
                      {sp.title}
                    </div>
                  ))}
                  {shopifyProds.filter(sp=>!linkSearch||sp.title.toLowerCase().includes(linkSearch.toLowerCase())).length===0&&<div style={{padding:12,color:"#ccc",fontSize:12,textAlign:"center"}}>Keine Treffer</div>}
                </div>}
              </div>
            </div>}
            {selSP&&!preColorGroup&&!isFromShopify&&<div>
              <div style={{fontSize:11,color:"#bbb",fontWeight:700,letterSpacing:0.8,marginBottom:8}}>VARIANTE</div>
              <div style={{display:"flex",flexDirection:"column",gap:5}}>
                {(()=>{const vv=selSP.variants||[];if(vv.length===1&&!selVar)setTimeout(()=>setSelVar(vv[0]),0);return vv;})().map(v=>(
                  <button key={v.id} type="button" onClick={()=>setSelVar(v)}
                    style={{padding:"10px 14px",borderRadius:10,border:`1.5px solid ${selVar?.id===v.id?"#111":"#e8e8e8"}`,background:selVar?.id===v.id?"#111":"#f8f8f8",color:selVar?.id===v.id?"#fff":"#555",cursor:"pointer",fontWeight:700,fontSize:13,textAlign:"left",display:"flex",justifyContent:"space-between"}}>
                    <span>{v.title}</span><span style={{fontSize:11,opacity:0.6}}>Lager: {v.inventory_quantity}</span>
                  </button>
                ))}
              </div>
            </div>}
            {locs.length>1&&<div>
              <div style={{fontSize:11,color:"#bbb",fontWeight:700,letterSpacing:0.8,marginBottom:8}}>STANDORT</div>
              <div style={{display:"flex",flexDirection:"column",gap:5}}>
                {locs.map(loc=>(
                  <button key={loc.id} type="button" onClick={()=>setSelLoc(loc)}
                    style={{padding:"10px 14px",borderRadius:10,border:`1.5px solid ${selLoc?.id===loc.id?"#111":"#e8e8e8"}`,background:selLoc?.id===loc.id?"#111":"#f8f8f8",color:selLoc?.id===loc.id?"#fff":"#555",cursor:"pointer",fontWeight:700,fontSize:13,textAlign:"left"}}>
                    {loc.name}
                  </button>
                ))}
              </div>
            </div>}
          </>}
        </div>
        <div style={{padding:"12px 20px 20px",borderTop:"1px solid #f0f0f0",flexShrink:0,display:"flex",gap:10}}>
          {existingColorLink&&<button type="button" onClick={doRemoveColorLink} style={{padding:13,borderRadius:10,border:"1px solid #fecaca",background:"#fef1f0",color:"#e84142",cursor:"pointer",fontWeight:700,fontSize:13}}>✕ Entfernen</button>}
          <button type="button" onClick={onClose} style={{flex:1,padding:13,borderRadius:10,border:"1px solid #e8e8e8",background:"none",color:"#888",cursor:"pointer",fontWeight:700,fontSize:14}}>Abbrechen</button>
          <button type="button" onClick={doSave} disabled={!canSave}
            style={{flex:2,padding:13,borderRadius:10,border:"none",background:canSave?"#1a9a50":"#e0e0e0",color:canSave?"#fff":"#bbb",cursor:canSave?"pointer":"not-allowed",fontWeight:800,fontSize:15}}>
            ✓ Verknüpfen & Speichern
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────



// ─── Bestellbedarf View (Tab) ─────────────────────────────────────

// ─── ALL MIN/MAX Modal ────────────────────────────────────────────
function AllBestellungModal({blank, sizes, onClose, onDirectAdd}){
  const init = {};
  sizes.forEach(s=>{ init[s.key] = s.toOrder > 0 ? s.toOrder : 1; });
  const [mengen, setMengen] = useState(init);
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState("");
  const refs = useRef({});

  const setM = (key, val) => setMengen(m => ({...m, [key]: Math.max(1, val)}));
  const startEdit = (key) => { setDraft(String(mengen[key])); setEditing(key); setTimeout(()=>refs.current[key]?.select(), 30); };
  const commit = (key) => { const n = parseInt(draft); if (!isNaN(n) && n >= 1) setM(key, n); setEditing(null); };

  const doConfirm = () => {
    sizes.forEach(s => {
      const menge = mengen[s.key] || s.toOrder;
      if (menge <= 0) return;
      const isCapKey = s.key.startsWith("cap_");
      const capColor = isCapKey ? (blank.capColors||[]).find(cc=>"cap_"+cc.id+"_"+cc.name===s.key) : null;
      onDirectAdd(blank, s.key, isCapKey, capColor, menge);
    });
    onClose();
  };

  return (
    <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.5)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center"}}
      onClick={onClose}>
      <div style={{background:"#fff",borderRadius:18,width:400,maxWidth:"95vw",maxHeight:"85vh",display:"flex",flexDirection:"column",boxShadow:"0 8px 40px rgba(0,0,0,0.2)"}}
        onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px 12px",borderBottom:"1px solid #f0f0f0",flexShrink:0}}>
          <div style={{...F_HEAD_STYLE,fontSize:16,fontWeight:800}}>{blank.name}</div>
          <button onClick={onClose} style={{width:32,height:32,borderRadius:"50%",border:"none",background:"#f0f0f0",color:"#666",fontSize:16,cursor:"pointer",fontWeight:900}}>✕</button>
        </div>
        <div style={{overflowY:"auto",padding:"12px 20px",display:"flex",flexDirection:"column",gap:8,flex:1}}>
          {sizes.map(s => (
            <div key={s.key} style={{display:"flex",alignItems:"center",gap:10,background:"#f8f8f8",borderRadius:10,padding:"10px 14px"}}>
              <span style={{fontSize:13,fontWeight:800,color:"#444",flex:1}}>{s.label}</span>
              <button onClick={()=>setM(s.key, mengen[s.key]-1)}
                style={{width:34,height:34,borderRadius:9,border:"none",background:"#fef1f0",color:"#e84142",fontSize:20,cursor:"pointer",fontWeight:800,flexShrink:0}}>−</button>
              {editing===s.key
                ? <input ref={el=>refs.current[s.key]=el} type="number" value={draft}
                    onChange={e=>setDraft(e.target.value)}
                    onBlur={()=>commit(s.key)}
                    onKeyDown={e=>{if(e.key==="Enter")commit(s.key);if(e.key==="Escape")setEditing(null);}}
                    style={{...F_HEAD_STYLE,width:60,textAlign:"center",fontSize:22,fontWeight:900,border:"2px solid #3b82f6",borderRadius:9,padding:"4px",outline:"none"}}/>
                : <span onDoubleClick={()=>startEdit(s.key)}
                    style={{...F_HEAD_STYLE,width:60,textAlign:"center",fontSize:22,fontWeight:900,color:"#111",cursor:"pointer",userSelect:"none"}}>
                    {mengen[s.key]}
                  </span>
              }
              <button onClick={()=>setM(s.key, mengen[s.key]+1)}
                style={{width:34,height:34,borderRadius:9,border:"none",background:"#ddfce6",color:"#1a9a50",fontSize:20,cursor:"pointer",fontWeight:800,flexShrink:0}}>+</button>
            </div>
          ))}
        </div>
        <div style={{padding:"12px 20px 20px",borderTop:"1px solid #f0f0f0",flexShrink:0}}>
          <div style={{fontSize:12,color:"#bbb",marginBottom:8,textAlign:"right"}}>
            Gesamt: <strong style={{color:"#111"}}>{Object.values(mengen).reduce((a,b)=>a+b,0)} Stk</strong>
          </div>
          <button onClick={doConfirm}
            style={{width:"100%",padding:14,borderRadius:12,border:"none",background:"#111",color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer"}}>
            Zur Bestellliste hinzufügen →
          </button>
        </div>
      </div>
    </div>
  );
}


function BestellungAufgebenModal({blank, sizeKey, isCapKey, capColor, toOrder, isDtf, onClose, onConfirm}){
  const dpm = blank?.designsPerMeter||1;
  const isMeter = isDtf && dpm>1;
  // toOrder is in Stück; show meters if applicable
  const defaultMeter = isMeter ? Math.ceil(toOrder/dpm) : toOrder;
  const [menge, setMenge] = useState(defaultMeter > 0 ? defaultMeter : 1);
  const stueckVorschau = isMeter ? menge*dpm : menge;
  const label = isCapKey ? (capColor?.name || sizeKey) : sizeKey;
  const inputRef = useRef(null);
  useEffect(()=>{ setTimeout(()=>inputRef.current?.select(), 50); }, []);
  return(
    <ModalWrap onClose={onClose} width={360} onSave={()=>onConfirm(stueckVorschau)}>
      <div style={{...F_HEAD_STYLE,fontSize:17,fontWeight:800}}>{isDtf?"DTF bestellen":"Bestellung aufgeben"}</div>
      <div style={{background:"#f8f8f8",borderRadius:12,padding:"14px 16px"}}>
        <div style={{fontSize:13,fontWeight:800,color:"#111"}}>{blank.name}</div>
        <div style={{fontSize:12,color:"#888",marginTop:2}}>{label}{blank.color?" · "+blank.color:""}</div>
      </div>
      <div>
        <div style={{fontSize:11,color:"#bbb",fontWeight:700,letterSpacing:0.8,marginBottom:8}}>{isMeter?"MENGE (IN METER)":"MENGE"}</div>
        <div style={{display:"flex",alignItems:"center",gap:12,justifyContent:"center"}}>
          <button type="button" onClick={()=>setMenge(m=>Math.max(1,m-1))} style={{width:40,height:40,borderRadius:10,border:"none",background:"#fef1f0",color:"#e84142",fontSize:22,cursor:"pointer",fontWeight:800}}>−</button>
          <div style={{textAlign:"center"}}>
            <input ref={inputRef} type="number" inputMode="numeric" value={menge} onChange={e=>setMenge(Math.max(1,parseInt(e.target.value)||1))}
              style={{width:80,textAlign:"center",...F_HEAD_STYLE,fontSize:28,fontWeight:900,border:"2px solid #e8e8e8",borderRadius:12,padding:"8px",outline:"none"}}/>
            {isMeter&&<div style={{fontSize:11,color:"#4078e0",fontWeight:700,marginTop:4}}>= {stueckVorschau} Stk ins Lager</div>}
          </div>
          <button type="button" onClick={()=>setMenge(m=>m+1)} style={{width:40,height:40,borderRadius:10,border:"none",background:"#ddfce6",color:"#1a9a50",fontSize:22,cursor:"pointer",fontWeight:800}}>+</button>
        </div>
      </div>
      <button onClick={()=>onConfirm(stueckVorschau)} style={{width:"100%",padding:14,borderRadius:12,border:"none",background:"#111",color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer"}}>
        Zur Bestellliste hinzufügen →
      </button>
    </ModalWrap>
  );
}

// ─── Wareneingang Modal ────────────────────────────────────────────
function WareneingangModal({bestellung, onClose, onConfirm}){
  const dpm = bestellung.designsPerMeter||1;
  const isMeter = bestellung.isDtf && dpm>1;
  const defaultVal = isMeter ? (bestellung.meterAnzahl||Math.ceil(bestellung.menge/dpm)) : bestellung.menge;
  const [menge, setMenge] = useState(defaultVal);
  const stueckVorschau = isMeter ? menge*dpm : menge;
  return(
    <ModalWrap onClose={onClose} width={360} onSave={()=>onConfirm(menge)}>
      <div style={{...F_HEAD_STYLE,fontSize:17,fontWeight:800}}>Wareneingang</div>
      <div style={{background:"#f0fdf4",borderRadius:12,padding:"14px 16px",borderLeft:"3px solid #16a34a"}}>
        <div style={{fontSize:13,fontWeight:800,color:"#111"}}>{bestellung.produktName}</div>
        <div style={{fontSize:12,color:"#888",marginTop:2}}>{isMeter?"DTF Transfer":bestellung.label}</div>
        <div style={{fontSize:11,color:"#1a9a50",fontWeight:700,marginTop:4}}>
          Bestellt: {isMeter?`${bestellung.meterAnzahl||"?"} m (${bestellung.menge} Stk)`:`${bestellung.menge} Stk`}
        </div>
      </div>
      <div>
        <div style={{fontSize:11,color:"#bbb",fontWeight:700,letterSpacing:0.8,marginBottom:8}}>
          EINGEHENDE MENGE {isMeter?"(IN METER)":""}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12,justifyContent:"center"}}>
          <button type="button" onClick={()=>setMenge(m=>Math.max(1,m-1))} style={{width:40,height:40,borderRadius:10,border:"none",background:"#fef1f0",color:"#e84142",fontSize:22,cursor:"pointer",fontWeight:800}}>−</button>
          <div style={{textAlign:"center"}}>
            <input type="number" inputMode="numeric" value={menge} onChange={e=>setMenge(Math.max(1,parseInt(e.target.value)||1))}
              style={{width:80,textAlign:"center",...F_HEAD_STYLE,fontSize:28,fontWeight:900,border:"2px solid #e8e8e8",borderRadius:12,padding:"8px",outline:"none"}}/>
            {isMeter&&<div style={{fontSize:11,color:"#4078e0",fontWeight:700,marginTop:4}}>= {stueckVorschau} Stk werden ins Lager gebucht</div>}
          </div>
          <button type="button" onClick={()=>setMenge(m=>m+1)} style={{width:40,height:40,borderRadius:10,border:"none",background:"#ddfce6",color:"#1a9a50",fontSize:22,cursor:"pointer",fontWeight:800}}>+</button>
        </div>
      </div>
      <button onClick={()=>onConfirm(menge)} style={{width:"100%",padding:14,borderRadius:12,border:"none",background:"#1a9a50",color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer"}}>
        Wareneingang bestätigen ✓
      </button>
    </ModalWrap>
  );
}

// ─── Bestellte Ware View ───────────────────────────────────────────
function BestellteWareView({bestellungen, onWareneingang, onDelete}){
  const [subTab, setSubTab] = useState("textilien");
  const filtered = bestellungen.filter(b => subTab==="dtf" ? b.isDtf : !b.isDtf);
  const offene = filtered.filter(b => b.status === "offen");
  const erledigt = filtered.filter(b => b.status === "erledigt").slice(0,5);
  const offenAll = bestellungen.filter(b=>b.status==="offen");
  const offenTextilien = offenAll.filter(b=>!b.isDtf).length;
  const offenDtf = offenAll.filter(b=>b.isDtf).length;
  const fmtDate = (iso) => {
    if(!iso) return "–";
    const d = new Date(iso);
    if(isNaN(d.getTime())) return "–";
    const pad = n => String(n).padStart(2,"0");
    return `${pad(d.getDate())}.${pad(d.getMonth()+1)}.${d.getFullYear()}`;
  };
  return(
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      {/* Sub-tabs */}
      <div style={{display:"flex",gap:6,background:"#f0f0f0",borderRadius:12,padding:4}}>
        {[["textilien","Blanks",IC_SHIRT,offenTextilien],["dtf","DTF",IC_ROLL,offenDtf]].map(([v,lbl,Icon,count])=>(
          <button key={v} onClick={()=>setSubTab(v)} style={{flex:1,padding:"8px 12px",borderRadius:9,border:"none",background:subTab===v?"#fff":"transparent",color:subTab===v?"#111":"#666",cursor:"pointer",fontWeight:700,fontSize:13,boxShadow:subTab===v?"0 1px 3px rgba(0,0,0,0.08)":"none",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
            <Icon size={13} color={subTab===v?"#111":"#999"}/>{lbl}{count>0&&<span style={{background:"#e84142",color:"#fff",borderRadius:20,fontSize:10,fontWeight:800,padding:"1px 6px"}}>{count}</span>}
          </button>
        ))}
      </div>
      {offene.length === 0 && (
        <div style={{color:"#ccc",fontSize:14,padding:60,textAlign:"center"}}>
          {subTab==="dtf"?<IC_PRINT size={40} color="#ccc"/>:<IC_BOX size={40} color="#ccc"/>}
          <div style={{marginTop:12}}>Keine offenen Bestellungen</div>
        </div>
      )}
      {offene.length > 0 && (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <div style={{fontSize:11,color:"#bbb",fontWeight:700,letterSpacing:0.8,padding:"0 4px"}}>OFFENE BESTELLUNGEN · {offene.length}</div>
          {offene.map(b => (
            <div key={b.id} style={{background:"#fff",borderRadius:14,padding:"14px 16px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)",display:"flex",alignItems:"center",gap:12}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:800,color:"#111"}}>{b.produktName}</div>
                <div style={{fontSize:12,color:"#888",marginTop:2}}>{b.isDtf?"DTF Transfer":b.label}</div>
                <div style={{fontSize:11,color:"#bbb",marginTop:4}}>Bestellt am {fmtDate(b.bestelltAm)}</div>
              </div>
              <div style={{textAlign:"center",marginRight:8}}>
                {b.isDtf&&b.meterAnzahl
                  ?<>
                    <div style={{...F_HEAD_STYLE,fontSize:24,fontWeight:900,color:"#111",lineHeight:1}}>{b.meterAnzahl} m</div>
                    <div style={{fontSize:10,color:"#bbb",fontWeight:700}}>{b.menge} Stk</div>
                  </>
                  :<>
                    <div style={{...F_HEAD_STYLE,fontSize:24,fontWeight:900,color:"#111",lineHeight:1}}>{b.menge}</div>
                    <div style={{fontSize:10,color:"#bbb",fontWeight:700}}>Stk</div>
                  </>
                }
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                <button onClick={()=>onWareneingang(b)} style={{padding:"8px 14px",borderRadius:10,border:"none",background:"#1a9a50",color:"#fff",fontSize:12,fontWeight:800,cursor:"pointer",whiteSpace:"nowrap"}}>✓ Eingang</button>
                <button onClick={()=>onDelete(b.id)} style={{padding:"6px 14px",borderRadius:10,border:"1px solid #ebebeb",background:"#fff",color:"#bbb",fontSize:11,fontWeight:700,cursor:"pointer"}}>Entfernen</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {erledigt.length > 0 && (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <div style={{fontSize:11,color:"#bbb",fontWeight:700,letterSpacing:0.8,padding:"0 4px",marginTop:8}}>ZULETZT ERHALTEN</div>
          {erledigt.map(b => (
            <div key={b.id} style={{background:"#f8f8f8",borderRadius:14,padding:"12px 16px",display:"flex",alignItems:"center",gap:12,opacity:0.7}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:800,color:"#555"}}>{b.produktName}</div>
                <div style={{fontSize:11,color:"#bbb",marginTop:2}}>{b.label}</div>
              </div>
              <div style={{textAlign:"center"}}>
                {b.isDtf&&b.meterAnzahl
                  ?<>
                    <div style={{fontSize:18,fontWeight:900,color:"#1a9a50",lineHeight:1}}>{b.meterAnzahl} m</div>
                    <div style={{fontSize:10,color:"#bbb",fontWeight:700}}>{b.menge} Stk</div>
                  </>
                  :<>
                    <div style={{fontSize:18,fontWeight:900,color:"#1a9a50",lineHeight:1}}>{b.menge}</div>
                    <div style={{fontSize:10,color:"#bbb",fontWeight:700}}>Stk</div>
                  </>
                }
              </div>
              <div style={{fontSize:10,color:"#1a9a50",fontWeight:800}}>✓ Erhalten</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Manual Bestell Modal ──────────────────────────────────────────
function ManualBestellModal({products,dtfItems,currentUser,onClose,onAddProd,onAddDtfBedarf}){
  const [typ,setTyp]=useState("blank"); // "blank" | "dtf"
  const [selProd,setSelProd]=useState("");
  const [selDtf,setSelDtf]=useState("");
  const [qty,setQty]=useState({});
  const [dtfMenge,setDtfMenge]=useState("");
  const [notiz,setNotiz]=useState("");
  const [name,setName]=useState("");
  const inp={background:"#f8f8f8",border:"1px solid #e8e8e8",borderRadius:10,color:"#111",padding:"11px 14px",fontSize:14,width:"100%",outline:"none",boxSizing:"border-box"};
  const prod=products.find(p=>p.id===selProd);
  const dtf=dtfItems.find(d=>d.id===selDtf);
  const isCap=(prod?.capColors?.length>0);
  const totalQty=typ==="blank"?(isCap?(prod?.capColors||[]).reduce((a,c)=>a+(qty["cap_"+c.id]||0),0):DEFAULT_SIZES.reduce((a,s)=>a+(qty[s]||0),0)):parseInt(dtfMenge)||0;

  const doSave=()=>{
    if(typ==="blank"&&prod){
      const label=name.trim()||("Manuell: "+prod.name);
      if(isCap){
        const capColors=(prod.capColors||[]).map(c=>({id:c.id,name:c.name,hex:c.hex,qty:qty["cap_"+c.id]||0,done:0}));
        onAddProd({id:Date.now().toString(),name:label,blankId:prod.id,status:"Geplant",priority:"Mittel",notes:notiz,veredelung:[],designUrl:"",colorHex:prod.colorHex||"#ccc",photos:[],isCapOrder:true,capColors});
      } else {
        const qtyObj={};const doneObj={};
        DEFAULT_SIZES.forEach(s=>{qtyObj[s]=qty[s]||0;doneObj[s]=0;});
        onAddProd({id:Date.now().toString(),name:label,blankId:prod.id,status:"Geplant",priority:"Mittel",notes:notiz,veredelung:[],designUrl:"",colorHex:prod.colorHex||"#ccc",photos:[],isCapOrder:false,qty:qtyObj,done:doneObj});
      }
    } else if(typ==="dtf"&&dtf){
      const m=parseInt(dtfMenge)||0;
      if(m>0) onAddDtfBedarf(dtf,m,notiz);
    }
    onClose();
  };

  return(
    <ModalWrap onClose={onClose} width={520} onSave={doSave} footer={<div style={{display:"flex",gap:10}}><button type="button" onClick={onClose} style={{flex:1,padding:13,borderRadius:10,border:"1px solid #e8e8e8",background:"none",color:"#888",cursor:"pointer",fontWeight:700,fontSize:14}}>Abbrechen</button><button type="button" onClick={doSave} disabled={totalQty===0} style={{flex:2,padding:13,borderRadius:10,border:"none",background:totalQty>0?"#1a9a50":"#e8e8e8",color:totalQty>0?"#fff":"#bbb",cursor:totalQty>0?"pointer":"not-allowed",fontWeight:800,fontSize:15}}>+ Zum Bestellbedarf ({totalQty} Stk)</button></div>}>
      <div style={{...F_HEAD_STYLE,fontSize:17,fontWeight:800}}>Manueller Bedarf</div>

      {/* Type picker */}
      <div style={{display:"flex",gap:0,background:"#f0f0f0",borderRadius:10,padding:3}}>
        {[["blank","Blank",IC_SHIRT],["dtf","DTF",IC_ROLL]].map(([v,lbl,Icon])=>(
          <button key={v} onClick={()=>{setTyp(v);setQty({});setDtfMenge("");}} style={{flex:1,padding:"8px 12px",borderRadius:8,border:"none",background:typ===v?"#fff":"transparent",color:typ===v?"#111":"#666",cursor:"pointer",fontWeight:700,fontSize:13,boxShadow:typ===v?"0 1px 3px rgba(0,0,0,0.08)":"none",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}><Icon size={13} color={typ===v?"#111":"#999"}/>{lbl}</button>
        ))}
      </div>

      {typ==="blank"&&<>
        <div style={{fontSize:11,color:"#bbb",fontWeight:700,letterSpacing:0.8}}>BLANK AUSWÄHLEN</div>
        <BlankPicker products={products} value={selProd} onChange={v=>{setSelProd(v);setQty({});}}/>
        {prod&&<input style={inp} placeholder="Auftragsname (optional)" value={name} onChange={e=>setName(e.target.value)}/>}
        {prod&&!isCap&&<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
          {DEFAULT_SIZES.map(s=>{
            const v=qty[s]||0;
            return <div key={s} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,background:"#f8f8f8",borderRadius:12,padding:"10px 6px"}}>
              <span style={{fontSize:12,fontWeight:800,color:v>0?"#111":"#888"}}>{s}</span>
              <span style={{...F_HEAD_STYLE,fontSize:22,fontWeight:900,color:v>0?"#111":"#bbb",lineHeight:1}}>{v}</span>
              <div style={{display:"flex",gap:4}}>
                <button type="button" onClick={()=>setQty(q=>({...q,[s]:Math.max(0,(q[s]||0)-1)}))} style={btn(30,true,v===0)}>−</button>
                <button type="button" onClick={()=>setQty(q=>({...q,[s]:(q[s]||0)+1}))} style={btn(30)}>+</button>
              </div>
            </div>;
          })}
        </div>}
        {prod&&isCap&&<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
          {(prod.capColors||[]).map(c=>{
            const v=qty["cap_"+c.id]||0;
            return <div key={c.id} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,background:"#f8f8f8",borderRadius:12,padding:"10px 6px"}}>
              <div style={{width:18,height:18,borderRadius:"50%",background:c.hex,border:"1.5px solid #444"}}/>
              <span style={{fontSize:10,fontWeight:700,color:v>0?"#111":"#888",textAlign:"center",lineHeight:1.2}}>{c.name}</span>
              <span style={{...F_HEAD_STYLE,fontSize:22,fontWeight:900,color:v>0?"#111":"#bbb",lineHeight:1}}>{v}</span>
              <div style={{display:"flex",gap:4}}>
                <button type="button" onClick={()=>setQty(q=>({...q,["cap_"+c.id]:Math.max(0,(q["cap_"+c.id]||0)-1)}))} style={btn(30,true,v===0)}>−</button>
                <button type="button" onClick={()=>setQty(q=>({...q,["cap_"+c.id]:(q["cap_"+c.id]||0)+1}))} style={btn(30)}>+</button>
              </div>
            </div>;
          })}
        </div>}
      </>}

      {typ==="dtf"&&<>
        <div style={{fontSize:11,color:"#bbb",fontWeight:700,letterSpacing:0.8}}>DTF DESIGN WÄHLEN</div>
        <select value={selDtf} onChange={e=>setSelDtf(e.target.value)} style={inp}>
          <option value="">— DTF Design wählen —</option>
          {dtfItems.map(d=><option key={d.id} value={d.id}>{d.name} ({d.stock} Stk)</option>)}
        </select>
        {dtf&&<div style={{display:"flex",gap:10,alignItems:"center"}}>
          <div style={{flex:1}}>
            <div style={{fontSize:11,color:"#bbb",fontWeight:700,marginBottom:4}}>MENGE (Stk)</div>
            <input type="number" inputMode="numeric" min="1" value={dtfMenge} onChange={e=>setDtfMenge(e.target.value)}
              style={{...inp,fontSize:20,fontWeight:900,textAlign:"center"}}/>
          </div>
          {dtf.designsPerMeter>1&&<div style={{flex:1}}>
            <div style={{fontSize:11,color:"#bbb",fontWeight:700,marginBottom:4}}>METER</div>
            <div style={{...inp,fontSize:20,fontWeight:900,textAlign:"center",background:"#f0f0f0",color:"#888"}}>{Math.ceil((parseInt(dtfMenge)||0)/(dtf.designsPerMeter||1))}</div>
          </div>}
        </div>}
      </>}

      {/* Notiz */}
      <input value={notiz} onChange={e=>setNotiz(e.target.value)} placeholder="Notiz (optional)" style={inp}/>
    </ModalWrap>
  );
}

function BestellbedarfView({prods,products,dtfItems,bestellungen,onBestellen,onDirectAdd,onBestellenDtf,currentUser,bedarfCount,dtfBedarfCount,bedarfQty,setBedarfQty}){
  const mobile = useIsMobile();
  const activeProds=prods.filter(p=>p.status!=="Fertig");
  const [subTab,setSubTab]=useState("textilien");
  const [openSize,setOpenSize]=useState(null);
  const [allModal,setAllModal]=useState(null);
  const [csvSelected,setCsvSelected]=useState({});
  const customQty=bedarfQty;
  const setCustomQty=setBedarfQty;
  const bedarfMap={};
  const breakdownMap={};
  const isCapMap={};
  activeProds.forEach(prod=>{
    if(!bedarfMap[prod.blankId])bedarfMap[prod.blankId]={};
    if(!breakdownMap[prod.blankId])breakdownMap[prod.blankId]={};
    if(prod.isCapOrder){
      isCapMap[prod.blankId]=true;
      (prod.capColors||[]).forEach(cc=>{
        const key="cap_"+cc.id+"_"+cc.name;
        const q=cc.qty||0;
        bedarfMap[prod.blankId][key]=(bedarfMap[prod.blankId][key]||0)+q;
        if(q>0){if(!breakdownMap[prod.blankId][key])breakdownMap[prod.blankId][key]=[];breakdownMap[prod.blankId][key].push({name:prod.name,qty:q,colorHex:cc.hex});}
      });
    } else {
      DEFAULT_SIZES.forEach(s=>{
        const q=(prod.qty||{})[s]||0;
        bedarfMap[prod.blankId][s]=(bedarfMap[prod.blankId][s]||0)+q;
        if(q>0){if(!breakdownMap[prod.blankId][s])breakdownMap[prod.blankId][s]=[];breakdownMap[prod.blankId][s].push({name:prod.name,qty:q,colorHex:prod.colorHex});}
      });
    }
  });
  const dtfBedarfMap={};
  activeProds.forEach(prod=>{
    if(!prod.dtfId)return;
    const totalQty=prod.isCapOrder?(prod.capColors||[]).reduce((a,c)=>a+c.qty,0):DEFAULT_SIZES.reduce((a,s)=>a+((prod.qty||{})[s]||0),0);
    if(!dtfBedarfMap[prod.dtfId])dtfBedarfMap[prod.dtfId]={needed:0,auftraege:[]};
    dtfBedarfMap[prod.dtfId].needed+=totalQty;
    dtfBedarfMap[prod.dtfId].auftraege.push({name:prod.name,qty:totalQty,colorHex:prod.colorHex||"#888"});
  });

  const hasAnyMissing=Object.entries(bedarfMap).some(([blankId,sizeNeeds])=>{
    const blank=products.find(p=>p.id===blankId);if(!blank)return false;
    return Object.keys(sizeNeeds).some(k=>{
      const needed=sizeNeeds[k]||0;if(needed===0)return false;
      const isCapKey=k.startsWith("cap_");
      const capColor=isCapKey?(blank.capColors||[]).find(cc=>"cap_"+cc.id+"_"+cc.name===k):null;
      const avail=isCapKey?(capColor?.stock||0):((blank.stock||{})[k]||0);
      const minStockVal=isCapKey?0:((blank.minStock||{})[k]||0);
      return Math.max(0,needed+minStockVal-avail)>0;
    });
  });

  const dtfEntries=(dtfItems||[]).map(dtf=>{
    const needed=(dtfBedarfMap[dtf.id]?.needed)||0;
    const avail=dtf.stock||0;
    const minStock=dtf.minStock||0;
    const dpm=dtf.designsPerMeter||1;
    const toOrder=Math.max(0,needed-avail);
    const toOrderWithMin=Math.max(0,needed+minStock-avail);
    const toOrderM=dpm>1?Math.ceil(toOrder/dpm):toOrder;
    const toOrderWithMinM=dpm>1?Math.ceil(toOrderWithMin/dpm):toOrderWithMin;
    const unit=dpm>1?"m":"Stk";
    return {dtf,needed,avail,minStock,dpm,toOrder,toOrderWithMin,toOrderM,toOrderWithMinM,unit};
  }).filter(e=>e.toOrder>0||e.toOrderWithMin>0);

  const renderDetail=(t,blankId,blank,cq,cqKey)=>{
    const {key,label,isCapKey,capColor,needed,avail,minStockVal,remainMin,remainMax,state}=t;
    const items=breakdownMap[blankId]?.[key]||[];
    const orderQty=cq!=null?cq:t.remainMax;
    return(
      <div style={{background:"#fafafa",borderRadius:12,border:"1px solid #ebebeb",padding:"8px 10px",display:"flex",alignItems:"stretch",gap:6,marginTop:6}}>
        <div style={{flex:1,display:"flex",flexDirection:"column",gap:3}}>
          {items.length>0&&items.map((item,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 8px",background:"#fff",borderRadius:8,border:"1px solid #ebebeb"}}>
              <ColorDot hex={item.colorHex} size={12}/>
              <span style={{flex:1,fontSize:11,fontWeight:600,color:"#333"}}>{item.name}</span>
              <span style={{fontSize:12,fontWeight:900,color:"#111"}}>{item.qty}</span>
            </div>
          ))}
          {items.length===0&&<div style={{fontSize:11,color:"#ccc",padding:"4px 0"}}>Keine Aufträge</div>}
          {t.oQty>0&&<div style={{fontSize:10,color:"#1a9a50",fontWeight:700}}>✓ {t.oQty} bestellt</div>}
        </div>
        <button type="button" disabled={orderQty===0} onClick={()=>{if(orderQty>0){onBestellen(blank,key,isCapKey,capColor,orderQty);setCustomQty(q=>({...q,[cqKey]:0}));}}}
          style={{background:orderQty===0?"#f0f0f0":"#1a9a50",borderRadius:10,padding:"0 16px",border:"none",cursor:orderQty===0?"not-allowed":"pointer",opacity:orderQty===0?0.5:1,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:11,fontWeight:800,color:orderQty===0?"#bbb":"#fff",letterSpacing:0.5}}>
          ORDER
        </button>
      </div>
    );
  };

  return(
    <div style={S.col12}>
      {allModal&&<AllBestellungModal blank={allModal.blank} sizes={allModal.sizes} onClose={()=>setAllModal(null)} onDirectAdd={onDirectAdd}/>}
      <div style={{display:"flex",gap:6,background:"#f0f0f0",borderRadius:12,padding:4}}>
        {[["textilien","Blanks",IC_SHIRT,bedarfCount||0],["dtf","DTF",IC_ROLL,dtfBedarfCount||0]].map(([v,lbl,Icon,count])=>(
          <button key={v} onClick={()=>setSubTab(v)} style={{flex:1,padding:"8px 12px",borderRadius:9,border:"none",background:subTab===v?"#fff":"transparent",color:subTab===v?"#111":"#666",cursor:"pointer",fontWeight:700,fontSize:13,boxShadow:subTab===v?"0 1px 3px rgba(0,0,0,0.08)":"none",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
            <Icon size={13} color={subTab===v?"#111":"#999"}/>{lbl}{count>0&&<span style={{background:"#e84142",color:"#fff",borderRadius:20,padding:"1px 6px",fontSize:9,fontWeight:800}}>{count}</span>}
          </button>
        ))}
      </div>

      {subTab==="dtf"&&(
        dtfEntries.length===0
          ? <div style={{color:"#ccc",fontSize:14,padding:60,textAlign:"center"}}>Kein DTF-Bedarf</div>
          : <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {dtfEntries.map(({dtf,needed,avail,minStock,dpm,toOrder,toOrderWithMin,toOrderM,toOrderWithMinM,unit})=>{
                const ok=toOrder===0,okWithMin=toOrderWithMin===0;
                const dtfOrdered=(bestellungen||[]).some(b=>b.isDtf&&b.status==="offen"&&(b.dtfId===dtf.id||b.produktId===dtf.id));
                return(
                  <div key={dtf.id} style={{background:"#fff",borderRadius:14,padding:16,border:"1px solid #ebebeb",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:32,height:32,borderRadius:8,background:"#111",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><IC_PRINT size={14} color="#fff"/></div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:14,fontWeight:800}}>{dtf.name}</div>
                        <div style={{fontSize:11,color:"#bbb",marginTop:1}}>
                          Folien: <strong style={{color:"#111"}}>{needed}</strong> · Lager: <strong style={{color:avail>=needed?"#1a9a50":"#e84142"}}>{avail}</strong>
                          {dpm>1&&<span style={{color:"#bbb"}}> · {dpm} Designs/m</span>}
                        </div>
                        {(dtfBedarfMap[dtf.id]?.auftraege||[]).length>0&&(
                          <div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:6}}>
                            {dtfBedarfMap[dtf.id].auftraege.map((a,i)=>(
                              <span key={i} style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 8px",borderRadius:20,fontSize:10,fontWeight:700,background:"#f0f0f0",color:"#555"}}>
                                <span style={{width:7,height:7,borderRadius:"50%",background:a.colorHex,display:"inline-block",flexShrink:0}}/>{a.name} · {a.qty} Stk
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button type="button" disabled={dtfOrdered} onClick={()=>onBestellenDtf&&onBestellenDtf(dtf,toOrder)}
                        style={{background:dtfOrdered?"#f0f0f0":ok?"#ddfce6":"#fef1f0",borderRadius:8,padding:"4px 10px",textAlign:"center",width:60,border:`1px solid ${dtfOrdered?"#ddd":ok?"#bbf7d0":"#fcc8c6"}`,cursor:dtfOrdered?"not-allowed":"pointer",flexShrink:0,opacity:dtfOrdered?0.5:1}}>
                        <div style={{fontSize:9,color:dtfOrdered?"#bbb":ok?"#1a9a50":"#e84142",fontWeight:700}}>{dtfOrdered?"✓":"MIN"}</div>
                        <div style={{fontSize:dtfOrdered?10:18,fontWeight:900,color:dtfOrdered?"#bbb":ok?"#1a9a50":"#e84142",lineHeight:1,...F_HEAD_STYLE}}>{dtfOrdered?"best.":toOrderM}{!dtfOrdered&&unit==="m"&&<span style={{fontSize:11}}> m</span>}</div>
                      </button>
                      {minStock>0&&<button type="button" disabled={dtfOrdered} onClick={()=>onBestellenDtf&&onBestellenDtf(dtf,toOrderWithMin)}
                        style={{background:dtfOrdered?"#f0f0f0":okWithMin?"#ddfce6":"#f0fdf4",borderRadius:8,padding:"4px 10px",textAlign:"center",width:60,border:`1px solid ${dtfOrdered?"#ddd":okWithMin?"#bbf7d0":"#bbf7d0"}`,cursor:dtfOrdered?"not-allowed":"pointer",flexShrink:0,opacity:dtfOrdered?0.5:1}}>
                        <div style={{fontSize:9,color:dtfOrdered?"#bbb":okWithMin?"#1a9a50":"#1a9a50",fontWeight:700}}>{dtfOrdered?"":"MAX"}</div>
                        <div style={{fontSize:dtfOrdered?10:18,fontWeight:900,color:dtfOrdered?"#bbb":okWithMin?"#1a9a50":"#1a9a50",lineHeight:1,...F_HEAD_STYLE}}>{dtfOrdered?"best.":toOrderWithMinM}{!dtfOrdered&&unit==="m"&&<span style={{fontSize:11}}> m</span>}</div>
                      </button>}
                    </div>
                  </div>
                );
              })}
            </div>
      )}

      {subTab==="textilien"&&(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {!hasAnyMissing
            ? <div style={{color:"#ccc",fontSize:14,padding:60,textAlign:"center"}}><div style={{marginBottom:12}}><IC_CHECK_CIRCLE size={40} color="#ccc"/></div>Kein Bestellbedarf</div>
            : <div>
                <button onClick={()=>{const now=new Date();const dd=String(now.getDate()).padStart(2,"0");const mm=String(now.getMonth()+1).padStart(2,"0");const yy=String(now.getFullYear()).slice(-2);const hh=String(now.getHours()).padStart(2,"0");const mi=String(now.getMinutes()).padStart(2,"0");const ss=String(now.getSeconds()).padStart(2,"0");const projName=`GKBS_${(currentUser?.name||"User").replace(/\s+/g,"")}-${dd}/${mm}/${yy}+${hh}:${mi}:${ss}`;exportStanleyStellaCsv(bedarfMap,isCapMap,products,projName,csvSelected);}}
                  style={{width:"100%",padding:"12px 16px",borderRadius:10,border:"none",background:"#111",color:"#fff",fontSize:14,fontWeight:800,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                  <IC_DOWN size={14} color="#fff"/> CSV Export
                </button>
              </div>
          }
          {Object.entries(bedarfMap).map(([blankId,sizeNeeds])=>{
            const blank=products.find(p=>p.id===blankId);if(!blank)return null;
            const isCap=!!(blank.capColors?.length>0);
            // Show ALL sizes, not just needed ones
            const allKeys=isCap
              ?(blank.capColors||[]).map(cc=>"cap_"+cc.id+"_"+cc.name)
              :DEFAULT_SIZES;
            const relKeys=allKeys;
            const orderedQty=(key)=>(bestellungen||[]).filter(b=>!b.isDtf&&b.status==="offen"&&(b.blankId===blankId||b.produktId===blankId)&&b.sizeKey===key).reduce((a,b)=>a+(b.menge||0),0);
            const hasStCode=!!blank.stProductId;
            const activeKeys=relKeys.filter(k=>{const needed=sizeNeeds[k]||0;if(needed===0)return false;const isCapKey=k.startsWith("cap_");const capColor=isCapKey?(blank.capColors||[]).find(cc=>"cap_"+cc.id+"_"+cc.name===k):null;const avail=isCapKey?(capColor?.stock||0):((blank.stock||{})[k]||0);const minStockVal=isCapKey?0:((blank.minStock||{})[k]||0);return Math.max(0,needed+minStockVal-avail)>0;});
            const productKeys=activeKeys.map(k=>blankId+"__"+k);
            const allCsvSelected=hasStCode&&productKeys.every(k=>csvSelected[k]);
            const someCsvSelected=hasStCode&&productKeys.some(k=>csvSelected[k]);
            const toggleProduct=()=>{const next=!allCsvSelected;setCsvSelected(s=>{const n={...s};productKeys.forEach(k=>{if(next)n[k]=true;else delete n[k];});return n;});};
            const toggleKey=(key)=>{const ck=blankId+"__"+key;setCsvSelected(s=>{const n={...s};if(n[ck])delete n[ck];else n[ck]=true;return n;});};
            // Compute tile states per key
            const tileData=relKeys.map(key=>{
              const needed=sizeNeeds[key]||0;
              const isCapKey=key.startsWith("cap_");
              const capColor=isCapKey?(blank.capColors||[]).find(cc=>"cap_"+cc.id+"_"+cc.name===key):null;
              const avail=isCapKey?(capColor?.stock||0):((blank.stock||{})[key]||0);
              const minStockVal=isCapKey?0:((blank.minStock||{})[key]||0);
              const label=isCapKey?(capColor?.name||key.split("_").slice(2).join("_")):SZ(key);
              const toOrder=Math.max(0,needed-avail);
              const toOrderMax=Math.max(0,needed+minStockVal-avail);
              const oQty=orderedQty(key);
              const remainMin=Math.max(0,toOrder-oQty);
              const remainMax=Math.max(0,toOrderMax-oQty);
              // state: "red" | "orange" | "done" | "none"
              const state=(needed===0&&toOrderMax===0)?"none":remainMin>0?"red":remainMax>0?"orange":"done";
              return {key,label,isCapKey,capColor,needed,avail,minStockVal,toOrder,toOrderMax,oQty,remainMin,remainMax,state};
            });
            const allDone=tileData.every(t=>t.state==="done"||t.state==="none");
            const activeTiles=tileData.filter(t=>t.state!=="done"&&t.state!=="none");
            const minSizes=activeTiles.filter(t=>t.remainMin>0).map(t=>({key:t.key,label:t.label,toOrder:t.remainMin}));
            const maxSizes=activeTiles.filter(t=>t.remainMax>0).map(t=>({key:t.key,label:t.label,toOrder:t.remainMax}));
            return(
              <div key={blankId} style={{background:"#fff",borderRadius:16,padding:mobile?16:20,border:"1px solid #ebebeb",boxShadow:"0 1px 4px rgba(0,0,0,0.06)",display:"flex",flexDirection:"column",gap:12}}>
                <div style={S.cardHdr}>
                  <SmartDot item={blank} size={22}/>
                  <div><div style={{...F_HEAD_STYLE,fontSize:15,fontWeight:800,color:"#111"}}>{blank.name}</div><div style={{fontSize:11,color:"#bbb"}}>{blank.color} · {blank.category}</div></div>
                  {hasStCode&&<button type="button" onClick={toggleProduct}
                    style={{padding:"3px 7px",borderRadius:6,border:`1px solid ${allCsvSelected?"#111":someCsvSelected?"#888":"#ddd"}`,background:allCsvSelected?"#111":someCsvSelected?"#f0f0f0":"transparent",color:allCsvSelected?"#fff":someCsvSelected?"#444":"#bbb",fontSize:10,fontWeight:800,cursor:"pointer",flexShrink:0,letterSpacing:0.3}}>
                    CSV
                  </button>}
                  
                  <div style={{marginLeft:"auto",display:"flex",gap:6,flexShrink:0}}>
                    <button type="button" disabled={allDone||minSizes.length===0}
                      style={{...F_HEAD_STYLE,padding:"6px 12px",borderRadius:9,background:allDone?"#e0e0e0":"#fef1f0",color:allDone?"#bbb":"#e84142",fontSize:11,fontWeight:800,cursor:allDone||minSizes.length===0?"not-allowed":"pointer",opacity:allDone||minSizes.length===0?0.5:1,border:"1px solid #fecaca",letterSpacing:0.5}}
                      onClick={()=>{if(!allDone&&minSizes.length>0)setAllModal({blank,sizes:minSizes});}}>
                      MIN
                    </button>
                    <button type="button" disabled={allDone||maxSizes.length===0}
                      style={{...F_HEAD_STYLE,padding:"6px 12px",borderRadius:9,background:allDone?"#e0e0e0":"#f0fdf4",color:allDone?"#bbb":"#1a9a50",fontSize:11,fontWeight:800,cursor:allDone||maxSizes.length===0?"not-allowed":"pointer",opacity:allDone||maxSizes.length===0?0.5:1,border:"1px solid #bbf7d0",letterSpacing:0.5}}
                      onClick={()=>{if(!allDone&&maxSizes.length>0)setAllModal({blank,sizes:maxSizes});}}>
                      MAX
                    </button>
                  </div>
                </div>
                {/* Size cells – boxes on desktop, rows on mobile */}
                {!mobile?<>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {tileData.map(t=>{
                    const {key,label,state,remainMin,remainMax,avail,needed,minStockVal}=t;
                    const isInactive=state==="done"||state==="none";
                    const isOpen=openSize===`${blankId}-${key}`;
                    const cqKey=blankId+"-"+key;
                    const cq=customQty[cqKey]!=null?customQty[cqKey]:remainMax;
                    const setCq=(v)=>setCustomQty(q=>({...q,[cqKey]:Math.max(0,v)}));
                    return(
                      <div key={key} style={{display:"flex",flexDirection:"column",alignItems:"stretch",
                        background:isOpen?"#fff":isInactive?"#f6f6f6":"#f8f8f8",
                        borderRadius:14,padding:"10px 10px 8px",flex:1,minWidth:0,minHeight:130,
                        opacity:state==="none"?0.5:state==="done"?0.65:1,
                        border:isOpen?"2px solid #e84142":"1px solid "+(isInactive?"#e8e8e8":"transparent"),cursor:"pointer"}}
                        onClick={()=>setOpenSize(o=>o===`${blankId}-${key}`?null:`${blankId}-${key}`)}>
                        {/* Row 1: MIN label MAX */}
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                          <span onClick={e=>{e.stopPropagation();setCq(remainMin);}} style={{...F_HEAD_STYLE,fontSize:16,fontWeight:900,color:remainMin===0?"#bbb":"#e84142",lineHeight:1,cursor:"pointer"}}>{remainMin}</span>
                          <span style={{...F_HEAD_STYLE,fontSize:16,color:isInactive?"#bbb":"#555",fontWeight:800,lineHeight:1}}>{label}</span>
                          {minStockVal>0&&remainMax!==remainMin
                            ?<span onClick={e=>{e.stopPropagation();setCq(remainMax);}} style={{...F_HEAD_STYLE,fontSize:16,fontWeight:900,color:remainMax===0?"#bbb":"#1a9a50",lineHeight:1,cursor:"pointer"}}>{remainMax}</span>
                            :<span style={{width:16}}/>}
                        </div>
                        {/* Row 2: - qty + (always shown) */}
                        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,flex:1}} onClick={e=>e.stopPropagation()}>
                          <button type="button" onClick={()=>setCq(cq-1)} disabled={cq<=0}
                            style={{width:34,height:34,borderRadius:9,border:"none",background:cq<=0?"#f0f0f0":"#fef1f0",color:cq<=0?"#ccc":"#e84142",fontSize:18,fontWeight:800,cursor:cq<=0?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>−</button>
                          <span onClick={()=>setOpenSize(o=>o===`${blankId}-${key}`?null:`${blankId}-${key}`)} style={{...F_HEAD_STYLE,fontSize:28,fontWeight:900,color:cq>0?"#111":"#ccc",lineHeight:1,minWidth:28,textAlign:"center",cursor:"pointer"}}>{cq}</span>
                          <button type="button" onClick={()=>setCq(cq+1)}
                            style={{width:34,height:34,borderRadius:9,border:"none",background:"#ddfce6",color:"#1a9a50",fontSize:18,fontWeight:800,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>+</button>
                        </div>
                        {/* Row 3: SOLL + ON STOCK + CSV */}
                        <div style={{display:"flex",flexDirection:"column",gap:1,marginTop:6}}>
                          {minStockVal>0&&<span style={{fontSize:10,color:"#bbb",fontWeight:700}}>SOLL: <strong style={{color:"#888"}}>{minStockVal}</strong></span>}
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                            <span style={{fontSize:10,color:"#bbb",fontWeight:700}}>ON STOCK: <strong style={{color:isInactive?"#ccc":avail===0?"#e84142":"#888"}}>{avail}</strong></span>
                            {hasStCode&&<button type="button" onClick={(e)=>{e.stopPropagation();toggleKey(key);}}
                              style={{padding:"1px 5px",borderRadius:4,border:`1px solid ${csvSelected[blankId+"__"+key]?"#111":"#ddd"}`,background:csvSelected[blankId+"__"+key]?"#111":"transparent",color:csvSelected[blankId+"__"+key]?"#fff":"#ccc",fontSize:8,fontWeight:800,cursor:"pointer",letterSpacing:0.3}}>
                              CSV
                            </button>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Detail panel below tiles */}
                {openSize&&(()=>{
                  const t=tileData.find(td=>openSize===`${blankId}-${td.key}`);
                  if(!t)return null;
                  const cqKey=blankId+"-"+t.key;
                  const cq=customQty[cqKey]!=null?customQty[cqKey]:t.remainMax;
                  return renderDetail(t,blankId,blank,cq,cqKey);
                })()}
                </>

                :<div style={{display:"flex",flexDirection:"column",gap:4}}>
                  {tileData.map(t=>{
                    const {key,label,state,remainMin,remainMax,avail,needed,isCapKey,capColor,minStockVal}=t;
                    const isInactive=state==="done"||state==="none";
                    const isOpen=openSize===`${blankId}-${key}`;
                    const cqKey=blankId+"-"+key;
                    const cq=customQty[cqKey]!=null?customQty[cqKey]:remainMax;
                    const setCq=(v)=>setCustomQty(q=>({...q,[cqKey]:Math.max(0,v)}));
                    return(<React.Fragment key={key}>
                      <div onClick={()=>setOpenSize(o=>o===`${blankId}-${key}`?null:`${blankId}-${key}`)}
                        style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",borderRadius:10,cursor:"pointer",
                          background:isOpen?"#fff":isInactive?"#f6f6f6":"#f8f8f8",opacity:state==="none"?0.5:state==="done"?0.65:1,border:isOpen?"2px solid #e84142":"1px solid "+(isInactive?"#e8e8e8":"transparent")}}>
                        {isCapKey&&capColor?<ColorDot hex={capColor.hex} size={14}/>:null}
                        <span style={{...F_HEAD_STYLE,fontSize:14,fontWeight:800,color:isInactive?"#bbb":"#333",minWidth:32}}>{label}</span>
                        {hasStCode&&<button type="button" onClick={(e)=>{e.stopPropagation();toggleKey(key);}}
                          style={{padding:"1px 5px",borderRadius:4,border:`1px solid ${csvSelected[blankId+"__"+key]?"#111":"#ddd"}`,background:csvSelected[blankId+"__"+key]?"#111":"transparent",color:csvSelected[blankId+"__"+key]?"#fff":"#ccc",fontSize:8,fontWeight:800,cursor:"pointer",letterSpacing:0.3}}>
                          CSV
                        </button>}
                        <div style={{flex:1}}/>
                        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:0,flexShrink:0,marginRight:8}}>
                          {minStockVal>0&&<span style={{fontSize:10,color:"#bbb",fontWeight:700}}>SOLL: <strong style={{color:"#888"}}>{minStockVal}</strong></span>}
                          <span style={{fontSize:10,color:"#bbb",fontWeight:700}}>ON STOCK: <strong style={{color:isInactive?"#ccc":avail===0?"#e84142":"#888"}}>{avail}</strong></span>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0}} onClick={e=>e.stopPropagation()}>
                          <button type="button" onClick={()=>setCq(cq-1)} disabled={cq<=0}
                            style={{width:28,height:28,borderRadius:7,border:"none",background:cq<=0?"#f0f0f0":"#fef1f0",color:cq<=0?"#ccc":"#e84142",fontSize:16,fontWeight:800,cursor:cq<=0?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>−</button>
                          <span onClick={()=>setOpenSize(o=>o===`${blankId}-${key}`?null:`${blankId}-${key}`)} style={{...F_HEAD_STYLE,fontSize:20,fontWeight:900,color:cq>0?"#111":"#ccc",minWidth:24,textAlign:"center",cursor:"pointer"}}>{cq}</span>
                          <button type="button" onClick={()=>setCq(cq+1)}
                            style={{width:28,height:28,borderRadius:7,border:"none",background:"#ddfce6",color:"#1a9a50",fontSize:16,fontWeight:800,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>+</button>
                        </div>
                      </div>
                      {isOpen&&renderDetail(t,blankId,blank,cq,cqKey)}
                    </React.Fragment>);
                  })}
                </div>}
                </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Google Sheets Setup Modal ────────────────────────────────────
function SheetsSetupModal({onClose, sheetsUrl}){
  const [shopifyStatus,setShopifyStatus]=useState(null); // null=loading, true=connected, false=error, string=error msg
  useEffect(()=>{
    if(!sheetsUrl)return;
    fetch(`${sheetsUrl}?action=shopify_status`,{redirect:"follow"})
      .then(r=>r.text()).then(t=>{try{const d=JSON.parse(t);setShopifyStatus(d.ok?true:(d.error||false));}catch(e){setShopifyStatus(false);}})
      .catch(()=>setShopifyStatus(false));
  },[sheetsUrl]);
  return(
    <ModalWrap onClose={onClose} width={400}>
      <div style={{...F_HEAD_STYLE,fontSize:17,fontWeight:800}}>Verbindungen</div>
      {/* Google Sheets */}
      <div style={{background:"#f0fdf4",borderRadius:12,padding:"16px 20px",display:"flex",alignItems:"center",gap:12}}>
        <IC_CLOUD size={24} color="#1a9a50"/>
        <div>
          <div style={{fontSize:14,fontWeight:800,color:"#1a9a50"}}>Google Sheets</div>
          <div style={{fontSize:12,color:"#555",marginTop:2}}>Verbunden — automatisch gespeichert</div>
        </div>
      </div>
      {/* Shopify */}
      <div style={{background:shopifyStatus===true?"#f0fdf4":shopifyStatus===null?"#f8f8f8":"#fef1f0",borderRadius:12,padding:"16px 20px",display:"flex",alignItems:"center",gap:12}}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={shopifyStatus===true?"#1a9a50":shopifyStatus===null?"#bbb":"#e84142"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        <div>
          <div style={{fontSize:14,fontWeight:800,color:shopifyStatus===true?"#1a9a50":shopifyStatus===null?"#bbb":"#e84142"}}>Shopify</div>
          <div style={{fontSize:12,color:"#555",marginTop:2}}>
            {shopifyStatus===null?"Prüfe Verbindung...":shopifyStatus===true?"Verbunden":typeof shopifyStatus==="string"?shopifyStatus:"Nicht verbunden — Credentials prüfen"}
          </div>
        </div>
      </div>
      <button type="button" onClick={onClose} style={{width:"100%",padding:13,borderRadius:10,border:"none",background:"#111",color:"#fff",cursor:"pointer",fontWeight:800,fontSize:14}}>OK</button>
    </ModalWrap>
  );
}

// ─── Print Pie Dot helper ────────────────────────────────────────
function PrintPie({colors,r=10,vk="stock"}){
  const cols=colors.filter(c=>(c[vk]||0)>0);
  if(cols.length<=1) return <span className="p-dot" style={{background:cols[0]?.hex||"#888",width:r*2,height:r*2}}/>;
  const tot=cols.reduce((a,c)=>a+(c[vk]||0),0);
  let ang=-Math.PI/2;
  const s=r*2;
  return(
    <svg width={s} height={s} style={{flexShrink:0,overflow:"hidden",borderRadius:"50%"}}>
      {cols.map(c=>{
        const sl=(c[vk]||0)/tot*2*Math.PI;
        const x1=r+r*Math.cos(ang),y1=r+r*Math.sin(ang);
        ang+=sl;
        return <path key={c.id} d={`M${r},${r} L${x1},${y1} A${r},${r} 0 ${sl>Math.PI?1:0},1 ${r+r*Math.cos(ang)},${r+r*Math.sin(ang)} Z`} fill={c.hex}/>;
      })}
      {(()=>{ang=-Math.PI/2;return cols.map(c=>{const sl=(c[vk]||0)/tot*2*Math.PI;const x=r+r*Math.cos(ang),y=r+r*Math.sin(ang);ang+=sl;return <line key={"d"+c.id} x1={r} y1={r} x2={x} y2={y} stroke="white" strokeWidth="1.5"/>;});})()}
      <circle cx={r} cy={r} r={r-1} fill="none" stroke="#444" strokeWidth="1.5"/>
    </svg>
  );
}

// ─── Print View ───────────────────────────────────────────────────


// ─── Password Lock ────────────────────────────────────────────────
// ─── Users (passwords stored as SHA-256 hashes) ───────────────────
const USERS = [
  {name:"Carlos", hash:"f6ccb3e8d609012238c0b39e60b2c9632b3cdede91e035dad1de43469768f4cc", avatar:"C", color:"#4078e0"},
  {name:"Merlin", hash:"eb14d69963691a08c6cae2708c3e37593f5fc636bf73d451d42afebb471d4529", avatar:"M", color:"#e84142"},
  {name:"Vroni",  hash:"60c720535468526bc33eb3ace311f9cba42bbd844b068d53ff5efc5bdfc6c4fa", avatar:"V", color:"#9b5de5"},
  {name:"Demo",   hash:"_demo_", avatar:"D", color:"#f08328", isDemo:true},
];

// ─── Demo Data ───────────────────────────────────────────────────
const DEMO_DATA = (()=>{
  const now=new Date().toISOString();
  const mkStock=(xxs,xs,s,m,l,xl,xxl,xxxl)=>({XXS:xxs,XS:xs,S:s,M:m,L:l,XL:xl,XXL:xxl,XXXL:xxxl});
  const mkMin=(xxs,xs,s,m,l,xl,xxl,xxxl)=>({XXS:xxs,XS:xs,S:s,M:m,L:l,XL:xl,XXL:xxl,XXXL:xxxl});
  const products=[
    {id:"demo_b1",name:"Stanley Stella Creator 2.0",category:"T-Shirt",color:"Black",colorHex:"#111",buyPrice:4.20,stock:mkStock(0,3,8,12,10,6,2,0),minStock:mkMin(0,3,5,8,8,5,3,0),veredelung:["Drucken"],status:"active"},
    {id:"demo_b2",name:"Stanley Stella Creator 2.0",category:"T-Shirt",color:"White",colorHex:"#f5f5f5",buyPrice:4.20,stock:mkStock(0,2,5,7,6,4,1,0),minStock:mkMin(0,3,5,8,8,5,3,0),veredelung:["Drucken"],status:"active"},
    {id:"demo_b3",name:"Stanley Stella Cruiser 2.0",category:"Hoodie",color:"Black",colorHex:"#111",buyPrice:14.50,stock:mkStock(0,1,4,6,5,3,1,0),minStock:mkMin(0,2,4,6,6,4,2,0),veredelung:["Drucken","Sticken"],status:"active"},
    {id:"demo_b4",name:"Stanley Stella Cruiser 2.0",category:"Hoodie",color:"Desert Dust",colorHex:"#c8b08c",buyPrice:14.50,stock:mkStock(0,0,2,3,2,1,0,0),minStock:mkMin(0,2,4,6,6,4,2,0),veredelung:["Drucken"],status:"active"},
    {id:"demo_b5",name:"Stanley Stella Changer 2.0",category:"Crewneck",color:"Black",colorHex:"#111",buyPrice:11.80,stock:mkStock(0,2,5,8,7,4,2,0),minStock:mkMin(0,2,4,6,6,4,2,0),veredelung:["Sticken"],status:"active"},
    {id:"demo_b6",name:"Stanley Stella Trainer",category:"Shorts",color:"Black",colorHex:"#111",buyPrice:9.60,stock:mkStock(0,0,3,5,4,2,0,0),minStock:mkMin(0,0,3,5,5,3,0,0),veredelung:["Drucken"],status:"active"},
    {id:"demo_b7",name:"Flexfit 6277",category:"Cap",color:"Multi",colorHex:"#444",buyPrice:3.80,capColors:[{id:"c1",name:"Black",hex:"#111",stock:12},{id:"c2",name:"Navy",hex:"#1a2744",stock:5},{id:"c3",name:"Olive",hex:"#4a5a3a",stock:0}],veredelung:["Sticken"],status:"active"},
    {id:"demo_b8",name:"Stanley Stella Mini Creator 2.0",category:"T-Shirt",color:"White",colorHex:"#f5f5f5",buyPrice:3.90,stock:mkStock(0,0,4,6,3,0,0,0),minStock:mkMin(0,0,3,5,3,0,0,0),veredelung:["Drucken"],status:"active"},
  ];
  const dtfItems=[
    {id:"demo_d1",name:"LIFE NOT LIKES Front",stock:24,pricePerMeter:38,designsPerMeter:4,linkedProducts:["demo_b1","demo_b2"]},
    {id:"demo_d2",name:"GKBS Backprint Classic",stock:15,pricePerMeter:38,designsPerMeter:3,linkedProducts:["demo_b1","demo_b2"]},
    {id:"demo_d3",name:"WIER Collab Logo",stock:8,pricePerMeter:42,designsPerMeter:5,linkedProducts:["demo_b3"]},
    {id:"demo_d4",name:"Summer Drop Graphic",stock:3,pricePerMeter:38,designsPerMeter:4,linkedProducts:["demo_b6","demo_b8"]},
  ];
  const prods=[
    {id:"demo_p1",name:"LNL Tee Black Drop",blankId:"demo_b1",dtfId:"demo_d1",dtfDesignId:"demo_d1",dtfDesignName:"LIFE NOT LIKES Front",qty:{XXS:0,XS:3,S:5,M:8,L:8,XL:5,XXL:3,XXXL:0},done:{XXS:0,XS:3,S:5,M:6,L:4,XL:2,XXL:0,XXXL:0},status:"In Arbeit",priority:"Hoch",veredelung:["Drucken"],createdAt:now},
    {id:"demo_p2",name:"Classic Hoodie Stickerei",blankId:"demo_b3",qty:{XXS:0,XS:2,S:4,M:6,L:6,XL:4,XXL:2,XXXL:0},done:{XXS:0,XS:0,S:0,M:0,L:0,XL:0,XXL:0,XXXL:0},status:"Offen",priority:"Mittel",veredelung:["Sticken"],createdAt:now},
    {id:"demo_p3",name:"Summer Shorts Print",blankId:"demo_b6",dtfId:"demo_d4",dtfDesignId:"demo_d4",dtfDesignName:"Summer Drop Graphic",qty:{XXS:0,XS:0,S:3,M:5,L:5,XL:3,XXL:0,XXXL:0},done:{XXS:0,XS:0,S:3,M:5,L:5,XL:3,XXL:0,XXXL:0},status:"Fertig",priority:"Niedrig",veredelung:["Drucken"],createdAt:now,completedAt:now},
  ];
  const bestellungen=[
    {id:"demo_o1",produktId:"demo_b4",produktName:"Stanley Stella Cruiser 2.0",label:"Alle Größen",sizeKey:null,isCapKey:false,isDtf:false,menge:16,bestelltAm:now,status:"offen",createdBy:"Demo"},
    {id:"demo_o2",produktId:"demo_d4",produktName:"Summer Drop Graphic",label:"DTF Transfer",sizeKey:"DTF",isCapKey:false,isDtf:true,dtfId:"demo_d4",designsPerMeter:4,meterAnzahl:5,menge:20,bestelltAm:now,status:"offen",createdBy:"Demo"},
  ];
  const verluste=[
    {id:"demo_v1",produktId:"demo_b1",produktName:"Stanley Stella Creator 2.0",produktHex:"#111",grund:"Druckfehler",dtfName:"LIFE NOT LIKES Front",anzahl:2,preisProStk:13.70,gesamt:27.40,notiz:"Fehlplatzierung",datum:now},
  ];
  const promoGifts=[
    {id:"demo_g1",name:"Influencer Sample Pack",info:"@testaccount",preis:45.00,anzahl:1,gesamt:45.00,datum:now},
  ];
  return {products,dtfItems,prods,bestellungen,verluste,promoGifts,categories:DEFAULT_CATEGORIES};
})();

async function sha256(str){
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,"0")).join("");
}

// ─── Activity Log helpers ──────────────────────────────────────────
const LOG_KEY = "gkbs_activity_log";
const LOG_DAYS = 14;

function logActivity(user, action){
  const now = new Date();
  const entry = {
    ts: now.toISOString(),
    user,
    action,
  };
  try {
    const raw = localStorage.getItem(LOG_KEY);
    const logs = raw ? JSON.parse(raw) : [];
    logs.unshift(entry);
    const cutoff = Date.now() - LOG_DAYS * 24 * 60 * 60 * 1000;
    const filtered = logs.filter(l => new Date(l.ts).getTime() > cutoff);
    localStorage.setItem(LOG_KEY, JSON.stringify(filtered.slice(0, 1000)));
  } catch(e){}
  // Also sync to Google Sheets (skip for Demo)
  if(user!=="Demo") sheetsLogActivity(user, action);
}

function getLogs(){
  try {
    const raw = localStorage.getItem(LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch(e){ return []; }
}

function fmtTs(iso){
  const d = new Date(iso);
  const pad = n => String(n).padStart(2,"0");
  return `${d.getDate()}.${pad(d.getMonth()+1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// ─── Activity Log Modal ────────────────────────────────────────────
function ActivityLogModal({onClose}){
  const logs = getLogs();
  const userColors = {};
  USERS.forEach(u => userColors[u.name] = u.color);
  return(
    <ModalWrap onClose={onClose} width={540}>
      <div style={{...F_HEAD_STYLE,fontSize:17,fontWeight:800}}>Activity Log</div>
      <div style={{fontSize:11,color:"#bbb",marginTop:-8}}>Letzte 14 Tage · {logs.length} Einträge</div>
      {logs.length===0&&<div style={{color:"#ccc",textAlign:"center",padding:40,fontSize:14}}>Noch keine Aktivitäten</div>}
      <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:400,overflowY:"auto"}}>
        {logs.map((l,i)=>{
          const col = userColors[l.user] || "#888";
          return(
            <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"9px 12px",background:"#f8f8f8",borderRadius:10,borderLeft:`3px solid ${col}`}}>
              <div style={{width:28,height:28,borderRadius:"50%",background:col,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:900,flexShrink:0}}>
                {l.user[0]}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:700,color:"#111"}}>{l.action}</div>
                <div style={{fontSize:10,color:"#bbb",marginTop:2}}>{l.user} · {fmtTs(l.ts)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </ModalWrap>
  );
}

// ─── Login Screen ──────────────────────────────────────────────────
function SettingsModal({currentUser, onClose, onUpdateUser, settings, onUpdateSettings, sheetsUrl}){
  const [tab,setTab]=useState("account");
  const [newName,setNewName]=useState(currentUser.name);
  const [oldPw,setOldPw]=useState("");
  const [newPw,setNewPw]=useState("");
  const [newPw2,setNewPw2]=useState("");
  const [pwMsg,setPwMsg]=useState(null);
  const [nameMsg,setNameMsg]=useState(null);
  const [showOld,setShowOld]=useState(false);
  const [showNew,setShowNew]=useState(false);
  const [sheetsHash,setSheetsHash]=useState(null);
  const [saving,setSaving]=useState(false);

  // Load current Sheets hash for this user
  useEffect(()=>{
    if(!sheetsUrl)return;
    fetch(`${sheetsUrl}?action=user_hashes`,{redirect:"follow"})
      .then(r=>r.text()).then(t=>{try{const d=JSON.parse(t);if(d.hashes&&d.hashes[currentUser.name])setSheetsHash(d.hashes[currentUser.name]);}catch(e){}})
      .catch(()=>{});
  },[sheetsUrl,currentUser.name]);

  const handleNameSave = () => {
    if(!newName.trim()){setNameMsg({ok:false,text:"Name darf nicht leer sein"});return;}
    onUpdateUser({...currentUser, name:newName.trim()});
    setNameMsg({ok:true,text:"Name gespeichert ✓"});
    setTimeout(()=>setNameMsg(null),2000);
  };

  const handlePwSave = async () => {
    if(!oldPw){setPwMsg({ok:false,text:"Altes Passwort eingeben"});return;}
    if(!newPw||newPw.length<3){setPwMsg({ok:false,text:"Neues Passwort min. 3 Zeichen"});return;}
    if(newPw!==newPw2){setPwMsg({ok:false,text:"Passwörter stimmen nicht überein"});return;}
    const oldHash = await sha256(oldPw);
    // Check against Sheets hash first, fallback to hardcoded
    const activeHash = sheetsHash || currentUser.hash;
    if(oldHash!==activeHash){setPwMsg({ok:false,text:"Altes Passwort falsch"});return;}
    const newHash = await sha256(newPw);
    // Save to Sheets
    setSaving(true);
    try{
      if(sheetsUrl){
        await fetch(sheetsUrl,{method:"POST",redirect:"follow",headers:{"Content-Type":"text/plain"},body:JSON.stringify({action:"save_user_hash",username:currentUser.name,hash:newHash})});
        setSheetsHash(newHash);
      }
    }catch(e){
      setPwMsg({ok:false,text:"Fehler beim Speichern — versuche es nochmal"});
      setSaving(false);
      return;
    }
    setSaving(false);
    setOldPw("");setNewPw("");setNewPw2("");
    setPwMsg({ok:true,text:"Passwort geändert ✓"});
    setTimeout(()=>setPwMsg(null),3000);
  };

  const logs = getLogs();
  const userColors = {};
  USERS.forEach(u => userColors[u.name] = u.color);

  const isDemo = !!currentUser.isDemo;

  return(
    <ModalWrap onClose={onClose} width={560}>
      <div style={{...F_HEAD_STYLE,fontSize:17,fontWeight:800}}>Einstellungen</div>

      {/* Tabs */}
      <div style={{display:"flex",gap:3,background:"#e8e8e8",borderRadius:9,padding:3,marginTop:4}}>
        {[["account","Account"],["display","Shopify Orders"],["log","Activity Log"]].map(([v,lbl])=>(
          <button key={v} onClick={()=>setTab(v)} style={{flex:1,padding:"8px 12px",borderRadius:7,border:"none",background:tab===v?"#fff":"transparent",color:tab===v?"#111":"#666",cursor:"pointer",fontWeight:700,fontSize:13,boxShadow:tab===v?"0 1px 3px rgba(0,0,0,0.08)":"none"}}>
            {lbl}
          </button>
        ))}
      </div>

      {/* Account Tab */}
      {tab==="account"&&(
        <div style={{display:"flex",flexDirection:"column",gap:16,marginTop:8}}>
          {isDemo?<div style={{color:"#f08328",fontSize:13,fontWeight:600,background:"#fef6ed",borderRadius:10,padding:"12px 16px",border:"1px solid #fed7aa"}}>Demo-Modus — Account-Einstellungen nicht verfügbar</div>:(
            <>
              {/* Name */}
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                <div style={{fontSize:12,fontWeight:700,color:"#888"}}>Name</div>
                <div style={{display:"flex",gap:8}}>
                  <input value={newName} onChange={e=>setNewName(e.target.value)} style={{flex:1,padding:"10px 14px",borderRadius:10,border:"1px solid #e8e8e8",fontSize:14,outline:"none",background:"#f8f8f8"}}/>
                  <button onClick={handleNameSave} style={{padding:"10px 18px",borderRadius:10,border:"none",background:"#1a9a50",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:13}}>Speichern</button>
                </div>
                {nameMsg&&<div style={{fontSize:12,color:nameMsg.ok?"#1a9a50":"#e84142",fontWeight:600}}>{nameMsg.text}</div>}
              </div>

              {/* Password */}
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                <div style={{fontSize:12,fontWeight:700,color:"#888"}}>Passwort ändern</div>
                <div style={{position:"relative"}}>
                  <input type={showOld?"text":"password"} value={oldPw} onChange={e=>setOldPw(e.target.value)} placeholder="Altes Passwort" style={{width:"100%",padding:"10px 14px",borderRadius:10,border:"1px solid #e8e8e8",fontSize:14,outline:"none",background:"#f8f8f8",boxSizing:"border-box"}}/>
                  <button onClick={()=>setShowOld(!showOld)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#bbb",fontSize:16}}>{showOld?"◉":"◎"}</button>
                </div>
                <div style={{position:"relative"}}>
                  <input type={showNew?"text":"password"} value={newPw} onChange={e=>setNewPw(e.target.value)} placeholder="Neues Passwort" style={{width:"100%",padding:"10px 14px",borderRadius:10,border:"1px solid #e8e8e8",fontSize:14,outline:"none",background:"#f8f8f8",boxSizing:"border-box"}}/>
                  <button onClick={()=>setShowNew(!showNew)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#bbb",fontSize:16}}>{showNew?"◉":"◎"}</button>
                </div>
                <input type={showNew?"text":"password"} value={newPw2} onChange={e=>setNewPw2(e.target.value)} placeholder="Neues Passwort bestätigen" style={{padding:"10px 14px",borderRadius:10,border:"1px solid #e8e8e8",fontSize:14,outline:"none",background:"#f8f8f8"}}/>
                <button onClick={handlePwSave} disabled={saving} style={{padding:"10px 18px",borderRadius:10,border:"none",background:saving?"#888":"#111",color:"#fff",cursor:saving?"not-allowed":"pointer",fontWeight:700,fontSize:13,alignSelf:"flex-start"}}>{saving?"Speichern...":"Passwort ändern"}</button>
                {pwMsg&&<div style={{fontSize:12,color:pwMsg.ok?"#1a9a50":"#e84142",fontWeight:600}}>{pwMsg.text}</div>}
              </div>
            </>
          )}
        </div>
      )}

      {/* Display Tab */}
      {tab==="display"&&(
        <div style={{display:"flex",flexDirection:"column",gap:12,marginTop:8}}>
          <div style={{fontSize:12,fontWeight:700,color:"#888"}}>Shopify Bestellungen</div>
          <div style={{display:"flex",gap:8}}>
            {[["oe","Nur Online Exclusive"],["all","Alle Bestellungen"]].map(([v,lbl])=>(
              <button key={v} onClick={()=>onUpdateSettings({...settings,orderFilter:v})}
                style={{flex:1,padding:"12px 16px",borderRadius:10,border:`1.5px solid ${settings.orderFilter===v?"#111":"#e8e8e8"}`,background:settings.orderFilter===v?"#111":"#fff",color:settings.orderFilter===v?"#fff":"#666",cursor:"pointer",fontWeight:700,fontSize:13}}>
                {lbl}
              </button>
            ))}
          </div>
          <div style={{fontSize:11,color:"#bbb",marginTop:-4}}>
            {settings.orderFilter==="all"?"Zeigt alle offenen Shopify-Bestellungen an.":"Zeigt nur Bestellungen mit Online Exclusive Produkten."}
          </div>
        </div>
      )}

      {/* Activity Log Tab */}
      {tab==="log"&&(
        <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:8}}>
          <div style={{fontSize:11,color:"#bbb",flexShrink:0}}>Letzte 14 Tage · {logs.length} Einträge</div>
          {logs.length===0&&<div style={{color:"#ccc",textAlign:"center",padding:40,fontSize:14}}>Noch keine Aktivitäten</div>}
          <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:"calc(92dvh - 220px)",overflowY:"auto"}}>
            {logs.map((l,i)=>{
              const col = userColors[l.user] || "#888";
              return(
                <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"9px 12px",background:"#f8f8f8",borderRadius:10,borderLeft:`3px solid ${col}`}}>
                  <div style={{width:28,height:28,borderRadius:"50%",background:col,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:900,flexShrink:0}}>
                    {l.user[0]}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:700,color:"#111"}}>{l.action}</div>
                    <div style={{fontSize:10,color:"#bbb",marginTop:2}}>{l.user} · {fmtTs(l.ts)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </ModalWrap>
  );
}


function LoginScreen({onUnlock}){
  const [selected,setSelected] = useState(null);
  const [pw,setPw] = useState("");
  const [error,setError] = useState(false);
  const [show,setShow] = useState(false);
  const [sheetsHashes,setSheetsHashes] = useState({});
  const realUsers = USERS.filter(u=>!u.isDemo);
  const demoUser = USERS.find(u=>u.isDemo);

  // Load overridden hashes from Sheets on mount
  useEffect(()=>{
    if(!SHEETS_URL)return;
    fetch(`${SHEETS_URL}?action=user_hashes`,{redirect:"follow"})
      .then(r=>r.text()).then(t=>{try{const d=JSON.parse(t);if(d.hashes)setSheetsHashes(d.hashes);}catch(e){}})
      .catch(()=>{});
  },[]);

  const check = async () => {
    const user = USERS.find(u => u.name === selected);
    if(user){
      const h = await sha256(pw);
      // Check Sheets hash first (overrides hardcoded), fallback to hardcoded
      const activeHash = sheetsHashes[user.name] || user.hash;
      if(h === activeHash){
        localStorage.setItem("gkbs_user", selected);
        logActivity(selected, "Eingeloggt");
        onUnlock(selected);
        return;
      }
    }
    setError(true);
    setTimeout(()=>setError(false),1500);
  };

  const loginDemo = () => {
    localStorage.setItem("gkbs_user", demoUser.name);
    onUnlock(demoUser.name);
  };

  // Gradient background animation
  const bgRef=useRef(null);
  const posRef=useRef({x:0,y:0});
  const autoRef=useRef({angle:0,active:true});
  const rafRef=useRef(null);

  useEffect(()=>{
    const el=bgRef.current;if(!el)return;
    const update=(x,y)=>{el.style.setProperty("--posX",String(x));el.style.setProperty("--posY",String(y));};
    const onMove=e=>{autoRef.current.active=false;const r=el.getBoundingClientRect();posRef.current={x:e.clientX-r.left-r.width/2,y:e.clientY-r.top-r.height/2};update(posRef.current.x*0.15,posRef.current.y*0.15);};
    const onTouch=e=>{autoRef.current.active=false;const t=e.touches[0];const r=el.getBoundingClientRect();posRef.current={x:t.clientX-r.left-r.width/2,y:t.clientY-r.top-r.height/2};update(posRef.current.x*0.15,posRef.current.y*0.15);};
    const onEnd=()=>{autoRef.current.active=true;};
    const autoAnimate=()=>{
      if(autoRef.current.active){autoRef.current.angle+=0.008;const x=Math.sin(autoRef.current.angle)*60;const y=Math.cos(autoRef.current.angle*0.7)*40;update(x,y);}
      rafRef.current=requestAnimationFrame(autoAnimate);
    };
    el.addEventListener("mousemove",onMove);el.addEventListener("touchmove",onTouch,{passive:true});el.addEventListener("mouseleave",onEnd);el.addEventListener("touchend",onEnd);
    rafRef.current=requestAnimationFrame(autoAnimate);
    return()=>{el.removeEventListener("mousemove",onMove);el.removeEventListener("touchmove",onTouch);el.removeEventListener("mouseleave",onEnd);el.removeEventListener("touchend",onEnd);cancelAnimationFrame(rafRef.current);};
  },[]);

  return(
    <div ref={bgRef} style={{
      minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Space Grotesk', -apple-system, sans-serif",padding:20,position:"relative",overflow:"hidden",
      "--posX":"0","--posY":"0",
      backgroundImage:[
        "linear-gradient(115deg, rgb(40 0 0), rgb(0 0 0))",
        "radial-gradient(90% 100% at calc(50% + calc(var(--posX) * 1px)) calc(0% + calc(var(--posY) * 1px)), rgb(120 20 20), rgb(15 0 0))",
        "radial-gradient(100% 100% at calc(80% - calc(var(--posX) * 1px)) calc(0% - calc(var(--posY) * 1px)), rgb(180 30 30), rgb(20 0 0))",
        "radial-gradient(150% 210% at calc(100% + calc(var(--posX) * 1px)) calc(0% + calc(var(--posY) * 1px)), rgb(100 10 10), rgb(0 0 0))",
        "radial-gradient(100% 100% at calc(100% - calc(var(--posX) * 1px)) calc(30% - calc(var(--posY) * 1px)), rgb(232 65 66), rgb(40 0 0))",
        "linear-gradient(60deg, rgb(150 20 20), rgb(30 0 0))"
      ].join(","),
      backgroundBlendMode:"overlay, overlay, difference, difference, difference, normal"
    }}>
      <div style={{background:"#fff",borderRadius:20,padding:"40px 32px",width:"100%",maxWidth:360,boxShadow:"0 20px 60px rgba(0,0,0,0.4)",position:"relative",zIndex:1}}>
        <div style={{fontSize:28,fontWeight:900,letterSpacing:-0.5,marginBottom:4,color:"#e84142"}}>GKBS</div>
        <div style={{fontSize:13,color:"#bbb",fontWeight:600,marginBottom:28}}>Inventory Management</div>

        {/* Profile selection */}
        <div style={{fontSize:11,color:"#bbb",fontWeight:700,letterSpacing:0.8,marginBottom:10}}>PROFIL AUSWÄHLEN</div>
        <div style={{display:"flex",gap:10,marginBottom:24}}>
          {realUsers.map(u=>(
            <button key={u.name} onClick={()=>{setSelected(u.name);setPw("");setError(false);}}
              style={{flex:1,padding:"12px 6px",borderRadius:12,border:`2px solid ${selected===u.name?u.color:"#e8e8e8"}`,background:selected===u.name?u.color+"15":"#fff",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:6,transition:"all 0.15s"}}>
              <div style={{width:36,height:36,borderRadius:"50%",background:u.color,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:900}}>{u.avatar}</div>
              <span style={{fontSize:11,fontWeight:700,color:selected===u.name?u.color:"#555"}}>{u.name}</span>
            </button>
          ))}
        </div>

        {/* Password */}
        {selected&&(
          <>
            <div style={{position:"relative",marginBottom:12}}>
              <input
                type={show?"text":"password"}
                placeholder="Passwort"
                value={pw}
                onChange={e=>{setPw(e.target.value);setError(false);}}
                onKeyDown={e=>e.key==="Enter"&&check()}
                style={{width:"100%",padding:"14px 46px 14px 16px",borderRadius:12,border:`2px solid ${error?"#e84142":"#e8e8e8"}`,fontSize:16,outline:"none",boxSizing:"border-box",background:error?"#fef1f0":"#fff",transition:"border-color 0.2s"}}
              />
              <button onClick={()=>setShow(s=>!s)} style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#bbb",padding:0,lineHeight:1,display:"flex"}}>
                {show
                  ?<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  :<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
            {error&&<div style={{color:"#e84142",fontSize:13,fontWeight:600,marginBottom:8}}>Falsches Passwort</div>}
            <button onClick={check} style={{width:"100%",padding:"14px",borderRadius:12,border:"none",background:"#111",color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer"}}>
              Einloggen
            </button>
          </>
        )}

        {/* Demo button */}
        <div style={{borderTop:"1px solid #f0f0f0",marginTop:20,paddingTop:16}}>
          <button onClick={loginDemo} style={{width:"100%",padding:"12px",borderRadius:12,border:"1.5px dashed #f08328",background:"#fff8f0",color:"#f08328",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f08328" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3h6v2H9zM10 8v5"/><path d="M14 8v3"/><rect x="4" y="5" width="16" height="16" rx="2"/></svg>
            Demo-Modus starten
            <span style={{fontSize:10,color:"#cba46a",fontWeight:500}}>· ohne Login</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function AppInner({currentUser,onLogout}){
  const mobile=useIsMobile();
  const isDemo = !!currentUser.isDemo;
  const isDemoRef = useRef(isDemo);
  // ── All state ──────────────────────────────────────────────────
  const [products,__setProducts]=useState([]);
  const [prods,__setProds]=useState([]);
  const [bestellungen,__setBestellungen]=useState([]);
  const [dtfItems,__setDtfItems]=useState([]);
  const [bedarfQty,setBedarfQty]=useState({});
  const [syncStatus,setSyncStatus]=useState(isDemo?"demo":"idle");
  const [shopifyDebug,setShopifyDebug]=useState([]);
  useEffect(()=>{if(shopifyDebug.length>0){const t=setTimeout(()=>setShopifyDebug([]),3500);return ()=>clearTimeout(t);}},[shopifyDebug]);
  const [sheetsUrl,setSheetsUrl]=useState(isDemo?null:SHEETS_URL);

  // ── All refs (must be before triggerSave and setters) ──────────
  const saveTimeout=useRef(null);
  const historyRef=useRef([]);
  const productsRef=useRef([]);
  const prodsRef=useRef([]);
  const categoriesRef=useRef(DEFAULT_CATEGORIES);
  const dtfItemsRef=useRef([]);
  const bestellungenRef=useRef([]);
  const verlusteRef=useRef([]);
  const promoRef=useRef([]);
  const bedarfQtyRef=useRef({});

  const log = (action) => logActivity(currentUser.name, action);

  // ── triggerSave (must be before setters that call it) ──────────
  const triggerSave=useCallback((nextProducts, nextProds, nextDtf, nextBestellungen, nextCategories, nextVerluste, nextPromo, nextVariantCats)=>{
    if(!SHEETS_URL||isDemoRef.current)return;
    clearTimeout(saveTimeout.current);
    setSyncStatus("saving");
    saveTimeout.current=setTimeout(()=>{
      sheetsSave(
        nextProducts||productsRef.current,
        nextProds||prodsRef.current,
        nextDtf||dtfItemsRef.current,
        nextBestellungen||bestellungenRef.current,
        nextCategories||categoriesRef.current,
        nextVerluste||verlusteRef.current,
        nextPromo||promoRef.current,
        nextVariantCats||variantCatsRef.current,
        bedarfQtyRef.current
      )
        .then(()=>{setSyncStatus("ok");setTimeout(()=>setSyncStatus("idle"),2000);})
        .catch(()=>setSyncStatus("error"));
    },1500);
  },[]);

  // ── Sync bedarfQty ref + save on change ──
  const bedarfQtyInit=useRef(false);
  useEffect(()=>{bedarfQtyRef.current=bedarfQty;if(bedarfQtyInit.current)triggerSave();bedarfQtyInit.current=true;},[bedarfQty]);

  // ── Setters ────────────────────────────────────────────────────
  const setDtfItems = useCallback((updater) => {
    __setDtfItems(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      try { localStorage.setItem("gkbs_dtf", JSON.stringify(next)); } catch(e){}
      dtfItemsRef.current = next;
      triggerSave(null, null, next);
      return next;
    });
  }, [triggerSave]);

  const setBestellungen = useCallback((updater) => {
    __setBestellungen(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      try { localStorage.setItem("gkbs_bestellungen", JSON.stringify(next)); } catch(e){}
      bestellungenRef.current = next;
      triggerSave(null, null, null, next);
      return next;
    });
  }, [triggerSave]);

  // Load from Sheets on mount (or seed demo data)
  useEffect(()=>{
    // ── Demo mode: seed with DEMO_DATA, no Sheets ──
    if(isDemoRef.current){
      __setProducts(DEMO_DATA.products);productsRef.current=DEMO_DATA.products;
      __setProds(DEMO_DATA.prods);prodsRef.current=DEMO_DATA.prods;
      __setDtfItems(DEMO_DATA.dtfItems);dtfItemsRef.current=DEMO_DATA.dtfItems;
      __setBestellungen(DEMO_DATA.bestellungen);bestellungenRef.current=DEMO_DATA.bestellungen;
      setVerluste(DEMO_DATA.verluste);verlusteRef.current=DEMO_DATA.verluste;
      setPromoGiftsRaw(DEMO_DATA.promoGifts);promoRef.current=DEMO_DATA.promoGifts;
      if(DEMO_DATA.categories)categoriesRef.current=DEMO_DATA.categories;__setCategories(DEMO_DATA.categories||DEFAULT_CATEGORIES);
      if(DEMO_DATA.variantCats){variantCatsRef.current=DEMO_DATA.variantCats;__setVariantCats(DEMO_DATA.variantCats);}
      setSyncStatus("demo");
      return;
    }
    // ── Real mode: load from Sheets ──
    const url=SHEETS_URL;
    if(!url)return;
    setSyncStatus("loading");
    sheetsLoad().then(data=>{
      if(data?.products){
        const vc=data?.variantCats||variantCatsRef.current||DEFAULT_VARIANT_CATS;
        const cleaned=data.products.map(p=>vc.includes(p.category)?p:{...p,capColors:null});
        __setProducts(cleaned);productsRef.current=cleaned;
      }
      if(data?.prods){__setProds(data.prods);prodsRef.current=data.prods;}
      if(data?.categories&&Array.isArray(data.categories)&&data.categories.length>0){categoriesRef.current=data.categories;__setCategories(data.categories);}
      if(data?.variantCats&&Array.isArray(data.variantCats)){variantCatsRef.current=data.variantCats;__setVariantCats(data.variantCats);try{localStorage.setItem("gkbs_variant_cats",JSON.stringify(data.variantCats));}catch(e){}}
      // Merge remote logs with localStorage
      if(data?.logs && Array.isArray(data.logs)){
        try{
          const raw=localStorage.getItem(LOG_KEY);
          const local=raw?JSON.parse(raw):[];
          const merged=[...data.logs,...local];
          const seen=new Set();
          const deduped=merged.filter(l=>{const k=l.ts+l.user+l.action;if(seen.has(k))return false;seen.add(k);return true;});
          const cutoff=Date.now()-LOG_DAYS*24*60*60*1000;
          const filtered=deduped.filter(l=>new Date(l.ts).getTime()>cutoff).sort((a,b)=>new Date(b.ts)-new Date(a.ts));
          localStorage.setItem(LOG_KEY,JSON.stringify(filtered.slice(0,1000)));
        }catch(e){}
      }
      // Load bestellungen – prefer sheets, fallback localStorage
      try{
        if(data?.bestellungen && Array.isArray(data.bestellungen) && data.bestellungen.length>0){
          __setBestellungen(data.bestellungen);
          bestellungenRef.current=data.bestellungen;
          localStorage.setItem("gkbs_bestellungen", JSON.stringify(data.bestellungen));
        } else {
          const raw=localStorage.getItem("gkbs_bestellungen");
          if(raw){const b=JSON.parse(raw);__setBestellungen(b);bestellungenRef.current=b;}
        }
      }catch(e){}
      // Load DTF – prefer sheets data, fallback to localStorage
      try{
        if(data?.dtfItems && Array.isArray(data.dtfItems) && data.dtfItems.length>0){
          __setDtfItems(data.dtfItems);
          dtfItemsRef.current=data.dtfItems;
          localStorage.setItem("gkbs_dtf", JSON.stringify(data.dtfItems));
        } else {
          const rawDtf=localStorage.getItem("gkbs_dtf");
          if(rawDtf){const d=JSON.parse(rawDtf);__setDtfItems(d);dtfItemsRef.current=d;}
        }
      }catch(e){}
      // Load verluste – prefer sheets, fallback localStorage
      try{
        if(data?.verluste && Array.isArray(data.verluste) && data.verluste.length>0){
          setVerluste(data.verluste); verlusteRef.current=data.verluste;
          localStorage.setItem("gkbs_verluste", JSON.stringify(data.verluste));
        } else {
          const raw=localStorage.getItem("gkbs_verluste");
          if(raw){const v=JSON.parse(raw);setVerluste(v);verlusteRef.current=v;}
        }
      }catch(e){}
      // Load promoGifts – prefer sheets, fallback localStorage
      try{
        if(data?.promoGifts && Array.isArray(data.promoGifts) && data.promoGifts.length>0){
          setPromoGiftsRaw(data.promoGifts); promoRef.current=data.promoGifts;
          localStorage.setItem("gkbs_promo", JSON.stringify(data.promoGifts));
        } else {
          const raw=localStorage.getItem("gkbs_promo");
          if(raw){const p=JSON.parse(raw);setPromoGiftsRaw(p);promoRef.current=p;}
        }
      }catch(e){}
      // Load bedarfQty
      if(data?.bedarfQty && typeof data.bedarfQty==="object"){setBedarfQty(data.bedarfQty);}
      setSyncStatus(data?"ok":"error");
      setTimeout(()=>setSyncStatus("idle"),2000);
    });
    // Load shopifyLinks from cache if available
    const cachedLinks=shopCacheGet("shopify_links");
    if(cachedLinks){setShopifyLinks(cachedLinks);}
  },[]);

  const handleBestellen = (blank, key, isCapKey, capColor, menge) => {
    const label = isCapKey ? (capColor?.name || key) : key;
    setBestellModal({blank, key, isCapKey, capColor, toOrder: menge});
  };

  const handleDirectAdd = (blank, key, isCapKey, capColor, menge) => {
    const label = isCapKey ? (capColor?.name || key) : key;
    const neu = {
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      blankId: blank.id, blankName: blank.name, produktName: blank.name, blankHex: blank.colorHex||"#ccc",
      sizeKey: key, label, isCapKey, capColor: capColor||null,
      menge, status: "offen",
      bestelltAm: new Date().toISOString(), createdBy: currentUser.name,
    };
    setBestellungen(b => {
      log(`Direkt bestellt: ${blank.name} ${label} × ${menge}`);
      return [neu,...b];
    });
  };

  const handleBestellungConfirm = (menge) => {
    const {blank, key, isCapKey, capColor, isDtf, dtfName} = bestellModal;
    const label = isDtf ? "DTF Transfer" : (isCapKey ? (capColor?.name || key) : key);
    const dpm = bestellModal?.designsPerMeter||1;
    const meter = isDtf && dpm>1 ? Math.ceil(menge/dpm) : null;
    const neu = {
      id: Date.now().toString(),
      produktId: blank.id,
      produktName: isDtf ? (dtfName || blank.name) : blank.name,
      label,
      sizeKey: key,
      isCapKey,
      capColorId: capColor?.id || null,
      isDtf: isDtf||false,
      dtfId: isDtf ? blank.id : null,
      designsPerMeter: isDtf ? dpm : null,
      meterAnzahl: meter,
      menge,
      bestelltAm: new Date().toISOString(),
      status: "offen"
    };
    setBestellungen(b => [neu, ...b]);
    log(`Bestellung aufgegeben – ${neu.produktName}${isDtf?" (DTF)":" | "+label}: ${menge} Stk`);
    setBestellModal(null);
  };

  const directAddBestellung = (blank, key, isCapKey, capColor, menge) => {
    const label = isCapKey ? (capColor?.name || key) : key;
    const neu = {
      id: (Date.now() + Math.random()).toString(),
      produktId: blank.id,
      produktName: blank.name,
      label,
      sizeKey: key,
      isCapKey,
      capColorId: capColor?.id || null,
      isDtf: false,
      dtfId: null,
      designsPerMeter: null,
      meterAnzahl: null,
      menge,
      bestelltAm: new Date().toISOString(),
      status: "offen"
    };
    setBestellungen(b => [neu, ...b]);
    log(`Bestellung aufgegeben – ${blank.name} | ${label}: ${menge} Stk`);
  };

  const handleWareneingang = (bestellung, mengeEingang) => {
    if(bestellung.isDtf && bestellung.dtfId) {
      // mengeEingang is in Meter if designsPerMeter>1, convert back to Stück
      const dpm = bestellung.designsPerMeter||1;
      const stueck = dpm>1 ? mengeEingang*dpm : mengeEingang;
      setDtfItems(d=>d.map(x=>x.id===bestellung.dtfId?{...x,stock:(x.stock||0)+stueck}:x));
      setBestellungen(b=>b.map(x=>x.id===bestellung.id?{...x,status:"erledigt",mengeErhalten:mengeEingang,stueckErhalten:stueck,erhaltenAm:new Date().toISOString()}:x));
      log(`Wareneingang DTF – ${bestellung.produktName}: ${mengeEingang}${dpm>1?" m ("+stueck+" Stk)":""} zum Bestand addiert`);
      setWareneingangModal(null);
      return;
    } else {
      // Add to product stock
      setProducts(ps => ps.map(p => {
        if(p.id !== bestellung.produktId) return p;
        if(bestellung.isCapKey) {
          const newCaps = (p.capColors||[]).map(c =>
            c.id === bestellung.capColorId ? {...c, stock: (c.stock||0) + mengeEingang} : c
          );
          return {...p, capColors: newCaps};
        } else {
          const newStock = {...(p.stock||{}), [bestellung.sizeKey]: ((p.stock||{})[bestellung.sizeKey]||0) + mengeEingang};
          return {...p, stock: newStock};
        }
      }));
    }
    // Mark as erledigt (Textil path)
    setBestellungen(b => b.map(x => x.id === bestellung.id ? {...x, status:"erledigt", mengeErhalten: mengeEingang, erhaltenAm: new Date().toISOString()} : x));
    log(`Wareneingang – ${bestellung.produktName} | ${bestellung.label}: ${mengeEingang} Stk zum Bestand addiert`);
    setWareneingangModal(null);
  };


  const setProducts=useCallback((updater)=>{
    __setProducts(prev=>{
      const next=typeof updater==="function"?updater(prev):updater;
      historyRef.current=[{products:prev,prods:prodsRef.current,categories:categoriesRef.current},...historyRef.current].slice(0,MAX_HISTORY);
      productsRef.current=next;
      triggerSave(next,null);
      return next;
    });
  },[triggerSave]);

  const setProds=useCallback((updater)=>{
    __setProds(prev=>{
      const next=typeof updater==="function"?updater(prev):updater;
      historyRef.current=[{products:productsRef.current,prods:prev,categories:categoriesRef.current},...historyRef.current].slice(0,MAX_HISTORY);
      prodsRef.current=next;
      triggerSave(null,next);
      return next;
    });
  },[triggerSave]);

  const setBoth=useCallback((prodUpdater,orderUpdater)=>{
    __setProducts(prevP=>{
      const nextP=typeof prodUpdater==="function"?prodUpdater(prevP):prodUpdater;
      __setProds(prevO=>{
        const nextO=typeof orderUpdater==="function"?orderUpdater(prevO):orderUpdater;
        historyRef.current=[{products:prevP,prods:prevO,categories:categoriesRef.current},...historyRef.current].slice(0,MAX_HISTORY);
        productsRef.current=nextP;
        prodsRef.current=nextO;
        return nextO;
      });
      return nextP;
    });
  },[]);

  const [undoCount,setUndoCount]=useState(0);
  const undo=()=>{
    if(historyRef.current.length===0)return;
    const[last,...rest]=historyRef.current;
    historyRef.current=rest;
    productsRef.current=last.products;
    prodsRef.current=last.prods;
    categoriesRef.current=last.categories||categoriesRef.current;
    __setProducts(last.products);
    __setProds(last.prods);
    if(last.categories)__setCategories(last.categories);
    setUndoCount(rest.length);
  };
  // sync count after mutations
  const canUndo=historyRef.current.length>0;

  const [categories,__setCategories]=useState(DEFAULT_CATEGORIES);
  const [variantCats,__setVariantCats]=useState(()=>{try{const s=localStorage.getItem("gkbs_variant_cats");return s?JSON.parse(s):DEFAULT_VARIANT_CATS;}catch(e){return DEFAULT_VARIANT_CATS;}});
  const variantCatsRef=useRef(variantCats);
  const setVariantCats=useCallback((vc)=>{variantCatsRef.current=vc;__setVariantCats(vc);try{localStorage.setItem("gkbs_variant_cats",JSON.stringify(vc));}catch(e){}triggerSave(null,null,null,null,null,null,null,vc);},[triggerSave]);
  const isVariantCat=useCallback((cat)=>variantCatsRef.current.includes(cat),[]);
  const setCategories=useCallback((cats)=>{
    historyRef.current=[{products:productsRef.current,prods:prodsRef.current,categories:categoriesRef.current},...historyRef.current].slice(0,MAX_HISTORY);
    categoriesRef.current=cats;
    __setCategories(cats);
    try{localStorage.setItem("gkbs_categories",JSON.stringify(cats));}catch(e){}
    triggerSave(null,null,null,null,cats);
  },[triggerSave]);
  const [catFilter,setCatFilter]=useState("All");
  const [search,setSearch]=useState("");
  const [view,setView]=useState("production");
  const [inventoryTab,setInventoryTab]=useState("textil");
  const [shopifyLinks,setShopifyLinks]=useState([]);
  const [shopifyLinkModal,setShopifyLinkModal]=useState(null); // prod object to link
  const [prodMainTab,setProdMainTab]=useState("auftraege");
  const [shopifyBadge,setShopifyBadge]=useState(0);
  const [prodSubView,setProdSubView]=useState("Alle");
  const [showProdModal,setShowProdModal]=useState(false);
  const [showPAModal,setShowPAModal]=useState(false);
  const [showCats,setShowCats]=useState(false);
  const [showBestellbedarf,setShowBestellbedarf]=useState(false);
  const [showManualBestell,setShowManualBestell]=useState(false);
  const [showArchive,setShowArchive]=useState(false);
  const [showSheetsSetup,setShowSheetsSetup]=useState(false);
  const [confirmDelete,setConfirmDelete]=useState(null);
  const [confirmProduce,setConfirmProduce]=useState(null);
  const [prioFilter,setPrioFilter]=useState("Alle");
  const dragItem=useRef(null),dragOver=useRef(null);

  const filtered=products.filter(p=>(catFilter==="All"||p.category===catFilter)&&(!search||p.name.toLowerCase().includes(search.toLowerCase())));
  const totalQty=products.reduce((a,p)=>a+(totalStock(p)),0);
  const textilVal=products.reduce((a,p)=>{if(p.buyPrice==null)return a;const q=totalStock(p);return a+q*p.buyPrice;},0);
  const dtfVal=dtfItems.reduce((a,d)=>{if(d.pricePerMeter==null)return a;const ppp=d.pricePerMeter/Math.max(1,d.designsPerMeter||1);return a+ppp*d.stock;},0);
  const totalVal=textilVal+dtfVal;
  const lowCount=products.filter(p=>(p.capColors?.length>0)?(p.capColors||[]).some(c=>c.stock>0&&c.stock<=LOW_STOCK):Object.values(p.stock||{}).some(v=>v>0&&v<=LOW_STOCK)).length;
  const outCount=products.filter(p=>(p.capColors?.length>0)?(p.capColors||[]).every(c=>c.stock===0):Object.values(p.stock||{}).every(v=>v===0)).length;
  const activeProdsArr=prods.filter(p=>p.status!=="Fertig");
  const bedarfCount=useMemo(()=>{
    const bm={};
    activeProdsArr.forEach(p=>{
      if(!bm[p.blankId])bm[p.blankId]={};
      if(p.isCapOrder){(p.capColors||[]).forEach(cc=>{const k="cap_"+cc.id+"_"+cc.name;bm[p.blankId][k]=(bm[p.blankId][k]||0)+(cc.qty||0);});}
      else{DEFAULT_SIZES.forEach(s=>{const q=(p.qty||{})[s]||0;bm[p.blankId][s]=(bm[p.blankId][s]||0)+q;});}
    });
    let count=0;
    Object.entries(bm).forEach(([blankId,sn])=>{
      const bl=products.find(p=>p.id===blankId);if(!bl)return;
      const has=Object.keys(sn).some(k=>{
        const needed=sn[k]||0;if(!needed)return false;
        const isCap=k.startsWith("cap_");
        const avail=isCap?((bl.capColors||[]).find(cc=>"cap_"+cc.id+"_"+cc.name===k)?.stock||0):((bl.stock||{})[k]||0);
        const min=isCap?0:((bl.minStock||{})[k]||0);
        return Math.max(0,needed+min-avail)>0;
      });
      if(has)count++;
    });
    return count;
  },[activeProdsArr,products]);
  const dtfBedarfCount=useMemo(()=>{
    const dm={};
    activeProdsArr.forEach(p=>{
      if(!p.dtfId)return;
      const tot=p.isCapOrder?(p.capColors||[]).reduce((a,c)=>a+c.qty,0):DEFAULT_SIZES.reduce((a,s)=>a+((p.qty||{})[s]||0),0);
      dm[p.dtfId]=(dm[p.dtfId]||0)+tot;
    });
    return (dtfItems||[]).filter(d=>{
      const needed=dm[d.id]||0;
      return Math.max(0,needed-(d.stock||0))>0;
    }).length;
  },[activeProdsArr,dtfItems]);
  const archivedProdsArr=prods.filter(p=>p.status==="Fertig").sort((a,b)=>(b.completedAt||0)-(a.completedAt||0));
  const PRIORITY_ORDER={"Hoch":0,"Mittel":1,"Niedrig":2};

  const filteredProds=activeProdsArr
    .filter(p=>{
      if(prodSubView==="Drucken"&&!(p.veredelung||[]).includes("Drucken"))return false;
      if(prodSubView==="Sticken"&&!(p.veredelung||[]).includes("Sticken"))return false;
      if(prioFilter!=="Alle"&&p.priority!==prioFilter)return false;
      return true;
    })
;

  const onDragStart=(e,id)=>{dragItem.current=id;e.dataTransfer.effectAllowed="move";};
  const onDragEnter=(_,id)=>{dragOver.current=id;};
  const onDragEnd=()=>{
    if(dragItem.current===dragOver.current)return;
    // Reorder within prods (for production drag)
    setProds(prev=>{const arr=[...prev];const fi=arr.findIndex(p=>p.id===dragItem.current),ti=arr.findIndex(p=>p.id===dragOver.current);if(fi<0||ti<0)return prev;const[m]=arr.splice(fi,1);arr.splice(ti,0,m);return arr;});
    dragItem.current=null;dragOver.current=null;
  };
  const onProductDragStart=(e,id)=>{dragItem.current=id;e.dataTransfer.effectAllowed="move";};
  const onProductDragEnter=(_,id)=>{dragOver.current=id;};
  const onProductDragEnd=()=>{
    if(dragItem.current===dragOver.current)return;
    setProducts(prev=>{const arr=[...prev];const fi=arr.findIndex(p=>p.id===dragItem.current),ti=arr.findIndex(p=>p.id===dragOver.current);if(fi<0||ti<0)return prev;const[m]=arr.splice(fi,1);arr.splice(ti,0,m);return arr;});
    dragItem.current=null;dragOver.current=null;
  };

  const handleProduceConfirm=()=>{
    const prod=confirmProduce;
    const isCap=prod.isCapOrder;
    const totalDone=totalProdDone(prod);
    if(totalDone===0){setConfirmProduce(null);return;}

    // Create archive entry for this batch
    const archiveEntry={
      id:prod.id+"_"+Date.now(),
      name:prod.name,
      blankId:prod.blankId,
      colorHex:prod.colorHex,
      notes:prod.notes,
      veredelung:prod.veredelung,
      completedAt:Date.now(),
      isCapOrder:isCap,
      status:"Fertig",
      // Snapshot what was done this batch
      qty:isCap?undefined:{...prod.done},
      done:isCap?undefined:{...prod.done},
      capColors:isCap?(prod.capColors||[]).filter(c=>c.done>0).map(c=>({...c,qty:c.done})):undefined,
    };

    setBoth(
      // Subtract done from blank stock
      ps=>ps.map(p=>{
        if(p.id!==prod.blankId)return p;
        if(isCap){
          const newCapColors=(p.capColors||[]).map(bc=>{
            const oc=(prod.capColors||[]).find(c=>c.id===bc.id);
            return oc?{...bc,stock:Math.max(0,bc.stock-oc.done)}:bc;
          });
          return {...p,capColors:newCapColors};
        }
        const ns={...(p.stock||{})};
        DEFAULT_SIZES.forEach(s=>{ns[s]=Math.max(0,(ns[s]||0)-((prod.done||{})[s]||0));});
        return {...p,stock:ns};
      }),
      // Update production order: reduce remaining qty, reset done; add archive entry
      ps=>{
        const updated=ps.map(p=>{
          if(p.id!==prod.id)return p;
          if(isCap){
            const updatedCaps=(p.capColors||[]).map(c=>({...c,qty:Math.max(0,c.qty-c.done),done:0}));
            const remaining=updatedCaps.reduce((a,c)=>a+c.qty,0);
            return remaining===0?null:{...p,capColors:updatedCaps};
          }
          const newQty={...(p.qty||{})},newDone={...(p.done||{})};
          DEFAULT_SIZES.forEach(s=>{newQty[s]=Math.max(0,(newQty[s]||0)-(newDone[s]||0));newDone[s]=0;});
          const remaining=DEFAULT_SIZES.reduce((a,s)=>a+(newQty[s]||0),0);
          return remaining===0?null:{...p,qty:newQty,done:newDone};
        }).filter(Boolean);
        return [...updated,archiveEntry];
      }
    );
    // Deduct from DTF stock if linked
    if(prod.dtfId){
      const totalProduced = isCap
        ? (prod.capColors||[]).reduce((a,c)=>a+c.done,0)
        : DEFAULT_SIZES.reduce((a,s)=>a+((prod.done||{})[s]||0),0);
      if(totalProduced>0){
        setDtfItems(d=>d.map(x=>x.id===prod.dtfId?{...x,stock:Math.max(0,x.stock-totalProduced)}:x));
        const dtfName=dtfItems.find(x=>x.id===prod.dtfId)?.name||prod.dtfId;
        log(`DTF Abzug – ${dtfName}: −${totalProduced} Stk (Auftrag: ${prod.name})`);
      }
    }
    setConfirmProduce(null);
    // Push per-size quantities to Shopify if prod has shopifyProductLink
    if(prod.shopifyProductLink && !isCap){
      const link = prod.shopifyProductLink;
      const doneSizes = prod.done || {};
      const debugLines = [`Push zu: ${link.title}`, `locationId: ${link.locationId||"LEER"}`, `Varianten: ${(link.variants||[]).length}`];
      DEFAULT_SIZES.forEach(size => {
        const qty = doneSizes[size] || 0;
        if(qty <= 0) return;
        const variant = (link.variants||[]).find(v =>
          v.title.toLowerCase() === size.toLowerCase() ||
          v.title.toLowerCase().split('/')[0].trim() === size.toLowerCase()
        );
        if(!variant){ debugLines.push(`❌ ${size}: Variante nicht gefunden`); return; }
        debugLines.push(`⟳ ${size} +${qty} → ${variant.inventory_item_id}`);
        fetch(SHEETS_URL, {
          method:"POST", redirect:"follow",
          headers:{"Content-Type":"text/plain"},
          body:JSON.stringify({
            action:"shopify_adjust_inventory",
            location_id: link.locationId,
            inventory_item_id: variant.inventory_item_id,
            available_adjustment: qty
          })
        }).then(r=>r.text()).then(t=>{
          try {
            const parsed = JSON.parse(t);
            setShopifyDebug(d=>[...d, `✓ ${size} +${qty}: ${parsed.inventory_level?"OK":parsed.error||t.slice(0,80)}`]);
          } catch(e) { setShopifyDebug(d=>[...d, `✓ ${size} +${qty}: ${t.slice(0,80)}`]); }
          log(`Shopify +${qty}×${size} → ${link.title}`);
        }).catch(e=>setShopifyDebug(d=>[...d, `❌ ${size}: ${String(e)}`]));
      });
      setShopifyDebug(debugLines);
    } else if(!prod.shopifyProductLink) {
      setShopifyDebug(["⚠ Kein Shopify Produkt verknüpft"]);
    }
  };




  // ─── PDF Export ───────────────────────────────────────────────

  // ─── Shopify Inventory Push ───────────────────────────────────
  const shopifyAdjustInventory = async (link, qty) => {
    if(!SHEETS_URL||!link) return;
    try {
      await fetch(SHEETS_URL, {
        method:"POST", redirect:"follow",
        headers:{"Content-Type":"text/plain"},
        body: JSON.stringify({
          action:"shopify_adjust_inventory",
          location_id: link.shopifyLocationId,
          inventory_item_id: link.shopifyInventoryItemId,
          available_adjustment: qty
        })
      });
      log(`Shopify Bestand +${qty} für: ${link.label||link.shopifyProductId}`);
    } catch(e) { console.warn("Shopify push failed",e); }
  };

  const TABS=[["production","Produktion",IC_PROD],["inventory","Bestand",IC_BOX],["bestellbedarf","Bestellbedarf",IC_CHART],["bestellungen","Bestellte Ware",IC_CART],["shopify","Shopify",IC_SHOP],["finance","Finanzen",IC_DOLLAR]];
  const [showActivityLog,setShowActivityLog]=useState(false);
  const [showSettings,setShowSettings]=useState(false);
  const [appSettings,setAppSettings]=useState(()=>{try{const r=localStorage.getItem("gkbs_settings");return r?JSON.parse(r):{orderFilter:"oe"};}catch(e){return {orderFilter:"oe"};}});
  const updateSettings=(s)=>{setAppSettings(s);try{localStorage.setItem("gkbs_settings",JSON.stringify(s));}catch(e){}};
  const [userOverrides,setUserOverrides]=useState(()=>{try{const r=localStorage.getItem("gkbs_user_overrides");return r?JSON.parse(r):{};}catch(e){return {};}});
  const updateUser=(u)=>{const o={...userOverrides,[u.name]:{hash:u.hash,displayName:u.name}};setUserOverrides(o);try{localStorage.setItem("gkbs_user_overrides",JSON.stringify(o));}catch(e){};};
  const [bestellModal,setBestellModal]=useState(null);
  const [verluste,setVerluste]=useState(()=>{try{const r=localStorage.getItem("gkbs_verluste");return r?JSON.parse(r):[];}catch(e){return [];}});
  const setVerlusteAndSave=(fn)=>setVerluste(prev=>{const next=typeof fn==="function"?fn(prev):fn;try{localStorage.setItem("gkbs_verluste",JSON.stringify(next));}catch(e){}verlusteRef.current=next;triggerSave(null,null,null,null,null,next,null);return next;});
  const [promoGifts,setPromoGiftsRaw]=useState(()=>{try{const r=localStorage.getItem("gkbs_promo");return r?JSON.parse(r):[];}catch(e){return [];}});
  const setPromoGifts=(fn)=>setPromoGiftsRaw(prev=>{const next=typeof fn==="function"?fn(prev):fn;try{localStorage.setItem("gkbs_promo",JSON.stringify(next));}catch(e){}promoRef.current=next;triggerSave(null,null,null,null,null,null,next);return next;});
  const [showDtfModal,setShowDtfModal]=useState(false); // false | "add" | item // {blank,key,isCapKey,capColor,toOrder}
  const [wareneingangModal,setWareneingangModal]=useState(null); // bestellung object

  return(
    <div style={{minHeight:"100vh",background:"#f4f4f4",color:"#111",fontFamily:"'Space Grotesk', -apple-system, sans-serif"}}>
      {showProdModal&&<ProductModal categories={categories} variantCats={variantCats} initial={showProdModal==="add"?null:showProdModal} onClose={()=>setShowProdModal(false)} onDelete={showProdModal!=="add"?()=>{const p=showProdModal;setProducts(ps=>ps.filter(x=>x.id!==p.id));const SIZES=["XXS","XS","S","M","L","XL","XXL","XXXL"];const total=SIZES.reduce((a,s)=>a+((p.stock||{})[s]||0),0);log(`Produkt gelöscht – ${p.name}${total>0?` | ${total} Stk im Lager`:""}`);setShowProdModal(false);}:undefined} onSave={p=>{
        try{
          if(showProdModal==="add"){
            setProducts(ps=>[...ps,p]);
            try{log(`Produkt angelegt – ${p.name}`);}catch(e){}
          }else{
            setProducts(ps=>ps.map(x=>x.id===p.id?p:x));
            try{log(`Produkt gespeichert – ${p.name}`);}catch(e){}
          }
        }catch(e){console.warn("save error",e);}
        setShowProdModal(false);
      }}/>}
      {showPAModal&&<ProductionModal products={products} dtfItems={dtfItems} initial={showPAModal==="add"?null:showPAModal} onClose={()=>setShowPAModal(false)} onSave={p=>{if(showPAModal==="add"){setProds(ps=>[...ps,p]);(() => {
  const SIZES=["XXS","XS","S","M","L","XL","XXL","XXXL"];
  let qtyStr="";
  if(p.isCapOrder){
    qtyStr=(p.capColors||[]).filter(c=>c.qty>0).map(c=>`${c.name}: ${c.qty}St`).join(", ");
  } else {
    qtyStr=SIZES.filter(s=>(p.qty||{})[s]>0).map(s=>`${s}: ${(p.qty||{})[s]}St`).join(", ");
  }
  const blankName=products.find(x=>x.id===p.blankId)?.name||"";
  log(`Auftrag angelegt – ${p.name} | ${blankName}${qtyStr?` | ${qtyStr}`:""}${p.priority?` | ${p.priority}`:""}${p.status?` | ${p.status}`:""}`);
})();}else{setProds(ps=>ps.map(x=>x.id===p.id?p:x));(() => {
  const old=prods.find(x=>x.id===p.id);
  const parts=[];
  if(old?.status!==p.status) parts.push(`Status: ${old?.status}→${p.status}`);
  if(old?.priority!==p.priority) parts.push(`Priorität: ${old?.priority}→${p.priority}`);
  log(parts.length>0?`Auftrag bearbeitet – ${p.name} | ${parts.join(", ")}`:`Auftrag gespeichert – ${p.name}`);
})();}setShowPAModal(false);}}/>}
      {showCats&&<CategoryModal categories={categories} variantCats={variantCats} onClose={()=>setShowCats(false)} onSave={(cats,vCats)=>{setCategories(cats);setVariantCats(vCats);setShowCats(false);}}/>}
      {confirmDelete&&<DeleteConfirmModal name={confirmDelete.name} onConfirm={()=>{confirmDelete.onConfirm();setConfirmDelete(null);}} onCancel={()=>setConfirmDelete(null)}/>}
      {shopifyDebug.length>0&&(
        <div style={{position:"fixed",bottom:24,right:16,background:"#111",color:"#fff",borderRadius:12,padding:"12px 16px",zIndex:500,maxWidth:320,fontSize:12,boxShadow:"0 4px 20px rgba(0,0,0,0.3)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <span style={{fontWeight:800,fontSize:13}}>Shopify Debug</span>
            <button onClick={()=>setShopifyDebug([])} style={{background:"none",border:"none",color:"#bbb",cursor:"pointer",fontSize:16,lineHeight:1}}>✕</button>
          </div>
          {shopifyDebug.map((l,i)=><div key={i} style={{padding:"2px 0",borderBottom:"1px solid #333",color:l.startsWith("❌")?"#f87171":l.startsWith("✓")?"#4ade80":"#fff"}}>{l}</div>)}
        </div>
      )}
      {confirmProduce&&<ConfirmProduceModal prod={confirmProduce} blank={products.find(p=>p.id===confirmProduce.blankId)} onConfirm={handleProduceConfirm} onCancel={()=>setConfirmProduce(null)}/>}
      {showSheetsSetup&&<SheetsSetupModal onClose={()=>setShowSheetsSetup(false)} sheetsUrl={sheetsUrl}/>}
      {showBestellbedarf&&<BestellbedarfModal prods={prods} products={products} onClose={()=>setShowBestellbedarf(false)}/>}
      {showManualBestell&&<ManualBestellModal products={products} dtfItems={dtfItems} currentUser={currentUser} onClose={()=>setShowManualBestell(false)} onAddProd={(neu)=>{setProds(ps=>[neu,...ps]);log(`Manueller Bedarf – ${neu.name}`);}} onAddDtfBedarf={(dtf,menge,notiz)=>{const dpm=dtf.designsPerMeter||1;setBestellungen(b=>[{id:Date.now().toString(),produktId:dtf.id,produktName:dtf.name,label:"DTF Transfer",sizeKey:"dtf",isDtf:true,dtfId:dtf.id,designsPerMeter:dpm,meterAnzahl:dpm>1?Math.ceil(menge/dpm):null,menge,status:"offen",bestelltAm:new Date().toISOString(),createdBy:currentUser?.name,notiz},...b]);log(`Manueller DTF Bedarf – ${dtf.name}: ${menge} Stk`);}}/>}
    {showActivityLog&&<ActivityLogModal onClose={()=>setShowActivityLog(false)}/>}
    {showSettings&&<SettingsModal currentUser={currentUser} onClose={()=>setShowSettings(false)} onUpdateUser={updateUser} settings={appSettings} onUpdateSettings={updateSettings} sheetsUrl={sheetsUrl}/>}
    {showDtfModal&&<DtfModal
      initial={showDtfModal==="add"?null:showDtfModal}
      onClose={()=>setShowDtfModal(false)}
      onSave={item=>{
        if(showDtfModal==="add"){setDtfItems(d=>[item,...d]);log(`DTF angelegt: ${item.name} | ${item.stock} Stk`);}
        else{setDtfItems(d=>d.map(x=>x.id===item.id?item:x));log(`DTF bearbeitet: ${item.name}`);}
        setShowDtfModal(false);
      }}/>}
    {bestellModal&&<BestellungAufgebenModal blank={bestellModal.blank} sizeKey={bestellModal.key} isCapKey={bestellModal.isCapKey} capColor={bestellModal.capColor} toOrder={bestellModal.toOrder} isDtf={bestellModal.isDtf||false} onClose={()=>setBestellModal(null)} onConfirm={handleBestellungConfirm}/>}
    {wareneingangModal&&<WareneingangModal bestellung={wareneingangModal} onClose={()=>setWareneingangModal(null)} onConfirm={(m)=>handleWareneingang(wareneingangModal,m)}/>}

      {/* ── Header ── */}
      <div style={{background:"#fff",borderBottom:"1px solid #ebebeb",position:"sticky",top:0,zIndex:50,boxShadow:"0 2px 8px rgba(0,0,0,0.08)"}}>
        <div style={{padding:mobile?"12px 14px":"16px 24px"}}>
        <div style={{maxWidth:1300,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,minHeight:36}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{...F_HEAD_STYLE,fontSize:mobile?18:22,fontWeight:900,letterSpacing:"0.25em",color:"#e84142"}}>GKBS</div>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:10,fontWeight:700,color:"#bbb",letterSpacing:0.5}}>{APP_VERSION}</span>
              {(syncStatus==="loading"||syncStatus==="saving")&&<span style={{width:7,height:7,borderRadius:"50%",background:"#f08328",display:"inline-block",boxShadow:"0 0 4px #f08328"}}/>}
              {syncStatus==="ok"&&<span style={{width:7,height:7,borderRadius:"50%",background:"#1a9a50",display:"inline-block"}}/>}
              {syncStatus==="error"&&<span style={{fontSize:10,color:"#e84142",fontWeight:600}}>· Fehler</span>}
              {syncStatus==="demo"&&<span style={{fontSize:9,color:"#fff",fontWeight:800,background:"#f08328",borderRadius:4,padding:"2px 6px",letterSpacing:0.5}}>DEMO</span>}
            </div>
          </div>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            {/* Profile */}
            <button onClick={onLogout} title={`Ausloggen (${currentUser.name})`} style={{width:32,height:32,borderRadius:9,background:currentUser.color,border:"none",color:"#fff",fontSize:11,fontWeight:900,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
              {currentUser.avatar}
            </button>
            {/* Sheets */}
            <button onClick={()=>setShowSheetsSetup(true)} title={sheetsUrl?"Verbunden":"Sheets einrichten"} style={{width:32,height:32,borderRadius:9,border:"1px solid #e8e8e8",background:sheetsUrl?"#f0fdf4":"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <IC_CLOUD size={14} color={sheetsUrl?"#1a9a50":"#ccc"}/>
            </button>
            {/* Undo */}
            <button onClick={undo} disabled={!canUndo} title="Rückgängig"
              style={{width:32,height:32,borderRadius:9,border:"1px solid #e8e8e8",background:canUndo?"#fff":"#f8f8f8",color:canUndo?"#333":"#ccc",cursor:canUndo?"pointer":"not-allowed",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
            </button>
            <button onClick={()=>setShowSettings(true)} title="Einstellungen" style={{width:32,height:32,borderRadius:9,border:"1px solid #e8e8e8",background:"#fff",color:"#555",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><IC_SETTINGS size={15} color="#555"/></button>
            {view==="inventory"&&inventoryTab==="textil"&&<button onClick={()=>setShowCats(true)} style={{width:32,height:32,borderRadius:9,border:"1px solid #e8e8e8",background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><IC_FOLDER size={14} color="#555"/></button>}
            {/* Green + button always last */}
            {view==="inventory"&&inventoryTab==="textil"&&<button onClick={()=>setShowProdModal("add")} style={{width:32,height:32,borderRadius:9,border:"none",background:"#1a9a50",color:"#fff",cursor:"pointer",fontWeight:800,fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>}
            {view==="inventory"&&inventoryTab==="dtf"&&<button onClick={()=>setShowDtfModal("add")} style={{width:32,height:32,borderRadius:9,border:"none",background:"#1a9a50",color:"#fff",cursor:"pointer",fontWeight:800,fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>}
            {view==="production"&&prodMainTab==="auftraege"&&<button onClick={()=>setShowPAModal("add")} style={{width:32,height:32,borderRadius:9,border:"none",background:"#1a9a50",color:"#fff",cursor:"pointer",fontWeight:800,fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>}
            {view==="bestellbedarf"&&<button onClick={()=>setShowManualBestell(true)} style={{width:32,height:32,borderRadius:9,border:"none",background:"#1a9a50",color:"#fff",cursor:"pointer",fontWeight:800,fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>}
          </div>
        </div>
        </div>
        {/* Tab bar – desktop only */}
        {!mobile&&<div style={{padding:"4px 24px 12px",marginTop:4}}>
          <div style={{display:"flex",gap:3,background:"#e8e8e8",borderRadius:11,padding:3,maxWidth:1300,margin:"0 auto",justifyContent:"center"}}>
            {TABS.map(([v,lbl,Icon])=>{
              const active=view===v;
              return(
              <button key={v} onClick={()=>setView(v)}
                style={{padding:"8px 18px",borderRadius:9,border:"none",background:active?"#e84142":"transparent",color:active?"#fff":"#666",cursor:"pointer",fontWeight:700,fontSize:13,boxShadow:active?"0 1px 3px rgba(0,0,0,0.12)":"none",display:"flex",alignItems:"center",justifyContent:"center",gap:6,whiteSpace:"nowrap"}}>
                <Icon size={15} color={active?"#fff":"#bbb"}/>
                {lbl}
                {v==="production"&&activeProdsArr.length>0&&<span style={{background:active?"#fff":"#e84142",color:active?"#e84142":"#fff",borderRadius:20,padding:"1px 6px",fontSize:10,fontWeight:800}}>{activeProdsArr.length}</span>}
                {v==="bestellungen"&&bestellungen.filter(b=>b.status==="offen").length>0&&<span style={{background:active?"#fff":"#e84142",color:active?"#e84142":"#fff",borderRadius:20,padding:"1px 5px",fontSize:9,fontWeight:800}}>{bestellungen.filter(b=>b.status==="offen").length}</span>}
                {v==="shopify"&&shopifyBadge>0&&<span style={{background:active?"#fff":"#e84142",color:active?"#e84142":"#fff",borderRadius:20,padding:"1px 5px",fontSize:9,fontWeight:800}}>{shopifyBadge}</span>}
                {v==="bestellbedarf"&&(bedarfCount+dtfBedarfCount)>0&&<span style={{background:active?"#fff":"#e84142",color:active?"#e84142":"#fff",borderRadius:20,padding:"1px 5px",fontSize:9,fontWeight:800}}>{bedarfCount+dtfBedarfCount}</span>}
              </button>
              );})}
          </div>
        </div>}
        {/* Mobile tab bar – top under header */}
        {mobile&&<div style={{display:"flex",padding:"8px 4px 6px",overflowX:"auto",justifyContent:"space-evenly"}}>
          {TABS.map(([v,lbl,Icon])=>{
            const active=view===v;
            return(
            <button key={v} onClick={()=>setView(v)} style={{border:"none",background:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"4px 6px",color:active?"#e84142":"#bbb",position:"relative",minWidth:0}}>
              <Icon size={16} color={active?"#e84142":"#bbb"}/>
              <span style={{fontSize:9,fontWeight:700,whiteSpace:"nowrap"}}>{lbl}</span>
              {v==="production"&&activeProdsArr.length>0&&<span style={{position:"absolute",top:0,right:"18%",background:"#e84142",color:"#fff",borderRadius:20,padding:"1px 5px",fontSize:8,fontWeight:800}}>{activeProdsArr.length}</span>}
              {v==="bestellungen"&&bestellungen.filter(b=>b.status==="offen").length>0&&<span style={{position:"absolute",top:0,right:"18%",background:"#e84142",color:"#fff",borderRadius:20,padding:"1px 5px",fontSize:8,fontWeight:800}}>{bestellungen.filter(b=>b.status==="offen").length}</span>}
              {v==="shopify"&&shopifyBadge>0&&<span style={{position:"absolute",top:0,right:"18%",background:"#e84142",color:"#fff",borderRadius:20,padding:"1px 5px",fontSize:8,fontWeight:800}}>{shopifyBadge}</span>}
              {v==="bestellbedarf"&&(bedarfCount+dtfBedarfCount)>0&&<span style={{position:"absolute",top:0,right:"18%",background:"#e84142",color:"#fff",borderRadius:20,padding:"1px 5px",fontSize:8,fontWeight:800}}>{bedarfCount+dtfBedarfCount}</span>}
            </button>
            );})}
        </div>}
      </div>

      <div style={{padding:mobile?"12px 12px 20px":"20px 24px",maxWidth:1300,margin:"0 auto"}}>


        {/* Shopify */}
        {view==="shopify"&&<ShopifyView products={products} prods={prods} shopifyLinks={shopifyLinks} setShopifyLinks={setShopifyLinks} setShopifyBadge={setShopifyBadge} orderFilter={appSettings.orderFilter||"oe"} onAddProd={(p)=>{setProds(ps=>[...ps,p]);log(`Online Exclusive Auftrag: ${p.name}`);}} onSetBlankStock={(id,upd)=>{setProducts(ps=>ps.map(p=>p.id===id?upd:p));log(`Bestand geändert via Shopify: ${upd.name}`);}} sheetsUrl={sheetsUrl}/>}
        {shopifyLinkModal&&<ShopifyLinkModal prod={shopifyLinkModal} products={products} sheetsUrl={sheetsUrl} links={shopifyLinks} onSave={async(links)=>{setShopifyLinks(links);shopCacheSet("shopify_links",links);if(sheetsUrl){try{await fetch(sheetsUrl,{method:"POST",redirect:"follow",headers:{"Content-Type":"text/plain"},body:JSON.stringify({action:"shopify_save_links",links})});}catch(e){}}setShopifyLinkModal(null);}} onClose={()=>setShopifyLinkModal(null)}/>}
        {/* Finance */}
        {view==="finance"&&<FinanceView products={products} dtfItems={dtfItems} verluste={verluste} setVerluste={setVerlusteAndSave} promoGifts={promoGifts} setPromoGifts={setPromoGifts} sheetsUrl={sheetsUrl}/>}
        {view==="dtf"&&<DtfView dtfItems={dtfItems} prods={prods}
          onUpdate={u=>{setDtfItems(d=>d.map(x=>x.id===u.id?u:x));log(`DTF Bestand geändert: ${u.name} → ${u.stock} Stk`);}}
          onDelete={id=>{const item=dtfItems.find(x=>x.id===id);if(item)setConfirmDelete({name:item.name,onConfirm:()=>{setDtfItems(d=>d.filter(x=>x.id!==id));log(`DTF gelöscht: ${item.name}`);setConfirmDelete(null);}});}}
          onEdit={item=>setShowDtfModal(item)}
          onAdd={()=>setShowDtfModal("add")}/>}
        {view==="bestellungen"&&<BestellteWareView bestellungen={bestellungen} onWareneingang={(b)=>setWareneingangModal(b)} onDelete={(id)=>{const item=bestellungen.find(x=>x.id===id);if(item)setConfirmDelete({name:item.name||(item.isDtf?"DTF-Bestellung":"Bestellung"),onConfirm:()=>{setBestellungen(b=>b.filter(x=>x.id!==id));log("Bestellung entfernt");setConfirmDelete(null);}});}}/>}

        {/* Bestellbedarf as tab */}
        {view==="bestellbedarf"&&<BestellbedarfView prods={prods} products={products} dtfItems={dtfItems} bestellungen={bestellungen} currentUser={currentUser} bedarfCount={bedarfCount} dtfBedarfCount={dtfBedarfCount} bedarfQty={bedarfQty} setBedarfQty={setBedarfQty} onBestellen={handleBestellen} onDirectAdd={handleDirectAdd} onBestellenDtf={(dtf,menge)=>{
  const dpm=dtf.designsPerMeter||1;
  const meter=dpm>1?Math.ceil(menge/dpm):null;
  setBestellModal({blank:{...dtf,category:"DTF"},key:"DTF",isCapKey:false,capColor:null,toOrder:menge,isDtf:true,dtfId:dtf.id,dtfName:dtf.name,designsPerMeter:dpm,meterAnzahl:meter});
}}/>}

        {/* Production */}
        {view==="production"&&(
          <div style={S.col12}>
            {/* Sub-tabs: Aufträge / Restock */}
            <div style={{display:"flex",gap:0,background:"#f0f0f0",borderRadius:12,padding:4}}>
              {[["auftraege","Aufträge",IC_CLIPBOARD],["restock","Restock Advice",IC_REFRESH]].map(([t,lbl,Icon])=>(
                <button key={t} onClick={()=>setProdMainTab(t)} style={{flex:1,padding:"7px 18px",borderRadius:9,border:"none",background:prodMainTab===t?"#fff":"transparent",color:prodMainTab===t?"#111":"#666",cursor:"pointer",fontWeight:700,fontSize:13,boxShadow:prodMainTab===t?"0 1px 3px rgba(0,0,0,0.08)":"none",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}><Icon size={13} color={prodMainTab===t?"#111":"#999"}/>{lbl}</button>
              ))}
            </div>

            {prodMainTab==="restock"&&<RestockView sheetsUrl={sheetsUrl} products={products} dtfItems={dtfItems} shopifyLinks={shopifyLinks} onAddProd={(p)=>{setProds(ps=>[...ps,p]);log(`Restock Auftrag: ${p.name}`);}}/>}

            {prodMainTab==="auftraege"&&<>
            {/* Filters – scrollable on mobile */}
            <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:4,alignItems:"center"}}>
              <div style={{display:"flex",gap:2,background:"#e8e8e8",borderRadius:9,padding:3,flexShrink:0}}>
                {[["Alle",null,"Alle"],["Drucken","print","Drucken"],["Sticken","stitch","Sticken"]].map(([v,icon,lbl])=>{
                  const active=prodSubView===v;
                  return <button key={v} onClick={()=>setProdSubView(v)} style={{padding:"6px 12px",borderRadius:7,border:"none",background:active?"#fff":"transparent",color:active?"#111":"#888",cursor:"pointer",fontWeight:700,fontSize:12,whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:4}}>
                    {icon==="print"&&<IC_PRINT size={12} color={active?"#4078e0":"#bbb"}/>}
                    {icon==="stitch"&&<IC_STITCH size={12} color={active?"#9b5de5":"#bbb"}/>}
                    {lbl}
                  </button>;
                })}
              </div>
              <div style={{width:1,height:20,background:"#e0e0e0",flexShrink:0}}/>
              {["Alle","Hoch","Mittel","Niedrig"].map(p=>{const s=PRIORITY[p]||{};const active=prioFilter===p;return <button key={p} onClick={()=>setPrioFilter(p)} style={{padding:"6px 11px",borderRadius:9,border:`1px solid ${active?(p==="Alle"?"#111":s.dot):"#e8e8e8"}`,background:active?(p==="Alle"?"#111":s.bg):"#fff",color:active?(p==="Alle"?"#fff":s.color):"#666",cursor:"pointer",fontWeight:700,fontSize:11,flexShrink:0}}>{p}</button>;})}
              <button onClick={()=>setProds(ps=>{const active=ps.filter(p=>p.status!=="Fertig");const done=ps.filter(p=>p.status==="Fertig");const sorted=[...active].sort((a,b)=>PRIORITY_ORDER[a.priority]-PRIORITY_ORDER[b.priority]);return [...sorted,...done];})} style={{padding:"6px 11px",borderRadius:9,border:"1px solid #e8e8e8",background:"#fff",color:"#666",cursor:"pointer",fontWeight:700,fontSize:11,flexShrink:0,marginLeft:4}}>↕ Sortieren</button>
            </div>
            {filteredProds.length===0&&<div style={{color:"#ccc",fontSize:14,padding:40,textAlign:"center"}}>Keine aktiven Aufträge</div>}
            <div style={S.col10}>
              {filteredProds.map(prod=>(
                <div key={prod.id} draggable onDragStart={e=>onDragStart(e,prod.id)} onDragEnter={()=>onDragEnter(null,prod.id)} onDragEnd={onDragEnd} onDragOver={e=>e.preventDefault()} style={{opacity:dragItem.current===prod.id?0.45:1,transition:"opacity 0.15s",cursor:"grab"}}>
                  <ProductionCard prod={prod} blank={products.find(p=>p.id===prod.blankId)} dtfItem={prod.dtfId?dtfItems.find(d=>d.id===prod.dtfId):null}
                    onDelete={()=>setConfirmDelete({name:prod.name,onConfirm:()=>setProds(ps=>ps.filter(x=>x.id!==prod.id))})}
                    onEdit={()=>setShowPAModal(prod)}
                    onUpdate={u=>{
  const old=prods.find(x=>x.id===u.id);
  const changes=[];
  if(u.isCapOrder){
    (u.capColors||[]).forEach(c=>{const oc=(old?.capColors||[]).find(x=>x.id===c.id);if(oc&&oc.done!==c.done)changes.push(`${c.name}: ${oc.done}→${c.done} fertig`);});
  } else {
    const SIZES=["XXS","XS","S","M","L","XL","XXL","XXXL"];
    SIZES.forEach(s=>{const ov=(old?.done||{})[s]||0,nv=(u.done||{})[s]||0;if(ov!==nv)changes.push(`${s}: ${ov}→${nv} fertig`);});
  }
  setProds(ps=>ps.map(x=>x.id===u.id?u:x));
  log(changes.length>0?`Produktion – ${u.name} | ${changes.join(", ")}`:(`Status geändert – ${u.name}: ${u.status||""}`));
}}
                    onConfirmProduce={()=>setConfirmProduce(prod)}
                  />
                </div>
              ))}
            </div>
            {/* Archive */}
            <div style={{marginTop:4}}>
              <button onClick={()=>setShowArchive(o=>!o)} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",borderRadius:12,border:"1px solid #e8e8e8",background:"#fff",color:"#555",cursor:"pointer",fontWeight:700,fontSize:13,width:"100%"}}>
                <span>{showArchive?"▾":"▸"}</span><IC_FOLDER size={14} color="#555"/> <span>Archiv</span>
                <span style={{background:"#e8e8e8",color:"#666",borderRadius:20,padding:"2px 9px",fontSize:11,fontWeight:800,marginLeft:"auto"}}>{archivedProdsArr.length}</span>
              </button>
              {showArchive&&(
                <div style={{display:"flex",flexDirection:"column",gap:6,marginTop:8}}>
                  {archivedProdsArr.length===0&&<div style={{color:"#ccc",fontSize:13,textAlign:"center",padding:24}}>Noch keine abgeschlossenen Aufträge</div>}
                  {archivedProdsArr.map(prod=><ArchivedCard key={prod.id} prod={prod} blank={products.find(p=>p.id===prod.blankId)} onDelete={()=>setConfirmDelete({name:prod.name,onConfirm:()=>setProds(ps=>ps.filter(x=>x.id!==prod.id))})}/>)}
                </div>
              )}
            </div>
            </>}
          </div>
        )}

        {/* Inventory */}
        {view==="inventory"&&(
          <div style={S.col12}>
            {/* Sub-tabs: Blanks / DTF */}
            <div style={{display:"flex",gap:0,background:"#f0f0f0",borderRadius:12,padding:4}}>
              {[["textil","Blanks",IC_SHIRT],["dtf","DTF",IC_ROLL]].map(([t,lbl,Icon])=>(
                <button key={t} onClick={()=>setInventoryTab(t)} style={{flex:1,padding:"7px 18px",borderRadius:9,border:"none",background:inventoryTab===t?"#fff":"transparent",color:inventoryTab===t?"#111":"#666",cursor:"pointer",fontWeight:700,fontSize:13,boxShadow:inventoryTab===t?"0 1px 3px rgba(0,0,0,0.08)":"none",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}><Icon size={13} color={inventoryTab===t?"#111":"#999"}/>{lbl}</button>
              ))}
            </div>
            {inventoryTab==="dtf"&&<DtfView dtfItems={dtfItems} prods={prods}
              onUpdate={u=>{setDtfItems(d=>d.map(x=>x.id===u.id?u:x));log(`DTF Bestand geändert: ${u.name} → ${u.stock} Stk`);}}
              onDelete={id=>{const item=dtfItems.find(x=>x.id===id);if(item)setConfirmDelete({name:item.name,onConfirm:()=>{setDtfItems(d=>d.filter(x=>x.id!==id));log(`DTF gelöscht: ${item.name}`);setConfirmDelete(null);}});}}
              onEdit={item=>setShowDtfModal(item)}
              onAdd={()=>setShowDtfModal("add")}/>}
            {inventoryTab==="textil"&&<>
            {/* Search + filters – scrollable */}
            <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:4,alignItems:"center"}}>
              <input placeholder="Suchen..." value={search} onChange={e=>setSearch(e.target.value)}
                style={{background:"#fff",border:"1px solid #e8e8e8",borderRadius:9,color:"#111",padding:"6px 11px",fontSize:12,outline:"none",width:mobile?100:140,flexShrink:0,fontWeight:500}}/>
              {["All",...categories].map(c=><button key={c} onClick={()=>setCatFilter(c)} style={{padding:"6px 11px",borderRadius:9,border:"1px solid",borderColor:catFilter===c?"#111":"#e8e8e8",background:catFilter===c?"#111":"#fff",color:catFilter===c?"#fff":"#666",cursor:"pointer",fontWeight:700,fontSize:11,flexShrink:0,whiteSpace:"nowrap"}}>{c}</button>)}
            </div>
            <div style={{display:"grid",gap:10,gridTemplateColumns:mobile?"1fr":"repeat(auto-fill, minmax(560px, 1fr))"}}>
              {filtered.length===0
                ?<div style={{color:"#ccc",fontSize:14,padding:60,textAlign:"center"}}>Keine Produkte gefunden</div>
                :filtered.map(p=>(
                  <div key={p.id} draggable={!mobile} onDragStart={e=>onProductDragStart(e,p.id)} onDragEnter={()=>onProductDragEnter(null,p.id)} onDragEnd={onProductDragEnd} onDragOver={e=>e.preventDefault()} style={{opacity:dragItem.current===p.id?0.45:1,transition:"opacity 0.15s"}}>
                    <ProductCard product={p} onUpdate={u=>{
  const old=products.find(x=>x.id===u.id);
  const changes=[];
  if(u.isCapOrder){
    (u.capColors||[]).forEach(c=>{const oc=(old?.capColors||[]).find(x=>x.id===c.id);if(oc&&oc.stock!==c.stock)changes.push(`${c.name}: ${oc.stock}→${c.stock}`);});
  } else {
    const SIZES=["XXS","XS","S","M","L","XL","XXL","XXXL"];
    SIZES.forEach(s=>{const ov=(old?.stock||{})[s]||0,nv=(u.stock||{})[s]||0;if(ov!==nv)changes.push(`${s}: ${ov}→${nv}`);});
  }
  setProducts(ps=>ps.map(x=>x.id===u.id?u:x));
  log(changes.length>0?`Bestand geändert – ${u.name} | ${changes.join(", ")}`:(`Bestand gespeichert: ${u.name}`));
}} onDelete={()=>setConfirmDelete({name:p.name,onConfirm:()=>{setProducts(ps=>ps.filter(x=>x.id!==p.id));(() => {
  const SIZES=["XXS","XS","S","M","L","XL","XXL","XXXL"];
  const total=SIZES.reduce((a,s)=>a+((p.stock||{})[s]||0),0);
  log(`Produkt gelöscht – ${p.name}${total>0?` | ${total} Stk im Lager`:""}`);
})();}})} onEdit={()=>setShowProdModal(p)}/>
                  </div>
                ))}
            </div>
            </>}
          </div>
        )}
      </div>

      {/* Scroll to top button */}
      <ScrollTopButton/>
    </div>
  );
}

export default function App(){
  const [user,setUser] = useState(()=>localStorage.getItem("gkbs_user"));
  const validUser = USERS.find(u=>u.name===user);
  if(!validUser) return <LoginScreen onUnlock={(name)=>setUser(name)}/>;
  return <AppInner currentUser={validUser} onLogout={()=>{localStorage.removeItem("gkbs_user");setUser(null);}}/>;
}
