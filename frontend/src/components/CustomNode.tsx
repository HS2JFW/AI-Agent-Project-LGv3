import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { 
  Mail, 
  MessageSquare, 
  Database, 
  Globe, 
  Cpu, 
  FileText, 
  Bot, 
  Zap,
  MoreVertical,
  Layers,
  User,
  Users,
  Search,
  Check,
  Code,
  Atom,
  Terminal,
  ShieldCheck,
  HardDrive,
  Clock,
  GitFork,
  X,
  FileSpreadsheet,
  BarChart3
} from 'lucide-react';

// Map component categories/names to icons
const getIcon = (category: string, name: string) => {
  const c = category.toLowerCase();
  const n = name.toLowerCase();

  if (c === 'sources' || c === 'data source' || c === 'data sources' || c === 'notification') {
    if (n.includes('gmail')) return <Mail className="w-5 h-5 text-[#EA4335]" />;
    if (n.includes('line')) return <MessageSquare className="w-5 h-5 text-[#06C755]" />;
    if (n.includes('supabase')) return <Database className="w-5 h-5 text-[#3ECF8E]" />;
    if (n.includes('storage')) return <HardDrive className="w-5 h-5 text-cyan-400" />;
    if (n.includes('graph')) return <GitFork className="w-5 h-5 text-indigo-400" />;
    if (n.includes('db') || n.includes('database')) return <Database className="w-5 h-5 text-blue-400" />;
    if (n.includes('vector')) return <Layers className="w-5 h-5 text-purple-400" />;
    return <Globe className="w-5 h-5 text-cyan-400" />;
  }

  if (c === 'datasets' || c.includes('datasets') || n.includes('polars') || n.includes('duckdb')) {
    if (n.includes('polars') || n.includes('parquet')) return <Zap className="w-5 h-5 text-amber-500" />;
    if (n.includes('duckdb')) return <Database className="w-5 h-5 text-amber-400" />;
    return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
  }

  if (c.includes('big data') || c.includes('analytics') || n.includes('big data') || n.includes('analyst') || n.includes('pipeline container')) {
    if (n.includes('container')) return <Layers className="w-5 h-5 text-sky-500" />;
    return <BarChart3 className="w-5 h-5 text-sky-400" />;
  }

  if (c === 'dataset' || c.includes('dataset')) {
    if (n.includes('pdf')) return <FileText className="w-5 h-5 text-red-400" />;
    if (n.includes('txt')) return <FileText className="w-5 h-5 text-yellow-400" />;
    if (n.includes('zip')) return <HardDrive className="w-5 h-5 text-emerald-400" />;
    return <Layers className="w-5 h-5 text-cyan-400" />;
  }
  
  if (c === 'actions') {
    if (n.includes('timer')) return <Clock className="w-5 h-5 text-amber-400" />;
    if (n.includes('ocr')) return <FileText className="w-5 h-5 text-yellow-400" />;
    if (n.includes('json')) return <Code className="w-5 h-5 text-pink-400" />;
    if (n.includes('storage')) return <HardDrive className="w-5 h-5 text-cyan-400" />;
    return <Zap className="w-5 h-5 text-orange-400" />;
  }

  if (c === 'models' || n.includes('model') || n.includes('llm')) {
    return <Cpu className="w-5 h-5 text-emerald-400" />;
  }

  if (c === 'agents' || n.includes('agent') || n.includes('decision') || n.includes('manager')) {
    if (n.includes('manager')) return <User className="w-5 h-5 text-sky-400" />;
    if (n.includes('audit')) return <ShieldCheck className="w-5 h-5 text-emerald-400" />;
    return <Bot className="w-5 h-5 text-purple-400" />;
  }

  return <Zap className="w-5 h-5 text-gray-400" />;
};

// Map tool name to corresponding icon
const getToolIcon = (toolName: string) => {
  const t = toolName.toLowerCase();
  if (t === 'react' || t === 'frontend' || t === 'atom') return <Atom className="w-3.5 h-3.5 text-sky-400" />;
  if (t === 'nodejs' || t === 'backend' || t === 'terminal') return <Terminal className="w-3.5 h-3.5 text-green-400" />;
  if (t === 'python' || t === 'ai' || t === 'code') return <Code className="w-3.5 h-3.5 text-yellow-400" />;
  if (t === 'database' || t === 'db') return <Database className="w-3.5 h-3.5 text-blue-400" />;
  if (t === 'api' || t === 'network' || t === 'globe') return <Globe className="w-3.5 h-3.5 text-cyan-400" />;
  if (t === 'users' || t === 'crm' || t === 'team') return <Users className="w-3.5 h-3.5 text-purple-400" />;
  if (t === 'search' || t === 'query') return <Search className="w-3.5 h-3.5 text-emerald-400" />;
  if (t === 'check' || t === 'verify') return <Check className="w-3.5 h-3.5 text-cyber-neon" />;
  if (t === 'vector' || t === 'embeddings') return <Layers className="w-3.5 h-3.5 text-violet-400" />;
  return <Zap className="w-3.5 h-3.5 text-gray-400" />;
};

