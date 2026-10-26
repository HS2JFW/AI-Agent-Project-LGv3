export class AIModels {
    public modelsData: Array<Record<string, any>>;

    constructor(modelsData?: Array<Record<string, any>>) {
        this.modelsData = modelsData || [];
    }

    addModel(provider: string, modelName: string, apiKey: string, label: string = ""): void {
        this.modelsData.push({
            provider,
            modelName,
            apiKey,
            label: label || `${provider} - ${modelName}`
        });
    }

    removeModel(modelName: string): void {
        this.modelsData = this.modelsData.filter(m => 
            m.modelName !== modelName && m.label !== modelName && m.id !== modelName
        );
    }

    getApiKey(modelName: string): string {
        const defaultFallbackKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || "";
        if (!modelName) {
            return defaultFallbackKey;
        }
        for (const m of this.modelsData) {
            if (m.modelName === modelName || m.label === modelName || m.id === modelName) {
                const key = (m.apiKey || "").trim();
                if (key) return key;
            }
        }
        for (const m of this.modelsData) {
            const mName = m.modelName || "";
            if (mName && (modelName.includes(mName) || mName.includes(modelName))) {
                const key = (m.apiKey || "").trim();
                if (key) return key;
            }
        }
        // If modelName has slash (e.g. google/gemini-3.5-flash), check stripped name
        const cleanName = modelName.includes("/") ? (modelName.split("/").pop() || "") : "";
        if (cleanName) {
            for (const m of this.modelsData) {
                if (m.modelName === cleanName || m.label === cleanName || m.id === cleanName) {
                    const key = (m.apiKey || "").trim();
                    if (key) return key;
                }
            }
            for (const m of this.modelsData) {
                const mName = m.modelName || "";
                if (mName && (cleanName.includes(mName) || mName.includes(cleanName))) {
                    const key = (m.apiKey || "").trim();
                    if (key) return key;
                }
            }
        }
        // Fallback: Check if any Google / Gemini key exists in modelsData
        for (const m of this.modelsData) {
            if (m.provider === "Google" || (m.modelName && m.modelName.toLowerCase().includes("gemini")) || (m.apiKey && m.apiKey.startsWith("AQ."))) {
                const key = (m.apiKey || "").trim();
                if (key) return key;
            }
        }
        return defaultFallbackKey;
    }

    get_api_key(modelName: string): string {
        return this.getApiKey(modelName);
    }

    getModelInfo(modelName: string): Record<string, any> {
        for (const m of this.modelsData) {
            if (m.modelName === modelName || m.label === modelName || m.id === modelName) {
                return m;
            }
        }
        for (const m of this.modelsData) {
            const mName = m.modelName || "";
            if (mName && (modelName.includes(mName) || mName.includes(modelName))) {
                return m;
            }
        }
        const cleanName = modelName.includes("/") ? (modelName.split("/").pop() || "") : "";
        if (cleanName) {
            for (const m of this.modelsData) {
                if (m.modelName === cleanName || m.label === cleanName || m.id === cleanName) {
                    return m;
                }
            }
        }
        return {};
    }

    getMaxTokens(modelName: string, fallback: number = 16384): number {
        const info = this.getModelInfo(modelName);
        const val = info.maxTokens || info.max_tokens || info.maxOutputTokens;
        if (val !== undefined && val !== null && !isNaN(Number(val)) && Number(val) > 0) {
            return Number(val);
        }
        return fallback;
    }

    getContextWindow(modelName: string, fallback: number = 128000): number {
        const info = this.getModelInfo(modelName);
        const val = info.contextWindow || info.context_window;
        if (val !== undefined && val !== null && !isNaN(Number(val)) && Number(val) > 0) {
            return Number(val);
        }
        return fallback;
    }

    getProvider(modelName: string): string {
        const info = this.getModelInfo(modelName);
        if (info.provider) return info.provider;
        if (modelName.toLowerCase().includes("openrouter")) return "OpenRouter";
        if (modelName.startsWith("google/")) return "Google";
        if (modelName.includes("/")) return "OpenRouter";
        return "Google";
    }

    listModels(): Array<Record<string, any>> {
        return this.modelsData;
    }
}
