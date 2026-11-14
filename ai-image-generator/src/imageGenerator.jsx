import React from 'react';
import {useState} from 'react';
import {useRef} from 'react';

import './imageGenerator.css'
import DefaultImage from './assets/defaultImage.png'
const ImageGenerator =()=>{
   const [image_url, setImageUrl] = useState(DefaultImage);
   const [loading, setLoading] = useState(false);
   let inputRef = useRef(null);
  
const generateImage = async () => {
  const prompt = inputRef.current.value.trim();

  if (!prompt) return;

  try {
    setLoading(true);

    const response = await fetch("http://localhost:3001/api/image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt })
      
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Image generation failed.");
    }

    setImageUrl(data.url);

  } catch (error) {
    console.error(error);
    alert(error.message);
  } finally {
    setLoading(false);
  }
};


   
    return (
        <div className='AiImageGenerator'>
            <div className="header">
                ai image <span>Generator</span>
            </div>
            <img src={image_url} alt="default" className='defaultImage' height="250" width="250" />
            <div className="searchBox">
                <input
                    type="text"
                    ref={inputRef}
                    placeholder="Write a description of the image..."
                />

                <button onClick={generateImage} disabled={loading}>
                    {loading ? "Generating..." : "Generate"}
                </button>
                
            </div>
        </div>
    )
}
export default ImageGenerator;
