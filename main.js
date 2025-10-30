// Academic Writing Assistant with Gemini AI
// Version 1.0 - Static Website Edition

// API Configuration
let API_KEY = ''; // Will be loaded from localStorage or user input
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

// Application State
const appState = {
    text: '',
    scaffoldText: '',
    uploadedFiles: [], // Array to store multiple files
    articlePlan: [],
    liveAnalysis: null,
    ghostSuggestion: '',
    isLoading: false,
    isPlanLoading: false,
    isCheckingPlagiarism: false,
    plagiarismReport: null,
    highlightMode: 'style',
    analysisTimeout: null,
    citations: [],
    hypotheticalSections: [],
    currentSentenceIndex: 0,
    sectionProgress: 0,
    detailedGuidance: null,
    autoCompleteEnabled: false,
    currentWordSuggestion: '',
    lastTypedWord: ''
};

// DOM Elements
const elements = {
    mainEditor: document.getElementById('mainEditor'),
    currentSection: document.getElementById('currentSection'),
    scaffoldText: document.getElementById('scaffoldText'),
    fileUpload: document.getElementById('fileUpload'),
    uploadedFiles: document.getElementById('uploadedFiles'),
    generatePlanBtn: document.getElementById('generatePlanBtn'),
    planList: document.getElementById('planList'),
    planSteps: document.getElementById('planSteps'),
    smartGuide: document.getElementById('smartGuide'),
    guideText: document.getElementById('guideText'),
    detailedSuggestions: document.getElementById('detailedSuggestions'),
    nextSentenceSuggestion: document.getElementById('nextSentenceSuggestion'),
    keywordsSuggestion: document.getElementById('keywordsSuggestion'),
    sectionProgress: document.getElementById('sectionProgress'),
    ghostHint: document.getElementById('ghostHint'),
    continueBtn: document.getElementById('continueBtn'),
    sidebar: document.getElementById('sidebar'),
    mobileMenuBtn: document.getElementById('mobileMenuBtn'),
    closeSidebarBtn: document.getElementById('closeSidebarBtn'),
    drawerBackdrop: document.getElementById('drawerBackdrop'),
    analysisTab: document.getElementById('analysisTab'),
    plagiarismTab: document.getElementById('plagiarismTab'),
    analysisPanel: document.getElementById('analysisPanel'),
    plagiarismPanel: document.getElementById('plagiarismPanel'),
    checkPlagiarismBtn: document.getElementById('checkPlagiarismBtn'),
    plagiarismContent: document.getElementById('plagiarismContent'),
    issuesList: document.getElementById('issuesList'),
    issuePopover: document.getElementById('issuePopover'),
    closePopoverBtn: document.getElementById('closePopoverBtn'),
    popoverTitle: document.getElementById('popoverTitle'),
    popoverContent: document.getElementById('popoverContent'),
    loadingIndicator: document.getElementById('loadingIndicator'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    clarityMetric: document.getElementById('clarityMetric'),
    contributionMetric: document.getElementById('contributionMetric'),
    rigorMetric: document.getElementById('rigorMetric'),
    limitationMetric: document.getElementById('limitationMetric'),
    charCount: document.getElementById('charCount'),
    wordCount: document.getElementById('wordCount'),
    editorContainer: document.getElementById('editorContainer'),
    referencesBox: document.getElementById('referencesBox'),
    citationsList: document.getElementById('citationsList'),
    addCitationBtn: document.getElementById('addCitationBtn'),
    citationModal: document.getElementById('citationModal'),
    citationForm: document.getElementById('citationForm'),
    closeCitationModal: document.getElementById('closeCitationModal'),
    settingsBtn: document.getElementById('settingsBtn'),
    settingsModal: document.getElementById('settingsModal'),
    closeSettingsModal: document.getElementById('closeSettingsModal'),
    apiKeyInput: document.getElementById('apiKeyInput'),
    saveApiKeyBtn: document.getElementById('saveApiKeyBtn'),
    apiKeyStatus: document.getElementById('apiKeyStatus'),
    sectionBadges: document.getElementById('sectionBadges'),
    currentSubsection: document.getElementById('currentSubsection'),
    nextSection: document.getElementById('nextSection'),
    draftSection: document.getElementById('draftSection'),
    generateDraftBtn: document.getElementById('generateDraftBtn'),
    showExampleBtn: document.getElementById('showExampleBtn'),
    autoCompleteToggle: document.getElementById('autoCompleteToggle')
};

// Schemas for API responses
const liveCoAuthorSchema = {
    type: "OBJECT",
    properties: {
        "detectedSection": { "type": "STRING" },
        "currentSubsection": { "type": "STRING" },
        "nextSection": { "type": "STRING" },
        "currentTask": { "type": "STRING" },
        "nextTaskSuggestion": { "type": "STRING" },
        "lastSentenceCorrected": { "type": "STRING" },
        "nextSentencesSuggestion": { "type": "ARRAY", "items": { "type": "STRING" } },
        "detailedNextSentence": { "type": "STRING" },
        "relevantKeywords": { "type": "ARRAY", "items": { "type": "STRING" } },
        "sectionCompletionPercentage": { "type": "NUMBER" },
        "microGuidance": { "type": "STRING" },
        "citationNeeded": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "snippet": { "type": "STRING" },
                    "reason": { "type": "STRING" },
                    "position": { "type": "NUMBER" }
                },
                "required": ["snippet", "reason"]
            }
        },
        "issues": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "snippet": { "type": "STRING" },
                    "type": { "type": "STRING", "enum": ["consistency", "style", "grammar", "typo", "citation", "clarity", "logic"] },
                    "explanation": { "type": "STRING" },
                    "suggestion": { "type": "STRING" },
                    "correctWord": { "type": "STRING" },
                    "severity": { "type": "STRING", "enum": ["low", "medium", "high"] }
                },
                "required": ["snippet", "type", "explanation", "suggestion", "severity"]
            }
        },
        "reviewerMetrics": {
            "type": "OBJECT",
            "properties": {
                "clarityOfClaims": { "type": "STRING" },
                "methodologicalRigor": { "type": "STRING" },
                "contributionSignal": { "type": "STRING" },
                "limitationCheck": { "type": "BOOLEAN" }
            }
        }
    },
    required: ["detectedSection", "currentTask", "nextTaskSuggestion", "lastSentenceCorrected", "nextSentencesSuggestion", "detailedNextSentence", "relevantKeywords", "sectionCompletionPercentage", "microGuidance", "citationNeeded", "issues", "reviewerMetrics"]
};

const articleContinuationSchema = {
    type: "OBJECT",
    properties: {
        "continuationText": { "type": "STRING" },
        "citations": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "text": { "type": "STRING" },
                    "source": { "type": "STRING" },
                    "isHypothetical": { "type": "BOOLEAN" }
                },
                "required": ["text", "source", "isHypothetical"]
            }
        },
        "hypotheticalSections": {
            "type": "ARRAY",
            "items": { "type": "STRING" }
        }
    },
    required: ["continuationText", "citations", "hypotheticalSections"]
};

// Utility Functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// API Key Management
function loadApiKey() {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
        API_KEY = savedKey;
        return true;
    }
    return false;
}

function saveApiKey(key) {
    API_KEY = key;
    localStorage.setItem('gemini_api_key', key);
}

function openSettingsModal() {
    elements.settingsModal.classList.remove('hidden');
    if (API_KEY) {
        elements.apiKeyInput.value = API_KEY;
    }
}

function closeSettingsModal() {
    elements.settingsModal.classList.add('hidden');
    elements.apiKeyStatus.classList.add('hidden');
}

function showApiKeyStatus(message, type) {
    elements.apiKeyStatus.textContent = message;
    elements.apiKeyStatus.classList.remove('hidden', 'success', 'error', 'info');
    elements.apiKeyStatus.classList.add(type);
}

function checkApiKey() {
    if (!API_KEY) {
        alert('⚠️ لطفاً ابتدا API Key خود را در تنظیمات وارد کنید.\n\nبرای دریافت API Key رایگان به https://aistudio.google.com/app/apikey مراجعه کنید.');
        openSettingsModal();
        return false;
    }
    
    // Check if API key format looks valid
    if (!API_KEY.startsWith('AIza')) {
        alert('⚠️ فرمت API Key نامعتبر است.\n\nAPI Key باید با "AIza" شروع شود.\n\nلطفاً API Key را دوباره بررسی کنید.');
        openSettingsModal();
        return false;
    }
    
    return true;
}

