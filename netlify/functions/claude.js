const fetch = require("node-fetch");

exports.handler = async (event, context) => {
  try {
    let message = "Say something intelligent.";
    if (event.body) {
      const body = JSON.parse(event.body);
      if (body.message) {
        message = body.message;
      }
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: message
          }
        ]
      })
    });

    const data = await response.json();

    console.log("FULL RAW RESPONSE:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error("Claude RAW JSON:", JSON.stringify(data, null, 2));
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: data })
      };
    }

    const finalText = (data?.content || [])
      .filter(part => part.type === "text" && part.text)
      .map(part => part.text)
      .join(" ");

    return {
      statusCode: 200,
      body: JSON.stringify({
        reply: finalText || JSON.stringify(data)
      })
    };

  } catch (err) {
    console.error("Server Function Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.toString() })
    };
  }
};
