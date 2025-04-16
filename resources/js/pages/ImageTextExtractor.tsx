import React, { useState, useEffect } from 'react';
import { useTesseract } from 'react-tesseract';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Card } from '@/Components/ui/card';
import { Label } from '@/Components/ui/label';

const ImageTextExtractor = () => {
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [extractionStatus, setExtractionStatus] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const { recognize, result, isRecognizing, error } = useTesseract({
    logger: m => {
      console.log(m);
      if (m.status === 'recognizing text') {
        setExtractionStatus(`Progress: ${Math.round(m.progress * 100)}%`);
      }
    }
  });

  // Update extracted text when result changes
  useEffect(() => {
    if (result) {
      console.log('Extraction result:', result);
      // Check different possible locations of the text in the result object
      if (result.text) {
        setExtractedText(result.text);
      } else if (result.data && result.data.text) {
        setExtractedText(result.data.text);
      } else if (typeof result === 'string') {
        setExtractedText(result);
      }
    }
  }, [result]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      setImagePreview(url);
      setExtractionStatus('');
      setExtractedText('');
    }
  };

  const handleRecognize = async () => {
    if (imageUrl) {
      setExtractionStatus('Starting extraction...');
      try {
        // Try with different options
        await recognize(imageUrl, { 
          language: 'eng',
          tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!?@#$%&*()-+=:;"\'',
          tessedit_pageseg_mode: '1', // Automatic page segmentation with OSD
        });
      } catch (err) {
        console.error('Error during recognition:', err);
        setExtractionStatus(`Error: ${err.message}`);
      }
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-4">Image Text Extractor</h1>
        
        <div className="mb-4">
          <Label htmlFor="image-upload">Upload Image</Label>
          <Input
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="mt-2"
          />
        </div>

        {imagePreview && (
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">Image Preview</h2>
            <div className="border rounded p-2">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="max-h-64 mx-auto"
              />
            </div>
          </div>
        )}

        <div className="mb-4">
          <Button 
            onClick={handleRecognize} 
            disabled={!imageUrl || isRecognizing}
            className="w-full"
          >
            {isRecognizing ? 'Extracting Text...' : 'Extract Text'}
          </Button>
        </div>

        {extractionStatus && (
          <div className="mb-4 p-3 bg-blue-100 text-blue-700 rounded">
            <p>{extractionStatus}</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            <p className="font-semibold">Error:</p>
            <p>{error.message}</p>
          </div>
        )}

        {extractedText && (
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">Extracted Text</h2>
            <div className="border rounded p-4 bg-gray-50">
              <pre className="whitespace-pre-wrap">{extractedText}</pre>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ImageTextExtractor; 