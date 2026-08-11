/**
 * Local E2E smoke for Algonova Quest (?dev=1)
 * Run: node scripts/e2e-smoke.mjs
 */
const { chromium } = require("playwright");

const BASE = process.env.BASE_URL || "http://127.0.0.1:8080";

async function visible(page, sel) {
  const el = page.locator(sel);
  await el.waitFor({ state: "visible", timeout: 8000 });
  return el;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const logs = [];
  page.on("console", (m) => logs.push(`[${m.type()}] ${m.text()}`));
  page.on("pageerror", (e) => logs.push(`[pageerror] ${e.message}`));

  const fails = [];
  const ok = (name) => console.log("OK ", name);
  const fail = (name, err) => {
    console.log("FAIL", name, err || "");
    fails.push(name + (err ? `: ${err}` : ""));
  };

  try {
    await page.goto(`${BASE}/index.html?dev=1`, { waitUntil: "networkidle" });
    await visible(page, "#phase-login");
    ok("login visible");

    // scripts loaded
    const hasAudio = await page.evaluate(() => typeof AlgoAudio !== "undefined");
    const hasStory = await page.evaluate(() => typeof getBriefingPanels === "function");
    if (!hasAudio) fail("AlgoAudio missing"); else ok("AlgoAudio");
    if (!hasStory) fail("story.js missing"); else ok("story.js");

    await page.fill("#input-username", "TEST-001");
    await page.fill("#input-name", "Tester Lokal");
    await page.fill("#input-age", "11");
    await page.click("#btn-login");

    await visible(page, "#phase-level-select");
    ok("level-select");

    // age 11 → suggested sd-kelas-4-6, but pick SMP
    await page.click('.level-card[data-level="smp"]');
    await visible(page, "#phase-briefing");
    ok("briefing after level");

    // 3 briefing panels
    for (let i = 0; i < 3; i++) {
      await page.click("#btn-brief-next");
      await page.waitForTimeout(200);
    }
    await visible(page, "#phase-diagnostic");
    ok("diagnostic after briefing");

    const level = await page.evaluate(() => STATE.level);
    if (level !== "smp") fail("level should be smp", level); else ok("level=smp");

    // answer 5 diagnostic questions (always pick first choice, then next)
    for (let i = 0; i < 5; i++) {
      await page.locator("#diag-choices .choice").first().click();
      await page.waitForTimeout(150);
      await page.click("#diag-next-btn");
      await page.waitForTimeout(250);
    }

    await visible(page, "#phase-case-intro");
    ok("case-intro after diagnostic");

    // wait load
    await page.waitForFunction(() => {
      const btn = document.getElementById("btn-start-case");
      return btn && !btn.disabled && /Mulai investigasi/.test(btn.textContent || "");
    }, { timeout: 10000 });

    const countText = await page.locator("#intro-count").innerText();
    const count = Number(countText);
    if (!(count >= 20)) fail("intro count < 20", countText); else ok(`misi count=${count}`);

    const qLen = await page.evaluate(() => STATE.questions.length);
    if (!(qLen >= 20)) fail("STATE.questions < 20", qLen); else ok(`STATE.questions=${qLen}`);

    // ensure not stuck on login / fallback tiny bank
    const usedFallback = await page.evaluate(() => !!STATE.usedFallback);
    if (usedFallback) fail("usedFallback true in game path"); else ok("not fallback");

    await page.click("#btn-start-case");
    // story overlay bab 1
    await visible(page, "#story-overlay.show");
    ok("chapter story overlay");
    await page.click("#story-overlay .btn-primary");
    await visible(page, "#phase-game");
    ok("game phase");

    const mission = await page.locator("#game-mission").innerText();
    if (!/01/.test(mission)) fail("mission not 01", mission); else ok(`mission ${mission}`);

    // answer one game question wrong then hint path briefly
    await page.locator("#game-choices .choice").nth(0).click(); // may be wrong
    await page.waitForTimeout(250);
    // if hint shown, ok
    const hintShown = await page.locator("#btn-hint.show").count();
    const fbShow = await page.locator("#game-feedback.show").count();
    if (hintShown || fbShow) ok("attempt/hint or feedback"); else fail("no attempt feedback");

    // mute toggle exists
    const mute = await page.locator("#btn-mute").innerText();
    if (!/Suara/.test(mute)) fail("mute btn"); else ok("mute btn");
    await page.click("#btn-mute");
    const mute2 = await page.locator("#btn-mute").innerText();
    if (!/Mati|Nyala/.test(mute2)) fail("mute toggle"); else ok(`mute → ${mute2}`);

    // ui.js loaded
    const hasUI = await page.evaluate(() => typeof AlgoUI !== "undefined");
    if (!hasUI) fail("AlgoUI"); else ok("AlgoUI");

    // jump to certificate populate
    await page.evaluate(() => {
      STATE.username = "TEST-001";
      STATE.studentName = "Tester Lokal";
      STATE.level = "smp";
      STATE.xp = 500;
      STATE.correct = 20;
      STATE.questions = { length: 30 };
      STATE.typeScores = { analyst: 5, speedster: 1, investigator: 1, codebreaker: 1, explorer: 1 };
      showCertificate();
    });
    await visible(page, "#phase-certificate");
    const certName = await page.locator("#cert-name").innerText();
    if (certName !== "Tester Lokal") fail("cert name", certName); else ok("certificate");
    const seal = await page.locator(".cert-seal").count();
    if (!seal) fail("cert seal"); else ok("cert seal");

    // admin page loads
    const admin = await page.goto(`${BASE}/admin.html`, { waitUntil: "domcontentloaded" });
    if (!admin || admin.status() !== 200) fail("admin.html"); else ok("admin.html");

  } catch (e) {
    fail("exception", e.message);
  }

  const pageErrors = logs.filter((l) => l.startsWith("[pageerror]"));
  // /api/* 404 di python http.server = normal (fallback ke public/questions)
  if (pageErrors.length) {
    console.log("--- page errors ---");
    pageErrors.slice(0, 20).forEach((l) => console.log(l));
    fail("page errors", String(pageErrors.length));
  }

  await browser.close();
  console.log("\nRESULT:", fails.length ? `FAILED (${fails.length})` : "PASSED");
  if (fails.length) {
    fails.forEach((f) => console.log(" -", f));
    process.exit(1);
  }
})();
