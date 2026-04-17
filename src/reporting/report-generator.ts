/**
 * Builds **standalone** HTML (with Chart.js from CDN), **JSON**, and **JUnit** reports from in-memory
 * {@link TestResult} rows — useful for custom pipelines or aggregating non-Playwright checks. This is
 * separate from Playwright's built-in HTML reporter (see repo `README`).
 *
 * @example Emit all formats after a synthetic run
 * ```ts
 * import { ReportGenerator } from 'pw-craft';
 * import { Logger } from 'pw-craft';
 *
 * const logger = new Logger();
 * const gen = new ReportGenerator(
 *   {
 *     outputDir: 'reports',
 *     formats: ['html', 'json', 'junit'],
 *     title: 'Nightly',
 *     theme: 'dark',
 *     colors: { primary: '#22d3ee' },
 *     metadata: { branch: 'main' },
 *   },
 *   logger,
 * );
 * gen.addResult({
 *   id: '1',
 *   name: 'Smoke',
 *   status: 'passed',
 *   durationMs: 1200,
 *   steps: [{ text: 'Open', status: 'passed', durationMs: 400 }],
 * });
 * await gen.generate();
 * ```
 */
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { PwCraftConfig, ReportingThemeColors } from '../config';
import { mergeReportingColors } from '../config';
import type { Logger } from '../helpers/logger';
import { formatDateForFilename } from '../helpers/utils';

export type TestStatus = 'passed' | 'failed' | 'skipped' | 'pending';

export interface TestStepResult {
  text: string;
  status: TestStatus;
  durationMs: number;
  error?: string;
  screenshot?: string;
}

export interface TestResult {
  id: string;
  name: string;
  status: TestStatus;
  durationMs: number;
  steps: TestStepResult[];
  tags?: string[];
  error?: string;
  screenshot?: string;
}

export interface SuiteStats {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  pending: number;
  durationMs: number;
}

export class ReportGenerator {
  private results: TestResult[] = [];

  constructor(
    private readonly config: PwCraftConfig['reporting'],
    private readonly logger: Logger,
  ) {}

  addResult(result: TestResult): void {
    this.results.push(result);
  }

  addResults(results: TestResult[]): void {
    this.results.push(...results);
  }

  getStats(): SuiteStats {
    const stats: SuiteStats = {
      total: this.results.length,
      passed: 0,
      failed: 0,
      skipped: 0,
      pending: 0,
      durationMs: 0,
    };
    for (const r of this.results) {
      stats.durationMs += r.durationMs;
      if (r.status === 'passed') stats.passed++;
      else if (r.status === 'failed') stats.failed++;
      else if (r.status === 'skipped') stats.skipped++;
      else stats.pending++;
    }
    return stats;
  }

  async generate(): Promise<string[]> {
    await fs.mkdir(this.config.outputDir, { recursive: true });
    const out: string[] = [];
    for (const f of this.config.formats) {
      if (f === 'html') out.push(await this.generateHtml());
      if (f === 'json') out.push(await this.generateJson());
      if (f === 'junit') out.push(await this.generateJunit());
    }
    return out;
  }

  async generateJson(): Promise<string> {
    const stats = this.getStats();
    const payload = {
      meta: {
        generatedAt: new Date().toISOString(),
        title: this.config.title,
        ...this.config.metadata,
      },
      stats,
      results: this.results,
    };
    const file = path.join(this.config.outputDir, 'pw-craft-report.json');
    await fs.writeFile(file, JSON.stringify(payload, null, 2), 'utf8');
    this.logger.info(`JSON report written: ${file}`);
    return file;
  }