export const calculateNextTriggerTimeForParams = (params: any, baseStartTime?: string) => {
  if (!params) return null;
  const mode = params.timerMode || 'calendarSpecific';
  const now = new Date();

  if (mode === 'calendarSpecific') {
    const dates = params.calendarSpecificDates || [];
    const futureDates = dates
      .map((dStr: string) => new Date(dStr))
      .filter((d: Date) => d > now)
      .sort((a: Date, b: Date) => a.getTime() - b.getTime());
    return futureDates.length > 0 ? futureDates[0] : null;
  }

  if (mode === 'interval') {
    const val = Number(params.intervalValue) || 1;
    const unit = params.intervalUnit || 'minutes';
    
    let baseTime = now;
    if (params.lastRun) {
      baseTime = new Date(params.lastRun);
    } else if (baseStartTime) {
      baseTime = new Date(baseStartTime);
    }
    
    let ms = 0;
    if (unit === 'seconds') ms = val * 1000;
    else if (unit === 'minutes') ms = val * 60 * 1000;
    else if (unit === 'hours') ms = val * 3600 * 1000;
    else ms = val * 86400 * 1000;

    let next = new Date(baseTime.getTime() + ms);
    while (next < now) {
      next = new Date(next.getTime() + ms);
    }
    return next;
  }

  if (mode === 'calendarPattern') {
    const patternType = params.calendarPatternType || 'daily';
    if (patternType === 'daily') {
      const dailyTime = params.calendarPatternDailyTime || '09:00';
      const [hStr, mStr] = dailyTime.split(':');
      const h = parseInt(hStr) || 0;
      const m = parseInt(mStr) || 0;
      
      const target = new Date();
      target.setHours(h, m, 0, 0);
      if (target <= now) {
        target.setDate(target.getDate() + 1);
      }
      return target;
    }

    if (patternType === 'weekly') {
      const weeklyRows = params.calendarPatternWeeklyRows || [];
      if (weeklyRows.length === 0) return null;
      
      const dayMap: Record<string, number> = {
        'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
        'Thursday': 4, 'Friday': 5, 'Saturday': 6
      };
      
      const candidates = weeklyRows.map((row: any) => {
        const dayName = row.day || 'Monday';
        const timeStr = row.time || '09:00';
        const [hStr, mStr] = timeStr.split(':');
        const h = parseInt(hStr) || 0;
        const m = parseInt(mStr) || 0;
        
        const target = new Date();
        target.setHours(h, m, 0, 0);
        
        const targetDay = dayMap[dayName] !== undefined ? dayMap[dayName] : 1;
        let dayDiff = targetDay - target.getDay();
        if (dayDiff < 0 || (dayDiff === 0 && target <= now)) {
          dayDiff += 7;
        }
        target.setDate(target.getDate() + dayDiff);
        return target;
      });
      
      candidates.sort((a: Date, b: Date) => a.getTime() - b.getTime());
      return candidates[0];
    }

    if (patternType === 'monthly') {
      const monthlyRows = params.calendarPatternMonthlyRows || [];
      if (monthlyRows.length === 0) return null;
      
      const candidates = monthlyRows.map((row: any) => {
        const dayNum = Number(row.day) || 1;
        const timeStr = row.time || '09:00';
        const [hStr, mStr] = timeStr.split(':');
        const h = parseInt(hStr) || 0;
        const m = parseInt(mStr) || 0;
        
        const target = new Date();
        target.setDate(1);
        target.setHours(h, m, 0, 0);
        
        const clampDay = (date: Date, d: number) => {
          const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
          return Math.min(d, lastDay);
        };

        target.setDate(clampDay(target, dayNum));
        if (target <= now) {
          target.setMonth(target.getMonth() + 1);
          target.setDate(1);
          target.setDate(clampDay(target, dayNum));
        }
        return target;
      });
      
      candidates.sort((a: Date, b: Date) => a.getTime() - b.getTime());
      return candidates[0];
    }
  }

  return null;
};

