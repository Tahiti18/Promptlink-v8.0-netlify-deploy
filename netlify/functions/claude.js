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
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',  // ✅ CLAUDE VIA OPENROUTER
        messages: [
          { role: 'user', content: message }
        ],
        max_tokens: 4000,
        temperature: 0.7
      })
    });

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      const textResponse = await response.text();
      console.log('Raw OpenRouter Claude response (non-JSON):', textResponse);
      return {
        statusCode: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          error: `OpenRouter returned non-JSON response: ${textResponse}` 
        })
      };
    }

    console.log('OpenRouter Claude Response:', JSON.stringify(data, null, 2));

    if (!response.ok || data.error) {
      console.error('OpenRouter Claude API Error:', JSON.stringify(data, null, 2));
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

    let finalText;
    if (data?.choices?.[0]?.message?.content && data.choices[0].message.content.trim() !== "") {
      finalText = data.choices[0].message.content;
      console.log('SUCCESS: Using content field');
    } else {
      finalText = `Response received - investigating format: ${JSON.stringify(data, null, 2)}`;
      console.log('DEBUG: Unknown format detected');
    }
    
    finalText = finalText
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>');

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
          text: finalText
        }]
      })
    };

  } catch (error) {
    console.error('Claude via OpenRouter Function Error:', error);
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
