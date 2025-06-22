// eslint no-console: "error"
// API Request Handler for Harare Metro

// Import your actual services
import { initializeServices, CACHE_CONFIG } from './index.js'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-ID',
}

// Production logging utility - Uses Worker Observability
class Logger {
  static info(message, data = {}) {
    // Only log important info in production
    console.info(`[INFO] ${message}`, data)
  }
  
  static warn(message, data = {}) {
    console.warn(`[WARN] ${message}`, data)
  }
  
  static error(message, error = null, data = {}) {
    console.error(`[ERROR] ${message}`, { 
      error: error?.message || error, 
      stack: error?.stack,
      ...data 
    })
  }
  
  static debug(message, data = {}) {
    // Debug logs only in development (remove in production)
    // Uncomment next line only for debugging
    // console.log(`[DEBUG] ${message}`, data)
  }
}

// Main API handler
export async function handleApiRequest(request, env, ctx) {
  const startTime = Date.now()
  let response
  
  try {
    const url = new URL(request.url)
    const path = url.pathname.replace('/api/', '')
    const method = request.method

    // Only log API requests, not every debug detail
    Logger.info(`API ${method} /${path}`)

    // Test service initialization early
    try {
      const services = initializeServices(env)
      // Store services in context for reuse
      ctx.services = services
    } catch (initError) {
      Logger.error('Service initialization failed', initError)
      return new Response(JSON.stringify({
        error: 'Service initialization failed',
        message: initError.message,
        timestamp: new Date().toISOString()
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Health endpoint (always works)
    if (path === 'health') {
      response = await handleHealth(request, env)
    }
    // Feeds endpoint  
    else if (path === 'feeds') {
      response = await handleFeeds(request, env, ctx)
    }
    // Image proxy endpoint
    else if (path === 'image-proxy') {
      response = await handleImageProxy(request, env)
    }
    // Analytics endpoints
    else if (path.startsWith('analytics/')) {
      if (path === 'analytics/track') {
        response = await handleAnalyticsTrack(request, env)  // Use the new function
      } else {
        response = await handleAnalytics(request, env)      // Keep existing for other analytics
      }
    }
    // User endpoints
    else if (path.startsWith('user/')) {
      response = await handleUser(request, env)
    }
    // Config endpoints
    else if (path.startsWith('config/')) {
      response = await handleConfig(request, env)
    }
    // Admin endpoints
    else if (path.startsWith('admin/')) {
      response = await handleAdmin(request, env, ctx)
    }
    else {
      response = new Response(JSON.stringify({
        error: 'API endpoint not found',
        available_endpoints: [
          '/api/health',
          '/api/feeds?category=X&search=Y&timeframe=Z&sort=W&limit=N', 
          '/api/image-proxy?url=IMAGE_URL',
          '/api/analytics/track',
          '/api/analytics/status',
          '/api/user/profile',
          '/api/user/bookmarks', 
          '/api/user/likes',
          '/api/config/sources',
          '/api/config/categories',
          '/api/config/keywords',
          '/api/config/all',
          '/api/admin/clear-cache',
          '/api/admin/refresh-config',
          '/api/admin/refresh-status',
          '/api/admin/force-refresh'
        ],
        method,
        path: `/${path}`
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Log response time for monitoring
    const duration = Date.now() - startTime
    if (duration > 1000) {
      Logger.warn(`Slow API response: ${method} /${path}`, { duration: `${duration}ms` })
    }

    return response
  } catch (error) {
    Logger.error('API Request Failed', error, { 
      path: request.url,
      method: request.method,
      duration: `${Date.now() - startTime}ms`
    })
    
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: 'Request failed - check logs for details'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// Admin handler function - MANUAL OPERATIONS ONLY
async function handleAdmin(request, env, ctx) {
  const url = new URL(request.url)
  const adminPath = url.pathname.replace('/api/admin/', '')
  const method = request.method

  // Add admin authentication header check (optional)
  const adminKey = request.headers.get('X-Admin-Key')
  if (env.ADMIN_KEY && adminKey !== env.ADMIN_KEY) {
    return new Response(JSON.stringify({
      error: 'Unauthorized',
      message: 'Valid admin key required'
    }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  Logger.info(`[ADMIN] Manual operation: ${method} /${adminPath}`)

  try {
    switch (adminPath) {
      case 'status':
        return await handleAdminStatus(request, env)
      
      case 'clear-cache':
        return await handleClearCache(request, env)
      
      case 'force-refresh':
        return await handleForceRefresh(request, env, ctx)
      
      case 'config-refresh':
        return await handleRefreshConfig(request, env)
    
      case 'init-config':
        return await handleInitConfig(request, env)
      
      case 'analytics-summary':
        return await handleAnalyticsSummary(request, env)
      
      case 'images-status':
        const { imagesService } = initializeServices(env)
        return new Response(JSON.stringify({
          success: true,
          cloudflareImages: {
            enabled: env.CLOUDFLARE_IMAGES_ENABLED === 'true',
            hasAccountId: !!env.CLOUDFLARE_IMAGES_ACCOUNT_ID,
            hasToken: !!env.CLOUDFLARE_IMAGES_TOKEN,
            serviceReady: imagesService ? imagesService.isEnabled() : false,
            accountId: env.CLOUDFLARE_IMAGES_ACCOUNT_ID ? `${env.CLOUDFLARE_IMAGES_ACCOUNT_ID.substring(0, 8)}...` : 'Missing',
            tokenLength: env.CLOUDFLARE_IMAGES_TOKEN ? env.CLOUDFLARE_IMAGES_TOKEN.length : 0
          },
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    
      default:
        return new Response(JSON.stringify({
          error: 'Admin endpoint not found',
          available_admin_endpoints: [
            '/api/admin/status - System status and health',
            '/api/admin/clear-cache - Clear all cached data', 
            '/api/admin/force-refresh - Manually trigger article refresh',
            '/api/admin/config-refresh - Refresh configuration from fallback',
            '/api/admin/init-config - Initialize configuration',
            '/api/admin/analytics-summary - View analytics summary'
          ],
          path: adminPath,
          note: 'These are manual administrative operations only'
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
  } catch (error) {
    Logger.error('[ADMIN] Manual operation failed', error, { path: adminPath })
    return new Response(JSON.stringify({
      error: 'Admin operation failed',
      message: error.message,
      path: adminPath
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// Admin status endpoint - READ-ONLY
async function handleAdminStatus(request, env) {
  try {
    const { cacheService, configService } = initializeServices(env)
    
    const [cacheStats, metadata, lastScheduled, isLocked] = await Promise.all([
      cacheService.getCacheStats(),
      cacheService.getArticleMetadata(),
      cacheService.getLastScheduledRun(),
      cacheService.isRefreshLocked()
    ])
    
    return new Response(JSON.stringify({
      success: true,
      system: {
        status: 'operational',
        mode: 'autonomous',
        lastCheck: new Date().toISOString()
      },
      cache: {
        articles: metadata.articleCount,
        lastRefresh: metadata.lastRefresh,
        lastScheduledRun: lastScheduled || 'Never',
        refreshLock: isLocked ? 'Active' : 'None',
        stats: cacheStats
      },
      config: {
        kvAvailable: configService.isKVAvailable(),
        usingFallback: !configService.isKVAvailable()
      },
      refresh: {
        interval: `${CACHE_CONFIG.SCHEDULED_REFRESH_INTERVAL / (60 * 1000)} minutes`,
        cronSchedule: '0 * * * *',
        isWorking: lastScheduled && (Date.now() - new Date(lastScheduled).getTime()) < (2 * 60 * 60 * 1000)
      },
      note: 'System operates autonomously - admin actions are manual overrides only',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    Logger.error('[ADMIN] Status check failed', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// Clear all cache data - USING CACHESERVICE
async function handleClearCache(request, env) {
  try {
    const { cacheService } = initializeServices(env)
    const result = await cacheService.clearAllCache()
    
    Logger.info('Cache cleared successfully')
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    Logger.error('Failed to clear cache', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// Refresh config - USING CONFIGSERVICE
async function handleRefreshConfig(request, env) {
  try {
    Logger.info('Force refreshing configuration from fallback')
    
    const { configService } = initializeServices(env)
    
    // ADMIN ACTION: Force refresh from fallback
    const refreshResult = await configService.forceRefreshFromFallback()
    
    if (!refreshResult.success) {
      Logger.error('Configuration refresh failed', null, { error: refreshResult.error })
      return new Response(JSON.stringify({
        success: false,
        error: refreshResult.error
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    // Verify the refresh worked
    const [sources, categories, keywords] = await Promise.all([
      configService.getRSSources(),
      configService.getCategories(),
      configService.getCategoryKeywords()
    ])
    
    Logger.info('Configuration refresh completed', { 
      sources: sources.length, 
      categories: categories.length,
      keywordCategories: Object.keys(keywords).length 
    })
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Configuration force refreshed from fallback',
      data: {
        sources: sources.length,
        categories: categories.length,
        keywordCategories: Object.keys(keywords).length,
        refreshed: refreshResult.refreshed
      },
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    Logger.error('Error refreshing config', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// Initialize config - USING CONFIGSERVICE
async function handleInitConfig(request, env) {
  try {
    console.log('[CONFIG] Initializing configuration...')
    
    const { configService } = initializeServices(env)
    
    if (!configService.isKVAvailable()) {
      return new Response(JSON.stringify({
        success: false,
        error: 'CONFIG_STORAGE KV namespace not available',
        message: 'Please check wrangler.toml configuration and deploy with proper KV bindings'
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    // Initialize from fallback
    const result = await configService.initializeFromFallback()
    
    console.log('[CONFIG] Initialization result:', result)
    
    return new Response(JSON.stringify({
      ...result,
      timestamp: new Date().toISOString(),
      kvStatus: 'available'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('[CONFIG] Error initializing configuration:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// Get refresh status - USING CACHESERVICE
async function handleRefreshStatus(request, env) {
  try {
    const { cacheService } = initializeServices(env)
    const stats = await cacheService.getCacheStats()
    const metadata = await cacheService.getArticleMetadata()
    const lastScheduled = await cacheService.getLastScheduledRun()
    const isLocked = await cacheService.isRefreshLocked()
    
    return new Response(JSON.stringify({
      success: true,
      backgroundRefresh: {
        lastRefresh: metadata.lastRefresh,
        lastScheduledRun: lastScheduled || 'Never', 
        cachedArticles: metadata.articleCount,
        refreshLock: isLocked ? 'Active' : 'None',
        refreshInterval: `${CACHE_CONFIG.SCHEDULED_REFRESH_INTERVAL / (60 * 1000)} minutes`,
        cronSchedule: '0 * * * *',
        isWorking: lastScheduled && (Date.now() - new Date(lastScheduled).getTime()) < (2 * 60 * 60 * 1000),
        cacheStatus: metadata.cacheStatus
      },
      cache: stats,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    Logger.error('Error getting refresh status', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// Force refresh articles - USING CACHESERVICE
async function handleForceRefresh(request, env, ctx) {
  try {
    Logger.info('[ADMIN] Manual force refresh initiated')
    
    const { cacheService, rssService } = initializeServices(env)
    
    // Clear any existing lock (admin override)
    await cacheService.releaseRefreshLock()
    
    // Force acquire lock
    const lockAcquired = await cacheService.acquireRefreshLock()
    if (!lockAcquired) {
      throw new Error('Failed to acquire refresh lock for manual operation')
    }

    try {
      Logger.info('[ADMIN] Starting manual RSS refresh')
      
      const articles = await rssService.fetchAllFeedsBackground(
        CACHE_CONFIG.ITEMS_PER_SOURCE,
        CACHE_CONFIG.MAX_ARTICLES
      )
      
      if (articles && articles.length > 0) {
        await cacheService.setCachedArticles(articles)
        await cacheService.setLastScheduledRun()
        
        Logger.info(`[ADMIN] Manual refresh completed: ${articles.length} articles`)
        
        return new Response(JSON.stringify({
          success: true,
          message: 'Manual refresh completed successfully',
          articlesLoaded: articles.length,
          timestamp: new Date().toISOString(),
          operation: 'manual_admin_refresh'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      } else {
        throw new Error('No articles were fetched during manual refresh')
      }
      
    } finally {
      await cacheService.releaseRefreshLock()
    }
    
  } catch (error) {
    Logger.error('[ADMIN] Manual refresh failed', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      operation: 'manual_admin_refresh'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// Analytics summary - USING ANALYTICS DATASETS
async function handleAnalyticsSummary(request, env) {
  try {
    Logger.info('[ADMIN] Analytics summary requested')
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Analytics summary endpoint',
      datasets: {
        categoryClicks: !!env.CATEGORY_CLICKS,
        newsInteractions: !!env.NEWS_INTERACTIONS,
        searchQueries: !!env.SEARCH_QUERIES
      },
      note: 'Analytics data requires specialized queries - use Cloudflare Analytics API',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    Logger.error('[ADMIN] Analytics summary failed', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// Health endpoint - USING CACHESERVICE
async function handleHealth(request, env) {
  try {
    const startTime = Date.now()
    
    // Basic health check
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      worker: 'operational',
      environment: env.NODE_ENV || 'unknown'
    }

    // Check storage availability
    health.storage = {
      configKV: !!env.CONFIG_STORAGE,
      cacheKV: !!env.CACHE_STORAGE,
      newsKV: !!env.NEWS_STORAGE,
      userDB: !!env.USER_DB
    }

    // Check analytics availability
    health.analytics = {
      categoryClicks: !!env.CATEGORY_CLICKS,
      newsInteractions: !!env.NEWS_INTERACTIONS,
      searchQueries: !!env.SEARCH_QUERIES
    }

    // Test KV connectivity
    if (env.CONFIG_STORAGE) {
      try {
        await env.CONFIG_STORAGE.get('health-check')
        health.storage.configKVStatus = 'connected'
      } catch (configError) {
        health.storage.configKVStatus = 'error'
        health.storage.configKVError = configError.message
      }
    } else {
      health.storage.configKVStatus = 'not_bound'
    }

    if (env.CACHE_STORAGE) {
      try {
        await env.CACHE_STORAGE.get('health-check')
        health.storage.cacheKVStatus = 'connected'
      } catch (cacheError) {
        health.storage.cacheKVStatus = 'error'
        health.storage.cacheKVError = cacheError.message
      }
    } else {
      health.storage.cacheKVStatus = 'not_bound'
    }

    // Try to get cache stats
    try {
      const { configService } = initializeServices(env)
      health.config = {
        kvAvailable: configService.isKVAvailable(),
        usingFallback: !configService.isKVAvailable()
      }
    } catch (serviceError) {
      health.config = { 
        error: 'Service initialization failed', 
        message: serviceError.message 
      }
    }

    // Add response time
    health.responseTime = `${Date.now() - startTime}ms`
    
    return new Response(JSON.stringify(health, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('[HEALTH] Health check failed:', error)
    return new Response(JSON.stringify({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// Feeds endpoint - WITH AUTONOMOUS INITIALIZATION
async function handleFeeds(request, env, ctx) {
  const startTime = Date.now()
  
  try {
    const url = new URL(request.url)
    
    // Extract search parameters
    const category = url.searchParams.get('category') || 'all'
    const searchQuery = url.searchParams.get('search') || ''
    const timeframe = url.searchParams.get('timeframe') || 'all'
    const sortBy = url.searchParams.get('sort') || 'newest'
    const limit = Math.min(
      parseInt(url.searchParams.get('limit') || '100'),  // ✅ Change default from 25 to 100
      CACHE_CONFIG.MAX_LIMIT  // Still respect max limit (1000)
    )
    
    Logger.debug('Feed request parameters', { category, searchQuery, timeframe, sortBy, limit })
    
    const { cacheService, rssService } = initializeServices(env)
    
    // Get cached articles using CacheService
    let articles = await cacheService.getCachedArticles()
    
    // AUTO-INITIALIZE if no articles are cached
    if (!articles || articles.length === 0) {
      Logger.info('No cached articles found, triggering autonomous initial load')
      
      // Check if another process is already loading
      const isLocked = await cacheService.isRefreshLocked()
      
      if (!isLocked) {
        // Try background initialization (don't wait for it)
        ctx.waitUntil(
          (async () => {
            try {
              const lockAcquired = await cacheService.acquireRefreshLock()
              if (lockAcquired) {
                Logger.info('Starting background initial load')
                const freshArticles = await rssService.fetchAllFeedsBackground(
                  CACHE_CONFIG.ITEMS_PER_SOURCE,
                  CACHE_CONFIG.MAX_ARTICLES
                )
                
                if (freshArticles && freshArticles.length > 0) {
                  await cacheService.setCachedArticles(freshArticles)
                  await cacheService.setLastScheduledRun()
                  Logger.info(`Background initial load completed: ${freshArticles.length} articles`)
                }
              }
            } catch (bgError) {
              Logger.error('Background initial load failed', bgError)
            } finally {
              await cacheService.releaseRefreshLock()
            }
          })()
        )
      }
      
      // Return empty result with helpful message
      return new Response(JSON.stringify({
        success: true,
        articles: [],
        total: 0,
        filtered: 0,
        category,
        searchQuery,
        timeframe,
        sortBy,
        limit,
        status: 'initializing',
        message: 'System is loading articles. Please check back in a moment.',
        retryAfter: 30,
        timestamp: new Date().toISOString()
      }), {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Retry-After': '30',
          ...CACHE_CONFIG.CACHE_HEADERS
        }
      })
    }

    // Continue with normal filtering logic...
    const originalCount = articles.length
    
    // Apply filters (same as before)
    if (category !== 'all') {
      articles = articles.filter(article => 
        article.category?.toLowerCase() === category.toLowerCase()
      )
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      articles = articles.filter(article => 
        article.title?.toLowerCase().includes(query) ||
        article.description?.toLowerCase().includes(query) ||
        article.source?.toLowerCase().includes(query) ||
        article.content?.toLowerCase().includes(query)
      )
    }
    
    if (timeframe !== 'all') {
      const now = Date.now()
      const timeframes = {
        '1h': 60 * 60 * 1000,
        '6h': 6 * 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000
      }
      
      const cutoff = now - (timeframes[timeframe] || timeframes['24h'])
      articles = articles.filter(article => {
        const feedTime = new Date(article.publishedAt || article.pubDate || article.published).getTime()
        return feedTime >= cutoff
      })
    }
    
    const filteredCount = articles.length
    
    // Sort articles
    articles.sort((a, b) => {
      const dateA = new Date(a.publishedAt || a.pubDate || a.published)
      const dateB = new Date(b.publishedAt || b.pubDate || b.published)
      
      switch (sortBy) {
        case 'oldest': return dateA - dateB
        case 'source': return (a.source || '').localeCompare(b.source || '')
        case 'category': return (a.category || '').localeCompare(b.category || '')
        case 'title': return (a.title || '').localeCompare(b.title || '')
        case 'newest':
        default: return dateB - dateA
      }
    })
    
    // Apply limit
    const limitedArticles = articles.slice(0, limit)
    
    const duration = Date.now() - startTime
    Logger.info('Feed request completed autonomously', { 
      returned: limitedArticles.length, 
      filtered: filteredCount, 
      total: originalCount,
      duration: `${duration}ms`
    })

    return new Response(JSON.stringify({
      success: true,
      articles: limitedArticles,
      total: filteredCount,
      totalCached: originalCount,
      category,
      searchQuery,
      timeframe,
      sortBy,
      limit,
      hasMore: filteredCount > limit,
      status: 'ready',
      autonomous: true,
      filters: {
        category: category !== 'all' ? category : null,
        search: searchQuery.trim() || null,
        timeframe: timeframe !== 'all' ? timeframe : null,
        sort: sortBy !== 'newest' ? sortBy : null
      },
      timestamp: new Date().toISOString()
    }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        ...CACHE_CONFIG.CACHE_HEADERS
      }
    })
  } catch (error) {
    Logger.error('Feeds endpoint failed', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      articles: [],
      total: 0,
      status: 'error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// Config endpoint - USING CONFIGSERVICE
async function handleConfig(request, env) {
  try {
    const url = new URL(request.url)
    const configPath = url.pathname.replace('/api/config/', '')
    const method = request.method

    Logger.debug('Config request', { method, path: configPath })

    const { configService } = initializeServices(env)

    switch (configPath) {
      case 'sources':
        const sources = await configService.getRSSources()
        return new Response(JSON.stringify({
          success: true,
          sources,
          count: sources.length
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      case 'categories':
        const categories = await configService.getCategories()
        return new Response(JSON.stringify({
          success: true,
          categories,
          count: categories.length
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      case 'keywords':
        const keywords = await configService.getCategoryKeywords()
        return new Response(JSON.stringify({
          success: true,
          keywords,
          categories: Object.keys(keywords).length
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      case 'all':
        const [allSources, allCategories, allKeywords] = await Promise.all([
          configService.getRSSources(),
          configService.getCategories(),
          configService.getCategoryKeywords()
        ])
        
        return new Response(JSON.stringify({
          success: true,
          config: {
            sources: allSources,
            categories: allCategories,
            keywords: allKeywords
          },
          counts: {
            sources: allSources.length,
            categories: allCategories.length,
            keywordCategories: Object.keys(allKeywords).length
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      default:
        return new Response(JSON.stringify({
          error: 'Config endpoint not found',
          available_config_endpoints: [
            '/api/config/sources',
            '/api/config/categories',
            '/api/config/keywords',
            '/api/config/all'
          ],
          path: configPath
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
  } catch (error) {
    Logger.error('Config request failed', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// Image proxy with caching - USING CACHESERVICE
async function handleImageProxy(request, env) {
  try {
    const url = new URL(request.url)
    const imageUrl = url.searchParams.get('url')
    const requestedVariant = url.searchParams.get('variant') || url.searchParams.get('size')
    const useCase = url.searchParams.get('use')
    
    if (!imageUrl) {
      return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Validate the URL
    let targetUrl
    try {
      targetUrl = new URL(imageUrl)
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid URL' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Initialize services
    const { cacheService, configService } = initializeServices(env)
    
    // Get trusted domains from ConfigService
    const trustedDomains = await configService.getTrustedImageDomains()
    const isDomainTrusted = trustedDomains.some(domain => 
      targetUrl.hostname === domain || targetUrl.hostname.endsWith('.' + domain)
    )

    if (!isDomainTrusted) {
      Logger.warn('Untrusted image domain', { domain: targetUrl.hostname, url: imageUrl })
      return new Response(JSON.stringify({
        error: 'Image domain not trusted',
        domain: targetUrl.hostname
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Smart variant selection based on use case
    let variant = 'medium'
    
    if (requestedVariant) {
      variant = requestedVariant
    } else if (useCase) {
      const variantMap = {
        'thumbnail': 'thumbnail',
        'avatar': 'thumbnail', 
        'card': 'small',
        'article': 'medium',
        'featured': 'large',
        'hero': 'hero',
        'mobile': 'mobile'
      }
      variant = variantMap[useCase] || 'medium'
    }

    // DEBUG: Check Cloudflare Images configuration
    console.log('🖼️ Images Service Debug:', {
      enabled: env.CLOUDFLARE_IMAGES_ENABLED,
      hasAccountId: !!env.CLOUDFLARE_IMAGES_ACCOUNT_ID,
      hasToken: !!env.CLOUDFLARE_IMAGES_TOKEN,
      accountId: env.CLOUDFLARE_IMAGES_ACCOUNT_ID ? 'Set' : 'Missing',
      token: env.CLOUDFLARE_IMAGES_TOKEN ? 'Set' : 'Missing'
    })

    // If Cloudflare Images is enabled, use the service
    if (env.CLOUDFLARE_IMAGES_ENABLED === 'true' && env.CLOUDFLARE_IMAGES_ACCOUNT_ID) {
      
      // Get the service from initializeServices
      const { imagesService } = initializeServices(env)
      
      console.log('🖼️ Images Service Check:', {
        serviceExists: !!imagesService,
        serviceEnabled: imagesService ? imagesService.isEnabled() : false
      })
      
      // Check if service is properly configured
      if (imagesService && imagesService.isEnabled()) {
        Logger.info('Cloudflare Images service is enabled and ready', {
          variant,
          imageUrl
        })
        
        // Generate a consistent image ID from the URL
        const imageId = btoa(imageUrl).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32)
        
        // Try to get from Cloudflare Images first
        const cfImagesUrl = await imagesService.getImageUrl(imageId, variant)
        
        try {
          const cfResponse = await fetch(cfImagesUrl)
          if (cfResponse.ok) {
            Logger.debug('Serving from Cloudflare Images', { imageId, variant })
            return new Response(cfResponse.body, {
              headers: {
                ...corsHeaders,
                'Content-Type': cfResponse.headers.get('Content-Type') || 'image/jpeg',
                'Cache-Control': 'public, max-age=31536000, immutable'
              }
            })
          }
        } catch (e) {
          Logger.debug('Image not in CF Images, will upload', { imageId })
        }
        
        // If not in CF Images, fetch and upload it using the service
        try {
          const originalResponse = await fetch(imageUrl, {
            headers: {
              'User-Agent': 'Harare Metro News Aggregator/1.0',
              'Accept': 'image/*',
              'Referer': targetUrl.origin
            }
          })
          
          if (originalResponse.ok && originalResponse.headers.get('Content-Type')?.startsWith('image/')) {
            const imageData = await originalResponse.arrayBuffer()
            
            // Upload using CloudflareImagesService
            const uploadResult = await imagesService.uploadImage(
              imageData, 
              `image-${imageId}`, 
              {
                originalUrl: imageUrl,
                uploadedAt: new Date().toISOString(),
                source: 'harare-metro-proxy',
                variant: variant
              }
            )
            
            if (uploadResult.success) {
              Logger.info('Uploaded to Cloudflare Images via service', { 
                imageId, 
                variant, 
                originalUrl: imageUrl 
              })
              
              // Return the requested variant
              const variantUrl = await imagesService.getImageUrl(uploadResult.imageId, variant)
              const variantResponse = await fetch(variantUrl)
              
              if (variantResponse.ok) {
                return new Response(variantResponse.body, {
                  headers: {
                    ...corsHeaders,
                    'Content-Type': variantResponse.headers.get('Content-Type') || 'image/jpeg',
                    'Cache-Control': 'public, max-age=31536000, immutable'
                  }
                })
              }
            } else {
              Logger.warn('Failed to upload to Cloudflare Images', { 
                error: uploadResult.error,
                imageId 
              })
            }
          }
        } catch (uploadError) {
          Logger.warn('Error uploading to Cloudflare Images', { 
            error: uploadError.message,
            imageId 
          })
        }
      } else {
        Logger.warn('Cloudflare Images service not ready', {
          reason: 'Service not enabled or missing credentials',
          hasService: !!imagesService,
          isEnabled: imagesService ? imagesService.isEnabled() : false
        })
      }
    } else {
      Logger.info('Cloudflare Images not configured', {
        enabled: env.CLOUDFLARE_IMAGES_ENABLED,
        hasAccountId: !!env.CLOUDFLARE_IMAGES_ACCOUNT_ID,
        reason: 'Environment variables not set or disabled'
      })
    }

    // Fallback to regular proxy
    Logger.debug('Using simple proxy fallback', { url: imageUrl, variant })

    // Fetch original image
    const imageResponse = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Harare Metro News Aggregator/1.0',
        'Accept': 'image/*',
        'Referer': targetUrl.origin
      }
    })

    if (!imageResponse.ok) {
      Logger.warn('Image fetch failed', { url: imageUrl, status: imageResponse.status })
      return new Response(JSON.stringify({
        error: 'Failed to fetch image',
        status: imageResponse.status
      }), {
        status: imageResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const contentType = imageResponse.headers.get('Content-Type') || 'image/jpeg'
    
    if (!contentType.startsWith('image/')) {
      return new Response(JSON.stringify({
        error: 'URL does not point to an image'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    Logger.debug('Image proxied successfully', { 
      url: imageUrl, 
      variant, 
      contentType 
    })

    return new Response(imageResponse.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400'
      }
    })

  } catch (error) {
    Logger.error('Image proxy failed', error)
    return new Response(JSON.stringify({
      error: 'Image proxy failed',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// Analytics tracking endpoint - USING ANALYTICSENGINESERVICE
async function handleAnalytics(request, env) {
  try {
    const url = new URL(request.url)
    const analyticsPath = url.pathname.replace('/api/analytics/', '')
    const method = request.method

    Logger.debug('Analytics request', { method, path: analyticsPath })

    const { analyticsService } = initializeServices(env)

    switch (analyticsPath) {
      case 'track':
        if (method !== 'POST') {
          return new Response(JSON.stringify({
            error: 'Method not allowed. Use POST.'
          }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        const body = await request.json()
        const { eventType, data, timestamp } = body

        // Extract common data from request
        const commonData = {
          userAgent: request.headers.get('User-Agent'),
          country: request.headers.get('CF-IPCountry'),
          userId: request.headers.get('X-User-ID'),
          timestamp: timestamp || Date.now(),
          ...data
        }

        let result
        switch (eventType) {
          case 'article_view':
            result = await analyticsService.trackArticleView(commonData)
            break
          case 'search':
            result = await analyticsService.trackSearch(commonData)
            break
          case 'category_click':
            result = await analyticsService.trackCategoryClick(commonData)
            break
          case 'user_interaction':
            result = await analyticsService.trackUserInteraction(commonData)
            break
          case 'page_view':
            result = await analyticsService.trackPageView(commonData)
            break
          case 'performance':
            result = await analyticsService.trackPerformance(commonData)
            break
          case 'error':
            result = await analyticsService.trackError(commonData)
            break
          default:
            return new Response(JSON.stringify({
              success: false,
              error: 'Unknown event type',
              supportedEvents: [
                'article_view', 'search', 'category_click', 
                'user_interaction', 'page_view', 'performance', 'error'
              ]
            }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        Logger.debug('Analytics event tracked', { eventType, success: result.success })

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      case 'status':
        const summary = analyticsService.getAnalyticsSummary()
        return new Response(JSON.stringify({
          success: true,
          analytics: summary
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      default:
        return new Response(JSON.stringify({
          error: 'Analytics endpoint not found',
          available_analytics_endpoints: [
            '/api/analytics/track (POST)',
            '/api/analytics/status'
          ],
          path: analyticsPath
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
  } catch (error) {
    Logger.error('Analytics request failed', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// Analytics tracking - USING YOUR 3 DATASETS (CORRECT BINDINGS)
async function handleAnalyticsTrack(request, env) {
  try {
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Method not allowed'
      }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const body = await request.text()
    if (!body) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Empty request body'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    let data
    try {
      data = JSON.parse(body)
    } catch (parseError) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid JSON in request body'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const timestamp = Date.now()
    let success = false
    let tableName = ''

    // Route events to your 3 correct datasets
    try {
      switch (data.eventType) {
        // USER INTERACTIONS -> NEWS_INTERACTIONS
        case 'user_interaction':
        case 'article_click':
        case 'article_view':
        case 'infinite_scroll':
        case 'page_view':
        case 'refresh_triggered':
          if (env.NEWS_INTERACTIONS) {
            await env.NEWS_INTERACTIONS.writeDataPoint({
              blobs: [
                data.eventType,                        // Event type
                data.data?.type || data.eventType,     // Interaction type
                data.data?.articleId || data.data?.page || '',  // Article/page ID
                data.userId || 'anonymous'             // User ID
              ],
              doubles: [
                timestamp,                             // Timestamp
                data.data?.state ? 1 : 0,             // State/count
                data.data?.scrollPosition || 0        // Position/value
              ],
              indexes: [
                data.data?.source || data.data?.category || 'general',  // Source/category
                data.eventType,                        // Event type index
                data.userId || 'anonymous'             // User index
              ]
            })
            success = true
            tableName = 'news_interactions'
          }
          break

        // CATEGORY INTERACTIONS -> CATEGORY_CLICKS
        case 'category_click':
        case 'category_view':
        case 'filter_change':
          if (env.CATEGORY_CLICKS) {
            await env.CATEGORY_CLICKS.writeDataPoint({
              blobs: [
                data.data?.category || 'unknown',     // Category name
                data.eventType,                       // Event type
                data.data?.source || 'filter',        // Click source
                data.userId || 'anonymous'            // User ID
              ],
              doubles: [
                timestamp,                            // Timestamp
                1,                                    // Click count
                data.data?.resultCount || 0          // Results after filter
              ],
              indexes: [
                data.data?.category || 'unknown',     // Category index
                data.eventType,                       // Event type index
                data.userId || 'anonymous'            // User index
              ]
            })
            success = true
            tableName = 'category_clicks'
          }
          break

        // SEARCH & FEED ANALYTICS -> SEARCH_QUERIES
        case 'feed_analytics':
        case 'search_performed':
        case 'search_query':
        case 'feed_load':
        case 'feed_refresh':
        case 'error_occurred':
          if (env.SEARCH_QUERIES) {
            await env.SEARCH_QUERIES.writeDataPoint({
              blobs: [
                data.eventType,                                    // Event type
                data.data?.searchQuery || data.data?.errorType || '', // Query or error
                data.data?.selectedCategory || 'all',             // Category
                data.userId || 'anonymous'                        // User ID
              ],
              doubles: [
                timestamp,                                         // Timestamp
                data.data?.resultCount || 0,                     // Result count
                data.data?.loadTime || data.data?.duration || 0  // Performance metric
              ],
              indexes: [
                data.data?.selectedCategory || 'all',             // Category index
                data.eventType,                                   // Event type index
                data.userId || 'anonymous'                       // User index
              ]
            })
            success = true
            tableName = 'search_queries'
          }
          break

        default:
          // Unknown events go to news_interactions as fallback
          if (env.NEWS_INTERACTIONS) {
            await env.NEWS_INTERACTIONS.writeDataPoint({
              blobs: [
                data.eventType || 'unknown',
                'unknown_event',
                JSON.stringify(data.data || {}).substring(0, 100),
                data.userId || 'anonymous'
              ],
              doubles: [timestamp, 1, 0],
              indexes: ['unknown', data.eventType || 'unknown', data.userId || 'anonymous']
            })
            success = true
            tableName = 'news_interactions'
          }
      }

      if (success) {
        console.log(`📊 Analytics: ${data.eventType} -> ${tableName}`)
      } else {
        console.log(`📊 Analytics binding not available for ${data.eventType}`)
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Analytics event tracked',
        eventType: data.eventType,
        table: tableName,
        timestamp: timestamp
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })

    } catch (analyticsError) {
      console.error('Analytics write failed:', analyticsError)
      return new Response(JSON.stringify({
        success: false,
        error: 'Analytics write failed',
        details: analyticsError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

  } catch (error) {
    console.error('Analytics tracking error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// User data endpoint - USING D1USERSERVICE
async function handleUser(request, env) {
  try {
    const url = new URL(request.url)
    const userPath = url.pathname.replace('/api/user/', '')
    const method = request.method
    const userId = request.headers.get('X-User-ID')

    Logger.debug('User request', { method, path: userPath, userId })

    const { userService } = initializeServices(env)

    if (!userService) {
      Logger.warn('User service not available - D1 database not configured')
      return new Response(JSON.stringify({
        success: false,
        error: 'User service not available (D1 database not configured)'
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!userId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing X-User-ID header'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    switch (userPath) {
      case 'profile':
        if (method === 'GET') {
          const user = await userService.getUser(userId)
          return new Response(JSON.stringify({
            success: true,
            user
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        break

      case 'likes':
        if (method === 'GET') {
          const likes = await userService.getUserLikes(userId)
          return new Response(JSON.stringify({
            success: true,
            likes
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        } else if (method === 'POST') {
          const { article } = await request.json()
          const result = await userService.addUserLike(userId, article)  // Updated method name
          Logger.debug('Article liked', { userId, articleId: article.id || article.link })
          return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        break

      case 'bookmarks':
        if (method === 'GET') {
          const bookmarks = await userService.getUserBookmarks(userId)
          return new Response(JSON.stringify({
            success: true,
            bookmarks
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        } else if (method === 'POST') {
          const { article } = await request.json()
          const result = await userService.addUserBookmark(userId, article)  // Updated method name
          Logger.debug('Article bookmarked', { userId, articleId: article.id || article.link })
          return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        break

      default:
        // Handle DELETE for specific likes/bookmarks
        if (userPath.startsWith('likes/') && method === 'DELETE') {
          const articleId = decodeURIComponent(userPath.replace('likes/', ''))
          const result = await userService.removeUserLike(userId, articleId)  // Updated method name
          Logger.debug('Article unliked', { userId, articleId })
          return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        
        if (userPath.startsWith('bookmarks/') && method === 'DELETE') {
          const articleId = decodeURIComponent(userPath.replace('bookmarks/', ''))
          const result = await userService.removeUserBookmark(userId, articleId)  // Updated method name
          Logger.debug('Bookmark removed', { userId, articleId })
          return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        return new Response(JSON.stringify({
          error: 'User endpoint not found',
          available_user_endpoints: [
            '/api/user/profile',
            '/api/user/likes',
            '/api/user/bookmarks'
          ],
          path: userPath
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
  } catch (error) {
    Logger.error('User request failed', error, { path: request.url })
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}