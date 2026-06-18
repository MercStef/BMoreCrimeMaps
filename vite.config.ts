import { defineConfig } from 'vite'
// Import your framework plugin if needed (e.g., vue, react)
// import vue from '@vitejs/plugin-vue' 

export default defineConfig({
  // CRITICAL for GitHub Pages (replace 'repo-name' with your actual repository name)
  base: '/repo-name/',
  
  // plugins: [vue()], // Uncomment if using Vue
})   
