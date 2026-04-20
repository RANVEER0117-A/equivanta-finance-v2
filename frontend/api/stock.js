export default async function handler(request) {
  try {
    const urlObj = new URL(request.url, "http://localhost");
    const symbol = urlObj.searchParams.get("symbol");

    if (!symbol) {
      return new Response(JSON.stringify({ error: "Symbol required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const API_KEY = process.env.FINNHUB_API_KEY;

    if (!API_KEY) {
      return new Response(
        JSON.stringify({ error: "Missing API key" }),
        { status: 500 }
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEY}`,
      { signal: controller.signal }
    );

    clearTimeout(timeout);

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(
      JSON.stringify({
        error: "Request failed",
        message: err.message,
      }),
      { status: 500 }
    );
  }
}