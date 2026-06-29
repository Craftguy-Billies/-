# 📖 人格規律 — 存在主義哲學探索

A philosophical essay exploring existentialism, nihilism, freedom, and meaning in the post-religious age.

## 📂 Project Structure

```
├── index.html              # Main website — philosophical essay
├── stable_diffusion.ipynb  # Google Colab notebook — SDXL image generation
├── CNAME                   # Custom domain for GitHub Pages
└── README.md               # This file
```

## 🌐 Website

The site is hosted at **www.book.craftguy.eu.org** via GitHub Pages.

### Features
- 📱 Responsive design (Bootstrap 4.6.2)
- 📖 Reading progress indicator
- 🧭 Smooth-scrolling table of contents
- ⬆️ Scroll-to-top button
- 🖨️ Print-optimized styles
- ♿ Accessibility (ARIA labels, semantic HTML)
- 🌍 SEO (Open Graph, meta tags, canonical URL)
- 🔧 CDN fallback mechanism (auto-recovers if CDN fails)
- 📊 Comprehensive debug logging (console)

## ☕ Stable Diffusion Notebook

The notebook (`stable_diffusion.ipynb`) generates images using **Stability AI's SDXL 1.0** + **Hyper-SD LoRA**.

### Error Handling Coverage
- CUDA unavailable → CPU fallback
- Low VRAM → memory optimizations (VAE slicing/tiling, CPU offload)
- Low disk space → pre-download check
- Corrupted downloads → retry with re-download
- OOM → cache clearing + retry with reduced settings
- Invalid/empty prompts → validation + fallback
- Network failures → retry with backoff
- User interrupt → graceful cleanup
- Missing imports → per-module diagnostics

## 🔧 Development

### Prerequisites
- GitHub Pages (for website)
- Google Colab with GPU (for notebook)

### Environment Variables (Notebook)
| Variable | Default | Description |
|----------|---------|-------------|
| `PROMPT` | Pikachu dining | Text prompt for generation |
| `SEED` | random | Random seed for reproducibility |
| `NUM_STEPS` | 12 | Inference steps (1-50) |
| `GUIDANCE_SCALE` | 5.0 | CFG scale (1-20) |
| `ETA` | 0.5 | Stochasticity (0-1) |
| `OUTPUT_DIR` | `.` | Output directory |
| `BASE_MODEL` | stabilityai/stable-diffusion-xl-base-1.0 | Model ID |

## 📄 License

© 2024 billiez™. All rights reserved.
