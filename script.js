// Global variables
let currentImageFile = null;
let currentImageData = null;

// DOM elements
const uploadArea = document.getElementById('uploadArea');
const imageInput = document.getElementById('imageInput');
const previewSection = document.getElementById('previewSection');
const previewImage = document.getElementById('previewImage');
const removeImageBtn = document.getElementById('removeImage');
const analyzeBtn = document.getElementById('analyzeBtn');
const loadingSection = document.getElementById('loadingSection');
const resultsSection = document.getElementById('resultsSection');
const imageDescription = document.getElementById('imageDescription');
const generatedPrompt = document.getElementById('generatedPrompt');
const tagsContainer = document.getElementById('tagsContainer');
const copyPromptBtn = document.getElementById('copyPrompt');
const analyzeNewBtn = document.getElementById('analyzeNewBtn');
const generateImageBtn = document.getElementById('generateImageBtn');
const geminiApiKeyInput = document.getElementById('geminiApiKey');
const saveConfigBtn = document.getElementById('saveConfig');
const generatedSection = document.getElementById('generatedSection');
const generatedImage = document.getElementById('generatedImage');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadSavedConfig();
});

// Initialize application
function initializeApp() {
    console.log('AI Image Analyzer initialized');
    
    // Check if browser supports FileReader
    if (!window.FileReader) {
        showError('Trình duyệt của bạn không hỗ trợ tính năng này. Vui lòng sử dụng trình duyệt mới hơn.');
        return;
    }
}

// Setup event listeners
function setupEventListeners() {
    // File input change
    imageInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop events
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    uploadArea.addEventListener('click', () => imageInput.click());
    
    // Button events
    removeImageBtn.addEventListener('click', removeImage);
    analyzeBtn.addEventListener('click', analyzeImage);
    copyPromptBtn.addEventListener('click', copyPrompt);
    analyzeNewBtn.addEventListener('click', resetApp);
    generateImageBtn.addEventListener('click', generateImage);
    saveConfigBtn.addEventListener('click', saveConfig);
}

// Handle file selection
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        processFile(file);
    }
}

// Handle drag over
function handleDragOver(event) {
    event.preventDefault();
    uploadArea.classList.add('dragover');
}

// Handle drag leave
function handleDragLeave(event) {
    event.preventDefault();
    uploadArea.classList.remove('dragover');
}

