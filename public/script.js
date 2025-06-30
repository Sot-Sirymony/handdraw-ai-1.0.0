// DOM elements
const promptInput = document.getElementById('prompt');
const styleSelect = document.getElementById('style');
const sizeSelect = document.getElementById('size');
const dimensionSelect = document.getElementById('dimension');
const qualitySelect = document.getElementById('quality');
const textTemplateSelect = document.getElementById('textTemplate');
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

// Character Builder Elements
const characterGender = document.getElementById('characterGender');
const characterProperties = document.getElementById('characterProperties');
const hairStyle = document.getElementById('hairStyle');
const eyeColor = document.getElementById('eyeColor');
const bodyBuild = document.getElementById('bodyBuild');
const clothingStyle = document.getElementById('clothingStyle');
const characterPose = document.getElementById('characterPose');
const generatedDescription = document.getElementById('generatedDescription');
const clearCharacterBtn = document.getElementById('clearCharacterBtn');
const useCharacterBtn = document.getElementById('useCharacterBtn');

// State
let currentImageUrl = null;
let currentPrompt = '';
let appConfig = null;
let textTemplates = {};
let characterPropertiesConfig = {};

// Event listeners
generateBtn.addEventListener('click', generateImage);
downloadBtn.addEventListener('click', downloadImage);
saveToAssetsBtn.addEventListener('click', saveToAssets);
regenerateBtn.addEventListener('click', generateImage);

// Character Builder Event Listeners
characterGender.addEventListener('change', handleGenderChange);
hairStyle.addEventListener('change', updateCharacterDescription);
eyeColor.addEventListener('change', updateCharacterDescription);
bodyBuild.addEventListener('change', updateCharacterDescription);
clothingStyle.addEventListener('change', updateCharacterDescription);
characterPose.addEventListener('change', updateCharacterDescription);
clearCharacterBtn.addEventListener('click', clearCharacterBuilder);
useCharacterBtn.addEventListener('click', () => {
    if (generatedDescription.value.trim()) {
        generateImage();
    } else {
        showNotification('Please select character properties first', 'error');
    }
});

// Text template change handler
textTemplateSelect.addEventListener('change', (e) => {
    const templateKey = e.target.value;
    if (templateKey && textTemplates[templateKey]) {
        promptInput.value = textTemplates[templateKey];
        promptInput.focus();
    }
});

// Example card click handlers
exampleCards.forEach(card => {
    card.addEventListener('click', () => {
        const prompt = card.getAttribute('data-prompt');
        promptInput.value = prompt;
        promptInput.focus();
    });
});

// Character Builder Functions
function handleGenderChange() {
    const selectedGender = characterGender.value;
    
    if (selectedGender) {
        // Show character properties
        characterProperties.style.display = 'block';
        
        // Populate property options based on gender
        populateCharacterProperties(selectedGender);
        
        // Clear previous selections
        clearPropertySelections();
        
        // Update description
        updateCharacterDescription();
    } else {
        // Hide character properties
        characterProperties.style.display = 'none';
        generatedDescription.value = '';
    }
}

function populateCharacterProperties(gender) {
    const properties = characterPropertiesConfig[gender];
    if (!properties) {
        return;
    }
    
    // Populate hair styles
    populateSelect(hairStyle, properties.hair || []);
    
    // Populate eye colors
    populateSelect(eyeColor, properties.eyes || []);
    
    // Populate body builds
    populateSelect(bodyBuild, properties.build || []);
    
    // Populate clothing styles
    populateSelect(clothingStyle, properties.clothing || []);
    
    // Populate poses
    populateSelect(characterPose, properties.pose || []);
}

function populateSelect(selectElement, options) {
    selectElement.innerHTML = '<option value="">-- Select --</option>';
    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option;
        optionElement.textContent = option;
        selectElement.appendChild(optionElement);
    });
}

function clearPropertySelections() {
    hairStyle.value = '';
    eyeColor.value = '';
    bodyBuild.value = '';
    clothingStyle.value = '';
    characterPose.value = '';
}

function updateCharacterDescription() {
    const gender = characterGender.value;
    const hair = hairStyle.value;
    const eyes = eyeColor.value;
    const build = bodyBuild.value;
    const clothing = clothingStyle.value;
    const pose = characterPose.value;
    
    if (!gender) {
        generatedDescription.value = '';
        return;
    }
    
    const descriptionParts = [];
    descriptionParts.push(`${gender} character`);
    
    if (hair) descriptionParts.push(`with ${hair}`);
    if (eyes) descriptionParts.push(`and ${eyes}`);
    if (build) descriptionParts.push(`with ${build}`);
    if (clothing) descriptionParts.push(`wearing ${clothing}`);
    if (pose) descriptionParts.push(`in ${pose}`);
    
    const fullDescription = descriptionParts.join(', ');
    generatedDescription.value = fullDescription;
    
    // Update the main prompt input with the generated description
    promptInput.value = fullDescription;
}

