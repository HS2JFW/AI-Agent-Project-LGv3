import type React from 'react';
import { 
  ChevronDown, 
  Maximize2, 
  Minimize2, 
  Terminal 
} from 'lucide-react';

export interface BottomLogViewerTrayProps {
  showLogsTray: boolean;
  activeTab: string;
  isLogsTrayFullScreen: boolean;
  setIsLogsTrayFullScreen: (val: boolean | ((prev: boolean) => boolean)) => void;
  logsTrayHeight: number;
  isResizingLogsTray: boolean;
  setIsResizingLogsTray: (val: boolean) => void;
  activeLogTab: string;
  setActiveLogTab: React.Dispatch<React.SetStateAction<'ai' | 'system' | 'process'>> | ((tab: 'ai' | 'system' | 'process') => void);
  logs: any[];
  systemLogs: any;
  aiLogs: any;
  clearWorkflowLogs: (id?: string) => void;
  selectedWorkflowId: string | null;
  currentRunId?: string | null;
  setShowLogsTray: (val: boolean) => void;
}

export default function BottomLogViewerTray({
  showLogsTray,
  activeTab,
  isLogsTrayFullScreen,
  setIsLogsTrayFullScreen,
  logsTrayHeight,
  isResizingLogsTray,
  setIsResizingLogsTray,
  activeLogTab,
  setActiveLogTab,
  logs,
  systemLogs,
  aiLogs,
  clearWorkflowLogs,
  selectedWorkflowId,
  currentRunId,
  setShowLogsTray,
}: BottomLogViewerTrayProps) {
  if (!showLogsTray || activeTab !== 'logic') {
    return null;
  }

  return (
            <div 

              className="relative border-t border-slate-200/90 bg-white flex flex-col z-10 shadow-[0_-12px_36px_rgba(30,60,110,0.06)]"

              style={{ height: isLogsTrayFullScreen ? '100%' : `${logsTrayHeight}px` }}

            >

              {/* Resize Grab Handle Divider */}

              {!isLogsTrayFullScreen && (

                <div 

                  onMouseDown={(e) => {

                    e.preventDefault();

                    setIsResizingLogsTray(true);

                  }}

                  className={`absolute top-0 left-0 right-0 h-1.5 -translate-y-1/2 cursor-row-resize z-50 hover:bg-blue-500/40 transition-colors ${

                    isResizingLogsTray ? 'bg-blue-500/40' : ''

                  }`}

                  title="Drag to resize console"

                />

              )}



              <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 bg-white select-none">

                <div className="flex items-center space-x-2">

                  <Terminal className="w-4 h-4 text-blue-600" />

                  

                  <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200/80 shadow-inner ml-2 mr-3">

                    <button 

                      onClick={() => setActiveLogTab('process')}

                      className={`px-3.5 py-1 text-[11px] font-bold tracking-wider uppercase transition-all rounded-lg cursor-pointer ${activeLogTab === 'process' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}

                    >

                      Process

                    </button>

                    <button 

                      onClick={() => setActiveLogTab('system')}

                      className={`px-3.5 py-1 text-[11px] font-bold tracking-wider uppercase transition-all rounded-lg cursor-pointer ${activeLogTab === 'system' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}

                    >

                      System

                    </button>

                    <button 

                      onClick={() => setActiveLogTab('ai')}

                      className={`px-3.5 py-1 text-[11px] font-bold tracking-wider uppercase transition-all rounded-lg cursor-pointer ${activeLogTab === 'ai' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}

                    >

                      AI

                    </button>

                  </div>



                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center">

                    <span>{activeLogTab === 'system' ? 'System Logs (Backend)' : (activeLogTab === 'ai' ? 'AI Agent Logs' : 'Workflow Execution Traces Console')}</span>

                    {currentRunId && activeLogTab !== 'system' && activeLogTab !== 'ai' && (

                      <span className="text-[10px] text-slate-400 font-mono font-normal lowercase ml-2">

                        (run: {currentRunId.slice(0, 8)}...)

                      </span>

                    )}

                  </span>

                  {activeLogTab !== 'system' && activeLogTab !== 'ai' && (

                    <span className="bg-slate-100 border border-slate-200/80 px-2 py-0.5 text-[10px] rounded-full text-slate-500 font-mono font-semibold ml-2">

                      {logs.length} entries

                    </span>

                  )}

                </div>

                <div className="flex items-center space-x-3">

                  <button 

                    onClick={() => {

                      clearWorkflowLogs(selectedWorkflowId || currentRunId || undefined);

                    }} 

                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-full shadow-[0_4px_12px_rgba(26,106,255,0.25)] transition-all cursor-pointer"

                  >

                    Clear Console

                  </button>

                  {/* Cyan-blue status indicator light strip */}

                  <div className="w-1.5 h-4 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]" title="Console Status: Connected" />

                  <div className="w-[1px] h-3.5 bg-slate-200" />

                  <button

                    onClick={() => setIsLogsTrayFullScreen(!isLogsTrayFullScreen)}

                    className={`p-1.5 rounded-lg hover:bg-slate-100 transition-all cursor-pointer flex items-center justify-center ${

                      isLogsTrayFullScreen ? 'text-blue-600' : 'text-slate-400 hover:text-slate-700'

                    }`}

                    title={isLogsTrayFullScreen ? "Exit Full Screen" : "Full Screen"}

                  >

                    {isLogsTrayFullScreen ? (

                      <Minimize2 className="w-3.5 h-3.5" />

                    ) : (

                      <Maximize2 className="w-3.5 h-3.5" />

                    )}

                  </button>

                  <div className="w-[1px] h-3.5 bg-slate-200" />

                  <button

                    onClick={() => {

                      if (isLogsTrayFullScreen) setIsLogsTrayFullScreen(false);

                      setShowLogsTray(false);

                    }}

                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all cursor-pointer flex items-center justify-center"

                    title="Hide Log File (ซ่อน Log File)"

                  >

                    <ChevronDown className="w-3.5 h-3.5" />

                  </button>

                </div>

              </div>



              {/* Log Messages List */}

              <div className="flex-1 overflow-y-auto min-h-0 mx-4 my-2.5 p-3.5 bg-[#F1F5F9] rounded-2xl border border-slate-200/90 shadow-inner font-mono text-xs space-y-1.5 text-slate-700">

                {activeLogTab === 'system' ? (

                  <pre className="text-slate-700 whitespace-pre-wrap">{systemLogs || "Waiting for system logs..."}</pre>

                ) : activeLogTab === 'ai' ? (

                  <pre className="text-emerald-700 whitespace-pre-wrap font-bold">{aiLogs || "Waiting for AI Agent logs..."}</pre>

                ) : logs.length === 0 ? (

                  <div className="text-slate-400 italic text-center pt-8">

                    Console ready. Execute workflow to capture execution traces...

                  </div>

                ) : (

                  logs.map((log, lIdx) => {

                    const isError = log.level === 'ERROR';

                    const isSuccess = log.level === 'SUCCESS';



                    let messageElement = (

                      <span className={isError ? 'text-rose-600 font-medium' : isSuccess ? 'text-emerald-700 font-medium' : 'text-slate-700'}>

                        {log.message}

                      </span>

                    );

                    

                    if (log.message.startsWith('Timer:')) {

                      messageElement = (

                        <span className="text-purple-700">

                          <span className="text-purple-600 font-extrabold">Timer ⏱️ </span>

                          {log.message.slice(6)}

                        </span>

                      );

                    } else if (log.message.startsWith('Database:')) {

                      messageElement = (

                        <span className="text-blue-700">

                          <span className="text-blue-600 font-extrabold">Database 🗄️ </span>

                          {log.message.slice(9)}

                        </span>

                      );

                    } else if (log.message.startsWith('Frontend Scheduler:')) {

                      messageElement = (

                        <span className="text-blue-700">

                          <span className="text-blue-600 font-black">Scheduler ⚙️ </span>

                          {log.message.slice(19)}

                        </span>

                      );

                    } else if (log.message.startsWith('[Timer]')) {

                      messageElement = (

                        <span className="text-purple-700">

                          <span className="text-purple-600 font-extrabold">Timer ⏱️ </span>

                          {log.message.slice(7)}

                        </span>

                      );

                    } else if (log.message.startsWith('[Database]')) {

                      messageElement = (

                        <span className="text-blue-700">

                          <span className="text-blue-600 font-extrabold">Database 🗄️ </span>

                          {log.message.slice(10)}

                        </span>

                      );

                    }



                    return (

                      <div key={lIdx} className="flex items-start space-x-2 border-b border-slate-200/60 pb-1">

                        <span className="text-[10px] text-slate-400 shrink-0">

                          [{new Date(log.timestamp).toLocaleTimeString()}]

                        </span>

                        <span className={`font-bold shrink-0 ${

                          isError ? 'text-rose-600' : isSuccess ? 'text-emerald-600' : 'text-blue-600'

                        }`}>

                          {log.level}:

                        </span>

                        {messageElement}

                      </div>

                    );

                  })

                )}

              </div>

            </div>

  );
}
