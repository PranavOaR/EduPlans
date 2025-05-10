document.addEventListener('DOMContentLoaded', () => {
    // Add this timeout helper function right after the DOMContentLoaded opening
    function timeoutPromise(promise, timeout = 10000) {
        return Promise.race([
            promise,
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timed out')), timeout)
            )
        ]);
    }

    // Initialize CodeMirror
    const editor = CodeMirror.fromTextArea(document.getElementById('codeEditor'), {
        lineNumbers: true,
        theme: 'dracula',
        mode: 'python',
        autoCloseBrackets: true,
        matchBrackets: true,
        indentUnit: 4,
        tabSize: 4,
        lineWrapping: true,
        extraKeys: {
            "Tab": "indentMore"
        }
    });

    // Language templates
    const templates = {
        python: `print("Hello, World!")`,
        cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}`,
        c: `#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}`,
        java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`
    };

    // Language mappings for Piston API
    const languageMappings = {
        python: { language: 'python', version: '3.10.0' },
        cpp: { language: 'cpp', version: '10.2.0' },
        c: { language: 'c', version: '10.2.0' },
        java: { language: 'java', version: '15.0.2' }
    };

    // Set initial template
    editor.setValue(templates.python);

    // Language selection handler
    document.getElementById('languageSelect').addEventListener('change', (e) => {
        const language = e.target.value;
        editor.setOption('mode', language === 'python' ? 'python' : 'text/x-c++src');
        editor.setValue(templates[language]);
    });

    // Run button handler
    document.getElementById('runBtn').addEventListener('click', async () => {
        const runBtn = document.getElementById('runBtn');
        const output = document.getElementById('output');
        const language = document.getElementById('languageSelect').value;
        const code = editor.getValue();

        runBtn.disabled = true;
        runBtn.classList.add('loading');
        output.textContent = 'Compiling and running...';

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
                        }]
                    })
                }),
                15000 // 15 second timeout
            );

            const data = await response.json();
            
            if (data.run) {
                if (data.run.output) {
                    output.textContent = data.run.output;
                } else if (data.run.stderr) {
                    output.textContent = 'Error: ' + data.run.stderr;
                    output.classList.add('error');
                }
            } else {
                output.textContent = 'Error: Failed to execute code';
                output.classList.add('error');
            }
        } catch (error) {
            output.textContent = error.message === 'Request timed out' 
                ? 'Error: Code execution timed out' 
                : 'Error: Could not connect to the compiler service';
            output.classList.add('error');
            console.error(error);
        } finally {
            runBtn.disabled = false;
            runBtn.classList.remove('loading');
            setTimeout(() => output.classList.remove('error'), 3000);
        }
    });

    // Clear button handler
    document.getElementById('clearBtn').addEventListener('click', () => {
        const language = document.getElementById('languageSelect').value;
        editor.setValue(templates[language]);
        document.getElementById('output').textContent = '';
    });

    // Copy output button handler
    document.getElementById('copyOutput').addEventListener('click', () => {
        const output = document.getElementById('output').textContent;
        navigator.clipboard.writeText(output);
        
        const copyBtn = document.getElementById('copyOutput');
        copyBtn.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => {
            copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
        }, 2000);
    });
});