import { useState, useRef, useCallback, useEffect } from "react";
const MAX_HISTORY = 50;
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
// Trage hier deine Apps Script URL ein nach dem Setup:
const SHEETS_URL = typeof window !== "undefined" 
  ? (localStorage.getItem("gkbs_sheets_url") || "")
  : "";

async function sheetsLoad() {
  const url = localStorage.getItem("gkbs_sheets_url");
  if (!url) return null;
  try {
    const r = await fetch(url + "?action=load");
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

async function sheetsSave(products, prods) {
  const url = localStorage.getItem("gkbs_sheets_url");
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      body: JSON.stringify({ action: "save", products, prods }),
    });
  } catch(e) { console.warn("Sheets sync failed:", e); }
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
function StockCell({size,value,minVal,onInc,onDec,mobile}){
  const isOut=value===0,isLow=!isOut&&value<=LOW_STOCK,belowMin=minVal>0&&value<minVal;
  if(mobile){
    return(
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"#f8f8f8",borderRadius:10,padding:"10px 12px",position:"relative"}}>
        <span style={{fontSize:14,color:"#555",fontWeight:800,width:36}}>{size}</span>
        <span style={{fontSize:28,fontWeight:900,color:sCol(value),lineHeight:1,flex:1,textAlign:"center"}}>
          {value}
          {minVal>0&&<span style={{fontSize:10,color:belowMin?"#ef4444":"#bbb",fontWeight:700,marginLeft:3}}>/{minVal}</span>}
        </span>
        <div style={{display:"flex",gap:6}}>
          <button onClick={onDec} style={btn(36,true)}>−</button>
          <button onClick={onInc} style={btn(36)}>+</button>
        </div>
      </div>
    );
  }
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,background:"#f8f8f8",borderRadius:12,padding:"10px 4px",flex:1,minWidth:0,position:"relative"}}>
      <span style={{fontSize:14,color:"#666",fontWeight:900}}>{size}</span>
      <span style={{fontSize:32,fontWeight:900,color:sCol(value),lineHeight:1}}>{value}</span>
      {minVal>0&&<span style={{position:"absolute",top:5,right:5,fontSize:9,color:belowMin?"#ef4444":"#bbb",fontWeight:700}}>/{minVal}</span>}
      <div style={{display:"flex",gap:4}}>
        <button onClick={onDec} style={btn(28,true)}>−</button>
        <button onClick={onInc} style={btn(28)}>+</button>
      </div>
    </div>
  );
}



// ─── PieDot – pie chart circle for any capColors array ──────────
function PieDot({capColors,fallbackHex="#888",size=28,valueKey="stock"}){
  const allColors=(capColors||[]);
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
function ProdCell({size,soll,done,avail,onInc,onDec,disabled,mobile}){
  const complete=soll>0&&done>=soll;
  const atLimit=disabled&&!complete;
  const color=complete?GR:atLimit?OR:"#111";
  if(mobile){
    return(
      <div style={{display:"flex",alignItems:"center",background:complete?"#f0fdf4":atLimit?"#fff7ed":"#f8f8f8",borderRadius:10,padding:"10px 12px",border:`1px solid ${complete?"#bbf7d0":atLimit?"#fed7aa":"#f0f0f0"}`}}>
        <span style={{fontSize:14,color:"#555",fontWeight:800,width:36}}>{size}</span>
        <span style={{flex:1,textAlign:"center",lineHeight:1}}>
          <span style={{fontSize:28,fontWeight:900,color}}>{done}</span>
          <span style={{fontSize:20,color:"#bbb",fontWeight:700}}>/{soll}</span>
        </span>
        <span style={{fontSize:11,color:sCol(avail),fontWeight:700,marginRight:8}}>↓{avail}</span>
        <div style={{display:"flex",gap:6}}>
          <button onClick={onDec} style={btn(36,true)}>−</button>
          <button onClick={onInc} disabled={disabled} style={btn(36,false,disabled)}>+</button>
        </div>
      </div>
    );
  }
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,background:complete?"#f0fdf4":atLimit?"#fff7ed":"#f8f8f8",borderRadius:12,padding:"10px 4px",flex:1,minWidth:0,position:"relative",border:`1px solid ${complete?"#bbf7d0":atLimit?"#fed7aa":"transparent"}`}}>
      <span style={{fontSize:14,color:"#666",fontWeight:900}}>{size}</span>
      <span style={{position:"absolute",top:5,right:6,fontSize:9,color:sCol(avail),fontWeight:700}}>{avail}</span>
      <div style={{textAlign:"center",lineHeight:1}}>
        <span style={{fontSize:28,fontWeight:900,color}}>{done}</span>
        <span style={{fontSize:18,color:"#bbb",fontWeight:700}}>/{soll}</span>
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
              <div key={c.id} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5,background:"#f8f8f8",borderRadius:12,padding:"10px 8px",flex:1,minWidth:mobile?60:70}}>
                <div style={{width:20,height:20,borderRadius:"50%",background:c.hex,border:"2px solid #444"}}/>
                <span style={{fontSize:10,color:"#555",fontWeight:800,textAlign:"center",lineHeight:1.2}}>{c.name}</span>
                <span style={{fontSize:mobile?24:28,fontWeight:900,color:sCol(c.stock),lineHeight:1}}>{c.stock}</span>
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
          {DEFAULT_SIZES.map(size=><StockCell key={size} mobile size={size} value={(product.stock??{})[size]??0} minVal={(product.minStock??{})[size]??0} onInc={()=>adj(size,1)} onDec={()=>adj(size,-1)}/>)}
        </div>
      ):(
        // Desktop: horizontal grid
        <div style={{display:"flex",gap:4}}>
          {DEFAULT_SIZES.map(size=><StockCell key={size} size={size} value={(product.stock??{})[size]??0} minVal={(product.minStock??{})[size]??0} onInc={()=>adj(size,1)} onDec={()=>adj(size,-1)}/>)}
        </div>
      )}
      {/* Mobile reorder link */}

    </div>
  );
}

