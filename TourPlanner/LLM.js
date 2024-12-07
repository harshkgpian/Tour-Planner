const axios = require('axios');
const { googleArticleSearch, fetchFullArticle } = require('./API');
class OpenAIAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = "https://api.openai.com/v1";
    this.headers = {
      "Authorization": `Bearer ${this.apiKey}`,
      "Content-Type": "application/json"
    };
  }

  async chatCompletion(messages, model = "gpt-4o-mini-2024-07-18") {
    const endpoint = `${this.baseUrl}/chat/completions`;

    const payload = {
      model: model,
      messages: messages,
      temperature: 0.3
    };

    try {
      const response = await axios.post(endpoint, payload, { headers: this.headers });
      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error(`Error: ${error.message}`);
      return "Sorry, I couldn't process your request.";
    }
  }
}

const apiKey = "API";
const client = new OpenAIAPI(apiKey);



async function user_interaction_agent(previousMessages = [], userPreferences = {}) {  
    if (!Array.isArray(previousMessages)) {  
        previousMessages = [];  
    }  

    if (typeof userPreferences !== 'object') {  
        userPreferences = {};  
    }  

    const userInteractionPrompt = `  
    You are a tour planning assistant. You must respond with ONLY valid JSON.  

    Current preferences: ${JSON.stringify(userPreferences)}  

    RESPOND ONLY WITH VALID JSON IN THIS EXACT FORMAT:  
    {  
        "userReply": "<your conversational response here>",  
        "userPreferences": {  
            "city": "<city value>",  
            "timings": "<timings value>",  
            "budget": "<budget value>",  
            "interests": "<interests value>",  
            "startingPoint": "<starting point value>"  
        },  
        "complete": false  
    }  

    Instructions for generating response:  
    1. Analyze the user's last message  
    2. Update any provided preferences  
    3. Keep existing preferences if not mentioned  
    4. Ask for the next missing information  
    5. Set complete to true only if all preferences are filled, city, timings, budget, intersets, starting point. If something is overlooked ask for it.
    // 6. Once you have all information, say "Thanks, I will be now developing an optimize tour plan for you."

    Previous messages for context:  
    ${JSON.stringify(previousMessages)}  


    Make sure to respond with a proper valid json.
    `;  

    try {  
        const response = await client.chatCompletion([  
            {  
                role: "system",  
                content: "You are a JSON-only response tour assistant. Always respond with valid JSON containing userReply string, userPreferences array and a boolean."  
            },  
            { role: "user", content: userInteractionPrompt },  
            ...previousMessages  
        ]);  

        console.log("Raw response:", response); // Debug log  

        let parsedResponse;  
        try {  
            // Handle potential markdown formatting and remove non-JSON text
            let jsonString = response;
            if (response.includes('```json')) {
                jsonString = response.split('```json')[1].split('```')[0].trim();
            }
            // Remove any leading or trailing characters that are not part of JSON
            jsonString = jsonString.replace(/^[^{]/g, '').replace(/[^}]$/g, '');
            
            parsedResponse = JSON.parse(jsonString);  
        } catch (parseError) {  
            console.error("Parse error:", parseError);  
            // Return structured response if parsing fails  
            parsedResponse = {  
                userReply: "I couldn't understand that properly. Could you please tell me which city you'd like to visit?",  
                userPreferences: { ...userPreferences },  
                complete: false  
            };  
        }  

        // Ensure we maintain existing preferences
        const updatedPreferences = {  
            city: parsedResponse.userPreferences?.city || userPreferences.city || "",  
            timings: parsedResponse.userPreferences?.timings || userPreferences.timings || "",  
            budget: parsedResponse.userPreferences?.budget || userPreferences.budget || "",  
            interests: parsedResponse.userPreferences?.interests || userPreferences.interests || "",  
            startingPoint: parsedResponse.userPreferences?.startingPoint || userPreferences.startingPoint || ""  
        };  

        // Check if all preferences are filled
        const isComplete = Object.values(updatedPreferences).every(value => value && value.trim() !== "");  

        return {  
            userReply: parsedResponse.userReply,  
            userPreferences: updatedPreferences,  
            complete: isComplete  
        };  

    } catch (error) {  
        console.error("Error in user_interaction_agent:", error);  
        return {  
            userReply: "I encountered an error. Could you please try again?",  
            userPreferences: userPreferences,  
            complete: false  
        };  
    }  
}


