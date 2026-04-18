/**
 * All backend API endpoint paths.
 * Versioned against deeply-backend @ NestJS API module.
 */
export const endpoints = {
  // Auth
  auth: {
    apple: '/auth/apple',
    refresh: '/auth/refresh',
    deleteAccount: '/auth/account',
  },

  // User
  user: {
    me: '/user',
  },

  // Culture
  culture: {
    sections: '/culture/sections',
    articles: '/culture/articles',
    article: (slug: string) => `/culture/articles/${slug}`,
  },

  // Training
  train: {
    blocks: '/train/blocks',
    programTrainings: (slug: string) => `/train/programs/${slug}/trainings`,
    training: (slug: string) => `/train/trainings/${slug}`,
    private: '/train/private',
    runs: '/train/runs',
    run: (id: string) => `/train/runs/${id}`,
  },

  // Results
  results: {
    summary: '/results/summary',
    recent: '/results/recent',
    training: (slug: string) => `/results/training/${slug}`,
    program: (slug: string) => `/results/program/${slug}`,
    private: (id: string) => `/results/private/${id}`,
  },

  // Dive
  dive: {
    templates: '/dive/templates',
    template: (slug: string) => `/dive/templates/${slug}`,
    run: '/dive/run',
  },

  // Purchases
  purchases: {
    status: '/purchases/me',
    sync: '/purchases/sync',
  },
} as const;
