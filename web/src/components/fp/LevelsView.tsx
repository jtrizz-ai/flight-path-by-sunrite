'use client';

// Levels — SunRite Field Team rank system.
// Faithful port of levels.html: hero wordmark + cloud band, "The Climb" intro,
// three earned tiers (embroidered badge art), an at-a-glance matrix, and a live
// earnings calculator. All styling is scoped under `.lv` so it never leaks into
// the rest of the app; the day/night toggle flips the `.lv.day` class.

import Link from 'next/link';
import { useState } from 'react';

const CSS = `
.lv{
  --bg:#060607;--bg-2:#0c0c10;--ink:#FFFFFF;--ink-2:rgba(255,255,255,.72);--ink-3:rgba(255,255,255,.45);
  --line:rgba(255,255,255,.16);--accent:#E8472A;--accent-2:#FF8A5B;--cloud-blend:screen;--grain-opacity:.07;
  --font-display:"Archivo","Archivo Black",sans-serif;--font-mono:"JetBrains Mono",Menlo,monospace;--font-sans:"Archivo",sans-serif;
  --sp-1:4px;--sp-2:8px;--sp-3:12px;--sp-4:16px;--sp-5:24px;--sp-6:32px;--sp-7:48px;--sp-8:64px;
  --r-sm:6px;--r-md:10px;--r-lg:14px;--r-full:999px;
  position:relative;min-height:100vh;font-family:var(--font-sans);color:var(--ink);
  -webkit-font-smoothing:antialiased;
  background:radial-gradient(120% 120% at 70% -10%, var(--bg-2) 0%, var(--bg) 55%);
  transition:background .6s,color .6s;
}
.lv.day{--bg:#A9CCEA;--bg-2:#E4F0FA;--ink:#0B1B2B;--ink-2:rgba(11,27,43,.72);--ink-3:rgba(11,27,43,.5);--line:rgba(11,27,43,.18);--grain-opacity:.05}
.lv *,.lv *::before,.lv *::after{box-sizing:border-box;margin:0;padding:0}
.lv .grain{position:absolute;inset:0;z-index:80;pointer-events:none;opacity:var(--grain-opacity);mix-blend-mode:overlay;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.lv .stage{position:relative;width:100%;height:100vh;min-height:640px;overflow:hidden}
.lv .planet{position:absolute;border-radius:50%;isolation:isolate}
.lv .planet-lg{width:46vmin;height:46vmin;top:7%;left:50%;transform:translateX(-30%);
  background:radial-gradient(circle at 36% 30%,#FFB089,#F0673E 26%,#C8331C 48%,#6F1A10 72%,#240806);
  box-shadow:0 0 120px 10px rgba(232,71,42,.25),inset -22px -28px 90px rgba(0,0,0,.6)}
.lv .planet-sm{width:14vmin;height:14vmin;bottom:14%;left:8%;
  background:radial-gradient(circle at 38% 32%,#FFC39E,#EE6F45 30%,#B23A1F 60%,#3A0D07);
  box-shadow:0 0 60px 4px rgba(232,71,42,.22),inset -10px -14px 40px rgba(0,0,0,.6)}
.lv .clouds{position:absolute;left:50%;bottom:-2%;transform:translateX(-50%);width:135%;max-width:1700px;
  pointer-events:none;z-index:5;mix-blend-mode:var(--cloud-blend);filter:saturate(1.05) contrast(1.02)}
.lv .clouds img{width:100%;display:block}
.lv .frame{position:absolute;inset:0;z-index:10;padding:clamp(20px,3.2vw,44px);display:grid;grid-template-rows:auto 1fr auto}
.lv .row{display:flex;justify-content:space-between;align-items:flex-start;gap:20px}
.lv .row.bottom{align-items:flex-end}
.lv .brand{display:flex;align-items:center;gap:12px}
.lv .brand svg{width:28px;height:28px;color:var(--ink)}
.lv .brand .bt{font-family:var(--font-mono);font-weight:700;font-size:12px;line-height:1.15;letter-spacing:.14em;text-transform:uppercase;color:var(--ink)}
.lv .brand .bt span{display:block;color:var(--ink-3);font-weight:500}
.lv .stack{display:flex;gap:34px;font-family:var(--font-mono);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--ink-2);text-align:right}
.lv .stack ul{list-style:none;display:flex;flex-direction:column;gap:7px}
.lv .hero{align-self:center;justify-self:center;text-align:center;display:flex;flex-direction:column;align-items:center;transform:translateY(-3%)}
.lv .eyebrow{font-family:var(--font-mono);font-size:clamp(10px,1vw,13px);letter-spacing:.5em;text-transform:uppercase;color:var(--ink-2);margin-bottom:clamp(10px,1.6vw,22px);padding-left:.5em}
.lv .wordmark{font-family:var(--font-display);font-weight:900;font-size:clamp(74px,21vw,300px);line-height:.82;letter-spacing:-.01em;text-transform:uppercase;color:var(--ink);text-shadow:0 8px 60px rgba(0,0,0,.35)}
.lv.day .wordmark{text-shadow:0 8px 40px rgba(11,27,43,.18)}
.lv .sub{font-family:var(--font-mono);font-size:clamp(10px,.95vw,12px);letter-spacing:.34em;text-transform:uppercase;color:var(--ink-3);margin-top:clamp(12px,1.8vw,24px)}
.lv .caption{font-family:var(--font-mono);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--ink-2);max-width:360px;line-height:1.7}
.lv .scrollcue{font-family:var(--font-mono);font-size:10px;letter-spacing:.3em;text-transform:uppercase;color:var(--ink-3);display:flex;align-items:center;gap:8px}
.lv .toggle{position:fixed;right:clamp(16px,3vw,40px);bottom:clamp(16px,3vw,40px);z-index:90;display:inline-flex;align-items:center;gap:10px;padding:9px 14px;border:1px solid var(--line);border-radius:var(--r-full);background:rgba(12,12,16,.5);backdrop-filter:blur(8px);font-family:var(--font-mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-2);cursor:pointer;transition:border-color .3s,color .3s}
.lv.day .toggle{background:rgba(228,240,250,.5)}
.lv .toggle:hover{border-color:var(--ink-3);color:var(--ink)}
.lv .toggle svg{width:15px;height:15px}
.lv .toggle .lbl{opacity:.45;transition:opacity .3s;display:inline-flex;align-items:center;gap:6px}
.lv .toggle .lbl.on{opacity:1;color:var(--ink)}
.lv .toggle .divider{width:1px;height:13px;background:var(--line)}
.lv .back{position:fixed;left:clamp(16px,3vw,40px);bottom:clamp(16px,3vw,40px);z-index:90;display:inline-flex;align-items:center;gap:8px;padding:9px 14px;border:1px solid var(--line);border-radius:var(--r-full);background:rgba(12,12,16,.5);backdrop-filter:blur(8px);font-family:var(--font-mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-2);cursor:pointer;transition:border-color .3s,color .3s;text-decoration:none}
.lv.day .back{background:rgba(228,240,250,.5)}
.lv .back:hover{border-color:var(--ink-3);color:var(--ink)}
.lv .wrap{position:relative;z-index:2;max-width:1120px;margin:0 auto;padding:0 clamp(20px,5vw,48px)}
.lv .section{padding:clamp(64px,11vw,140px) 0}
.lv .kicker{font-family:var(--font-mono);font-size:12px;letter-spacing:.34em;text-transform:uppercase;color:var(--accent-2);margin-bottom:var(--sp-5)}
.lv .h2{font-family:var(--font-display);font-weight:900;text-transform:uppercase;font-size:clamp(34px,6vw,72px);line-height:.92;letter-spacing:-.01em}
.lv .lede{font-size:clamp(17px,2vw,22px);line-height:1.6;color:var(--ink-2);max-width:700px;margin-top:var(--sp-6)}
.lv .lede strong{color:var(--ink);font-weight:700}
.lv .metrics{display:flex;flex-wrap:wrap;gap:var(--sp-6);margin-top:var(--sp-7)}
.lv .metric{font-family:var(--font-mono);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--ink-3);border-left:1px solid var(--line);padding-left:var(--sp-4)}
.lv .metric b{display:block;font-family:var(--font-sans);font-size:15px;letter-spacing:0;text-transform:none;color:var(--ink);margin-top:6px}
.lv .tier{display:grid;grid-template-columns:minmax(0,400px) 1fr;gap:clamp(28px,5vw,64px);align-items:center;padding:clamp(40px,6vw,72px) 0;border-top:1px solid var(--line)}
.lv .tier-badge{position:relative;border-radius:var(--r-lg);overflow:hidden;border:1px solid var(--line);background:rgba(255,255,255,.02);transition:box-shadow .4s,transform .4s}
.lv .tier-badge img{width:100%;display:block}
.lv .tier:hover .tier-badge{box-shadow:0 0 0 1px var(--accent),0 30px 80px rgba(232,71,42,.16);transform:translateY(-4px)}
.lv .tier-rank{font-family:var(--font-mono);font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:var(--ink-3);display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.lv .tier-rank .chip{border:1px solid var(--line);border-radius:var(--r-full);padding:4px 10px;color:var(--ink-2)}
.lv .tier-name{font-family:var(--font-display);font-weight:900;text-transform:uppercase;font-size:clamp(28px,4.4vw,52px);line-height:.95;margin:var(--sp-4) 0 var(--sp-5)}
.lv .tier-desc{color:var(--ink-2);font-size:16px;line-height:1.65;max-width:520px}
.lv .specs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1px;background:var(--line);border:1px solid var(--line);border-radius:var(--r-md);overflow:hidden;margin:var(--sp-6) 0}
.lv .spec{background:var(--bg);padding:var(--sp-5) var(--sp-4)}
.lv.day .spec{background:var(--bg-2)}
.lv .spec .l{font-family:var(--font-mono);font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--ink-3);min-height:24px}
.lv .spec .v{font-family:var(--font-display);font-size:clamp(20px,2.4vw,28px);margin-top:8px;line-height:1}
.lv .spec .u{font-family:var(--font-mono);font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-3);margin-top:6px}
.lv .apparel{display:flex;align-items:center;gap:12px;font-family:var(--font-mono);font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-2);border:1px dashed var(--line);border-radius:var(--r-md);padding:var(--sp-4)}
.lv .apparel svg{width:18px;height:18px;color:var(--accent-2);flex:none}
.lv .apparel b{color:var(--ink);font-family:var(--font-sans);font-weight:700;letter-spacing:0;text-transform:none}
.lv .flavor{margin-top:var(--sp-5);font-style:italic;color:var(--ink-3);font-size:15px;border-left:2px solid var(--accent);padding-left:var(--sp-4)}
.lv .matrix{width:100%;border-collapse:collapse;margin-top:var(--sp-7);font-size:14px}
.lv .matrix th,.lv .matrix td{text-align:left;padding:var(--sp-4) var(--sp-4);border-bottom:1px solid var(--line)}
.lv .matrix th{font-family:var(--font-mono);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--ink-3);font-weight:500}
.lv .matrix td:first-child{font-family:var(--font-mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-2)}
.lv .matrix tbody tr:hover{background:rgba(255,255,255,.03)}
.lv.day .matrix tbody tr:hover{background:rgba(11,27,43,.04)}
.lv .calc{display:grid;grid-template-columns:1fr 1fr;gap:clamp(28px,5vw,56px);margin-top:var(--sp-7);align-items:start}
.lv .controls{display:flex;flex-direction:column;gap:var(--sp-6)}
.lv .ctrl .clabel{display:flex;justify-content:space-between;align-items:baseline;font-family:var(--font-mono);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--ink-2);margin-bottom:var(--sp-3)}
.lv .ctrl .cval{color:var(--ink);font-weight:700;font-size:14px}
.lv input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:6px;border-radius:var(--r-full);background:linear-gradient(90deg,var(--accent),var(--accent-2)) no-repeat,var(--line);background-size:50% 100%;outline:none;cursor:pointer}
.lv input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:20px;height:20px;border-radius:50%;background:var(--ink);border:3px solid var(--accent);box-shadow:0 2px 10px rgba(0,0,0,.45)}
.lv input[type=range]::-moz-range-thumb{width:18px;height:18px;border-radius:50%;background:var(--ink);border:3px solid var(--accent)}
.lv .chint{font-family:var(--font-mono);font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-3);margin-top:10px}
.lv .result{border:1px solid var(--line);border-radius:var(--r-lg);padding:clamp(24px,3vw,38px);background:rgba(255,255,255,.02)}
.lv .result .rtier{font-family:var(--font-mono);font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:var(--accent-2)}
.lv .bignum{font-family:var(--font-display);font-size:clamp(40px,7vw,76px);line-height:1;margin:var(--sp-3) 0 var(--sp-2)}
.lv .rsub{font-family:var(--font-mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-3)}
.lv .rstats{display:flex;gap:var(--sp-7);margin-top:var(--sp-5);flex-wrap:wrap}
.lv .rstat .l{font-family:var(--font-mono);font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--ink-3)}
.lv .rstat .v{font-size:18px;font-weight:700;margin-top:4px}
.lv .cmp{margin-top:var(--sp-6);display:flex;flex-direction:column;gap:var(--sp-4)}
.lv .cmptitle{font-family:var(--font-mono);font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--ink-3);margin-bottom:var(--sp-2)}
.lv .bar{display:grid;grid-template-columns:104px 1fr auto;align-items:center;gap:var(--sp-4)}
.lv .bar .bl{font-family:var(--font-mono);font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-2)}
.lv .track{height:10px;border-radius:var(--r-full);background:var(--line);overflow:hidden}
.lv .fill{height:100%;width:0;border-radius:var(--r-full);background:var(--ink-3);transition:width .45s ease}
.lv .bar.active .fill{background:linear-gradient(90deg,var(--accent),var(--accent-2))}
.lv .bar.active .bl{color:var(--accent-2)}
.lv .bar .bv{font-family:var(--font-mono);font-size:12px;color:var(--ink-2)}
.lv .delta{margin-top:var(--sp-6);font-family:var(--font-mono);font-size:12px;letter-spacing:.04em;line-height:1.6;color:var(--ink-2);border-top:1px solid var(--line);padding-top:var(--sp-4)}
.lv .delta b{color:var(--accent-2)}
.lv .foot{border-top:1px solid var(--line);margin-top:var(--sp-8);padding:var(--sp-7) 0 var(--sp-8);font-family:var(--font-mono);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--ink-3);display:flex;justify-content:space-between;flex-wrap:wrap;gap:16px}
@media(max-width:760px){.lv .tier{grid-template-columns:1fr}.lv .specs{grid-template-columns:1fr}.lv .calc{grid-template-columns:1fr}.lv .stack{display:none}.lv .bar{grid-template-columns:84px 1fr auto}}
`;

