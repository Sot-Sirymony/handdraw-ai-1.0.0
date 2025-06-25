# GptApp1 - AI Hand Drawing Generator

A beautiful web application that generates hand drawings using OpenAI's DALL-E API. Create realistic, Japanese manga-style, anime, or sketch hand drawings with simple text prompts.

## 🚀 Features

- **Multiple Art Styles**: Realistic, Japanese Manga, Anime, and Sketch styles
- **Customizable Image Sizes**: 256x256, 512x512, or 1024x1024 pixels
- **Example Prompts**: Quick-start with predefined hand gestures
- **Download & Save**: Download images or save them to the assets folder
- **Modern UI**: Beautiful, responsive design with smooth animations
- **Keyboard Shortcuts**: Ctrl/Cmd + Enter to generate, Escape to cancel

## 📋 Prerequisites

- Node.js (version 14 or higher)
- npm or yarn
- OpenAI API key (already configured)

## 🛠️ Installation

1. **Clone or download the project files**

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the server**:
   ```bash
   npm start
   ```

4. **Open your browser** and navigate to:
   ```
   http://localhost:3000
   ```

## 🎨 Usage

### Basic Usage

1. **Enter a description** of the hand you want to generate
   - Example: "fingers open, palm facing up"
   - Example: "pointing index finger"
   - Example: "peace sign, victory gesture"

2. **Select an art style**:
   - **Realistic**: Photorealistic hand drawing
   - **Japanese Manga**: Japanese manga style hand
   - **Anime**: Anime-style hand drawing
   - **Sketch**: Pencil sketch style

3. **Choose image size**:
   - Small (256x256)
   - Medium (512x512) - Recommended
   - Large (1024x1024)

4. **Click "Generate Hand Drawing"** and wait for the AI to create your image

### Advanced Features

- **Example Prompts**: Click on any example card to quickly fill the prompt field
- **Download**: Save the generated image to your computer
- **Save to Assets**: Store the image in the project's assets folder with metadata
- **Regenerate**: Create a new image with the same settings

### Keyboard Shortcuts

- `Ctrl/Cmd + Enter`: Generate image
- `Escape`: Cancel generation (when loading)

## 📁 Project Structure

```
GptApp1/
├── public/
│   ├── index.html          # Main HTML file
│   ├── styles.css          # CSS styles
│   ├── script.js           # Frontend JavaScript
│   └── assets/             # Generated images (created automatically)
├── server.js               # Express server
├── config.js               # Configuration (API key)
├── package.json            # Dependencies
└── README.md               # This file
```

## 🔧 Configuration

The OpenAI API key is already configured in `config.js`:

```javascript
module.exports = {
  OPENAI_API_KEY: 'your-api-key-here',
  PORT: 3000
};
```

## 🎯 Example Prompts

Try these prompts to get started:

- **"fingers open, palm facing up"** - Open hand gesture
- **"pointing index finger"** - Pointing gesture
- **"peace sign, victory gesture"** - Peace sign
- **"holding a pen, writing position"** - Hand holding pen
- **"thumbs up gesture"** - Thumbs up
- **"fist closed, strong grip"** - Closed fist
- **"hand gesture for stop"** - Stop gesture
- **"fingers crossed for luck"** - Crossed fingers

## 🖼️ Image Management

### Generated Images

All generated images are stored in the `public/assets/` folder with:
- Descriptive filenames based on the prompt
- Timestamp for organization
- Metadata files (.json) containing generation details

### Metadata

Each saved image includes metadata with:
- Original prompt
- Generation timestamp
- Art style used
- Image size
- Original OpenAI URL

## 🚨 Troubleshooting

### Common Issues

1. **"Failed to generate image"**
   - Check your internet connection
   - Verify the OpenAI API key is valid
   - Try a different prompt

2. **"Server not starting"**
   - Ensure Node.js is installed
   - Check if port 3000 is available
   - Run `npm install` to install dependencies

3. **"Image not saving to assets"**
   - Check file permissions
   - Ensure the assets folder exists
   - Verify disk space

### API Limits

- OpenAI has rate limits on API calls
- Large images (1024x1024) may take longer to generate
- Some prompts may be filtered by OpenAI's content policy

## 🔒 Security Notes

- The API key is stored in `config.js` for development
- For production, use environment variables
- Never commit API keys to version control

## 📱 Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

## 🎨 Customization

### Adding New Styles

Edit `server.js` to add new art styles:

```javascript
if (style === 'your-style') {
  fullPrompt = `your custom prompt template, ${prompt}, additional styling`;
}
```

### Modifying the UI

- Edit `public/styles.css` for styling changes
- Modify `public/index.html` for layout changes
- Update `public/script.js` for functionality changes

## 📄 License

This project is for educational purposes. Please respect OpenAI's terms of service.

## 🤝 Support

If you encounter any issues:

1. Check the browser console for errors
2. Verify your OpenAI API key is valid
3. Ensure all dependencies are installed
4. Check the server logs for detailed error messages

---

**App Name**: GptApp1  
**Version**: 1.0.0  
**OpenAI API**: DALL-E Image Generation 