// Test API Key validity
async function testApiKey(apiKey) {
    const testPayload = {
        contents: [{ parts: [{ text: "Hello" }] }]
    };
    
    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testPayload)
        });
        
        return response.ok;
    } catch (error) {
        return false;
    }
}

// API Functions with Retry
async function callGeminiAPI(prompt, systemPrompt, schema, retries = 2) {
    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: schema
        }
    };

    if (systemPrompt) {
        payload.systemInstruction = { parts: [{ text: systemPrompt }] };
    }

    try {
        console.log('🔄 Calling Gemini API...');
        console.log('📤 Payload:', JSON.stringify(payload, null, 2));
        
        const response = await fetch(`${GEMINI_API_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        console.log('📥 Response status:', response.status);
        
        const result = await response.json();
        console.log('📥 Full response:', JSON.stringify(result, null, 2));

        if (!response.ok) {
            // Extract detailed error message
            const errorMessage = result?.error?.message || `API call failed: ${response.status}`;
            console.error('❌ API Error:', errorMessage);
            throw new Error(errorMessage);
        }

        // Check if we have valid response structure
        if (!result.candidates || !result.candidates[0] || !result.candidates[0].content) {
            console.error('❌ Invalid response structure:', result);
            throw new Error('Invalid API response structure');
        }

        const text = result.candidates[0].content.parts[0].text;
        console.log('✅ Parsed text:', text);
        
        return JSON.parse(text);
    } catch (error) {
        console.error('❌ Gemini API Error:', error);
        console.error('❌ Error details:', error.message);
        
        // Retry logic
        if (retries > 0 && (error.message.includes('429') || error.message.includes('503') || error.message.includes('network'))) {
            console.log(`🔄 Retrying... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, (3 - retries) * 2000)); // Exponential backoff
            return callGeminiAPI(prompt, systemPrompt, schema, retries - 1);
        }
        
        throw error;
    }
}

// File Upload Handler - Support Multiple Files
async function handleFileUpload(event) {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    // Read all files
    const readPromises = files.map(file => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve({ name: file.name, content: e.target.result });
            reader.onerror = reject;
            reader.readAsText(file);
        });
    });

    try {
        const uploadedFiles = await Promise.all(readPromises);
        appState.uploadedFiles = uploadedFiles;
        displayUploadedFiles();
    } catch (error) {
        console.error('Error reading files:', error);
        alert('خطا در خواندن فایل‌ها');
    }
}

function displayUploadedFiles() {
    if (appState.uploadedFiles.length === 0) {
        elements.uploadedFiles.innerHTML = '';
        elements.uploadedFiles.classList.add('hidden');
        return;
    }

    elements.uploadedFiles.innerHTML = appState.uploadedFiles.map((file, index) => `
        <div class="uploaded-file-item">
            <div class="uploaded-file-name">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                </svg>
                <span>${escapeHtml(file.name)}</span>
            </div>
            <button class="remove-file-btn" onclick="removeFile(${index})">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
    `).join('');
    
    elements.uploadedFiles.classList.remove('hidden');
}

function removeFile(index) {
    if (index === undefined) {
        // Remove all files
        appState.uploadedFiles = [];
    } else {
        // Remove specific file
        appState.uploadedFiles.splice(index, 1);
    }
    displayUploadedFiles();
    elements.fileUpload.value = '';
}

// Get all uploaded file content combined
function getAllUploadedContent() {
    return appState.uploadedFiles.map(f => `[${f.name}]\n${f.content}`).join('\n\n');
}

