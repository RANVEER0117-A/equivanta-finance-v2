export default async function handler(request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol");

    if (!symbol) {
      return new Response(JSON.stringify({ error: "Symbol required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const API_KEY = process.env.FINNHUB_API_KEY;

    if (!API_KEY) {
      return new Response(
        JSON.stringify({ error: "API key missing in environment variables" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEY}`;

    const response = await fetch(url);

    const text = await response.text(); // safer than .json()

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return new Response(
        JSON.stringify({
          error: "Invalid JSON from Finnhub",
          raw: text.slice(0, 200),
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(
      JSON.stringify({
        error: "Function crashed",
        message: err.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}