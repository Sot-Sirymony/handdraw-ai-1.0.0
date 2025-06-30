const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const config = require('./config');

const app = express();
const PORT = config.PORT;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Serve the main HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Test endpoint to verify API key
app.get('/api/test-key', async (req, res) => {
  try {
    console.log('Testing OpenAI API key...');
    console.log('API Key (first 10 chars):', config.OPENAI_API_KEY.substring(0, 10) + '...');
    
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('API Response Status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Key Test Error:', errorData);
      return res.status(response.status).json({ 
        error: 'API key test failed', 
        details: errorData,
        status: response.status
      });
    }

    const data = await response.json();
    console.log('API Key test successful');
    
    res.json({ 
      success: true, 
      message: 'API key is valid',
      models: data.data ? data.data.length : 0
    });

  } catch (error) {
    console.error('API Key Test Error:', error);
    res.status(500).json({ 
      error: 'API key test failed', 
      message: error.message 
    });
  }
});

// Simple test endpoint with basic prompt
app.post('/api/test-generate', async (req, res) => {
  try {
    console.log('Testing basic image generation...');
    
    const requestBody = {
      prompt: "A simple red circle on white background",
      n: 1,
      size: "256x256",
      response_format: "url"
    };

    console.log('Test request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.OPENAI_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    console.log('Test Response Status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Test API Error:', JSON.stringify(errorData, null, 2));
      return res.status(response.status).json({ 
        error: 'Test generation failed', 
        details: errorData
      });
    }

    const data = await response.json();
    console.log('Test successful:', data);
    
    res.json({ 
      success: true, 
      imageUrl: data.data[0].url,
      message: 'Basic image generation test successful'
    });

  } catch (error) {
    console.error('Test Error:', error);
    res.status(500).json({ 
      error: 'Test failed', 
      message: error.message
    });
  }
});

