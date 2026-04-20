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

    const response = await fetch(
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
      }
    );

    const text = await response.text(); // 👈 IMPORTANT

    let data;
    try {
      data = JSON.parse(text); // safe parse
    } catch (e) {
      return new Response(
        JSON.stringify({
          error: "Invalid response from Yahoo",
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
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "s-maxage=60",
      },
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