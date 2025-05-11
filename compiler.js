document.addEventListener('DOMContentLoaded', () => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
        // User is not logged in, redirect to login page
        window.location.href = 'login.html';
        return;
    }

    // Console variables
    let pendingInputResolve = null;
    let userInputBuffer = '';
    let consoleHistory = '';
    let isAwaitingInput = false;
    let currentPrompt = '';
    let isRunning = false;
    let outputBuffer = [];
    let processingOutput = false;
    let isApiAvailable = false;
    
    // JDoodle API Configuration - updated credentials
    const JDOODLE_CLIENT_ID = "a9f3c9e216b730afd371df28f1118fc"; 
    const JDOODLE_CLIENT_SECRET = "c5cc30058e99cef4ee8fa66a61cdeed5e63d8c9b13cea8b10c0e7a5920e740f4"; 
    
    // Helper timeout function
    function timeoutPromise(promise, timeout = 10000) {
        return Promise.race([
            promise,
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timed out')), timeout)
            )
        ]);
    }

    // Initialize CodeMirror with improved settings
    const editor = CodeMirror.fromTextArea(document.getElementById('codeEditor'), {
        lineNumbers: true,
        theme: 'dracula',
        mode: 'python',
        autoCloseBrackets: true,
        matchBrackets: true,
        indentUnit: 4,
        tabSize: 4,
        lineWrapping: true,
        scrollbarStyle: 'simple',
        fixedGutter: true,
        viewportMargin: 10, // Limited for performance
        extraKeys: {
            "Tab": function(cm) {
                if (cm.somethingSelected()) {
                    cm.indentSelection("add");
                } else {
                    cm.replaceSelection("    ", "end");
                }
            }
        }
    });
    
    // Ensure editor stays within container and enforce fixed height
    editor.setSize("100%", "100%");
    
    // Force editor refresh to ensure proper display
    setTimeout(() => {
        editor.refresh();
    }, 100);
    
    // Check API status on load
    checkApiStatus();
    
    // Function to check if the JDoodle API is available
    async function checkApiStatus() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const testUrl = "https://api.jdoodle.com/v1/credit-spent";
            console.log("Checking API status...");
            
            const response = await fetch(testUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    clientId: JDOODLE_CLIENT_ID,
                    clientSecret: JDOODLE_CLIENT_SECRET
                }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const data = await response.json();
                console.log("API status:", data);
                isApiAvailable = true;
                showNotification('Remote compiler API connected', 'success');
            } else {
                console.log('API returned error status:', response.status);
                isApiAvailable = false;
                showNotification('Using local simulation mode', 'info');
            }
        } catch (error) {
            console.error('API connection error:', error);
            isApiAvailable = false;
            showNotification('Using local simulation mode - API unavailable', 'info');
        }
    }

    // Language templates
    const templates = {
        python: `# Example: A program that takes user input\nname = input("Enter your name: ")\nage = input("Enter your age: ")\nprint(f"Hello, {name}! You are {age} years old.")\nprint("Nice to meet you!")`,
        cpp: `#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string name;\n    int age;\n    \n    cout << "Enter your name: ";\n    cin >> name;\n    \n    cout << "Enter your age: ";\n    cin >> age;\n    \n    cout << "Hello, " << name << "! You are " << age << " years old." << endl;\n    cout << "Nice to meet you!" << endl;\n    \n    return 0;\n}`,
        c: `#include <stdio.h>\n\nint main() {\n    char name[100];\n    int age;\n    \n    printf("Enter your name: ");\n    scanf("%s", name);\n    \n    printf("Enter your age: ");\n    scanf("%d", &age);\n    \n    printf("Hello, %s! You are %d years old.\\n", name, age);\n    printf("Nice to meet you!\\n");\n    \n    // Counting example with a for loop\n    printf("Counting from 1 to 5:\\n");\n    for(int i = 1; i < 6; i++) {\n        printf("%d\\n", i);\n    }\n    \n    return 0;\n}`,
        java: `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner scanner = new Scanner(System.in);\n        \n        System.out.print("Enter your name: ");\n        String name = scanner.nextLine();\n        \n        System.out.print("Enter your age: ");\n        int age = scanner.nextInt();\n        \n        System.out.println("Hello, " + name + "! You are " + age + " years old.");\n        System.out.println("Nice to meet you!");\n        \n        // Counting example with a for loop\n        System.out.println("Counting from 1 to 5:");\n        for(int i = 1; i < 6; i++) {\n            System.out.println(i);\n        }\n    }\n}`
    };

    // Language mappings for JDoodle API
    const languageMappings = {
        python: { language: "python3", versionIndex: "4" },
        cpp: { language: "cpp17", versionIndex: "0" },
        c: { language: "c", versionIndex: "4" },
        java: { language: "java", versionIndex: "4" }
    };

    // Set initial template
    editor.setValue(templates.python);

    // Console elements
    const consoleElement = document.getElementById('console');
    
    // Set console to be contenteditable
    consoleElement.setAttribute('contenteditable', 'true');
    
    // Initialize console
    clearConsole();
    
    // Console click handler - focus when clicked
    consoleElement.addEventListener('click', () => {
        if (isAwaitingInput) {
            focusInputAtEnd();
        }
    });
    
    // Console keyboard handler for input
    consoleElement.addEventListener('keydown', (e) => {
        if (!isAwaitingInput) {
            // If not awaiting input, prevent typing except specific keyboard shortcuts
            if (e.key !== 'Control' && e.key !== 'Alt' && e.key !== 'Shift' && 
                !(e.ctrlKey && e.key === 'c') && // Allow Ctrl+C for copy
                !(e.ctrlKey && e.key === 'a')) { // Allow Ctrl+A for select all
                e.preventDefault();
            }
            return;
        }
        
        // Handle Enter key - submit input
        if (e.key === 'Enter') {
            e.preventDefault();
            const inputValue = userInputBuffer.trim();
            userInputBuffer = '';
            completeInput(inputValue);
        }
        // Handle backspace - remove last character
        else if (e.key === 'Backspace') {
            e.preventDefault();
            if (userInputBuffer.length > 0) {
                userInputBuffer = userInputBuffer.substring(0, userInputBuffer.length - 1);
                updateInputDisplay();
            }
        }
        // Allow only printable characters
        else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
            e.preventDefault();
            userInputBuffer += e.key;
            updateInputDisplay();
            // Force cursor to end
            focusInputAtEnd();
        }
    });
    
    // Focus input at the end of the console
    function focusInputAtEnd() {
        consoleElement.focus();
        
        // Use selection API to move cursor to the end
        if (window.getSelection && document.createRange) {
            const range = document.createRange();
            const selection = window.getSelection();
            
            // Make sure to select the input line if it exists
            const inputLine = consoleElement.querySelector('.input-line');
            if (inputLine) {
                range.selectNodeContents(inputLine);
                range.collapse(false); // false means collapse to end
                selection.removeAllRanges();
                selection.addRange(range);
            } else {
                // If no input line, select end of console
                range.selectNodeContents(consoleElement);
                range.collapse(false);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }
    }
    
    // Update the input display in the console
    function updateInputDisplay() {
        const inputSpan = consoleElement.querySelector('.input-line');
        if (inputSpan) {
            inputSpan.textContent = userInputBuffer;
            // Make sure the cursor is visible
            const cursor = consoleElement.querySelector('.console-cursor');
            if (cursor) {
                cursor.style.display = 'inline-block';
            }
        }
    }
    
    // Complete the current input request
    function completeInput(value) {
        if (pendingInputResolve) {
            // Update the full console history with the completed input
            consoleHistory += value + '\n';
            appendToConsole('\n', false);
            
            // Reset input state
            isAwaitingInput = false;
            consoleElement.classList.remove('waiting-input');
            
            // Remove input elements
            const inputLine = consoleElement.querySelector('.input-line');
            const cursor = consoleElement.querySelector('.console-cursor');
            if (inputLine) inputLine.remove();
            if (cursor) cursor.remove();
            
            // Add the input as regular text
            const textNode = document.createTextNode(value);
            consoleElement.appendChild(textNode);
            consoleElement.appendChild(document.createElement('br'));
            
            // Resolve the promise with the input value
            const resolveFunc = pendingInputResolve;
            pendingInputResolve = null;
            resolveFunc(value);
        }
    }
    
    // Clear the console
    function clearConsole() {
        consoleHistory = '';
        consoleElement.innerHTML = '';
        userInputBuffer = '';
        outputBuffer = [];
        processingOutput = false;
        isAwaitingInput = false;
        
        // Resolve any pending input
        if (pendingInputResolve) {
            pendingInputResolve(""); // Resolve any pending input with empty string
            pendingInputResolve = null;
        }
        
        // Add welcome message
        const welcomeDiv = document.createElement('div');
        welcomeDiv.className = 'welcome-message';
        
        if (isApiAvailable) {
            welcomeDiv.innerHTML = 'Code output will appear here. Click "Run" to execute your code.<br><small>Remote compiler API is connected.</small>';
        } else {
            welcomeDiv.innerHTML = 'Code output will appear here. Click "Run" to execute your code.<br><small>Using local simulation mode. Interactive input/output is supported.</small>';
        }
        
        consoleElement.appendChild(welcomeDiv);
        
        showNotification('Console cleared', 'info');
    }
    
    // Function to add CSS style for console welcome message
    function addConsoleStyles() {
        if (!document.getElementById('console-extra-styles')) {
            const styleElement = document.createElement('style');
            styleElement.id = 'console-extra-styles';
            styleElement.textContent = `
                .welcome-message {
                    color: var(--text-secondary);
                    text-align: center;
                    padding: 2rem;
                }
                .welcome-message small {
                    display: block;
                    margin-top: 0.5rem;
                    opacity: 0.7;
                    font-size: 0.8rem;
                }
                .console-content {
                    font-family: 'Consolas', 'Monaco', monospace;
                    padding: 1rem;
                    line-height: 1.5;
                    font-size: 0.95rem;
                }
            `;
            document.head.appendChild(styleElement);
        }
    }
    
    // Add extra styles
    addConsoleStyles();
    
    // Helper function to append HTML directly to console
    function appendHtmlToConsole(htmlText) {
        // Don't use this function anymore, it's causing issues
        appendToConsole(htmlText.replace(/<[^>]*>/g, ''));
    }

    // Append text to the console
    async function appendToConsole(text, saveToHistory = true) {
        if (saveToHistory) {
            consoleHistory += text;
        }
        
        // Add text to output buffer for progressive display
        outputBuffer.push(...text.split('\n'));
        
        // If we're not already processing output, start processing
        if (!processingOutput) {
            await processOutputBuffer();
        }
        
        // Check if this is an input prompt
        if ((text.includes('Enter your') || 
             text.includes('input:') || 
             text.includes('Input') || 
             text.includes(': ')) && !isAwaitingInput) {
            
            // Set up for input
            isAwaitingInput = true;
            userInputBuffer = '';
            consoleElement.classList.add('waiting-input');
            
            // Create an input line element for user to type
            const inputLine = document.createElement('span');
            inputLine.className = 'input-line';
            consoleElement.appendChild(inputLine);
            
            // Add a blinking cursor
            const cursor = document.createElement('span');
            cursor.className = 'console-cursor';
            consoleElement.appendChild(cursor);
            
            // Focus the console for input
            setTimeout(focusInputAtEnd, 100);
            
            // Return a promise that will be resolved when the user submits input
            return new Promise(resolve => {
                pendingInputResolve = resolve;
            });
        }
        
        return Promise.resolve();
    }
    
    // Process output buffer line by line with delays
    async function processOutputBuffer() {
        processingOutput = true;
        
        while (outputBuffer.length > 0) {
            const line = outputBuffer.shift();
            
            // Skip processing if this is going to be an input prompt
            // (We'll handle that separately)
            if (isAwaitingInput) {
                processingOutput = false;
                return;
            }
            
            // Process this line
            if (line.startsWith('Error:')) {
                const errorSpan = document.createElement('span');
                errorSpan.className = 'error';
                errorSpan.textContent = line;
                consoleElement.appendChild(errorSpan);
            } else if (line !== '') {
                const textNode = document.createTextNode(line);
                consoleElement.appendChild(textNode);
            }
            
            // Add line break if there are more lines to come
            if (outputBuffer.length > 0) {
                consoleElement.appendChild(document.createElement('br'));
            }
            
            // Scroll to bottom
            consoleElement.scrollTop = consoleElement.scrollHeight;
            
            // Add a small delay between lines for visual effect
            if (outputBuffer.length > 0) {
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        }
        
        processingOutput = false;
    }
    
    // Function to get user input (used by the execution engine)
    async function getUserInput(prompt) {
        return appendToConsole(prompt);
    }

    // Language selection handler
    document.getElementById('languageSelect').addEventListener('change', (e) => {
        const language = e.target.value;
        editor.setOption('mode', language === 'python' ? 'python' : 'text/x-c++src');
        editor.setValue(templates[language]);
    });

    // Clear Console button handler
    document.getElementById('clearConsole').addEventListener('click', clearConsole);
    
    // Copy Console button handler
    document.getElementById('copyConsole').addEventListener('click', () => {
        navigator.clipboard.writeText(consoleHistory);
        const copyBtn = document.getElementById('copyConsole');
        copyBtn.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => {
            copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
        }, 2000);
        showNotification('Console copied to clipboard!', 'success');
    });

    // Improved C simulator to handle for loops better
    function parseCforLoops(code) {
        const results = [];
        
        // Match different for loop patterns
        const patterns = [
            // Standard for loop: for(int i = 0; i < 10; i++)
            /for\s*\(\s*(?:int\s+)?(\w+)\s*=\s*(\d+)\s*;\s*\1\s*<\s*(\d+)\s*;\s*\1\s*\+\+\s*\)/g,
            
            // For loop with pre-declared variable: for(i = 0; i < 10; i++)
            /for\s*\(\s*(\w+)\s*=\s*(\d+)\s*;\s*\1\s*<\s*(\d+)\s*;\s*\1\s*\+\+\s*\)/g,
            
            // For loop with i+=1 increment: for(int i = 0; i < 10; i+=1)
            /for\s*\(\s*(?:int\s+)?(\w+)\s*=\s*(\d+)\s*;\s*\1\s*<\s*(\d+)\s*;\s*\1\s*\+=\s*1\s*\)/g
        ];
        
        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(code)) !== null) {
                results.push({
                    varName: match[1],
                    start: parseInt(match[2]),
                    end: parseInt(match[3])
                });
            }
        }
        
        return results;
    }

    // Add a simple local execution simulator for when the API fails
    async function simulateExecution(code, language, inputs) {
        try {
            // Clear any existing content
            await appendToConsole("--- Simulation Mode ---\n");
            
            if (language === 'python') {
                // Handle Python simulation interactively
                const inputPrompts = [];
                const inputRegex = /input\s*\(\s*["'](.+?)["']\s*\)/g;
                let match;
                
                // Extract all input prompts
                while ((match = inputRegex.exec(code)) !== null) {
                    inputPrompts.push(match[1]);
                }
                
                // Process each input prompt sequentially
                for (let i = 0; i < inputPrompts.length; i++) {
                    // Display the prompt and wait for input
                    const userInput = await appendToConsole(inputPrompts[i] + " ");
                    
                    // Store this input for the next phase of simulation
                    if (!inputs) inputs = [];
                    inputs.push(userInput);
                }
                
                // Process print statements
                const printStatements = [];
                let printRegex = /print\s*\(\s*f?["'](.+?)["']\s*\)/g;
                let printMatch;
                
                while ((printMatch = printRegex.exec(code)) !== null) {
                    let output = printMatch[1];
                    
                    // Handle f-strings if present
                    if (code.includes('print(f"') || code.includes("print(f'")) {
                        // Replace {name} with actual inputs[0]
                        if (inputs && inputs.length > 0) {
                            output = output.replace(/{name}/g, inputs[0]);
                        }
                        // Replace {age} with actual inputs[1]
                        if (inputs && inputs.length > 1) {
                            output = output.replace(/{age}/g, inputs[1]);
                        }
                    }
                    
                    await appendToConsole(output + "\n");
                }
                
                return { output: "Simulation completed", simulated: true };
            } else if (language === 'cpp' || language === 'c') {
                // Extract input prompts for C/C++
                const prompts = [];
                if (language === 'cpp') {
                    const coutRegex = /cout\s*<<\s*["'](.+?)["']/g;
                    let match;
                    while ((match = coutRegex.exec(code)) !== null) {
                        prompts.push(match[1]);
                    }
                } else { // C
                    const printfRegex = /printf\s*\(\s*["']([^%"';]+)["']/g;
                    let match;
                    while ((match = printfRegex.exec(code)) !== null) {
                        prompts.push(match[1]);
                    }
                    
                    // Also check for printf with format specifiers for C
                    const formattedPrintfRegex = /printf\s*\(\s*["']([^"';]*?)["']/g;
                    while ((match = formattedPrintfRegex.exec(code)) !== null) {
                        if (match[1].includes('%d') || match[1].includes('%s')) {
                            prompts.push(match[1].replace(/%[dsfx]/g, ''));
                        }
                    }
                }
                
                // Special handling for C for loops
                if (language === 'c') {
                    const forLoops = parseCforLoops(code);
                    
                    if (forLoops.length > 0) {
                        // Find printf statements that might be inside a for loop
                        const printfInLoops = [];
                        let foundPrintInLoop = false;
                        
                        for (const loop of forLoops) {
                            // Look for a printf after the for loop declaration
                            const forLoopIndex = code.indexOf(`for`);
                            const blockStart = code.indexOf('{', forLoopIndex);
                            const blockEnd = code.indexOf('}', blockStart);
                            
                            if (blockStart > -1 && blockEnd > blockStart) {
                                const loopBlock = code.substring(blockStart, blockEnd);
                                
                                // Check if the loop has a printf inside it
                                if (loopBlock.includes('printf')) {
                                    foundPrintInLoop = true;
                                    
                                    // Count outputs
                                    await appendToConsole("Loop output (simulated):\n");
                                    for (let i = loop.start; i < loop.end; i++) {
                                        await appendToConsole(`${i}\n`);
                                    }
                                }
                            }
                        }
                        
                        // If no specific print in loop was found but we have for loops
                        if (!foundPrintInLoop && forLoops.length > 0) {
                            await appendToConsole("Loop output (generic simulation):\n");
                            for (let i = forLoops[0].start; i < forLoops[0].end; i++) {
                                await appendToConsole(`${i}\n`);
                            }
                        }
                    }
                }
                
                // Process each input prompt sequentially
                if (!inputs) inputs = [];
                for (let i = 0; i < prompts.length; i++) {
                    if (prompts[i].includes("Enter") || prompts[i].includes("input") || prompts[i].includes(":")) {
                        // Display the prompt and wait for input
                        const userInput = await appendToConsole(prompts[i] + " ");
                        inputs.push(userInput);
                    }
                }
                
                // Process output with collected inputs
                if (inputs.length >= 2) {
                    await appendToConsole(`Hello, ${inputs[0]}! You are ${inputs[1]} years old.\n`);
                    if (code.includes('Nice to meet you')) {
                        await appendToConsole('Nice to meet you!\n');
                    }
                }
                
                return { output: "Simulation completed", simulated: true };
            } else if (language === 'java') {
                // Extract input prompts for Java
                const prompts = [];
                const printRegex = /System\.out\.print(?:ln)?\s*\(\s*["'](.+?)["']/g;
                let match;
                while ((match = printRegex.exec(code)) !== null) {
                    prompts.push(match[1]);
                }
                
                // Check for for loops in Java
                if (code.includes('for(') || code.includes('for (')) {
                    // Detect simple for loop patterns
                    const forLoopRegex = /for\s*\(\s*(?:int\s+)?(\w+)\s*=\s*(\d+)\s*;\s*\1\s*<\s*(\d+)\s*;/;
                    const forLoopMatch = forLoopRegex.exec(code);
                    
                    if (forLoopMatch) {
                        const varName = forLoopMatch[1];
                        const startVal = parseInt(forLoopMatch[2]);
                        const endVal = parseInt(forLoopMatch[3]);
                        
                        // Look for print statements inside the loop
                        const printInLoopRegex = new RegExp(`System\\.out\\.print(?:ln)?\\s*\\(\\s*["']([^"';]*)${varName}|${varName}([^"';]*)["']`, 'g');
                        let found = false;
                        
                        // Extract prints that contain the loop variable
                        while ((match = code.match(printInLoopRegex)) !== null) {
                            found = true;
                            // Simulate the loop outputs
                            for (let i = startVal; i < endVal; i++) {
                                await appendToConsole(`${i}\n`);
                            }
                            break;
                        }
                        
                        if (!found) {
                            // Simple number output if no specific printf found
                            await appendToConsole("Loop output (simulated):\n");
                            for (let i = startVal; i < endVal; i++) {
                                await appendToConsole(`${i}\n`);
                            }
                        }
                    }
                }
                
                // Process each input prompt sequentially
                if (!inputs) inputs = [];
                for (let i = 0; i < prompts.length; i++) {
                    if (prompts[i].includes("Enter") || prompts[i].includes("input") || prompts[i].includes(":")) {
                        // Display the prompt and wait for input
                        const userInput = await appendToConsole(prompts[i] + " ");
                        inputs.push(userInput);
                    }
                }
                
                // Process output with collected inputs
                if (inputs.length >= 2) {
                    await appendToConsole(`Hello, ${inputs[0]}! You are ${inputs[1]} years old.\n`);
                    if (code.includes('Nice to meet you')) {
                        await appendToConsole('Nice to meet you!\n');
                    }
                }
                
                return { output: "Simulation completed", simulated: true };
            } else {
                return { 
                    output: "This language is not supported for local simulation.",
                    error: true,
                    simulated: true
                };
            }
        } catch (error) {
            return { 
                output: "Error in local simulation: " + error.message,
                error: true,
                simulated: true
            };
        }
    }

    // Run button handler
    document.getElementById('runBtn').addEventListener('click', async () => {
        if (isRunning) return; // Prevent multiple run requests
        
        const runBtn = document.getElementById('runBtn');
        const language = document.getElementById('languageSelect').value;
        const code = editor.getValue();

        // Clear console and prepare for new execution
        clearConsole();
        isRunning = true;
        runBtn.disabled = true;
        runBtn.classList.add('loading');
        runBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Running...';
        
        try {
            await appendToConsole("--- Program Output ---\n");
            
            // Try to connect to API again if previously failed
            if (!isApiAvailable) {
                await appendToConsole("Checking API connection...\n");
                try {
                    // Quick API check
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 3000);
                    
                    const response = await fetch("https://api.jdoodle.com/v1/credit-spent", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            clientId: JDOODLE_CLIENT_ID,
                            clientSecret: JDOODLE_CLIENT_SECRET
                        }),
                        signal: controller.signal
                    });
                    
                    clearTimeout(timeoutId);
                    
                    if (response.ok) {
                        isApiAvailable = true;
                        await appendToConsole("API connection successful.\n\n");
                    } else {
                        isApiAvailable = false;
                        await appendToConsole("API connection failed. Using simulation mode.\n\n");
                    }
                } catch (apiCheckError) {
                    console.error("API check error:", apiCheckError);
                    isApiAvailable = false;
                    await appendToConsole("API connection failed. Using simulation mode.\n\n");
                }
            }
            
            // Check if API is available
            if (isApiAvailable) {
                try {
                    // Try with JDoodle API
                    await appendToConsole("Executing code via remote compiler...\n");
                    
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
                    
                    const response = await fetch("https://api.jdoodle.com/v1/execute", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            clientId: JDOODLE_CLIENT_ID,
                            clientSecret: JDOODLE_CLIENT_SECRET,
                            script: code,
                            language: languageMappings[language].language,
                            versionIndex: languageMappings[language].versionIndex,
                            stdin: ""
                        }),
                        signal: controller.signal
                    });
                    
                    clearTimeout(timeoutId);
                    
                    if (!response.ok) {
                        throw new Error(`API Error: ${response.status}`);
                    }
                    
                    const result = await response.json();
                    
                    if (result.error) {
                        throw new Error(result.error);
                    } else if (result.statusCode && result.statusCode !== 200) {
                        throw new Error(result.error || "Unknown error occurred");
                    } else if (result.output) {
                        await appendToConsole("\nAPI Response:\n");
                        await appendToConsole(result.output + "\n");
                        
                        // For interactive programs, fall back to local simulation
                        if (code.includes("input(") || 
                            code.includes("scanf") || 
                            code.includes("cin") || 
                            code.includes("Scanner")) {
                            
                            await appendToConsole("\nRunning interactive simulation for input/output:\n\n");
                            await simulateExecution(code, language);
                        }
                        
                        showNotification('Code executed successfully!', 'success');
                    } else {
                        await appendToConsole("No output produced.");
                        showNotification('Code executed successfully!', 'success');
                    }
                } catch (apiError) {
                    console.error("API execution error:", apiError);
                    
                    // Fall back to local simulation
                    await appendToConsole("API execution failed. Using local simulation mode.\n\n");
                    await simulateExecution(code, language);
                    showNotification('Code executed in simulation mode!', 'info');
                    
                    // Update API status flag
                    isApiAvailable = false;
                }
            } else {
                // Skip trying the API if we already know it's not available
                await appendToConsole("Running in local simulation mode.\n\n");
                await simulateExecution(code, language);
                showNotification('Code executed in simulation mode!', 'info');
            }
        } catch (error) {
            console.error("Execution error:", error);
            await appendToConsole('Error: ' + (error.message || 'Unknown error occurred') + "\n");
            showNotification('Execution failed!', 'error');
        } finally {
            isRunning = false;
            runBtn.disabled = false;
            runBtn.classList.remove('loading');
            runBtn.innerHTML = '<i class="fas fa-play"></i> Run';
            
            // Reset input state if needed
            if (isAwaitingInput) {
                isAwaitingInput = false;
                userInputBuffer = '';
                consoleElement.classList.remove('waiting-input');
                const inputLine = consoleElement.querySelector('.input-line');
                const cursor = consoleElement.querySelector('.console-cursor');
                if (inputLine) inputLine.remove();
                if (cursor) cursor.remove();
                if (pendingInputResolve) {
                    pendingInputResolve("");
                    pendingInputResolve = null;
                }
            }
        }
    });

    // Clear button handler
    document.getElementById('clearBtn').addEventListener('click', () => {
        const language = document.getElementById('languageSelect').value;
        editor.setValue(templates[language]);
        clearConsole();
    });
    
    // Notification function with improved timing
    function showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        const notificationMessage = document.getElementById('notification-message');
        const notificationIcon = notification.querySelector('i');
        
        notificationMessage.textContent = message;
        
        if (type === 'success') {
            notification.style.backgroundColor = 'rgba(46, 204, 113, 0.9)';
            notificationIcon.className = 'fas fa-check';
        } else if (type === 'error') {
            notification.style.backgroundColor = 'rgba(231, 76, 60, 0.9)';
            notificationIcon.className = 'fas fa-times';
        } else if (type === 'info') {
            notification.style.backgroundColor = 'rgba(52, 152, 219, 0.9)';
            notificationIcon.className = 'fas fa-info';
        }
        
        // Remove any existing classes and timeouts
        notification.classList.remove('show');
        clearTimeout(notification.dataset.timeout);
        
        // Force a reflow to ensure animation works
        void notification.offsetWidth;
        
        notification.classList.add('show');
        
        // Set timeout to hide notification
        const timeout = setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
        
        notification.dataset.timeout = timeout;
    }

    // Coding Timer Implementation
    let timerInterval;
    let seconds = 0;
    let minutes = 0;
    let hours = 0;
    let isTimerRunning = false;
    
    const hoursDisplay = document.getElementById('hours');
    const minutesDisplay = document.getElementById('minutes');
    const secondsDisplay = document.getElementById('seconds');
    const startTimerBtn = document.getElementById('startTimer');
    const pauseTimerBtn = document.getElementById('pauseTimer');
    const resetTimerBtn = document.getElementById('resetTimer');
    
    function updateTimer() {
        seconds++;
        if (seconds >= 60) {
            seconds = 0;
            minutes++;
            if (minutes >= 60) {
                minutes = 0;
                hours++;
            }
        }
        
        hoursDisplay.textContent = hours.toString().padStart(2, '0');
        minutesDisplay.textContent = minutes.toString().padStart(2, '0');
        secondsDisplay.textContent = seconds.toString().padStart(2, '0');
    }
    
    startTimerBtn.addEventListener('click', () => {
        if (!isTimerRunning) {
            isTimerRunning = true;
            timerInterval = setInterval(updateTimer, 1000);
            startTimerBtn.classList.add('active');
            pauseTimerBtn.classList.remove('active');
            showNotification('Timer started', 'info');
        }
    });
    
    pauseTimerBtn.addEventListener('click', () => {
        if (isTimerRunning) {
            isTimerRunning = false;
            clearInterval(timerInterval);
            pauseTimerBtn.classList.add('active');
            startTimerBtn.classList.remove('active');
            showNotification('Timer paused', 'info');
        }
    });
    
    resetTimerBtn.addEventListener('click', () => {
        isTimerRunning = false;
        clearInterval(timerInterval);
        seconds = 0;
        minutes = 0;
        hours = 0;
        hoursDisplay.textContent = '00';
        minutesDisplay.textContent = '00';
        secondsDisplay.textContent = '00';
        startTimerBtn.classList.remove('active');
        pauseTimerBtn.classList.remove('active');
        showNotification('Timer reset', 'info');
    });
    
    // Problem Tracker Implementation
    const problemInput = document.getElementById('problemInput');
    const difficultySelect = document.getElementById('difficultySelect');
    const addProblemBtn = document.getElementById('addProblem');
    const problemsList = document.getElementById('problemsList');
    
    // Initialize from localStorage or set defaults
    let problems = JSON.parse(localStorage.getItem('codingProblems')) || [];
    let problemGoal = parseInt(localStorage.getItem('problemGoal')) || 5;
    let problemsSolved = parseInt(localStorage.getItem('problemsSolved')) || 0;
    
    // Update UI with stored values
    document.getElementById('problemGoal').textContent = problemGoal;
    document.getElementById('problemsSolved').textContent = problemsSolved;
    document.getElementById('goalInput').value = problemGoal;
    updateGoalProgress();
    
    // Render existing problems
    renderProblems();
    
    addProblemBtn.addEventListener('click', () => {
        const problemName = problemInput.value.trim();
        const difficulty = difficultySelect.value;
        
        if (problemName) {
            const problem = {
                id: Date.now(),
                name: problemName,
                difficulty: difficulty,
                completed: false,
                timestamp: new Date().toISOString()
            };
            
            problems.push(problem);
            localStorage.setItem('codingProblems', JSON.stringify(problems));
            
            problemInput.value = '';
            renderProblems();
            showNotification('Problem added!', 'success');
        } else {
            showNotification('Please enter a problem name', 'error');
        }
    });
    
    function renderProblems() {
        problemsList.innerHTML = '';
        
        if (problems.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.innerHTML = `
                <i class="fas fa-tasks"></i>
                <p>No problems added yet</p>
            `;
            problemsList.appendChild(emptyState);
            return;
        }
        
        // Sort problems: completed at the bottom, then by timestamp (newest first)
        const sortedProblems = [...problems].sort((a, b) => {
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }
            return new Date(b.timestamp) - new Date(a.timestamp);
        });
        
        sortedProblems.forEach(problem => {
            const problemElement = document.createElement('div');
            problemElement.className = `problem-item ${problem.completed ? 'completed' : ''}`;
            problemElement.innerHTML = `
                <div class="problem-info">
                    <span class="problem-name">${problem.name}</span>
                    <span class="problem-difficulty ${problem.difficulty}">${problem.difficulty}</span>
                </div>
                <div class="problem-actions">
                    <button class="mark-done-btn" data-id="${problem.id}">
                        <i class="fas ${problem.completed ? 'fa-undo' : 'fa-check'}"></i>
                    </button>
                    <button class="delete-problem-btn" data-id="${problem.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            problemsList.appendChild(problemElement);
        });
        
        // Add event listeners to buttons
        document.querySelectorAll('.mark-done-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.getAttribute('data-id'));
                const problem = problems.find(p => p.id === id);
                if (problem) {
                    problem.completed = !problem.completed;
                    
                    // Update problems solved count
                    if (problem.completed) {
                        problemsSolved++;
                        showNotification('Problem marked as completed!', 'success');
                    } else {
                        problemsSolved = Math.max(0, problemsSolved - 1);
                        showNotification('Problem marked as incomplete', 'info');
                    }
                    
                    localStorage.setItem('problemsSolved', problemsSolved);
                    document.getElementById('problemsSolved').textContent = problemsSolved;
                    
                    localStorage.setItem('codingProblems', JSON.stringify(problems));
                    renderProblems();
                    updateGoalProgress();
                }
            });
        });
        
        document.querySelectorAll('.delete-problem-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.getAttribute('data-id'));
                const problemIndex = problems.findIndex(p => p.id === id);
                
                if (problemIndex !== -1) {
                    // If deleting a completed problem, reduce solved count
                    if (problems[problemIndex].completed) {
                        problemsSolved = Math.max(0, problemsSolved - 1);
                        localStorage.setItem('problemsSolved', problemsSolved);
                        document.getElementById('problemsSolved').textContent = problemsSolved;
                    }
                    
                    problems.splice(problemIndex, 1);
                    localStorage.setItem('codingProblems', JSON.stringify(problems));
                    renderProblems();
                    updateGoalProgress();
                    showNotification('Problem deleted', 'info');
                }
            });
        });
    }
    
    // Goal Tracker Implementation
    const setGoalBtn = document.getElementById('setGoal');
    const goalInput = document.getElementById('goalInput');
    
    setGoalBtn.addEventListener('click', () => {
        const newGoal = parseInt(goalInput.value);
        if (newGoal > 0) {
            problemGoal = newGoal;
            localStorage.setItem('problemGoal', problemGoal);
            document.getElementById('problemGoal').textContent = problemGoal;
            updateGoalProgress();
            showNotification('Daily goal updated!', 'success');
        } else {
            showNotification('Please enter a valid goal', 'error');
        }
    });
    
    function updateGoalProgress() {
        const progressBar = document.getElementById('goalProgress');
        const progressPercentage = Math.min(100, (problemsSolved / problemGoal) * 100);
        
        progressBar.style.width = `${progressPercentage}%`;
        
        // Change color based on progress
        if (progressPercentage < 30) {
            progressBar.style.backgroundColor = '#ff4444'; // Light red
        } else if (progressPercentage < 70) {
            progressBar.style.backgroundColor = '#ffbb33'; // Orange
        } else {
            progressBar.style.backgroundColor = '#00C851'; // Green
        }
        
        // Check if goal is reached
        if (problemsSolved >= problemGoal && progressPercentage === 100) {
            showNotification('Daily goal achieved! 🎉', 'success');
        }
    }
    
    // Generate particles for background effect
    function createParticles() {
        const particleSystem = document.querySelector('.particle-system');
        const numberOfParticles = 20;

        for (let i = 0; i < numberOfParticles; i++) {
            const size = Math.random() * 5 + 1;
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = `${Math.random() * 100}%`;
            particle.style.animationDuration = `${Math.random() * 10 + 10}s`;
            particle.style.animationDelay = `${Math.random() * 5}s`;
            particle.style.opacity = Math.random() * 0.5;
            
            particleSystem.appendChild(particle);
        }
    }
    
    createParticles();

    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl+Enter to run code
        if (e.ctrlKey && e.key === 'Enter') {
            document.getElementById('runBtn').click();
        }
        
        // Ctrl+L to clear code
        if (e.ctrlKey && e.key === 'l') {
            document.getElementById('clearBtn').click();
        }
        
        // Ctrl+K to clear console
        if (e.ctrlKey && e.key === 'k') {
            document.getElementById('clearConsole').click();
        }
        
        // Alt+S to start/pause timer
        if (e.altKey && e.key === 's') {
            isTimerRunning ? pauseTimerBtn.click() : startTimerBtn.click();
        }
        
        // Alt+R to reset timer
        if (e.altKey && e.key === 'r') {
            resetTimerBtn.click();
        }
    });

    // Add a new function to execute code with input
    async function executeCodeWithInput(language, code, stdin) {
        try {
            const response = await timeoutPromise(
                fetch('https://emkc.org/api/v2/piston/execute', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        language: languageMappings[language].language,
                        version: languageMappings[language].version,
                        files: [{
                            content: code
                        }],
                        stdin: stdin
                    })
                }),
                15000 // 15 second timeout
            );

            const data = await response.json();
            
            if (data.run) {
                if (data.run.output) {
                    // Clear any previous output first
                    consoleElement.querySelectorAll('.input-line, .console-cursor').forEach(el => el.remove());
                    
                    // Append the new output
                    appendToConsole(data.run.output + '\n');
                    showNotification('Code executed successfully!', 'success');
                } else if (data.run.stderr) {
                    const formattedError = formatErrorOutput(data.run.stderr, language);
                    if (formattedError.includes('<span')) {
                        appendHtmlToConsole(formattedError);
                    } else {
                        await appendToConsole('Error: ' + data.run.stderr);
                    }
                    showNotification('Error in code execution!', 'error');
                }
            } else {
                appendToConsole('Error: Failed to execute code\n', 'error');
                showNotification('Failed to execute code!', 'error');
            }
        } catch (error) {
            if (error.message === 'Request timed out') {
                appendToConsole('Error: Code execution timed out\n', 'error');
            } else {
                appendToConsole('Error: Could not connect to the compiler service\n', 'error');
            }
            showNotification('Connection error!', 'error');
            console.error(error);
        } finally {
            // Make sure the Run button is reset
            const runBtn = document.getElementById('runBtn');
            isRunning = false;
            runBtn.disabled = false;
            runBtn.classList.remove('loading');
            runBtn.innerHTML = '<i class="fas fa-play"></i> Run';
            
            // Reset input state
            isAwaitingInput = false;
            userInputBuffer = '';
            consoleElement.classList.remove('waiting-input');
        }
    }

    // Function to display errors properly with syntax highlighting
    function formatErrorOutput(stderr, language) {
        if (!stderr) return '';
        
        // For C/C++ compilation errors, enhance the display
        if ((language === 'c' || language === 'cpp') && 
            (stderr.includes('error:') || stderr.includes('warning:'))) {
            
            // Split the error by lines
            const lines = stderr.split('\n');
            let formattedError = '';
            
            for (const line of lines) {
                if (line.includes('error:')) {
                    formattedError += `<span class="error">${line}</span>\n`;
                } else if (line.includes('warning:')) {
                    formattedError += `<span style="color: orange;">${line}</span>\n`;
                } else {
                    formattedError += line + '\n';
                }
            }
            
            return formattedError;
        }
        
        return stderr;
    }
});