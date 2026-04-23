# XYRanWord - Random Word Generator

![XYRanWord Logo](https://raw.githubusercontent.com/vitejs/vite/main/packages/vite/src/node/server/logo.svg) <!-- Replace with your own logo if available -->

**XYRanWord** is a premium, web-based random word generator designed for writers, gamers, and creative thinkers. It features a unique **XY Weighting Map** that allows you to influence the probability of word categories through interactive physics-based nodes.

## ✨ Features

- **Interactive XY Weighting Map**: Drag category nodes and a focus ring to dynamically adjust the generation probability.
- **Physics-Based Nodes**: Nodes feature repulsion physics to "keep their distance" and maintain a clean UI.
- **Multi-Language Support**: Fully localized in **English**, **日本語 (Japanese)**, and **ไทย (Thai)**.
- **7 Vibrant Themes**: Choose from Indigo, Rose, Emerald, Amber, Cyan, Violet, and Orange.
- **Dark & Light Modes**: Seamlessly switch between themes with a dedicated toggle.
- **Persistent Database**: Uses `sql.js` for local SQLite database management. Import and export your `data.db` file easily.
- **Word Manager**: Search, delete, and manage individual words and categories.
- **Bulk JSON Import**: Quickly add large sets of words using a simple JSON format.
- **AI-Ready**: Built-in JSON schema for use with LLMs (like GPT-4 or Gemini) to generate custom datasets.
- **Fully Responsive**: Optimized for Desktop, Tablets, and Mobile devices.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/xyranword.git
   cd xyranword
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

### Deployment
The project is configured for **GitHub Pages**.
- **Manual**: Run `npm run deploy`.
- **Automatic**: Use the included GitHub Action by pushing to the `main` branch.

## 🛠️ Tech Stack
- **Framework**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: sql.js (SQLite WASM)
- **Deployment**: GitHub Actions / gh-pages

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments
- Inspired by the need for creative writing prompts and random data generation.
- Built with a focus on Glassmorphism and Premium UX.
