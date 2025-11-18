// CORRECTED Import: Rely on Vite/bundler to find the library in node_modules
import { Conversation } from '@elevenlabs/client';

// Get references to HTML elements
const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const connectionStatus = document.getElementById('connectionStatus');
const agentStatus = document.getElementById('agentStatus');
const errorMessage = document.getElementById('error-message');
const consentModal = document.getElementById('consentModal');
const agreeConsentButton = document.getElementById('agreeConsentButton');
const cancelConsentButton = document.getElementById('cancelConsentButton');
const connectionIndicator = document.getElementById('connectionIndicator');
const statusIcon = document.getElementById('statusIcon');
const timerSection = document.getElementById('timerSection');
const timerDisplay = document.getElementById('timerDisplay');

// Variable for the conversation instance
let conversation;
let conversationTimer = null;
let timeRemaining = 60; // 1 minute in seconds

// --- Helper function to display errors ---
function displayError(message) {
    console.error(message);
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    startButton.disabled = false;
    stopButton.disabled = true;
    connectionStatus.textContent = 'Error';
    agentStatus.textContent = 'Ready to Listen';
    if (connectionIndicator) {
        connectionIndicator.className = 'w-3 h-3 rounded-full bg-red-500';
    }
    if (statusIcon) {
        statusIcon.className = 'fas fa-times-circle text-red-600';
    }
}

// --- Function to show the consent modal ---
function showConsentModal() {
    errorMessage.classList.add('hidden'); // Hide previous errors
    startButton.disabled = true; // Disable start button while modal is open
    if (consentModal) {
        consentModal.classList.add('visible');
    } else {
        console.error("Consent modal element not found!");
        // Fallback or display error if modal doesn't exist
        displayError("Consent dialog could not be displayed.");
        startButton.disabled = false; // Re-enable start button
    }
}

// --- Function to hide the consent modal ---
function hideConsentModal() {
    if (consentModal) {
        consentModal.classList.remove('visible');
    }
}

// --- Function to actually start the connection (called after consent) ---
async function proceedWithConversation() {
    agentStatus.textContent = 'Preparing...';
    errorMessage.classList.add('hidden');
    if (statusIcon) {
        statusIcon.className = 'fas fa-spinner fa-spin text-indigo-600';
    }
    // startButton is already disabled from showConsentModal

    // Check if Conversation class loaded correctly (basic check)
    if (typeof Conversation === 'undefined') {
        displayError("ElevenLabs 'Conversation' class not loaded. Ensure 'npm install @11labs/client' was run and Vite is bundling correctly.");
        // Re-enable start button if Conversation class isn't loaded
        startButton.disabled = false;
        return;
    }

    try {
        // 1. Request microphone permission
        await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log("Microphone access granted.");

        // 2. Start the conversation session using Agent ID
        // IMPORTANT: Replace 'YOUR_AGENT_ID' with your actual agent ID from ElevenLabs
        const agentId = 'QsTTVLzhC1FU3U8fjgrH'; // <<<--- IMPORTANT: REPLACE THIS ID!
        // CORRECTED CHECK: Use the actual placeholder string from the file
        if (agentId === 'YOUR_AGENT_ID') {
            displayError("Please replace 'YOUR_AGENT_ID' in src/main.js with your actual ElevenLabs agent ID.");
            agentStatus.textContent = 'Config Error';
            // Re-enable start button if config error
            startButton.disabled = false;
            return;
        }

        console.log(`Starting conversation session with Agent ID: ${agentId}...`);
        conversation = await Conversation.startSession({
            agentId: agentId, // Use agentId directly
            onConnect: () => {
                console.log('Connection established.');
                connectionStatus.textContent = 'Connected';
                stopButton.disabled = false;
                if (connectionIndicator) {
                    connectionIndicator.className = 'w-3 h-3 rounded-full bg-green-500 animate-pulse';
                }
                
                // Start the 1-minute conversation timer
                startConversationTimer();
                if (statusIcon) {
                    statusIcon.className = 'fas fa-check-circle text-green-600';
                }
            },
            onDisconnect: () => {
                console.log('Connection closed.');
                clearConversationTimer(); // Clear timer on disconnect
                connectionStatus.textContent = 'Awaiting';
                agentStatus.textContent = 'Ready to Listen';
                startButton.disabled = false;
                stopButton.disabled = true;
                conversation = null;
                if (connectionIndicator) {
                    connectionIndicator.className = 'w-3 h-3 rounded-full bg-gray-300';
                }
                if (statusIcon) {
                    statusIcon.className = 'fas fa-circle-notch text-indigo-600';
                }
            },
            onError: (error) => {
                displayError(error.message || 'Unknown conversation error.');
                if (conversation) {
                    conversation.endSession().catch(err => console.error("Error ending session:", err));
                    conversation = null;
                }
                startButton.disabled = false;
                stopButton.disabled = true;
                connectionStatus.textContent = 'Error';
                agentStatus.textContent = 'Ready';
            },
            onModeChange: (mode) => {
                console.log(`Agent mode changed: ${mode.mode}`);
                if (mode.mode === 'speaking') {
                    agentStatus.textContent = 'Speaking';
                    if (statusIcon) {
                        statusIcon.className = 'fas fa-comment-dots text-indigo-600 animate-pulse';
                    }
                } else {
                    agentStatus.textContent = 'Listening';
                    if (statusIcon) {
                        statusIcon.className = 'fas fa-ear-listen text-purple-600';
                    }
                }
            },
        });

        console.log("Conversation session started successfully.");

    } catch (error) {
        // Handle errors during setup (mic permission, starting session)
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
             displayError('Microphone access denied.');
        } else if (error.message.includes('@11labs/client') || error instanceof TypeError) { // Catch potential errors if Conversation class wasn't loaded
             displayError('Failed to load or use ElevenLabs client. Ensure install/bundle.');
        }
         else {
            displayError(`Failed to start conversation: ${error.message}`);
        }
        // Ensure buttons reset if start fails
        startButton.disabled = false;
        stopButton.disabled = true;
        agentStatus.textContent = 'Failed';
    }
}

