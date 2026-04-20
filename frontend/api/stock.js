export default async function handler(req) {
  try {
    // FIX: safe URL parsing in Vercel
    const url = new URL(req.url, "http://localhost");
    const symbol = url.searchParams.get("symbol");

    if (!symbol) {
      return json({ error: "Symbol required" }, 400);
    }

    // FIX: prevent infinite hanging requests
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    let res;

    try {
      res = await fetch(
        `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0",
          },
          signal: controller.signal,
        }
      );
    } catch (err) {
      clearTimeout(timeout);
      return json(
        {
          error: "Request failed or timed out",
          message: err.message,
        },
        500
      );
    }

    clearTimeout(timeout);

    // FIX: avoid HTML → JSON crash
    const text = await res.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return json(
        {
          error: "Invalid response from Yahoo API",
          raw: text.slice(0, 150),
        },
        500
      );
    }

    return json(data, 200);
  } catch (err) {
    return json(
      {
        error: "Server crashed",
        message: err.message,
      },
      500
    );
  }
}

// helper (always returns proper JSON)
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}