  async generateJunit(): Promise<string> {
    const stats = this.getStats();
    const file = path.join(this.config.outputDir, 'pw-craft-junit.xml');
    const cases = this.results
      .map((r) => {
        const time = (r.durationMs / 1000).toFixed(3);
        const name = xmlEscape(r.name);
        if (r.status === 'failed') {
          return `<testcase name="${name}" time="${time}"><failure message="failed">${xmlEscape(r.error ?? 'failed')}</failure></testcase>`;
        }
        if (r.status === 'skipped') {
          return `<testcase name="${name}" time="${time}"><skipped/></testcase>`;
        }
        return `<testcase name="${name}" time="${time}"/>`;
      })
      .join('\n');
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites tests="${stats.total}" failures="${stats.failed}" skipped="${stats.skipped}" time="${(stats.durationMs / 1000).toFixed(3)}">
  <testsuite name="${xmlEscape(this.config.title)}" tests="${stats.total}" failures="${stats.failed}" skipped="${stats.skipped}" time="${(stats.durationMs / 1000).toFixed(3)}">
${cases}
  </testsuite>
</testsuites>`;
    await fs.writeFile(file, xml, 'utf8');
    this.logger.info(`JUnit report written: ${file}`);
    return file;
  }

  async generateHtml(): Promise<string> {
    const stats = this.getStats();
    const colors = mergeReportingColors(this.config.colors as Partial<ReportingThemeColors>);
    const file = path.join(this.config.outputDir, 'pw-craft-report.html');
    const chartCdn = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js';
    const scenariosJson = JSON.stringify(
      this.results.map((r) => ({
        ...r,
        steps: r.steps,
      })),
    );
    const metaRows = Object.entries(this.config.metadata)
      .map(([k, v]) => `<tr><th>${xmlEscape(k)}</th><td>${xmlEscape(v)}</td></tr>`)
      .join('');
    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${xmlEscape(this.config.title)}</title>
  <script src="${chartCdn}"></script>
  <style>
    :root{
      --bg:${colors.background};
      --surface:${colors.surface};
      --text:${colors.text};
      --muted:${colors.muted};
      --primary:${colors.primary};
      --ok:${colors.success};
      --bad:${colors.failure};
      --pending:${colors.pending};
    }
    *{box-sizing:border-box}
    body{margin:0;font:14px/1.45 system-ui,Segoe UI,Roboto,Arial;background:var(--bg);color:var(--text)}
    header{padding:20px 24px;border-bottom:1px solid rgba(255,255,255,.08);display:flex;gap:16px;align-items:center;justify-content:space-between;flex-wrap:wrap}
    h1{margin:0;font-size:20px}
    .grid{display:grid;grid-template-columns:320px 1fr;gap:16px;padding:16px}
    @media (max-width: 980px){.grid{grid-template-columns:1fr}}
    .card{background:var(--surface);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:12px}
    canvas{max-width:100%}
    .filters{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0}
    button.filter{border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:var(--text);padding:8px 10px;border-radius:10px;cursor:pointer}
    button.filter.active{outline:2px solid var(--primary)}
    input.search{width:100%;padding:10px 12px;border-radius:10px;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.25);color:var(--text)}
    details.scenario{border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:10px 12px;margin:10px 0;background:rgba(0,0,0,.15)}
    details.scenario summary{cursor:pointer;font-weight:600}
    .badge{font-size:12px;padding:2px 8px;border-radius:999px;border:1px solid rgba(255,255,255,.12);color:var(--muted)}
    .step{font-size:13px;color:var(--muted);margin:6px 0 0 12px}
    .ok{color:var(--ok)} .bad{color:var(--bad)} .pending{color:var(--pending)}
    table.meta{width:100%;border-collapse:collapse}
    table.meta th{text-align:left;color:var(--muted);font-weight:600;padding:6px 8px;width:220px;vertical-align:top}
    table.meta td{padding:6px 8px}
    .thumb{max-width:240px;border-radius:10px;border:1px solid rgba(255,255,255,.12);cursor:pointer}
    #lightbox{position:fixed;inset:0;background:rgba(0,0,0,.75);display:none;align-items:center;justify-content:center;padding:24px;z-index:50}
    #lightbox img{max-width:min(1100px,95vw);max-height:85vh;border-radius:12px}
    ${this.config.customCss ?? ''}
  </style>
</head>
<body>
  <header>
    <div>
      <h1>${xmlEscape(this.config.title)}</h1>
      <div class="badge">Generated ${xmlEscape(formatDateForFilename())}</div>
    </div>
    <div class="filters" id="filters">
      <button class="filter active" data-filter="all">All (${stats.total})</button>
      <button class="filter" data-filter="passed">Passed (${stats.passed})</button>
      <button class="filter" data-filter="failed">Failed (${stats.failed})</button>
      <button class="filter" data-filter="skipped">Skipped (${stats.skipped})</button>
    </div>
  </header>
  <div class="grid">
    <div class="card">
      <canvas id="donut" height="240"></canvas>
    </div>
    <div class="card">
      <canvas id="bar" height="240"></canvas>
    </div>
    <div class="card" style="grid-column:1/-1">
      <h2 style="margin:0 0 8px 0">Metadata</h2>
      <table class="meta">
        ${metaRows || '<tr><td class="muted">No metadata</td></tr>'}
      </table>
    </div>
    <div class="card" style="grid-column:1/-1">
      <input class="search" id="q" placeholder="Search scenarios…" />
      <div id="list"></div>
    </div>
  </div>
  <div id="lightbox" onclick="this.style.display='none'"><img id="lightboxImg" alt="screenshot" /></div>
  <script>
    const scenarios = ${scenariosJson};
    const colors = ${JSON.stringify(colors)};
    const donutCtx = document.getElementById('donut');
    const barCtx = document.getElementById('bar');
    new Chart(donutCtx, {
      type: 'doughnut',
      data: {
        labels: ['Passed','Failed','Skipped','Pending'],
        datasets: [{ data: [${stats.passed},${stats.failed},${stats.skipped},${stats.pending}], backgroundColor:[colors.success,colors.failure,'#64748b',colors.pending]}]
      },
      options:{plugins:{legend:{labels:{color:colors.text}}}}
    });
    new Chart(barCtx, {
      type: 'bar',
      data:{labels:['ms total'],datasets:[{label:'Duration',data:[${stats.durationMs}],backgroundColor:colors.primary}]},
      options:{plugins:{legend:{labels:{color:colors.text}}},scales:{x:{ticks:{color:colors.muted}},y:{ticks:{color:colors.muted}}}}}
    });
    const list = document.getElementById('list');
    const q = document.getElementById('q');
    let active = 'all';
    function esc(s){ return (s||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }
    function render(){
      const term = (q.value||'').toLowerCase();
      list.innerHTML = '';
      for (const s of scenarios){
        if(active !== 'all' && s.status !== active) continue;
        if(term && !((s.name||'') + ' ' + (s.tags||[]).join(' ')).toLowerCase().includes(term)) continue;
        const det = document.createElement('details');
        det.className = 'scenario';
        det.open = false;
        const sum = document.createElement('summary');
        sum.innerHTML = esc(s.name) + ' <span class="' + (s.status==='passed'?'ok':(s.status==='failed'?'bad':'pending')) + '">[' + esc(s.status) + ']</span>';
        det.appendChild(sum);
        if(s.error){ const e=document.createElement('div'); e.className='bad'; e.textContent=s.error; det.appendChild(e);}        
        if(s.screenshot){
          const img=document.createElement('img'); img.className='thumb'; img.src=s.screenshot; img.onclick=(ev)=>{ev.preventDefault(); const lb=document.getElementById('lightbox'); const i=document.getElementById('lightboxImg'); i.src=s.screenshot; lb.style.display='flex';};
          det.appendChild(img);
        }
        for(const st of (s.steps||[])){
          const d=document.createElement('div'); d.className='step ' + (st.status==='passed'?'ok':(st.status==='failed'?'bad':'pending'));
          d.textContent = '- ' + st.text + ' (' + st.status + ', ' + st.durationMs + 'ms)';
          det.appendChild(d);
          if(st.screenshot){
            const im=document.createElement('img'); im.className='thumb'; im.src=st.screenshot; im.onclick=(ev)=>{ev.preventDefault(); const lb=document.getElementById('lightbox'); const i=document.getElementById('lightboxImg'); i.src=st.screenshot; lb.style.display='flex';};
            det.appendChild(im);
          }
        }
        list.appendChild(det);
      }
    }
    q.addEventListener('input', render);
    for(const b of document.querySelectorAll('button.filter')){
      b.addEventListener('click',()=>{
        for(const x of document.querySelectorAll('button.filter')) x.classList.remove('active');
        b.classList.add('active');
        active = b.getAttribute('data-filter')||'all';
        render();
      });
    }
    render();
  </script>
</body>
</html>`;
    await fs.writeFile(file, html, 'utf8');
    this.logger.info(`HTML report written: ${file}`);
    return file;
  }
}

function xmlEscape(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

