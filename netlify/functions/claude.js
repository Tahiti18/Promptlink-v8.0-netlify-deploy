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

    // ✅ IMPROVED JSON PARSING WITH ERROR HANDLING
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      const textResponse = await response.text();
      console.log('Raw Claude response (non-JSON):', textResponse);
      return {
        statusCode: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          error: `Claude returned non-JSON response: ${textResponse}` 
        })
      };
    }

    console.log("Claude Sonnet 4.0 Response:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error("Claude API Error:", JSON.stringify(data, null, 2));
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

    // ✅ IMPROVED RESPONSE PARSING WITH FALLBACKS
    let finalText;
    if (data?.content?.[0]?.text) {
      finalText = data.content[0].text;
      console.log('SUCCESS: Using content[0].text field');
    } else if (data?.content?.[0]?.content) {
      finalText = data.content[0].content;
      console.log('SUCCESS: Using content[0].content field');
    } else if (data?.message) {
      finalText = data.message;
      console.log('SUCCESS: Using message field');
    } else {
      finalText = `Response received - investigating format: ${JSON.stringify(data, null, 2)}`;
      console.log('DEBUG: Unknown format detected');
    }
    
    // ✅ FORMAT TEXT WITH PROPER LINE BREAKS
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

  } catch (err) {
    console.error("Claude Function Error:", err);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ error: err.toString() })
    };
  }
};
