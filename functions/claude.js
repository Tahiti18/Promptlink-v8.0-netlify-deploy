exports.handler = async (event) => {
  console.log("🚀 Starting Claude function...");
  console.log("🔑 ANTHROPIC KEY:", process.env.ANTHROPIC_API_KEY);

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const body = JSON.parse(event.body);
    const userPrompt = body.message || "Say hello.";
    console.log("📨 User prompt:", userPrompt);

    if (!process.env.ANTHROPIC_API_KEY) {
      console.log("🚨 ANTHROPIC_API_KEY is undefined! Check Netlify env settings.");
    }

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-3-opus-20240229",
        max_tokens: 600,
        messages: [
          {
            role: "user",
            content: `${userPrompt}`
          }
        ]
      })
    });

    const rawText = await anthropicResponse.text();
    console.log("📝 Raw response from Anthropic:", rawText);

    if (!anthropicResponse.ok) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: rawText })
      };
    }

    const data = JSON.parse(rawText);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.log("🔥 Caught error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
