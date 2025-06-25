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

// API endpoint to generate hand drawing images
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt, style = 'realistic', size = '512x512' } = req.body;
    
    console.log('Generate image request:', { prompt, style, size });
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Construct the full prompt based on style - using simpler, safer prompts
    let fullPrompt = '';
    if (style === 'japanese') {
      fullPrompt = `A hand drawing in Japanese manga style, ${prompt}, clean lines, white background`;
    } else if (style === 'anime') {
      fullPrompt = `An anime-style hand drawing, ${prompt}, clean lines, white background`;
    } else if (style === 'sketch') {
      fullPrompt = `A pencil sketch of a hand, ${prompt}, artistic style, white background`;
    } else {
      fullPrompt = `A realistic hand drawing, ${prompt}, soft lighting, white background`;
    }

    console.log('Full prompt:', fullPrompt);
    console.log('API Key (first 10 chars):', config.OPENAI_API_KEY.substring(0, 10) + '...');

    // Use the working format - no model specification, simpler prompts
    const requestBody = {
      prompt: fullPrompt,
      n: 1,
      size: size,
      response_format: "url"
    };

    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.OPENAI_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    console.log('OpenAI Response Status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API Error Details:', JSON.stringify(errorData, null, 2));
      
      // Try to provide more helpful error messages
      let errorMessage = 'Failed to generate image';
      if (errorData.error && errorData.error.type === 'image_generation_user_error') {
        errorMessage = 'The prompt may contain content that violates OpenAI\'s content policy. Please try a different description.';
      }
      
      return res.status(response.status).json({ 
        error: errorMessage, 
        details: errorData,
        status: response.status,
        statusText: response.statusText
      });
    }

    const data = await response.json();
    console.log('OpenAI Response Data:', JSON.stringify(data, null, 2));
    
    const imageUrl = data.data[0].url;

    // --- Automatically save the image to assets directory ---
    const assetsDir = path.join(__dirname, 'public', 'assets');
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }
    const sanitizedPrompt = fullPrompt.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').substring(0, 50);
    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `hand_drawing_${sanitizedPrompt}_${timestampStr}.png`;
    const filepath = path.join(assetsDir, filename);

    // Download the image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error('Failed to download image');
    }
    const imageBuffer = await imageResponse.buffer();
    fs.writeFileSync(filepath, imageBuffer);

    // Create metadata file
    const metadata = {
      filename: filename,
      originalUrl: imageUrl,
      prompt: fullPrompt,
      timestamp: new Date().toISOString(),
      savedAt: new Date().toISOString()
    };
    const metadataPath = path.join(assetsDir, `${filename}.json`);
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    console.log(`Image automatically saved to assets: ${filename}`);
    // --- End auto-save ---

    res.json({ 
      success: true, 
      imageUrl: `/assets/${filename}`,
      prompt: fullPrompt,
      localFile: `/assets/${filename}`,
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

// API endpoint to get available styles
app.get('/api/styles', (req, res) => {
  res.json({
    styles: [
      { id: 'realistic', name: 'Realistic', description: 'Photorealistic hand drawing' },
      { id: 'japanese', name: 'Japanese Manga', description: 'Japanese manga style hand' },
      { id: 'anime', name: 'Anime', description: 'Anime-style hand drawing' },
      { id: 'sketch', name: 'Sketch', description: 'Pencil sketch style' }
    ]
  });
});

// API endpoint to get available sizes
app.get('/api/sizes', (req, res) => {
  res.json({
    sizes: [
      { id: '256x256', name: 'Small (256x256)' },
      { id: '512x512', name: 'Medium (512x512)', default: true },
      { id: '1024x1024', name: 'Large (1024x1024)' }
    ]
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