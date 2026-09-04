import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const PDF_FILENAME = "Alpha-Freight-Directors-Agreement-Final.pdf";

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const targetUrl = `${origin}/directors-agreement`;

  let browser: Awaited<ReturnType<Awaited<typeof import("puppeteer")>["default"]["launch"]>> | null = null;

  try {
    const puppeteer = await import("puppeteer");
    browser = await puppeteer.default.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.goto(targetUrl, { waitUntil: "networkidle0", timeout: 90_000 });
    await page.evaluate(() => document.fonts.ready);

    // Remove floating UI that repeats on every printed page
    await page.evaluate(() => {
      document.querySelectorAll(".revenue-plan-no-print, [aria-label='Open Alpha Freight AI']").forEach((node) => {
        node.remove();
      });
      document.querySelectorAll("button.fixed, body > div.fixed").forEach((node) => {
        node.remove();
      });
    });

    await page.emulateMediaType("print");

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: false,
      margin: { top: "12mm", right: "14mm", bottom: "14mm", left: "14mm" },
    });

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${PDF_FILENAME}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[directors-agreement/pdf]", error);
    return NextResponse.json({ error: "PDF generation failed" }, { status: 500 });
  } finally {
    await browser?.close().catch(() => undefined);
  }
}