function clearCharacterBuilder() {
    // Reset gender selection
    characterGender.value = '';
    
    // Hide character properties
    characterProperties.style.display = 'none';
    
    // Clear all property selections
    clearPropertySelections();
    
    // Clear generated description
    generatedDescription.value = '';
    
    // Clear main prompt input
    promptInput.value = '';
    
    showNotification('Character builder cleared', 'info');
}

// Generate image function
async function generateImage() {
    // Use character description if available, otherwise use the prompt input
    const characterDesc = generatedDescription.value.trim();
    const promptInputValue = promptInput.value.trim();
    const finalPrompt = characterDesc || promptInputValue;
    
    if (!finalPrompt) {
        showNotification('Please enter a description for the hand drawing or use the character builder', 'error');
        return;
    }

    const style = styleSelect.value;
    const size = sizeSelect.value;
    const dimension = dimensionSelect.value;
    const quality = qualitySelect.value;

    // Check if this is a detailed manual description
    const isDetailedDescription = finalPrompt.length > 50;
    if (isDetailedDescription) {
        showNotification('Using your detailed description as-is (no prefix/suffix added)', 'info');
    }

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
                prompt: finalPrompt,
                style: style,
                size: size,
                dimension: dimension,
                quality: quality
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
        
        // Handle specific error types
        let errorMessage = 'Failed to generate image. Please try again.';
        
        if (error.message.includes('rate limit')) {
            errorMessage = 'OpenAI rate limit reached. Please wait a few minutes and try again.';
        } else if (error.message.includes('content policy')) {
            errorMessage = 'The prompt may contain content that violates OpenAI\'s content policy. Please try a different description.';
        } else if (error.message.includes('429')) {
            errorMessage = 'Too many requests. Please wait a few minutes and try again.';
        } else if (error.message.includes('Failed to generate image')) {
            errorMessage = error.message;
        }
        
        showNotification(errorMessage, 'error');
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
document.addEventListener('DOMContentLoaded', async () => {
    // Focus on prompt input
    promptInput.focus();
    
    // Load configuration and setup defaults
    await loadConfiguration();
    
    // Load available styles and sizes
    await loadStyles();
    await loadSizes();
});

// Load configuration from server
async function loadConfiguration() {
    try {
        const response = await fetch('/api/config');
        const data = await response.json();
        
        appConfig = data.defaults;
        textTemplates = data.textTemplates;
        characterPropertiesConfig = data.characterProperties || {};
        
        // Set default values from config
        if (appConfig) {
            // Set default prompt if empty
            if (!promptInput.value && appConfig.defaultPrompt) {
                promptInput.value = appConfig.defaultPrompt;
            }
            
            // Set default dimension
            if (dimensionSelect) {
                dimensionSelect.value = appConfig.dimension || '2d';
            }
            
            // Set default quality
            if (qualitySelect) {
                qualitySelect.value = appConfig.quality || 'standard';
            }
        }
        
        // Populate text templates
        if (textTemplateSelect && textTemplates) {
            textTemplateSelect.innerHTML = '<option value="">-- Select a template --</option>';
            Object.entries(textTemplates).forEach(([key, value]) => {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = value;
                textTemplateSelect.appendChild(option);
            });
        }
        
        // Update configuration display
        updateConfigDisplay();
        
        console.log('Configuration loaded successfully');
    } catch (error) {
        console.error('Error loading configuration:', error);
    }
}

// Update configuration display
function updateConfigDisplay() {
    if (!appConfig) return;
    
    const configStyle = document.getElementById('configStyle');
    const configSize = document.getElementById('configSize');
    const configDimension = document.getElementById('configDimension');
    const configQuality = document.getElementById('configQuality');
    const configPrompt = document.getElementById('configPrompt');
    
    if (configStyle) configStyle.textContent = appConfig.style || 'Not set';
    if (configSize) configSize.textContent = appConfig.size || 'Not set';
    if (configDimension) configDimension.textContent = appConfig.dimension || 'Not set';
    if (configQuality) configQuality.textContent = appConfig.quality || 'Not set';
    if (configPrompt) configPrompt.textContent = appConfig.defaultPrompt || 'Not set';
}

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
                if (style.default || (appConfig && style.id === appConfig.style)) {
                    option.selected = true;
                }
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
                if (size.default || (appConfig && size.id === appConfig.size)) {
                    option.selected = true;
                }
                sizeSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading sizes:', error);
    }
} 