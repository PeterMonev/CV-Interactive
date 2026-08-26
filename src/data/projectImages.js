// Screenshots live in src/assets as real .jpg files rather than inline base64.
// Base64 costs a third more bytes, cannot be gzipped any further (JPEG is
// already compressed) and forced all 11 images into the main JS bundle, which
// had to finish downloading before anything rendered. As files, Vite hashes
// them, the browser caches and decodes them in parallel, and they never block
// first paint.
import musicShop from "../assets/project-music-shop.jpg";
import boutique from "../assets/project-boutique.jpg";
import calculator from "../assets/project-calculator.jpg";
import rehearsalhub from "../assets/project-rehearsalhub.jpg";
import musicCatalog from "../assets/project-music-catalog.jpg";
import musicLogin from "../assets/project-music-login.jpg";
import boutique2 from "../assets/project-boutique-2.jpg";
import boutiqueHeader from "../assets/project-boutique-header.jpg";
import rehearsalSongs from "../assets/project-rehearsal-songs.jpg";
import rehearsalBand from "../assets/project-rehearsal-band.jpg";

export const PROJECT_IMG_MUSIC_SHOP = musicShop;
export const PROJECT_IMG_BOUTIQUE = boutique;
export const PROJECT_IMG_CALCULATOR = calculator;
export const PROJECT_IMG_REHEARSALHUB = rehearsalhub;
export const PROJECT_IMG_MUSIC_CATALOG = musicCatalog;
export const PROJECT_IMG_MUSIC_LOGIN = musicLogin;
export const PROJECT_IMG_BOUTIQUE_2 = boutique2;
export const PROJECT_IMG_BOUTIQUE_HEADER = boutiqueHeader;
export const PROJECT_IMG_REHEARSAL_SONGS = rehearsalSongs;
export const PROJECT_IMG_REHEARSAL_BAND = rehearsalBand;

// Screenshots of this very site, used by its own project card.
import cvHero from "../assets/project-cv-hero.jpg";
import cvGalaxy from "../assets/project-cv-galaxy.jpg";
import cvCertificates from "../assets/project-cv-certificates.jpg";
export const PROJECT_IMG_CV_HERO = cvHero;
export const PROJECT_IMG_CV_GALAXY = cvGalaxy;
export const PROJECT_IMG_CV_CERTIFICATES = cvCertificates;