// API endpoint to generate hand drawing images using DALL-E 3
app.post('/api/generate-image', async (req, res) => {
  try {
    // Use config defaults with request body overrides, but allow empty values
    const { 
      prompt, 
      style = config.defaults.style, 
      size = config.defaults.size,
      dimension = config.defaults.dimension,
      quality = config.defaults.quality,
      numberOfImages = config.defaults.numberOfImages,
      useChatGPT = false // New option to enhance prompts with ChatGPT 4o
    } = req.body;
    
    console.log('Generate image request:', { prompt, style, size, dimension, quality, numberOfImages, useChatGPT });
    
    // Use default prompt if none provided
    const finalPrompt = prompt || config.defaults.defaultPrompt;
    
    if (!finalPrompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Check if this is a detailed manual description (more than 50 characters)
    const isDetailedManualDescription = finalPrompt.length > 50;
    
    // Build the final prompt based on user input and selections
    let fullPrompt = finalPrompt;
    
    // Only add style modifiers if style is selected and not empty
    if (style && style.trim() !== '') {
      const styleModifiers = {
        'realistic': 'realistic, detailed, soft lighting',
        'japanese': 'Japanese manga style, clean lines',
        'anime': 'anime style, vibrant colors',
        'sketch': 'sketch style, pencil drawing',
        'minecraft': 'Minecraft style, blocky and pixelated',
        'cartoon': 'cartoon style, simple and clean'
      };
      
      if (styleModifiers[style]) {
        fullPrompt += `, ${styleModifiers[style]}`;
      }
    }
    
    // Only add dimension if specified and not empty
    if (dimension && dimension.trim() !== '') {
      fullPrompt += `, ${dimension} drawing`;
    }

    // Optionally enhance prompt with ChatGPT 4o
    if (useChatGPT && isDetailedManualDescription) {
      try {
        console.log('Enhancing prompt with ChatGPT 4o...');
        const enhancedPrompt = await enhancePromptWithChatGPT(fullPrompt);
        if (enhancedPrompt) {
          fullPrompt = enhancedPrompt;
          console.log('Enhanced prompt:', fullPrompt);
        }
      } catch (error) {
        console.error('ChatGPT enhancement failed, using original prompt:', error.message);
      }
    }

    console.log('Final prompt for image generation:', fullPrompt);
    console.log('API Key (first 10 chars):', config.OPENAI_API_KEY.substring(0, 10) + '...');

    // Use DALL-E 3 for better quality image generation
    const requestBody = {
      model: "dall-e-3", // Using DALL-E 3 instead of DALL-E 2
      prompt: fullPrompt,
      n: 1, // DALL-E 3 only supports 1 image at a time
      size: size || '', // Use empty if no size selected
      response_format: 'url',
      quality: quality || '' // Use empty if no quality selected
    };

    // Only add size and quality if they are not empty
    if (!size || size.trim() === '') {
      delete requestBody.size;
    }
    if (!quality || quality.trim() === '') {
      delete requestBody.quality;
    }

    console.log('DALL-E 3 Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.OPENAI_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    console.log('DALL-E 3 Response Status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('DALL-E 3 API Error Details:', JSON.stringify(errorData, null, 2));
      
      // Try to provide more helpful error messages
      let errorMessage = 'Failed to generate image';
      if (errorData.error && errorData.error.type === 'image_generation_user_error') {
        errorMessage = 'The prompt may contain content that violates OpenAI\'s content policy. Please try a different description.';
      }
      
      if (response.status === 429) {
        console.log('Rate limit hit, providing user-friendly message');
        return res.status(429).json({
          error: 'OpenAI rate limit reached. Please wait a few minutes and try again.',
          details: {
            error: errorData.error,
            status: response.status,
            statusText: response.statusText
          }
        });
      }
      
      return res.status(response.status).json({ 
        error: errorMessage, 
        details: errorData,
        status: response.status,
        statusText: response.statusText
      });
    }

    const data = await response.json();
    console.log('DALL-E 3 Response Data:', JSON.stringify(data, null, 2));
    
    const imageUrl = data.data[0].url;

    // --- Automatically save the image to assets directory if enabled ---
    let savedFilename = null;
    let metadata = null;
    
    if (config.fileManagement.autoSave) {
      const assetsDir = path.join(__dirname, config.fileManagement.assetsDirectory);
      if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
      }
      
      const sanitizedPrompt = finalPrompt.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').substring(0, config.fileManagement.maxFilenameLength);
      const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = config.fileManagement.filenameFormat
        .replace('{prompt}', sanitizedPrompt)
        .replace('{timestamp}', timestampStr);
      const filepath = path.join(assetsDir, filename);

      // Download the image
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error('Failed to download image');
      }
      const imageBuffer = await imageResponse.buffer();
      fs.writeFileSync(filepath, imageBuffer);

      // Create metadata file
      metadata = {
        filename: filename,
        originalUrl: imageUrl,
        prompt: fullPrompt,
        userPrompt: finalPrompt,
        style: style || '',
        size: size || '',
        dimension: dimension || '',
        quality: quality || '',
        isDetailedDescription: isDetailedManualDescription,
        model: 'dall-e-3',
        enhancedWithChatGPT: useChatGPT,
        timestamp: new Date().toISOString(),
        savedAt: new Date().toISOString()
      };
      const metadataPath = path.join(assetsDir, `${filename}.json`);
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
      console.log(`Image automatically saved to assets: ${filename}`);
      savedFilename = filename;
    }
    // --- End auto-save ---

    res.json({ 
      success: true, 
      imageUrl: savedFilename ? `/assets/${savedFilename}` : imageUrl,
      prompt: fullPrompt,
      userPrompt: finalPrompt,
      style: style || '',
      size: size || '',
      dimension: dimension || '',
      quality: quality || '',
      isDetailedDescription: isDetailedManualDescription,
      model: 'dall-e-3',
      enhancedWithChatGPT: useChatGPT,
      localFile: savedFilename ? `/assets/${savedFilename}` : null,
      metadata: metadata
    });

  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message,
      stack: error.stack
    });
  }
});

