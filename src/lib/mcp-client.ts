/**
 * Confluence MCP (Model Context Protocol) Client Helper
 * Ready to connect to Confluence MCP server to search knowledge base
 * and feed context into AI recommendation prompts.
 */

export interface ConfluenceSearchResult {
  title: string;
  url: string;
  snippet: string;
  score?: number;
}

export interface RecommendationResponse {
  summary: string;
  suggestedAction?: string;
  confluencePages: ConfluenceSearchResult[];
  confidence: number;
}

export class ConfluenceMcpService {
  private mcpServerUrl: string | null;
  private isConfigured: boolean;

  constructor() {
    this.mcpServerUrl = process.env.CONFLUENCE_MCP_SERVER_URL || null;
    this.isConfigured = Boolean(this.mcpServerUrl);
  }

  /**
   * Check if Confluence MCP server integration is configured
   */
  public hasMcpConfig(): boolean {
    return this.isConfigured;
  }

  /**
   * Search knowledge base in Confluence via MCP
   * If MCP server is not yet hooked up, provides intelligent fallback recommendations
   */
  public async getRecommendationsForTask(task: {
    title: string;
    description?: string | null;
    projectKey?: string;
  }): Promise<RecommendationResponse> {
    if (this.isConfigured && this.mcpServerUrl) {
      try {
        // When MCP server is active, query the MCP JSON-RPC endpoint
        const response = await fetch(`${this.mcpServerUrl}/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tool: "confluence_search",
            query: `${task.title} ${task.description || ""}`.trim(),
          }),
        });

        if (response.ok) {
          const data = await response.json();
          return {
            summary: data.summary || "Рекомендація на основі Confluence:",
            suggestedAction: data.suggestedAction,
            confluencePages: data.pages || [],
            confidence: data.confidence || 0.85,
          };
        }
      } catch (err) {
        console.warn("MCP Confluence fetch failed, falling back to heuristic:", err);
      }
    }

    // Heuristic / Mock fallback for preview before live Confluence MCP is plugged in
    return {
      summary: `Аналіз задачі "${task.title}": Рекомендовано перевірити внутрішній регламент та переконатися у відповідності критеріям прийомки (Acceptance Criteria).`,
      suggestedAction: "Додати чек-лист підзадач та перевірити пов'язані регламенти у Confluence.",
      confluencePages: [
        {
          title: "Загальні регламенти виконання завдань (SOP)",
          url: "https://confluence.example.com/display/DEV/SOP+Task+Guidelines",
          snippet: "Стандартний чек-лист перевірки перед переведенням у Done...",
          score: 0.92,
        },
      ],
      confidence: 0.8,
    };
  }
}

export const confluenceMcpService = new ConfluenceMcpService();
