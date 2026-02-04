import express from "express";
import fetch from "node-fetch";
import { DataStream } from "scramjet";

const app = express();
const PORT = process.env.PORT || 3000;

// Decode HVTR format
function decodeHVTR(hvtr) {
  if (!hvtr.startsWith("hvtr:-//")) throw new Error("Invalid HVTR");
  return "https://" + hvtr.replace("hvtr:-//", "").replace(/,/g, ".").replace(/-/g, "/");
}

// HVTRS proxy route
app.get("/school/service", async (req, res) => {
  const hvtr = req.query.hvtr;
  if (!hvtr) return res.status(400).send("Missing hvtr parameter");

  let targetUrl;
  try {
    targetUrl = decodeHVTR(hvtr);
  } catch (err) {
    return res.status(400).send("Invalid HVTR URL");
  }

  try {
    const response = await fetch(targetUrl);

    // Copy headers for correct content-type
    response.headers.forEach((value, key) => res.setHeader(key, value));

    // Stream the response
    const stream = new DataStream(response.body)
      .map(chunk => chunk) // optional transform
      .pipe(res);

  } catch (err) {
    res.status(500).send("Proxy fetch error: " + err.message);
  }
});

// Optional: homepage
app.get("/", (req, res) => {
  res.send(`<h2>HVTRS Scramjet Proxy</h2>
  <form method="get" action="/school/service">
    <input name="hvtr" placeholder="hvtr:-//example,com" style="width:400px"/>
    <button type="submit">Go</button>
  </form>`);
});

app.listen(PORT, () => console.log(`HVTRS Scramjet Proxy running on port ${PORT}`));
