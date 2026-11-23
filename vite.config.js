
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['brand/expensenest-mark.png', 'brand/expensenest-lockup.png'],
      manifest: {
        name: 'ExpenseNest - Expense Tracker',
        short_name: 'ExpenseNest',
        description: 'Track your income and expenses, manage budgets, and plan your financial goals.',
        theme_color: '#061329',
        background_color: '#061329',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/brand/expensenest-mark-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/brand/expensenest-mark-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      }
    })
  ]
})
