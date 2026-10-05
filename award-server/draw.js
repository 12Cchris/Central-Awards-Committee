// 상장 그리기 (브라우저용 index.html에서 옮겨 온 코드). 서버에서만 실행됩니다.
const path=require("path");
const {createCanvas,GlobalFonts}=require("@napi-rs/canvas");
const FD=path.join(__dirname,"fonts");
GlobalFonts.registerFromPath(path.join(FD,"NanumMyeongjo-Bold.ttf"),"Nanum Myeongjo");
GlobalFonts.registerFromPath(path.join(FD,"NanumMyeongjo-ExtraBold.ttf"),"Nanum Myeongjo");
GlobalFonts.registerFromPath(path.join(FD,"NotoSerifKR-700-subset.ttf"),"Noto Serif KR");

// 띄어쓰기(어절) 단위로 쪼갬. 한 어절이 한 줄보다 길 때만 글자 단위로 나눔(sp=앞에 띄어쓰기 있음)
function tokenize(ctx,text,maxW){
  const toks=[];
  for(const word of text.split(" ").filter(Boolean)){
    if(ctx.measureText(word).width<=maxW){toks.push({t:word,sp:toks.length>0});continue}
    let cur="",first=true;
    for(const ch of word){
      if(cur&&ctx.measureText(cur+ch).width>maxW&&!/[.,!?)」』]/.test(ch)){
        toks.push({t:cur,sp:first&&toks.length>0});first=false;cur=ch;
      }else cur+=ch;
    }
    if(cur)toks.push({t:cur,sp:first&&toks.length>0});
  }
  return toks;
}
const joinToks=(toks,i,j)=>{let s="";for(let k=i;k<j;k++)s+=(k>i&&toks[k].sp?" ":"")+toks[k].t;return s};

// 기본 줄바꿈: 어절이 중간에서 끊기지 않게, 들어가는 만큼 채워서 다음 줄로
function wrap(ctx,text,maxW){
  const toks=tokenize(ctx,text,maxW),lines=[];
  let i=0;
  while(i<toks.length){
    let j=i+1;
    while(j<toks.length&&ctx.measureText(joinToks(toks,i,j+1)).width<=maxW)j++;
    lines.push(joinToks(toks,i,j));i=j;
  }
  return lines;
}

// 부문명·성명이 정해진 폭을 넘으면 글자 크기를 줄여서 맞춤 (font 설정까지 수행)
function fitFont(c,text,maxW,size=38,min=24){
  for(;size>min;size-=2){
    c.font=`700 ${size}px ${F}`;
    if(c.measureText(text).width<=maxW)return;
  }
  c.font=`700 ${min}px ${F}`;
}

// 전통 금박 그라데이션 생성
function getGoldGrad(c,x0,y0,x1,y1){
  const g=c.createLinearGradient(x0,y0,x1,y1);
  g.addColorStop(0,"#b58428");
  g.addColorStop(0.25,"#eed284");
  g.addColorStop(0.5,"#c99933");
  g.addColorStop(0.75,"#fae9aa");
  g.addColorStop(1,"#9c6d1d");
  return g;
}

// 전통 코너 당초문 오너먼트
function drawCornerOrnament(c,x,y,scaleX,scaleY){
  c.save();
  c.translate(x,y);
  c.scale(scaleX,scaleY);
  c.lineWidth=2;

  // 코너 안쪽 꺾임선 (전통 뇌문/브라켓)
  c.beginPath();
  c.moveTo(0,40);
  c.lineTo(0,18);
  c.lineTo(18,18);
  c.lineTo(18,0);
  c.lineTo(40,0);
  c.stroke();

  // 대각선 당초문 덩굴/잎사귀
  c.beginPath();
  c.moveTo(6,6);
  c.quadraticCurveTo(24,14,32,32);
  c.quadraticCurveTo(14,24,6,6);
  c.stroke();

  c.beginPath();
  c.arc(8,8,3,0,Math.PI*2);
  c.fill();

  // 작은 잎사귀들
  c.beginPath();
  c.moveTo(22,8);
  c.quadraticCurveTo(34,10,38,20);
  c.quadraticCurveTo(30,18,22,8);
  c.stroke();

  c.beginPath();
  c.moveTo(8,22);
  c.quadraticCurveTo(10,34,20,38);
  c.quadraticCurveTo(18,30,8,22);
  c.stroke();

  // 외곽 장식 포인트
  c.beginPath();
  c.arc(42,0,2.5,0,Math.PI*2);
  c.arc(0,42,2.5,0,Math.PI*2);
  c.fill();

  c.restore();
}