// Helper function to enhance prompts with ChatGPT 4o
async function enhancePromptWithChatGPT(originalPrompt) {
  try {
    const requestBody = {
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert at creating detailed, descriptive prompts for AI image generation. Enhance the user's prompt to be more specific, detailed, and effective for generating high-quality hand-drawn style images. Keep the core meaning but add relevant details about style, composition, lighting, and artistic elements."
        },
        {
          role: "user",
          content: `Please enhance this image generation prompt to be more detailed and effective: "${originalPrompt}"`
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.OPENAI_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`ChatGPT API error: ${response.status}`);
    }

    const data = await response.json();
    const enhancedPrompt = data.choices[0].message.content.trim();
    
    return enhancedPrompt;
  } catch (error) {
    console.error('Error enhancing prompt with ChatGPT:', error);
    return null;
  }
}

// API endpoint to save image to assets folder
app.post('/api/save-to-assets', async (req, res) => {
  try {
    const { imageUrl, prompt, timestamp } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    // Create assets directory if it doesn't exist
    const assetsDir = path.join(__dirname, 'public', 'assets');
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }

    // Download the image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error('Failed to download image');
    }

    const imageBuffer = await imageResponse.buffer();
    
    // Generate filename
    const sanitizedPrompt = prompt.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').substring(0, 50);
    const timestampStr = new Date(timestamp || Date.now()).toISOString().replace(/[:.]/g, '-');
    const filename = `hand_drawing_${sanitizedPrompt}_${timestampStr}.png`;
    const filepath = path.join(assetsDir, filename);

    // Save the image
    fs.writeFileSync(filepath, imageBuffer);

    // Create metadata file
    const metadata = {
      filename: filename,
      originalUrl: imageUrl,
      prompt: prompt,
      timestamp: timestamp || new Date().toISOString(),
      savedAt: new Date().toISOString()
    };

    const metadataPath = path.join(assetsDir, `${filename}.json`);
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    console.log(`Image saved to assets: ${filename}`);

    res.json({ 
      success: true, 
      filename: filename,
      filepath: `/assets/${filename}`,
      message: 'Image saved to assets folder successfully'
    });

  } catch (error) {
    console.error('Error saving image to assets:', error);
    res.status(500).json({ 
      error: 'Failed to save image to assets', 
      message: error.message 
    });
  }
});

// API endpoint to get default configuration
app.get('/api/config', (req, res) => {
  res.json({
    defaults: config.defaults,
    textTemplates: config.textTemplates,
    characterProperties: config.characterProperties,
    fileManagement: config.fileManagement
  });
});

// API endpoint to get available styles
app.get('/api/styles', (req, res) => {
  res.json({
    styles: config.styles
  });
});

// API endpoint to get available sizes
app.get('/api/sizes', (req, res) => {
  res.json({
    sizes: config.sizes
  });
});

// API endpoint to list saved images
app.get('/api/assets', (req, res) => {
  try {
    const assetsDir = path.join(__dirname, 'public', 'assets');
    
    if (!fs.existsSync(assetsDir)) {
      return res.json({ assets: [] });
    }

    const files = fs.readdirSync(assetsDir);
    const assets = [];

    files.forEach(file => {
      if (file.endsWith('.png')) {
        const metadataPath = path.join(assetsDir, `${file}.json`);
        let metadata = null;
        
        if (fs.existsSync(metadataPath)) {
          try {
            metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
          } catch (e) {
            console.error(`Error reading metadata for ${file}:`, e);
          }
        }

        assets.push({
          filename: file,
          url: `/assets/${file}`,
          metadata: metadata
        });
      }
    });

    // Sort by timestamp (newest first)
    assets.sort((a, b) => {
      const timeA = a.metadata?.timestamp || 0;
      const timeB = b.metadata?.timestamp || 0;
      return new Date(timeB) - new Date(timeA);
    });

    res.json({ assets: assets });
  } catch (error) {
    console.error('Error listing assets:', error);
    res.status(500).json({ error: 'Failed to list assets' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 GptApp1 server running on http://localhost:${PORT}`);
  console.log(`📱 App Name: GptApp1`);
  console.log(`🔑 OpenAI API Key configured`);
}); 