// Handle drop
function handleDrop(event) {
    event.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

// Process uploaded file
function processFile(file) {
    // Validate file type
    if (!CONFIG.SUPPORTED_TYPES.includes(file.type)) {
        showError('Định dạng file không được hỗ trợ. Vui lòng chọn file JPG, PNG, GIF hoặc WebP.');
        return;
    }
    
    // Validate file size
    if (file.size > CONFIG.MAX_FILE_SIZE) {
        showError('Kích thước file quá lớn. Vui lòng chọn file nhỏ hơn 10MB.');
        return;
    }
    
    currentImageFile = file;
    
    // Read and display image
    const reader = new FileReader();
    reader.onload = function(e) {
        currentImageData = e.target.result;
        displayImage(e.target.result);
    };
    reader.readAsDataURL(file);
}

// Display selected image
function displayImage(imageSrc) {
    previewImage.src = imageSrc;
    previewSection.style.display = 'block';
    previewSection.classList.add('fade-in');
    
    // Hide other sections
    loadingSection.style.display = 'none';
    resultsSection.style.display = 'none';
}

// Remove selected image
function removeImage() {
    currentImageFile = null;
    currentImageData = null;
    previewSection.style.display = 'none';
    loadingSection.style.display = 'none';
    resultsSection.style.display = 'none';
    imageInput.value = '';
}

// Analyze image using Gemini API
async function analyzeImage() {
    const apiKey = geminiApiKeyInput.value.trim() || localStorage.getItem(STORAGE_KEYS.GEMINI_API_KEY);
    
    if (!apiKey) {
        showError('Vui lòng nhập Gemini API Key để sử dụng tính năng phân tích.');
        return;
    }
    
    if (!currentImageData) {
        showError('Vui lòng chọn ảnh trước khi phân tích.');
        return;
    }
    
    // Show loading
    loadingSection.style.display = 'block';
    loadingSection.classList.add('fade-in');
    resultsSection.style.display = 'none';
    
    try {
        // Convert image to base64 (remove data URL prefix)
        const base64Image = currentImageData.split(',')[1];
        
        // Prepare request payload
        const requestPayload = {
            contents: [{
                parts: [
                    {
                        text: CONFIG.ANALYSIS_PROMPT
                    },
                    {
                        inline_data: {
                            mime_type: currentImageFile.type,
                            data: base64Image
                        }
                    }
                ]
            }]
        };
        
        // Make API request
        const response = await fetch(`${CONFIG.GEMINI_API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestPayload)
        });
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} - ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Parse response
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            const responseText = data.candidates[0].content.parts[0].text;
            parseAndDisplayResults(responseText);
        } else {
            throw new Error('Không nhận được phản hồi hợp lệ từ API.');
        }
        
    } catch (error) {
        console.error('Error analyzing image:', error);
        showError(`Lỗi khi phân tích ảnh: ${error.message}`);
    } finally {
        loadingSection.style.display = 'none';
    }
}

// Parse and display analysis results
function parseAndDisplayResults(responseText) {
    try {
        // Try to extract JSON from response
        let jsonMatch = responseText.match(/\{[\s\S]*\}/);
        let analysisData;
        
        if (jsonMatch) {
            analysisData = JSON.parse(jsonMatch[0]);
        } else {
            // Fallback: parse manually if JSON format is not perfect
            analysisData = {
                description: "Không thể phân tích được định dạng phản hồi chính xác.",
                prompt: responseText.substring(0, 500) + "...",
                tags: ["analysis", "ai", "image"]
            };
        }
        
        // Display results
        imageDescription.textContent = analysisData.description || "Không có mô tả";
        generatedPrompt.value = analysisData.prompt || "Không có prompt";
        
        // Display tags
        tagsContainer.innerHTML = '';
        if (analysisData.tags && Array.isArray(analysisData.tags)) {
            analysisData.tags.forEach(tag => {
                const tagElement = document.createElement('span');
                tagElement.className = 'tag';
                tagElement.textContent = tag;
                tagsContainer.appendChild(tagElement);
            });
        }
        
        // Show results
        resultsSection.style.display = 'block';
        resultsSection.classList.add('fade-in');
        
    } catch (error) {
        console.error('Error parsing results:', error);
        // Display raw response as fallback
        imageDescription.textContent = "Không thể phân tích định dạng phản hồi.";
        generatedPrompt.value = responseText;
        resultsSection.style.display = 'block';
    }
}

// Copy prompt to clipboard
async function copyPrompt() {
    try {
        await navigator.clipboard.writeText(generatedPrompt.value);
        
        // Visual feedback
        const originalText = copyPromptBtn.innerHTML;
        copyPromptBtn.innerHTML = '<i class="fas fa-check"></i> Đã Copy!';
        copyPromptBtn.style.background = '#28a745';
        
        setTimeout(() => {
            copyPromptBtn.innerHTML = originalText;
            copyPromptBtn.style.background = '#17a2b8';
        }, 2000);
        
    } catch (error) {
        console.error('Error copying to clipboard:', error);
        showError('Không thể copy. Vui lòng copy thủ công.');
    }
}

// Generate image (placeholder function)
async function generateImage() {
    showInfo('Tính năng tạo ảnh đang được phát triển. Hiện tại bạn có thể copy prompt và sử dụng trên các nền tảng khác như DALL-E, Midjourney, Stable Diffusion.');
    
    // TODO: Implement image generation with Stability AI, DALL-E, or other APIs
    // This would require additional API keys and implementation
}

// Reset application
function resetApp() {
    removeImage();
    uploadArea.style.display = 'block';
}

// Save configuration
function saveConfig() {
    const apiKey = geminiApiKeyInput.value.trim();
    
    if (apiKey) {
        localStorage.setItem(STORAGE_KEYS.GEMINI_API_KEY, apiKey);
        showSuccess('Cấu hình đã được lưu!');
    } else {
        showError('Vui lòng nhập API Key.');
    }
}

// Load saved configuration
function loadSavedConfig() {
    const savedApiKey = localStorage.getItem(STORAGE_KEYS.GEMINI_API_KEY);
    if (savedApiKey) {
        geminiApiKeyInput.value = savedApiKey;
    }
}

// Utility functions
function showError(message) {
    alert('❌ Lỗi: ' + message);
}

function showSuccess(message) {
    alert('✅ Thành công: ' + message);
}

function showInfo(message) {
    alert('ℹ️ Thông tin: ' + message);
}

// Service Worker registration (for PWA capabilities)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registration successful');
            })
            .catch(function(err) {
                console.log('ServiceWorker registration failed');
            });
    });
}
