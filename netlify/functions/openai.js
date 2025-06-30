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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.1",
        messages: [
          { role: "user", content: message }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: data })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ reply: data.choices[0].message.content })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
