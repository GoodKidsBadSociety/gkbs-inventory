// GKBS INVENTORY v1.81
import { useState, useRef, useCallback, useEffect } from "react";

// Prevent iOS auto-zoom on input focus
if (typeof document !== "undefined") {
  const meta = document.querySelector("meta[name=viewport]");
  if (meta) meta.content = "width=device-width, initial-scale=1, maximum-scale=1";
}
const MAX_HISTORY = 50;
const APP_VERSION = "v2.0.2";
const DEFAULT_SIZES = ["XXS","XS","S","M","L","XL","XXL","XXXL"];
const DEFAULT_CATEGORIES = ["T-Shirt","Hoodie","Crewneck","Longsleeve","Shorts","Jacket","Cap","Other"];
const LOW_STOCK = 3;
const PRESET_COLORS = ["#000000","#ffffff","#e5e5e5","#6b7280","#3b82f6","#10b981","#ef4444","#f97316","#eab308","#8b5cf6","#ec4899","#a16207","#1e3a5f","#d4a574"];
const STATUS_STYLE = {"Geplant":{bg:"#f0f0f0",color:"#666"},"In Produktion":{bg:"#fef9c3",color:"#a16207"},"Fertig":{bg:"#dcfce7",color:"#16a34a"}};
const PRIORITY = {"Hoch":{bg:"#fef2f2",color:"#ef4444",dot:"#ef4444"},"Mittel":{bg:"#fff7ed",color:"#f97316",dot:"#f97316"},"Niedrig":{bg:"#f0f0f0",color:"#888",dot:"#bbb"}};
const VEREDELUNG_TYPES = ["Drucken","Sticken"];
const mkQty = () => Object.fromEntries(DEFAULT_SIZES.map(s=>[s,0]));
const mkId = () => Math.random().toString(36).slice(2,8);

// ─── Google Sheets Config ─────────────────────────────────────────
const SHEETS_URL = "https://script.google.com/macros/s/AKfycbyD2V3HWqSCi_5tlj5rkbVk1HuJoOomE6p8mWATzjCS4aDX0Vz-4uuV5XUlbTx5JKsI/exec";

async function sheetsLoad() {
  const url = SHEETS_URL;
  if (!url) return null;
  try {
    const r = await fetch(url + "?action=load");
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

async function sheetsLogActivity(user, action){
  try{
    await fetch(SHEETS_URL,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({action:"log",user,actionText:action,ts:new Date().toISOString()})
    });
  }catch(e){}
}

async function sheetsSave(products, prods, dtfItems, bestellungen, categories) {
  const url = SHEETS_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      body: JSON.stringify({ action: "save", products, prods, dtfItems, bestellungen, categories }),
    });
  } catch(e) { console.warn("Sheets sync failed:", e); }
}




// ─── Stanley/Stella Presets ───────────────────────────────────────
const STANLEY_STELLA_PRESETS = [
  {
    id: "STTU169",
    name: "Creator 2.0",
    productId: "STTU169",
    fit: "Unisex · Medium Fit · 180 GSM",
    colors: [
      // Whites
      { code: "C054", name: "Natural Raw",     hex: "#f5f0dc", price: 3.83 },
      { code: "C018", name: "Off White",       hex: "#f0ede4", price: 3.83 },
      { code: "C504", name: "Vintage White",   hex: "#ede8dc", price: 3.83 },
      { code: "C001", name: "White",           hex: "#ffffff", price: 3.83 },
      // Colors
      { code: "C089", name: "Aloe",            hex: "#7d9e8c", price: 4.15 },
      { code: "C253", name: "Anthracite",      hex: "#4a4a4a", price: 4.15 },
      { code: "C145", name: "Aqua Blue",       hex: "#6bbfcb", price: 4.15 },
      { code: "C002", name: "Black",           hex: "#111111", price: 4.15 },
      { code: "C156", name: "Blue Grey",       hex: "#7a8fa0", price: 4.15 },
      { code: "C728", name: "Blue Ice",        hex: "#b8d8e4", price: 4.15 },
      { code: "C149", name: "Blue Soul",       hex: "#3d5a80", price: 4.15 },
      { code: "C053", name: "Bright Blue",     hex: "#1a6bcc", price: 4.15 },
      { code: "C129", name: "Bubble Pink",     hex: "#f5a0c0", price: 4.15 },
      { code: "C244", name: "Burgundy",        hex: "#6e1a2a", price: 4.15 },
      { code: "C005", name: "Cotton Pink",     hex: "#f2c4c4", price: 4.15 },
      { code: "C151", name: "Deep Plum",       hex: "#3d1a3a", price: 4.15 },
      { code: "C136", name: "Deep Teal",       hex: "#1a5a5a", price: 4.15 },
      { code: "C028", name: "Desert Dust",     hex: "#c8b89a", price: 4.15 },
      { code: "C150", name: "Earthy Red",      hex: "#8b3a2a", price: 4.15 },
      { code: "C153", name: "Faded Olive",     hex: "#8a8a5a", price: 4.15 },
      { code: "C143", name: "Fiesta",          hex: "#e85a2a", price: 4.15 },
      { code: "C101", name: "Fraiche Peche",   hex: "#f5c4a0", price: 4.15 },
      { code: "C727", name: "French Navy",     hex: "#1a2a4a", price: 4.15 },
      { code: "C036", name: "Glazed Green",    hex: "#2a6a4a", price: 4.15 },
      { code: "C144", name: "Green Bay",       hex: "#5a7a5a", price: 4.15 },
      { code: "C730", name: "Heritage Brown",  hex: "#7a3a2a", price: 4.15 },
      { code: "C155", name: "Honey Paper",     hex: "#e8d4a0", price: 4.15 },
      { code: "C715", name: "India Ink Grey",  hex: "#5a5a6a", price: 4.15 },
      { code: "C223", name: "Khaki",           hex: "#8a7a5a", price: 4.15 },
      { code: "C112", name: "Latte",           hex: "#c8a87a", price: 4.15 },
      { code: "C063", name: "Lavender",        hex: "#b0a0cc", price: 4.15 },
      { code: "C355", name: "Lilac Dream",     hex: "#c8b4d8", price: 4.15 },
      { code: "C729", name: "Mindful Blue",    hex: "#4a6a8a", price: 4.15 },
      { code: "C138", name: "Misty Grey",      hex: "#b0b0b0", price: 4.15 },
      { code: "C735", name: "Misty Jade",      hex: "#a0c4b8", price: 4.15 },
      { code: "C135", name: "Mocha",           hex: "#7a5a4a", price: 4.15 },
      { code: "C142", name: "Nispero",         hex: "#e8a84a", price: 4.15 },
      { code: "C048", name: "Ochre",           hex: "#c8901a", price: 4.15 },
      { code: "C357", name: "Pool Blue",       hex: "#4ab4c8", price: 4.15 },
      { code: "C115", name: "Purple Love",     hex: "#7a3a8a", price: 4.15 },
      { code: "C004", name: "Red",             hex: "#cc2222", price: 4.15 },
      { code: "C116", name: "Red Brown",       hex: "#7a2a1a", price: 4.15 },
      { code: "C204", name: "Spectra Yellow",  hex: "#f5d000", price: 4.15 },
      { code: "C702", name: "Stargazer",       hex: "#1a3a5a", price: 4.15 },
      { code: "C358", name: "Stone",           hex: "#a09880", price: 4.15 },
      { code: "C137", name: "Verdant Green",   hex: "#2a6a2a", price: 4.15 },
      { code: "C356", name: "Viva Yellow",     hex: "#f5c800", price: 4.15 },
      { code: "C088", name: "Worker Blue",     hex: "#2a4a6a", price: 4.15 },
      // Essential Heathers
      { code: "C146", name: "Cool Heather Grey",    hex: "#b4b8c0", price: 4.15 },
      { code: "C652", name: "Dark Heather Blue",    hex: "#3a4a6a", price: 4.15 },
      { code: "C651", name: "Dark Heather Grey",    hex: "#5a5a5a", price: 4.15 },
      { code: "C250", name: "Heather Grey",         hex: "#c0bcb8", price: 4.15 },
      { code: "C731", name: "Heather Haze",         hex: "#b0a8c0", price: 4.15 },
    ]
  },
  {
    id: "STTU788",
    name: "Freestyler",
    productId: "STTU788",
    fit: "Unisex · Relaxed Fit · 240 GSM",
    colors: [
      { code: "C054", name: "Natural Raw",        hex: "#f5f0dc", price: 7.88 },
      { code: "C001", name: "White",               hex: "#ffffff", price: 7.88 },
      { code: "C089", name: "Aloe",                hex: "#7d9e8c", price: 8.35 },
      { code: "C002", name: "Black",               hex: "#111111", price: 8.35 },
      { code: "C244", name: "Burgundy",            hex: "#6e1a2a", price: 8.35 },
      { code: "C361", name: "Cream",               hex: "#f0ecd4", price: 8.35 },
      { code: "C028", name: "Desert Dust",         hex: "#c8b89a", price: 8.35 },
      { code: "C101", name: "Fraiche Peche",       hex: "#f5c4a0", price: 8.35 },
      { code: "C727", name: "French Navy",         hex: "#1a2a4a", price: 8.35 },
      { code: "C036", name: "Glazed Green",        hex: "#2a6a4a", price: 8.35 },
      { code: "C730", name: "Heritage Brown",      hex: "#7a3a2a", price: 8.35 },
      { code: "C085", name: "Kaffa Coffee",        hex: "#5a3a28", price: 8.35 },
      { code: "C223", name: "Khaki",               hex: "#8a7a5a", price: 8.35 },
      { code: "C729", name: "Mindful Blue",        hex: "#4a6a8a", price: 8.35 },
      { code: "C735", name: "Misty Jade",          hex: "#a0c4b8", price: 8.35 },
      { code: "C135", name: "Mocha",               hex: "#7a5a4a", price: 8.35 },
      { code: "C702", name: "Stargazer",           hex: "#1a3a5a", price: 8.35 },
      { code: "C088", name: "Worker Blue",         hex: "#2a4a6a", price: 8.35 },
      { code: "C146", name: "Cool Heather Grey",   hex: "#b4b8c0", price: 8.35 },
      { code: "C651", name: "Dark Heather Grey",   hex: "#5a5a5a", price: 8.35 },
      { code: "C250", name: "Heather Grey",        hex: "#c0bcb8", price: 8.35 },
      { code: "C731", name: "Heather Haze",        hex: "#b0a8c0", price: 8.35 },
    ]
  },
  {
    id: "STTU073",
    name: "Freestyler Vintage",
    productId: "STTU073",
    fit: "Unisex · Relaxed Fit · 240 GSM",
    colors: [
      { code: "C162", name: "G. Dyed Anthracite",   hex: "#6a6a6a", price: 9.4 },
      { code: "C140", name: "G. Dyed Black Rock",   hex: "#1e1e1e", price: 9.4 },
      { code: "C158", name: "G. Dyed Blue Grey",    hex: "#6a7a9a", price: 9.4 },
      { code: "C732", name: "G. Dyed Blue Stone",   hex: "#8abcd4", price: 9.4 },
      { code: "C109", name: "G. Dyed Khaki",        hex: "#6a5a3a", price: 9.4 },
      { code: "C733", name: "G. Dyed Latte",        hex: "#c8a878", price: 9.4 },
      { code: "C157", name: "G. Dyed Misty Grey",   hex: "#a0a0a0", price: 9.4 },
      { code: "C161", name: "G. Dyed Purple Love",  hex: "#7a6aaa", price: 9.4 },
    ]
  },
  {
    id: "STTU171",
    name: "Sparker 2.0",
    productId: "STTU171",
    fit: "Unisex · Relaxed Fit · 215 GSM",
    colors: [
      // Whites
      { code: "C054", name: "Natural Raw",     hex: "#f5f0dc", price: 5.83 },
      { code: "C018", name: "Off White",       hex: "#f0ede4", price: 5.83 },
      { code: "C001", name: "White",           hex: "#ffffff", price: 5.83 },
      // Colors
      { code: "C089", name: "Aloe",            hex: "#7d9e8c", price: 6.62 },
      { code: "C253", name: "Anthracite",      hex: "#4a4a4a", price: 6.62 },
      { code: "C002", name: "Black",           hex: "#111111", price: 6.62 },
      { code: "C728", name: "Blue Ice",        hex: "#b8d8e4", price: 6.62 },
      { code: "C129", name: "Bubble Pink",     hex: "#f5a0c0", price: 6.62 },
      { code: "C143", name: "Fiesta",          hex: "#e85a2a", price: 6.62 },
      { code: "C727", name: "French Navy",     hex: "#1a2a4a", price: 6.62 },
      { code: "C036", name: "Glazed Green",    hex: "#2a6a4a", price: 6.62 },
      { code: "C144", name: "Green Bay",       hex: "#5a7a5a", price: 6.62 },
      { code: "C730", name: "Heritage Brown",  hex: "#7a3a2a", price: 6.62 },
      { code: "C223", name: "Khaki",           hex: "#8a7a5a", price: 6.62 },
      { code: "C112", name: "Latte",           hex: "#c8a87a", price: 6.62 },
      { code: "C138", name: "Misty Grey",      hex: "#b0b0b0", price: 6.62 },
      { code: "C135", name: "Mocha",           hex: "#7a5a4a", price: 6.62 },
      { code: "C142", name: "Nispero",         hex: "#e8a84a", price: 6.62 },
      { code: "C357", name: "Pool Blue",       hex: "#4ab4c8", price: 6.62 },
      { code: "C115", name: "Purple Love",     hex: "#7a3a8a", price: 6.62 },
      { code: "C702", name: "Stargazer",       hex: "#1a3a5a", price: 6.62 },
      { code: "C358", name: "Stone",           hex: "#a09880", price: 6.62 },
      { code: "C134", name: "Violet",          hex: "#6a4a9a", price: 6.62 },
      { code: "C088", name: "Worker Blue",     hex: "#2a4a6a", price: 6.62 },
    ]
  }
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
  const now = new Date();
  const date = now.toISOString().slice(0,10).replace(/-/g,"");
  const time = now.toTimeString().slice(0,8).replace(/:/g,"");
  a.download = `${projectName}.csv`;
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
  pill: (ok)=>({background:ok?"#dcfce7":"#fef2f2",borderRadius:8,padding:"4px 10px",textAlign:"center",minWidth:52}),
  pillNum: (ok)=>({fontSize:18,fontWeight:900,color:ok?"#16a34a":"#ef4444",lineHeight:1}),
  pillLbl: (ok)=>({fontSize:9,color:ok?"#16a34a":"#ef4444",fontWeight:700}),
};

// ─── Style tokens ─────────────────────────────────────────────────
const R="#ef4444",OR="#f97316",GR="#16a34a",GY="#bbb";
const sCol=(v,lo=LOW_STOCK)=>v===0?R:v<=lo?OR:"#111";
const capBg=(c,a)=>c?"#f0fdf4":a?"#fff7ed":"#f8f8f8";
const capBd=(c,a)=>`1px solid ${c?"#bbf7d0":a?"#fed7aa":"transparent"}`;
const btn=(w,red=false,dis=false)=>({width:w,height:w,borderRadius:7,border:"none",
  background:red?(dis?"#f0f0f0":"#fee2e2"):(dis?"#f0f0f0":"#dcfce7"),
  color:red?(dis?"#ccc":R):(dis?"#ccc":GR),
  fontSize:w>30?22:w>25?18:14,cursor:dis?"not-allowed":"pointer",
  display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800});
const iconBtn=(red=false)=>({width:34,height:34,borderRadius:9,border:"none",background:"#f0f0f0",
  color:red?R:"#111",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0});
const PENCIL=()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const CHECK=()=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const SLabel=({s})=><div style={{fontSize:11,color:GY,marginBottom:8,fontWeight:700,letterSpacing:0.8}}>{s}</div>;