async function optimization_agent(userPreferences, placeInfo) {
    if (typeof userPreferences !== 'object' || !userPreferences) {
        throw new Error("Invalid user preferences provided.");
    }
    // if (!Array.isArray(placeInfo) || placeInfo.length === 0) {
    //     throw new Error("Place information must be an array with at least one entry.");
    // }

    // Prompt to generate optimized plan
    const optimizationPrompt = `  
    You are a travel optimization assistant. Use the provided user preferences and place information to create the most optimal travel plan, including weather considerations based on the location and season from the place information.  

    User Preferences:  
    ${JSON.stringify(userPreferences)}  

    Place Information and Related Articles:  
    ${placeInfo}  

    Respond with ONLY valid JSON in the following format:  
    {  
        "optimizedPlan": [  
            {  
                "place": "<name of the place>",  
                "visitTime": "<suggested time to visit>",  
                "activity": "<primary activity>",  
                "cost": "<estimated cost>",  
                "transportationMode": {  
                    "type": "<walking/taxi/public_transport>",  
                    "cost": "<transportation cost>",  
                    "duration": "<estimated travel time>"  
                },  
                "weatherConsiderations": {  
                    "expectedConditions": "<typical weather for this time/season>",  
                    "recommendations": ["<weather-based recommendations>"]  
                }  
            }  
        ],  
        "pathOptimization": {  
            "totalTransportationCost": "<total transport cost>",  
            "transportationBreakdown": [  
                {  
                    "from": "<starting point>",  
                    "to": "<destination>",  
                    "recommendedMode": "<transport mode>",  
                    "cost": "<segment cost>",  
                    "duration": "<segment duration>",  
                    "reason": "<explanation for this transport choice>"  
                }  
            ]  
        },  
        "seasonalConsiderations": {  
            "season": "<current/planned season>",  
            "typicalWeather": "<typical weather patterns>",  
            "generalRecommendations": ["<season-specific recommendations>"]  
        },  
        "totalCost": "<total estimated cost including transportation>",  
        "totalTime": "<total estimated time including transportation>",  
        "budgetAnalysis": {  
            "remainingBudget": "<remaining budget after all activities>",  
            "transportationAllocation": "<amount allocated to transportation>",  
            "activitiesAllocation": "<amount allocated to activities>"  
        }  
    }  

    Instructions for optimization:  
    1. Analyze the place information to determine typical weather patterns and seasonal considerations.  
    2. Prioritize user interests and budget constraints.  
    3. Maximize the number of preferred activities while staying within time and cost constraints.  
    4. Optimize the sequence to minimize travel time and maximize efficiency.  
    5. Optimize transportation modes based on budget availability:  
       - Calculate cost-effectiveness of different transport options  
       - Suggest taxi for longer distances if budget permits  
       - Consider typical weather conditions when recommending transport modes  
    6. Include weather and seasonal considerations:  
       - Suggest indoor alternatives for typically rainy/hot periods  
       - Include specific gear recommendations based on typical weather  
       - Adjust timing of outdoor activities based on typical weather patterns  
    7. Ensure the total cost does not exceed the user's budget.  
    8. If any preference cannot be met, explain in the optimized plan.  
    `;  
    try {
        const response = await client.chatCompletion([
            {
                role: "system",
                content: "You are a JSON-only optimization assistant. Always respond with valid JSON containing an optimized travel plan."
            },
            {
                role: "user",
                content: optimizationPrompt
            }
        ]);

        console.log("Raw response:", response); // Debug log

        // Parse the response to ensure it's valid JSON
        let parsedResponse;
        try {
            let jsonString = response;
            if (response.includes('```json')) {
                jsonString = response.split('```json')[1].split('```')[0].trim();
            }
            jsonString = jsonString.replace(/^[^{]/g, '').replace(/[^}]$/g, '');

            parsedResponse = JSON.parse(jsonString);
        } catch (parseError) {
            console.error("Parse error:", parseError);
            throw new Error("Failed to parse optimization response.");
        }

        return parsedResponse; // Return the parsed optimized plan

    } catch (error) {
        console.error("Error in optimization_agent:", error);
        return {
            optimizedPlan: [],
            totalCost: 0,
            totalTime: "0 hours",
            error: "Could not generate an optimized plan due to an error."
        };
    }
}



