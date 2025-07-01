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
        model: 'minimax/minimax-01',  // ✅ CHANGED TO MINIMAX-01
        messages: [
          { role: 'user', content: message }
        ],
        max_tokens: 4000,
        temperature: 0.7
      })
    });

    // ✅ FIXED JSON PARSING WITH ERROR HANDLING
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      const textResponse = await response.text();
      console.log('Raw OpenRouter response (non-JSON):', textResponse);
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

    console.log('OpenRouter MiniMax-01 Response:', JSON.stringify(data, null, 2));

    if (!response.ok || data.error) {
      console.error('OpenRouter MiniMax-01 API Error:', JSON.stringify(data, null, 2));
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

    // ✅ FIXED RESPONSE PARSING - Handle both content AND reasoning fields
    let finalText;
    if (data?.choices?.[0]?.message?.content && data.choices[0].message.content.trim() !== "") {
      // Standard content response
      finalText = data.choices[0].message.content;
      console.log('SUCCESS: Using content field');
    } else if (data?.choices?.[0]?.message?.reasoning) {
      // Use reasoning field when content is empty
      finalText = data.choices[0].message.reasoning;
      console.log('SUCCESS: Using reasoning field');
    } else {
      // Debug fallback
      finalText = `Response received - investigating format: ${JSON.stringify(data, null, 2)}`;
      console.log('DEBUG: Unknown format detected');
    }
    
    // ✅ FORMAT TEXT WITH PROPER LINE BREAKS
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
    console.error('MiniMax-01 Function Error:', error);
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
