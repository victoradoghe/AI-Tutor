// import express from "express";
// const cors = require("cors");
// import dotenv from "dotenv";
// const Groq = require("groq-sdk");



// dotenv.config();

// const app = express();
// app.use(cors());
// app.use(express.json());

// const groq: any = new Groq({
//   apiKey: process.env.GROQ_API_KEY,
// });

// app.post("/api/chat", async (req, res) => {
//   try {
//     const { message } = req.body;
//     if (!message) return res.status(400).json({ error: "Message is required" });

//     const completion = await groq.chat.completions.create({
//       model: "mixtral-8x7b-32768",
//       messages: [{ role: "user", content: message }],
//     });

//     const aiText = completion.choices[0]?.message?.content || "No response";

//     res.json({ reply: aiText });
//   } catch (error: any) {
//     console.error(error);
//     res.status(500).json({ error: error.message || "Server error" });
//   }
// });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
