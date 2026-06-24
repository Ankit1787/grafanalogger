<template>
  <div class="observability-container">
    <header class="app-header">
      <div class="logo-area">
        <span class="logo-icon">📊</span>
        <h1>Grafana Faro + Nuxt Observability</h1>
      </div>
      <p class="subtitle">Production-Ready Logging & Exception Tracking for Nuxt 4 & Grafana Cloud</p>
    </header>

    <main class="dashboard">
      <!-- Status Card -->
      <section class="status-card" :class="{ 'configured': isConfigured, 'not-configured': !isConfigured }">
        <div class="status-header">
          <h2>Collector Configuration Status</h2>
          <span class="status-badge">{{ isConfigured ? 'Connected / Configured' : 'Missing URL Configuration' }}</span>
        </div>
        <p class="status-desc" v-if="isConfigured">
          Faro Web SDK is initialized and routing logs/exceptions directly to your Grafana Cloud receiver:
          <code class="url-code">{{ faroUrl }}</code>
        </p>
        <p class="status-desc warning" v-else>
          Grafana Faro Collector URL is currently empty. Please configure <code>NUXT_PUBLIC_FARO_URL</code> in your <code>.env</code> file.
          The application will fall back to local console reporting.
        </p>
      </section>

      <!-- Grid Panel -->
      <div class="panel-grid">
        <!-- Frontend Client Observability Card -->
        <div class="control-card">
          <div class="card-icon">💻</div>
          <h3>Client-Side Observability (Faro SDK)</h3>
          <p class="card-description">Trigger telemetry events directly from the browser context.</p>
          <div class="button-group">
            <button @click="triggerClientLog('info')" class="btn btn-info">
              Emit Client Info Log
            </button>
            <button @click="triggerClientLog('warn')" class="btn btn-warn">
              Emit Client Warn Log
            </button>
            <button @click="triggerClientCaughtError" class="btn btn-error-caught">
              Log Caught Exception
            </button>
            <button @click="triggerClientUncaughtError" class="btn btn-error-uncaught">
              Trigger Uncaught Exception
            </button>
          </div>
        </div>

        <!-- Server-Side Observability Card -->
        <div class="control-card">
          <div class="card-icon">🖥️</div>
          <h3>Server-Side Observability (Nitro API)</h3>
          <p class="card-description">Trigger logs and unhandled exceptions within server routes and Nitro handler hooks.</p>
          <div class="button-group">
            <button @click="triggerServerLog" class="btn btn-server-log">
              Trigger Server Info Log
            </button>
            <button @click="triggerServerException" class="btn btn-server-error">
              Trigger Server Exception
            </button>
          </div>
        </div>
      </div>

      <!-- Action Log Output -->
      <section class="log-console">
        <h3>Live Event Monitor</h3>
        <div class="console-box" ref="consoleBox">
          <div v-if="consoleLogs.length === 0" class="empty-log">
            No events triggered yet. Click one of the buttons above to test logging.
          </div>
          <div v-for="(log, idx) in consoleLogs" :key="idx" class="console-line" :class="log.type">
            <span class="time">{{ log.time }}</span>
            <span class="badge">{{ log.type.toUpperCase() }}</span>
            <span class="msg">{{ log.message }}</span>
          </div>
        </div>
      </section>
    </main>

    <footer class="app-footer">
      <p>Nuxt 4 + Grafana Faro Web SDK Integration • Production Ready</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'

const config = useRuntimeConfig()
const faroUrl = config.public.faroUrl
const isConfigured = computed(() => !!faroUrl)

const consoleLogs = ref([])
const consoleBox = ref(null)

const addLocalLog = (type, message) => {
  const time = new Date().toLocaleTimeString()
  consoleLogs.value.push({ time, type, message })
  
  // Auto scroll
  nextTick(() => {
    if (consoleBox.value) {
      consoleBox.value.scrollTop = consoleBox.value.scrollHeight
    }
  })
}

