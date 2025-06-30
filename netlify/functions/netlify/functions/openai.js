import fetch from 'node-fetch';

exports.handler = async (event) => {
  console.log("🚀 Starting OpenAI function...");
  console.log("🔑 OPENAI KEY:", process.env.OPENAI_API_KEY);

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
    const userPrompt = body.message || "Say hello from OpenAI.";

    if (!process.env.OPENAI_API_KEY) {
      console.log("🚨 OPENAI_API_KEY is undefined! Check Netlify env settings.");
    }

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "user", content: userPrompt }
        ]
      })
    });

    const rawText = await openaiResponse.text();
    console.log("📝 Raw response from OpenAI:", rawText);

    if (!openaiResponse.ok) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: rawText })
      };
    }

    const data = JSON.parse(rawText);
    const reply = data.choices?.[0]?.message?.content || "No response text.";

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: reply })
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
