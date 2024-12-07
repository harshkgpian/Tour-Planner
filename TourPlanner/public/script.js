document.getElementById('user-input').addEventListener('keydown', function (event) {  
  if (event.key === 'Enter' && !event.shiftKey) {  
    event.preventDefault();  
    sendMessage();  
  }  
});  

function sendMessage() {  
  const userInput = document.getElementById('user-input');  
  const chatWindow = document.getElementById('chat-window');  

  const userMessage = userInput.value.trim();  
  if (userMessage) {  
    // Display user's message  
    const userMsgDiv = document.createElement('div');  
    userMsgDiv.classList.add('message', 'user');  
    userMsgDiv.textContent = userMessage;  
    chatWindow.appendChild(userMsgDiv);  

    chatWindow.scrollTop = chatWindow.scrollHeight;  
    userInput.value = '';  

    // Send the message to the server  
    fetch('http://localhost:3000/api/chat', {  
      method: 'POST',  
      headers: { 'Content-Type': 'application/json' },  
      body: JSON.stringify({ message: userMessage })  
    })  
      .then(response => response.json())  
      .then(data => {  
        if (data.tourPlan) {  
          // If the tour plan is available, display it in a nice format  
          displayTourPlan(data.tourPlan, chatWindow);  
        } else {  
          // Display bot's response  
          const botMsgDiv = document.createElement('div');  
          botMsgDiv.classList.add('message', 'bot');  
          botMsgDiv.textContent = data.reply;  
          chatWindow.appendChild(botMsgDiv);  
        }  

        chatWindow.scrollTop = chatWindow.scrollHeight;  
      })  
      .catch(error => {  
        console.error("Error:", error);  
        const botMsgDiv = document.createElement('div');  
        botMsgDiv.classList.add('message', 'bot');  
        botMsgDiv.textContent = "Sorry, there was an error processing your request.";  
        chatWindow.appendChild(botMsgDiv);  

        chatWindow.scrollTop = chatWindow.scrollHeight;  
      });  
  }  
}  

// script.js  
function displayTourPlan(tourPlan, chatWindow) {  
  const botMsgDiv = document.createElement('div');  
  botMsgDiv.classList.add('message', 'bot', 'tour-plan-message');  

  const tourPlanHTML = `  
      <div class="tour-plan">  
          <h3>Optimized Travel Plan</h3>  

          <div class="timeline">  
              ${tourPlan.optimizedPlan.map((item, index) => `  
                  <div class="timeline-item">  
                      <div class="timeline-time">${item.visitTime}</div>  
                      <div class="timeline-content">  
                          <h4>${item.place}</h4>  
                          <div class="activity">  
                              <i class="fas fa-walking"></i>  
                              ${item.activity}  
                          </div>  
                          <div class="details">  
                              <span class="cost">  
                                  <i class="fas fa-rupee-sign"></i> ${item.cost}  
                              </span>  
                              <span class="transport">  
                                  <i class="fas fa-car"></i>   
                                  ${item.transportationMode.type} (₹${item.transportationMode.cost})  
                              </span>  
                          </div>  
                          <div class="weather-tip">  
                              <i class="fas fa-cloud-sun"></i>  
                              ${item.weatherConsiderations.recommendations.join(', ')}  
                          </div>  
                      </div>  
                  </div>  
              `).join('')}  
          </div>  

          <div class="summary-section">  
              <div class="summary-box">  
                  <h4>Trip Summary</h4>  
                  <div class="summary-item">  
                      <i class="fas fa-clock"></i>  
                      <span>Total Time: ${tourPlan.totalTime}</span>  
                  </div>  
                  <div class="summary-item">  
                      <i class="fas fa-wallet"></i>  
                      <span>Total Cost: ₹${tourPlan.totalCost}</span>  
                  </div>  
              </div>  

              <div class="budget-analysis">  
                  <h4>Budget Breakdown</h4>  
                  <div class="budget-item">  
                      <span>Activities: ₹${tourPlan.budgetAnalysis.activitiesAllocation}</span>  
                      <div class="progress-bar">  
                          <div class="progress" style="width: ${(tourPlan.budgetAnalysis.activitiesAllocation / tourPlan.totalCost) * 100}%"></div>  
                      </div>  
                  </div>  
                  <div class="budget-item">  
                      <span>Transportation: ₹${tourPlan.budgetAnalysis.transportationAllocation}</span>  
                      <div class="progress-bar">  
                          <div class="progress" style="width: ${(tourPlan.budgetAnalysis.transportationAllocation / tourPlan.totalCost) * 100}%"></div>  
                      </div>  
                  </div>  
              </div>  

              <div class="weather-summary">  
                  <h4>Weather & Seasonal Tips</h4>  
                  <p><i class="fas fa-sun"></i> ${tourPlan.seasonalConsiderations.typicalWeather}</p>  
                  <ul>  
                      ${tourPlan.seasonalConsiderations.generalRecommendations.map(tip =>   
                          `<li><i class="fas fa-check"></i> ${tip}</li>`  
                      ).join('')}  
                  </ul>  
              </div>  
          </div>  
      </div>  
  `;  

  botMsgDiv.innerHTML = tourPlanHTML;  
  chatWindow.appendChild(botMsgDiv);  
}  