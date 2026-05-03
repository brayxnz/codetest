module.exports = {
  globDirectory: 'dist/',
  globPatterns: ['**/*.{js,css,html,png,jpg,svg,gif}'],
  swDest: 'dist/sw.js',
  runtimeCaching: [{
    urlPattern: /^https:\/\/.*\.supabase\.co\/.*/,
    handler: 'NetworkFirst',
  }]
}