// 정통 상장 금박 프레임
function drawAwardBorder(c,W,H){
  const x0=60, y0=60, x1=W-60, y1=H-60;
  const gold1=getGoldGrad(c,0,0,W,H);
  const gold2=getGoldGrad(c,W,0,0,H);

  // 1. 가장 바깥 얇은 금선
  c.strokeStyle=gold1;
  c.lineWidth=1.5;
  c.strokeRect(x0,y0,x1-x0,y1-y0);

  // 2. 주 금박 굵은 테두리 (안쪽 6px)
  const o1=8;
  c.strokeStyle=gold2;
  c.lineWidth=5;
  c.strokeRect(x0+o1,y0+o1,(x1-x0)-o1*2,(y1-y0)-o1*2);

  // 3. 미세 장식선 (안쪽 16px)
  const o2=16;
  c.strokeStyle=gold1;
  c.lineWidth=1.2;
  c.strokeRect(x0+o2,y0+o2,(x1-x0)-o2*2,(y1-y0)-o2*2);

  // 4. 안쪽 본문 프레임 (안쪽 34px)
  const o3=34;
  c.strokeStyle=gold2;
  c.lineWidth=2;
  c.strokeRect(x0+o3,y0+o3,(x1-x0)-o3*2,(y1-y0)-o3*2);

  // 5. 네 모서리 당초문 장식
  c.fillStyle=gold1;
  drawCornerOrnament(c,x0+o3,y0+o3,1,1);
  drawCornerOrnament(c,x1-o3,y0+o3,-1,1);
  drawCornerOrnament(c,x0+o3,y1-o3,1,-1);
  drawCornerOrnament(c,x1-o3,y1-o3,-1,-1);
}

// 상단 중앙 황금빛 엠블럼 (월계관 + 메달)
function drawEmblem(c,cx,cy){
  c.save();
  c.translate(cx,cy);
  const gold=getGoldGrad(c,-40,-40,40,40);
  c.strokeStyle=gold;
  c.fillStyle=gold;

  // 월계관 잎사귀들 (좌우 대칭)
  for(let dir of [-1,1]){
    for(let i=0;i<7;i++){
      const angle=0.25+i*0.35;
      const r=38;
      const lx=Math.cos(angle)*r*dir;
      const ly=Math.sin(angle)*r*0.8-4;
      c.save();
      c.translate(lx,ly);
      c.rotate(dir*(angle+0.4));
      c.beginPath();
      c.ellipse(0,0,10,4.5,0,0,Math.PI*2);
      c.fill();
      c.restore();
    }
  }

  // 하단 리본
  c.beginPath();
  c.moveTo(-16,28);
  c.quadraticCurveTo(0,24,16,28);
  c.lineTo(24,38);
  c.lineTo(12,35);
  c.lineTo(0,40);
  c.lineTo(-12,35);
  c.lineTo(-24,38);
  c.closePath();
  c.fill();

  // 중앙 원형 메달
  c.beginPath();
  c.arc(0,0,24,0,Math.PI*2);
  c.lineWidth=3;
  c.stroke();

  c.beginPath();
  c.arc(0,0,21,0,Math.PI*2);
  c.fillStyle="#ffffff";
  c.fill();

  c.beginPath();
  c.arc(0,0,19,0,Math.PI*2);
  c.strokeStyle=gold;
  c.lineWidth=1;
  c.stroke();

  // 중앙 한자 '賞' (상)
  c.fillStyle=gold;
  c.font='700 21px "Noto Serif KR", "Nanum Myeongjo", serif';
  c.textAlign="center";
  c.textBaseline="middle";
  c.fillText("賞",0,1);

  c.restore();
}

