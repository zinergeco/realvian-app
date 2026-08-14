const OC="M20 M21 M4 M33 M19 WA14 LS6 LS7 LS8 LS2 B15 B5 B17 B13 B14 BS8 BS3 BS9 BS6 SW11 E17 SE15 TW9 N8 EH3 EH6 EH4 EH15 G3 G12 G41 NE2 NE6 NE7 L17 CF11 CF5 KY16".split(" ");
const UA="Realvian/1.0 (+https://realvian.co.uk)";
const sl=ms=>new Promise(r=>setTimeout(r,ms));
async function j(u,o={}){for(let a=1;a<=3;a++){try{const r=await fetch(u,{headers:{"User-Agent":UA,...(o.headers||{})},...o});if(r.status===404)return null;if(!r.ok){await sl(a*2000);continue}return await r.json()}catch{if(a===3)return null;await sl(a*2000)}}return null}
const hv=(a,b,c,d)=>{const R=6371e3,t=x=>x*Math.PI/180,L=t(c-a),O=t(d-b);const h=Math.sin(L/2)**2+Math.cos(t(a))*Math.cos(t(c))*Math.sin(O/2)**2;return 2*R*Math.asin(Math.sqrt(h))};
async function op(q){const r=await j("https://overpass-api.de/api/interpreter",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:"data="+encodeURIComponent(q)});await sl(2500);return r}
const recs=[];
for(const oc of OC){
  const g=await j(`https://api.postcodes.io/outcodes/${oc}`);await sl(150);
  if(!g?.result?.latitude){console.error(`SKIP ${oc}`);continue}
  const{latitude:la,longitude:ln,admin_district:ad,region:rg,country:ct}=g.result;
  const r={oc,la,ln,city:ad?.[0]||null,region:rg?.[0]||ct?.[0]||null,gaps:[]};
  const a=await op(`[out:json][timeout:60];(node["shop"](around:1000,${la},${ln});node["amenity"~"^(restaurant|cafe|pub|bar|pharmacy|doctors|dentist|bank|post_office|library)$"](around:1000,${la},${ln}););out count;`);
  r.am=a?.elements?.[0]?.tags?.total?+a.elements[0].tags.total:null; if(r.am===null)r.gaps.push("amenities");
  const p=await op(`[out:json][timeout:60];(way["leisure"~"^(park|garden|nature_reserve|recreation_ground|common)$"](around:1500,${la},${ln}););out center 1;`);
  const c=p?.elements?.[0]?.center; r.pk=c?Math.round(hv(la,ln,c.lat,c.lon)):null; if(r.pk===null)r.gaps.push("green");
  const t=await op(`[out:json][timeout:60];(node["railway"~"^(station|halt|tram_stop)$"](around:3000,${la},${ln});node["highway"="bus_stop"](around:1000,${la},${ln}););out center;`);
  if(t?.elements?.length){const s=t.elements.filter(e=>e.tags?.railway&&e.lat!=null);r.bs=t.elements.filter(e=>e.tags?.highway==="bus_stop").length||null;r.st=s.length?Math.round(Math.min(...s.map(x=>hv(la,ln,x.lat,x.lon)))/80):null}else{r.bs=null;r.st=null;r.gaps.push("transport")}
  recs.push(r);
  console.error(`${oc} ${r.city||"?"} am=${r.am} pk=${r.pk} st=${r.st}`);
}
const pc=(s,p)=>s.length?s[Math.min(s.length-1,Math.max(0,Math.floor(p/100*s.length)))]:null;
const col=k=>recs.map(r=>r[k]).filter(v=>v!==null&&isFinite(v)).sort((a,b)=>a-b);
const mk=k=>{const s=col(k);return s.length>=5?{p10:pc(s,10),p50:pc(s,50),p90:pc(s,90)}:null};
const B={am:mk("am"),pk:mk("pk"),st:mk("st"),bs:mk("bs")};
console.error("BASELINES "+JSON.stringify(B));
const cl=(n,a,b)=>Math.min(b,Math.max(a,n));
const nm=(v,an,inv)=>{if(v===null||!an)return null;const{p10,p50,p90}=an;let s;if(v<=p10)s=10*(v/Math.max(p10,1e-4));else if(v<=p50)s=10+40*((v-p10)/Math.max(p50-p10,1e-4));else if(v<=p90)s=50+40*((v-p50)/Math.max(p90-p50,1e-4));else s=90+10*Math.min(1,(v-p90)/Math.max(p90,1e-4));s=cl(s,0,100);return Math.round(inv?100-s:s)};
const q=s=>s===null?"NULL":"'"+String(s).replace(/'/g,"''")+"'";
console.log("BEGIN;");
for(const r of recs){
  const am=nm(r.am,B.am),gr=nm(r.pk,B.pk,1),tp=nm(r.st,B.st,1),td=nm(r.bs,B.bs);
  const tr=(tp!==null&&td!==null)?Math.round(tp*.62+td*.38):(tp??td);
  const d=[am,gr,tr].filter(v=>v!==null);
  const sc=d.length?Math.round(d.reduce((a,b)=>a+b,0)/d.length):null;
  const cf=(d.length/6).toFixed(2);
  const slug=`${(r.city||"uk").toLowerCase().replace(/[^a-z0-9]+/g,"-")}-${r.oc.toLowerCase()}`;
  console.log(`INSERT INTO areas (outcode,district,city,region,slug,centroid,realvian_score,score_confidence,scoring_version,amenity_score,green_space_score,transport_score,last_refreshed_at) VALUES (${q(r.oc)},${q(r.oc)},${q(r.city)},${q(r.region)},${q(slug)},ST_GeogFromText('POINT(${r.ln} ${r.la})'),${sc??"NULL"},${cf},'1.1.0-partial',${am??"NULL"},${gr??"NULL"},${tr??"NULL"},now()) ON CONFLICT (outcode) DO UPDATE SET city=EXCLUDED.city,region=EXCLUDED.region,centroid=EXCLUDED.centroid,realvian_score=EXCLUDED.realvian_score,score_confidence=EXCLUDED.score_confidence,scoring_version=EXCLUDED.scoring_version,amenity_score=EXCLUDED.amenity_score,green_space_score=EXCLUDED.green_space_score,transport_score=EXCLUDED.transport_score,last_refreshed_at=now();`);
  console.log(`INSERT INTO area_raw_inputs (outcode,amenity_count,metres_to_park,mins_to_station,transport_stops,gaps,fetched_at) VALUES (${q(r.oc)},${r.am??"NULL"},${r.pk??"NULL"},${r.st??"NULL"},${r.bs??"NULL"},ARRAY[${r.gaps.map(q).join(",")}]::text[],now()) ON CONFLICT (outcode) DO UPDATE SET amenity_count=EXCLUDED.amenity_count,metres_to_park=EXCLUDED.metres_to_park,mins_to_station=EXCLUDED.mins_to_station,transport_stops=EXCLUDED.transport_stops,gaps=EXCLUDED.gaps,fetched_at=now();`);
}
console.log("COMMIT;");
