# Peter Monev — Interactive 3D CV 🎸

A highly interactive, animated, and performant personal portfolio and resume built with **React** and **Three.js**. 

This project goes beyond a standard static CV by incorporating 3D scenes, a functional terminal simulator, and interactive UI elements, all while maintaining high performance through strategic WebGL context management.

## ✨ Features

* **Interactive 3D Scenes (Three.js):**
    * **Hero 3D:** A rotating wireframe icosahedron with an orbiting torus knot and an interactive starfield that reacts to cursor movement.
    * **Skills Galaxy:** A 3D planetary system categorizing tech skills (Frontend, Backend, Databases, Tools), complete with custom-generated textures and raycasted click events.
    * **Certificate Cloud:** A spherical cluster of SoftUni achievement badges that gently bob and scale on hover, linking out to official credentials.
    * **Hologram Viewer:** A sci-fi inspired hologram projector that dynamically swaps project screenshots onto a glowing 3D plane.
    * **Timeline 3D:** A glowing, flowing particle tube alongside the experience timeline.
* **Terminal Simulator:** A fully functional hero terminal where users can type commands like `about`, `experience`, `skills`, `projects`, and `sudo hire-me` to interact with the CV.
* **Matrix Rain:** A custom 2D canvas implementation of the classic digital rain effect serving as a backdrop for the stats section.
* **Performance Optimized:** Implements a custom `<LazyMount>` wrapper using the `IntersectionObserver` API to mount/unmount expensive WebGL contexts only when they are near the viewport, preventing context loss and saving browser resources.
* **Anti-Scraping Protection:** Phone number is stored as char codes and requires user interaction to decode and reveal, protecting it from basic web scrapers.
* **Responsive Design:** Fully fluid layout adapting to both desktop and mobile devices.

## 🛠️ Tech Stack

* **Framework:** React 18
* **Build Tool:** Vite
* **3D Graphics:** Three.js
* **Styling:** Vanilla CSS (CSS-in-JS via GlobalStyles component)
* **Icons:** Lucide React

## 🚀 Run Locally

To get a local copy up and running, follow these simple steps:

1. **Ensure you have Node.js installed.**
2. **Clone the repository** (or download the source code).
3. **Install the dependencies:**
   ```bash
   npm install