// 은은한 중앙 워터마크
function drawWatermark(c,W,H){
  c.save();
  c.translate(W/2,H/2-20);
  c.strokeStyle="rgba(190, 160, 100, 0.045)";
  c.lineWidth=5;
  c.beginPath();
  c.arc(0,0,220,0,Math.PI*2);
  c.stroke();
  c.beginPath();
  c.arc(0,0,190,0,Math.PI*2);
  c.lineWidth=2;
  c.stroke();

  c.fillStyle="rgba(190, 160, 100, 0.04)";
  c.font='700 160px "Noto Serif KR", "Nanum Myeongjo", serif';
  c.textAlign="center";
  c.textBaseline="middle";
  c.fillText("賞",0,0);
  c.restore();
}

// 정통 관인(직인) 렌더링
function drawSeal(c,cx,cy){
  c.save();
  c.translate(cx,cy);
  c.rotate(-0.02); // 아주 미세한 자연스러운 날인 각도

  // 맑고 선명한 전통 인주 붉은색
  const sealColor="rgba(196, 32, 24, 0.94)";
  c.strokeStyle=sealColor;
  c.fillStyle=sealColor;

  const size=96;
  const half=size/2;

  // 외곽선 (단정한 둥근 사각 테두리, 두께 5.5px)
  c.lineWidth=5.5;
  c.lineJoin="round";
  c.beginPath();
  if(c.roundRect){
    c.roundRect(-half,-half,size,size,8);
  }else{
    c.rect(-half,-half,size,size);
  }
  c.stroke();

  // 대한민국 표준 관인 가로쓰기 배치 (상단: 위, 원 / 하단: 장, 인 -> '위원장인')
  c.font='700 30px "Noto Serif KR", "Nanum Myeongjo", serif';
  c.textAlign="center";
  c.textBaseline="middle";

  const colL=-21; // 좌측 (위, 장)
  const colR=21;  // 우측 (원, 인)

  // 상단 행: 위 원
  c.fillText("위",colL,-18);
  c.fillText("원",colR,-18);

  // 하단 행: 장 인
  c.fillText("장",colL,18);
  c.fillText("인",colR,18);

  c.restore();
}

const F='"Nanum Myeongjo", "Noto Serif KR", "Batang", "Gungsuh", serif';
const LEFT=200,TEXT_W=600; // 번호·부문·성명·본문이 함께 쓰는 왼쪽 시작선과 본문 폭 (좌우 여백 동일)
let bgCache=null; // 항상 똑같은 배경(워터마크·테두리·엠블럼)은 한 번만 그려 재사용