const DEMO_PRODUCTS = [
  {id:"1",name:"Classic Logo Tee",category:"T-Shirt",color:"Black",colorHex:"#111111",buyPrice:12.50,supplierUrl:"https://example.com",stock:{XXS:2,XS:5,S:3,M:18,L:10,XL:4,XXL:2,XXXL:1},minStock:{XXS:2,XS:5,S:10,M:10,L:8,XL:5,XXL:3,XXXL:2}},
  {id:"2",name:"Natur Loose Fit Tee",category:"T-Shirt",color:"Natural",colorHex:"#e8dcc8",buyPrice:14.00,supplierUrl:"",stock:{XXS:0,XS:2,S:3,M:5,L:4,XL:2,XXL:0,XXXL:0},minStock:{XXS:2,XS:3,S:5,M:5,L:5,XL:3,XXL:2,XXXL:1}},
  {id:"3",name:"Heavy Cap",category:"Cap",colorHex:"#222222",buyPrice:8.00,supplierUrl:"",capColors:[{id:"c1",name:"Black",hex:"#111111",stock:5},{id:"c2",name:"White",hex:"#f5f5f5",stock:3},{id:"c3",name:"Navy",hex:"#1e3a5f",stock:2}]},
];
const DEMO_PRODS = [
  {id:"p1",name:"Gemeindebau T-Shirt",blankId:"2",status:"Geplant",priority:"Hoch",notes:"SS25 Drop",veredelung:["Drucken"],designUrl:"",colorHex:"#e8dcc8",photos:[],isCapOrder:false,qty:{XXS:0,XS:0,S:5,M:5,L:3,XL:2,XXL:0,XXXL:0},done:{XXS:0,XS:0,S:0,M:0,L:0,XL:0,XXL:0,XXXL:0}},
  {id:"p2",name:"GKBS Logo Cap",blankId:"3",status:"Geplant",priority:"Mittel",notes:"",veredelung:["Sticken"],designUrl:"",colorHex:"#222222",photos:[],isCapOrder:true,capColors:[{id:"o1",name:"Black",hex:"#111111",qty:5,done:0},{id:"o2",name:"White",hex:"#f5f5f5",qty:3,done:0}]},
];


// ─── Helpers ─────────────────────────────────────────────────────
const totalStock = (p) => p.category==="Cap"
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
  return w < 640;
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
  const styles={"Drucken":{bg:"#eff6ff",color:"#3b82f6"},"Sticken":{bg:"#fdf4ff",color:"#a855f7"}};
  const s=styles[type]||{bg:"#f0f0f0",color:"#666"};
  return <span style={{fontSize:11,background:s.bg,color:s.color,borderRadius:6,padding:"2px 7px",fontWeight:700}}>{type==="Drucken"?"🖨 Drucken":"🪡 Sticken"}</span>;
}


// ─── Lightbox ─────────────────────────────────────────────────────
function Lightbox({src,onClose}){
  if(!src)return null;
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,padding:20}}>
      <img src={src} alt="" style={{maxWidth:"100%",maxHeight:"100%",borderRadius:12,objectFit:"contain",boxShadow:"0 8px 60px rgba(0,0,0,0.5)"}}/>
      <button onClick={onClose} style={{position:"absolute",top:16,right:16,width:36,height:36,borderRadius:"50%",border:"none",background:"rgba(255,255,255,0.15)",color:"#fff",fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800}}>✕</button>
    </div>
  );
}

// ─── Cap Color Editor ─────────────────────────────────────────────
function CapColorEditor({colors,onChange,mode}){
  const inp={background:"#fff",border:"1px solid #e0e0e0",borderRadius:8,color:"#111",padding:"8px 10px",fontSize:14,outline:"none",boxSizing:"border-box"};
  const addColor=()=>onChange([...colors,mode==="stock"?{id:mkId(),name:"Neue Farbe",hex:"#888888",stock:0}:{id:mkId(),name:"Neue Farbe",hex:"#888888",qty:0,done:0}]);
  const update=(id,f,v)=>onChange(colors.map(c=>c.id===id?{...c,[f]:v}:c));
  const remove=(id)=>onChange(colors.filter(c=>c.id!==id));
  const adj=(id,f,d)=>{const c=colors.find(x=>x.id===id);update(id,f,Math.max(0,(c?.[f]||0)+d));};
  const field=mode==="stock"?"stock":"qty";
  return(
    <div style={S.col8}>
      {colors.map(c=>(
        <div key={c.id} style={{display:"flex",alignItems:"center",gap:8,background:"#f8f8f8",borderRadius:12,padding:"10px 12px",flexWrap:"wrap"}}>
          <input type="color" value={c.hex} onChange={e=>update(c.id,"hex",e.target.value)} style={{width:36,height:36,borderRadius:"50%",border:"2px solid #444",cursor:"pointer",padding:2,flexShrink:0}}/>
          <input style={{...inp,flex:1,minWidth:80}} value={c.name} onChange={e=>update(c.id,"name",e.target.value)} placeholder="Name"/>
          <div style={{display:"flex",alignItems:"center",gap:6,marginLeft:"auto"}}>
            <button type="button" onClick={()=>adj(c.id,field,-1)} style={btn(34,true)}>−</button>
            <span style={{fontSize:20,fontWeight:900,color:"#111",width:34,textAlign:"center"}}>{c[field]||0}</span>
            <button type="button" onClick={()=>adj(c.id,field,1)} style={btn(34)}>+</button>
          </div>
          <button type="button" onClick={()=>remove(c.id)} style={{background:"none",border:"none",color:"#ccc",cursor:"pointer",fontSize:20,padding:"0 2px",lineHeight:1,flexShrink:0}}>✕</button>
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
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"#f8f8f8",borderRadius:10,padding:"10px 12px",position:"relative"}}>
        <span style={{fontSize:14,color:"#555",fontWeight:800,width:36}}>{size}</span>
        {editing?(
          <input ref={inputRef} type="number" inputMode="numeric" pattern="[0-9]*" value={draft}
            onChange={e=>setDraft(e.target.value)} onBlur={commitEdit} onKeyDown={handleKey}
            style={{fontSize:28,fontWeight:900,color:sCol(value),lineHeight:1,flex:1,textAlign:"center",border:"none",background:"transparent",outline:"none",width:0,minWidth:0}}/>
        ):(
          <span onDoubleClick={startEdit} style={{fontSize:28,fontWeight:900,color:sCol(value),lineHeight:1,flex:1,textAlign:"center",cursor:"text"}}>
            {value}
            {minVal>0&&<span style={{fontSize:10,color:belowMin?"#ef4444":"#bbb",fontWeight:700,marginLeft:3}}>/{minVal}</span>}
          </span>
        )}
        <div style={{display:"flex",gap:6}}>
          <button onClick={onDec} style={btn(36,true)}>−</button>
          <button onClick={onInc} style={btn(36)}>+</button>
        </div>
      </div>
    );
  }
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"space-between",gap:0,background:"#f8f8f8",borderRadius:12,padding:"10px 8px",flex:1,minWidth:0,position:"relative",height:110}}>
      <div style={{width:20,height:20,borderRadius:"50%",background:"transparent",flexShrink:0}}/>
      <span style={{fontSize:14,color:"#666",fontWeight:900,lineHeight:1.2}}>{size}</span>
      {editing?(
        <input ref={inputRef} type="number" inputMode="numeric" pattern="[0-9]*" value={draft}
          onChange={e=>setDraft(e.target.value)} onBlur={commitEdit} onKeyDown={handleKey}
          style={{fontSize:28,fontWeight:900,color:sCol(value),lineHeight:1,border:"none",background:"transparent",outline:"none",textAlign:"center",width:"100%"}}/>
      ):(
        <span onDoubleClick={startEdit} style={{fontSize:28,fontWeight:900,color:sCol(value),lineHeight:1,cursor:"text"}}>{value}</span>
      )}
      {minVal>0&&<span style={{position:"absolute",top:5,right:5,fontSize:9,color:belowMin?"#ef4444":"#bbb",fontWeight:700}}>/{minVal}</span>}
      <div style={{display:"flex",gap:4}}>
        <button onClick={onDec} style={btn(30,true)}>−</button>
        <button onClick={onInc} style={btn(30)}>+</button>
      </div>
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
  const isCap=item.category==="Cap"||item.isCapOrder;
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
        style={{width:50,fontSize,fontWeight:900,color,border:"none",borderBottom:"2px solid #3b82f6",outline:"none",background:"transparent",textAlign:"center"}}/>
    : <span onDoubleClick={start} style={{fontSize,fontWeight:900,color,lineHeight:1,cursor:onSet?"text":"default"}} title={onSet?"Doppelklick zum Bearbeiten":""}>{value}</span>;
  return soll!==undefined
    ? <span style={{lineHeight:1}}>{display}<span style={{fontSize:fontSize*0.6,color:"#bbb",fontWeight:700}}>/{soll}</span></span>
    : display;
}

// ─── Inline editable number for ProdCell ─────────────────────────
function ProdCellNum({value, soll, color, onSet, fontSize=28}){
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const ref = useRef(null);
  const start = () => { setDraft(String(value)); setEditing(true); setTimeout(()=>ref.current?.select(),30); };
  const commit = () => { const n=parseInt(draft); if(!isNaN(n)&&n>=0) onSet&&onSet(n); setEditing(false); };
  if(!onSet) return <span style={{fontSize,fontWeight:900,color,lineHeight:1}}>{value}<span style={{fontSize:fontSize*0.6,color:"#bbb",fontWeight:700}}>/{soll}</span></span>;
  return editing
    ? <><input ref={ref} type="number" inputMode="numeric" value={draft}
        onChange={e=>setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e=>{if(e.key==="Enter")commit();if(e.key==="Escape")setEditing(false);}}
        style={{width:50,fontSize,fontWeight:900,color,border:"none",borderBottom:"2px solid #3b82f6",outline:"none",background:"transparent",textAlign:"center"}}/><span style={{fontSize:fontSize*0.6,color:"#bbb",fontWeight:700}}>/{soll}</span></>
    : <span onDoubleClick={start} style={{fontSize,fontWeight:900,color,lineHeight:1,cursor:"text"}} title="Doppelklick zum Bearbeiten">{value}<span style={{fontSize:fontSize*0.6,color:"#bbb",fontWeight:700}}>/{soll}</span></span>;
}

