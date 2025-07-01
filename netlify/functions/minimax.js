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

    // AI4Chat MiniMax-01 FREE API Integration
    const response = await fetch('https://app.ai4chat.co/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AI4CHAT_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'MiniMax-01',
        messages: [
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        language: 'English',
        tone: 'Default'
      })
    });

    const data = await response.json();
    console.log('AI4Chat MiniMax-01 Response:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('AI4Chat API Error:', JSON.stringify(data, null, 2));
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

    // ✅ PARSE AI4CHAT RESPONSE FORMAT
    let finalText;
    if (data?.choices?.[0]?.message?.content) {
      // Standard AI4Chat format (OpenAI-compatible)
      finalText = data.choices[0].message.content;
    } else {
      // Fallback with debug info
      finalText = `Response received - investigating format: ${JSON.stringify(data, null, 2)}`;
    }
    
    // ✅ FORMAT TEXT WITH PROPER LINE BREAKS (matching Claude/ChatGPT)
    finalText = finalText
      .replace(/\n\n/g, '</p><p>')  // Double line breaks = new paragraphs
      .replace(/\n/g, '<br>')       // Single line breaks = <br>
      .replace(/^/, '<p>')          // Start with paragraph
      .replace(/$/, '</p>');        // End with paragraph

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