// Citation Management
function displayCitations() {
    if (appState.citations.length === 0) {
        elements.citationsList.innerHTML = '<p class="empty-citations">هنوز منبعی اضافه نشده است</p>';
        elements.referencesBox.classList.add('hidden');
        return;
    }

    elements.referencesBox.classList.remove('hidden');
    
    elements.citationsList.innerHTML = appState.citations.map((citation, index) => `
        <div class="citation-item" data-index="${index}">
            <div class="citation-content">
                <div class="citation-text">${escapeHtml(citation.source)}</div>
                <div class="citation-meta">
                    ${citation.isHypothetical ? '<span class="citation-hypothetical">فرضی</span>' : '<span class="citation-type">واقعی</span>'}
                </div>
            </div>
            <div class="citation-actions">
                <button class="citation-delete-btn" onclick="deleteCitation(${index})">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');
}

function addCitation(citationData) {
    appState.citations.push(citationData);
    displayCitations();
    localStorage.setItem('citations', JSON.stringify(appState.citations));
}

function deleteCitation(index) {
    appState.citations.splice(index, 1);
    displayCitations();
    localStorage.setItem('citations', JSON.stringify(appState.citations));
}

function openCitationModal() {
    elements.citationModal.classList.remove('hidden');
}

function closeCitationModal() {
    elements.citationModal.classList.add('hidden');
    elements.citationForm.reset();
}

// Generate Article Plan
async function generatePlan() {
    if (!checkApiKey()) return;
    
    const uploadedContent = getAllUploadedContent();
    const contextText = elements.scaffoldText.value.trim() || uploadedContent;
    
    if (!contextText) {
        alert('لطفاً ابتدا اطلاعات پیش‌زمینه را وارد کنید یا فایلی آپلود کنید');
        return;
    }

    appState.isPlanLoading = true;
    elements.generatePlanBtn.disabled = true;
    elements.loadingIndicator.classList.remove('hidden');

    const planSchema = {
        type: "OBJECT",
        properties: {
            "plan": { "type": "ARRAY", "items": { "type": "STRING" } }
        },
        required: ["plan"]
    };

    const combinedContext = uploadedContent ? 
        `${uploadedContent}\n\nAdditional Info: ${elements.scaffoldText.value}` : 
        elements.scaffoldText.value;

    // Limit context length to avoid API issues
    const maxContextLength = 5000;
    const trimmedContext = combinedContext.length > maxContextLength 
        ? combinedContext.substring(0, maxContextLength) + '...' 
        : combinedContext;
    
    const prompt = `Based on the following context and background information, generate a detailed, step-by-step plan for an academic paper in Persian.
    Consider all uploaded content and provided information.
    Context: ${trimmedContext}
    Generate a comprehensive plan with specific sections, subsections, and key points to cover. Return at least 5-10 steps.`;

    try {
        console.log('🚀 Starting plan generation...');
        const result = await callGeminiAPI(prompt, null, planSchema);
        console.log('✅ Plan generated:', result);
        
        if (!result || !result.plan || !Array.isArray(result.plan)) {
            throw new Error('Invalid plan structure received from API');
        }
        
        appState.articlePlan = result.plan;
        appState.scaffoldText = elements.scaffoldText.value;
        displayPlan();
        
        alert(`✅ نقشه راه با موفقیت تولید شد!\n${result.plan.length} بخش ایجاد شد.`);
    } catch (error) {
        console.error('❌ Error generating plan:', error);
        
        // Show detailed error to user
        let errorMessage = 'خطا در تولید نقشه راه:\n\n';
        
        if (error.message.includes('API call failed: 400')) {
            errorMessage += '⚠️ خطای 400: درخواست نامعتبر\n';
            errorMessage += 'احتمالاً API Key نامعتبر است یا فرمت درخواست اشتباه است.\n\n';
            errorMessage += 'لطفاً:\n';
            errorMessage += '1. API Key خود را دوباره بررسی کنید\n';
            errorMessage += '2. از تنظیمات، API Key جدید وارد کنید\n';
            errorMessage += '3. مطمئن شوید که API Key فعال است';
        } else if (error.message.includes('API call failed: 429')) {
            errorMessage += '⚠️ خطای 429: تعداد درخواست‌ها زیاد است\n';
            errorMessage += 'لطفاً چند دقیقه صبر کنید و دوباره تلاش کنید.';
        } else if (error.message.includes('API call failed: 403')) {
            errorMessage += '⚠️ خطای 403: دسترسی رد شد\n';
            errorMessage += 'API Key شما معتبر نیست یا دسترسی ندارد.';
        } else if (error.message.includes('Invalid API response')) {
            errorMessage += '⚠️ پاسخ نامعتبر از API\n';
            errorMessage += 'لطفاً دوباره تلاش کنید.';
        } else {
            errorMessage += `⚠️ ${error.message}\n\n`;
            errorMessage += 'لطفاً:\n';
            errorMessage += '1. اتصال اینترنت خود را بررسی کنید\n';
            errorMessage += '2. API Key را دوباره وارد کنید\n';
            errorMessage += '3. Console مرورگر را برای جزئیات بیشتر بررسی کنید (F12)';
        }
        
        // Log error for debugging
        console.error('📋 Full error details for debugging:');
        console.error('Error:', error);
        console.error('API Key (first 10 chars):', API_KEY.substring(0, 10) + '...');
        console.error('Context length:', combinedContext.length);
        
        alert(errorMessage);
    } finally {
        appState.isPlanLoading = false;
        elements.generatePlanBtn.disabled = false;
        elements.loadingIndicator.classList.add('hidden');
    }
}

function displayPlan() {
    if (appState.articlePlan.length === 0) return;

    elements.planSteps.innerHTML = '';
    appState.articlePlan.forEach((step, index) => {
        const li = document.createElement('li');
        li.textContent = step;
        li.id = `plan-step-${index}`;
        elements.planSteps.appendChild(li);
    });

    elements.planList.classList.remove('hidden');
    
    // Show draft generation button
    elements.draftSection.classList.remove('hidden');
    
    // Show example button (only if editor is empty)
    if (elements.mainEditor.innerText.trim().length === 0) {
        elements.showExampleBtn.classList.remove('hidden');
        // Show initial guidance and ghost text automatically
        showInitialGuidance();
    }
}

// Auto-Complete Word Suggestion
async function generateWordSuggestion(currentText) {
    if (!appState.autoCompleteEnabled || !API_KEY) return;
    
    // Get last few words for context
    const words = currentText.trim().split(/\s+/);
    const lastWords = words.slice(-10).join(' ');
    
    try {
        const suggestionSchema = {
            type: "OBJECT",
            properties: {
                "nextWord": { "type": "STRING" }
            },
            required: ["nextWord"]
        };
        
        const systemPrompt = `You are an AI autocomplete assistant for academic writing in English.
        Predict the SINGLE most likely next word based on context.
        
        RULES:
        - Return ONLY ONE word (the most probable next word)
        - Use academic English vocabulary
        - Consider grammar and context
        - Be precise and relevant`;
        
        const prompt = `Context: "${lastWords}"\n\nPredict the single most likely next word.`;
        
        const result = await callGeminiAPI(prompt, systemPrompt, suggestionSchema, 0); // No retries for speed
        
        return result.nextWord || '';
    } catch (error) {
        console.error('Word suggestion error:', error);
        return '';
    }
}

// Show initial guidance and example text
async function showInitialGuidance() {
    // Show smart guide with starting instructions
    elements.smartGuide.classList.remove('hidden');
    
    if (!API_KEY) {
        // Show generic guidance without API
        elements.guideText.innerHTML = `
            <strong>🎯 Writing for International Publication</strong><br>
            <span style="color: var(--text-secondary); font-size: 0.875rem; display: block; margin-top: 0.5rem;">
                💡 To get AI-powered guidance and publication-ready examples, please add your API Key in Settings.
                <br><br>
                <strong>Structure for Top-Tier Journals:</strong><br>
                1️⃣ Opening: Establish broad context and importance<br>
                2️⃣ Narrow down to specific research area<br>
                3️⃣ Identify gap in current knowledge<br>
                4️⃣ State research objectives clearly<br>
                5️⃣ Highlight novelty and contribution
            </span>
        `;
        
        // Show generic example in English
        const topic = appState.scaffoldText.substring(0, 50) || 'this research area';
        elements.mainEditor.innerHTML = `<span class="initial-ghost-text" contenteditable="false">Recent advances in ${topic} have significantly transformed our understanding of [field]. However, despite considerable progress, several critical challenges remain unresolved, particularly regarding [specific gap]. This study addresses this gap by investigating...</span>`;
        return;
    }
    
    // Show smart guide with starting instructions
    elements.smartGuide.classList.remove('hidden');
    elements.guideText.innerHTML = `
        <strong>🎯 راهنمای شروع مقاله</strong><br>
        <span style="color: var(--text-secondary); font-size: 0.875rem; display: block; margin-top: 0.5rem;">
            💡 برای شروع، یک جمله افتتاحیه قوی بنویسید که توجه خواننده را جلب کند. 
            از آمار، سوال، یا بیان مشکل تحقیق شروع کنید.
        </span>
    `;
    
    // Generate example opening based on plan
    try {
        const exampleSchema = {
            type: "OBJECT",
            properties: {
                "openingSentence": { "type": "STRING" },
                "secondSentence": { "type": "STRING" },
                "thirdSentence": { "type": "STRING" }
            },
            required: ["openingSentence", "secondSentence", "thirdSentence"]
        };
        
        const uploadedContent = getAllUploadedContent();
        const backgroundInfo = uploadedContent || appState.scaffoldText || '';
        
        const systemPrompt = `You are a PROFESSIONAL RESEARCH ASSISTANT writing for TOP-TIER INTERNATIONAL JOURNALS (Nature, Science, Q1 journals).

        **CRITICAL: Generate publication-ready ENGLISH text suitable for prestigious international journals.**
        
        YOUR TASK: Write sophisticated, publication-quality opening sentences that:
        - Use precise academic English
        - Demonstrate strong command of scholarly writing
        - Include specific terminology relevant to the field
        - Follow conventions of high-impact journals
        - Are compelling yet scientifically rigorous
        
        Background: ${backgroundInfo}
        Article Plan: ${appState.articlePlan.join('\n')}`;
        
        const prompt = `Generate 3 publication-ready opening sentences for the Introduction section of this research paper.

        Requirements:
        - Write in professional academic ENGLISH for international journals
        - Start with a broad context statement (establishing importance)
        - Progress to specific problem/gap
        - Use sophisticated academic vocabulary
        - Follow conventions of top-tier journals
        - Be precise and scientifically rigorous
        
        Example quality level: "Recent advances in machine learning have revolutionized computational biology, enabling unprecedented insights into complex biological systems (Author, 2023). However, existing approaches face significant limitations in handling high-dimensional genomic data..."`;

        
        const result = await callGeminiAPI(prompt, systemPrompt, exampleSchema);
        
        // Display ghost text in editor
        const ghostText = `${result.openingSentence} ${result.secondSentence} ${result.thirdSentence}`;
        
        // Add ghost text to editor
        elements.mainEditor.innerHTML = `<span class="initial-ghost-text" contenteditable="false">${escapeHtml(ghostText)}</span>`;
        
        // Update guide with more specific instructions
        elements.guideText.innerHTML = `
            <strong>🎯 پیشنهاد شروع مقاله</strong><br>
            <span style="color: var(--text-secondary); font-size: 0.875rem; display: block; margin-top: 0.5rem;">
                💡 متن کمرنگ در ادیتور یک نمونه است. شروع به تایپ کنید تا جایگزین شود.
                <br><br>
                <strong>نکات مهم:</strong><br>
                ✓ با یک جمله جذاب شروع کنید<br>
                ✓ مشکل یا شکاف تحقیقاتی را مشخص کنید<br>
                ✓ از زبان رسمی و علمی استفاده کنید
            </span>
        `;
        
    } catch (error) {
        console.error('Error generating initial guidance:', error);
        // Show generic guidance if API fails
        elements.mainEditor.innerHTML = `<span class="initial-ghost-text" contenteditable="false">در دنیای امروز، [موضوع تحقیق] یکی از چالش‌های مهم است که نیاز به بررسی دقیق دارد. مطالعات پیشین نشان می‌دهند که... با این حال، شکاف تحقیقاتی در زمینه... همچنان وجود دارد.</span>`;
    }
}

// Live Analysis with Detailed Teacher Guidance
async function performLiveAnalysis() {
    const text = appState.text;
    if (!text.trim()) {
        updateMetrics(null);
        updateCharacterCount();
        return;
    }
    
    if (!API_KEY) {
        // Silent fail if no API key, just update character count
        updateCharacterCount();
        return;
    }

    elements.loadingIndicator.classList.remove('hidden');
    updateCharacterCount();

    const uploadedContent = getAllUploadedContent();
    const backgroundInfo = uploadedContent || appState.scaffoldText || '';
    const sentences = text.split(/[.!?؟]\s*/);
    const currentSentence = sentences[sentences.length - 1] || '';

    const systemPrompt = `You are a PROFESSIONAL RESEARCH ASSISTANT helping to write a high-quality academic paper for TOP-TIER INTERNATIONAL JOURNALS (e.g., Nature, Science, high-impact Q1 journals).

    **CRITICAL: We are writing for INTERNATIONAL PUBLICATION in ENGLISH. This is NOT casual writing - this is RIGOROUS ACADEMIC RESEARCH.**
    
    **IMPORTANT: ALL guidance, suggestions, and output MUST be in ENGLISH. This is for English-language international journals.**
    
    Background Information/Context: ${backgroundInfo}
    Article Plan: ${appState.articlePlan.length > 0 ? appState.articlePlan.join('\n') : 'No specific plan'}
    
    YOUR ROLE: Act as an experienced research assistant who:
    - Ensures publication-ready quality for prestigious journals
    - Applies strict peer-review standards
    - Uses precise, formal academic English
    - Follows international research writing conventions
    - Maintains high scientific rigor
    
    CRITICAL Instructions:
    1. Detect the current section precisely (Abstract, Introduction, Literature Review, Methodology, Results, Discussion, Conclusion)
    2. **Detect the current SUBSECTION** (e.g., "Research Gap", "Hypothesis Statement", "Data Collection Method", "Statistical Analysis")
    3. **Predict the NEXT SECTION** logically based on academic paper structure
    4. Provide PUBLICATION-READY guidance - as if reviewing for a top journal
    5. Suggest professional, sophisticated academic language
    6. Ensure proper citation of claims (APA/IEEE style)
    7. Check for logical coherence and scientific rigor
    8. Identify methodological weaknesses
    9. Calculate section completion percentage (0-100)
    10. **Check for typos, grammar, clarity, and academic tone carefully**
    11. **Suggest high-impact academic phrases and terminology**
    
    Issue Types to Check:
    - consistency: Logical consistency and coherence
    - style: Academic writing style issues
    - grammar: Grammar and writing structure
    - typo: Typos and spelling errors (MUST include correctWord field with the correct spelling)
    - citation: Need for citation/reference
    - clarity: Clarity and transparency
    - logic: Logical reasoning
    
    **IMPORTANT for typo issues:**
    - When type is "typo", MUST provide the correctWord field
    - correctWord should contain ONLY the correct spelling of the word
    - Example: if snippet is "teh", correctWord should be "the"
    
    For citationNeeded array:
    - Identify EVERY claim, fact, statistic, or idea that requires a citation
    - Mark both NEW text and PREVIOUS text that needs citations
    - Provide clear reason why citation is needed
    
    **REMEMBER: All responses MUST be in English. Do not use Persian/Farsi in any field.**`;

    const prompt = `Current full text:\n${text}\n\nLast sentence being written:\n"${currentSentence}"\n\nProvide detailed micro-guidance for the very next sentence.`;

    try {
        const analysis = await callGeminiAPI(prompt, systemPrompt, liveCoAuthorSchema);
        appState.liveAnalysis = analysis;
        updateUI(analysis);
        updateDetailedGuidance(analysis);
    } catch (error) {
        console.error('Analysis error:', error);
    } finally {
        elements.loadingIndicator.classList.add('hidden');
    }
}

// Update Character Count
function updateCharacterCount() {
    const text = appState.text;
    const charCount = text.length;
    const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
    
    if (elements.charCount) elements.charCount.textContent = charCount.toLocaleString('fa-IR');
    if (elements.wordCount) elements.wordCount.textContent = wordCount.toLocaleString('fa-IR');
}

// Update Detailed Teacher Guidance
function updateDetailedGuidance(analysis) {
    if (!analysis) return;
    
    // Show detailed suggestions
    if (analysis.detailedNextSentence) {
        elements.nextSentenceSuggestion.textContent = analysis.detailedNextSentence;
        elements.detailedSuggestions.classList.remove('hidden');
    }
    
    // Show keywords
    if (analysis.relevantKeywords && analysis.relevantKeywords.length > 0) {
        elements.keywordsSuggestion.innerHTML = analysis.relevantKeywords
            .map(keyword => `<span class="keyword-chip">${keyword}</span>`)
            .join('');
    }
    
    // Update progress
    if (analysis.sectionCompletionPercentage !== undefined) {
        elements.sectionProgress.style.width = `${analysis.sectionCompletionPercentage}%`;
    }
    
    // Update micro-guidance with citation alerts
    if (analysis.microGuidance) {
        let guidanceHTML = `
            <strong>${analysis.nextTaskSuggestion}</strong><br>
            <span style="color: var(--text-secondary); font-size: 0.875rem; display: block; margin-top: 0.5rem;">
                💡 ${analysis.microGuidance}
            </span>
        `;
        
        // Add citation alerts if needed
        if (analysis.citationNeeded && analysis.citationNeeded.length > 0) {
            guidanceHTML += `
                <div style="background: rgba(168, 85, 247, 0.1); padding: 0.625rem; border-radius: 0.375rem; margin-top: 0.75rem; border-right: 3px solid #a855f7;">
                    <strong style="color: #a855f7; font-size: 0.75rem;">📚 نیاز به ارجاع:</strong>
                    <ul style="margin: 0.5rem 0 0 0; padding-right: 1.25rem; font-size: 0.8125rem; color: var(--text-secondary);">
                        ${analysis.citationNeeded.slice(0, 3).map(c => `<li>"${escapeHtml(c.snippet)}" - ${escapeHtml(c.reason)}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        elements.guideText.innerHTML = guidanceHTML;
    }
}

// Generate Academic Draft
async function generateDraft() {
    if (!checkApiKey()) return;
    
    if (appState.articlePlan.length === 0) {
        alert('لطفاً ابتدا نقشه راه مقاله را تولید کنید');
        return;
    }

    elements.loadingOverlay.classList.remove('hidden');
    elements.generateDraftBtn.disabled = true;

    const draftSchema = {
        type: "OBJECT",
        properties: {
            "title": { "type": "STRING" },
            "abstract": { "type": "STRING" },
            "sections": {
                "type": "ARRAY",
                "items": {
                    "type": "OBJECT",
                    "properties": {
                        "sectionName": { "type": "STRING" },
                        "content": { "type": "STRING" }
                    },
                    "required": ["sectionName", "content"]
                }
            },
            "citations": {
                "type": "ARRAY",
                "items": {
                    "type": "OBJECT",
                    "properties": {
                        "text": { "type": "STRING" },
                        "source": { "type": "STRING" },
                        "isHypothetical": { "type": "BOOLEAN" }
                    },
                    "required": ["text", "source", "isHypothetical"]
                }
            }
        },
        "required": ["title", "abstract", "sections", "citations"]
    };

    const uploadedContent = getAllUploadedContent();
    const backgroundInfo = uploadedContent || appState.scaffoldText || '';

    const systemPrompt = `You are a SENIOR RESEARCH ASSISTANT preparing a manuscript for TOP-TIER INTERNATIONAL JOURNALS (Nature, Science, Cell, high-impact Q1 journals).

    **CRITICAL: Write in PROFESSIONAL ACADEMIC ENGLISH for international publication.**
    
    PUBLICATION STANDARDS:
    1. Write ENTIRELY in sophisticated academic ENGLISH
    2. Follow strict conventions of prestigious international journals
    3. Structure: Title, Abstract, Introduction, Literature Review/Background, Methodology, Results, Discussion, Conclusion
    4. Use precise, formal scientific English
    5. Include in-text citations in academic format [Author, Year] or [1]
    6. Maintain high scientific rigor throughout
    7. Each section must be comprehensive and publication-ready
    8. Abstract: 150-250 words, structured (Background, Methods, Results, Conclusions)
    9. Use field-specific terminology appropriately
    10. Ensure logical flow and coherence
    11. Apply peer-review quality standards
    
    Background Information: ${backgroundInfo}
    Article Plan: ${appState.articlePlan.join('\n')}`;

    const prompt = `Generate a complete, publication-ready research paper draft in ENGLISH for submission to top-tier international journals.

    Requirements:
    - Professional academic ENGLISH throughout
    - Compelling, specific title
    - Structured abstract (Background, Methods, Results, Conclusions) 150-250 words
    - All major sections with detailed, rigorous content
    - Proper in-text citations [Author, Year]
    - Mark hypothetical citations that need real sources
    - Publication-quality writing suitable for Nature, Science, or equivalent
    - Scientific precision and clarity
    
    Make it ready for peer review at prestigious journals.`;

    try {
        console.log('🚀 Starting draft generation...');
        const result = await callGeminiAPI(prompt, systemPrompt, draftSchema);
        console.log('✅ Draft generated:', result);
        
        // Build the full draft HTML
        let draftHTML = `<div class="academic-draft">`;
        
        // Title
        draftHTML += `<h1 class="draft-title">${escapeHtml(result.title)}</h1>`;
        
        // Abstract
        draftHTML += `<div class="draft-section">`;
        draftHTML += `<h2 class="draft-section-title">چکیده</h2>`;
        draftHTML += `<p class="draft-content">${escapeHtml(result.abstract)}</p>`;
        draftHTML += `</div>`;
        
        // Sections
        if (result.sections && result.sections.length > 0) {
            result.sections.forEach((section, index) => {
                draftHTML += `<div class="draft-section">`;
                draftHTML += `<h2 class="draft-section-title">${index + 1}. ${escapeHtml(section.sectionName)}</h2>`;
                draftHTML += `<p class="draft-content">${escapeHtml(section.content)}</p>`;
                draftHTML += `</div>`;
            });
        }
        
        draftHTML += `</div>`;
        
        // Set the editor content
        elements.mainEditor.innerHTML = draftHTML;
        appState.text = elements.mainEditor.innerText;
        
        // Add citations
        if (result.citations && result.citations.length > 0) {
            result.citations.forEach(citation => {
                appState.citations.push(citation);
            });
            displayCitations();
        }
        
        // Show success message
        alert(`✅ پیش‌نویس مقاله با موفقیت تولید شد!\n\n📄 شامل:\n- عنوان\n- چکیده\n- ${result.sections.length} بخش اصلی\n- ${result.citations.length} منبع\n\nحالا می‌توانید ویرایش و بهبود دهید.`);
        
        // Hide draft button, show continue button
        elements.draftSection.classList.add('hidden');
        
    } catch (error) {
        console.error('❌ Error generating draft:', error);
        
        let errorMessage = 'خطا در تولید پیش‌نویس مقاله:\n\n';
        errorMessage += `⚠️ ${error.message}\n\n`;
        errorMessage += 'لطفاً:\n';
        errorMessage += '1. اتصال اینترنت خود را بررسی کنید\n';
        errorMessage += '2. API Key را دوباره وارد کنید\n';
        errorMessage += '3. اطلاعات پیش‌زمینه کافی وارد کرده باشید';
        
        alert(errorMessage);
    } finally {
        elements.loadingOverlay.classList.add('hidden');
        elements.generateDraftBtn.disabled = false;
    }
}

// Continue Article with Citations
async function continueArticle() {
    if (!checkApiKey()) return;
    
    const text = appState.text;
    if (!text.trim()) {
        alert('لطفاً ابتدا متنی بنویسید');
        return;
    }

    elements.loadingOverlay.classList.remove('hidden');
    elements.continueBtn.disabled = true;

    const systemPrompt = `You are an expert academic writer. Continue the article based on the provided text.
    IMPORTANT RULES:
    1. Write in Persian
    2. Add proper academic citations in the format [1], [2], etc.
    3. For any information that is hypothetical or not based on real data, mark it as hypothetical
    4. Maintain academic tone and structure
    5. Include 3-5 relevant citations
    6. Clearly indicate which sections contain hypothetical information
    
    Article Plan: ${appState.articlePlan.length > 0 ? appState.articlePlan.join('\n') : 'General academic structure'}`;

    const prompt = `Continue this academic article with proper citations and mark hypothetical content:
    
    Current Text:
    ${text}
    
    Topic/Context:
    ${appState.scaffoldText || 'Academic research paper'}`;

    try {
        const result = await callGeminiAPI(prompt, systemPrompt, articleContinuationSchema);
        
        // Process the continuation
        let continuationText = result.continuationText;
        
        // Mark hypothetical sections with special highlighting
        if (result.hypotheticalSections && result.hypotheticalSections.length > 0) {
            result.hypotheticalSections.forEach(section => {
                continuationText = continuationText.replace(
                    section,
                    `<span class="highlight-hypothetical" title="این بخش بر اساس فرضیات نوشته شده است">${section}</span>`
                );
            });
        }
        
        // Add citations
        if (result.citations && result.citations.length > 0) {
            result.citations.forEach((citation, index) => {
                const citationNumber = appState.citations.length + index + 1;
                const citationMark = `[${citationNumber}]`;
                
                // Store citation
                appState.citations.push(citation);
                
                // Replace in text
                if (citation.text) {
                    continuationText = continuationText.replace(
                        citation.text,
                        `${citation.text}<sup class="citation-number">${citationMark}</sup>`
                    );
                }
            });
        }
        
        // Append to editor
        const currentText = elements.mainEditor.innerText;
        elements.mainEditor.innerHTML = escapeHtml(currentText) + '<br><br>' + continuationText;
        appState.text = elements.mainEditor.innerText;
        
        // Show citations at the bottom
        if (appState.citations.length > 0) {
            displayCitations();
        }
        
    } catch (error) {
        console.error('Error continuing article:', error);
        alert('خطا در ادامه دادن مقاله');
    } finally {
        elements.loadingOverlay.classList.add('hidden');
        elements.continueBtn.disabled = false;
    }
}

function displayCitations() {
    const citationsSection = document.createElement('div');
    citationsSection.className = 'citations-section';
    citationsSection.innerHTML = '<h3>منابع و مراجع:</h3>';
    
    const citationsList = document.createElement('ol');
    appState.citations.forEach((citation, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="${citation.isHypothetical ? 'hypothetical-citation' : ''}">${citation.source}</span>
            ${citation.isHypothetical ? ' <em>(فرضی - نیاز به جایگزینی با منبع واقعی)</em>' : ''}
        `;
        citationsList.appendChild(li);
    });
    
    citationsSection.appendChild(citationsList);
    
    // Add to the end of editor
    const existingCitations = document.querySelector('.citations-section');
    if (existingCitations) {
        existingCitations.remove();
    }
    elements.mainEditor.parentElement.appendChild(citationsSection);
}

// Update UI Functions
function updateUI(analysis) {
    if (!analysis) return;

    // Update section badges
    if (analysis.detectedSection || analysis.currentSubsection || analysis.nextSection) {
        elements.sectionBadges.classList.remove('hidden');
        
        // Update current section and subsection
        if (analysis.detectedSection) {
            elements.currentSection.textContent = analysis.detectedSection;
        }
        
        if (analysis.currentSubsection) {
            elements.currentSubsection.textContent = analysis.currentSubsection;
        } else {
            elements.currentSubsection.textContent = '--';
        }
        
        // Update next section
        if (analysis.nextSection) {
            elements.nextSection.textContent = analysis.nextSection;
        } else {
            elements.nextSection.textContent = '--';
        }
    }

    // Update smart guide
    if (analysis.nextTaskSuggestion) {
        elements.guideText.textContent = analysis.nextTaskSuggestion;
        elements.smartGuide.classList.remove('hidden');
    } else {
        elements.smartGuide.classList.add('hidden');
    }

    // Update metrics
    updateMetrics(analysis.reviewerMetrics);

    // Update issues list
    updateIssuesList(analysis.issues);

    // Handle ghost text and highlights
    updateGhostText(analysis);

    // Highlight current task in plan
    if (analysis.currentTask && appState.articlePlan.length > 0) {
        document.querySelectorAll('.plan-steps li').forEach(li => {
            li.classList.remove('active');
            if (li.textContent === analysis.currentTask) {
                li.classList.add('active');
            }
        });
    }
}

function updateMetrics(metrics) {
    if (!metrics) {
        elements.clarityMetric.textContent = '...';
        elements.contributionMetric.textContent = '...';
        elements.rigorMetric.textContent = '...';
        elements.limitationMetric.textContent = '...';
        return;
    }

    elements.clarityMetric.textContent = metrics.clarityOfClaims || '...';
    elements.contributionMetric.textContent = metrics.contributionSignal || '...';
    elements.rigorMetric.textContent = metrics.methodologicalRigor || '...';
    elements.limitationMetric.textContent = metrics.limitationCheck ? 'ذکر شده' : 'ذکر نشده';

    // Add color classes
    if (metrics.clarityOfClaims === 'واضح و مستدل') {
        elements.clarityMetric.classList.add('good');
    }
    if (metrics.contributionSignal === 'ادعای نوآوری قوی') {
        elements.contributionMetric.classList.add('good');
    }
    if (metrics.methodologicalRigor === 'معتبر به نظر می‌رسد') {
        elements.rigorMetric.classList.add('good');
    }
    if (metrics.limitationCheck) {
        elements.limitationMetric.classList.add('good');
    } else {
        elements.limitationMetric.classList.add('warn');
    }
}

function updateIssuesList(issues) {
    if (!issues || issues.length === 0) {
        elements.issuesList.innerHTML = '<p class="empty-message">هیچ مشکل آشکاری یافت نشد.</p>';
        return;
    }

    elements.issuesList.innerHTML = '';
    issues.forEach((issue, index) => {
        const issueDiv = document.createElement('div');
        issueDiv.className = 'issue-item';
        issueDiv.innerHTML = `
            <h4 class="issue-header ${issue.type}">
                ${issue.type === 'consistency' ? '❌' : issue.type === 'style' ? '💡' : '⚠️'}
                ${issue.type === 'consistency' ? 'ناسازگاری' : issue.type === 'style' ? 'سبک نگارش' : 'دستور زبان'}
            </h4>
            <p class="issue-snippet">"${escapeHtml(issue.snippet)}"</p>
            <p class="issue-explanation"><strong>توضیح:</strong> ${escapeHtml(issue.explanation)}</p>
            <p class="issue-suggestion"><strong>پیشنهاد:</strong> ${escapeHtml(issue.suggestion)}</p>
        `;
        elements.issuesList.appendChild(issueDiv);
    });
}

function updateGhostText(analysis) {
    if (!analysis) {
        appState.ghostSuggestion = '';
        elements.ghostHint.classList.add('hidden');
        return;
    }

    const correction = analysis.lastSentenceCorrected || '';
    const suggestions = (analysis.nextSentencesSuggestion || []).join(' ');
    appState.ghostSuggestion = (correction + ' ' + suggestions).trim();

    if (appState.ghostSuggestion) {
        // Show ghost text in editor
        renderEditorWithGhost();
        elements.ghostHint.classList.remove('hidden');
    } else {
        // Just update highlights without ghost text
        renderEditorWithGhost();
        elements.ghostHint.classList.add('hidden');
    }
}

function renderEditorWithGhost() {
    const currentText = appState.text;
    const ghostText = appState.ghostSuggestion;
    let html = escapeHtml(currentText);
    
    // Apply highlights for issues (only if we have issues)
    if (appState.liveAnalysis && appState.liveAnalysis.issues && appState.liveAnalysis.issues.length > 0) {
        const issues = appState.liveAnalysis.issues;
        
        // Sort by snippet length and filter duplicates
        const uniqueIssues = [];
        const seenSnippets = new Set();
        
        [...issues]
            .sort((a, b) => b.snippet.length - a.snippet.length)
            .forEach(issue => {
                if (issue.snippet && issue.snippet.trim() && !seenSnippets.has(issue.snippet.trim().toLowerCase())) {
                    seenSnippets.add(issue.snippet.trim().toLowerCase());
                    uniqueIssues.push(issue);
                }
            });
        
        // Apply highlights (max 10 to avoid cluttering)
        uniqueIssues.slice(0, 10).forEach(issue => {
            const snippetText = issue.snippet.trim();
            const escapedSnippet = escapeHtml(snippetText);
            const className = getHighlightClass(issue.type, issue.severity);
            
            // Prepare issue data for tooltip
            const issueDataForTooltip = {
                type: issue.type,
                explanation: issue.explanation,
                suggestion: issue.suggestion,
                severity: issue.severity,
                snippet: snippetText,
                correctWord: issue.correctWord || null // Include correctWord for typos
            };
            const issueData = escapeHtml(JSON.stringify(issueDataForTooltip));
            
            // Create clean highlighted span with proper attributes
            const highlightedSpan = `<span class="${className}" data-issue='${issueData}' style="cursor: pointer;">${escapedSnippet}</span>`;
            
            // Replace first occurrence only to avoid over-highlighting
            const regex = new RegExp(escapedSnippet.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            if (regex.test(html)) {
                html = html.replace(regex, highlightedSpan);
            }
        });
    }
    
    // Add ghost text at the end
    if (ghostText) {
        html += `<span class="ghost-text" data-ghost="true">${escapeHtml(ghostText)}</span>`;
    }
    
    // Update editor HTML
    elements.mainEditor.innerHTML = html;
    
    // Maintain cursor position
    maintainCursorPosition();
}

function getHighlightClass(type, severity) {
    const severityModifier = severity === 'high' ? 'severe' : severity === 'medium' ? 'moderate' : 'light';
    
    switch(type) {
        case 'consistency':
            return `highlight-consistency highlight-${severityModifier}`;
        case 'style':
            return `highlight-style highlight-${severityModifier}`;
        case 'grammar':
            return `highlight-grammar highlight-${severityModifier}`;
        case 'typo':
            return `highlight-typo highlight-${severityModifier}`;
        case 'citation':
            return `highlight-citation highlight-${severityModifier}`;
        case 'clarity':
            return `highlight-clarity highlight-${severityModifier}`;
        case 'logic':
            return `highlight-logic highlight-${severityModifier}`;
        default:
            return 'highlight-default';
    }
}

function maintainCursorPosition() {
    try {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;
        
        const range = document.createRange();
        const textNodes = Array.from(elements.mainEditor.childNodes).filter(node => 
            node.nodeType === Node.TEXT_NODE || (node.nodeType === Node.ELEMENT_NODE && !node.hasAttribute('data-ghost'))
        );
        
        if (textNodes.length > 0) {
            const lastNode = textNodes[textNodes.length - 1];
            
            if (lastNode.nodeType === Node.TEXT_NODE) {
                range.setStart(lastNode, Math.min(lastNode.length, lastNode.length));
                range.collapse(true);
            } else if (lastNode.lastChild && lastNode.lastChild.nodeType === Node.TEXT_NODE) {
                range.setStart(lastNode.lastChild, lastNode.lastChild.length);
                range.collapse(true);
            } else {
                range.selectNodeContents(lastNode);
                range.collapse(false);
            }
            
            sel.removeAllRanges();
            sel.addRange(range);
        }
    } catch (e) {
        // Silently fail if cursor positioning fails
        console.warn('Cursor positioning failed:', e);
    }
}

// Check Plagiarism
async function checkPlagiarism() {
    if (!checkApiKey()) return;
    
    const text = appState.text;
    if (!text.trim()) {
        alert('لطفاً ابتدا متنی بنویسید');
        return;
    }

    appState.isCheckingPlagiarism = true;
    elements.loadingOverlay.classList.remove('hidden');

    const plagiarismSchema = {
        type: "ARRAY",
        items: {
            type: "OBJECT",
            properties: {
                "snippet": { "type": "STRING" },
                "sourceTitle": { "type": "STRING" },
                "sourceUri": { "type": "STRING" }
            }
        }
    };

    const prompt = `Check the following Persian academic text for potential plagiarism. Find any sentences or phrases that might be copied from other sources:
    
    ${text}`;

    try {
        const findings = await callGeminiAPI(prompt, null, plagiarismSchema);
        displayPlagiarismReport(findings);
    } catch (error) {
        console.error('Plagiarism check error:', error);
        alert('خطا در بررسی سرقت ادبی');
    } finally {
        appState.isCheckingPlagiarism = false;
        elements.loadingOverlay.classList.add('hidden');
    }
}

function displayPlagiarismReport(findings) {
    if (!findings || findings.length === 0) {
        elements.plagiarismContent.innerHTML = `
            <div class="empty-state">
                <svg class="empty-icon" style="color: green;" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                    <path d="m9 12 2 2 4-4"/>
                </svg>
                <p class="empty-text">عالی! هیچ مورد مشکوکی یافت نشد.</p>
            </div>
        `;
    } else {
        const findingsHtml = findings.map(finding => `
            <div class="plagiarism-item">
                <p class="plagiarism-snippet">"${escapeHtml(finding.snippet)}"</p>
                <div class="plagiarism-source">
                    <strong>منبع احتمالی:</strong>
                    <a href="${finding.sourceUri}" target="_blank" rel="noopener noreferrer">
                        ${escapeHtml(finding.sourceTitle)}
                    </a>
                </div>
            </div>
        `).join('');

        elements.plagiarismContent.innerHTML = `
            <p style="margin-bottom: 1rem;">${findings.length} مورد مشکوک یافت شد:</p>
            <div class="plagiarism-findings">${findingsHtml}</div>
        `;
    }
}

// Event Handlers
elements.mainEditor.addEventListener('input', debounce(function(e) {
    appState.text = e.target.innerText;
    
    // Remove ghost text if user is typing
    const ghostElement = e.target.querySelector('[data-ghost]');
    if (ghostElement) {
        ghostElement.remove();
    }
    
    // Remove initial ghost text when user starts typing
    const initialGhost = e.target.querySelector('.initial-ghost-text');
    if (initialGhost && appState.text.trim().length > 0) {
        initialGhost.remove();
        // Hide example button
        elements.showExampleBtn.classList.add('hidden');
        // Update guide to show it's analyzing
        elements.guideText.innerHTML = `
            <strong>✍️ در حال تحلیل...</strong><br>
            <span style="color: var(--text-secondary); font-size: 0.875rem; display: block; margin-top: 0.5rem;">
                💡 معلم راهنما در حال بررسی متن شماست و به زودی راهنمایی‌های دقیق ارائه می‌دهد.
            </span>
        `;
    }
    
    performLiveAnalysis();
}, 800)); // Faster response for teacher guidance

// Remove initial ghost text on first click/focus
elements.mainEditor.addEventListener('focus', function(e) {
    const initialGhost = e.target.querySelector('.initial-ghost-text');
    if (initialGhost) {
        // Don't remove immediately, just make it more transparent
        initialGhost.style.opacity = '0.3';
    }
});

elements.mainEditor.addEventListener('click', function(e) {
    const initialGhost = e.target.querySelector('.initial-ghost-text');
    if (initialGhost && e.target === elements.mainEditor) {
        // If clicked on the editor itself (not the ghost text), prepare for typing
        initialGhost.style.opacity = '0.2';
    }
});

elements.mainEditor.addEventListener('keydown', function(e) {
    if (e.key === 'Tab' && appState.ghostSuggestion) {
        e.preventDefault();
        
        // Accept ghost text
        const newText = appState.text + ' ' + appState.ghostSuggestion;
        appState.text = newText;
        appState.ghostSuggestion = '';
        
        elements.mainEditor.innerText = newText;
        elements.ghostHint.classList.add('hidden');
        
        // Move cursor to end
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(elements.mainEditor);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
        
        performLiveAnalysis();
    }
});

// File Upload Handler
if (elements.fileUpload) {
    elements.fileUpload.addEventListener('change', handleFileUpload);
}

// Optimize touch scrolling for mobile
let touchStartY = 0;
let editorScrollTop = 0;

elements.mainEditor.addEventListener('touchstart', function(e) {
    touchStartY = e.touches[0].clientY;
    editorScrollTop = this.scrollTop;
}, { passive: true });

elements.mainEditor.addEventListener('touchmove', function(e) {
    const touchY = e.touches[0].clientY;
    const deltaY = touchStartY - touchY;
    
    // Smooth scrolling
    this.scrollTop = editorScrollTop + deltaY;
}, { passive: true });

// Prevent overscroll on mobile
elements.mainEditor.addEventListener('touchmove', function(e) {
    const isAtTop = this.scrollTop === 0;
    const isAtBottom = this.scrollHeight - this.scrollTop === this.clientHeight;
    
    if ((isAtTop && e.touches[0].clientY > touchStartY) || 
        (isAtBottom && e.touches[0].clientY < touchStartY)) {
        e.preventDefault();
    }
}, { passive: false });

elements.generatePlanBtn.addEventListener('click', generatePlan);
elements.generateDraftBtn.addEventListener('click', generateDraft);
elements.continueBtn.addEventListener('click', continueArticle);
elements.checkPlagiarismBtn?.addEventListener('click', checkPlagiarism);
elements.showExampleBtn.addEventListener('click', function() {
    showInitialGuidance();
});

// Auto-complete toggle
elements.autoCompleteToggle.addEventListener('change', function(e) {
    appState.autoCompleteEnabled = e.target.checked;
    
    if (!appState.autoCompleteEnabled) {
        // Remove any existing suggestions
        const suggestions = elements.mainEditor.querySelectorAll('.word-suggestion');
        suggestions.forEach(s => s.remove());
    }
    
    // Save preference
    localStorage.setItem('autoCompleteEnabled', appState.autoCompleteEnabled);
});

// Real-time word suggestion (debounced)
let wordSuggestionTimeout;
elements.mainEditor.addEventListener('keyup', async function(e) {
    if (!appState.autoCompleteEnabled || !API_KEY) return;
    
    // Only trigger on space or specific keys
    if (e.key === ' ' || e.key === 'Enter') {
        clearTimeout(wordSuggestionTimeout);
        
        wordSuggestionTimeout = setTimeout(async () => {
            const text = elements.mainEditor.innerText.trim();
            if (text.length > 10) { // Only if enough context
                const suggestion = await generateWordSuggestion(text);
                
                if (suggestion) {
                    // Remove old suggestions
                    const oldSuggestions = elements.mainEditor.querySelectorAll('.word-suggestion');
                    oldSuggestions.forEach(s => s.remove());
                    
                    // Add new suggestion at cursor
                    const selection = window.getSelection();
                    if (selection.rangeCount > 0) {
                        const range = selection.getRangeAt(0);
                        const suggestionSpan = document.createElement('span');
                        suggestionSpan.className = 'word-suggestion';
                        suggestionSpan.textContent = suggestion;
                        suggestionSpan.setAttribute('contenteditable', 'false');
                        range.insertNode(suggestionSpan);
                        
                        // Move cursor after suggestion
                        range.setStartAfter(suggestionSpan);
                        range.collapse(true);
                        selection.removeAllRanges();
                        selection.addRange(range);
                        
                        appState.currentWordSuggestion = suggestion;
                    }
                }
            }
        }, 1000); // Wait 1 second after typing
    }
    
    // Accept suggestion with Tab
    if (e.key === 'Tab') {
        const suggestionSpan = elements.mainEditor.querySelector('.word-suggestion');
        if (suggestionSpan) {
            e.preventDefault();
            const suggestionText = suggestionSpan.textContent;
            suggestionSpan.replaceWith(document.createTextNode(suggestionText + ' '));
            appState.currentWordSuggestion = '';
        }
    }
    
    // Remove suggestion on other keys
    if (e.key !== ' ' && e.key !== 'Tab' && e.key !== 'Enter') {
        const suggestionSpan = elements.mainEditor.querySelector('.word-suggestion');
        if (suggestionSpan && e.key.length === 1) {
            suggestionSpan.remove();
            appState.currentWordSuggestion = '';
        }
    }
});

// Citation event listeners
elements.addCitationBtn.addEventListener('click', openCitationModal);
elements.closeCitationModal.addEventListener('click', closeCitationModal);

elements.citationForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const author = document.getElementById('citationAuthor').value;
    const title = document.getElementById('citationTitle').value;
    const year = document.getElementById('citationYear').value;
    const details = document.getElementById('citationDetails').value;
    
    const citationSource = `${author} (${year}). ${title}${details ? '. ' + details : ''}`;
    
    addCitation({
        source: citationSource,
        isHypothetical: false,
        text: '',
        addedManually: true
    });
    
    closeCitationModal();
});

