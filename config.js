// Configuration for API endpoints and settings
const CONFIG = {
    // Gemini API configuration
    GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    
    // Default prompts for image analysis
    ANALYSIS_PROMPT: `Hãy phân tích ảnh này một cách chi tiết và cung cấp:
1. Mô tả chi tiết về nội dung của ảnh
2. Một prompt hoàn chỉnh bằng tiếng Anh để tạo ra ảnh tương tự (bao gồm style, composition, lighting, colors, mood)
3. 5-8 tags chính mô tả ảnh

Trả lời theo định dạng JSON:
{
    "description": "Mô tả chi tiết bằng tiếng Việt",
    "prompt": "Detailed English prompt for image generation",
    "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}`,

    // Image generation API (placeholder - có thể thay thế bằng Stability AI, DALL-E, etc.)
    IMAGE_GENERATION_API: null,
    
    // Maximum file size (10MB)
    MAX_FILE_SIZE: 10 * 1024 * 1024,
    
    // Supported file types
    SUPPORTED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
};

// Local storage keys
const STORAGE_KEYS = {
    GEMINI_API_KEY: 'gemini_api_key'
};
