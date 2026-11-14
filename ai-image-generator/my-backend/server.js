

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const API = "https://aihorde.net/api/v2";
const API_KEY = "0000000000";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

app.post("/api/image", async (req, res) => {

  try {
    const { prompt } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: "Please enter an image description." });
    }

    // 1. Submit the image-generation request
    const startResponse = await fetch(`${API}/generate/async`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: API_KEY,
        "Client-Agent": "my-react-image-generator:1.0"
      },
      body: JSON.stringify({
        prompt: prompt.trim(),
        params: {
          n: 1,
          width: 512,
          height: 512,
          steps: 20
        },
        nsfw: false,
        r2: true
      })
    });

    const startData = await startResponse.json();

    if (!startResponse.ok) {
      throw new Error(startData.message || startData.error || "Could not start image generation.");
    }

    const requestId = startData.id;

    if (!requestId) {
      throw new Error("The image service did not return a request ID.");
    }

    // 2. Check the request until it finishes (maximum 3 minutes)
    let finished = false;

    for (let attempt = 0; attempt < 60; attempt++) {
      await wait(3000);

      const checkResponse = await fetch(
        `${API}/generate/check/${requestId}`,
        { headers: { apikey: API_KEY } }
      );

      const checkData = await checkResponse.json();

      if (!checkResponse.ok) {
        throw new Error(checkData.message || "Could not check generation status.");
      }

      if (checkData.faulted) {
        throw new Error("The image-generation job failed. Please try again.");
      }

      if (checkData.done) {
        finished = true;
        break;
      }
    }

    if (!finished) {
      throw new Error("Generation is taking too long. Please try again.");
    }

    // 3. Retrieve the generated image
    const resultResponse = await fetch(
      `${API}/generate/status/${requestId}`,
      { headers: { apikey: API_KEY } }
    );

    const resultData = await resultResponse.json();

    if (!resultResponse.ok) {
      throw new Error(resultData.message || "Could not retrieve the image.");
    }

    const imageUrl = resultData.generations?.[0]?.img;

    if (!imageUrl) {
      throw new Error("No image was returned. Please try another prompt.");
    }

    // 4. Send the image URL to React
    res.json({ url: imageUrl });

  } catch (error) {
    console.error("Image generation error:", error);
    res.status(500).json({ error: error.message || "Image generation failed." });
  }
});

app.listen(3001, () => {
  console.log("Backend running on http://localhost:3001");
});