const CustomNode = ({ data, selected }: NodeProps) => {
  const category = data.category || 'custom';
  const name = data.name || data.label || 'Node';
  const nodeType = data.nodeType || data.nodeClass || data.originalName || category;
  const role = data.role || '';
  const isRunning = data.status === 'running';

  const isWfTimer = (data.nodeType || '').toLowerCase() === 'workflow timer' || name.toLowerCase().includes('workflow timer') || (data.label && data.label.toLowerCase().includes('workflow timer'));
  const isTimerNode = (data.nodeType || '').toLowerCase().includes('timer') || name.toLowerCase().includes('timer') || category.toLowerCase() === 'timer';
  // Direct client-side countdown display
  let countdownText = 'Inactive';
  const isActive = data.parameters?.schedulerActive === true;
  const remaining = data.parameters?.remainingSeconds;
  const intervalVal = data.parameters?.intervalValue !== undefined ? Math.max(1, Number(data.parameters.intervalValue)) : 2;
  const intervalUnit = data.parameters?.intervalUnit || 's';
  const unitSuffix = intervalUnit.startsWith('min') ? 'm' : intervalUnit.startsWith('hour') ? 'h' : intervalUnit.startsWith('day') ? 'd' : 's';
  
  if (isTimerNode) {
    if (!isActive) {
      if (isWfTimer) {
        countdownText = `${intervalVal}${unitSuffix} (Ready)`;
      } else {
        countdownText = remaining !== undefined && remaining !== null ? `${remaining}s (Paused)` : 'Inactive';
      }
    } else if (remaining === undefined || remaining === null) {
      countdownText = 'Starting...';
    } else if (remaining <= 0) {
      countdownText = isWfTimer ? 'Waking up...' : 'Triggering...';
    } else {
      const days = Math.floor(remaining / 86400);
      const hours = Math.floor((remaining % 86400) / 3600);
      const mins = Math.floor((remaining % 3600) / 60);
      const secs = remaining % 60;
      
      let parts: string[] = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0 || days > 0) parts.push(`${hours}h`);
      if (mins > 0 || hours > 0 || days > 0) parts.push(`${mins}m`);
      parts.push(`${secs}s`);
      countdownText = parts.join(' ');
    }
  }

  // Extract parameters & calculate progress
  let displayProgress: number | null = typeof data.parameters?.progress === 'number' ? data.parameters.progress : null;
  if (displayProgress === null) {
    if (typeof data.parameters?.currentIndex === 'number' && typeof data.parameters?.queueLength === 'number' && data.parameters.queueLength > 0) {
      displayProgress = Math.min(100, Math.round((data.parameters.currentIndex / data.parameters.queueLength) * 100));
    } else if (Array.isArray(data.parameters?.pdfQueue) && data.parameters.pdfQueue.length > 0 && typeof data.parameters?.currentIndex === 'number') {
      displayProgress = Math.min(100, Math.round((data.parameters.currentIndex / data.parameters.pdfQueue.length) * 100));
    } else if (Array.isArray(data.parameters?.agentOutputsTable) && data.parameters.agentOutputsTable.length > 0) {
      const completedCount = data.parameters.agentOutputsTable.filter((o: any) => o.status === 'completed' || o.status === 'success').length;
      displayProgress = Math.min(100, Math.round((completedCount / data.parameters.agentOutputsTable.length) * 100));
    } else if (isRunning) {
      displayProgress = 10; // Active running initial state
    } else if (data.status === 'success') {
      displayProgress = 100;
    }
  }
  const tools = Array.isArray(data.parameters?.tools) ? data.parameters.tools : [];

  const isJsonConnector = (data.nodeType || '').toLowerCase().includes('json connector') || name === 'JSON Connector' || name === 'JSON Connector List';
  let jsonFields: string[] = [];
  if (isJsonConnector) {
    if (Array.isArray(data.parameters?.fields)) {
      jsonFields = data.parameters.fields;
    } else if (data.parameters?.jsonText) {
      try {
        const parsed = JSON.parse(data.parameters.jsonText);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          jsonFields = Object.keys(parsed);
        }
      } catch (e) {
        // Ignore
      }
    }
  }

  return (
    <div 
      className={`relative min-w-[240px] bg-white border rounded-2xl overflow-visible transition-all duration-300 shadow-[0_10px_30px_-5px_rgba(20,60,120,0.08),0_2px_8px_rgba(20,60,120,0.04)] ${
        isRunning 
          ? 'border-blue-500 shadow-[0_0_20px_rgba(30,107,255,0.25)]' 
          : selected 
            ? 'border-blue-500 ring-2 ring-blue-500/20' 
            : data.parameters?.activeSubflow === true
              ? 'border-amber-400 ring-2 ring-amber-400/20'
              : 'border-slate-200/90 hover:border-blue-300'
      }`}
    >
      {/* Top curved accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl bg-gradient-to-r from-sky-400 via-blue-500 to-blue-600" />

      {/* Main Container */}
      <div className="p-4 pt-4.5 flex items-start space-x-3.5">
        {/* Left side: Avatar box */}
        <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-100 flex items-center justify-center shrink-0 shadow-sm">
          {getIcon(category, data.nodeType || name)}
        </div>

        {/* Right side: Texts & Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span 
              className="text-[10px] uppercase tracking-wider text-blue-600 font-bold block select-none truncate pr-1"
              title={`Node Type: ${nodeType}`}
            >
              {nodeType}
            </span>
            <div className="text-slate-400 hover:text-blue-600 cursor-pointer p-0.5 rounded shrink-0 transition-colors">
              <MoreVertical className="w-3.5 h-3.5" />
            </div>
          </div>
          
          <h4 className="text-sm font-bold text-slate-800 block truncate mt-0.5" title={name}>
            {name}
          </h4>
          
          {role && (
            <p className="text-xs text-slate-500 truncate mt-0.5 leading-tight font-medium">
              {role.length > 20 ? `${role.substring(0, 20)}...` : role}
            </p>
          )}

          {/* Big Data & Analytics Badges */}
          {(() => {
            const lowName = (name || '').toLowerCase();
            const lowType = (nodeType || '').toLowerCase();
            if (lowName.includes('polars') || lowType.includes('polars')) {
              return (
                <div className="inline-flex items-center space-x-1 mt-1 px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-700 text-[9px] font-bold tracking-tight">
                  <Zap className="w-2.5 h-2.5 text-amber-600" />
                  <span>Polars (Rust Engine)</span>
                </div>
              );
            }
            if (lowName.includes('duckdb') || lowType.includes('duckdb')) {
              return (
                <div className="inline-flex items-center space-x-1 mt-1 px-1.5 py-0.5 rounded bg-yellow-50 border border-yellow-300 text-amber-800 text-[9px] font-bold tracking-tight">
                  <Database className="w-2.5 h-2.5 text-amber-600" />
                  <span>DuckDB Data Lake</span>
                </div>
              );
            }
            if (lowName.includes('big data') || lowType.includes('big data') || lowName.includes('pipeline container')) {
              const teamCount = Array.isArray(data.parameters?.team) ? data.parameters.team.length : 4;
              return (
                <div className="inline-flex items-center space-x-1 mt-1 px-1.5 py-0.5 rounded bg-sky-50 border border-sky-200 text-sky-700 text-[9px] font-bold tracking-tight">
                  <Bot className="w-2.5 h-2.5 text-sky-600" />
                  <span>Multi-Agent ({teamCount} Specialists)</span>
                </div>
              );
            }
            return null;
          })()}

          {/* Tools Icons Row */}
          {tools.length > 0 && (
            <div className="flex items-center space-x-1.5 mt-2">
              {tools.map((tool: string, idx: number) => (
                <div key={idx} className="p-1 rounded-lg bg-[#f4f7fb] border border-slate-200/80 flex items-center justify-center shadow-sm" title={tool}>
                  {getToolIcon(tool)}
                </div>
              ))}
            </div>
          )}

          {/* Progress Bar & Text Percent */}
          {data.status !== 'idle' && (displayProgress !== null || isRunning) && displayProgress !== 100 && (
            <div className="mt-3.5 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-[10px] font-bold select-none mb-1.5">
                <span className="flex items-center space-x-1 text-slate-700 truncate max-w-[170px]" title={data.parameters?.stepMessage || ''}>
                  {isRunning && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping mr-1 shrink-0" />}
                  <span className="truncate">{isRunning ? (data.parameters?.stepMessage || 'Processing...') : displayProgress === 100 ? 'Completed' : 'Progress'}</span>
                </span>
                <span 
                  className="font-mono text-xs font-black tracking-wider shrink-0 ml-1 text-blue-600"
                >
                  {displayProgress ?? 0}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/80 p-0.5 shadow-inner">
                <div 
                  className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r from-sky-400 to-blue-600 ${isRunning && (displayProgress ?? 0) < 100 ? 'animate-pulse' : ''}`}
                  style={{ 
                    width: `${Math.max(5, Math.min(100, displayProgress ?? 0))}%`, 
                    boxShadow: '0 0 8px rgba(37,99,235,0.4)'
                  }}
                />
              </div>
            </div>
          )}

          {isTimerNode && countdownText && (
            <div className="mt-3.5 pt-2.5 border-t border-slate-100 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold select-none flex items-center space-x-1">
                  <Clock className={`w-3 h-3 ${isActive ? 'text-blue-600 animate-pulse' : 'text-slate-400'}`} />
                  <span>{isWfTimer ? "Workflow Timer Countdown" : "Next Trigger Countdown"}</span>
                </div>
                <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                  isActive 
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}>
                  {isActive ? "ACTIVE" : "READY"}
                </span>
              </div>
              <div className={`flex items-center space-x-2 bg-[#f4f7fb] px-2.5 py-1.5 rounded-xl border transition-all ${
                isActive 
                  ? 'border-blue-400 shadow-sm' 
                  : 'border-slate-200'
              }`}>
                <Clock className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600 animate-pulse' : 'text-slate-400'}`} />
                <span className={`text-[11px] font-mono font-black tracking-wide ${
                  isActive ? 'text-blue-600' : 'text-slate-700'
                }`}>
                  {countdownText}
                </span>
              </div>
            </div>
          )}

          {isJsonConnector && (
            <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-2">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold select-none">
                Parsed JSON Fields
              </div>
              {jsonFields.length === 0 ? (
                <div className="text-[10px] text-amber-500 italic">No valid JSON fields found</div>
              ) : (
                <div className="flex flex-col space-y-1.5 relative">
                  {jsonFields.map((field) => (
                    <div 
                      key={field} 
                      className="flex items-center justify-between py-1 px-2.5 bg-[#f4f7fb] rounded-xl border border-slate-200 relative"
                    >
                      <span className="text-xs font-mono text-blue-600 truncate pr-2">{field}</span>
                      <Handle
                        type="source"
                        position={Position.Right}
                        id={field}
                        className="w-2.5 h-2.5 bg-blue-600 border-2 border-white -right-4 absolute shadow-sm"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {typeof data.parameters?.currentIndex === 'number' && typeof data.parameters?.previousMaxList === 'object' && data.parameters.previousMaxList !== null && (
            <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-500 font-bold select-none">
                <span>Queue Tracking</span>
                <span className="text-blue-600 font-mono">Index: {data.parameters.currentIndex}</span>
              </div>
              <div className="flex flex-col space-y-1.5">
                {Object.entries(data.parameters.previousMaxList).map(([pid, maxVal]) => (
                  <div key={pid} className="flex items-center justify-between py-1 px-2.5 bg-[#f4f7fb] rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 truncate flex-1">Parent: {pid.replace('node_', '')}</span>
                    <span className="text-xs font-mono font-bold text-emerald-600 ml-2">Max: {String(maxVal)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Connection Sockets (Handles) */}
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        className="w-3 h-3 bg-white border-2 border-blue-600 hover:bg-blue-600 transition-colors shadow-sm"
      />
      {name.toLowerCase().includes('audit') ? (
        <>
          {/* Left Handle (Invalid) */}
          <X className="w-4 h-4 text-red-500 absolute top-1/2 -translate-y-1/2 pointer-events-none z-50" style={{ left: '-36px' }} />
          <Handle
            type="source"
            position={Position.Left}
            id="invalid"
            className="w-3 h-3 bg-white border-2 border-red-500 hover:bg-red-500 transition-colors cursor-crosshair shadow-sm"
            style={{ left: '-6px' }}
          />
          
          {/* Bottom Handle (Valid) */}
          <Check className="w-4 h-4 text-green-500 absolute left-1/2 -translate-x-1/2 pointer-events-none z-50" style={{ bottom: '-36px' }} />
          <Handle
            type="source"
            position={Position.Bottom}
            id="output"
            className="w-3 h-3 bg-white border-2 border-emerald-500 hover:bg-emerald-500 transition-colors cursor-crosshair shadow-sm"
            style={{ bottom: '-6px' }}
          />
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Bottom}
          id="output"
          className="w-3 h-3 bg-white border-2 border-blue-600 hover:bg-blue-600 transition-colors shadow-sm"
        />
      )}
    </div>
  );
};

export default memo(CustomNode);