// ─── Production Card ──────────────────────────────────────────────
function ProductionCard({prod,blank,onDelete,onEdit,onUpdate,onConfirmProduce}){
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
  const fColor={"ok":"#16a34a","partial":"#f97316","none":"#ef4444","unknown":"#bbb"}[feasibility];
  const fLabel={"ok":"✅ Blanks ok","partial":"⚠ Teilweise","none":"❌ Nicht genug","unknown":"— Kein Blank"}[feasibility];

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
          {(prod.capColors||[]).map(c=>{
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
                  <span style={{fontSize:mobile?24:28,fontWeight:900,color:complete?"#16a34a":atLimit?"#f97316":"#111"}}>{c.done}</span>
                  <span style={{fontSize:mobile?16:18,color:"#bbb",fontWeight:700}}>/{c.qty}</span>
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
              disabled={lim} onDec={()=>adjDone(size,-1)} onInc={()=>adjDone(size,1)}/>;
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
              disabled={lim} onDec={()=>adjDone(size,-1)} onInc={()=>adjDone(size,1)}/>;
          })}
        </div>
      )}

      {/* ── Actions ── */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap",paddingTop:4,borderTop:"1px solid #f0f0f0"}}>
        <span style={{fontSize:11,fontWeight:700,color:fColor}}>{fLabel}</span>
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
function ModalWrap({onClose,children,width=600}){
  const mobile=useIsMobile();
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",display:"flex",alignItems:mobile?"flex-end":"center",justifyContent:"center",zIndex:100}} onClick={onClose}>
      <div style={{background:"#fff",borderRadius:mobile?"20px 20px 0 0":18,padding:mobile?"20px 16px 32px":"26px",width:mobile?"100%":width,maxWidth:"100vw",maxHeight:mobile?"92vh":"90vh",overflowY:"auto",boxShadow:"0 8px 40px rgba(0,0,0,0.14)",display:"flex",flexDirection:"column",gap:14}} onClick={e=>e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function ProductionModal({products,initial,onClose,onSave}){
  const editing=!!initial;
  const [modalLightbox,setModalLightbox]=useState(null);
  const [name,setName]=useState(initial?.name||"");
  const [blankId,setBlankId]=useState(initial?.blankId||products[0]?.id||"");
  const [notes,setNotes]=useState(initial?.notes||"");
  const [priority,setPriority]=useState(initial?.priority||"Mittel");
  const [veredelung,setVeredelung]=useState(initial?.veredelung||["Drucken"]);
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
  const inp={background:"#f8f8f8",border:"1px solid #e8e8e8",borderRadius:10,color:"#111",padding:"11px 14px",fontSize:14,width:"100%",outline:"none",boxSizing:"border-box"};
  const toggleV=(v)=>setVeredelung(vs=>vs.includes(v)?vs.filter(x=>x!==v):[...vs,v]);
  const handlePhotos=(e)=>{const files=Array.from(e.target.files);const rem=5-photos.length;files.slice(0,rem).forEach(f=>{const r=new FileReader();r.onload=ev=>setPhotos(ps=>[...ps,ev.target.result]);r.readAsDataURL(f);});};
  return(
    <ModalWrap onClose={onClose} width={640}>
      <div style={{fontSize:17,fontWeight:800,color:"#111"}}>{editing?"Auftrag bearbeiten":"Neuer Produktionsauftrag"}</div>
      <input style={inp} placeholder="Name" value={name} onChange={e=>setName(e.target.value)} autoFocus/>
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
        <div style={S.col6}>
          {products.map(p=><label key={p.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:11,border:`1px solid ${blankId===p.id?"#111":"#e8e8e8"}`,background:blankId===p.id?"#f8f8f8":"#fff",cursor:"pointer"}}>
            <input type="radio" name="blank" checked={blankId===p.id} onChange={()=>{
              setBlankId(p.id);
              if(p.category==="Cap") setCapColors(getCapColorsFromBlank(p, capColors));
            }} style={{accentColor:"#111"}}/>
            <SmartDot item={p} size={20}/>
            <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700}}>{p.name}</div><div style={{fontSize:11,color:"#aaa"}}>{p.color||""} · {p.category}</div></div>
          </label>)}
        </div>
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
            {DEFAULT_SIZES.map(size=>{const avail=(blank?.stock||{})[size]??0,over=(qty[size]||0)>avail;return(
              <div key={size} style={{display:"flex",alignItems:"center",gap:10,background:over?"#fef2f2":"#f8f8f8",borderRadius:10,padding:"8px 12px",border:`1px solid ${over?"#fecaca":"transparent"}`}}>
                <span style={S.sizeTag}>{size}</span>
                <span style={{fontSize:11,color:"#aaa",flex:1}}>Lager: {avail}</span>
                <button type="button" onClick={()=>setQty(q=>({...q,[size]:Math.max(0,(q[size]||0)-1)}))} style={{width:32,height:32,borderRadius:8,border:"none",background:"#fee2e2",color:"#ef4444",fontSize:18,cursor:"pointer",fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
                <span style={{fontSize:20,fontWeight:900,color:over?"#ef4444":"#111",width:30,textAlign:"center"}}>{qty[size]||0}</span>
                <button type="button" onClick={()=>setQty(q=>({...q,[size]:(q[size]||0)+1}))} style={{width:32,height:32,borderRadius:8,border:"none",background:"#dcfce7",color:"#16a34a",fontSize:18,cursor:"pointer",fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
              </div>
            );})}
          </div>
        </div>
      )}
      <div style={{display:"flex",gap:10,marginTop:4}}>
        <button type="button" onClick={onClose} style={{flex:1,padding:13,borderRadius:10,border:"1px solid #e8e8e8",background:"none",color:"#888",cursor:"pointer",fontWeight:700,fontSize:14}}>Abbrechen</button>
        <button type="button" onClick={()=>{if(!name.trim()||!blankId||veredelung.length===0)return;onSave({id:initial?.id||Date.now().toString(),name:name.trim(),blankId,notes,priority,status:initial?.status||"Geplant",veredelung,designUrl,colorHex:blank?.colorHex||"#000000",photos,isCapOrder:isCap,qty,done,capColors});}}
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
  const [stock,setStock]=useState(initial?.stock||mkQty());
  const [minStock,setMinStock]=useState(initial?.minStock||mkQty());
  const [capColors,setCapColors]=useState(initial?.capColors||[{id:mkId(),name:"Black",hex:"#111111",stock:0}]);
  const isCap=category==="Cap";
  const inp={background:"#f8f8f8",border:"1px solid #e8e8e8",borderRadius:10,color:"#111",padding:"11px 14px",fontSize:14,width:"100%",outline:"none",boxSizing:"border-box"};
  return(
    <ModalWrap onClose={onClose} width={620}>
      <div style={{fontSize:17,fontWeight:800,color:"#111"}}>{editing?"Produkt bearbeiten":"Neues Produkt"}</div>
      <input style={inp} placeholder="Produktname" value={name} onChange={e=>setName(e.target.value)} autoFocus/>
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
                <div key={size} style={{display:"flex",alignItems:"center",gap:10,background:"#f8f8f8",borderRadius:10,padding:"8px 12px"}}>
                  <span style={S.sizeTag}>{size}</span>
                  <div style={{flex:1}}/>
                  <button type="button" onClick={()=>setStock(s=>({...s,[size]:Math.max(0,(s[size]||0)-1)}))} style={{width:32,height:32,borderRadius:8,border:"none",background:"#fee2e2",color:"#ef4444",fontSize:18,cursor:"pointer",fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
                  <span style={{fontSize:20,fontWeight:900,color:"#111",width:32,textAlign:"center"}}>{stock[size]||0}</span>
                  <button type="button" onClick={()=>setStock(s=>({...s,[size]:(s[size]||0)+1}))} style={{width:32,height:32,borderRadius:8,border:"none",background:"#dcfce7",color:"#16a34a",fontSize:18,cursor:"pointer",fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
                </div>
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
        <button type="button" onClick={()=>{if(!name.trim())return;onSave({id:initial?.id||Date.now().toString(),name:name.trim(),category,color,colorHex,buyPrice:parseFloat(buyPrice)||null,supplierUrl:supplierUrl.trim(),stock,minStock,capColors});}}
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

function BestellbedarfModal({prods,products,onClose,onExport}){
  const activeProds=prods.filter(p=>p.status!=="Fertig"&&!p.isCapOrder);
  const [openSize,setOpenSize]=useState(null); // "blankId-size"
  const bedarfMap={};
  // Also store per-blank per-size breakdown: which prods contribute
  const breakdownMap={}; // {blankId: {size: [{prodName, qty}]}}
  activeProds.forEach(prod=>{
    if(!bedarfMap[prod.blankId])bedarfMap[prod.blankId]={};
    if(!breakdownMap[prod.blankId])breakdownMap[prod.blankId]={};
    DEFAULT_SIZES.forEach(s=>{
      const q=(prod.qty||{})[s]||0;
      bedarfMap[prod.blankId][s]=(bedarfMap[prod.blankId][s]||0)+q;
      if(q>0){
        if(!breakdownMap[prod.blankId][s])breakdownMap[prod.blankId][s]=[];
        breakdownMap[prod.blankId][s].push({name:prod.name,qty:q,colorHex:prod.colorHex});
      }
    });
  });
  return(
    <ModalWrap onClose={onClose} width={660}>
      <div style={{fontSize:17,fontWeight:800,color:"#111"}}>Bestellbedarf</div>
      {Object.keys(bedarfMap).length===0&&<div style={{color:"#bbb",fontSize:14,textAlign:"center",padding:40}}>Keine aktiven Aufträge</div>}
      {Object.entries(bedarfMap).map(([blankId,sizeNeeds])=>{
        const blank=products.find(p=>p.id===blankId);if(!blank)return null;
        const relSizes=DEFAULT_SIZES.filter(s=>(sizeNeeds[s]||0)>0);
        return(
          <div key={blankId} style={{background:"#f8f8f8",borderRadius:14,padding:16}}>
            <div style={S.cardHdr}>
              <SmartDot item={blank} size={22}/>
              <div><div style={{fontSize:14,fontWeight:800}}>{blank.name}</div><div style={{fontSize:11,color:"#aaa"}}>{blank.color} · {blank.category}</div></div>
              {blank.supplierUrl&&<a href={blank.supplierUrl.startsWith("http")?blank.supplierUrl:"https://"+blank.supplierUrl} target="_blank" rel="noopener noreferrer" style={{marginLeft:"auto",fontSize:12,color:"#3b82f6",fontWeight:700}}>↗ Bestellen</a>}
            </div>
            <div style={S.col6}>
              {relSizes.map(size=>{
                const needed=sizeNeeds[size]||0;
                const avail=(blank.stock||{})[size]||0;
                const minStock=(blank.minStock||{})[size]||0;
                const toOrder=Math.max(0,needed-avail);
                const toOrderWithMin=Math.max(0,needed+minStock-avail);
                const ok=toOrder===0;
                const okWithMin=toOrderWithMin===0;
                return(
                <div key={size} style={{background:"#fff",borderRadius:10,border:`1px solid ${ok?"#bbf7d0":"#fecaca"}`,overflow:"hidden"}}>
                  {/* Main row – clickable */}
                  <div onClick={()=>setOpenSize(o=>o===`${blankId}-${size}`?null:`${blankId}-${size}`)}
                    style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",cursor:"pointer",userSelect:"none"}}>
                    <span style={{fontSize:12,color:"#bbb",width:12}}>{openSize===`${blankId}-${size}`?"▾":"▸"}</span>
                    <span style={S.sizeTag}>{size}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:11,color:"#888"}}>Produktion: <strong style={{color:"#111"}}>{needed}</strong> · Lager: <strong style={{color:avail>=needed?"#16a34a":"#ef4444"}}>{avail}</strong></div>
                      {minStock>0&&<div style={{fontSize:10,color:"#bbb",marginTop:1}}>Sollbestand: {minStock} Stk</div>}
                    </div>
                    <div style={S.pill(ok)}>
                      <div style={S.pillLbl(ok)}>PRODUKTION</div>
                      <div style={S.pillNum(ok)}>{toOrder}</div>
                    </div>
                    {minStock>0&&<div style={{background:okWithMin?"#dcfce7":"#fff7ed",borderRadius:8,padding:"4px 10px",textAlign:"center",minWidth:52,border:`1px solid ${okWithMin?"#bbf7d0":"#fed7aa"}`}}>
                      <div style={{fontSize:9,color:okWithMin?"#16a34a":"#f97316",fontWeight:700}}>+ SOLL</div>
                      <div style={{fontSize:18,fontWeight:900,color:okWithMin?"#16a34a":"#f97316",lineHeight:1}}>{toOrderWithMin}</div>
                    </div>}
                  </div>
                  {/* Breakdown dropdown */}
                  {openSize===`${blankId}-${size}`&&(
                    <div style={{borderTop:"1px solid #f0f0f0",padding:"8px 14px 10px 14px",background:"#fafafa",display:"flex",flexDirection:"column",gap:5}}>
                      <div style={{fontSize:10,color:"#bbb",fontWeight:700,letterSpacing:0.6,marginBottom:2}}>AUFTRÄGE</div>
                      {(breakdownMap[blankId]?.[size]||[]).map((item,i)=>(
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
        <button type="button" onClick={onExport} style={{flex:1,padding:13,borderRadius:10,border:"none",background:"#111",color:"#fff",cursor:"pointer",fontWeight:800,fontSize:14}}>🖨 Als PDF exportieren</button>
        <button type="button" onClick={onClose} style={{flex:1,padding:13,borderRadius:10,border:"1px solid #e8e8e8",background:"none",color:"#888",cursor:"pointer",fontWeight:700,fontSize:14}}>Schließen</button>
      </div>
    </ModalWrap>
  );
}

function FinanceView({products}){
  const [open,setOpen]=useState({});
  const toggle=(id)=>setOpen(o=>({...o,[id]:!o[id]}));
  const grandTotal=products.reduce((a,p)=>{if(p.buyPrice==null)return a;const q=totalStock(p);return a+q*p.buyPrice;},0);
  const grandQty=products.reduce((a,p)=>a+(totalStock(p)),0);
  return(
    <div style={S.col10}>
      {products.map(p=>{
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
        <div><div style={{fontSize:11,color:"#fff",fontWeight:700,letterSpacing:0.8}}>GESAMTER LAGERWERT</div><div style={{fontSize:11,color:"#aaa",marginTop:3}}>{grandQty} Stück total</div></div>
        <div style={{fontSize:32,fontWeight:900,color:"#fff"}}>€{grandTotal.toFixed(2)}</div>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────



// ─── Bestellbedarf View (Tab) ─────────────────────────────────────
function BestellbedarfView({prods,products,onExport}){
  const activeProds=prods.filter(p=>p.status!=="Fertig"&&!p.isCapOrder);
  const [openSize,setOpenSize]=useState(null);
  const bedarfMap={};
  const breakdownMap={};
  activeProds.forEach(prod=>{
    if(!bedarfMap[prod.blankId])bedarfMap[prod.blankId]={};
    if(!breakdownMap[prod.blankId])breakdownMap[prod.blankId]={};
    DEFAULT_SIZES.forEach(s=>{
      const q=(prod.qty||{})[s]||0;
      bedarfMap[prod.blankId][s]=(bedarfMap[prod.blankId][s]||0)+q;
      if(q>0){
        if(!breakdownMap[prod.blankId][s])breakdownMap[prod.blankId][s]=[];
        breakdownMap[prod.blankId][s].push({name:prod.name,qty:q,colorHex:prod.colorHex});
      }
    });
  });
  return(
    <div style={S.col12}>
      {Object.keys(bedarfMap).length===0&&<div style={{color:"#ccc",fontSize:14,padding:60,textAlign:"center"}}>Keine aktiven Aufträge</div>}
      {Object.entries(bedarfMap).map(([blankId,sizeNeeds])=>{
        const blank=products.find(p=>p.id===blankId);if(!blank)return null;
        const relSizes=DEFAULT_SIZES.filter(s=>(sizeNeeds[s]||0)>0);
        return(
          <div key={blankId} style={{background:"#fff",borderRadius:14,padding:16,border:"1px solid #ebebeb",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
            <div style={S.cardHdr}>
              <SmartDot item={blank} size={22}/>
              <div><div style={{fontSize:14,fontWeight:800}}>{blank.name}</div><div style={{fontSize:11,color:"#aaa"}}>{blank.color} · {blank.category}</div></div>
              {blank.supplierUrl&&<a href={blank.supplierUrl.startsWith("http")?blank.supplierUrl:"https://"+blank.supplierUrl} target="_blank" rel="noopener noreferrer" style={{marginLeft:"auto",fontSize:12,color:"#3b82f6",fontWeight:700}}>↗ Bestellen</a>}
            </div>
            <div style={S.col6}>
              {relSizes.map(size=>{
                const needed=sizeNeeds[size]||0,avail=(blank.stock||{})[size]||0;
                const minStock=(blank.minStock||{})[size]||0;
                const toOrder=Math.max(0,needed-avail),toOrderWithMin=Math.max(0,needed+minStock-avail);
                const ok=toOrder===0,okWithMin=toOrderWithMin===0;
                return(
                <div key={size} style={{background:"#fff",borderRadius:10,border:`1px solid ${ok?"#bbf7d0":"#fecaca"}`,overflow:"hidden"}}>
                  <div onClick={()=>setOpenSize(o=>o===`${blankId}-${size}`?null:`${blankId}-${size}`)}
                    style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",cursor:"pointer",userSelect:"none"}}>
                    <span style={{fontSize:12,color:"#bbb",width:12}}>{openSize===`${blankId}-${size}`?"▾":"▸"}</span>
                    <span style={S.sizeTag}>{size}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:11,color:"#888"}}>Produktion: <strong style={{color:"#111"}}>{needed}</strong> · Lager: <strong style={{color:avail>=needed?"#16a34a":"#ef4444"}}>{avail}</strong></div>
                      {minStock>0&&<div style={{fontSize:10,color:"#bbb",marginTop:1}}>Sollbestand: {minStock} Stk</div>}
                    </div>
                    <div style={S.pill(ok)}>
                      <div style={S.pillLbl(ok)}>PRODUKTION</div>
                      <div style={S.pillNum(ok)}>{toOrder}</div>
                    </div>
                    {minStock>0&&<div style={{background:okWithMin?"#dcfce7":"#fff7ed",borderRadius:8,padding:"4px 10px",textAlign:"center",minWidth:52,border:`1px solid ${okWithMin?"#bbf7d0":"#fed7aa"}`}}>
                      <div style={{fontSize:9,color:okWithMin?"#16a34a":"#f97316",fontWeight:700}}>+ SOLL</div>
                      <div style={{fontSize:18,fontWeight:900,color:okWithMin?"#16a34a":"#f97316",lineHeight:1}}>{toOrderWithMin}</div>
                    </div>}
                  </div>
                  {openSize===`${blankId}-${size}`&&(
                    <div style={{borderTop:"1px solid #f0f0f0",padding:"8px 14px 10px",background:"#fafafa",display:"flex",flexDirection:"column",gap:5}}>
                      <div style={{fontSize:10,color:"#bbb",fontWeight:700,letterSpacing:0.6,marginBottom:2}}>AUFTRÄGE</div>
                      {(breakdownMap[blankId]?.[size]||[]).map((item,i)=>(
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
    </div>
  );
}


// ─── Google Sheets Setup Modal ────────────────────────────────────
function SheetsSetupModal({onClose,onSave}){
  const [url,setUrl]=useState(()=>localStorage.getItem("gkbs_sheets_url")||"");
  const save=()=>{
    localStorage.setItem("gkbs_sheets_url",url.trim());
    onSave(url.trim());
    onClose();
  };
  return(
    <ModalWrap onClose={onClose} width={520}>
      <div style={{fontSize:17,fontWeight:800}}>☁️ Google Sheets Verbindung</div>
      <div style={{fontSize:13,color:"#666",lineHeight:1.6}}>
        Trage deine Apps Script URL ein. Der Bestand wird dann automatisch mit Google Sheets synchronisiert und ist für alle Mitarbeiter zugänglich.
      </div>
      <div style={{background:"#f8f8f8",borderRadius:10,padding:"12px 14px",fontSize:12,color:"#555",lineHeight:1.7}}>
        <b>Setup (einmalig ~10 Min):</b><br/>
        1. Google Sheets öffnen → Erweiterungen → Apps Script<br/>
        2. Den Apps Script Code aus der Anleitung einfügen<br/>
        3. Deployen als Web-App → URL kopieren<br/>
        4. URL hier einfügen → Fertig ✓
      </div>
      <input
        style={inp}
        placeholder="https://script.google.com/macros/s/..."
        value={url}
        onChange={e=>setUrl(e.target.value)}
      />
      <div style={{display:"flex",gap:8}}>
        <button type="button" onClick={onClose} style={{flex:1,padding:13,borderRadius:10,border:"1px solid #e8e8e8",background:"none",color:"#666",cursor:"pointer",fontWeight:700}}>Abbrechen</button>
        <button type="button" onClick={save} disabled={!url.trim()} style={{flex:2,padding:13,borderRadius:10,border:"none",background:url.trim()?"#111":"#f0f0f0",color:url.trim()?"#fff":"#bbb",cursor:url.trim()?"pointer":"not-allowed",fontWeight:800}}>☁️ Verbinden</button>
      </div>
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
function PrintView({type, products, prods, onClose}){
  const date = new Date().toLocaleDateString("de-AT");

  const printStyles = `
    @media print {
      .no-print { display: none !important; }
      .print-root { position: static !important; background: #f4f4f4 !important; }
      @page { size: A4; margin: 10mm; }
    }
    .print-root {
      position: fixed; inset: 0; background: #f4f4f4; z-index: 999;
      overflow-y: auto; font-family: -apple-system, Helvetica, Arial, sans-serif;
      color: #111; font-size: 12px; padding: 20px;
    }
    .p-card {
      background: #fff; border: 1px solid #ebebeb; border-radius: 14px;
      padding: 16px; margin-bottom: 10px; page-break-inside: avoid;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }
    .p-dot { width: 14px; height: 14px; border-radius: 50%; border: 1.5px solid #444; display: inline-block; vertical-align: middle; flex-shrink: 0; }
    .p-badge { display: inline-block; border-radius: 6px; padding: 2px 7px; font-size: 10px; font-weight: 700; margin-right: 4px; }
    .p-bar-wrap { height: 5px; background: #e8e8e8; border-radius: 99px; overflow: hidden; margin: 5px 0; }
    .p-bar-fill { height: 100%; background: #111; border-radius: 99px; }
    .p-row { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 10px; margin-bottom: 4px; }
    .p-badge-pill { border-radius: 8px; padding: 3px 10px; text-align: center; min-width: 52px; display: inline-block; }
    .p-label { font-size: 9px; font-weight: 700; display: block; }
    .p-num { font-size: 18px; font-weight: 900; line-height: 1; display: block; }
  `;

  const activeProds = prods.filter(p=>p.status!=="Fertig");
  const bedarfMap = {};
  const breakdownMap = {};
  const activeProdsBedarf = prods.filter(p=>p.status!=="Fertig"&&!p.isCapOrder);
  activeProdsBedarf.forEach(prod=>{
    if(!bedarfMap[prod.blankId])bedarfMap[prod.blankId]={};
    if(!breakdownMap[prod.blankId])breakdownMap[prod.blankId]={};
    DEFAULT_SIZES.forEach(s=>{
      const q=(prod.qty||{})[s]||0;
      bedarfMap[prod.blankId][s]=(bedarfMap[prod.blankId][s]||0)+q;
      if(q>0){
        if(!breakdownMap[prod.blankId][s])breakdownMap[prod.blankId][s]=[];
        breakdownMap[prod.blankId][s].push({name:prod.name,qty:q});
      }
    });
  });

  return(
    <div className="print-root">
      <style>{printStyles}</style>

      {/* Toolbar – hidden on print */}
      <div className="no-print" style={{display:"flex",alignItems:"center",gap:12,marginBottom:24,padding:"12px 16px",background:"#111",borderRadius:12,position:"sticky",top:0,zIndex:10}}>
        <div style={{color:"#fff",fontWeight:800,fontSize:15,flex:1}}>
          {type==="bestand"?"📦 Bestandsliste":type==="produktion"?"🏭 Produktionsliste":"📋 Bestellbedarf"} – Druckvorschau
        </div>
        <button onClick={()=>window.print()} style={{padding:"9px 20px",borderRadius:9,border:"none",background:"#fff",color:"#111",cursor:"pointer",fontWeight:800,fontSize:14}}>
          🖨 Drucken / Als PDF
        </button>
        <button onClick={onClose} style={{padding:"9px 14px",borderRadius:9,border:"1px solid #555",background:"none",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:13}}>✕ Schließen</button>
      </div>

      {/* ── BESTAND ── */}
      {type==="bestand"&&(<>
        <div style={S.printH}>📦 Bestandsliste</div>
        <div style={S.printSub}>GKBS · Inventory Manager · {date}</div>
        {products.map(p=>{
          const isCap=p.category==="Cap";
          const total=totalStock(p);
          return(
            <div key={p.id} className="p-card">
              <div style={S.cardHdr}>
{p.category==="Cap"?<PrintPie colors={p.capColors||[]} r={10}/>:<span className="p-dot" style={{background:p.colorHex||"#888",width:20,height:20}}/>}
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:800}}>{p.name}</div>
                  <div style={{fontSize:11,color:"#aaa"}}>{p.category}{p.color?" · "+p.color:""}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:20,fontWeight:900}}>{total}</div>
                  <div style={{fontSize:9,color:"#bbb",fontWeight:700}}>GESAMT STK</div>
                </div>
              </div>
              {isCap?(
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {(p.capColors||[]).map(cc=>(
                    <div key={cc.id} style={{flex:1,minWidth:60,background:cc.stock===0?"#fef2f2":cc.stock<=3?"#fff7ed":"#f8f8f8",borderRadius:10,padding:"8px 6px",textAlign:"center",border:`1px solid ${cc.stock===0?"#fecaca":cc.stock<=3?"#fed7aa":"#f0f0f0"}`}}>
                      <div style={{width:14,height:14,borderRadius:"50%",background:cc.hex,border:"2px solid #444",margin:"0 auto 4px"}}/>
                      <div style={{fontSize:10,color:"#666",fontWeight:800}}>{cc.name}</div>
                      <div style={{fontSize:20,fontWeight:900,color:cc.stock===0?"#ef4444":cc.stock<=3?"#f97316":"#111"}}>{cc.stock}</div>
                    </div>
                  ))}
                </div>
              ):(
                <div style={S.col4}>
                  {DEFAULT_SIZES.map(s=>{const v=(p.stock||{})[s]||0,minV=(p.minStock||{})[s]||0;if(v===0&&minV===0)return null;return(
                    <div key={s} className="p-row" style={{background:v===0?"#fef2f2":v<=3?"#fff7ed":"#f8f8f8"}}>
                      <span style={S.sizeTag}>{s}</span>
                      <span style={{flex:1,fontSize:14,color:v===0?"#ef4444":v<=3?"#f97316":"#111",fontWeight:800}}>{v} <span style={{fontSize:10,fontWeight:400,color:"#aaa"}}>Stk</span></span>
                      {minV>0&&<span style={{fontSize:10,color:"#bbb",background:"#f0f0f0",padding:"2px 8px",borderRadius:6}}>Soll: {minV}</span>}
                    </div>
                  );})}
                </div>
              )}
            </div>
          );
        })}
      </>)}

      {/* ── PRODUKTION ── */}
      {type==="produktion"&&(<>
        <div style={S.printH}>🏭 Produktionsliste</div>
        <div style={S.printSub}>GKBS · Inventory Manager · {date} · {activeProds.length} aktive Aufträge</div>
        {activeProds.map(prod=>{
          const blank=products.find(p=>p.id===prod.blankId);
          const isCap=prod.isCapOrder;
          const totalQty=isCap?(prod.capColors||[]).reduce((a,cc)=>a+cc.qty,0):DEFAULT_SIZES.reduce((a,s)=>a+((prod.qty||{})[s]||0),0);
          const totalDone=isCap?(prod.capColors||[]).reduce((a,cc)=>a+cc.done,0):DEFAULT_SIZES.reduce((a,s)=>a+((prod.done||{})[s]||0),0);
          const pct=totalQty>0?Math.round(totalDone/totalQty*100):0;
          const PRIO={"Hoch":{bg:"#fef2f2",c:"#ef4444"},"Mittel":{bg:"#fff7ed",c:"#f97316"},"Niedrig":{bg:"#f0f0f0",c:"#888"}};
          const ps=PRIO[prod.priority]||PRIO["Niedrig"];
          const ss=prod.status==="In Produktion"?{bg:"#fef9c3",c:"#a16207"}:{bg:"#f0f0f0",c:"#666"};
          return(
            <div key={prod.id} className="p-card">
              {/* Header */}
              <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:10}}>
{prod.isCapOrder?<PrintPie colors={prod.capColors||[]} r={10} vk="qty"/>:<span className="p-dot" style={{background:prod.colorHex||"#888",width:20,height:20,marginTop:2}}/>}
                <div style={{flex:1}}>
                  <div style={{fontSize:15,fontWeight:800,marginBottom:4}}>{prod.name}</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:4,alignItems:"center"}}>
                    <span className="p-badge" style={{background:ps.bg,color:ps.c}}>{prod.priority}</span>
                    <span className="p-badge" style={{background:ss.bg,color:ss.c}}>{prod.status}</span>
                    {(prod.veredelung||[]).map(v=><span key={v} className="p-badge" style={{background:v==="Drucken"?"#eff6ff":"#fdf4ff",color:v==="Drucken"?"#3b82f6":"#a855f7"}}>{v==="Drucken"?"🖨 Drucken":"🪡 Sticken"}</span>)}
                    {blank&&<span style={{fontSize:10,color:"#aaa",display:"flex",alignItems:"center",gap:4}}><span className="p-dot" style={{background:blank.colorHex,width:10,height:10}}/>{blank.name}</span>}
                  </div>
                  {prod.notes&&<div style={{fontSize:11,color:"#bbb",fontStyle:"italic",marginTop:3}}>{prod.notes}</div>}
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontSize:22,fontWeight:900,lineHeight:1}}>{totalDone}<span style={{fontSize:13,color:"#bbb",fontWeight:400}}>/{totalQty}</span></div>
                  <div style={{fontSize:9,color:totalDone>=totalQty&&totalQty>0?"#16a34a":"#bbb",fontWeight:700}}>{totalDone>=totalQty&&totalQty>0?"✓ DONE":"DONE"}</div>
                </div>
              </div>
              {/* Progress bar */}
              {totalQty>0&&<><div className="p-bar-wrap"><div className="p-bar-fill" style={{width:pct+"%"}}/></div><div style={{fontSize:10,color:"#bbb",marginBottom:8}}>{pct}% erledigt · {totalQty-totalDone} verbleibend</div></>}
              {/* Sizes / Cap colors */}
              {isCap?(
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {(prod.capColors||[]).map(cc=>{
                    const open=Math.max(0,cc.qty-cc.done);
                    const complete=cc.qty>0&&cc.done>=cc.qty;
                    return(
                      <div key={cc.id} style={{flex:1,minWidth:65,background:complete?"#f0fdf4":"#f8f8f8",borderRadius:10,padding:"8px 6px",textAlign:"center",border:`1px solid ${complete?"#bbf7d0":"#f0f0f0"}`}}>
                        <div style={{width:14,height:14,borderRadius:"50%",background:cc.hex,border:"2px solid #444",margin:"0 auto 3px"}}/>
                        <div style={{fontSize:10,color:"#666",fontWeight:800}}>{cc.name}</div>
                        <div style={{fontSize:9,color:"#bbb",fontWeight:700,marginTop:2}}>SOLL {cc.qty}</div>
                        <div style={{fontSize:18,fontWeight:900,color:complete?"#16a34a":"#111",marginTop:2}}>{cc.done}</div>
                        {open>0&&<div style={{fontSize:9,color:"#ef4444",fontWeight:700}}>{open} offen</div>}
                        {complete&&<div style={{fontSize:9,color:"#16a34a",fontWeight:700}}>✓</div>}
                      </div>
                    );
                  })}
                </div>
              ):(
                <div style={S.col4}>
                  {DEFAULT_SIZES.map(s=>{
                    const soll=(prod.qty||{})[s]||0;
                    const done=(prod.done||{})[s]||0;
                    const open=Math.max(0,soll-done);
                    const complete=soll>0&&done>=soll;
                    if(soll===0)return null;
                    return(
                      <div key={s} className="p-row" style={{background:complete?"#f0fdf4":open===soll?"#fef2f2":"#f8f8f8",border:`1px solid ${complete?"#bbf7d0":open===soll?"#fecaca":"#f0f0f0"}`}}>
                        <span style={S.sizeTag}>{s}</span>
                        <span style={{fontSize:11,color:"#888",flex:1}}>Soll: <b style={{color:"#111"}}>{soll}</b></span>
                        <span style={{fontSize:11,color:"#16a34a",fontWeight:700,minWidth:42}}>✓ {done}</span>
                        <span style={{background:complete?"#dcfce7":open>0?"#fef2f2":"#dcfce7",color:complete?"#16a34a":open>0?"#ef4444":"#16a34a",borderRadius:8,padding:"3px 10px",fontSize:12,fontWeight:900,minWidth:52,textAlign:"center"}}>
                          {complete?"✓":open+" offen"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </>)}

      {/* ── BESTELLBEDARF ── */}
      {type==="bestellbedarf"&&(<>
        <div style={S.printH}>📋 Bestellbedarf</div>
        <div style={S.printSub}>GKBS · Inventory Manager · {date}</div>
        {Object.entries(bedarfMap).map(([blankId,sizeNeeds])=>{
          const blank=products.find(p=>p.id===blankId);
          if(!blank)return null;
          const relSizes=DEFAULT_SIZES.filter(s=>(sizeNeeds[s]||0)>0);
          return(
            <div key={blankId} className="p-card">
              <div style={S.cardHdr}>
                <span className="p-dot" style={{background:blank.colorHex||"#888",width:20,height:20}}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:800}}>{blank.name}</div>
                  <div style={{fontSize:11,color:"#aaa"}}>{blank.color||""} · {blank.category}</div>
                </div>
                {blank.supplierUrl&&<a href={blank.supplierUrl.startsWith("http")?blank.supplierUrl:"https://"+blank.supplierUrl} style={{fontSize:11,color:"#3b82f6",fontWeight:700}}>↗ Bestellen</a>}
              </div>
              <div style={S.col6}>
                {relSizes.map(size=>{
                  const needed=sizeNeeds[size]||0,avail=(blank.stock||{})[size]||0;
                  const minS=(blank.minStock||{})[size]||0;
                  const toOrder=Math.max(0,needed-avail),toOrderMin=Math.max(0,needed+minS-avail);
                  const ok=toOrder===0,okMin=toOrderMin===0;
                  const orders=(breakdownMap[blankId]?.[size]||[]).map(o=>o.name+" ("+o.qty+")").join(", ");
                  return(
                    <div key={size} style={{background:"#fff",borderRadius:10,border:`1px solid ${ok?"#bbf7d0":"#fecaca"}`,overflow:"hidden"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px"}}>
                        <span style={S.sizeTag}>{size}</span>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:11,color:"#888"}}>Produktion: <strong style={{color:"#111"}}>{needed}</strong> · Lager: <strong style={{color:avail>=needed?"#16a34a":"#ef4444"}}>{avail}</strong></div>
                          {minS>0&&<div style={{fontSize:10,color:"#bbb",marginTop:1}}>Sollbestand: {minS} Stk</div>}
                        </div>
                        <div style={S.pill(ok)}>
                          <div style={S.pillLbl(ok)}>PRODUKTION</div>
                          <div style={S.pillNum(ok)}>{toOrder}</div>
                        </div>
                        {minS>0&&<div style={{background:okMin?"#dcfce7":"#fff7ed",borderRadius:8,padding:"4px 10px",textAlign:"center",minWidth:52,border:`1px solid ${okMin?"#bbf7d0":"#fed7aa"}`}}>
                          <div style={{fontSize:9,color:okMin?"#16a34a":"#f97316",fontWeight:700}}>+ SOLL</div>
                          <div style={{fontSize:18,fontWeight:900,color:okMin?"#16a34a":"#f97316",lineHeight:1}}>{toOrderMin}</div>
                        </div>}
                      </div>
                      {orders&&<div style={{borderTop:"1px solid #f0f0f0",padding:"6px 14px",background:"#fafafa",fontSize:10,color:"#888"}}>{orders}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </>)}

      {/* ── FINANZEN ── */}
      {type==="finanzen"&&(<>
        <div style={S.printH}>💶 Finanzen</div>
        <div style={S.printSub}>GKBS · Inventory Manager · {date}</div>
        {products.map(p=>{
          const isCap=p.category==="Cap";
          const qty=totalStock(p);
          const tot=p.buyPrice!=null?qty*p.buyPrice:null;
          return(
            <div key={p.id} className="p-card">
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
{p.category==="Cap"?<PrintPie colors={p.capColors||[]} r={7}/>:<span className="p-dot" style={{background:p.colorHex||"#888"}}/>}
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:800}}>{p.name}</div>
                  <div style={{fontSize:10,color:"#888"}}>{p.color||p.category}{p.buyPrice!=null?" · EK: €"+p.buyPrice.toFixed(2)+"/St":""}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:15,fontWeight:900}}>{tot!=null?"€"+tot.toFixed(2):"—"}</div>
                  <div style={{fontSize:10,color:"#888"}}>{qty} Stk</div>
                </div>
              </div>
              {isCap?(
                <div>
                  {(p.capColors||[]).map(cc=>{if(cc.stock===0)return null;return(
                    <div key={cc.id} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 8px",borderBottom:"1px solid #f0f0f0"}}>
                      <div style={{width:12,height:12,borderRadius:"50%",background:cc.hex,border:"1.5px solid #444",flexShrink:0}}/>
                      <span style={{fontWeight:800,fontSize:12,flex:1,color:cc.stock<=3?"#f97316":"#111"}}>{cc.name}</span>
                      <span style={{fontSize:12,color:"#888"}}>{cc.stock} Stk</span>
                      {p.buyPrice!=null&&<span style={{fontSize:12,color:"#888",minWidth:60,textAlign:"right"}}>€{(cc.stock*p.buyPrice).toFixed(2)}</span>}
                    </div>
                  );})}
                </div>
              ):(
                <div>
                  {DEFAULT_SIZES.map(s=>{const v=(p.stock||{})[s]||0;if(v===0)return null;return(
                    <div key={s} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 8px",borderBottom:"1px solid #f0f0f0"}}>
                      <span style={{fontWeight:800,fontSize:12,width:36,color:"#444"}}>{s}</span>
                      <span style={{flex:1,fontSize:12,color:v<=3?"#f97316":"#111",fontWeight:700}}>{v} Stk</span>
                      {p.buyPrice!=null&&<span style={{fontSize:12,color:"#888"}}>€{(v*p.buyPrice).toFixed(2)}</span>}
                    </div>
                  );})}
                </div>
              )}
            </div>
          );
        })}
        <div style={{background:"#111",borderRadius:10,padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8}}>
          <div style={{color:"#555",fontSize:11,fontWeight:700}}>GESAMTER LAGERWERT</div>
          <div style={{color:"#fff",fontSize:26,fontWeight:900}}>
            €{products.reduce((a,p)=>p.buyPrice==null?a:a+totalStock(p)*p.buyPrice,0).toFixed(2)}
          </div>
        </div>
      </>)}
    </div>
  );
}

export default function App(){
  const mobile=useIsMobile();
  const [products,__setProducts]=useState(DEMO_PRODUCTS);
  const [prods,__setProds]=useState(DEMO_PRODS);
  const [syncStatus,setSyncStatus]=useState("idle"); // idle | loading | saving | error | ok
  const [sheetsUrl,setSheetsUrl]=useState(()=>typeof window!=="undefined"?localStorage.getItem("gkbs_sheets_url")||"":"");
  const saveTimeout=useRef(null);

  // Load from Sheets on mount
  useEffect(()=>{
    const url=localStorage.getItem("gkbs_sheets_url");
    if(!url)return;
    setSyncStatus("loading");
    sheetsLoad().then(data=>{
      if(data?.products){__setProducts(data.products);productsRef.current=data.products;}
      if(data?.prods){__setProds(data.prods);prodsRef.current=data.prods;}
      setSyncStatus(data?"ok":"error");
      setTimeout(()=>setSyncStatus("idle"),2000);
    });
  },[]);
  const historyRef=useRef([]);
  const productsRef=useRef(DEMO_PRODUCTS);
  const prodsRef=useRef(DEMO_PRODS);

  const triggerSave=useCallback((nextProducts, nextProds)=>{
    if(!localStorage.getItem("gkbs_sheets_url"))return;
    clearTimeout(saveTimeout.current);
    setSyncStatus("saving");
    saveTimeout.current=setTimeout(()=>{
      sheetsSave(nextProducts||productsRef.current, nextProds||prodsRef.current)
        .then(()=>{setSyncStatus("ok");setTimeout(()=>setSyncStatus("idle"),2000);})
        .catch(()=>setSyncStatus("error"));
    },1500);
  },[]);

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
  const categoriesRef=useRef(DEFAULT_CATEGORIES);
  const setCategories=useCallback((cats)=>{
    historyRef.current=[{products:productsRef.current,prods:prodsRef.current,categories:categoriesRef.current},...historyRef.current].slice(0,MAX_HISTORY);
    categoriesRef.current=cats;
    __setCategories(cats);
  },[]);
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
  const totalVal=products.reduce((a,p)=>{if(p.buyPrice==null)return a;const q=totalStock(p);return a+q*p.buyPrice;},0);
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
    setConfirmProduce(null);
  };




  // ─── PDF Export ───────────────────────────────────────────────
  const [printView,setPrintView]=useState(null); // {type, data}
  const exportPDF = (type) => { setPrintView(type); };

  const TABS=[["production","🏭 Produktion"],["inventory","📦 Bestand"],["bestellbedarf","📋 Bestellbedarf"],["finance","💶 Finanzen"]];

  return(
    <>{printView&&<PrintView type={printView} products={products} prods={prods} onClose={()=>setPrintView(null)}/>}
    <div style={{minHeight:"100vh",background:"#f4f4f4",color:"#111",fontFamily:"-apple-system,BlinkMacSystemFont,'Inter',sans-serif"}}>
      {showProdModal&&<ProductModal categories={categories} initial={showProdModal==="add"?null:showProdModal} onClose={()=>setShowProdModal(false)} onSave={p=>{if(showProdModal==="add")setProducts(ps=>[...ps,p]);else setProducts(ps=>ps.map(x=>x.id===p.id?p:x));setShowProdModal(false);}}/>}
      {showPAModal&&<ProductionModal products={products} initial={showPAModal==="add"?null:showPAModal} onClose={()=>setShowPAModal(false)} onSave={p=>{if(showPAModal==="add")setProds(ps=>[...ps,p]);else setProds(ps=>ps.map(x=>x.id===p.id?p:x));setShowPAModal(false);}}/>}
      {showCats&&<CategoryModal categories={categories} onClose={()=>setShowCats(false)} onSave={cats=>{setCategories(cats);setShowCats(false);}}/>}
      {confirmDelete&&<DeleteConfirmModal name={confirmDelete.name} onConfirm={()=>{confirmDelete.onConfirm();setConfirmDelete(null);}} onCancel={()=>setConfirmDelete(null)}/>}
      {confirmProduce&&<ConfirmProduceModal prod={confirmProduce} blank={products.find(p=>p.id===confirmProduce.blankId)} onConfirm={handleProduceConfirm} onCancel={()=>setConfirmProduce(null)}/>}
      {showSheetsSetup&&<SheetsSetupModal onClose={()=>setShowSheetsSetup(false)} onSave={(u)=>setSheetsUrl(u)}/>}
      {showBestellbedarf&&<BestellbedarfModal prods={prods} products={products} onClose={()=>setShowBestellbedarf(false)} onExport={()=>exportPDF("bestellbedarf")}/>}

      {/* ── Header ── */}
      <div style={{background:"#fff",borderBottom:"1px solid #ebebeb",padding:mobile?"12px 14px":"16px 24px",position:"sticky",top:0,zIndex:50}}>
        <div style={{maxWidth:1300,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
          <div>
            <div style={{fontSize:mobile?18:22,fontWeight:900,letterSpacing:-0.5,color:"#111"}}>INVENTORY MANAGER</div>
            {!mobile&&<div style={{fontSize:12,color:"#bbb",fontWeight:600,display:"flex",alignItems:"center",gap:6}}>
              GKBS · Textile Stock
              {syncStatus==="loading"&&<span style={{color:"#f97316"}}>⟳ Laden...</span>}
              {syncStatus==="saving"&&<span style={{color:"#f97316"}}>⟳ Speichern...</span>}
              {syncStatus==="ok"&&<span style={{color:"#16a34a"}}>✓ Gespeichert</span>}
              {syncStatus==="error"&&<span style={{color:"#ef4444"}}>⚠ Sync Fehler</span>}
              {!sheetsUrl&&<span style={{color:"#bbb",cursor:"pointer",textDecoration:"underline"}} onClick={()=>setShowSheetsSetup(true)}>Google Sheets einrichten →</span>}
            </div>}
          </div>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            {/* Undo */}
            <button onClick={undo} disabled={!canUndo} title="Rückgängig"
              style={{padding:mobile?"8px 10px":"9px 12px",borderRadius:9,border:"1px solid #e8e8e8",background:canUndo?"#fff":"#f5f5f5",color:canUndo?"#333":"#ccc",cursor:canUndo?"pointer":"not-allowed",fontWeight:700,fontSize:mobile?12:13,display:"flex",alignItems:"center",gap:4}}>
              ↩{!mobile&&` Undo`}{canUndo&&<span style={{fontSize:10,color:"#bbb",fontWeight:500}}>({historyRef.current.length})</span>}
            </button>
{view==="inventory"&&<button onClick={()=>setShowCats(true)} style={{padding:mobile?"8px 10px":"9px 13px",borderRadius:9,border:"1px solid #e8e8e8",background:"#fff",color:"#555",cursor:"pointer",fontWeight:700,fontSize:mobile?12:13}}>🗂{!mobile&&" Kategorien"}</button>}
            {view==="inventory"&&<>
              <button onClick={()=>exportPDF("bestand")} style={{padding:mobile?"8px 10px":"9px 13px",borderRadius:9,border:"1px solid #e8e8e8",background:"#fff",color:"#555",cursor:"pointer",fontWeight:700,fontSize:mobile?12:13}}>🖨{!mobile&&" PDF"}</button>
              <button onClick={()=>setShowProdModal("add")} style={{padding:mobile?"8px 14px":"9px 16px",borderRadius:9,border:"none",background:"#111",color:"#fff",cursor:"pointer",fontWeight:800,fontSize:mobile?13:14}}>+ {mobile?"":"Produkt"}</button>
            </>}
            {view==="production"&&<>
              <button onClick={()=>exportPDF("produktion")} style={{padding:mobile?"8px 10px":"9px 13px",borderRadius:9,border:"1px solid #e8e8e8",background:"#fff",color:"#555",cursor:"pointer",fontWeight:700,fontSize:mobile?12:13}}>🖨{!mobile&&" PDF"}</button>
              <button onClick={()=>setShowPAModal("add")} style={{padding:mobile?"8px 14px":"9px 16px",borderRadius:9,border:"none",background:"#111",color:"#fff",cursor:"pointer",fontWeight:800,fontSize:mobile?13:14}}>+ {mobile?"":"Auftrag"}</button>
            </>}
            {view==="bestellbedarf"&&<>
              <button onClick={()=>exportPDF("bestellbedarf")} style={{padding:mobile?"8px 10px":"9px 13px",borderRadius:9,border:"1px solid #e8e8e8",background:"#fff",color:"#555",cursor:"pointer",fontWeight:700,fontSize:mobile?12:13}}>🖨{!mobile&&" PDF"}</button>
            </>}
            {view==="finance"&&<>
              <button onClick={()=>exportPDF("finanzen")} style={{padding:mobile?"8px 10px":"9px 13px",borderRadius:9,border:"1px solid #e8e8e8",background:"#fff",color:"#555",cursor:"pointer",fontWeight:700,fontSize:mobile?12:13}}>🖨{!mobile&&" PDF"}</button>
            </>}
          </div>
        </div>
      </div>

      <div style={{padding:mobile?"12px 12px 100px":"20px 24px",maxWidth:1300,margin:"0 auto"}}>
        {/* Stats row */}
        <div style={{display:"grid",gridTemplateColumns:mobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:mobile?8:10,marginBottom:mobile?14:20}}>
          {[{label:"Blanks",value:products.length},{label:"Stück",value:totalQty},{label:"Lagerwert",value:`€${totalVal.toFixed(2)}`},{label:"Aufträge",value:activeProdsArr.length,color:activeProdsArr.length>0?"#a16207":"#111"}].map(s=>(
            <div key={s.label} style={{background:"#fff",borderRadius:12,padding:mobile?"10px 12px":"14px 18px",border:"1px solid #ebebeb"}}>
              <div style={{fontSize:10,color:"#bbb",fontWeight:700,letterSpacing:0.7,marginBottom:2}}>{s.label.toUpperCase()}</div>
              <div style={{fontSize:mobile?20:24,fontWeight:900,color:s.color||"#111",lineHeight:1}}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Tab bar */}
        <div style={{display:"flex",gap:3,marginBottom:mobile?14:18,background:"#e8e8e8",borderRadius:11,padding:3,width:"fit-content"}}>
          {TABS.map(([v,lbl])=>(
            <button key={v} onClick={()=>setView(v)}
              style={{padding:mobile?"8px 14px":"8px 18px",borderRadius:9,border:"none",background:view===v?"#fff":"transparent",color:view===v?"#111":"#888",cursor:"pointer",fontWeight:700,fontSize:mobile?12:13,boxShadow:view===v?"0 1px 3px rgba(0,0,0,0.08)":"none",display:"flex",alignItems:"center",gap:5,whiteSpace:"nowrap"}}>
              {mobile?lbl.split(" ")[0]:lbl}
              {v==="production"&&activeProdsArr.length>0&&<span style={{background:"#ef4444",color:"#fff",borderRadius:20,padding:"1px 6px",fontSize:10,fontWeight:800}}>{activeProdsArr.length}</span>}
            </button>
          ))}
        </div>

        {/* Finance */}
        {view==="finance"&&<FinanceView products={products}/>}

        {/* Bestellbedarf as tab */}
        {view==="bestellbedarf"&&<BestellbedarfView prods={prods} products={products} onExport={()=>exportPDF("bestellbedarf")}/>}

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
                  <ProductionCard prod={prod} blank={products.find(p=>p.id===prod.blankId)}
                    onDelete={()=>setConfirmDelete({name:prod.name,onConfirm:()=>setProds(ps=>ps.filter(x=>x.id!==prod.id))})}
                    onEdit={()=>setShowPAModal(prod)}
                    onUpdate={u=>setProds(ps=>ps.map(x=>x.id===u.id?u:x))}
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
                style={{background:"#fff",border:"1px solid #e8e8e8",borderRadius:10,color:"#111",padding:"9px 13px",fontSize:13,outline:"none",width:mobile?120:160,flexShrink:0}}/>
              {["All",...categories].map(c=><button key={c} onClick={()=>setCatFilter(c)} style={{padding:"8px 12px",borderRadius:9,border:"1px solid",borderColor:catFilter===c?"#111":"#e8e8e8",background:catFilter===c?"#111":"#fff",color:catFilter===c?"#fff":"#666",cursor:"pointer",fontWeight:700,fontSize:12,flexShrink:0,whiteSpace:"nowrap"}}>{c}</button>)}
            </div>
            <div style={{display:"grid",gap:10,gridTemplateColumns:mobile?"1fr":"repeat(auto-fill, minmax(560px, 1fr))"}}>
              {filtered.length===0
                ?<div style={{color:"#ccc",fontSize:14,padding:60,textAlign:"center"}}>Keine Produkte gefunden</div>
                :filtered.map(p=>(
                  <div key={p.id} draggable={!mobile} onDragStart={e=>onProductDragStart(e,p.id)} onDragEnter={()=>onProductDragEnter(null,p.id)} onDragEnd={onProductDragEnd} onDragOver={e=>e.preventDefault()} style={{opacity:dragItem.current===p.id?0.45:1,transition:"opacity 0.15s"}}>
                    <ProductCard product={p} onUpdate={u=>setProducts(ps=>ps.map(x=>x.id===u.id?u:x))} onDelete={()=>setConfirmDelete({name:p.name,onConfirm:()=>setProducts(ps=>ps.filter(x=>x.id!==p.id))})} onEdit={()=>setShowProdModal(p)}/>
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
    </>
  );
}
