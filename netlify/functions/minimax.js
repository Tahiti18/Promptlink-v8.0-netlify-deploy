const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  try {
    let message = "Say something intelligent.";
    if (event.body) {
      const body = JSON.parse(event.body);
      if (body.message) {
        message = body.message;
      }
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://thepromptlink.com',
        'X-Title': 'ThePromptLink Multi-Agent Platform'
      },
      body: JSON.stringify({
        model: "minimax/minimax-m1:extended",
        messages: [
          {
            role: "user", 
            content: message
          }
        ],
        max_tokens: 80000,
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ error: data })
      };
    }

    // 🔍 SIMPLE DEBUG - Show us EXACTLY what MiniMax sends
    const debugInfo = `
    <h3>MiniMax Response Debug:</h3>
    <pre>${JSON.stringify(data, null, 2)}</pre>
    `;

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        content: [{
          type: "text",
          text: debugInfo
        }]
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ error: error.toString() })
    };
  }
};
