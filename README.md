# 💙 Chat Love Predictor

![Status](https://img.shields.io/badge/status-active-success)
![Platform](https://img.shields.io/badge/platform-browser-blue)
![Language](https://img.shields.io/badge/language-JavaScript-yellow)

[![Live Demo](https://img.shields.io/badge/🚀%20Live%20Demo-View%20Project-0ea5b7?style=for-the-badge)](YOUR_DEMO_LINK_HERE)

A browser-based WhatsApp chat analyzer that predicts interaction signals using behavioral analytics.

The system applies a heuristic formula called the **Love Theorem**:

> **Love = 50 + R + E + M + C + S + N**

The analyzer processes chat data **locally in the browser**, meaning no chat data is uploaded to any server.

---

# 🚀 Features

- WhatsApp chat parsing
- Multi-format file support (.txt / .pdf / .zip / image OCR)
- Conversation interaction analysis
- Sentiment detection (English + Hinglish + Emoji)
- Reply speed analysis
- Chat consistency detection
- Night chat interaction detection
- Conversation dominance visualization
- Relationship stage prediction
- Flirting probability estimation
- Interactive charts using Chart.js

---

# 🧠 Love Theorem Components

| Component | Description | Range |
|--------|-------------|------|
| R | Reply Time Score | 0 – 30 |
| E | Emoji Engagement Score | 0 – 20 |
| M | Message Balance Score | 0 – 20 |
| C | Chat Consistency Score | 0 – 20 |
| S | Sentiment Score | 0 – 20 |
| N | Night Chat Activity | 0 – 10 |

---

# 📊 Prediction Output

| Metric | Description |
|------|-------------|
| loveRaw | Raw interaction score |
| lovePercent | Normalized prediction score |

Prediction scale:

| Score | Meaning |
|------|--------|
| 80 – 100 | Strong romantic interest |
| 60 – 79 | High attraction |
| 40 – 59 | Friendly interaction |
| 25 – 39 | Casual conversation |
| 0 – 24 | Low interest |

---

# 📈 Charts & Analytics

The analyzer generates multiple visual charts to understand conversation behavior.

### Conversation Dominance
Doughnut chart showing message share between participants.

### Chat Activity by Hour
Bar chart showing when conversations occur during the day.

### Reply Time Analysis
Line / scatter chart visualizing reply speed patterns.

### Sentiment Distribution
Chart tracking emotional tone across the conversation.

These charts help detect patterns like:

- conversation balance
- emotional tone
- reply behavior
- peak chat hours

---

# 📂 Files Included

| File | Description |
|------|-------------|
chat-love-predictor.html | Main single-file application |
chat-love-predictor-fixed.html | Optional chart fixes version |

---

# ⚙️ Setup

No installation required.

Simply open the HTML file in your browser.

chat-love-predictor.html

---

# 🌐 Optional Local Server

If PDF parsing causes worker issues, run a local server:

python -m http.server 8000

Then open:

http://localhost:8000/chat-love-predictor.html

---

# 📖 How To Use

1. Open the analyzer in your browser  
2. Upload WhatsApp exported chat file  
3. Enter the target person's name  
4. Click **Analyze Chat**

The analyzer will generate:

- Parsed chat preview
- Participant statistics
- Love score prediction
- Relationship stage
- Flirting probability
- Interactive charts

---

# 📊 Input Format Example

Typical WhatsApp export format:

12/03/2026, 10:24 PM - Ajay: Hello  
12/03/2026, 10:25 PM - Sneha: Hi  

If the format differs, update the parser regex in `parseMessages()`.

---

# 🔍 Component Calculation

### Reply Score (R)

| Avg Reply Time | Score |
|------|------|
<2 min → 30  
<10 min → 25  
<30 min → 20  
<60 min → 10  
>60 min → 0  

---

### Emoji Score (E)

E = min(20, emojis_count × 3)

---

### Message Balance (M)

ratio = target_messages / your_messages

M = round((min(ratio,2) / 2) × 20)

---

### Chat Consistency (C)

C = (activeDays / spanDays) × 20

---

### Sentiment Score (S)

Calculated using:

- Sentiment.js
- Emoji signals
- Hinglish positive / negative words

---

### Night Chat Score (N)

Messages sent between:

10 PM – 2 AM

Night conversations may indicate stronger engagement.

---

# 🔐 Privacy

The analyzer processes all chat data **locally in the browser**.

- No server upload
- No cloud processing
- No chat storage

Your conversations remain private.

---

# ⚠️ Limitations

Predictions are heuristic-based.

Accuracy depends on:

- chat duration
- conversation frequency
- emotional tone
- reply patterns

Very short chats may produce lower accuracy.

---

# 🛠 Technology Stack

| Technology | Purpose |
|------|------|
HTML5 | Interface |
CSS3 | Styling |
JavaScript | Core logic |
Chart.js | Data visualization |
pdf.js | PDF parsing |
Tesseract.js | OCR processing |
Sentiment.js | Sentiment analysis |

---

# 🔬 Future Improvements

Planned upgrades:

- Ghosting detection
- Conversation energy analysis
- Attachment pattern analysis
- Emotional intensity scoring
- AI conversation classifier

---

## 👨‍💻 Author

**Ajay Chauhan**  
BCA — Data Science & Artificial Intelligence  
Babu Banarasi Das University (BBDU), Lucknow  

Passionate about building AI-powered tools, data analytics systems, and innovative web applications.

---

# 📜 License

Educational and experimental use.