// Settings event listeners
elements.settingsBtn.addEventListener('click', openSettingsModal);
elements.closeSettingsModal.addEventListener('click', closeSettingsModal);

elements.saveApiKeyBtn.addEventListener('click', async function() {
    const key = elements.apiKeyInput.value.trim();
    
    if (!key) {
        showApiKeyStatus('⚠️ لطفاً API Key را وارد کنید', 'error');
        return;
    }
    
    if (!key.startsWith('AIza')) {
        showApiKeyStatus('⚠️ فرمت API Key نامعتبر است (باید با AIza شروع شود)', 'error');
        return;
    }
    
    // Show testing status
    showApiKeyStatus('🔄 در حال تست API Key...', 'info');
    elements.saveApiKeyBtn.disabled = true;
    
    // Test the API key
    const isValid = await testApiKey(key);
    
    elements.saveApiKeyBtn.disabled = false;
    
    if (!isValid) {
        showApiKeyStatus('❌ API Key نامعتبر است یا دسترسی ندارد. لطفاً دوباره بررسی کنید.', 'error');
        return;
    }
    
    saveApiKey(key);
    showApiKeyStatus('✅ API Key معتبر است و با موفقیت ذخیره شد!', 'success');
    
    setTimeout(() => {
        closeSettingsModal();
    }, 1500);
});

