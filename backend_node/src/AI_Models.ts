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
        if (!modelName) {
            return process.env.GOOGLE_API_KEY || "";
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
        return process.env.GOOGLE_API_KEY || "";
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
        if (modelName.toLowerCase().includes("openrouter") || modelName.includes("/")) return "OpenRouter";
        return "Google";
    }

    listModels(): Array<Record<string, any>> {
        return this.modelsData;
    }
}