async function generate_queries(userPreferences) {
    if (typeof userPreferences !== 'object' || !userPreferences) {
        throw new Error("Invalid user preferences provided.");
    }

    // Create a prompt for the LLM to generate search keywords
    const prompt = `
    You are a smart assistant specializing in travel planning. Based on the following user preferences, generate a comprehensive list of search queries to find the best articles, blogs, guides, and information sources to help create an optimized travel plan. The queries should cover:
    
    1. **Places to Visit & Activities**: Identify top attractions, cultural experiences, adventure activities, and local recommendations suitable for the travel dates.
    
    2. **Cost Details**: Gather information on estimated expenses for accommodations, transportation, activities, meals, and any hidden costs specific to the destination.
    
    3. **Time Constraints**: Provide recommendations for itineraries that maximize the experience based on available time, including tips for efficient travel routes.
    
    4. **Weather Forecast**: Search for reliable weather forecasts for the destination during the travel period, including average temperatures, rainfall, and seasonal considerations.
    
    5. **News & Events**: Identify any recent or upcoming events, local festivals, or activities that may enhance the experience. Additionally, fetch news about any disruptions, such as political events, strikes, or natural disasters, that might affect the trip.
    
    Ensure the search queries are specific, concise, and tailored to the traveler's destination, dates, and preferences.
    
    User Preferences:  
    ${JSON.stringify(userPreferences)}

    Respond with ONLY valid JSON in this format:
    {
        "queries": [
            "<search query 1>",
            "<search query 2>",
            "<search query 3>"
        ]
    }
    `;

    try {
        const response = await client.chatCompletion([
            {
                role: "system",
                content: "You are a JSON-only assistant. Always respond with valid JSON containing search queries."
            },
            {
                role: "user",
                content: prompt
            }
        ]);

        console.log("Raw response:", response); // Debug log

        // Parse the response to ensure it's valid JSON
        let parsedResponse;
        try {
            let jsonString = response;
            if (response.includes('```json')) {
                jsonString = response.split('```json')[1].split('```')[0].trim();
            }
            jsonString = jsonString.replace(/^[^{]/g, '').replace(/[^}]$/g, '');

            parsedResponse = JSON.parse(jsonString);
        } catch (parseError) {
            console.error("Parse error:", parseError);
            throw new Error("Failed to parse query generation response.");
        }

        return parsedResponse.queries; // Return the generated search queries

    } catch (error) {
        console.error("Error in generate_queries:", error);
        return [];
    }
}
async function searchAndProcessArticles(queries) {
    let allArticlesContent = ""; // Variable to hold all articles' content concatenated
    const maxArticles = 3; // Limit to 3 articles

    // Fetch at most 3 articles based on the queries
    for (let i = 0; i < queries.length && i < maxArticles; i++) {
        const query = queries[i];
        console.log(`Searching for: "${query}"`);

        // Step 1: Find article URL using Google Search
        const articleUrl = await googleArticleSearch(query);
        if (!articleUrl) {
            console.log("No article found for this query.");
            continue;
        }
        console.log(`Found article URL: ${articleUrl}`);

        // Step 2: Fetch article content using Puppeteer
        const articleContent = await fetchFullArticle(articleUrl);
        if (articleContent) {
            console.log(`Fetched article content for "${query}":\n`, articleContent);

            // Step 3: Append the article content to the combined content string
            allArticlesContent += `\n\n--- Article for Query: "${query}" ---\n${articleContent}`;
        } else {
            console.log("Failed to retrieve the article content.");
        }
    }

    // Return the combined content of the fetched articles
    return allArticlesContent;
}



// const userPreferences = {
//     city: "Paris",
//     interests: "art, history, museums",
//     budget: 150,
//     timings: "10:00 AM - 6:00 PM",
//     startingPoint: "Eiffel Tower"
// };

async function developTourPlan(userPreferences) {
    try {
        const queries = await generate_queries(userPreferences);
        const placeInfo = await searchAndProcessArticles(queries);
        const optimizationResults = await optimization_agent(userPreferences, placeInfo);

        console.log("Optimized Travel Plan:", optimizationResults);
        return optimizationResults;
    } catch (error) {
        console.error("Error in developing tour plan:", error);
        return {};
    }
}
// developTourPlan(userPreferences)





module.exports = { user_interaction_agent , generate_queries,developTourPlan};  