function ProdCell({size,soll,done,avail,onInc,onDec,onSet,disabled,mobile}){
  const complete=soll>0&&done>=soll;
  const atLimit=disabled&&!complete;
  const color=complete?GR:atLimit?OR:"#111";
  if(mobile){
    return(
      <div style={{display:"flex",alignItems:"center",gap:8,background:complete?"#f0fdf4":atLimit?"#fff7ed":"#f8f8f8",borderRadius:12,padding:"12px 14px",border:`1px solid ${complete?"#bbf7d0":atLimit?"#fed7aa":"#f0f0f0"}`}}>
        <span style={{fontSize:14,color:"#555",fontWeight:800,width:40,flexShrink:0}}>{size}</span>
        <div style={{flex:1,textAlign:"center"}}>
          <ProdCellNum value={done} soll={soll} color={color} onSet={onSet} fontSize={32}/>
        </div>
        <span style={{fontSize:12,color:sCol(avail),fontWeight:700,marginRight:4,flexShrink:0}}>↓{avail}</span>
        <div style={{display:"flex",gap:8,flexShrink:0}}>
          <button onClick={onDec} style={btn(40,true)}>−</button>
          <button onClick={onInc} disabled={disabled} style={btn(40,false,disabled)}>+</button>
        </div>
      </div>
    );
  }
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,background:complete?"#f0fdf4":atLimit?"#fff7ed":"#f8f8f8",borderRadius:12,padding:"10px 4px",flex:1,minWidth:0,position:"relative",border:`1px solid ${complete?"#bbf7d0":atLimit?"#fed7aa":"transparent"}`}}>
      <span style={{fontSize:14,color:"#666",fontWeight:900}}>{size}</span>
      <span style={{position:"absolute",top:5,right:6,fontSize:9,color:sCol(avail),fontWeight:700}}>{avail}</span>
      <div style={{textAlign:"center",lineHeight:1}}>
        <ProdCellNum value={done} soll={soll} color={color} onSet={onSet} fontSize={28}/>
      </div>
      <div style={{display:"flex",gap:4}}>
        <button onClick={onDec} style={btn(28,true)}>−</button>
        <button onClick={onInc} disabled={disabled} style={btn(28,false,disabled)}>+</button>
      </div>
      {complete&&<span style={{position:"absolute",top:3,left:5,fontSize:9,color:"#16a34a"}}>✓</span>}
      {atLimit&&<span style={{position:"absolute",top:3,left:5,fontSize:9,color:"#f97316"}}>⚠</span>}
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────
function ProductCard({product,onUpdate,onDelete,onEdit}){
  const mobile=useIsMobile();
  const isCap=product.category==="Cap";
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
          <div style={{fontSize:mobile?15:16,fontWeight:800,color:"#111",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{product.name}</div>
          <div style={{display:"flex",gap:5,alignItems:"center",marginTop:2,flexWrap:"wrap"}}>
            {product.color&&<span style={{fontSize:11,color:"#aaa"}}>{product.color}</span>}
            {isCap&&<span style={{fontSize:10,background:"#f0f0f0",color:"#666",borderRadius:6,padding:"2px 7px",fontWeight:700}}>CAP</span>}
            {allOut&&<span style={{fontSize:10,background:"#fef2f2",color:"#ef4444",borderRadius:6,padding:"2px 7px",fontWeight:700}}>OUT</span>}
            {someOut&&<span style={{fontSize:10,background:"#fff0f0",color:"#dc2626",borderRadius:6,padding:"2px 7px",fontWeight:700}}>VERY LOW</span>}
            {hasLow&&<span style={{fontSize:10,background:"#fff7ed",color:"#f97316",borderRadius:6,padding:"2px 7px",fontWeight:700}}>LOW</span>}
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:16,flexShrink:0}}>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:mobile?26:30,fontWeight:900,color:"#111",lineHeight:1}}>{total}</div>
            <div style={{fontSize:10,color:"#bbb",fontWeight:700}}>TOTAL</div>
          </div>
          <div style={S.col4}>
            <button onClick={onDelete} style={iconBtn(true)}>✕</button>
            <button onClick={onEdit} style={iconBtn()}><PENCIL/></button>
          </div>
        </div>
      </div>
      {/* Stock grid */}
      {isCap?(
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {(product.capColors||[]).map(c=>{
            const isOut=c.stock===0,isLow=!isOut&&c.stock<=LOW_STOCK;
            return(
              <div key={c.id} style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"space-between",gap:0,background:"#f8f8f8",borderRadius:12,padding:"10px 8px",flex:1,minWidth:mobile?60:70,height:110}}>
                <div style={{width:20,height:20,borderRadius:"50%",background:c.hex,border:"2px solid #444"}}/>
                <span style={{fontSize:10,color:"#555",fontWeight:800,textAlign:"center",lineHeight:1.2}}>{c.name}</span>
                <CapStockNum value={c.stock} color={sCol(c.stock)} fontSize={mobile?24:28} onSet={v=>onUpdate({...product,capColors:(product.capColors||[]).map(x=>x.id===c.id?{...x,stock:Math.max(0,v)}:x)})}/>
                <div style={{display:"flex",gap:4}}>
                  <button onClick={()=>adjCap(c.id,-1)} style={btn(30,true)}>−</button>
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
    <div style={{background:"#fff",borderRadius:16,padding:mobile?16:20,border:"1px solid #ebebeb",boxShadow:"0 1px 4px rgba(0,0,0,0.06)",display:"flex",flexDirection:"column",gap:12}}>

      {/* ── Header – same structure as ProductCard ── */}
      <div style={S.row10}>
        {!mobile&&<div style={{cursor:"grab",color:"#ccc",fontSize:16,flexShrink:0}}>⠿</div>}
        <SmartDot item={prod} size={mobile?24:28}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:mobile?15:16,fontWeight:800,color:"#111",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{prod.name}</div>
          <div style={{display:"flex",gap:5,alignItems:"center",marginTop:2,flexWrap:"wrap"}}>
            <PriorityBadge priority={prod.priority}/>
            {(prod.veredelung||[]).map(v=><VeredBadge key={v} type={v}/>)}
            {blank&&<span style={{fontSize:10,color:"#aaa",display:"flex",alignItems:"center",gap:3}}><ColorDot hex={blank.colorHex} size={10}/>{blank.name}</span>}
          </div>
          {prod.notes&&<div style={{fontSize:11,color:"#bbb",fontStyle:"italic",marginTop:2}}>{prod.notes}</div>}
          {prod.designUrl&&<a href={prod.designUrl.startsWith("http")?prod.designUrl:"https://"+prod.designUrl} target="_blank" rel="noopener noreferrer" style={{fontSize:11,color:"#3b82f6",display:"inline-block",marginTop:2}}>🔗 Design</a>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:16,flexShrink:0}}>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:mobile?26:30,fontWeight:900,color:"#111",lineHeight:1}}>{totalDone}<span style={{fontSize:12,color:"#bbb",fontWeight:400}}>/{totalQty}</span></div>
            <div style={{fontSize:10,color:allDone?"#16a34a":"#bbb",fontWeight:700}}>{allDone?"✓ DONE":"DONE"}</div>
          </div>
          <div style={S.col4}>
            <button onClick={onDelete} style={iconBtn(true)}>✕</button>
            <button onClick={onEdit} style={iconBtn()}><PENCIL/></button>
          </div>
        </div>
      </div>

      {/* Photos */}
      {prod.photos?.length>0&&(
        <>
          <div style={{display:"flex",gap:6,overflowX:"auto"}}>
            {prod.photos.map((src,i)=><img key={i} src={src} alt="" onClick={()=>setLightbox(src)} style={{height:60,width:60,objectFit:"cover",borderRadius:8,border:"1px solid #ebebeb",flexShrink:0,cursor:"zoom-in"}}/>)}
          </div>
          <Lightbox src={lightbox} onClose={()=>setLightbox(null)}/>
        </>
      )}

      {/* Progress bar */}
      {totalQty>0&&(
        <div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#bbb",fontWeight:700,marginBottom:3}}>
            <span>{progress}% erledigt</span><span>{totalQty-totalDone} verbleibend</span>
          </div>
          <div style={{height:5,background:"#f0f0f0",borderRadius:99,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${progress}%`,background:allDone?"#16a34a":"#111",borderRadius:99,transition:"width 0.3s"}}/>
          </div>
        </div>
      )}

      {/* ── Sizes / Cap colors – matching ProductCard grid style ── */}
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
                  <CapStockNum value={c.done} soll={c.qty} color={complete?"#16a34a":atLimit?"#f97316":"#111"} fontSize={mobile?24:28} onSet={prod.status!=="Fertig"?v=>onUpdate({...prod,capColors:(prod.capColors||[]).map(x=>x.id===c.id?{...x,done:Math.min(max,Math.max(0,v))}:x)})  :null}/>
                </div>
                <div style={{fontSize:9,color:sCol(avail,3),fontWeight:700}}>↓{avail}</div>
                {prod.status!=="Fertig"&&(
                  <div style={{display:"flex",gap:4}}>
                    <button onClick={()=>adjCapDone(c.id,-1)} style={btnMinus}>−</button>
                    <button onClick={()=>adjCapDone(c.id,1)} disabled={atLimit} style={btnPlus(atLimit)}>+</button>
                  </div>
                )}
                {complete&&<span style={{position:"absolute",top:3,right:5,fontSize:9}}>✓</span>}
                {atLimit&&!complete&&<span style={{position:"absolute",top:3,right:5,fontSize:9,color:"#f97316"}}>⚠</span>}
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
              <div key={size} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,background:"#fafafa",borderRadius:12,padding:"10px 4px",opacity:0.3}}>
                <span style={{fontSize:14,color:"#bbb",fontWeight:900}}>{size}</span>
                <span style={{fontSize:32,fontWeight:900,color:"#ddd",lineHeight:1}}>—</span>
              </div>
            );
            const lim=done>=maxDone(size);
            return <ProdCell key={size} size={size} soll={soll} done={done} avail={avail}
              disabled={lim} onDec={()=>adjDone(size,-1)} onInc={()=>adjDone(size,1)} onSet={v=>onUpdate({...prod,done:{...(prod.done||{}),[size]:Math.min(maxDone(size),Math.max(0,v))}})}/>;
          })}
        </div>
      )}

      {/* ── Actions ── */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap",paddingTop:4,borderTop:"1px solid #f0f0f0"}}>
        <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
          {!fUnknown&&<span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"4px 9px",borderRadius:20,fontSize:11,fontWeight:800,background:fOk?"#dcfce7":"#fee2e2",color:fOk?"#16a34a":"#ef4444",border:`1px solid ${fOk?"#bbf7d0":"#fecaca"}`}}>
            {fOk?"✅":"⛔️"} Blanks ({blankNeeded}/{blankAvail})
          </span>}
          {fUnknown&&<span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"4px 9px",borderRadius:20,fontSize:11,fontWeight:800,background:"#f5f5f5",color:"#bbb",border:"1px solid #e8e8e8"}}>— Kein Blank</span>}
          {dtfItem&&(()=>{
            const needed=totalQty;
            const avail=dtfItem.stock||0;
            const ok=avail>=needed;
            return <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"4px 9px",borderRadius:20,fontSize:11,fontWeight:800,background:ok?"#dcfce7":"#fee2e2",color:ok?"#16a34a":"#ef4444",border:`1px solid ${ok?"#bbf7d0":"#fecaca"}`}}>
              {ok?"✅":"⛔️"} DTF ({needed}/{avail})
            </span>;
          })()}
        </div>
        <div style={{display:"flex",gap:6}}>
          {prod.status!=="Fertig"&&<button onClick={onConfirmProduce} style={{padding:"9px 18px",borderRadius:9,border:"none",background:"#16a34a",color:"#fff",cursor:"pointer",fontWeight:800,fontSize:14,display:"flex",alignItems:"center",gap:6}}><CHECK/>Bestätigen</button>}
          {prod.status==="Fertig"&&<span style={{fontSize:12,color:"#16a34a",fontWeight:700}}>✓ Abgeschlossen</span>}
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
        <button onClick={e=>{e.stopPropagation();onDelete();}} style={{width:28,height:28,borderRadius:7,border:"1px solid #e8e8e8",background:"#f0f0f0",color:"#ef4444",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800}}>✕</button>
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
                    <span style={{fontSize:12,fontWeight:800,color:"#555",width:36}}>{size}</span>
                    <span style={{fontSize:18,fontWeight:900,color:"#111",flex:1}}>{qty} <span style={{fontSize:10,color:"#bbb",fontWeight:400}}>Stk</span></span>
                    {done>0&&<span style={{fontSize:10,color:"#16a34a",fontWeight:700}}>✓ {done} erledigt</span>}
                  </div>
                );
              })}
            </div>
          )}
          {prod.notes&&<div style={{fontSize:11,color:"#aaa",fontStyle:"italic",marginTop:8}}>📝 {prod.notes}</div>}
        </div>
      )}
    </div>
  );
}

// ─── Modals ───────────────────────────────────────────────────────
function ModalWrap({onClose,onSave,children,footer,width=600}){
  const mobile=useIsMobile();
  return(
    <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.4)",zIndex:300,display:"flex",alignItems:mobile?"flex-end":"center",justifyContent:"center"}} onClick={onClose}>
      <div style={{
        background:"#fff",
        borderRadius:mobile?"20px 20px 0 0":18,
        width:mobile?"100%":width,
        maxWidth:"100vw",
        maxHeight:mobile?"92dvh":"90vh",
        display:"flex",
        flexDirection:"column",
        boxShadow:"0 -4px 40px rgba(0,0,0,0.18)",
      }} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"flex-end",alignItems:"center",gap:8,padding:"16px 16px 8px",flexShrink:0,borderBottom:"1px solid #f0f0f0"}}>
          {onSave&&<button onClick={onSave} style={{width:36,height:36,borderRadius:"50%",border:"none",background:"#16a34a",color:"#fff",fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,lineHeight:1,flexShrink:0}}>✓</button>}
          <button onClick={onClose} style={{width:36,height:36,borderRadius:"50%",border:"none",background:"#ef4444",color:"#fff",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,lineHeight:1,flexShrink:0}}>✕</button>
        </div>
        <div style={{overflowY:"auto",WebkitOverflowScrolling:"touch",padding:mobile?"14px 16px 8px":"16px 26px 16px",display:"flex",flexDirection:"column",gap:14,flex:1,minHeight:0}}>
          {children}
        </div>
        {footer&&<div style={{padding:mobile?"12px 16px env(safe-area-inset-bottom,16px)":"12px 26px 20px",flexShrink:0,borderTop:"1px solid #f0f0f0"}}>
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
    <div style={{display:"flex",alignItems:"center",gap:10,background:over?"#fef2f2":"#f8f8f8",borderRadius:10,padding:"8px 12px",border:`1px solid ${over?"#fecaca":"transparent"}`}}>
      <span style={S.sizeTag}>{size}</span>
      <span style={{fontSize:11,color:"#aaa",flex:1}}>Lager: {avail}</span>
      <button type="button" onClick={onDec} style={{width:32,height:32,borderRadius:8,border:"none",background:"#fee2e2",color:"#ef4444",fontSize:18,cursor:"pointer",fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
      {editing
        ? <input ref={inputRef} type="number" inputMode="numeric" pattern="[0-9]*" value={draft}
            onChange={e=>setDraft(e.target.value)} onBlur={commit} onKeyDown={e=>{if(e.key==="Enter")commit();if(e.key==="Escape")setEditing(false);}}
            style={{fontSize:20,fontWeight:900,color:over?"#ef4444":"#111",width:36,textAlign:"center",border:"none",background:"transparent",outline:"none"}}/>
        : <span onDoubleClick={startEdit} style={{fontSize:20,fontWeight:900,color:over?"#ef4444":"#111",width:36,textAlign:"center",cursor:"text"}}>{value}</span>
      }
      <button type="button" onClick={onInc} style={{width:32,height:32,borderRadius:8,border:"none",background:"#dcfce7",color:"#16a34a",fontSize:18,cursor:"pointer",fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
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
  const getCapColorsFromBlank=(blankProd,existingCapColors)=>{
    if(!blankProd||blankProd.category!=="Cap")return existingCapColors||[];
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
  const isCap=blank?.category==="Cap";
  const inp={background:"#f8f8f8",border:"1px solid #e8e8e8",borderRadius:10,color:"#111",padding:"11px 14px",fontSize:16,width:"100%",outline:"none",boxSizing:"border-box"};
  const toggleV=(v)=>setVeredelung(vs=>vs.includes(v)?vs.filter(x=>x!==v):[...vs,v]);
  const handlePhotos=(e)=>{const files=Array.from(e.target.files);const rem=5-photos.length;files.slice(0,rem).forEach(f=>{const r=new FileReader();r.onload=ev=>setPhotos(ps=>[...ps,ev.target.result]);r.readAsDataURL(f);});};
  return(
    <ModalWrap onClose={onClose} onSave={()=>{if(!name.trim()||!blankId||veredelung.length===0)return;onSave({id:initial?.id||Date.now().toString(),name:name.trim(),blankId,notes,priority,status:initial?.status||"Geplant",veredelung,designUrl,colorHex:blank?.colorHex||"#000000",photos,dtfId:dtfId||null,isCapOrder:isCap,qty,done,capColors});}} width={640}>
      <div style={{fontSize:17,fontWeight:800,color:"#111"}}>{editing?"Auftrag bearbeiten":"Neuer Produktionsauftrag"}</div>
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
          {VEREDELUNG_TYPES.map(v=>{const active=veredelung.includes(v);const sc={"Drucken":{ac:"#3b82f6",bg:"#eff6ff"},"Sticken":{ac:"#a855f7",bg:"#fdf4ff"}}[v];return <button key={v} type="button" onClick={()=>toggleV(v)} style={{flex:1,padding:"11px",borderRadius:10,border:`1.5px solid ${active?sc.ac:"#e8e8e8"}`,background:active?sc.bg:"#fff",color:active?sc.ac:"#999",cursor:"pointer",fontWeight:700,fontSize:13}}>{v==="Drucken"?"🖨 Drucken":"🪡 Sticken"}</button>;})}

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
      <input style={inp} placeholder="🔗 Design-Link" value={designUrl} onChange={e=>setDesignUrl(e.target.value)}/>
      <div>
        <div style={S.secLabel}>FOTOS (max. 5)</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
          {photos.map((src,i)=><div key={i} style={{position:"relative"}}>
              <img src={src} alt="" onClick={()=>setModalLightbox(src)} style={{width:64,height:64,objectFit:"cover",borderRadius:10,border:"1px solid #ebebeb",cursor:"zoom-in"}}/>
              <button type="button" onClick={()=>setPhotos(ps=>ps.filter((_,j)=>j!==i))} style={{position:"absolute",top:-6,right:-6,width:20,height:20,borderRadius:"50%",border:"none",background:"#ef4444",color:"#fff",cursor:"pointer",fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800}}>✕</button>
            </div>)}
          <Lightbox src={modalLightbox} onClose={()=>setModalLightbox(null)}/>
          {photos.length<5&&<button type="button" onClick={()=>fileRef.current.click()} style={{width:64,height:64,borderRadius:10,border:"2px dashed #e8e8e8",background:"#fafafa",color:"#bbb",cursor:"pointer",fontSize:24,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>}
          <input ref={fileRef} type="file" accept="image/*" multiple style={{display:"none"}} onChange={handlePhotos}/>
        </div>
      </div>
      <div>
        <div style={S.secLabel}>BLANK VERKNÜPFEN</div>
        <select value={blankId} onChange={e=>{
          const p=products.find(x=>x.id===e.target.value);
          setBlankId(e.target.value);
          if(p?.category==="Cap") setCapColors(getCapColorsFromBlank(p, capColors));
        }} style={{width:"100%",padding:"12px 14px",borderRadius:10,border:"1.5px solid #e8e8e8",fontSize:14,fontWeight:600,outline:"none",background:"#fff",appearance:"none",cursor:"pointer"}}>
          <option value="">— Blank auswählen —</option>
          {products.map(p=>(
            <option key={p.id} value={p.id}>{p.name}{p.color?" · "+p.color:""} · {p.category}</option>
          ))}
        </select>
        {blank&&<div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",borderRadius:10,background:"#f8f8f8",border:"1px solid #e8e8e8"}}>
          <SmartDot item={blank} size={20}/>
          <div><div style={{fontSize:13,fontWeight:700}}>{blank.name}</div><div style={{fontSize:11,color:"#aaa"}}>{blank.color||""} · {blank.category}</div></div>
        </div>}
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
                <div key={cc.id} style={{display:"flex",alignItems:"center",gap:10,background:over?"#fef2f2":"#f8f8f8",borderRadius:10,padding:"10px 12px",border:`1px solid ${over?"#fecaca":"transparent"}`}}>
                  <div style={{width:24,height:24,borderRadius:"50%",background:cc.hex,border:"2px solid #444",flexShrink:0}}/>
                  <span style={{fontSize:13,fontWeight:700,color:"#333",flex:1}}>{cc.name}</span>
                  <span style={{fontSize:11,color:"#aaa"}}>Lager: <b style={{color:avail===0?"#ef4444":avail<=3?"#f97316":"#111"}}>{avail}</b></span>
                  <button type="button" onClick={()=>setCapColors(cs=>cs.map(x=>x.id===cc.id?{...x,qty:Math.max(0,(x.qty||0)-1)}:x))} style={btn(32,true)}>−</button>
                  <span style={{fontSize:20,fontWeight:900,color:over?"#ef4444":"#111",width:30,textAlign:"center"}}>{cc.qty||0}</span>
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
      <div style={{display:"flex",gap:10,marginTop:4}}>
        <button type="button" onClick={onClose} style={{flex:1,padding:13,borderRadius:10,border:"1px solid #e8e8e8",background:"none",color:"#888",cursor:"pointer",fontWeight:700,fontSize:14}}>Abbrechen</button>
        <button type="button" onClick={()=>{if(!name.trim()||!blankId||veredelung.length===0)return;onSave({id:initial?.id||Date.now().toString(),name:name.trim(),blankId,notes,priority,status:initial?.status||"Geplant",veredelung,designUrl,colorHex:blank?.colorHex||"#000000",photos,dtfId:dtfId||null,isCapOrder:isCap,qty,done,capColors});}}
          style={{flex:2,padding:13,borderRadius:10,border:"none",background:"#111",color:"#fff",cursor:"pointer",fontWeight:800,fontSize:14}}>{editing?"Speichern":"Anlegen"}</button>
      </div>
    </ModalWrap>
  );
}

function ProductModal({categories,initial,onClose,onSave}){
  const editing=!!initial;
  const [name,setName]=useState(initial?.name||"");
  const [category,setCategory]=useState(initial?.category||categories[0]||"");
  const [color,setColor]=useState(initial?.color||"");
  const [colorHex,setColorHex]=useState(initial?.colorHex||"#000000");
  const [buyPrice,setBuyPrice]=useState(initial?.buyPrice!=null?String(initial.buyPrice):"");
  const [supplierUrl,setSupplierUrl]=useState(initial?.supplierUrl||"");
  const [stProductId,setStProductId]=useState(initial?.stProductId||"");
  const [stColorCode,setStColorCode]=useState(initial?.stColorCode||"");
  const [stock,setStock]=useState(initial?.stock||mkQty());
  const [minStock,setMinStock]=useState(initial?.minStock||mkQty());
  const [capColors,setCapColors]=useState(initial?.capColors||[{id:mkId(),name:"Black",hex:"#111111",stock:0}]);
  const isCap=category==="Cap";
  const [showPresets, setShowPresets] = useState(false);
  const [presetProduct, setPresetProduct] = useState(null);
  const inp={background:"#f8f8f8",border:"1px solid #e8e8e8",borderRadius:10,color:"#111",padding:"11px 14px",fontSize:16,width:"100%",outline:"none",boxSizing:"border-box"};

  const applyPreset = (preset, colorObj) => {
    setName(preset.name + " · " + colorObj.name);
    setColor(colorObj.name);
    setColorHex(colorObj.hex);
    setStProductId(preset.productId);
    setStColorCode(colorObj.code);
    if(colorObj.price!=null) setBuyPrice(String(colorObj.price));
    setShowPresets(false);
    setPresetProduct(null);
  };

  return(
    <ModalWrap onClose={onClose} onSave={()=>{if(!name.trim())return;onSave({id:initial?.id||Date.now().toString(),name:name.trim(),category,color,colorHex,buyPrice:parseFloat(buyPrice)||null,supplierUrl:supplierUrl.trim(),stProductId:stProductId.trim(),stColorCode:stColorCode.trim(),stock,minStock,capColors});}} width={620}>
      <div style={{fontSize:17,fontWeight:800,color:"#111"}}>{editing?"Produkt bearbeiten":"Neues Produkt"}</div>

      {/* Stanley/Stella Preset Picker */}
      {!editing&&(
        <div>
          <button type="button" onClick={()=>setShowPresets(s=>!s)}
            style={{width:"100%",padding:"10px 14px",borderRadius:10,border:"1.5px dashed #ccc",background:"#fafafa",color:"#555",cursor:"pointer",fontWeight:700,fontSize:13,textAlign:"left",display:"flex",alignItems:"center",gap:8}}>
            <span>⚡</span> Stanley/Stella Preset laden…
            <span style={{marginLeft:"auto",color:"#bbb"}}>{showPresets?"▲":"▼"}</span>
          </button>
          {showPresets&&(
            <div style={{background:"#fff",border:"1px solid #e8e8e8",borderRadius:12,marginTop:6,overflow:"hidden",boxShadow:"0 4px 16px rgba(0,0,0,0.08)"}}>
              {!presetProduct ? (
                // Step 1: choose product
                <div style={{display:"flex",flexDirection:"column",gap:0}}>
                  <div style={{fontSize:10,color:"#bbb",fontWeight:700,letterSpacing:0.8,padding:"10px 14px 6px"}}>ARTIKEL WÄHLEN</div>
                  {STANLEY_STELLA_PRESETS.map(p=>(
                    <button key={p.id} type="button" onClick={()=>setPresetProduct(p)}
                      style={{padding:"12px 14px",border:"none",borderTop:"1px solid #f0f0f0",background:"#fff",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:10}}>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:800,color:"#111"}}>{p.name}</div>
                        <div style={{fontSize:11,color:"#aaa"}}>{p.id} · {p.fit}</div>
                      </div>
                      <span style={{color:"#bbb"}}>›</span>
                    </button>
                  ))}
                </div>
              ) : (
                // Step 2: choose color
                <div>
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
        </div>
      )}

      <input style={inp} placeholder="Produktname" value={name} onChange={e=>setName(e.target.value)}/>
      <div style={{display:"flex",gap:10}}>
        <select style={{...inp,flex:1}} value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select>
        <div style={{flex:1,position:"relative"}}><span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:"#aaa",fontSize:14,fontWeight:700,pointerEvents:"none"}}>€</span><input style={{...inp,paddingLeft:28}} placeholder="EK-Preis" type="number" min="0" step="0.01" value={buyPrice} onChange={e=>setBuyPrice(e.target.value)}/></div>
      </div>
      <input style={inp} placeholder="🔗 Hersteller-Link" value={supplierUrl} onChange={e=>setSupplierUrl(e.target.value)}/>

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
          <div style={S.secLabel}>FARBEN & BESTAND</div>
          <CapColorEditor colors={capColors} onChange={setCapColors} mode="stock"/>
        </div>
      ):(
        <>
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
          <div>
            <div style={S.secLabel}>SOLLBESTAND (Min.)</div>
            <div style={S.col5}>
              {DEFAULT_SIZES.map(size=>(
                <div key={size} style={{display:"flex",alignItems:"center",gap:10,background:"#fafafa",borderRadius:10,padding:"8px 12px"}}>
                  <span style={{fontSize:13,fontWeight:800,color:"#aaa",width:36}}>{size}</span>
                  <div style={{flex:1}}/>
                  <input type="number" min="0" style={{...inp,textAlign:"center",padding:"7px",fontSize:14,fontWeight:700,width:70}} value={minStock[size]||0} onChange={e=>setMinStock(s=>({...s,[size]:parseInt(e.target.value)||0}))}/>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      <div style={{display:"flex",gap:10,marginTop:4}}>
        <button type="button" onClick={onClose} style={{flex:1,padding:13,borderRadius:10,border:"1px solid #e8e8e8",background:"none",color:"#888",cursor:"pointer",fontWeight:700,fontSize:14}}>Abbrechen</button>
        <button type="button" onClick={()=>{if(!name.trim())return;onSave({id:initial?.id||Date.now().toString(),name:name.trim(),category,color,colorHex,buyPrice:parseFloat(buyPrice)||null,supplierUrl:supplierUrl.trim(),stProductId:stProductId.trim(),stColorCode:stColorCode.trim(),stock,minStock,capColors});}}
          style={{flex:2,padding:13,borderRadius:10,border:"none",background:"#111",color:"#fff",cursor:"pointer",fontWeight:800,fontSize:14}}>{editing?"Speichern":"Hinzufügen"}</button>
      </div>
    </ModalWrap>
  );
}

function CategoryModal({categories,onClose,onSave}){
  const [cats,setCats]=useState([...categories]);
  const [newCat,setNewCat]=useState("");
  const inp={background:"#f8f8f8",border:"1px solid #e8e8e8",borderRadius:10,color:"#111",padding:"11px 14px",fontSize:14,outline:"none"};
  return(
    <ModalWrap onClose={onClose} width={380}>
      <div style={{fontSize:17,fontWeight:800,color:"#111"}}>Kategorien</div>
      <div style={{display:"flex",flexDirection:"column",gap:7}}>
        {cats.map((c,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,background:"#f8f8f8",borderRadius:10,padding:"10px 12px"}}><span style={{flex:1,fontSize:14,fontWeight:600}}>{c}</span><button type="button" onClick={()=>setCats(cats.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:"#ccc",cursor:"pointer",fontSize:18}}>✕</button></div>)}
      </div>
      <div style={{display:"flex",gap:8}}>
        <input style={{...inp,flex:1}} placeholder="Neue Kategorie..." value={newCat} onChange={e=>setNewCat(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&newCat.trim()){setCats([...cats,newCat.trim()]);setNewCat("");}}}/>
        <button type="button" onClick={()=>{if(newCat.trim()){setCats([...cats,newCat.trim()]);setNewCat("");}}} style={{padding:"11px 16px",borderRadius:10,border:"none",background:"#111",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:14}}>+</button>
      </div>
      <div style={{display:"flex",gap:10}}>
        <button type="button" onClick={onClose} style={{flex:1,padding:13,borderRadius:10,border:"1px solid #e8e8e8",background:"none",color:"#888",cursor:"pointer",fontWeight:700}}>Abbrechen</button>
        <button type="button" onClick={()=>onSave(cats)} style={{flex:2,padding:13,borderRadius:10,border:"none",background:"#111",color:"#fff",cursor:"pointer",fontWeight:800,fontSize:14}}>Speichern</button>
      </div>
    </ModalWrap>
  );
}

function DeleteConfirmModal({name,onConfirm,onCancel}){
  return(
    <ModalWrap onClose={onCancel} width={360}>
      <div style={{width:48,height:48,borderRadius:"50%",background:"#fef2f2",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>🗑</div>
      <div><div style={{fontSize:17,fontWeight:800,color:"#111",marginBottom:4}}>Löschen?</div><div style={{fontSize:14,color:"#888"}}><strong style={{color:"#111"}}>{name}</strong> wird dauerhaft entfernt.</div></div>
      <div style={{display:"flex",gap:10}}>
        <button type="button" onClick={onCancel} style={{flex:1,padding:13,borderRadius:10,border:"1px solid #e8e8e8",background:"none",color:"#666",cursor:"pointer",fontWeight:700}}>Abbrechen</button>
        <button type="button" onClick={onConfirm} style={{flex:1,padding:13,borderRadius:10,border:"none",background:"#ef4444",color:"#fff",cursor:"pointer",fontWeight:800}}>Löschen</button>
      </div>
    </ModalWrap>
  );
}

function ConfirmProduceModal({prod,blank,onConfirm,onCancel}){
  const isCap=prod.isCapOrder;
  const capDoneItems=(prod.capColors||[]).filter(c=>c.done>0);
  const sizDoneItems=DEFAULT_SIZES.filter(s=>((prod.done||{})[s]||0)>0);
  const hasAny=isCap?capDoneItems.length>0:sizDoneItems.length>0;
  return(
    <ModalWrap onClose={onCancel} width={420}>
      <div style={{fontSize:16,fontWeight:800,color:"#111"}}>Abschließen & Bestand abziehen</div>
      <div style={{fontSize:13,color:"#888",lineHeight:1.6}}>Erledigte Stücke werden von <strong style={{color:"#111"}}>{blank?.name}</strong> abgezogen:</div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {!hasAny&&<span style={{fontSize:13,color:"#bbb"}}>Noch nichts erledigt</span>}
        {isCap?capDoneItems.map(c=><div key={c.id} style={{background:"#f8f8f8",borderRadius:9,padding:"8px 12px",display:"flex",alignItems:"center",gap:8}}><div style={{width:16,height:16,borderRadius:"50%",background:c.hex,border:"1.5px solid #444"}}/><div><div style={{fontSize:10,color:"#aaa",fontWeight:700}}>{c.name}</div><div style={{fontSize:18,fontWeight:900,color:"#111"}}>{c.done}</div></div></div>)
        :sizDoneItems.map(s=><div key={s} style={{background:"#f8f8f8",borderRadius:9,padding:"8px 12px",textAlign:"center"}}><div style={{fontSize:10,color:"#aaa",fontWeight:700}}>{s}</div><div style={{fontSize:18,fontWeight:900,color:"#111"}}>{(prod.done||{})[s]}</div></div>)}
      </div>
      <div style={{fontSize:12,color:"#f97316",fontWeight:600}}>⚠ Kann nicht rückgängig gemacht werden.</div>
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
      <div style={{fontSize:17,fontWeight:800,color:"#111"}}>Bestellbedarf</div>
      {Object.keys(bedarfMap).length===0&&<div style={{color:"#bbb",fontSize:14,textAlign:"center",padding:40}}>Keine aktiven Aufträge</div>}
      {Object.entries(bedarfMap).map(([blankId,sizeNeeds])=>{
        const blank=products.find(p=>p.id===blankId);if(!blank)return null;
        const isCap=isCapMap[blankId]||false;
        const relKeys=Object.keys(sizeNeeds).filter(k=>(sizeNeeds[k]||0)>0);
        return(
          <div key={blankId} style={{background:"#f8f8f8",borderRadius:14,padding:16}}>
            <div style={S.cardHdr}>
              <SmartDot item={blank} size={22}/>
              <div><div style={{fontSize:14,fontWeight:800}}>{blank.name}</div><div style={{fontSize:11,color:"#aaa"}}>{blank.color} · {blank.category}</div></div>
              {blank.supplierUrl&&<a href={blank.supplierUrl.startsWith("http")?blank.supplierUrl:"https://"+blank.supplierUrl} target="_blank" rel="noopener noreferrer" style={{marginLeft:"auto",fontSize:12,color:"#3b82f6",fontWeight:700}}>↗ Bestellen</a>}
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
                const label=isCapKey?(capColor?.name||key.split("_").slice(2).join("_")):key;
                const toOrder=Math.max(0,needed-avail);
                const toOrderWithMin=Math.max(0,needed+minStock-avail);
                const ok=toOrder===0;
                const okWithMin=toOrderWithMin===0;
                return(
                <div key={key} style={{background:"#fff",borderRadius:10,border:`1px solid ${ok?"#bbf7d0":"#fecaca"}`,overflow:"hidden"}}>
                  <div onClick={()=>setOpenSize(o=>o===`${blankId}-${key}`?null:`${blankId}-${key}`)}
                    style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",cursor:"pointer",userSelect:"none"}}>
                    <span style={{fontSize:12,color:"#bbb",width:12}}>{openSize===`${blankId}-${key}`?"▾":"▸"}</span>
                    {isCapKey&&capColor?<ColorDot hex={capColor.hex} size={16}/>:null}
                    <span style={S.sizeTag}>{label}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:11,color:"#888"}}>Produktion: <strong style={{color:"#111"}}>{needed}</strong> · Lager: <strong style={{color:avail>=needed?"#16a34a":"#ef4444"}}>{avail}</strong></div>
                      {minStock>0&&<div style={{fontSize:10,color:"#bbb",marginTop:1}}>Sollbestand: {minStock} Stk</div>}
                    </div>
                    <div style={S.pill(ok)}>
                      <div style={S.pillLbl(ok)}>PRODUKTION</div>
                      <div style={S.pillNum(ok)}>{toOrder}</div>
                    </div>
                    {minStock>0&&<div style={{background:okWithMin?"#dcfce7":"#fff7ed",borderRadius:8,padding:"4px 10px",textAlign:"center",minWidth:52,border:`1px solid ${okWithMin?"#bbf7d0":"#fed7aa"}`}}>
                      <div style={{fontSize:9,color:okWithMin?"#16a34a":"#f97316",fontWeight:700}}>MAX</div>
                      <div style={{fontSize:18,fontWeight:900,color:okWithMin?"#16a34a":"#f97316",lineHeight:1}}>{toOrderWithMin}</div>
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
  const [pricePerMeter, setPricePerMeter] = useState(initial?.pricePerMeter!=null?String(initial.pricePerMeter):"");

  const dpm = Math.max(1, designsPerMeter);
  const ppm = parseFloat(pricePerMeter)||null;
  const pricePerPiece = ppm!=null ? ppm/dpm : null;

  const save = () => {
    if(!name.trim()) return;
    onSave({ id: initial?.id || Date.now().toString(), name: name.trim(), stock, minStock, designsPerMeter, pricePerMeter: ppm });
  };

  return(
    <ModalWrap onClose={onClose} width={400} onSave={save}>
      <div style={{fontSize:17,fontWeight:800}}>{initial ? "DTF bearbeiten" : "DTF anlegen"}</div>
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
          <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:"#aaa",fontSize:14,fontWeight:700,pointerEvents:"none"}}>€</span>
          <input type="number" min="0" step="0.01" placeholder="z.B. 10.00" value={pricePerMeter} onChange={e=>setPricePerMeter(e.target.value)}
            style={{background:"#f8f8f8",border:"1.5px solid #e8e8e8",borderRadius:10,color:"#111",padding:"12px 14px",paddingLeft:28,fontSize:15,width:"100%",outline:"none",boxSizing:"border-box"}}/>
        </div>
        {pricePerPiece!=null&&<div style={{fontSize:11,color:"#3b82f6",marginTop:6,fontWeight:700}}>= €{pricePerPiece.toFixed(2)} pro Folie/Design</div>}
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
      <button type="button" onClick={()=>onChange(Math.max(0,value-1))} style={{width:44,height:44,borderRadius:10,border:"none",background:"#fee2e2",color:"#ef4444",fontSize:24,cursor:"pointer",fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
      {editing
        ? <input ref={inputRef} type="number" inputMode="numeric" pattern="[0-9]*" value={draft}
            onChange={e=>setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={e=>{if(e.key==="Enter")commit();if(e.key==="Escape")setEditing(false);}}
            style={{width:90,textAlign:"center",fontSize:32,fontWeight:900,border:"2px solid #3b82f6",borderRadius:12,padding:"10px 8px",outline:"none",background:"#fff"}}/>
        : <span onDoubleClick={startEdit} style={{width:90,textAlign:"center",fontSize:32,fontWeight:900,color:"#111",cursor:"text",padding:"10px 8px",borderRadius:12,border:"2px solid transparent",display:"inline-block"}}
            title="Doppelklick zum Bearbeiten">{value}</span>
      }
      <button type="button" onClick={()=>onChange(value+1)} style={{width:44,height:44,borderRadius:10,border:"none",background:"#dcfce7",color:"#16a34a",fontSize:24,cursor:"pointer",fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
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
        onKeyDown={e=>{if(e.key==="Enter")commit();if(e.key==="Escape")setEditing(false);}}
        style={{width:90,textAlign:"center",fontSize:32,fontWeight:900,border:"2px solid #3b82f6",borderRadius:12,padding:"8px",outline:"none",background:"#fff"}}/>
    : <span onDoubleClick={start} style={{fontSize:32,fontWeight:900,color:"#111",cursor:"text",display:"inline-block",minWidth:60,textAlign:"center"}} title="Doppelklick zum Bearbeiten">{value}</span>;
}

function DtfCard({item, onUpdate, onDelete, onEdit, linkedProds}){
  const mobile = useIsMobile();
  const adj = (d) => onUpdate({...item, stock: Math.max(0, item.stock + d)});

  return(
    <div style={{background:"#fff",borderRadius:14,padding:mobile?"14px 14px":"16px 20px",border:"1px solid #ebebeb",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
        <div style={{width:36,height:36,borderRadius:10,background:"#111",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>🖨</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:14,fontWeight:800,color:"#111"}}>{item.name}</div>
          {linkedProds.length>0&&<div style={{fontSize:11,color:"#3b82f6",fontWeight:600,marginTop:2}}>
            🔗 {linkedProds.map(p=>p.name).join(", ")}
          </div>}
          {item.designsPerMeter>1&&<div style={{fontSize:11,color:"#888",marginTop:2}}>📏 {item.designsPerMeter} Designs/m</div>}
        </div>
        <button onClick={onEdit} style={{padding:"6px 12px",borderRadius:8,border:"1px solid #e8e8e8",background:"#fff",color:"#555",fontSize:12,fontWeight:700,cursor:"pointer"}}>✏️</button>
        <button onClick={onDelete} style={{padding:"6px 10px",borderRadius:8,border:"1px solid #fee2e2",background:"#fff",color:"#ef4444",fontSize:12,fontWeight:700,cursor:"pointer"}}>✕</button>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:16,background:"#f8f8f8",borderRadius:12,padding:"12px 16px"}}>
        <button onClick={()=>adj(-1)} style={{width:44,height:44,borderRadius:10,border:"none",background:"#fee2e2",color:"#ef4444",fontSize:24,cursor:"pointer",fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
        <div style={{flex:1,textAlign:"center"}}>
          <DtfStockNum value={item.stock} onChange={v=>onUpdate({...item,stock:Math.max(0,v)})}/>
          <div style={{fontSize:10,color:"#bbb",fontWeight:700,marginTop:2}}>STÜCK AUF LAGER</div>
        </div>
        <button onClick={()=>adj(1)} style={{width:44,height:44,borderRadius:10,border:"none",background:"#dcfce7",color:"#16a34a",fontSize:24,cursor:"pointer",fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
      </div>
    </div>
  );
}

// ─── DTF View ─────────────────────────────────────────────────────
function DtfView({dtfItems, prods, onUpdate, onDelete, onEdit, onAdd}){
  return(
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      {dtfItems.length===0&&(
        <div style={{color:"#ccc",fontSize:14,padding:60,textAlign:"center"}}>
          <div style={{fontSize:40,marginBottom:12}}>🖨</div>
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
  const [tab, setTab] = useState("fehler");
  const [showAddFehler, setShowAddFehler] = useState(false);
  const [showAddPromo, setShowAddPromo] = useState(false);
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

  return(
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <div style={{display:"flex",gap:6,background:"#e8e8e8",borderRadius:12,padding:4}}>
        {[["fehler","🔴 Produktionsfehler"],["promo","🎁 Promo Gifts"]].map(([v,lbl])=>(
          <button key={v} onClick={()=>setTab(v)} style={{flex:1,padding:"8px 12px",borderRadius:9,border:"none",background:tab===v?"#fff":"transparent",color:tab===v?"#111":"#888",cursor:"pointer",fontWeight:700,fontSize:13,boxShadow:tab===v?"0 1px 3px rgba(0,0,0,0.08)":"none"}}>{lbl}</button>
        ))}
      </div>
      {tab==="fehler"&&(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <div style={{display:"flex",justifyContent:"flex-end"}}>
            <button onClick={()=>setShowAddFehler(true)} style={{padding:"8px 16px",borderRadius:9,border:"none",background:"#ef4444",color:"#fff",fontSize:13,fontWeight:800,cursor:"pointer"}}>+ Fehler eintragen</button>
          </div>
          {verluste.length===0&&<div style={{textAlign:"center",padding:40,color:"#ccc",fontSize:14}}>Keine Einträge</div>}
          {verluste.map(v=>(
            <div key={v.id} style={{background:"#fff",borderRadius:12,padding:"12px 16px",border:"1px solid #ebebeb",display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:10,height:10,borderRadius:"50%",background:v.produktHex,flexShrink:0,border:"1px solid #ddd"}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:800,color:"#111",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.produktName}</div>
                <div style={{fontSize:11,color:"#aaa"}}>{v.grund}{v.dtfName?` + ${v.dtfName}`:""}{v.notiz?` · ${v.notiz}`:""} · {new Date(v.datum).toLocaleDateString("de-AT")}</div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontSize:14,fontWeight:800,color:"#ef4444"}}>−€{v.gesamt.toFixed(2)}</div>
                <div style={{fontSize:11,color:"#bbb"}}>{v.anzahl} Stk · €{(v.preisProStk||0).toFixed(2)}/St</div>
              </div>
              <button onClick={()=>setVerluste(vv=>vv.filter(x=>x.id!==v.id))} style={{width:28,height:28,borderRadius:"50%",border:"none",background:"#fee2e2",color:"#ef4444",cursor:"pointer",fontSize:14,fontWeight:900,flexShrink:0}}>✕</button>
            </div>
          ))}
        </div>
      )}
      {tab==="promo"&&(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <div style={{display:"flex",justifyContent:"flex-end"}}>
            <button onClick={()=>setShowAddPromo(true)} style={{padding:"8px 16px",borderRadius:9,border:"none",background:"#f97316",color:"#fff",fontSize:13,fontWeight:800,cursor:"pointer"}}>+ Promo Gift eintragen</button>
          </div>
          {promoGifts.length===0&&<div style={{textAlign:"center",padding:40,color:"#ccc",fontSize:14}}>Keine Einträge</div>}
          {promoGifts.map(g=>(
            <div key={g.id} style={{background:"#fff",borderRadius:12,padding:"12px 16px",border:"1px solid #ebebeb",display:"flex",alignItems:"center",gap:12}}>
              <div style={{fontSize:20,flexShrink:0}}>🎁</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:800,color:"#111",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{g.name}</div>
                <div style={{fontSize:11,color:"#aaa"}}>{g.info?`${g.info} · `:""}  {new Date(g.datum).toLocaleDateString("de-AT")}</div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontSize:14,fontWeight:800,color:"#f97316"}}>−€{g.gesamt.toFixed(2)}</div>
                <div style={{fontSize:11,color:"#bbb"}}>{g.anzahl} Stk · €{g.preis.toFixed(2)}/St</div>
              </div>
              <button onClick={()=>setPromoGifts(gg=>gg.filter(x=>x.id!==g.id))} style={{width:28,height:28,borderRadius:"50%",border:"none",background:"#fff7ed",color:"#f97316",cursor:"pointer",fontSize:14,fontWeight:900,flexShrink:0}}>✕</button>
            </div>
          ))}
        </div>
      )}
      {showAddFehler&&(
        <ModalWrap onClose={()=>setShowAddFehler(false)} onSave={addFehler} width={480}>
          <div style={{fontSize:16,fontWeight:800}}>🔴 Produktionsfehler eintragen</div>
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
              <button onClick={()=>setFAnzahl(a=>Math.max(1,a-1))} style={{width:32,height:32,borderRadius:8,border:"none",background:"#fee2e2",color:"#ef4444",fontSize:18,cursor:"pointer",fontWeight:800}}>−</button>
              <span style={{fontSize:20,fontWeight:900,minWidth:30,textAlign:"center"}}>{fAnzahl}</span>
              <button onClick={()=>setFAnzahl(a=>a+1)} style={{width:32,height:32,borderRadius:8,border:"none",background:"#dcfce7",color:"#16a34a",fontSize:18,cursor:"pointer",fontWeight:800}}>+</button>
            </div>
            <input style={inp} placeholder="Notiz (optional)" value={fNotiz} onChange={e=>setFNotiz(e.target.value)}/>
            {fProd&&<div style={{background:"#fef2f2",borderRadius:10,padding:"10px 14px",fontSize:13,fontWeight:700,color:"#ef4444"}}>
              Verlust: €{(calcFehlerPreis()*fAnzahl).toFixed(2)}
              <span style={{fontSize:11,fontWeight:400,color:"#aaa",marginLeft:8}}>({fAnzahl} × €{calcFehlerPreis().toFixed(2)})</span>
            </div>}
          </div>
        </ModalWrap>
      )}
      {showAddPromo&&(
        <ModalWrap onClose={()=>setShowAddPromo(false)} onSave={addPromo} width={480}>
          <div style={{fontSize:16,fontWeight:800}}>🎁 Promo Gift eintragen</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <input style={inp} placeholder="Name (z.B. @influencer)" value={pName} onChange={e=>setPName(e.target.value)}/>
            <input style={inp} placeholder="Info (z.B. Hoodie Black XL)" value={pInfo} onChange={e=>setPInfo(e.target.value)}/>
            <div style={{display:"flex",gap:10}}>
              <div style={{flex:1,position:"relative"}}>
                <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:"#aaa",fontSize:14,fontWeight:700}}>€</span>
                <input style={{...inp,paddingLeft:28}} placeholder="Preis" type="number" min="0" step="0.01" value={pPreis} onChange={e=>setPPreis(e.target.value)}/>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <button onClick={()=>setPAnzahl(a=>Math.max(1,a-1))} style={{width:32,height:32,borderRadius:8,border:"none",background:"#fff7ed",color:"#f97316",fontSize:18,cursor:"pointer",fontWeight:800}}>−</button>
                <span style={{fontSize:20,fontWeight:900,minWidth:30,textAlign:"center"}}>{pAnzahl}</span>
                <button onClick={()=>setPAnzahl(a=>a+1)} style={{width:32,height:32,borderRadius:8,border:"none",background:"#fff7ed",color:"#f97316",fontSize:18,cursor:"pointer",fontWeight:800}}>+</button>
              </div>
            </div>
            {pPreis&&<div style={{background:"#fff7ed",borderRadius:10,padding:"10px 14px",fontSize:13,fontWeight:700,color:"#f97316"}}>Gesamt: €{((parseFloat(pPreis)||0)*pAnzahl).toFixed(2)}</div>}
          </div>
        </ModalWrap>
      )}
      <div style={{background:"#111",borderRadius:14,padding:"18px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><div style={{fontSize:11,color:"#fff",fontWeight:700,letterSpacing:0.8}}>GESAMTVERLUST</div><div style={{fontSize:11,color:"#aaa",marginTop:3}}>Fehler: −€{totalFehler.toFixed(2)} · Promo: −€{totalPromo.toFixed(2)}</div></div>
        <div style={{fontSize:32,fontWeight:900,color:"#fff"}}>−€{(totalFehler+totalPromo).toFixed(2)}</div>
      </div>
    </div>
  );
}

function FinanceView({products, dtfItems=[], verluste=[], setVerluste, promoGifts=[], setPromoGifts}){
  const [open,setOpen]=useState({});
  const [finTab,setFinTab]=useState("blanks");
  const toggle=(id)=>setOpen(o=>({...o,[id]:!o[id]}));
  const grandTotal=products.reduce((a,p)=>{if(p.buyPrice==null)return a;const q=totalStock(p);return a+q*p.buyPrice;},0);
  const grandQty=products.reduce((a,p)=>a+(totalStock(p)),0);
  const dtfTotal=(dtfItems||[]).reduce((a,d)=>{
    if(!d.pricePerMeter) return a;
    return a+(d.pricePerMeter/Math.max(1,d.designsPerMeter||1))*(d.stock||0);
  },0);
  return(
    <div style={S.col10}>
      <div style={{display:"flex",gap:6,background:"#e8e8e8",borderRadius:12,padding:4}}>
        {[["blanks","🧵 Blanks"],["dtf","🖨 DTF"],["verluste","📉 Verluste"]].map(([v,lbl])=>(
          <button key={v} onClick={()=>setFinTab(v)} style={{flex:1,padding:"8px 12px",borderRadius:9,border:"none",background:finTab===v?"#fff":"transparent",color:finTab===v?"#111":"#888",cursor:"pointer",fontWeight:700,fontSize:13,boxShadow:finTab===v?"0 1px 3px rgba(0,0,0,0.08)":"none"}}>{lbl}</button>
        ))}
      </div>
      {finTab==="dtf"&&(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {(dtfItems||[]).filter(d=>d.pricePerMeter).map(d=>{
            const preisProDesign=d.pricePerMeter/Math.max(1,d.designsPerMeter||1);
            return(
              <div key={d.id} style={{background:"#fff",borderRadius:12,padding:"12px 16px",border:"1px solid #ebebeb",display:"flex",alignItems:"center",gap:12}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:800,color:"#111"}}>{d.name}</div>
                  <div style={{fontSize:11,color:"#aaa"}}>€{d.pricePerMeter?.toFixed(2)}/m · {d.designsPerMeter||1} Design/m → <strong style={{color:"#111"}}>€{preisProDesign.toFixed(2)}/Design</strong></div>
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
          <div style={{background:"#111",borderRadius:14,padding:"18px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div><div style={{fontSize:11,color:"#fff",fontWeight:700,letterSpacing:0.8}}>DTF LAGERBESTAND</div><div style={{fontSize:11,color:"#aaa",marginTop:3}}>{(dtfItems||[]).filter(d=>d.pricePerMeter).reduce((a,d)=>a+(d.stock||0),0)} Stück total</div></div>
            <div style={{fontSize:32,fontWeight:900,color:"#fff"}}>€{dtfTotal.toFixed(2)}</div>
          </div>
        </div>
      )}
      {finTab==="blanks"&&<>{products.map(p=>{
        const isCap=p.category==="Cap";
        const qty=isCap?(p.capColors||[]).reduce((a,c)=>a+c.stock,0):Object.values(p.stock||{}).reduce((a,b)=>a+b,0);
        const tot=p.buyPrice!=null?qty*p.buyPrice:null;
        const isOpen=open[p.id];
        return(
          <div key={p.id} style={{background:"#fff",borderRadius:14,border:"1px solid #ebebeb",overflow:"hidden"}}>
            <div onClick={()=>toggle(p.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"14px 16px",cursor:"pointer",userSelect:"none"}}>
              <span style={{fontSize:12,color:"#bbb"}}>{isOpen?"▾":"▸"}</span>
              <SmartDot item={p} size={20}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:700,color:"#111",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                <div style={{fontSize:11,color:"#aaa"}}>{p.color||p.category}</div>
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
                      <div style={{display:"flex",alignItems:"center",gap:5,justifyContent:"center",marginBottom:3}}><div style={{width:12,height:12,borderRadius:"50%",background:c.hex,border:"1.5px solid #444"}}/><div style={{fontSize:10,color:"#aaa",fontWeight:800}}>{c.name}</div></div>
                      <div style={{fontSize:20,fontWeight:900,color:c.stock===0?"#ef4444":c.stock<=LOW_STOCK?"#f97316":"#111"}}>{c.stock}</div>
                      {sv!=null&&<div style={{fontSize:10,color:"#bbb",marginTop:2}}>€{sv.toFixed(2)}</div>}
                    </div>
                  )})
                  :DEFAULT_SIZES.map(size=>{const s=(p.stock||{})[size]??0,sv=p.buyPrice!=null?s*p.buyPrice:null;return(
                    <div key={size} style={{background:"#fff",border:"1px solid #ebebeb",borderRadius:10,padding:"8px 10px",textAlign:"center",minWidth:60,flex:1}}>
                      <div style={{fontSize:10,color:"#aaa",fontWeight:800,marginBottom:3}}>{size}</div>
                      <div style={{fontSize:20,fontWeight:900,color:s===0?"#ef4444":s<=LOW_STOCK?"#f97316":"#111"}}>{s}</div>
                      {sv!=null&&<div style={{fontSize:10,color:"#bbb",marginTop:2}}>€{sv.toFixed(2)}</div>}
                    </div>
                  )})}
                </div>
              </div>
            )}
          </div>
        );
      })}
      <div style={{background:"#111",borderRadius:14,padding:"18px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><div style={{fontSize:11,color:"#fff",fontWeight:700,letterSpacing:0.8}}>BLANKS LAGERWERT</div><div style={{fontSize:11,color:"#aaa",marginTop:3}}>{grandQty} Stück total</div></div>
        <div style={{fontSize:32,fontWeight:900,color:"#fff"}}>€{grandTotal.toFixed(2)}</div>
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
      {/* Combined total */}
      <div style={{background:"#111",borderRadius:14,padding:"18px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:4}}>
        <div><div style={{fontSize:11,color:"#fff",fontWeight:700,letterSpacing:0.8}}>GESAMTER LAGERWERT</div><div style={{fontSize:11,color:"#aaa",marginTop:3}}>Blanks + DTF</div></div>
        <div style={{fontSize:32,fontWeight:900,color:"#fff"}}>€{(grandTotal+dtfTotal).toFixed(2)}</div>
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
          <div style={{fontSize:16,fontWeight:800}}>📦 {blank.name}</div>
          <button onClick={onClose} style={{width:32,height:32,borderRadius:"50%",border:"none",background:"#f0f0f0",color:"#666",fontSize:16,cursor:"pointer",fontWeight:900}}>✕</button>
        </div>
        <div style={{overflowY:"auto",padding:"12px 20px",display:"flex",flexDirection:"column",gap:8,flex:1}}>
          {sizes.map(s => (
            <div key={s.key} style={{display:"flex",alignItems:"center",gap:10,background:"#f8f8f8",borderRadius:10,padding:"10px 14px"}}>
              <span style={{fontSize:13,fontWeight:800,color:"#444",flex:1}}>{s.label}</span>
              <button onClick={()=>setM(s.key, mengen[s.key]-1)}
                style={{width:34,height:34,borderRadius:9,border:"none",background:"#fee2e2",color:"#ef4444",fontSize:20,cursor:"pointer",fontWeight:800,flexShrink:0}}>−</button>
              {editing===s.key
                ? <input ref={el=>refs.current[s.key]=el} type="number" value={draft}
                    onChange={e=>setDraft(e.target.value)}
                    onBlur={()=>commit(s.key)}
                    onKeyDown={e=>{if(e.key==="Enter")commit(s.key);if(e.key==="Escape")setEditing(null);}}
                    style={{width:60,textAlign:"center",fontSize:22,fontWeight:900,border:"2px solid #3b82f6",borderRadius:9,padding:"4px",outline:"none"}}/>
                : <span onDoubleClick={()=>startEdit(s.key)}
                    style={{width:60,textAlign:"center",fontSize:22,fontWeight:900,color:"#111",cursor:"pointer",userSelect:"none"}}>
                    {mengen[s.key]}
                  </span>
              }
              <button onClick={()=>setM(s.key, mengen[s.key]+1)}
                style={{width:34,height:34,borderRadius:9,border:"none",background:"#dcfce7",color:"#16a34a",fontSize:20,cursor:"pointer",fontWeight:800,flexShrink:0}}>+</button>
            </div>
          ))}
        </div>
        <div style={{padding:"12px 20px 20px",borderTop:"1px solid #f0f0f0",flexShrink:0}}>
          <div style={{fontSize:12,color:"#aaa",marginBottom:8,textAlign:"right"}}>
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
      <div style={{fontSize:17,fontWeight:800}}>{isDtf?"🖨 DTF bestellen":"📦 Bestellung aufgeben"}</div>
      <div style={{background:"#f8f8f8",borderRadius:12,padding:"14px 16px"}}>
        <div style={{fontSize:13,fontWeight:800,color:"#111"}}>{blank.name}</div>
        <div style={{fontSize:12,color:"#888",marginTop:2}}>{label}{blank.color?" · "+blank.color:""}</div>
      </div>
      <div>
        <div style={{fontSize:11,color:"#bbb",fontWeight:700,letterSpacing:0.8,marginBottom:8}}>{isMeter?"MENGE (IN METER)":"MENGE"}</div>
        <div style={{display:"flex",alignItems:"center",gap:12,justifyContent:"center"}}>
          <button type="button" onClick={()=>setMenge(m=>Math.max(1,m-1))} style={{width:40,height:40,borderRadius:10,border:"none",background:"#fee2e2",color:"#ef4444",fontSize:22,cursor:"pointer",fontWeight:800}}>−</button>
          <div style={{textAlign:"center"}}>
            <input ref={inputRef} type="number" inputMode="numeric" value={menge} onChange={e=>setMenge(Math.max(1,parseInt(e.target.value)||1))}
              style={{width:80,textAlign:"center",fontSize:28,fontWeight:900,border:"2px solid #e8e8e8",borderRadius:12,padding:"8px",outline:"none"}}/>
            {isMeter&&<div style={{fontSize:11,color:"#3b82f6",fontWeight:700,marginTop:4}}>= {stueckVorschau} Stk ins Lager</div>}
          </div>
          <button type="button" onClick={()=>setMenge(m=>m+1)} style={{width:40,height:40,borderRadius:10,border:"none",background:"#dcfce7",color:"#16a34a",fontSize:22,cursor:"pointer",fontWeight:800}}>+</button>
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
      <div style={{fontSize:17,fontWeight:800}}>✅ Wareneingang</div>
      <div style={{background:"#f0fdf4",borderRadius:12,padding:"14px 16px",borderLeft:"3px solid #16a34a"}}>
        <div style={{fontSize:13,fontWeight:800,color:"#111"}}>{bestellung.produktName}</div>
        <div style={{fontSize:12,color:"#888",marginTop:2}}>{isMeter?"DTF Transfer":bestellung.label}</div>
        <div style={{fontSize:11,color:"#16a34a",fontWeight:700,marginTop:4}}>
          Bestellt: {isMeter?`${bestellung.meterAnzahl||"?"} m (${bestellung.menge} Stk)`:`${bestellung.menge} Stk`}
        </div>
      </div>
      <div>
        <div style={{fontSize:11,color:"#bbb",fontWeight:700,letterSpacing:0.8,marginBottom:8}}>
          EINGEHENDE MENGE {isMeter?"(IN METER)":""}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12,justifyContent:"center"}}>
          <button type="button" onClick={()=>setMenge(m=>Math.max(1,m-1))} style={{width:40,height:40,borderRadius:10,border:"none",background:"#fee2e2",color:"#ef4444",fontSize:22,cursor:"pointer",fontWeight:800}}>−</button>
          <div style={{textAlign:"center"}}>
            <input type="number" inputMode="numeric" value={menge} onChange={e=>setMenge(Math.max(1,parseInt(e.target.value)||1))}
              style={{width:80,textAlign:"center",fontSize:28,fontWeight:900,border:"2px solid #e8e8e8",borderRadius:12,padding:"8px",outline:"none"}}/>
            {isMeter&&<div style={{fontSize:11,color:"#3b82f6",fontWeight:700,marginTop:4}}>= {stueckVorschau} Stk werden ins Lager gebucht</div>}
          </div>
          <button type="button" onClick={()=>setMenge(m=>m+1)} style={{width:40,height:40,borderRadius:10,border:"none",background:"#dcfce7",color:"#16a34a",fontSize:22,cursor:"pointer",fontWeight:800}}>+</button>
        </div>
      </div>
      <button onClick={()=>onConfirm(menge)} style={{width:"100%",padding:14,borderRadius:12,border:"none",background:"#16a34a",color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer"}}>
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
        {[["textilien","🧵 Textilien",offenTextilien],["dtf","🖨 DTF",offenDtf]].map(([v,lbl,count])=>(
          <button key={v} onClick={()=>setSubTab(v)} style={{flex:1,padding:"8px 12px",borderRadius:9,border:"none",background:subTab===v?"#fff":"transparent",color:subTab===v?"#111":"#888",cursor:"pointer",fontWeight:700,fontSize:13,boxShadow:subTab===v?"0 1px 3px rgba(0,0,0,0.08)":"none",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
            {lbl}{count>0&&<span style={{background:"#ef4444",color:"#fff",borderRadius:20,fontSize:10,fontWeight:800,padding:"1px 6px"}}>{count}</span>}
          </button>
        ))}
      </div>
      {offene.length === 0 && (
        <div style={{color:"#ccc",fontSize:14,padding:60,textAlign:"center"}}>
          <div style={{fontSize:40,marginBottom:12}}>{subTab==="dtf"?"🖨":"📦"}</div>
          Keine offenen Bestellungen
        </div>
      )}
      {offene.length > 0 && (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <div style={{fontSize:11,color:"#bbb",fontWeight:700,letterSpacing:0.8,padding:"0 4px"}}>OFFENE BESTELLUNGEN · {offene.length}</div>
          {offene.map(b => (
            <div key={b.id} style={{background:"#fff",borderRadius:14,padding:"14px 16px",border:"1px solid #fecaca",boxShadow:"0 1px 4px rgba(0,0,0,0.06)",display:"flex",alignItems:"center",gap:12}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:800,color:"#111"}}>{b.produktName}</div>
                <div style={{fontSize:12,color:"#888",marginTop:2}}>{b.isDtf?"DTF Transfer":b.label}</div>
                <div style={{fontSize:11,color:"#bbb",marginTop:4}}>Bestellt am {fmtDate(b.bestelltAm)}</div>
              </div>
              <div style={{textAlign:"center",marginRight:8}}>
                {b.isDtf&&b.meterAnzahl
                  ?<>
                    <div style={{fontSize:24,fontWeight:900,color:"#111",lineHeight:1}}>{b.meterAnzahl} m</div>
                    <div style={{fontSize:10,color:"#bbb",fontWeight:700}}>{b.menge} Stk</div>
                  </>
                  :<>
                    <div style={{fontSize:24,fontWeight:900,color:"#111",lineHeight:1}}>{b.menge}</div>
                    <div style={{fontSize:10,color:"#bbb",fontWeight:700}}>Stk</div>
                  </>
                }
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                <button onClick={()=>onWareneingang(b)} style={{padding:"8px 14px",borderRadius:10,border:"none",background:"#16a34a",color:"#fff",fontSize:12,fontWeight:800,cursor:"pointer",whiteSpace:"nowrap"}}>✓ Eingang</button>
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
            <div key={b.id} style={{background:"#f8f8f8",borderRadius:14,padding:"12px 16px",border:"1px solid #ebebeb",display:"flex",alignItems:"center",gap:12,opacity:0.7}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:800,color:"#555"}}>{b.produktName}</div>
                <div style={{fontSize:11,color:"#aaa",marginTop:2}}>{b.label}</div>
              </div>
              <div style={{textAlign:"center"}}>
                {b.isDtf&&b.meterAnzahl
                  ?<>
                    <div style={{fontSize:18,fontWeight:900,color:"#16a34a",lineHeight:1}}>{b.meterAnzahl} m</div>
                    <div style={{fontSize:10,color:"#bbb",fontWeight:700}}>{b.menge} Stk</div>
                  </>
                  :<>
                    <div style={{fontSize:18,fontWeight:900,color:"#16a34a",lineHeight:1}}>{b.menge}</div>
                    <div style={{fontSize:10,color:"#bbb",fontWeight:700}}>Stk</div>
                  </>
                }
              </div>
              <div style={{fontSize:10,color:"#16a34a",fontWeight:800}}>✓ Erhalten</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BestellbedarfView({prods,products,dtfItems,bestellungen,onBestellen,onDirectAdd,onBestellenDtf,currentUser}){
  const activeProds=prods.filter(p=>p.status!=="Fertig");
  const [subTab,setSubTab]=useState("textilien");
  const [openSize,setOpenSize]=useState(null);
  const [allModal,setAllModal]=useState(null);
  const [csvSelected,setCsvSelected]=useState({});
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

  return(
    <div style={S.col12}>
      {allModal&&<AllBestellungModal blank={allModal.blank} sizes={allModal.sizes} onClose={()=>setAllModal(null)} onDirectAdd={onDirectAdd}/>}
      <div style={{display:"flex",gap:6,background:"#f0f0f0",borderRadius:12,padding:4,marginBottom:8}}>
        {[["textilien","🧵 Textilien"],["dtf","🖨 DTF"]].map(([v,lbl])=>(
          <button key={v} onClick={()=>setSubTab(v)} style={{flex:1,padding:"8px 12px",borderRadius:9,border:"none",background:subTab===v?"#fff":"transparent",color:subTab===v?"#111":"#888",cursor:"pointer",fontWeight:700,fontSize:13,boxShadow:subTab===v?"0 1px 3px rgba(0,0,0,0.08)":"none"}}>{lbl}</button>
        ))}
      </div>

      {subTab==="dtf"&&(
        dtfEntries.length===0
          ? <div style={{color:"#ccc",fontSize:14,padding:60,textAlign:"center"}}>Kein DTF-Bedarf</div>
          : <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {dtfEntries.map(({dtf,needed,avail,minStock,dpm,toOrder,toOrderWithMin,toOrderM,toOrderWithMinM,unit})=>{
                const ok=toOrder===0,okWithMin=toOrderWithMin===0;
                return(
                  <div key={dtf.id} style={{background:"#fff",borderRadius:14,padding:16,border:"1px solid #ebebeb",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:32,height:32,borderRadius:8,background:"#111",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>🖨</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:14,fontWeight:800}}>{dtf.name}</div>
                        <div style={{fontSize:11,color:"#aaa",marginTop:1}}>
                          Folien: <strong style={{color:"#111"}}>{needed}</strong> · Lager: <strong style={{color:avail>=needed?"#16a34a":"#ef4444"}}>{avail}</strong>
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
                      <button type="button" onClick={()=>onBestellenDtf&&onBestellenDtf(dtf,toOrder)}
                        style={{background:ok?"#dcfce7":"#fef2f2",borderRadius:8,padding:"4px 10px",textAlign:"center",width:60,border:`1px solid ${ok?"#bbf7d0":"#fecaca"}`,cursor:"pointer",flexShrink:0}}>
                        <div style={{fontSize:9,color:ok?"#16a34a":"#ef4444",fontWeight:700}}>MIN</div>
                        <div style={{fontSize:18,fontWeight:900,color:ok?"#16a34a":"#ef4444",lineHeight:1}}>{toOrderM}{unit==="m"&&<span style={{fontSize:11}}> m</span>}</div>
                      </button>
                      {minStock>0&&<button type="button" onClick={()=>onBestellenDtf&&onBestellenDtf(dtf,toOrderWithMin)}
                        style={{background:okWithMin?"#dcfce7":"#fff7ed",borderRadius:8,padding:"4px 10px",textAlign:"center",width:60,border:`1px solid ${okWithMin?"#bbf7d0":"#fed7aa"}`,cursor:"pointer",flexShrink:0}}>
                        <div style={{fontSize:9,color:okWithMin?"#16a34a":"#f97316",fontWeight:700}}>MAX</div>
                        <div style={{fontSize:18,fontWeight:900,color:okWithMin?"#16a34a":"#f97316",lineHeight:1}}>{toOrderWithMinM}{unit==="m"&&<span style={{fontSize:11}}> m</span>}</div>
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
            ? <div style={{color:"#ccc",fontSize:14,padding:60,textAlign:"center"}}><div style={{fontSize:40,marginBottom:12}}>✅</div>Kein Bestellbedarf</div>
            : <div style={{display:"flex",justifyContent:"flex-end"}}>
                <button onClick={()=>exportStanleyStellaCsv(bedarfMap,isCapMap,products,currentUser?.name||"GKBS",csvSelected)}
                  style={{padding:"8px 16px",borderRadius:9,border:"none",background:"#111",color:"#fff",fontSize:13,fontWeight:800,cursor:"pointer",whiteSpace:"nowrap"}}>
                  ⬇ CSV Export
                </button>
              </div>
          }
          {Object.entries(bedarfMap).map(([blankId,sizeNeeds])=>{
            const blank=products.find(p=>p.id===blankId);if(!blank)return null;
            const relKeys=Object.keys(sizeNeeds).filter(k=>{
              const needed=sizeNeeds[k]||0;if(needed===0)return false;
              const isCapKey=k.startsWith("cap_");
              const capColor=isCapKey?(blank.capColors||[]).find(cc=>"cap_"+cc.id+"_"+cc.name===k):null;
              const avail=isCapKey?(capColor?.stock||0):((blank.stock||{})[k]||0);
              const minStockVal=isCapKey?0:((blank.minStock||{})[k]||0);
              return Math.max(0,needed+minStockVal-avail)>0;
            });
            if(relKeys.length===0)return null;
            const alreadyOrdered=(key)=>(bestellungen||[]).some(b=>!b.isDtf&&b.status==="offen"&&(b.blankId===blankId||b.produktId===blankId)&&b.sizeKey===key);
            const allOrdered=relKeys.every(k=>alreadyOrdered(k));
            const openKeys=relKeys.filter(k=>!alreadyOrdered(k));
            const hasStCode=!!blank.stProductId;
            const productKeys=relKeys.map(k=>blankId+"__"+k);
            const allCsvSelected=hasStCode&&productKeys.every(k=>csvSelected[k]);
            const someCsvSelected=hasStCode&&productKeys.some(k=>csvSelected[k]);
            const toggleProduct=()=>{const next=!allCsvSelected;setCsvSelected(s=>{const n={...s};productKeys.forEach(k=>{if(next)n[k]=true;else delete n[k];});return n;});};
            const toggleKey=(key)=>{const ck=blankId+"__"+key;setCsvSelected(s=>{const n={...s};if(n[ck])delete n[ck];else n[ck]=true;return n;});};
            const minSizes=openKeys.map(key=>{
              const needed=sizeNeeds[key]||0;
              const isCapKey=key.startsWith("cap_");
              const capColor=isCapKey?(blank.capColors||[]).find(cc=>"cap_"+cc.id+"_"+cc.name===key):null;
              const avail=isCapKey?(capColor?.stock||0):((blank.stock||{})[key]||0);
              const label=isCapKey?(capColor?.name||key.split("_").slice(2).join("_")):key;
              return {key,label,toOrder:Math.max(0,needed-avail)};
            }).filter(s=>s.toOrder>0);
            const maxSizes=openKeys.map(key=>{
              const needed=sizeNeeds[key]||0;
              const isCapKey=key.startsWith("cap_");
              const capColor=isCapKey?(blank.capColors||[]).find(cc=>"cap_"+cc.id+"_"+cc.name===key):null;
              const avail=isCapKey?(capColor?.stock||0):((blank.stock||{})[key]||0);
              const minStockVal=isCapKey?0:((blank.minStock||{})[key]||0);
              const label=isCapKey?(capColor?.name||key.split("_").slice(2).join("_")):key;
              return {key,label,toOrder:Math.max(0,needed+minStockVal-avail)};
            }).filter(s=>s.toOrder>0);
            return(
              <div key={blankId} style={{background:"#fff",borderRadius:14,padding:16,border:"1px solid #ebebeb",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
                <div style={S.cardHdr}>
                  <SmartDot item={blank} size={22}/>
                  <div><div style={{fontSize:14,fontWeight:800}}>{blank.name}</div><div style={{fontSize:11,color:"#aaa"}}>{blank.color} · {blank.category}</div></div>
                  {hasStCode&&<button type="button" onClick={toggleProduct}
                    style={{padding:"3px 7px",borderRadius:6,border:`1px solid ${allCsvSelected?"#111":someCsvSelected?"#888":"#ddd"}`,background:allCsvSelected?"#111":someCsvSelected?"#f0f0f0":"transparent",color:allCsvSelected?"#fff":someCsvSelected?"#444":"#bbb",fontSize:10,fontWeight:800,cursor:"pointer",flexShrink:0,letterSpacing:0.3}}>
                    CSV
                  </button>}
                  {blank.supplierUrl&&<a href={blank.supplierUrl.startsWith("http")?blank.supplierUrl:"https://"+blank.supplierUrl} target="_blank" rel="noopener noreferrer" style={{marginLeft:"auto",fontSize:12,color:"#3b82f6",fontWeight:700}}>↗ Bestellen</a>}
                  <div style={{marginLeft:"auto",display:"flex",gap:6,flexShrink:0}}>
                    <button type="button" disabled={allOrdered||minSizes.length===0}
                      style={{padding:"6px 12px",borderRadius:9,background:allOrdered?"#e0e0e0":"#fef2f2",color:allOrdered?"#bbb":"#ef4444",fontSize:12,fontWeight:800,cursor:allOrdered||minSizes.length===0?"not-allowed":"pointer",opacity:allOrdered||minSizes.length===0?0.5:1,border:"1px solid #fecaca"}}
                      onClick={()=>{if(!allOrdered&&minSizes.length>0)setAllModal({blank,sizes:minSizes});}}>
                      ALL MIN
                    </button>
                    <button type="button" disabled={allOrdered||maxSizes.length===0}
                      style={{padding:"6px 12px",borderRadius:9,background:allOrdered?"#e0e0e0":"#fff7ed",color:allOrdered?"#bbb":"#f97316",fontSize:12,fontWeight:800,cursor:allOrdered||maxSizes.length===0?"not-allowed":"pointer",opacity:allOrdered||maxSizes.length===0?0.5:1,border:"1px solid #fed7aa"}}
                      onClick={()=>{if(!allOrdered&&maxSizes.length>0)setAllModal({blank,sizes:maxSizes});}}>
                      ALL MAX
                    </button>
                  </div>
                </div>
                <div style={S.col6}>
                  {relKeys.map(key=>{
                    const needed=sizeNeeds[key]||0;
                    const isCapKey=key.startsWith("cap_");
                    const capColor=isCapKey?(blank.capColors||[]).find(cc=>"cap_"+cc.id+"_"+cc.name===key):null;
                    const avail=isCapKey?(capColor?.stock||0):((blank.stock||{})[key]||0);
                    const minStockVal=isCapKey?0:((blank.minStock||{})[key]||0);
                    const label=isCapKey?(capColor?.name||key.split("_").slice(2).join("_")):key;
                    const toOrder=Math.max(0,needed-avail),toOrderWithMin=Math.max(0,needed+minStockVal-avail);
                    const ok=toOrder===0,okWithMin=toOrderWithMin===0;
                    const ordered=alreadyOrdered(key);
                    return(
                      <div key={key} style={{background:"#fff",borderRadius:10,border:`1px solid ${ok?"#bbf7d0":"#fecaca"}`,overflow:"hidden"}}>
                        <div onClick={()=>setOpenSize(o=>o===`${blankId}-${key}`?null:`${blankId}-${key}`)}
                          style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",cursor:"pointer",userSelect:"none"}}>
                          <span style={{fontSize:12,color:"#bbb",width:12}}>{openSize===`${blankId}-${key}`?"▾":"▸"}</span>
                          {isCapKey&&capColor?<ColorDot hex={capColor.hex} size={16}/>:null}
                          <span style={isCapKey?{fontSize:13,fontWeight:800,color:"#444",minWidth:52,marginRight:4}:S.sizeTag}>{label}</span>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:11,color:"#888"}}>Bedarf: <strong style={{color:"#111"}}>{needed}</strong> · Lager: <strong style={{color:avail>=needed?"#16a34a":"#ef4444"}}>{avail}</strong></div>
                            {minStockVal>0&&<div style={{fontSize:10,color:"#bbb",marginTop:1}}>Sollbestand: {minStockVal} Stk</div>}
                          </div>
                          {hasStCode&&<button type="button" onClick={(e)=>{e.stopPropagation();toggleKey(key);}}
                            style={{padding:"2px 6px",borderRadius:5,border:`1px solid ${csvSelected[blankId+"__"+key]?"#111":"#ddd"}`,background:csvSelected[blankId+"__"+key]?"#111":"transparent",color:csvSelected[blankId+"__"+key]?"#fff":"#bbb",fontSize:9,fontWeight:800,cursor:"pointer",flexShrink:0,letterSpacing:0.3}}>
                            CSV
                          </button>}
                          <button type="button" disabled={ordered} onClick={(e)=>{e.stopPropagation();if(!ordered)onBestellen(blank,key,isCapKey,capColor,toOrder);}}
                            style={{background:ordered?"#f0f0f0":ok?"#dcfce7":"#fef2f2",borderRadius:8,padding:"4px 10px",textAlign:"center",width:56,border:`1px solid ${ordered?"#ddd":ok?"#bbf7d0":"#fecaca"}`,cursor:ordered?"not-allowed":"pointer",flexShrink:0,opacity:ordered?0.5:1}}>
                            <div style={{fontSize:9,color:ordered?"#bbb":ok?"#16a34a":"#ef4444",fontWeight:700}}>{ordered?"✓":"MIN"}</div>
                            <div style={{fontSize:ordered?10:18,fontWeight:900,color:ordered?"#bbb":ok?"#16a34a":"#ef4444",lineHeight:1}}>{ordered?"best.":toOrder}</div>
                          </button>
                          {minStockVal>0&&<button type="button" disabled={ordered} onClick={(e)=>{e.stopPropagation();if(!ordered)onBestellen(blank,key,isCapKey,capColor,toOrderWithMin);}}
                            style={{background:ordered?"#f0f0f0":okWithMin?"#dcfce7":"#fff7ed",borderRadius:8,padding:"4px 10px",textAlign:"center",width:56,border:`1px solid ${ordered?"#ddd":okWithMin?"#bbf7d0":"#fed7aa"}`,cursor:ordered?"not-allowed":"pointer",flexShrink:0,opacity:ordered?0.5:1}}>
                            <div style={{fontSize:9,color:ordered?"#bbb":okWithMin?"#16a34a":"#f97316",fontWeight:700}}>{ordered?"":"MAX"}</div>
                            <div style={{fontSize:ordered?10:18,fontWeight:900,color:ordered?"#bbb":okWithMin?"#16a34a":"#f97316",lineHeight:1}}>{ordered?"best.":toOrderWithMin}</div>
                          </button>}
                        </div>
                        {openSize===`${blankId}-${key}`&&(
                          <div style={{borderTop:"1px solid #f0f0f0",padding:"8px 14px 10px",background:"#fafafa",display:"flex",flexDirection:"column",gap:5}}>
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
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Google Sheets Setup Modal ────────────────────────────────────
function SheetsSetupModal({onClose}){
  return(
    <ModalWrap onClose={onClose} width={400}>
      <div style={{fontSize:17,fontWeight:800}}>☁️ Google Sheets</div>
      <div style={{background:"#f0fdf4",borderRadius:12,padding:"16px 20px",display:"flex",alignItems:"center",gap:12}}>
        <span style={{fontSize:28}}>✓</span>
        <div>
          <div style={{fontSize:14,fontWeight:800,color:"#16a34a"}}>Verbunden</div>
          <div style={{fontSize:12,color:"#555",marginTop:2}}>Alle Änderungen werden automatisch gespeichert.</div>
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
  {name:"Carlos", hash:"f6ccb3e8d609012238c0b39e60b2c9632b3cdede91e035dad1de43469768f4cc", avatar:"C", color:"#3b82f6"},
  {name:"Merlin", hash:"62936c7f995c57dee05ec9666e6600fa1318448bd8b6373a99e7129e2106e14b", avatar:"M", color:"#ef4444"},
  {name:"Vroni",  hash:"60c720535468526bc33eb3ace311f9cba42bbd844b068d53ff5efc5bdfc6c4fa", avatar:"V", color:"#a855f7"},
];

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
  // Also sync to Google Sheets
  sheetsLogActivity(user, action);
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
      <div style={{fontSize:17,fontWeight:800}}>📋 Activity Log</div>
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
                <div style={{fontSize:10,color:"#aaa",marginTop:2}}>{l.user} · {fmtTs(l.ts)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </ModalWrap>
  );
}

// ─── Login Screen ──────────────────────────────────────────────────
function LoginScreen({onUnlock}){
  const [selected,setSelected] = useState(null);
  const [pw,setPw] = useState("");
  const [error,setError] = useState(false);
  const [show,setShow] = useState(false);

  const check = async () => {
    const user = USERS.find(u => u.name === selected);
    if(user){
      const h = await sha256(pw);
      if(h === user.hash){
        localStorage.setItem("gkbs_user", selected);
        logActivity(selected, "Eingeloggt");
        onUnlock(selected);
        return;
      }
    }
    setError(true);
    setTimeout(()=>setError(false),1500);
  };

  return(
    <div style={{minHeight:"100vh",background:"#111",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"-apple-system,BlinkMacSystemFont,'Inter',sans-serif",padding:20}}>
      <div style={{background:"#fff",borderRadius:20,padding:"40px 32px",width:"100%",maxWidth:360,boxShadow:"0 20px 60px rgba(0,0,0,0.4)"}}>
        <div style={{fontSize:28,fontWeight:900,letterSpacing:-0.5,marginBottom:4,color:"#ef4444"}}>GKBS</div>
        <div style={{fontSize:13,color:"#bbb",fontWeight:600,marginBottom:28}}>Inventory Management</div>

        {/* Profile selection */}
        <div style={{fontSize:11,color:"#bbb",fontWeight:700,letterSpacing:0.8,marginBottom:10}}>PROFIL AUSWÄHLEN</div>
        <div style={{display:"flex",gap:10,marginBottom:24}}>
          {USERS.map(u=>(
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
                style={{width:"100%",padding:"14px 46px 14px 16px",borderRadius:12,border:`2px solid ${error?"#ef4444":"#e8e8e8"}`,fontSize:16,outline:"none",boxSizing:"border-box",background:error?"#fef2f2":"#fff",transition:"border-color 0.2s"}}
              />
              <button onClick={()=>setShow(s=>!s)} style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#bbb",fontSize:18,padding:0,lineHeight:1}}>
                {show?"🙈":"👁"}
              </button>
            </div>
            {error&&<div style={{color:"#ef4444",fontSize:13,fontWeight:600,marginBottom:8}}>Falsches Passwort</div>}
            <button onClick={check} style={{width:"100%",padding:"14px",borderRadius:12,border:"none",background:"#111",color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer"}}>
              Einloggen →
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function AppInner({currentUser,onLogout}){
  const mobile=useIsMobile();
  // ── All state ──────────────────────────────────────────────────
  const [products,__setProducts]=useState([]);
  const [prods,__setProds]=useState([]);
  const [bestellungen,__setBestellungen]=useState([]);
  const [dtfItems,__setDtfItems]=useState([]);
  const [syncStatus,setSyncStatus]=useState("idle");
  const [sheetsUrl,setSheetsUrl]=useState(SHEETS_URL);

  // ── All refs (must be before triggerSave and setters) ──────────
  const saveTimeout=useRef(null);
  const historyRef=useRef([]);
  const productsRef=useRef([]);
  const prodsRef=useRef([]);
  const categoriesRef=useRef(DEFAULT_CATEGORIES);
  const dtfItemsRef=useRef([]);
  const bestellungenRef=useRef([]);

  const log = (action) => logActivity(currentUser.name, action);

  // ── triggerSave (must be before setters that call it) ──────────
  const triggerSave=useCallback((nextProducts, nextProds, nextDtf, nextBestellungen, nextCategories)=>{
    if(!SHEETS_URL)return;
    clearTimeout(saveTimeout.current);
    setSyncStatus("saving");
    saveTimeout.current=setTimeout(()=>{
      sheetsSave(
        nextProducts||productsRef.current,
        nextProds||prodsRef.current,
        nextDtf||dtfItemsRef.current,
        nextBestellungen||bestellungenRef.current,
        nextCategories||categoriesRef.current
      )
        .then(()=>{setSyncStatus("ok");setTimeout(()=>setSyncStatus("idle"),2000);})
        .catch(()=>setSyncStatus("error"));
    },1500);
  },[]);

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

  // Load from Sheets on mount
  useEffect(()=>{
    const url=SHEETS_URL;
    if(!url)return;
    setSyncStatus("loading");
    sheetsLoad().then(data=>{
      if(data?.products){__setProducts(data.products);productsRef.current=data.products;}
      if(data?.prods){__setProds(data.prods);prodsRef.current=data.prods;}
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
      setSyncStatus(data?"ok":"error");
      setTimeout(()=>setSyncStatus("idle"),2000);
    });
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
      const exists = b.find(x=>x.blankId===blank.id&&x.sizeKey===key&&x.status==="offen");
      if(exists) return b;
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
  const [prodSubView,setProdSubView]=useState("Alle");
  const [showProdModal,setShowProdModal]=useState(false);
  const [showPAModal,setShowPAModal]=useState(false);
  const [showCats,setShowCats]=useState(false);
  const [showBestellbedarf,setShowBestellbedarf]=useState(false);
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
  const lowCount=products.filter(p=>p.category==="Cap"?(p.capColors||[]).some(c=>c.stock>0&&c.stock<=LOW_STOCK):Object.values(p.stock||{}).some(v=>v>0&&v<=LOW_STOCK)).length;
  const outCount=products.filter(p=>p.category==="Cap"?(p.capColors||[]).every(c=>c.stock===0):Object.values(p.stock||{}).every(v=>v===0)).length;
  const activeProdsArr=prods.filter(p=>p.status!=="Fertig");
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
  };




  // ─── PDF Export ───────────────────────────────────────────────

  const TABS=[["production","🏭 Produktion"],["inventory","📦 Bestand"],["dtf","🖨 DTF"],["bestellungen","🛒 Bestellte Ware"],["bestellbedarf","📋 Bestellbedarf"],["finance","💶 Finanzen"]];
  const [showActivityLog,setShowActivityLog]=useState(false);
  const [bestellModal,setBestellModal]=useState(null);
  const [verluste,setVerluste]=useState(()=>{try{const r=localStorage.getItem("gkbs_verluste");return r?JSON.parse(r):[];}catch(e){return [];}});
  const setVerlusteAndSave=(fn)=>setVerluste(prev=>{const next=typeof fn==="function"?fn(prev):fn;try{localStorage.setItem("gkbs_verluste",JSON.stringify(next));}catch(e){}return next;});
  const [promoGifts,setPromoGiftsRaw]=useState(()=>{try{const r=localStorage.getItem("gkbs_promo");return r?JSON.parse(r):[];}catch(e){return [];}});
  const setPromoGifts=(fn)=>setPromoGiftsRaw(prev=>{const next=typeof fn==="function"?fn(prev):fn;try{localStorage.setItem("gkbs_promo",JSON.stringify(next));}catch(e){}return next;});
  const [showDtfModal,setShowDtfModal]=useState(false); // false | "add" | item // {blank,key,isCapKey,capColor,toOrder}
  const [wareneingangModal,setWareneingangModal]=useState(null); // bestellung object

  return(
    <div style={{minHeight:"100vh",background:"#f4f4f4",color:"#111",fontFamily:"-apple-system,BlinkMacSystemFont,'Inter',sans-serif"}}>
      {showProdModal&&<ProductModal categories={categories} initial={showProdModal==="add"?null:showProdModal} onClose={()=>setShowProdModal(false)} onSave={p=>{if(showProdModal==="add"){setProducts(ps=>[...ps,p]);(() => {
  const SIZES=["XXS","XS","S","M","L","XL","XXL","XXXL"];
  const stockParts=SIZES.filter(s=>(p.stock||{})[s]>0).map(s=>`${s}: ${p.stock[s]}`);
  const stockStr=stockParts.length>0?` | Bestand: ${stockParts.join(", ")}`:"";
  const priceStr=p.buyPrice?` | EK: €${p.buyPrice}`:"";
  log(`Produkt angelegt – ${p.name}${stockStr}${priceStr}`);
})();}else{setProducts(ps=>ps.map(x=>x.id===p.id?p:x));(() => {
  const old=products.find(x=>x.id===p.id);
  const parts=[];
  if(old?.name!==p.name) parts.push(`Name: ${old?.name}→${p.name}`);
  if(old?.buyPrice!==p.buyPrice) parts.push(`EK: €${old?.buyPrice||0}→€${p.buyPrice||0}`);
  const SIZES=["XXS","XS","S","M","L","XL","XXL","XXXL"];
  SIZES.forEach(s=>{const ov=(old?.stock||{})[s]||0,nv=(p.stock||{})[s]||0;if(ov!==nv)parts.push(`${s}: ${ov}→${nv}`);});
  log(parts.length>0?`Produkt bearbeitet – ${p.name} | ${parts.join(", ")}`:`Produkt gespeichert – ${p.name}`);
})();}setShowProdModal(false);}}/>}
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
      {showCats&&<CategoryModal categories={categories} onClose={()=>setShowCats(false)} onSave={cats=>{setCategories(cats);setShowCats(false);}}/>}
      {confirmDelete&&<DeleteConfirmModal name={confirmDelete.name} onConfirm={()=>{confirmDelete.onConfirm();setConfirmDelete(null);}} onCancel={()=>setConfirmDelete(null)}/>}
      {confirmProduce&&<ConfirmProduceModal prod={confirmProduce} blank={products.find(p=>p.id===confirmProduce.blankId)} onConfirm={handleProduceConfirm} onCancel={()=>setConfirmProduce(null)}/>}
      {showSheetsSetup&&<SheetsSetupModal onClose={()=>setShowSheetsSetup(false)}/>}
      {showBestellbedarf&&<BestellbedarfModal prods={prods} products={products} onClose={()=>setShowBestellbedarf(false)}/>}
    {showActivityLog&&<ActivityLogModal onClose={()=>setShowActivityLog(false)}/>}
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
        <div style={{maxWidth:1300,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{display:"flex",alignItems:"baseline",gap:6}}><div style={{fontSize:mobile?18:22,fontWeight:900,letterSpacing:-0.5,color:"#ef4444"}}>GKBS</div><div style={{fontSize:10,fontWeight:700,color:"#bbb",letterSpacing:0.5}}>{APP_VERSION}</div></div>
              <button onClick={onLogout} title={`Ausloggen (${currentUser.name})`} style={{width:30,height:30,borderRadius:"50%",background:currentUser.color,border:"none",color:"#fff",fontSize:12,fontWeight:900,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                {currentUser.avatar}
              </button>
            </div>
            {!mobile&&<div style={{fontSize:12,color:"#bbb",fontWeight:600,display:"flex",alignItems:"center",gap:6}}>
              Inventory Management
              {syncStatus==="loading"&&<span style={{color:"#f97316"}}>⟳ Laden...</span>}
              {syncStatus==="saving"&&<span style={{color:"#f97316"}}>⟳ Speichern...</span>}
              {syncStatus==="ok"&&<span style={{color:"#16a34a"}}>✓ Gespeichert</span>}
              {syncStatus==="error"&&<span style={{color:"#ef4444"}}>⚠ Sync Fehler</span>}
              {!sheetsUrl&&<span style={{color:"#bbb",cursor:"pointer",textDecoration:"underline"}} onClick={()=>setShowSheetsSetup(true)}>Google Sheets einrichten →</span>}
            </div>}
          </div>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            {/* Sheets */}
            <button onClick={()=>setShowSheetsSetup(true)} style={{padding:mobile?"8px 10px":"9px 12px",borderRadius:9,border:"1px solid #e8e8e8",background:sheetsUrl?"#f0fdf4":"#fff",color:sheetsUrl?"#16a34a":"#555",cursor:"pointer",fontWeight:700,fontSize:mobile?12:13}}>
              ☁️{!mobile&&(sheetsUrl?" Verbunden":" Sheets")}
            </button>
            {/* Undo */}
            <button onClick={undo} disabled={!canUndo} title="Rückgängig"
              style={{padding:mobile?"8px 10px":"9px 12px",borderRadius:9,border:"1px solid #e8e8e8",background:canUndo?"#fff":"#f5f5f5",color:canUndo?"#333":"#ccc",cursor:canUndo?"pointer":"not-allowed",fontWeight:700,fontSize:mobile?12:13,display:"flex",alignItems:"center",gap:4}}>
              ↩{!mobile&&` Undo`}{canUndo&&<span style={{fontSize:10,color:"#bbb",fontWeight:500}}>({historyRef.current.length})</span>}
            </button>
{view==="inventory"&&<>
              <button onClick={()=>setShowActivityLog(true)} title="Activity Log" style={{padding:"8px 10px",borderRadius:9,border:"1px solid #e8e8e8",background:"#fff",color:"#555",cursor:"pointer",fontWeight:700,fontSize:16}}>🕓</button>
              <button onClick={()=>setShowCats(true)} style={{padding:mobile?"8px 10px":"9px 13px",borderRadius:9,border:"1px solid #e8e8e8",background:"#fff",color:"#555",cursor:"pointer",fontWeight:700,fontSize:mobile?12:13}}>🗂{!mobile&&" Kategorien"}</button>
              <button onClick={()=>setShowProdModal("add")} style={{padding:mobile?"8px 14px":"9px 16px",borderRadius:9,border:"none",background:"#16a34a",color:"#fff",cursor:"pointer",fontWeight:800,fontSize:mobile?13:14}}>+ {mobile?"":"Produkt"}</button>
            </>}
            {view==="production"&&<>
              <button onClick={()=>setShowActivityLog(true)} title="Activity Log" style={{padding:"8px 10px",borderRadius:9,border:"1px solid #e8e8e8",background:"#fff",color:"#555",cursor:"pointer",fontWeight:700,fontSize:16}}>🕓</button>
              <button onClick={()=>setShowPAModal("add")} style={{padding:mobile?"8px 14px":"9px 16px",borderRadius:9,border:"none",background:"#16a34a",color:"#fff",cursor:"pointer",fontWeight:800,fontSize:mobile?13:14}}>+ {mobile?"":"Auftrag"}</button>
            </>}
            {view==="bestellbedarf"&&<>
              <button onClick={()=>setShowActivityLog(true)} title="Activity Log" style={{padding:"8px 10px",borderRadius:9,border:"1px solid #e8e8e8",background:"#fff",color:"#555",cursor:"pointer",fontWeight:700,fontSize:16}}>🕓</button>
            </>}
            {view==="finance"&&<>
              <button onClick={()=>setShowActivityLog(true)} title="Activity Log" style={{padding:"8px 10px",borderRadius:9,border:"1px solid #e8e8e8",background:"#fff",color:"#555",cursor:"pointer",fontWeight:700,fontSize:16}}>🕓</button>
            </>}
            {view==="dtf"&&<>
              <button onClick={()=>setShowActivityLog(true)} title="Activity Log" style={{padding:"8px 10px",borderRadius:9,border:"1px solid #e8e8e8",background:"#fff",color:"#555",cursor:"pointer",fontWeight:700,fontSize:16}}>🕓</button>
              <button onClick={()=>setShowDtfModal("add")} style={{padding:mobile?"8px 14px":"9px 16px",borderRadius:9,border:"none",background:"#16a34a",color:"#fff",cursor:"pointer",fontWeight:800,fontSize:mobile?13:14}}>+ {mobile?"":"DTF"}</button>
            </>}
          </div>
        </div>
        </div>
        {/* Tab bar – desktop only, mobile uses bottom bar */}
        {!mobile&&<div style={{overflowX:"auto",padding:"4px 24px 12px",marginTop:4}}>
          <div style={{display:"flex",gap:3,background:"#e8e8e8",borderRadius:11,padding:3,width:"fit-content"}}>
            {TABS.map(([v,lbl])=>(
              <button key={v} onClick={()=>setView(v)}
                style={{padding:mobile?"8px 14px":"8px 18px",borderRadius:9,border:"none",background:view===v?"#fff":"transparent",color:view===v?"#111":"#888",cursor:"pointer",fontWeight:700,fontSize:mobile?12:13,boxShadow:view===v?"0 1px 3px rgba(0,0,0,0.08)":"none",display:"flex",alignItems:"center",gap:5,whiteSpace:"nowrap"}}>
                {mobile?lbl.split(" ")[0]:lbl}
                {v==="production"&&activeProdsArr.length>0&&<span style={{background:"#ef4444",color:"#fff",borderRadius:20,padding:"1px 6px",fontSize:10,fontWeight:800}}>{activeProdsArr.length}</span>}
                {v==="bestellungen"&&bestellungen.filter(b=>b.status==="offen").length>0&&<span style={{background:"#f97316",color:"#fff",borderRadius:20,padding:"1px 5px",fontSize:9,fontWeight:800}}>{bestellungen.filter(b=>b.status==="offen").length}</span>}
              </button>
            ))}
          </div>
        </div>}
      </div>

      <div style={{padding:mobile?"12px 12px 100px":"20px 24px",maxWidth:1300,margin:"0 auto"}}>


        {/* Finance */}
        {view==="finance"&&<FinanceView products={products} dtfItems={dtfItems} verluste={verluste} setVerluste={setVerlusteAndSave} promoGifts={promoGifts} setPromoGifts={setPromoGifts}/>}
        {view==="dtf"&&<DtfView dtfItems={dtfItems} prods={prods}
          onUpdate={u=>{setDtfItems(d=>d.map(x=>x.id===u.id?u:x));log(`DTF Bestand geändert: ${u.name} → ${u.stock} Stk`);}}
          onDelete={id=>{const item=dtfItems.find(x=>x.id===id);setDtfItems(d=>d.filter(x=>x.id!==id));if(item)log(`DTF gelöscht: ${item.name}`);}}
          onEdit={item=>setShowDtfModal(item)}
          onAdd={()=>setShowDtfModal("add")}/>}
        {view==="bestellungen"&&<BestellteWareView bestellungen={bestellungen} onWareneingang={(b)=>setWareneingangModal(b)} onDelete={(id)=>{setBestellungen(b=>b.filter(x=>x.id!==id));log("Bestellung entfernt");}}/>}

        {/* Bestellbedarf as tab */}
        {view==="bestellbedarf"&&<BestellbedarfView prods={prods} products={products} dtfItems={dtfItems} bestellungen={bestellungen} currentUser={currentUser} onBestellen={handleBestellen} onDirectAdd={handleDirectAdd} onBestellenDtf={(dtf,menge)=>{
  const dpm=dtf.designsPerMeter||1;
  const meter=dpm>1?Math.ceil(menge/dpm):null;
  setBestellModal({blank:{...dtf,supplierUrl:"",category:"DTF"},key:"DTF",isCapKey:false,capColor:null,toOrder:menge,isDtf:true,dtfId:dtf.id,dtfName:dtf.name,designsPerMeter:dpm,meterAnzahl:meter});
}}/>}

        {/* Production */}
        {view==="production"&&(
          <div style={S.col12}>
            {/* Filters – scrollable on mobile */}
            <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:4}}>
              <div style={{display:"flex",gap:2,background:"#e8e8e8",borderRadius:9,padding:3,flexShrink:0}}>
                {[["Alle","Alle"],["Drucken","🖨"],["Sticken","🪡"]].map(([v,lbl])=>(
                  <button key={v} onClick={()=>setProdSubView(v)} style={{padding:"6px 12px",borderRadius:7,border:"none",background:prodSubView===v?"#fff":"transparent",color:prodSubView===v?"#111":"#888",cursor:"pointer",fontWeight:700,fontSize:12,whiteSpace:"nowrap"}}>{lbl}</button>
                ))}
              </div>
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
                <span>{showArchive?"▾":"▸"}</span><span>📁 Archiv</span>
                <span style={{background:"#e8e8e8",color:"#666",borderRadius:20,padding:"2px 9px",fontSize:11,fontWeight:800,marginLeft:"auto"}}>{archivedProdsArr.length}</span>
              </button>
              {showArchive&&(
                <div style={{display:"flex",flexDirection:"column",gap:6,marginTop:8}}>
                  {archivedProdsArr.length===0&&<div style={{color:"#ccc",fontSize:13,textAlign:"center",padding:24}}>Noch keine abgeschlossenen Aufträge</div>}
                  {archivedProdsArr.map(prod=><ArchivedCard key={prod.id} prod={prod} blank={products.find(p=>p.id===prod.blankId)} onDelete={()=>setConfirmDelete({name:prod.name,onConfirm:()=>setProds(ps=>ps.filter(x=>x.id!==prod.id))})}/>)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Inventory */}
        {view==="inventory"&&(
          <>
            {/* Search + filters – scrollable */}
            <div style={{display:"flex",gap:8,marginBottom:14,overflowX:"auto",paddingBottom:4,alignItems:"center"}}>
              <input placeholder="🔍 Suchen..." value={search} onChange={e=>setSearch(e.target.value)}
                style={{background:"#fff",border:"1px solid #e8e8e8",borderRadius:10,color:"#111",padding:"9px 13px",fontSize:16,outline:"none",width:mobile?120:160,flexShrink:0}}/>
              {["All",...categories].map(c=><button key={c} onClick={()=>setCatFilter(c)} style={{padding:"8px 12px",borderRadius:9,border:"1px solid",borderColor:catFilter===c?"#111":"#e8e8e8",background:catFilter===c?"#111":"#fff",color:catFilter===c?"#fff":"#666",cursor:"pointer",fontWeight:700,fontSize:12,flexShrink:0,whiteSpace:"nowrap"}}>{c}</button>)}
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
          </>
        )}
      </div>

      {/* Mobile bottom tab bar */}
      {mobile&&(
        <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#fff",borderTop:"1px solid #ebebeb",display:"flex",padding:"8px 0 20px",zIndex:50}}>
          {TABS.map(([v,lbl])=>(
            <button key={v} onClick={()=>setView(v)} style={{flex:1,border:"none",background:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"6px 0",color:view===v?"#111":"#bbb"}}>
              <span style={{fontSize:20}}>{lbl.split(" ")[0]}</span>
              <span style={{fontSize:10,fontWeight:700}}>{lbl.split(" ").slice(1).join(" ")}</span>
              {v==="production"&&activeProdsArr.length>0&&<span style={{position:"absolute",top:6,background:"#ef4444",color:"#fff",borderRadius:20,padding:"1px 5px",fontSize:9,fontWeight:800}}>{activeProdsArr.length}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App(){
  const [user,setUser] = useState(()=>localStorage.getItem("gkbs_user"));
  const validUser = USERS.find(u=>u.name===user);
  if(!validUser) return <LoginScreen onUnlock={(name)=>setUser(name)}/>;
  return <AppInner currentUser={validUser} onLogout={()=>{localStorage.removeItem("gkbs_user");setUser(null);}}/>;
}
