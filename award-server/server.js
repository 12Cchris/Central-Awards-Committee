// 중앙시상위원회 서버 v1.0.0 - 관리자 로그인 + 상장 그리기
const express=require("express");
const cors=require("cors");
const crypto=require("crypto");
const {draw}=require("./draw");

const ADMIN_PASSWORD=process.env.ADMIN_PASSWORD;
if(!ADMIN_PASSWORD){console.error("환경 변수 ADMIN_PASSWORD 가 필요합니다.");process.exit(1)}
const TOKEN_SECRET=process.env.TOKEN_SECRET||crypto.randomBytes(32).toString("hex"); // 미설정 시 서버 재시작마다 로그아웃됨
const ORIGINS=(process.env.ALLOWED_ORIGIN||"").split(",").map(s=>s.trim()).filter(Boolean); // 예: https://아이디.github.io
const TOKEN_HOURS=12;
if(!ORIGINS.length)console.warn("경고: ALLOWED_ORIGIN 이 없어 모든 사이트의 요청을 허용합니다.");

const app=express();
app.set("trust proxy",1);
app.use(express.json({limit:"4kb"}));
app.use(cors({origin:ORIGINS.length?ORIGINS:true,methods:["GET","POST"],allowedHeaders:["Content-Type","Authorization"]}));

const sha=s=>crypto.createHash("sha256").update(String(s)).digest();
const b64=b=>Buffer.from(b).toString("base64url");
const sign=p=>crypto.createHmac("sha256",TOKEN_SECRET).update(p).digest("base64url");
function makeToken(){const p=b64(JSON.stringify({exp:Date.now()+TOKEN_HOURS*3600e3}));return p+"."+sign(p)}
function checkToken(t){
  if(typeof t!=="string")return false;
  const [p,sig]=t.split(".");
  if(!p||!sig)return false;
  const a=Buffer.from(sig),b=Buffer.from(sign(p));
  if(a.length!==b.length||!crypto.timingSafeEqual(a,b))return false;
  try{return JSON.parse(Buffer.from(p,"base64url").toString()).exp>Date.now()}catch(e){return false}
}
function auth(req,res,next){
  const m=/^Bearer (.+)$/.exec(req.get("Authorization")||"");
  if(m&&checkToken(m[1]))return next();
  res.status(401).json({error:"관리자 로그인이 필요합니다."});
}

// 로그인 실패 제한: IP당 5회 실패 시 15분 차단
const fails=new Map();
const MAX_FAIL=5,LOCK_MS=15*60e3;
app.post("/api/login",(req,res)=>{
  const ip=req.ip,now=Date.now();
  const f=fails.get(ip)||{n:0,until:0};
  if(f.until>now)return res.status(429).json({error:"시도 횟수를 초과했습니다. "+Math.ceil((f.until-now)/60e3)+"분 뒤에 다시 시도해 주세요."});
  const pw=req.body&&req.body.password;
  if(typeof pw==="string"&&crypto.timingSafeEqual(sha(pw),sha(ADMIN_PASSWORD))){
    fails.delete(ip);
    return res.json({token:makeToken(),hours:TOKEN_HOURS});
  }
  f.n++;
  if(f.n>=MAX_FAIL){f.n=0;f.until=now+LOCK_MS}
  fails.set(ip,f);
  res.status(401).json({error:"비밀번호가 올바르지 않습니다."});
});

// 상장 발급 (관리자만)
const str=(v,max)=>typeof v==="string"&&v.trim().length>=1&&v.trim().length<=max?v.trim():null;
app.post("/api/issue",auth,(req,res)=>{
  const b=req.body||{};
  const name=str(b.name,12),awardName=str(b.awardName,40),awardReason=str(b.awardReason,100);
  const no=Number.isInteger(b.no)&&b.no>=0&&b.no<=9999?b.no:null;
  let reason="";
  if(b.reason!=null&&b.reason!==""){
    reason=str(b.reason,60);
    if(reason===null)return res.status(400).json({error:"수상 사유는 60자 이내로 입력해 주세요."});
    reason=reason.replace(/[.。]$/,"")+" 공로가 크므로";
  }
  if(!name||!awardName||!awardReason||no===null)return res.status(400).json({error:"입력값이 올바르지 않습니다."});
  const png=draw(name,{name:awardName,reason:awardReason},reason,`${new Date().getFullYear()}-${String(no).padStart(4,"0")}`);
  res.set({"Content-Type":"image/png","Cache-Control":"no-store"}).send(png);
});

app.get("/",(req,res)=>res.type("text").send("중앙시상위원회 서버 v1.0.0"));
app.listen(process.env.PORT||3000,()=>console.log("listening"));