// Tab switching
elements.analysisTab.addEventListener('click', function() {
    elements.analysisTab.classList.add('active');
    elements.plagiarismTab.classList.remove('active');
    elements.analysisPanel.classList.add('active');
    elements.plagiarismPanel.classList.remove('active');
});

elements.plagiarismTab.addEventListener('click', function() {
    elements.plagiarismTab.classList.add('active');
    elements.analysisTab.classList.remove('active');
    elements.plagiarismPanel.classList.add('active');
    elements.analysisPanel.classList.remove('active');
    
    // Auto-check if not already checked
    if (!appState.plagiarismReport && !appState.isCheckingPlagiarism) {
        checkPlagiarism();
    }
});

// Mobile menu handling
elements.mobileMenuBtn.addEventListener('click', function() {
    elements.sidebar.classList.add('open');
    elements.drawerBackdrop.classList.add('visible');
});

elements.closeSidebarBtn.addEventListener('click', function() {
    elements.sidebar.classList.remove('open');
    elements.drawerBackdrop.classList.remove('visible');
});

elements.drawerBackdrop.addEventListener('click', function() {
    elements.sidebar.classList.remove('open');
    elements.drawerBackdrop.classList.remove('visible');
});

// Enhanced Tooltip Handler with proper event delegation
function handleIssueClick(e) {
    // Check if clicked element or any parent has data-issue attribute
    let target = e.target;
    let issueElement = null;
    
    // Traverse up to find element with data-issue
    while (target && target !== document.body) {
        if (target.hasAttribute && target.hasAttribute('data-issue')) {
            issueElement = target;
            break;
        }
        target = target.parentElement;
    }
    
    if (!issueElement) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const rect = issueElement.getBoundingClientRect();
    const issue = JSON.parse(issueElement.dataset.issue || '{}');
    
    // Simple issue type icons
    const issueIcon = {
        'consistency': '⚠️',
        'style': '💡',
        'grammar': '✏️',
        'typo': '🔤',
        'citation': '📚',
        'clarity': '🔍',
        'logic': '🧩'
    }[issue.type] || '•';
    
    // Simple title
    const issueTypeTitle = {
        'consistency': 'Logical Inconsistency',
        'style': 'Writing Style',
        'grammar': 'Grammar',
        'typo': 'Typo/Spelling',
        'citation': 'Citation Needed',
        'clarity': 'Clarity Issue',
        'logic': 'Weak Reasoning'
    }[issue.type] || 'Issue';
    
    elements.popoverTitle.innerHTML = `${issueIcon} ${issueTypeTitle}`;
    
    // Clean minimal content in English
    let contentHTML = `
        <div>
            <strong>Problem:</strong>
            <p style="margin-top: 0.375rem; color: rgba(255,255,255,0.9);">${escapeHtml(issue.explanation)}</p>
        </div>`;
    
    // For typos, show the correct spelling prominently
    if (issue.type === 'typo' && issue.correctWord) {
        contentHTML += `
        <div style="background: rgba(34, 197, 94, 0.15); padding: 0.625rem; border-radius: 0.375rem; margin: 0.75rem 0; border-left: 3px solid #22c55e;">
            <strong style="color: #22c55e;">✓ Correct Spelling:</strong>
            <p style="margin-top: 0.375rem; color: rgba(255,255,255,0.95); font-size: 1.125rem; font-weight: 600;">${escapeHtml(issue.correctWord)}</p>
        </div>`;
    }
    
    contentHTML += `
        <div>
            <strong>✓ Solution:</strong>
            <p style="margin-top: 0.375rem; color: rgba(255,255,255,0.95);">${escapeHtml(issue.suggestion)}</p>
        </div>
    `;
    
    elements.popoverContent.innerHTML = contentHTML;
    
    // Smart positioning
    const popoverWidth = 280;
    let left = rect.left + window.scrollX + (rect.width / 2) - (popoverWidth / 2);
    let top = rect.bottom + window.scrollY + 8;
    
    // Keep within viewport
    if (left < 10) left = 10;
    if (left + popoverWidth > window.innerWidth - 10) {
        left = window.innerWidth - popoverWidth - 10;
    }
    
    // Add arrow positioning
    const arrowLeft = rect.left + window.scrollX + (rect.width / 2) - left;
    
    elements.issuePopover.style.top = `${top}px`;
    elements.issuePopover.style.left = `${left}px`;
    elements.issuePopover.style.maxWidth = `${popoverWidth}px`;
    
    // Position arrow
    let arrow = elements.issuePopover.querySelector('.popover-arrow');
    if (!arrow) {
        arrow = document.createElement('div');
        arrow.className = 'popover-arrow';
        elements.issuePopover.insertBefore(arrow, elements.issuePopover.firstChild);
    }
    arrow.style.right = `${popoverWidth - arrowLeft}px`;
    
    elements.issuePopover.classList.remove('hidden');
}

