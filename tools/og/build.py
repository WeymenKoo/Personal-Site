#!/usr/bin/env python3
"""
build.py: draws dusk/assets/img/og-card.png, the 1200x627 link preview (LinkedIn, etc.).

It is made from the site's own sprite code, so the picture always matches the site:
the sky's craft and the fine-pixel Space Shuttle from fx.js, the bar's drinks from fx.js,
and the research subs and the hunter-killer from depths.js. Spacecraft across the top,
drinks on the neon horizon, subs along the bottom.

Run:  python3 tools/og/build.py      (needs: pip install playwright; a Chromium:
      `npx playwright install chromium`, or set CHROMIUM_PATH to an installed Chrome)
"""
import base64, os, re, sys, tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FX, DP = (ROOT / "dusk/assets/fx.js").read_text(), (ROOT / "dusk/assets/depths.js").read_text()
OUT = ROOT / "dusk/assets/img/og-card.png"


def span(src, a, b, incl_b=False):
    i = src.index(a); j = src.index(b, i)
    return src[i:j + (len(b) if incl_b else 0)]


SPR = span(FX, "  var SPR = {", "\n  };", True)
SPRITE = span(FX, "  function sprite(name, scale, flip) {", "\n  }\n", True)
SHUTTLE = re.sub(r"function cityPx\(\) \{[^\n]*\}", "function cityPx() { return 2; }",
                 span(FX, "    var SH, STK, STC, SRB, SHUT = {}, fineP = 0;", "    rebuildShuttle();"))
HELPERS = span(DP, "  function canvas(w, h)", "  var FONT")
FLEET = span(DP, "  var DSV = {", "  var IMG = {};")

COMPOSE = r"""
rebuildShuttle();
function up(c,k){var o=el("canvas");o.width=c.width*k;o.height=c.height*k;var x=o.getContext("2d");x.imageSmoothingEnabled=false;x.drawImage(c,0,0,o.width,o.height);return o;}
var O=document.getElementById("out"),g=O.getContext("2d");g.imageSmoothingEnabled=false;
var W=1200,H=627;
/* sky into sea, the site's own colours, in hard 3 px bands */
var stops=[[0,[13,8,32]],[.34,[30,15,63]],[.48,[74,26,92]],[.52,[24,20,62]],[.7,[18,36,86]],[1,[7,11,34]]];
for(var y=0;y<H;y+=3){var t=y/H,i=0;while(t>stops[i+1][0])i++;var a=stops[i],b=stops[i+1],f=(t-a[0])/(b[0]-a[0]);
  g.fillStyle="rgb("+[0,1,2].map(function(k){return Math.round(a[1][k]+(b[1][k]-a[1][k])*f);}).join()+")";g.fillRect(0,y,W,3);}
var R=(function(s){return function(){s=(s*16807)%2147483647;return s/2147483647;};})(42);
for(var i=0;i<140;i++){g.fillStyle=R()<.15?"#ffd36e":"#efe4ff";var s=R()<.12?3:2;g.fillRect(Math.round(R()*W/3)*3,Math.round(R()*H*.42/3)*3,s,s);}
for(i=0;i<40;i++){g.fillStyle="rgba(190,230,255,.5)";g.fillRect(Math.round(R()*W/3)*3,Math.round((.72+R()*.26)*H/3)*3,3,3);}
g.fillStyle="#ff3ea5";g.fillRect(0,Math.round(H*.505),W,2);              /* the horizon, a neon line */
function band(list,y0,y1,maxK){
  var k=maxK,fit=function(k){return list.reduce(function(s,c){return s+c.c.width*(c.k||k);},0);};
  while(k>1&&fit(k)+20*(list.length+1)>W)k--;
  list.forEach(function(c){c.k=c.k||k;});
  var tot=fit(k),gap=(W-tot)/(list.length+1),x=gap;
  list.forEach(function(c){var im=up(c.c,c.k),yy=Math.round((y0+y1)/2-im.height/2);g.drawImage(im,Math.round(x),yy);x+=im.width+gap;});
}
var chunky=["ship","alien","starship","station","falconheavy","hubble","roadster","capsule"].map(function(n){return {c:sprite(n,1)};});
band(chunky.slice(0,4).concat([{c:SH,k:1},{c:STK,k:1}]).concat(chunky.slice(4)),18,300,4);
band(["martini","rocks","highball","wine","pint","mug","tokkuri","coconut","hurricane","tiki","margarita","oj","watermelon","lassi","boba"].map(function(n){return {c:sprite(n,1)};}),318,402,5);
var subs=["bathy","alvin","dsc","trieste","shinkai","lf","jiaolong","mir"].map(function(k){return {c:pix(DSV[k].w,DSV[k].h,DSV[k].draw)};});
subs.splice(4,0,{c:pix(HK.w,HK.h,drawHunter)});
band(subs,420,615,2);
window.done=O.toDataURL("image/png");
"""

HTML = ('<!doctype html><html><body style="margin:0"><canvas id="out" width="1200" height="627"></canvas><script>(function(){'
        'function el(t){return document.createElement(t);}\n' + SPR + SPRITE + SHUTTLE + HELPERS + FLEET + COMPOSE + '})();</script></body></html>')

if __name__ == "__main__":
    from playwright.sync_api import sync_playwright
    with tempfile.TemporaryDirectory() as d, sync_playwright() as p:
        page_file = Path(d) / "og.html"; page_file.write_text(HTML)
        kw = {"executable_path": os.environ["CHROMIUM_PATH"]} if os.environ.get("CHROMIUM_PATH") else {}
        b = p.chromium.launch(**kw); pg = b.new_page(viewport={"width": 1200, "height": 627})
        errors = []; pg.on("pageerror", lambda e: errors.append(str(e)))
        pg.goto(page_file.as_uri()); pg.wait_for_function("window.done")
        if errors: sys.exit("og card failed: " + "; ".join(errors))
        OUT.write_bytes(base64.b64decode(pg.evaluate("window.done").split(",")[1]))
        b.close()
    print("wrote", OUT)