// Client Side Actions
const triggerClientLog = (level) => {
  const logger = useAppLogger()
  const msg = `User triggered a client-side ${level} log.`
  
  if (level === 'info') {
    logger.info(msg, { clickSource: 'dashboard-btn' })
    addLocalLog('info', `[Client] Pushed info log to Faro`)
  } else if (level === 'warn') {
    logger.warn(msg, { clickSource: 'dashboard-btn' })
    addLocalLog('warn', `[Client] Pushed warning log to Faro`)
  }
}

const triggerClientCaughtError = () => {
  const logger = useAppLogger()
  try {
    throw new Error('This is a CAUGHT client error representing a handled exception.')
  } catch (error) {
    logger.exception(error, { route: '/dashboard', section: 'CaughtErrorButton' })
    addLocalLog('error', `[Client] Caught error logged manually to Faro: "${error.message}"`)
  }
}

const triggerClientUncaughtError = () => {
  addLocalLog('error', `[Client] Triggering uncaught error! Check browser console & Faro exceptions.`)
  // Deliberately reference an undefined variable to cause an unhandled Vue Exception
  const undefinedObject = undefined
  undefinedObject.triggerCrash()
}

// Server Side Actions
const triggerServerLog = async () => {
  addLocalLog('info', `[Server] Triggering server-side log via /api/test-error...`)
  try {
    const res = await $fetch('/api/test-error?type=log')
    addLocalLog('success', `[Server Response] ${res.message}`)
  } catch (err) {
    addLocalLog('error', `[Server Error] Failed to contact server route: ${err.message}`)
  }
}

const triggerServerException = async () => {
  addLocalLog('warn', `[Server] Triggering server-side 500 error via /api/test-error...`)
  try {
    await $fetch('/api/test-error?type=exception')
  } catch (err) {
    addLocalLog('error', `[Server Response 500] Unhandled server exception captured! Check server console & Faro logs.`)
  }
}
</script>

<style>
/* Global aesthetics and Reset */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background-color: #0f111a;
  color: #e2e8f0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  min-height: 100vh;
}
</style>

<style scoped>
.observability-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  text-align: center;
  margin-bottom: 2.5rem;
  border-bottom: 1px solid #1e293b;
  padding-bottom: 1.5rem;
}

.logo-area {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.logo-icon {
  font-size: 2.5rem;
}

.app-header h1 {
  font-size: 2.25rem;
  font-weight: 800;
  background: linear-gradient(135deg, #ff7e5f, #feb47b, #38bdf8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  color: #94a3b8;
  font-size: 1.1rem;
}

/* Status Card */
.status-card {
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid #1e293b;
  transition: all 0.3s ease;
  background: rgba(30, 41, 59, 0.2);
  backdrop-filter: blur(10px);
}

.status-card.configured {
  border-left: 5px solid #10b981;
  background: linear-gradient(to right, rgba(16, 185, 129, 0.05), rgba(30, 41, 59, 0.1));
}

.status-card.not-configured {
  border-left: 5px solid #f59e0b;
  background: linear-gradient(to right, rgba(245, 158, 11, 0.05), rgba(30, 41, 59, 0.1));
}

.status-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.status-header h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #f8fafc;
}

.status-badge {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  letter-spacing: 0.05em;
}

.configured .status-badge {
  background-color: rgba(16, 185, 129, 0.2);
  color: #34d399;
}

.not-configured .status-badge {
  background-color: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
}

.status-desc {
  color: #cbd5e1;
  font-size: 0.95rem;
  line-height: 1.5;
}

.url-code {
  display: inline-block;
  background: #1e293b;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-family: monospace;
  color: #38bdf8;
  font-size: 0.9rem;
  margin-top: 0.25rem;
  word-break: break-all;
}

.warning code {
  color: #fbbf24;
}

/* Panel Grid */
.panel-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
  margin-bottom: 2.5rem;
}