function money(x: number) {
  return '$' + Math.round(x).toLocaleString('en-US');
}

function tierOf(k: number) {
  if (k >= 35) return { key: 'st', name: 'Stratosphere Club', rate: 0.3 };
  if (k >= 28) return { key: 'al', name: 'Altitude Club', rate: 0.25 };
  if (k >= 21) return { key: 'hf', name: 'High Flyer', rate: 0.2 };
  return { key: 'base', name: 'Pre-Flight (below High Flyer)', rate: 0.15 };
}

function rangeFill(value: number, min: number, max: number) {
  return `${((value - min) / (max - min)) * 100}% 100%`;
}

export function LevelsView() {
  const [day, setDay] = useState(false);
  const [contracts, setContracts] = useState(28);
  const [rate, setRate] = useState(70);
  const [size, setSize] = useState(10);

  const installs = Math.round((contracts * rate) / 100);
  const watts = size * 1000;
  const tier = tierOf(contracts);
  const earn = installs * watts * tier.rate;
  const eHF = installs * watts * 0.2;
  const eAL = installs * watts * 0.25;
  const eST = installs * watts * 0.3;
  const maxE = Math.max(eST, 1);

  const bar = (key: string, name: string, value: number) => (
    <div className={`bar${tier.key === key ? ' active' : ''}`}>
      <span className="bl">{name}</span>
      <div className="track">
        <div className="fill" style={{ width: `${(value / maxE) * 100}%` }} />
      </div>
      <span className="bv">{money(value)}</span>
    </div>
  );

  return (
    <div className={`lv${day ? ' day' : ''}`}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="grain" />

      <Link href="/flight-path" className="back">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M19 12H5M11 18l-6-6 6-6" />
        </svg>
        Flight Path
      </Link>

      <button className="toggle" onClick={() => setDay((d) => !d)} aria-label="Toggle day or night">
        <span className={`lbl${day ? ' on' : ''}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </svg>
          Day
        </span>
        <span className="divider" />
        <span className={`lbl${day ? '' : ' on'}`}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
          </svg>
          Night
        </span>
      </button>

      <section className="stage">
        <div className="planet planet-lg" />
        <div className="planet planet-sm" />
        <div className="clouds">
          <img src="/images/levels_clouds.jpg" alt="" />
        </div>
        <div className="frame">
          <div className="row">
            <div className="brand">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l2.4 6.8H21l-5.3 4 2 6.8L12 15.6 6.3 19.6l2-6.8L3 8.8h6.6z" />
              </svg>
              <div className="bt">
                SUNRITE<span>FIELD TEAM</span>
              </div>
            </div>
            <div className="stack">
              <ul>
                <li>HIGH FLYER</li>
                <li>ALTITUDE</li>
                <li>STRATOSPHERE</li>
              </ul>
              <ul>
                <li>GROWTH</li>
                <li>HARD WORK</li>
                <li>ALTITUDE</li>
              </ul>
            </div>
          </div>
          <div className="hero">
            <div className="eyebrow">Earn Your Altitude</div>
            <div className="wordmark">Levels</div>
            <div className="sub">Three Tiers · One Flight Path</div>
          </div>
          <div className="row bottom">
            <div className="caption">
              A Field Marketer rank system
              <br />
              built on volume, grit &amp; the climb.
            </div>
            <div className="scrollcue">
              Scroll
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 5v14M6 13l6 6 6-6" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="kicker">The Climb</div>
          <h2 className="h2">
            Badges aren&rsquo;t given.
            <br />
            They&rsquo;re earned.
          </h2>
          <p className="lede">
            Every Field Marketer starts on the same runway. Your rank reflects the{' '}
            <strong>quality leads you put into the pipeline</strong> — and the contracts they close. Climb the
            tiers, raise your rate, and unlock club gear earned by no one below you.
          </p>
          <div className="metrics">
            <div className="metric">
              Measured By<b>Closed Contracts / Qtr (from your leads)</b>
            </div>
            <div className="metric">
              Paid On<b>Installed Systems ($/Watt)</b>
            </div>
            <div className="metric">
              Unlocks<b>Higher Rate + Club Gear</b>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="kicker">The Tiers</div>

          <div className="tier">
            <div className="tier-badge">
              <img src="/images/levels_tier1.jpg" alt="High Flyer embroidered badge" />
            </div>
            <div className="tier-info">
              <div className="tier-rank">
                <span className="chip">Tier 01</span> Entry · Proven Lead Generator
              </div>
              <div className="tier-name">High Flyer</div>
              <div className="specs">
                <div className="spec">
                  <div className="l">Requirement</div>
                  <div className="v">21+</div>
                  <div className="u">Closed / Qtr From Leads</div>
                </div>
                <div className="spec">
                  <div className="l">Commission</div>
                  <div className="v">$0.20</div>
                  <div className="u">Per Watt Installed</div>
                </div>
                <div className="spec">
                  <div className="l">Paid Per Install</div>
                  <div className="v">$2,000</div>
                  <div className="u">@ 10kW Avg System</div>
                </div>
              </div>
              <div className="apparel">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 3l5 3-2 4-2-1v12H7V9L5 10 3 6l5-3 2 2h4z" />
                </svg>
                <span>
                  Unlocks <b>High Flyer Club Gear</b> — personalized apparel earned only at this tier.
                </span>
              </div>
              <p className="tier-desc">
                You&rsquo;re feeding the pipeline. The quality leads you generate are converting into signed
                contracts — and you&rsquo;ve earned your first rate bump.
              </p>
              <div className="flavor">You&rsquo;ve proven you can do the work and fill the pipeline.</div>
            </div>
          </div>

          <div className="tier">
            <div className="tier-badge">
              <img src="/images/levels_tier2.jpg" alt="Altitude Club embroidered badge" />
            </div>
            <div className="tier-info">
              <div className="tier-rank">
                <span className="chip">Tier 02</span> Mid · High-Volume Lead Engine
              </div>
              <div className="tier-name">Altitude Club</div>
              <div className="specs">
                <div className="spec">
                  <div className="l">Requirement</div>
                  <div className="v">28+</div>
                  <div className="u">Closed / Qtr From Leads</div>
                </div>
                <div className="spec">
                  <div className="l">Commission</div>
                  <div className="v">$0.25</div>
                  <div className="u">Per Watt Installed</div>
                </div>
                <div className="spec">
                  <div className="l">Paid Per Install</div>
                  <div className="v">$2,500</div>
                  <div className="u">@ 10kW Avg System</div>
                </div>
              </div>
              <div className="apparel">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 3l5 3-2 4-2-1v12H7V9L5 10 3 6l5-3 2 2h4z" />
                </svg>
                <span>
                  Unlocks <b>Altitude Club Gear</b> — personalized apparel earned only at this tier.
                </span>
              </div>
              <p className="tier-desc">
                Your doors are driving serious volume. Sales is closing deal after deal off the leads you
                provide, and your pay per watt reflects it.
              </p>
              <div className="flavor">Cruising altitude. The closers count on your doors.</div>
            </div>
          </div>

          <div className="tier">
            <div className="tier-badge">
              <img src="/images/levels_tier3.jpg" alt="Stratosphere Club embroidered badge" />
            </div>
            <div className="tier-info">
              <div className="tier-rank">
                <span className="chip">Tier 03</span> Elite · Top Of The Field
              </div>
              <div className="tier-name">Stratosphere Club</div>
              <div className="specs">
                <div className="spec">
                  <div className="l">Requirement</div>
                  <div className="v">35+</div>
                  <div className="u">Closed / Qtr From Leads</div>
                </div>
                <div className="spec">
                  <div className="l">Commission</div>
                  <div className="v">$0.30</div>
                  <div className="u">Per Watt Installed</div>
                </div>
                <div className="spec">
                  <div className="l">Paid Per Install</div>
                  <div className="v">$3,000</div>
                  <div className="u">@ 10kW Avg System</div>
                </div>
              </div>
              <div className="apparel">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 3l5 3-2 4-2-1v12H7V9L5 10 3 6l5-3 2 2h4z" />
                </svg>
                <span>
                  Unlocks <b>Stratosphere Club Gear</b> — personalized apparel earned only at this tier.
                </span>
              </div>
              <p className="tier-desc">
                You&rsquo;ve broken the atmosphere. The top lead-generators in the field — your doors fuel the
                most installs, and you&rsquo;re paid like it.
              </p>
              <div className="flavor">The best in the field. The air is thin up here.</div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="kicker">At A Glance</div>
          <h2 className="h2">The Flight Path</h2>
          <table className="matrix">
            <thead>
              <tr>
                <th>Metric</th>
                <th>High Flyer</th>
                <th>Altitude Club</th>
                <th>Stratosphere Club</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Closed Contracts / Qtr (from your leads)</td>
                <td>21+</td>
                <td>28+</td>
                <td>35+</td>
              </tr>
              <tr>
                <td>Commission Rate</td>
                <td>$0.20 / watt</td>
                <td>$0.25 / watt</td>
                <td>$0.30 / watt</td>
              </tr>
              <tr>
                <td>Paid Per Installed System (10kW avg)</td>
                <td>$2,000</td>
                <td>$2,500</td>
                <td>$3,000</td>
              </tr>
              <tr>
                <td>Standing</td>
                <td>Proven Lead Generator</td>
                <td>High-Volume Lead Engine</td>
                <td>Elite — Top Of The Field</td>
              </tr>
              <tr>
                <td>Apparel</td>
                <td>High Flyer Club Gear</td>
                <td>Altitude Club Gear</td>
                <td>Stratosphere Club Gear</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="kicker">Calculator</div>
          <h2 className="h2">Run Your Numbers</h2>
          <p className="lede">
            Drag the bars to see your quarter. Your <strong>tier</strong> is set by closed contracts from your
            leads; your <strong>pay</strong> is per watt on every system that actually installs.
          </p>
          <div className="calc">
            <div className="controls">
              <div className="ctrl">
                <div className="clabel">
                  <span>Closed Contracts / Quarter</span>
                  <span className="cval">{contracts}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={60}
                  step={1}
                  value={contracts}
                  onChange={(e) => setContracts(Number(e.target.value))}
                  style={{ backgroundSize: rangeFill(contracts, 0, 60) }}
                />
                <div className="chint">Signed contracts sales closes from the leads you provide.</div>
              </div>
              <div className="ctrl">
                <div className="clabel">
                  <span>Install Rate</span>
                  <span className="cval">{rate}%</span>
                </div>
                <input
                  type="range"
                  min={40}
                  max={100}
                  step={1}
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                  style={{ backgroundSize: rangeFill(rate, 40, 100) }}
                />
                <div className="chint">% of contracts that reach install. 70% is a respectable, recommended rate.</div>
              </div>
              <div className="ctrl">
                <div className="clabel">
                  <span>Avg System Size</span>
                  <span className="cval">{size.toFixed(1)} kW</span>
                </div>
                <input
                  type="range"
                  min={4}
                  max={16}
                  step={0.5}
                  value={size}
                  onChange={(e) => setSize(Number(e.target.value))}
                  style={{ backgroundSize: rangeFill(size, 4, 16) }}
                />
                <div className="chint">Average installed system size, in kilowatts.</div>
              </div>
            </div>
            <div className="result">
              <div className="rtier">{tier.name}</div>
              <div className="bignum">{money(earn)}</div>
              <div className="rsub">
                Est. quarterly earnings · <span>{money(earn * 4)} / yr</span>
              </div>
              <div className="rstats">
                <div className="rstat">
                  <div className="l">Installs / Qtr</div>
                  <div className="v">{installs}</div>
                </div>
                <div className="rstat">
                  <div className="l">Your Rate</div>
                  <div className="v">${tier.rate.toFixed(2)} / watt</div>
                </div>
              </div>
              <div className="cmp">
                <div className="cmptitle">Same volume, every tier</div>
                {bar('hf', 'High Flyer', eHF)}
                {bar('al', 'Altitude', eAL)}
                {bar('st', 'Stratosphere', eST)}
              </div>
              <div className="delta">
                {tier.key === 'base' && (
                  <>
                    Hit <b>21 closed contracts</b> to reach High Flyer and unlock $0.20 / watt.
                  </>
                )}
                {tier.key === 'hf' && (
                  <>
                    Reach <b>Altitude Club (28)</b> and earn {money(eAL - eHF)} more this quarter at this volume.
                  </>
                )}
                {tier.key === 'al' && (
                  <>
                    Reach <b>Stratosphere (35)</b> and earn {money(eST - eAL)} more this quarter at this volume.
                  </>
                )}
                {tier.key === 'st' && (
                  <>
                    Top tier locked in — you&rsquo;re earning the max $0.30 / watt. 🚀
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="foot">
            <span>SunRite Solar — Levels</span>
            <span>Earn Your Altitude</span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default LevelsView;
