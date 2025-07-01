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
        model: 'minimax/abab6.5s-chat',
        messages: [
          { role: 'user', content: message }
        ],
        max_tokens: 80000,
        temperature: 0.7
      })
    });

    const data = await response.json();
    console.log('OpenRouter MiniMax FULL Response:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('OpenRouter MiniMax API Error:', JSON.stringify(data, null, 2));
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

    // ✅ FLEXIBLE RESPONSE PARSING - Try multiple possible formats
    let finalText = '';
    
    if (data?.choices?.[0]?.message?.content) {
      // Standard OpenAI/OpenRouter format
      finalText = data.choices[0].message.content;
      console.log('SUCCESS: Standard format detected');
    } else if (data?.message) {
      // Alternative format 1
      finalText = data.message;
      console.log('SUCCESS: Alternative format 1 detected');
    } else if (data?.text) {
      // Alternative format 2
      finalText = data.text;
      console.log('SUCCESS: Alternative format 2 detected');
    } else if (data?.content) {
      // Alternative format 3
      finalText = data.content;
      console.log('SUCCESS: Alternative format 3 detected');
    } else if (typeof data === 'string') {
      // Direct string response
      finalText = data;
      console.log('SUCCESS: Direct string format detected');
    } else {
      // Debug: Show exact structure received
      finalText = `DEBUG - MiniMax response structure: ${JSON.stringify(data, null, 2)}`;
      console.log('DEBUG: Unknown format, showing structure');
    }
    
    // ✅ FORMAT TEXT WITH PROPER LINE BREAKS (matching Claude/ChatGPT)
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
    console.error('MiniMax Function Error:', error);
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
