/**
 * AI Plugin System — Extensible architecture for integrating AI capabilities.
 *
 * This system provides a plugin-based approach to adding AI features:
 * - Event classification & categorization
 * - Anomaly detection in satellite/aircraft patterns
 * - Predictive analysis for conflict escalation
 * - Natural language querying of intelligence data
 * - Automated report summarization
 * - Image/satellite imagery analysis
 *
 * Plugins can be local (running in-browser) or remote (API-based).
 */

import type {
  AIPluginConfig,
  AIAnalysisRequest,
  AIAnalysisResponse,
  AICapability,
} from "@/types";

// ============================================================================
// Plugin Registry
// ============================================================================

class AIPluginRegistry {
  private plugins: Map<string, AIPlugin> = new Map();

  register(plugin: AIPlugin): void {
    this.plugins.set(plugin.config.id, plugin);
    console.log(`[AI] Registered plugin: ${plugin.config.name} v${plugin.config.version}`);
  }

  unregister(pluginId: string): void {
    this.plugins.delete(pluginId);
  }

  getPlugin(pluginId: string): AIPlugin | undefined {
    return this.plugins.get(pluginId);
  }

  getPluginsForCapability(capability: AICapability): AIPlugin[] {
    return Array.from(this.plugins.values()).filter(
      (p) => p.config.enabled && p.config.capabilities.includes(capability)
    );
  }

  async analyze(request: AIAnalysisRequest): Promise<AIAnalysisResponse | null> {
    const plugins = this.getPluginsForCapability(request.type);
    if (plugins.length === 0) return null;

    const plugin = plugins[0]; // Use first available plugin
    const startTime = Date.now();

    try {
      const result = await plugin.process(request);
      return {
        requestId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: request.type,
        result,
        confidence: 0.5, // Default confidence
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error(`[AI] Plugin ${plugin.config.name} failed:`, error);
      return null;
    }
  }

  listPlugins(): AIPluginConfig[] {
    return Array.from(this.plugins.values()).map((p) => p.config);
  }
}

// ============================================================================
// Plugin Interface
// ============================================================================

export abstract class AIPlugin {
  constructor(public config: AIPluginConfig) {}

  abstract process(request: AIAnalysisRequest): Promise<unknown>;

  abstract initialize(): Promise<void>;

  abstract dispose(): void;
}

// ============================================================================
// Built-in Rule-Based Analysis Plugin (no external AI needed)
// ============================================================================

export class RuleBasedAnalysisPlugin extends AIPlugin {
  constructor() {
    super({
      id: "rule-based-analysis",
      name: "Rule-Based Analysis Engine",
      version: "1.0.0",
      capabilities: [
        "event_classification",
        "anomaly_detection",
        "correlation_analysis",
      ],
      enabled: true,
    });
  }

  async initialize(): Promise<void> {
    console.log("[AI] Rule-based analysis engine initialized");
  }

  async process(request: AIAnalysisRequest): Promise<unknown> {
    switch (request.type) {
      case "event_classification":
        return this.classifyEvent(request.data);
      case "anomaly_detection":
        return this.detectAnomalies(request.data);
      case "correlation_analysis":
        return this.analyzeCorrelations(request.data);
      default:
        return { error: "Unsupported analysis type" };
    }
  }

  private classifyEvent(data: unknown): Record<string, unknown> {
    const event = data as Record<string, unknown>;
    const text = ((event.title as string) || "").toLowerCase();

    const categories = [];
    if (text.match(/military|troops|army|defense|weapon|missile/))
      categories.push("military_movement");
    if (text.match(/election|coup|protest|political|government/))
      categories.push("political_instability");
    if (text.match(/economy|inflation|recession|gdp|trade/))
      categories.push("economic_crisis");
    if (text.match(/humanitarian|refugee|famine|aid/))
      categories.push("humanitarian_crisis");
    if (text.match(/earthquake|flood|hurricane|wildfire|tsunami/))
      categories.push("natural_disaster");
    if (text.match(/cyber|hack|breach|ransomware/))
      categories.push("cyber_threat");

    return {
      categories: categories.length > 0 ? categories : ["unclassified"],
      confidence: categories.length > 0 ? 0.7 : 0.3,
    };
  }

  private detectAnomalies(data: unknown): Record<string, unknown> {
    const items = data as Array<Record<string, number>>;
    if (!Array.isArray(items) || items.length < 3)
      return { anomalies: [], message: "Insufficient data" };

    // Simple z-score anomaly detection
    const values = items.map((i) => i.value || 0);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const std = Math.sqrt(
      values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length
    );

    const anomalies = items.filter((item, idx) => {
      const zScore = std > 0 ? Math.abs((values[idx] - mean) / std) : 0;
      return zScore > 2;
    });

    return { anomalies, threshold: 2, mean, std };
  }

  private analyzeCorrelations(data: unknown): Record<string, unknown> {
    return {
      message: "Use the built-in correlation engine for comprehensive analysis",
      recommendation: "See lib/api/correlation.ts",
    };
  }

  dispose(): void {
    console.log("[AI] Rule-based analysis engine disposed");
  }
}

// ============================================================================
// Remote AI Plugin Template (for future LLM integration)
// ============================================================================

export class RemoteAIPlugin extends AIPlugin {
  constructor(
    id: string,
    name: string,
    endpoint: string,
    capabilities: AICapability[]
  ) {
    super({
      id,
      name,
      version: "1.0.0",
      capabilities,
      endpoint,
      enabled: false, // Disabled by default until configured
    });
  }

  async initialize(): Promise<void> {
    if (!this.config.endpoint) {
      throw new Error("Remote AI plugin requires an endpoint URL");
    }
    // Verify endpoint connectivity
    try {
      const resp = await fetch(`${this.config.endpoint}/health`);
      if (resp.ok) {
        this.config.enabled = true;
        console.log(`[AI] Connected to remote AI: ${this.config.name}`);
      }
    } catch {
      console.warn(`[AI] Could not connect to ${this.config.name}`);
    }
  }

  async process(request: AIAnalysisRequest): Promise<unknown> {
    if (!this.config.endpoint || !this.config.enabled) {
      throw new Error("Remote AI plugin not configured or not connected");
    }

    const resp = await fetch(`${this.config.endpoint}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    if (!resp.ok) {
      throw new Error(`Remote AI returned ${resp.status}`);
    }

    return resp.json();
  }

  dispose(): void {
    this.config.enabled = false;
  }
}

// ============================================================================
// Singleton Registry Instance
// ============================================================================

export const aiRegistry = new AIPluginRegistry();

// Auto-register built-in plugins
aiRegistry.register(new RuleBasedAnalysisPlugin());