.control-card {
  background: #131722;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 2rem;
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.control-card:hover {
  transform: translateY(-2px);
  border-color: #38bdf8;
}

.card-icon {
  font-size: 2.25rem;
  margin-bottom: 1rem;
}

.control-card h3 {
  font-size: 1.35rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #f8fafc;
}

.card-description {
  color: #94a3b8;
  font-size: 0.95rem;
  margin-bottom: 1.5rem;
  min-height: 2.75rem;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

/* Premium Buttons */
.btn {
  width: 100%;
  padding: 0.85rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  text-align: center;
  color: #ffffff;
}

.btn-info {
  background: linear-gradient(135deg, #0ea5e9, #0284c7);
  box-shadow: 0 4px 10px rgba(14, 165, 233, 0.25);
}
.btn-info:hover {
  filter: brightness(1.15);
  box-shadow: 0 4px 15px rgba(14, 165, 233, 0.4);
}

.btn-warn {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  box-shadow: 0 4px 10px rgba(245, 158, 11, 0.25);
}
.btn-warn:hover {
  filter: brightness(1.15);
  box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);
}

.btn-error-caught {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  box-shadow: 0 4px 10px rgba(139, 92, 246, 0.25);
}
.btn-error-caught:hover {
  filter: brightness(1.15);
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
}

.btn-error-uncaught {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  box-shadow: 0 4px 10px rgba(239, 68, 68, 0.25);
}
.btn-error-uncaught:hover {
  filter: brightness(1.15);
  box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
}

.btn-server-log {
  background: linear-gradient(135deg, #06b6d4, #0891b2);
  box-shadow: 0 4px 10px rgba(6, 182, 212, 0.25);
}
.btn-server-log:hover {
  filter: brightness(1.15);
  box-shadow: 0 4px 15px rgba(6, 182, 212, 0.4);
}

.btn-server-error {
  background: linear-gradient(135deg, #ec4899, #db2777);
  box-shadow: 0 4px 10px rgba(236, 72, 153, 0.25);
}
.btn-server-error:hover {
  filter: brightness(1.15);
  box-shadow: 0 4px 15px rgba(236, 72, 153, 0.4);
}

/* Console Observability Log */
.log-console {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 1.5rem;
}

.log-console h3 {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: #f8fafc;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.log-console h3::before {
  content: "";
  display: inline-block;
  width: 8px;
  height: 8px;
  background-color: #10b981;
  border-radius: 50%;
  box-shadow: 0 0 8px #10b981;
}

.console-box {
  background: #020617;
  border: 1px solid #0f172a;
  border-radius: 6px;
  padding: 1rem;
  height: 200px;
  overflow-y: auto;
  font-family: monospace;
  font-size: 0.875rem;
}

.empty-log {
  color: #475569;
  text-align: center;
  padding-top: 4.5rem;
}

.console-line {
  margin-bottom: 0.5rem;
  line-height: 1.4;
  word-break: break-all;
}

.console-line .time {
  color: #64748b;
  margin-right: 0.75rem;
}

.console-line .badge {
  font-size: 0.7rem;
  font-weight: bold;
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  margin-right: 0.75rem;
  display: inline-block;
  min-width: 60px;
  text-align: center;
}

.console-line.info .badge {
  background-color: rgba(14, 165, 233, 0.2);
  color: #38bdf8;
}

.console-line.warn .badge {
  background-color: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
}

.console-line.error .badge {
  background-color: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.console-line.success .badge {
  background-color: rgba(16, 185, 129, 0.2);
  color: #34d399;
}

.console-line.success .msg {
  color: #34d399;
}

.console-line.error .msg {
  color: #f87171;
}

/* Footer */
.app-footer {
  text-align: center;
  margin-top: auto;
  padding-top: 3rem;
  color: #475569;
  font-size: 0.85rem;
}
</style>
