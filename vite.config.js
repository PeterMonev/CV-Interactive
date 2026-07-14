import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// If you deploy this to GitHub Pages as a PROJECT page (e.g.
// https://username.github.io/repo-name/), uncomment the line below and set
// it to "/repo-name/". Not needed for Vercel, Netlify, or a custom domain.
// base: "/repo-name/",

export default defineConfig({
  plugins: [react()],
});