// Attach click handler to editor
elements.mainEditor.addEventListener('click', handleIssueClick);

// Close popover when clicking outside
document.addEventListener('click', function(e) {
    if (!elements.issuePopover.contains(e.target) && !e.target.closest('[data-issue]')) {
        elements.issuePopover.classList.add('hidden');
    }
});

elements.closePopoverBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    elements.issuePopover.classList.add('hidden');
});

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Load API Key
    const hasApiKey = loadApiKey();
    if (!hasApiKey) {
        // Show settings modal on first load if no API key
        setTimeout(() => {
            alert('👋 خوش آمدید!\n\nبرای استفاده از این برنامه، لطفاً ابتدا API Key رایگان Google Gemini را دریافت و وارد کنید.');
            openSettingsModal();
        }, 500);
    }
    
    // Load saved data if available
    const savedText = localStorage.getItem('editorText');
    const savedPlan = localStorage.getItem('articlePlan');
    const savedScaffold = localStorage.getItem('scaffoldText');
    const savedCitations = localStorage.getItem('citations');
    
    if (savedText) {
        elements.mainEditor.innerText = savedText;
        appState.text = savedText;
    }
    
    if (savedPlan) {
        try {
            appState.articlePlan = JSON.parse(savedPlan);
            displayPlan();
        } catch (e) {}
    }
    
    if (savedScaffold) {
        elements.scaffoldText.value = savedScaffold;
        appState.scaffoldText = savedScaffold;
    }
    
    if (savedCitations) {
        try {
            appState.citations = JSON.parse(savedCitations);
            displayCitations();
        } catch (e) {}
    }
    
    // Load auto-complete preference
    const savedAutoComplete = localStorage.getItem('autoCompleteEnabled');
    if (savedAutoComplete === 'true') {
        appState.autoCompleteEnabled = true;
        elements.autoCompleteToggle.checked = true;
    }
    
    // Auto-save
    setInterval(() => {
        localStorage.setItem('editorText', appState.text);
        localStorage.setItem('articlePlan', JSON.stringify(appState.articlePlan));
        localStorage.setItem('scaffoldText', appState.scaffoldText);
        localStorage.setItem('citations', JSON.stringify(appState.citations));
    }, 5000);
});