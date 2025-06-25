// DOM elements
const promptInput = document.getElementById('prompt');
const styleSelect = document.getElementById('style');
const sizeSelect = document.getElementById('size');
const generateBtn = document.getElementById('generateBtn');
const resultSection = document.getElementById('resultSection');
const generatedImage = document.getElementById('generatedImage');
const generatedPrompt = document.getElementById('generatedPrompt');
const downloadBtn = document.getElementById('downloadBtn');
const saveToAssetsBtn = document.getElementById('saveToAssetsBtn');
const regenerateBtn = document.getElementById('regenerateBtn');
const loadingOverlay = document.getElementById('loadingOverlay');
const notification = document.getElementById('notification');
const exampleCards = document.querySelectorAll('.example-card');

// State
let currentImageUrl = null;
let currentPrompt = '';

// Event listeners
generateBtn.addEventListener('click', generateImage);
downloadBtn.addEventListener('click', downloadImage);
saveToAssetsBtn.addEventListener('click', saveToAssets);
regenerateBtn.addEventListener('click', generateImage);

// Example card click handlers
exampleCards.forEach(card => {
    card.addEventListener('click', () => {
        const prompt = card.getAttribute('data-prompt');
        promptInput.value = prompt;
        promptInput.focus();
    });
});

// Generate image function
async function generateImage() {
    const prompt = promptInput.value.trim();
    
    if (!prompt) {
        showNotification('Please enter a description for the hand drawing', 'error');
        return;
    }

    const style = styleSelect.value;
    const size = sizeSelect.value;

    // Show loading
    setLoading(true);
    generateBtn.disabled = true;

    try {
        const response = await fetch('/api/generate-image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt: prompt,
                style: style,
                size: size
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to generate image');
        }

        if (data.success) {
            currentImageUrl = data.imageUrl;
            currentPrompt = data.prompt;
            
            // Display the image
            generatedImage.src = data.imageUrl;
            generatedPrompt.textContent = data.prompt;
            resultSection.style.display = 'block';
            
            // Scroll to result
            resultSection.scrollIntoView({ behavior: 'smooth' });
            
            showNotification('Image generated successfully!', 'success');
        } else {
            throw new Error('Failed to generate image');
        }

    } catch (error) {
        console.error('Error generating image:', error);
        showNotification(error.message || 'Failed to generate image. Please try again.', 'error');
    } finally {
        setLoading(false);
        generateBtn.disabled = false;
    }
}

// Download image function
async function downloadImage() {
    if (!currentImageUrl) {
        showNotification('No image to download', 'error');
        return;
    }

    try {
        const response = await fetch(currentImageUrl);
        const blob = await response.blob();
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hand-drawing-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showNotification('Image downloaded successfully!', 'success');
    } catch (error) {
        console.error('Error downloading image:', error);
        showNotification('Failed to download image', 'error');
    }
}

// Save to assets function
async function saveToAssets() {
    if (!currentImageUrl) {
        showNotification('No image to save', 'error');
        return;
    }

    try {
        const response = await fetch('/api/save-to-assets', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                imageUrl: currentImageUrl,
                prompt: currentPrompt,
                timestamp: new Date().toISOString()
            })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('Image saved to assets folder!', 'success');
        } else {
            throw new Error(data.error || 'Failed to save image');
        }

    } catch (error) {
        console.error('Error saving image:', error);
        showNotification('Failed to save image to assets', 'error');
    }
}

// Utility functions
function setLoading(isLoading) {
    if (isLoading) {
        loadingOverlay.style.display = 'flex';
        generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
    } else {
        loadingOverlay.style.display = 'none';
        generateBtn.innerHTML = '<i class="fas fa-magic"></i> Generate Hand Drawing';
    }
}

function showNotification(message, type = 'info') {
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    
    // Add show class for animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    // Hide after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.style.display = 'none';
        }, 300);
    }, 5000);
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to generate
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        generateImage();
    }
    
    // Escape to close loading overlay
    if (e.key === 'Escape' && loadingOverlay.style.display === 'flex') {
        setLoading(false);
        generateBtn.disabled = false;
    }
});

// Auto-resize textarea
promptInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 200) + 'px';
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Focus on prompt input
    promptInput.focus();
    
    // Load available styles and sizes (if needed)
    loadStyles();
    loadSizes();
});

// Load available styles
async function loadStyles() {
    try {
        const response = await fetch('/api/styles');
        const data = await response.json();
        
        // Populate style select if needed
        if (data.styles && data.styles.length > 0) {
            styleSelect.innerHTML = '';
            data.styles.forEach(style => {
                const option = document.createElement('option');
                option.value = style.id;
                option.textContent = style.name;
                styleSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading styles:', error);
    }
}

// Load available sizes
async function loadSizes() {
    try {
        const response = await fetch('/api/sizes');
        const data = await response.json();
        
        // Populate size select if needed
        if (data.sizes && data.sizes.length > 0) {
            sizeSelect.innerHTML = '';
            data.sizes.forEach(size => {
                const option = document.createElement('option');
                option.value = size.id;
                option.textContent = size.name;
                if (size.default) {
                    option.selected = true;
                }
                sizeSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading sizes:', error);
    }
} 