function draw(name,a,reason,no){
  const W=1000,H=1440,cv=createCanvas(W,H),c=cv.getContext("2d");

  // 1~4. 고정 배경 (하얀 바탕 + 워터마크 + 금박 테두리 + 엠블럼): 최초 1회만 그림
  if(!bgCache){
    bgCache=createCanvas(W,H);
    const b=bgCache.getContext("2d");
    b.fillStyle="#ffffff";
    b.fillRect(0,0,W,H);
    drawWatermark(b,W,H);
    drawAwardBorder(b,W,H);
    drawEmblem(b,W/2,185);
  }
  c.drawImage(bgCache,0,0);

  // 5. 상장 번호 (좌측 상단 규격 배치)
  c.fillStyle="#222";
  c.textAlign="left";
  c.textBaseline="alphabetic";
  c.font=`700 24px ${F}`;
  c.fillText(`제 ${no} 호`,LEFT,190);

  // 6. 상장 제목 "상      장" (자간이 넓고 중후한 형태, 절대 위치로 브라우저 편차 방지)
  c.fillStyle="#111";
  c.textAlign="center";
  c.font=`800 88px ${F}`;
  c.fillText("상",W/2-105,355);
  c.fillText("장",W/2+105,355);

  // 7. 부문 및 수상자 정보 (단정하고 조화로운 폰트 크기 및 굵기)
  const infoX=LEFT;

  // 부문 라벨 및 부문명
  c.textAlign="left";
  c.font=`500 32px ${F}`;
  c.fillStyle="#444";
  c.fillText("부   문 :",infoX,475);
  c.fillStyle="#111";
  fitFont(c,a.name,LEFT+TEXT_W-(infoX+150));
  c.fillText(a.name,infoX+150,475);

  // 성명 라벨 및 수상자명 (부문명과 동일한 700 38px로 조화롭게 일치)
  c.fillStyle="#444";
  c.font=`500 32px ${F}`;
  c.fillText("성   명 :",infoX,548);

  const spacedName=name.split("").join(name.length===2?"       ":name.length<=6?"   ":" ");
  c.fillStyle="#111";
  fitFont(c,spacedName,LEFT+TEXT_W-(infoX+150));
  c.fillText(spacedName,infoX+150,548);

  // 8. 본문 (단정하고 장중한 문체와 세로 중앙 밸런스)
  c.textAlign="left";
  c.fillStyle="#1a1a1a";
  c.font=`600 36px ${F}`;

  const body=(reason?`위 사람은 ${reason} 이에 상장을 수여합니다.`:`위 사람은 ${a.reason} 이에 상장을 수여합니다.`).replace(/\s+/g," ");
  // 6줄에 안 들어가면 글자 크기를 조금씩 줄여서 맞춤
  let fs=36,lines;
  for(;;){
    c.font=`600 ${fs}px ${F}`;
    lines=wrap(c,body,TEXT_W);
    if(lines.length<=6||fs<=26)break;
    fs-=2;
  }
  lines=lines.slice(0,6);
  const lh=Math.round(fs*66/36);

  // 본문 줄 수에 따라 세로 높이 자동 정렬 (안정감 있는 시각 중심)
  const textCenterY=770;
  const startY=textCenterY-(lines.length*lh)/2+20;

  // 줄바꿈만 적용해 왼쪽부터 그대로 씀 (글자 간격을 늘리지 않음)
  lines.forEach((line,idx)=>c.fillText(line,LEFT,startY+idx*lh));

  // 9. 수여 일자 (중앙 하단)
  const d=new Date();
  c.textAlign="center";
  c.fillStyle="#222";
  c.font=`700 34px ${F}`;
  c.fillText(`${d.getFullYear()}년   ${d.getMonth()+1}월   ${d.getDate()}일`,W/2,1140);

  // 10. 수여 기관 및 직인 (글씨와 날인이 겹치지 않고 오른쪽에 깔끔하게 배치)
  const organTitle="중 앙 시 상 위 원 회   위 원 장";
  c.font=`800 46px ${F}`;
  c.fillStyle="#0a0a0a";

  const organWidth=c.measureText(organTitle).width;
  const sealGap=24; // 글씨와 직인 사이의 여백
  const sealSize=96;
  const totalWidth=organWidth+sealGap+sealSize;

  // 기관명과 직인을 묶어서 전체 상장 중앙에 정렬
  const startOrganX=(W-totalWidth)/2;
  const organY=1240;

  c.textAlign="left";
  c.fillText(organTitle,startOrganX,organY);

  // 직인은 '위원장' 글씨 우측에 겹치지 않게 단정하게 날인
  const sealCenterX=startOrganX+organWidth+sealGap+sealSize/2;
  drawSeal(c,sealCenterX,organY-15);
  return cv.toBuffer("image/png");
}

module.exports={draw};
