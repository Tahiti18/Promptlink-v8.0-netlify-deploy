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

    // SiliconFlow MiniMax-M1-80k Integration - Premium 80K Thinking Budget
    const response = await fetch('https://api.ap.siliconflow.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SILICONFLOW_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'MiniMaxAI/MiniMax-M1-80k',
        messages: [
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 4096,
        temperature: 0.7,
        extra_body: {
          "thinking_budget": 1024  // Premium reasoning capability
        }
      })
    });

    const data = await response.json();
    console.log('SiliconFlow MiniMax-M1-80k Response:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('SiliconFlow API Error:', JSON.stringify(data, null, 2));
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

    // ✅ PARSE OPENAI-COMPATIBLE RESPONSE FORMAT
    let finalText;
    if (data?.choices?.[0]?.message?.content) {
      finalText = data.choices[0].message.content;
    } else {
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
