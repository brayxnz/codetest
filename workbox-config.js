module.exports = {
  globDirectory: 'dist/',
  globPatterns: ['**/*.{js,css,html,png,jpg,svg}'],
  swDest: 'dist/sw.js',
  runtimeCaching: [{
    urlPattern: /^https:\/\/.*\.supabase\.co\/.*/,
    handler: 'NetworkFirst', // Supabase siempre intenta red primero
  }]
}