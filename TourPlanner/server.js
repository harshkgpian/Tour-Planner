const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { user_interaction_agent, generate_queries,developTourPlan  } = require('./LLM');  // Import the user interaction agent function

const app = express();
const PORT = 3000;

// Initialize in-memory user session storage
let userSession = { previousMessages: [], userPreferences: {} };

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Middleware
app.use(bodyParser.json());
app.use(cors());

// API endpoint to handle user interaction and collect preferences
app.post('/api/chat', async (req, res) => {
    const userMessage = req.body.message;
  
    if (!userMessage) {
      return res.status(400).send({ error: "Message is required" });
    }
  
    // Ensure previousMessages is always an array
    if (!Array.isArray(userSession.previousMessages)) {
      userSession.previousMessages = [];
    }
  
    // Add the user message to previous messages in the session
    userSession.previousMessages.push({ role: 'user', content: userMessage });
  
    try {
      // Call the user_interaction_agent function to gather user preferences
      const assistantReply = await user_interaction_agent(userSession.previousMessages, userSession.userPreferences);
  
      // Log the user preferences
      console.log("User Preferences:", JSON.stringify(assistantReply.userPreferences, null, 2));
  
      // Update the session with the assistant's response and updated user preferences
      userSession.previousMessages.push({ role: 'assistant', content: assistantReply.userReply });
      userSession.userPreferences = { ...assistantReply.userPreferences };
  
      // If the response is complete, call the generate_queries function
      if (assistantReply.complete) {
        // const generatedQueries = await generate_queries(userSession.userPreferences);
        const optimizedTourPlan = await developTourPlan(userSession.userPreferences);
        res.send({
            reply: assistantReply.userReply,
            userPreferences: assistantReply.userPreferences,
            generating: false, // Indicate that generation is done
            tourPlan: optimizedTourPlan, // Send the generated tour plan
          });
        } else {
          // Otherwise, just send the usual response
          res.send({
            reply: assistantReply.userReply,
            userPreferences: assistantReply.userPreferences,
            generating: false,
          });
        }
      } catch (error) {
        console.error("Error while processing the request:", error);
        res.status(500).send({ error: "Internal Server Error" });
      }
    });
// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
