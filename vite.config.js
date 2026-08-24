import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// If you deploy this to GitHub Pages as a PROJECT page (e.g.
// https://username.github.io/repo-name/), uncomment the line below and set
// it to "/repo-name/". Not needed for Vercel, Netlify, or a custom domain.
// base: "/repo-name/",

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // three.js is roughly half the shipped JavaScript and changes only
        // when the dependency is upgraded — keeping it in its own chunk means
        // an edit to the CV content invalidates a few KB of app code instead
        // of forcing every returning visitor to re-download the whole engine.
        manualChunks: {
          three: ["three"],
          react: ["react", "react-dom"],
          gsap: ["gsap", "gsap/ScrollTrigger"],
        },
      },
    },
  },
});
