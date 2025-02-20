const express = require('express');
const multer = require('multer');
const axios = require('axios');
const path = require('path');

const app = express();
const port = process.env.PORT || 6000;

// Use Multer to handle file uploads (we use memory storage to work with file buffers)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Endpoint to handle resume uploads
app.post('/upload', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }
    
    // The uploaded file is available in req.file.buffer
    const pdfBuffer = req.file.buffer;
    
    // Convert the PDF file buffer to a base64 string for transmission.
    const base64Pdf = pdfBuffer.toString('base64');
    
    // Prepare the payload for Gemini AI.
    const payload = {
      contents: [{
        parts: [
          {text: `Please provide a comprehensive analysis of this resume. For each category below, provide a rating out of 100 and detailed feedback. Start with an overall rating, followed by category-specific ratings.

Overall Resume Rating
Rating: [X/100]
- Provide a brief summary of the resume's overall strength and key areas for improvement

1. Visual Formatting
Rating: [X/100]
- Evaluate the layout, spacing, and overall visual organization
- Comment on font choices and consistency
- Assess the use of bullets, sections, and formatting elements

2. Content Quality
Rating: [X/100]
- Evaluate the strength of accomplishments and experiences
- Assess the use of action verbs and quantifiable results
- Review the relevance of included information

3. Professional Impact
Rating: [X/100]
- Analyze how well the resume showcases skills and expertise
- Evaluate the career progression presentation
- Assess the overall professional impression

4. Language and Clarity
Rating: [X/100]
- Review grammar and spelling
- Evaluate sentence structure and conciseness
- Assess overall readability and flow

5. ATS Optimization
Rating: [X/100]
- Evaluate keyword usage and relevance
- Assess format compatibility with ATS systems
- Review the use of standard section headings

For each category, please provide specific, actionable recommendations for improvement after your analysis.

Here is the resume:`},
          {inlineData: {
            mimeType: "application/pdf",
            data: base64Pdf
          }}
        ]
      }]
    };
    
    // Define your Gemini AI API endpoint and API key (replace with your actual endpoint/key)
    const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${'AIzaSyBdIptPipyIqNnkXgntjmpzjOlshsU7Lzg'}`;
    const geminiApiKey = 'AIzaSyBdIptPipyIqNnkXgntjmpzjOlshsU7Lzg';
    
    // Send the resume to Gemini AI for rating.
    const response = await axios.post(geminiApiUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': `Bearer ${geminiApiKey}`
      }
    });
    
    // Assume the API returns a JSON with the rating results.
    const ratingResult = response.data;
    
    // Return the rating results back to the client.
    res.json({ success: true, ratings: ratingResult });
    
  } catch (error) {
    console.error('Error processing resume:', error.response ? error.response.data : error.message);
    res.status(500).json({ success: false, message: 'Error processing resume.' });
  }
});

// Serve the HTML form at the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