// --- Timer Functions ---
function startConversationTimer() {
    timeRemaining = 60; // Reset to 1 minute
    if (timerSection) timerSection.classList.remove('hidden');
    updateTimerDisplay();
    
    conversationTimer = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();
        
        if (timeRemaining <= 0) {
            clearInterval(conversationTimer);
            sendClosingMessage();
        }
    }, 1000);
}

function updateTimerDisplay() {
    if (timerDisplay) {
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Change color as time runs low
        if (timeRemaining <= 10) {
            timerDisplay.className = 'font-bold text-red-600 text-xl animate-pulse';
        } else if (timeRemaining <= 30) {
            timerDisplay.className = 'font-bold text-orange-600 text-xl';
        }
    }
}

function clearConversationTimer() {
    if (conversationTimer) {
        clearInterval(conversationTimer);
        conversationTimer = null;
    }
    if (timerSection) timerSection.classList.add('hidden');
    if (timerDisplay) timerDisplay.className = 'font-bold text-purple-700 text-xl';
}

function sendClosingMessage() {
    if (conversation) {
        console.log('Timer expired - sending closing message to Winston');
        try {
            // Use sendUserMessage to prompt Winston to close gracefully
            conversation.sendUserMessage(
                "Father Winston, our time together is drawing to a close. Please share a final blessing and word of encouragement."
            );
        } catch (error) {
            console.error('Failed to send closing message:', error);
            // If sending fails, just end the session
            stopConversation();
        }
    }
}

// --- Function to stop the conversation ---
async function stopConversation() {
    errorMessage.classList.add('hidden');
    clearConversationTimer(); // Clear the timer
    if (conversation) {
        console.log("Ending conversation session...");
        agentStatus.textContent = 'Closing...';
        stopButton.disabled = true;
        if (statusIcon) {
            statusIcon.className = 'fas fa-spinner fa-spin text-gray-600';
        }
        try {
            await conversation.endSession();
            console.log("Conversation session ended successfully via button.");
            // onDisconnect callback handles resetting states
        } catch (error) {
            displayError(`Failed to stop conversation: ${error.message}`);
            // Manually reset state if endSession fails unexpectedly
            startButton.disabled = false;
            stopButton.disabled = true; // Keep it disabled
            connectionStatus.textContent = 'Error';
            agentStatus.textContent = 'Ready';
            conversation = null;
        }
    } else {
         console.log("No active conversation to stop.");
         startButton.disabled = false;
         stopButton.disabled = true;
         connectionStatus.textContent = 'Awaiting';
         agentStatus.textContent = 'Ready to Listen';
         if (connectionIndicator) {
             connectionIndicator.className = 'w-3 h-3 rounded-full bg-gray-300';
         }
         if (statusIcon) {
             statusIcon.className = 'fas fa-circle-notch text-indigo-600';
         }
    }
}

// --- Add event listeners ---
// Original start button now shows the modal
startButton.addEventListener('click', showConsentModal);
stopButton.addEventListener('click', stopConversation);

// Modal button listeners
if (agreeConsentButton) {
    agreeConsentButton.addEventListener('click', () => {
        hideConsentModal();
        proceedWithConversation(); // Call the function to start connection
    });
}

if (cancelConsentButton) {
    cancelConsentButton.addEventListener('click', () => {
        hideConsentModal();
        startButton.disabled = false; // Re-enable the main start button
        agentStatus.textContent = 'Ready to Listen'; // Reset status if needed
    });
}


// --- Set current year in footer ---
// Ensure the element exists before trying to set textContent
const yearElement = document.getElementById('year');
if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
} else {
    console.warn("Footer year element not found.");
}


// --- Basic form submission prevention ---
const form = document.querySelector('form');
if (form) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Thank you for your interest! We will be in touch shortly.');
        form.reset();
    });
} else {
    console.warn("Contact form not found.")
}
