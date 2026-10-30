import type React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Plus, 
  Trash2 
} from 'lucide-react';
import TimerCountdown from '../canvas/TimerCountdown';

export interface TimerNodeInspectorProps {
  selectedNode: any;
  nodes: any[];
  isSelectedRegularTimerNode: boolean;
  isSelectedWorkflowTimerNode: boolean;
  setNodes?: React.Dispatch<React.SetStateAction<any[]>>;
  setSelectedNode?: React.Dispatch<React.SetStateAction<any>>;
  updateSelectedNodeParameter: (key: string, val: any) => void;
  calMonth: number;
  setCalMonth: React.Dispatch<React.SetStateAction<number>>;
  calYear: number;
  setCalYear: React.Dispatch<React.SetStateAction<number>>;
  selectedCalDate: string | null;
  setSelectedCalDate: React.Dispatch<React.SetStateAction<string | null>>;
  selectedCalTime: string;
  setSelectedCalTime: React.Dispatch<React.SetStateAction<string>>;
  openClockPicker: (event: React.MouseEvent, initTime: string, onSave: (time: string) => void) => void;
  openDayPopover: (event: React.MouseEvent, initDay: number, onSave: (day: number) => void) => void;
}

const getCalendarDays = (month: number, year: number) => {
  const firstDay = new Date(year, month, 1);
  let startDayOfWeek = firstDay.getDay() - 1;
  if (startDayOfWeek < 0) startDayOfWeek = 6;
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();
  const days = [];
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthTotalDays - i;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    days.push({ day: d, month: prevMonth, year: prevYear, isCurrentMonth: false });
  }
  for (let i = 1; i <= totalDays; i++) {
    days.push({ day: i, month, year, isCurrentMonth: true });
  }
  const remainingCells = 42 - days.length;
  for (let i = 1; i <= remainingCells; i++) {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    days.push({ day: i, month: nextMonth, year: nextYear, isCurrentMonth: false });
  }
  return days;
};

const format24toAmPmString = (time24: string): string => {
  if (!time24) return "09:00 AM";
  const [hStr, mStr] = time24.split(':');
  const h24 = parseInt(hStr) || 0;
  const m = mStr || "00";
  const amPm = h24 >= 12 ? 'PM' : 'AM';
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  return `${String(h12).padStart(2, '0')}:${m} ${amPm}`;
};

const parseAmPmStringTo24 = (ampmStr: string): string => {
  if (!ampmStr) return "09:00";
  const regex = /(\d{1,2}):(\d{2})\s*(AM|PM)/i;
  const match = ampmStr.match(regex);
  if (match) {
    let h12 = parseInt(match[1]) || 12;
    const m = match[2];
    const amPm = match[3].toUpperCase() as 'AM' | 'PM';
    let h24 = h12 % 12;
    if (amPm === 'PM') h24 += 12;
    return `${String(h24).padStart(2, '0')}:${m}`;
  }
  return "09:00";
};

export default function TimerNodeInspector({
  selectedNode,
  nodes,
  isSelectedRegularTimerNode,
  isSelectedWorkflowTimerNode,
  setNodes,
  setSelectedNode,
  updateSelectedNodeParameter,
  calMonth,
  setCalMonth,
  calYear,
  setCalYear,
  selectedCalDate,
  setSelectedCalDate,
  selectedCalTime,
  setSelectedCalTime,
  openClockPicker,
  openDayPopover,
}: TimerNodeInspectorProps) {
  if (!isSelectedRegularTimerNode && !isSelectedWorkflowTimerNode) return null;

  return (
    <>
                {/* Workflow Timer Parameter Editor */}

                {isSelectedWorkflowTimerNode && (

                  <div className="space-y-4 pt-3 border-t border-cyber-border border-opacity-40">

                    <div className="flex items-center justify-between">

                      <h4 className="text-xs font-bold text-cyber-neon uppercase tracking-wider flex items-center space-x-1.5">

                        <Clock className="w-3.5 h-3.5" />

                        <span>Workflow Timer Settings</span>

                      </h4>

                    </div>



                    <TimerCountdown 

                      parameters={nodes.find(n => n.id === selectedNode.id)?.data.parameters || selectedNode.data.parameters} 

                      title="Workflow Timer Countdown (นับถอยหลัง)"

                      isWorkflowTimer={true}

                      onToggleActive={() => {

                        const targetId = selectedNode.id;

                        const currNode = nodes.find(n => n.id === targetId) || selectedNode;

                        const currParams = currNode?.data?.parameters || {};

                        const newActive = !currParams.schedulerActive;

                        const intervalVal = currParams.intervalValue !== undefined ? Math.max(1, Number(currParams.intervalValue)) : 2;



                        setNodes?.((nds: any[]) => nds.map((n: any) => n.id === targetId ? {

                          ...n,

                          data: {

                            ...n.data,

                            parameters: {

                              ...n.data.parameters,

                              schedulerActive: newActive,

                              remainingSeconds: newActive ? intervalVal : n.data.parameters?.remainingSeconds,

                              lastRun: newActive ? new Date().toISOString() : n.data.parameters?.lastRun

                            }

                          }

                        } : n));



                        setSelectedNode?.((prev: any) => prev && prev.id === targetId ? {

                          ...prev,

                          data: {

                            ...prev.data,

                            parameters: {

                              ...prev.data.parameters,

                              schedulerActive: newActive,

                              remainingSeconds: newActive ? intervalVal : prev.data.parameters?.remainingSeconds,

                              lastRun: newActive ? new Date().toISOString() : prev.data.parameters?.lastRun

                            }

                          }

                        } : prev);

                      }}

                    />



                    <div className="space-y-3 bg-cyber-dark bg-opacity-40 p-3 rounded-lg border border-cyber-border border-opacity-60">

                      <div className="space-y-1">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          Heartbeat Interval (ระยะเวลาตรวจจับและปลุกโหนด)

                        </label>

                        <div className="flex items-center bg-cyber-dark border border-cyber-border focus-within:border-cyber-neon rounded-lg overflow-hidden">

                          <input

                            type="number"

                            min={1}

                            value={selectedNode.data.parameters?.intervalValue !== undefined ? selectedNode.data.parameters.intervalValue : 2}

                            onChange={(e) => {

                              const val = Math.max(1, parseInt(e.target.value) || 1);

                              updateSelectedNodeParameter('intervalValue', val);

                              const curr = nodes.find(n => n.id === selectedNode.id)?.data?.parameters;

                              if (!curr?.schedulerActive) {

                                updateSelectedNodeParameter('remainingSeconds', val);

                              }

                            }}

                            className="w-full text-xs bg-transparent border-none focus:ring-0 focus:outline-none py-2 px-3 text-cyber-text font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"

                            placeholder="e.g. 2"

                          />

                          <div className="flex flex-col border-l border-cyber-border bg-cyber-dark">

                            <button

                              onClick={() => {

                                const currentVal = selectedNode.data.parameters?.intervalValue !== undefined ? selectedNode.data.parameters.intervalValue : 2;

                                const nextVal = currentVal + 1;

                                updateSelectedNodeParameter('intervalValue', nextVal);

                                const curr = nodes.find(n => n.id === selectedNode.id)?.data?.parameters;

                                if (!curr?.schedulerActive) {

                                  updateSelectedNodeParameter('remainingSeconds', nextVal);

                                }

                              }}

                              className="px-2.5 py-0.5 hover:bg-cyber-panel text-cyber-text hover:text-cyber-neon text-[8px] border-b border-cyber-border cursor-pointer transition-all"

                            >

                              ▲

                            </button>

                            <button

                              onClick={() => {

                                const currentVal = selectedNode.data.parameters?.intervalValue !== undefined ? selectedNode.data.parameters.intervalValue : 2;

                                const nextVal = Math.max(1, currentVal - 1);

                                updateSelectedNodeParameter('intervalValue', nextVal);

                                const curr = nodes.find(n => n.id === selectedNode.id)?.data?.parameters;

                                if (!curr?.schedulerActive) {

                                  updateSelectedNodeParameter('remainingSeconds', nextVal);

                                }

                              }}

                              className="px-2.5 py-0.5 hover:bg-cyber-panel text-cyber-text hover:text-cyber-neon text-[8px] cursor-pointer transition-all"

                            >

                              ▼

                            </button>

                          </div>

                        </div>

                      </div>

                      <div className="space-y-1">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          Unit

                        </label>

                        <select

                          value={selectedNode.data.parameters?.intervalUnit || 'seconds'}

                          onChange={(e) => updateSelectedNodeParameter('intervalUnit', e.target.value)}

                          className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text"

                        >

                          <option value="seconds" style={{ backgroundColor: '#0b0f19', color: '#e2e8f0' }}>Seconds (วินาที)</option>

                          <option value="minutes" style={{ backgroundColor: '#0b0f19', color: '#e2e8f0' }}>Minutes (นาที)</option>

                          <option value="hours" style={{ backgroundColor: '#0b0f19', color: '#e2e8f0' }}>Hours (ชั่วโมง)</option>

                          <option value="days" style={{ backgroundColor: '#0b0f19', color: '#e2e8f0' }}>Days (วัน)</option>

                        </select>

                      </div>

                      <p className="text-[9px] text-cyber-muted leading-relaxed italic font-mono pt-1">

                        ⏱️ Workflow Timer: ระบบเฝ้าระวังและส่งสัญญาณ Wake Up ปลุก AI Agents (Agent, PDF to Image Agent, DB) ทุกๆ {selectedNode.data.parameters?.intervalValue !== undefined ? selectedNode.data.parameters.intervalValue : 2} {selectedNode.data.parameters?.intervalUnit || 'seconds'} หากโหนดว่างงานและมีข้อมูลรอประมวลผล (ถ้ากำลังประมวลผลอยู่จะไม่รบกวน)

                      </p>

                    </div>

                  </div>

                )}


      {isSelectedRegularTimerNode && (
<div className="space-y-4 pt-3 border-t border-cyber-border border-opacity-40">

                    <h4 className="text-xs font-bold text-cyber-text uppercase tracking-wider">

                      Timer Settings (Action Node)

                    </h4>

                    

                    {/* Timer Mode Selection */}

                    <div className="space-y-1.5">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        Scheduling Mode

                      </label>

                      <select

                        value={selectedNode.data.parameters?.timerMode || 'interval'}

                        onChange={(e) => updateSelectedNodeParameter('timerMode', e.target.value)}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text"

                      >

                        <option value="interval" style={{ backgroundColor: '#0b0f19', color: '#e2e8f0' }}>Interval Countdown (Every X)</option>

                        <option value="calendarSpecific" style={{ backgroundColor: '#0b0f19', color: '#e2e8f0' }}>Calendar (Specific Date & Time)</option>

                        <option value="calendarPattern" style={{ backgroundColor: '#0b0f19', color: '#e2e8f0' }}>Calendar Pattern (Daily/Weekly/Monthly)</option>

                      </select>

                    </div>

                    <TimerCountdown parameters={nodes.find(n => n.id === selectedNode.id)?.data.parameters || selectedNode.data.parameters} />

                    {/* Mode 1: Calendar Specific Dates - Premium Interactive Calendar Picker */}

                    {selectedNode.data.parameters?.timerMode === 'calendarSpecific' && (

                      <div className="space-y-4">

                        <div className="bg-cyber-dark bg-opacity-40 border border-cyber-border rounded-xl p-3.5 space-y-3">

                          {/* Calendar Month Header */}

                          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-cyber-text">

                            <span>

                              {new Date(calYear, calMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}

                            </span>

                            <div className="flex items-center space-x-1.5">

                              <button

                                onClick={() => {

                                  if (calMonth === 0) {

                                    setCalMonth(11);

                                    setCalYear(y => y - 1);

                                  } else {

                                    setCalMonth(m => m - 1);

                                  }

                                }}

                                className="p-1 rounded hover:bg-cyber-panel text-cyber-muted hover:text-cyber-neon border border-cyber-border transition-all cursor-pointer"

                              >

                                <ChevronLeft className="w-3.5 h-3.5" />

                              </button>

                              <button

                                onClick={() => {

                                  if (calMonth === 11) {

                                    setCalMonth(0);

                                    setCalYear(y => y + 1);

                                  } else {

                                    setCalMonth(m => m + 1);

                                  }

                                }}

                                className="p-1 rounded hover:bg-cyber-panel text-cyber-muted hover:text-cyber-neon border border-cyber-border transition-all cursor-pointer"

                              >

                                <ChevronRight className="w-3.5 h-3.5" />

                              </button>

                            </div>

                          </div>



                          {/* Day Labels */}

                          <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-bold text-cyber-muted uppercase tracking-wider font-mono">

                            <div>Mo</div>

                            <div>Tu</div>

                            <div>We</div>

                            <div>Th</div>

                            <div>Fr</div>

                            <div>Sa</div>

                            <div>Su</div>

                          </div>



                          {/* Days Grid */}

                          <div className="grid grid-cols-7 gap-1">

                            {getCalendarDays(calMonth, calYear).map((cell, idx) => {

                              const cellDateStr = `${cell.year}-${String(cell.month + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`;

                              const isSelected = selectedCalDate === cellDateStr;

                              const isCurrent = cell.isCurrentMonth;

                              

                              // Check if this date has any schedules configured

                              const currentList = selectedNode.data.parameters?.calendarSpecificDates || [];

                              const hasSchedule = currentList.some((dt: string) => dt.startsWith(cellDateStr));



                              return (

                                <button

                                  key={idx}

                                  onClick={() => setSelectedCalDate(cellDateStr)}

                                  className={`aspect-square w-full rounded-lg flex flex-col items-center justify-center text-[11px] font-mono transition-all cursor-pointer relative border ${

                                    isSelected

                                      ? 'bg-cyber-neon text-cyber-dark border-cyber-neon font-bold shadow-neon-glow'

                                      : isCurrent

                                        ? 'bg-cyber-dark bg-opacity-35 hover:bg-cyber-panel text-cyber-text border-transparent hover:border-cyber-neon border-opacity-40'

                                        : 'bg-transparent text-cyber-muted text-opacity-30 border-transparent'

                                  }`}

                                >

                                  <span>{cell.day}</span>

                                  {hasSchedule && (

                                    <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-cyber-dark' : 'bg-cyber-neon shadow-neon-glow'}`} />

                                  )}

                                </button>

                              );

                            })}

                          </div>



                          {/* Time Selector and Add Button */}

                          {selectedCalDate && (

                            <div className="pt-2.5 border-t border-cyber-border border-opacity-40 space-y-2.5">

                              <div className="flex items-center justify-between space-x-2">

                                <div className="flex-1 space-y-1">

                                  <label className="text-[9px] font-bold uppercase tracking-wider text-cyber-muted block">

                                    Trigger Time (12h)

                                  </label>

                                  <div className="flex items-center space-x-1.5">

                                    <input

                                      type="text"

                                      placeholder="09:00 AM"

                                      value={format24toAmPmString(selectedCalTime)}

                                      onChange={(e) => setSelectedCalTime(parseAmPmStringTo24(e.target.value))}

                                      className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-1.5 px-2 rounded-lg text-cyber-text font-mono"

                                    />

                                    <button

                                      onClick={(e) => openClockPicker(e, selectedCalTime, (val) => setSelectedCalTime(val))}

                                      className="p-1.5 rounded-lg bg-cyber-dark hover:bg-cyber-panel border border-cyber-border hover:border-cyber-neon text-cyber-neon transition-all cursor-pointer flex items-center justify-center"

                                      title="Open Clock Picker"

                                    >

                                      <Clock className="w-4 h-4" />

                                    </button>

                                  </div>

                                </div>

                                <div className="pt-4">

                                  <button

                                    onClick={() => {

                                      if (selectedCalDate) {

                                        const currentList = selectedNode.data.parameters?.calendarSpecificDates || [];

                                        const combinedStr = `${selectedCalDate} ${selectedCalTime}`;

                                        if (!currentList.includes(combinedStr)) {

                                          updateSelectedNodeParameter('calendarSpecificDates', [...currentList, combinedStr].sort());

                                        }

                                      }

                                    }}

                                    className="px-3.5 py-1.5 rounded-lg bg-cyber-neon text-cyber-dark font-bold text-xs hover:shadow-neon-glow transition-all cursor-pointer flex items-center justify-center space-x-1.5"

                                  >

                                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />

                                    <span>Add Target</span>

                                  </button>

                                </div>

                              </div>

                              <p className="text-[9px] text-cyber-muted font-mono">

                                Selected Date: <span className="text-cyber-neon">{selectedCalDate}</span> at <span className="text-cyber-neon">{format24toAmPmString(selectedCalTime)}</span>

                              </p>

                            </div>

                          )}

                        </div>



                        {/* Scheduled Events Vertical Timeline (Image 2 style) */}

                        <div className="space-y-2">

                          <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                            Active Schedule Timeline

                          </label>



                          {(!selectedNode.data.parameters?.calendarSpecificDates || selectedNode.data.parameters.calendarSpecificDates.length === 0) ? (

                            <p className="text-[10px] text-cyber-muted text-center py-6 border border-dashed border-cyber-border rounded-xl font-mono">

                              No schedules added yet. Select a date above.

                            </p>

                          ) : (

                            <div className="relative pl-6 space-y-4 py-1 border-l-2 border-cyber-border border-opacity-65 ml-3">

                              {selectedNode.data.parameters.calendarSpecificDates.map((dtStr: string, idx: number) => {

                                // Extract date and time

                                const [datePart, timePart] = dtStr.split(' ');

                                const formattedDate = datePart ? new Date(datePart).toLocaleDateString('default', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

                                

                                return (

                                  <div key={idx} className="relative group">

                                    {/* Timeline dot node */}

                                    <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-cyber-dark border-2 border-cyber-neon flex items-center justify-center shadow-neon-glow">

                                      <div className="w-1.5 h-1.5 rounded-full bg-cyber-neon" />

                                    </div>



                                    {/* Timeline Event Card */}

                                    <div className="bg-cyber-panel bg-opacity-40 border border-cyber-border rounded-xl p-3 flex items-center justify-between hover:border-cyber-neon hover:shadow-neon-glow border-opacity-60 transition-all">

                                      <div className="space-y-0.5">

                                        <div className="text-xs font-bold font-mono text-cyber-neon">

                                          {format24toAmPmString(timePart || '00:00')}

                                        </div>

                                        <div className="text-[10px] text-cyber-muted font-semibold">

                                          {formattedDate}

                                        </div>

                                        <div className="text-[9px] text-cyber-text text-opacity-70 font-mono">

                                          Workflow Auto-Trigger

                                        </div>

                                      </div>



                                      <button

                                        onClick={() => {

                                          const currentList = selectedNode.data.parameters?.calendarSpecificDates || [];

                                          const newList = currentList.filter((item: string) => item !== dtStr);

                                          updateSelectedNodeParameter('calendarSpecificDates', newList);

                                        }}

                                        className="text-cyber-muted hover:text-red-400 p-1.5 rounded-lg hover:bg-cyber-dark transition-all cursor-pointer"

                                        title="Remove schedule"

                                      >

                                        <Trash2 className="w-3.5 h-3.5" />

                                      </button>

                                    </div>

                                  </div>

                                );

                              })}

                            </div>

                          )}

                        </div>

                      </div>

                    )}



                    {/* Mode 2: Interval Countdown */}

                    {selectedNode.data.parameters?.timerMode === 'interval' && (

                      <div className="space-y-3 bg-cyber-dark bg-opacity-40 p-3 rounded-lg border border-cyber-border border-opacity-60">

                        <div className="space-y-1">

                          <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                            Interval Duration

                          </label>

                          <div className="flex items-center bg-cyber-dark border border-cyber-border focus-within:border-cyber-neon rounded-lg overflow-hidden">

                            <input

                              type="number"

                              min={1}

                              value={selectedNode.data.parameters?.intervalValue !== undefined ? selectedNode.data.parameters.intervalValue : 2}

                              onChange={(e) => updateSelectedNodeParameter('intervalValue', Math.max(1, parseInt(e.target.value) || 1))}

                              className="w-full text-xs bg-transparent border-none focus:ring-0 focus:outline-none py-2 px-3 text-cyber-text font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"

                              placeholder="e.g. 2"

                            />

                            <div className="flex flex-col border-l border-cyber-border bg-cyber-dark">

                              <button

                                onClick={() => {

                                  const currentVal = selectedNode.data.parameters?.intervalValue !== undefined ? selectedNode.data.parameters.intervalValue : 2;

                                  updateSelectedNodeParameter('intervalValue', currentVal + 1);

                                }}

                                className="px-2.5 py-0.5 hover:bg-cyber-panel text-cyber-text hover:text-cyber-neon text-[8px] border-b border-cyber-border cursor-pointer transition-all"

                              >

                                ▲

                              </button>

                              <button

                                onClick={() => {

                                  const currentVal = selectedNode.data.parameters?.intervalValue !== undefined ? selectedNode.data.parameters.intervalValue : 2;

                                  updateSelectedNodeParameter('intervalValue', Math.max(1, currentVal - 1));

                                }}

                                className="px-2.5 py-0.5 hover:bg-cyber-panel text-cyber-text hover:text-cyber-neon text-[8px] cursor-pointer transition-all"

                              >

                                ▼

                              </button>

                            </div>

                          </div>

                        </div>

                        <div className="space-y-1">

                          <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                            Unit

                          </label>

                          <select

                            value={selectedNode.data.parameters?.intervalUnit || 'seconds'}

                            onChange={(e) => updateSelectedNodeParameter('intervalUnit', e.target.value)}

                            className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text"

                          >

                            <option value="seconds" style={{ backgroundColor: '#0b0f19', color: '#e2e8f0' }}>Seconds (วินาที)</option>

                            <option value="minutes" style={{ backgroundColor: '#0b0f19', color: '#e2e8f0' }}>Minutes (นาที)</option>

                            <option value="hours" style={{ backgroundColor: '#0b0f19', color: '#e2e8f0' }}>Hours (ชั่วโมง)</option>

                            <option value="days" style={{ backgroundColor: '#0b0f19', color: '#e2e8f0' }}>Days (วัน)</option>

                          </select>

                        </div>

                        <p className="text-[9px] text-cyber-muted leading-relaxed italic font-mono pt-1">

                          Timer (Action Node): นับถอยหลังและส่งสัญญาณ Trigger ไปยังโหนดลูกที่ต่อสาย Edges ตามลำดับ DAG

                        </p>

                      </div>

                    )}



                    {/* Mode 3: Calendar Pattern Countdown */}

                    {selectedNode.data.parameters?.timerMode === 'calendarPattern' && (

                      <div className="space-y-3">

                        <div className="space-y-1.5">

                          <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                            Pattern Repeat

                          </label>

                          <select

                            value={selectedNode.data.parameters?.calendarPatternType || 'daily'}

                            onChange={(e) => updateSelectedNodeParameter('calendarPatternType', e.target.value)}

                            className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text"

                          >

                            <option value="daily" style={{ backgroundColor: '#0b0f19', color: '#e2e8f0' }}>Daily</option>

                            <option value="weekly" style={{ backgroundColor: '#0b0f19', color: '#e2e8f0' }}>Weekly</option>

                            <option value="monthly" style={{ backgroundColor: '#0b0f19', color: '#e2e8f0' }}>Monthly</option>

                          </select>

                        </div>



                        {/* Sub-mode Daily */}

                        {selectedNode.data.parameters?.calendarPatternType === 'daily' && (

                          <div className="space-y-3">

                            <div className="flex items-center justify-between">

                              <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                                Daily Schedule Patterns

                              </label>

                              <button

                                onClick={() => {

                                  const currentList = selectedNode.data.parameters?.calendarPatternDailyRows || [];

                                  updateSelectedNodeParameter('calendarPatternDailyRows', [...currentList, { time: '09:00' }]);

                                }}

                                className="p-1 rounded bg-cyber-dark hover:bg-cyber-panel text-cyber-neon border border-cyber-border hover:border-cyber-neon transition-all cursor-pointer flex items-center justify-center"

                                title="Add Daily Schedule"

                              >

                                <Plus className="w-3.5 h-3.5" />

                              </button>

                            </div>



                            <div className="border border-cyber-border rounded-lg bg-cyber-dark bg-opacity-65 max-h-40 overflow-y-auto custom-scrollbar">

                              {(!selectedNode.data.parameters?.calendarPatternDailyRows || selectedNode.data.parameters.calendarPatternDailyRows.length === 0) ? (

                                <p className="text-[10px] text-cyber-muted text-center py-4 font-mono">No daily schedules. Click "+" to add.</p>

                              ) : (

                                <table className="w-full text-xs border-collapse">

                                  <thead>

                                    <tr className="border-b border-cyber-border text-[9px] uppercase tracking-wider text-cyber-muted font-mono bg-cyber-dark bg-opacity-90">

                                      <th className="p-2 text-left">Time (12h)</th>

                                      <th className="p-2 text-center w-10">Action</th>

                                    </tr>

                                  </thead>

                                  <tbody>

                                    {selectedNode.data.parameters.calendarPatternDailyRows.map((row: any, idx: number) => (

                                      <tr key={idx} className="border-b border-cyber-border border-opacity-30 hover:bg-cyber-panel hover:bg-opacity-30 transition-colors">

                                        <td className="p-1">

                                          <div className="flex items-center space-x-1">

                                            <input

                                              type="text"

                                              placeholder="09:00 AM"

                                              value={format24toAmPmString(row.time)}

                                              onChange={(e) => {

                                                const newList = [...selectedNode.data.parameters.calendarPatternDailyRows];

                                                newList[idx] = { ...newList[idx], time: parseAmPmStringTo24(e.target.value) };

                                                updateSelectedNodeParameter('calendarPatternDailyRows', newList);

                                              }}

                                              className="bg-transparent border-none text-cyber-text text-xs focus:ring-0 focus:outline-none w-full font-mono p-0.5"

                                            />

                                            <button

                                              onClick={(e) => openClockPicker(

                                                e,

                                                row.time,

                                                (val) => {

                                                  const newList = [...selectedNode.data.parameters.calendarPatternDailyRows];

                                                  newList[idx] = { ...newList[idx], time: val };

                                                  updateSelectedNodeParameter('calendarPatternDailyRows', newList);

                                                }

                                              )}

                                              className="p-1 rounded hover:bg-cyber-dark text-cyber-neon hover:text-cyber-neon-dim transition-all cursor-pointer bg-transparent border-none"

                                              title="Open Clock Picker"

                                            >

                                              <Clock className="w-3.5 h-3.5" />

                                            </button>

                                          </div>

                                        </td>

                                        <td className="p-2 text-center">

                                          <button

                                            onClick={() => {

                                              const newList = selectedNode.data.parameters.calendarPatternDailyRows.filter((_: any, i: number) => i !== idx);

                                              updateSelectedNodeParameter('calendarPatternDailyRows', newList);

                                            }}

                                            className="text-cyber-muted hover:text-red-400 p-0.5 rounded hover:bg-cyber-dark transition-all"

                                            title="Delete pattern row"

                                          >

                                            <Trash2 className="w-3.5 h-3.5" />

                                          </button>

                                        </td>

                                      </tr>

                                    ))}

                                  </tbody>

                                </table>

                              )}

                            </div>

                          </div>

                        )}

                        {/* Sub-mode Weekly */}

                        {selectedNode.data.parameters?.calendarPatternType === 'weekly' && (

                          <div className="space-y-3">

                            <div className="flex items-center justify-between">

                              <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                                Weekly Schedule Patterns

                              </label>

                              <button

                                onClick={() => {

                                  const currentList = selectedNode.data.parameters?.calendarPatternWeeklyRows || [];

                                  updateSelectedNodeParameter('calendarPatternWeeklyRows', [...currentList, { day: 'Monday', time: '09:00' }]);

                                }}

                                className="p-1 rounded bg-cyber-dark hover:bg-cyber-panel text-cyber-neon border border-cyber-border hover:border-cyber-neon transition-all cursor-pointer flex items-center justify-center"

                                title="Add Weekly Schedule"

                              >

                                <Plus className="w-3.5 h-3.5" />

                              </button>

                            </div>



                            <div className="border border-cyber-border rounded-lg bg-cyber-dark bg-opacity-65 max-h-40 overflow-y-auto custom-scrollbar">

                              {(!selectedNode.data.parameters?.calendarPatternWeeklyRows || selectedNode.data.parameters.calendarPatternWeeklyRows.length === 0) ? (

                                <p className="text-[10px] text-cyber-muted text-center py-4 font-mono">No weekly schedules. Click "+" to add.</p>

                              ) : (

                                <table className="w-full text-xs border-collapse">

                                  <thead>

                                    <tr className="border-b border-cyber-border text-[9px] uppercase tracking-wider text-cyber-muted font-mono bg-cyber-dark bg-opacity-90">

                                      <th className="p-2 text-left">Day</th>

                                      <th className="p-2 text-left">Time (12h)</th>

                                      <th className="p-2 text-center w-10">Action</th>

                                    </tr>

                                  </thead>

                                  <tbody>

                                    {selectedNode.data.parameters.calendarPatternWeeklyRows.map((row: any, idx: number) => (

                                      <tr key={idx} className="border-b border-cyber-border border-opacity-40 hover:bg-cyber-panel hover:bg-opacity-20">

                                        <td className="p-1">

                                          <select

                                            value={row.day}

                                            onChange={(e) => {

                                              const newList = [...selectedNode.data.parameters.calendarPatternWeeklyRows];

                                              newList[idx] = { ...newList[idx], day: e.target.value };

                                              updateSelectedNodeParameter('calendarPatternWeeklyRows', newList);

                                            }}

                                            className="bg-transparent border-none text-cyber-text text-xs focus:ring-0 focus:outline-none w-full p-1 font-semibold cursor-pointer"

                                          >

                                            <option value="Monday" style={{ backgroundColor: '#0b0f19', color: '#e2e8f0' }}>Monday</option>

                                            <option value="Tuesday" style={{ backgroundColor: '#0b0f19', color: '#e2e8f0' }}>Tuesday</option>

                                            <option value="Wednesday" style={{ backgroundColor: '#0b0f19', color: '#e2e8f0' }}>Wednesday</option>

                                            <option value="Thursday" style={{ backgroundColor: '#0b0f19', color: '#e2e8f0' }}>Thursday</option>

                                            <option value="Friday" style={{ backgroundColor: '#0b0f19', color: '#e2e8f0' }}>Friday</option>

                                            <option value="Saturday" style={{ backgroundColor: '#0b0f19', color: '#e2e8f0' }}>Saturday</option>

                                            <option value="Sunday" style={{ backgroundColor: '#0b0f19', color: '#e2e8f0' }}>Sunday</option>

                                          </select>

                                        </td>

                                        <td className="p-1">

                                          <div className="flex items-center space-x-1">

                                            <input

                                              type="text"

                                              placeholder="09:00 AM"

                                              value={format24toAmPmString(row.time)}

                                              onChange={(e) => {

                                                const newList = [...selectedNode.data.parameters.calendarPatternWeeklyRows];

                                                newList[idx] = { ...newList[idx], time: parseAmPmStringTo24(e.target.value) };

                                                updateSelectedNodeParameter('calendarPatternWeeklyRows', newList);

                                              }}

                                              className="bg-transparent border-none text-cyber-text text-xs focus:ring-0 focus:outline-none w-full font-mono p-0.5"

                                            />

                                            <button

                                              onClick={(e) => openClockPicker(

                                                e,

                                                row.time,

                                                (val) => {

                                                  const newList = [...selectedNode.data.parameters.calendarPatternWeeklyRows];

                                                  newList[idx] = { ...newList[idx], time: val };

                                                  updateSelectedNodeParameter('calendarPatternWeeklyRows', newList);

                                                }

                                              )}

                                              className="p-1 rounded hover:bg-cyber-dark text-cyber-neon hover:text-cyber-neon-dim transition-all cursor-pointer bg-transparent border-none"

                                              title="Open Clock Picker"

                                            >

                                              <Clock className="w-3.5 h-3.5" />

                                            </button>

                                          </div>

                                        </td>

                                        <td className="p-2 text-center">

                                          <button

                                            onClick={() => {

                                              const newList = selectedNode.data.parameters.calendarPatternWeeklyRows.filter((_: any, i: number) => i !== idx);

                                              updateSelectedNodeParameter('calendarPatternWeeklyRows', newList);

                                            }}

                                            className="text-cyber-muted hover:text-red-400 p-0.5 rounded hover:bg-cyber-dark transition-all"

                                            title="Delete pattern row"

                                          >

                                            <Trash2 className="w-3.5 h-3.5" />

                                          </button>

                                        </td>

                                      </tr>

                                    ))}

                                  </tbody>

                                </table>

                              )}

                            </div>

                          </div>

                        )}



                        {/* Sub-mode Monthly */}

                        {selectedNode.data.parameters?.calendarPatternType === 'monthly' && (

                          <div className="space-y-3">

                            <div className="flex items-center justify-between">

                              <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                                Monthly Schedule Patterns

                              </label>

                              <button

                                onClick={() => {

                                  const currentList = selectedNode.data.parameters?.calendarPatternMonthlyRows || [];

                                  updateSelectedNodeParameter('calendarPatternMonthlyRows', [...currentList, { day: 1, time: '09:00' }]);

                                }}

                                className="p-1 rounded bg-cyber-dark hover:bg-cyber-panel text-cyber-neon border border-cyber-border hover:border-cyber-neon transition-all cursor-pointer flex items-center justify-center"

                                title="Add Monthly Schedule"

                              >

                                <Plus className="w-3.5 h-3.5" />

                              </button>

                            </div>



                            <div className="border border-cyber-border rounded-lg bg-cyber-dark bg-opacity-65 max-h-40 overflow-y-auto custom-scrollbar">

                              {(!selectedNode.data.parameters?.calendarPatternMonthlyRows || selectedNode.data.parameters.calendarPatternMonthlyRows.length === 0) ? (

                                <p className="text-[10px] text-cyber-muted text-center py-4 font-mono">No monthly schedules. Click "+" to add.</p>

                              ) : (

                                <table className="w-full text-xs border-collapse">

                                  <thead>

                                    <tr className="border-b border-cyber-border text-[9px] uppercase tracking-wider text-cyber-muted font-mono bg-cyber-dark bg-opacity-90">

                                      <th className="p-2 text-left">Day of Month</th>

                                      <th className="p-2 text-left">Time (12h)</th>

                                      <th className="p-2 text-center w-10">Action</th>

                                    </tr>

                                  </thead>

                                  <tbody>

                                    {selectedNode.data.parameters.calendarPatternMonthlyRows.map((row: any, idx: number) => (

                                      <tr key={idx} className="border-b border-cyber-border border-opacity-40 hover:bg-cyber-panel hover:bg-opacity-20">

                                        <td className="p-1">

                                          <div className="flex items-center justify-between px-1">

                                            <input

                                              type="text"

                                              value={row.day}

                                              onChange={(e) => {

                                                const val = Math.max(1, Math.min(33, parseInt(e.target.value) || 1));

                                                const newList = [...selectedNode.data.parameters.calendarPatternMonthlyRows];

                                                newList[idx] = { ...newList[idx], day: val };

                                                updateSelectedNodeParameter('calendarPatternMonthlyRows', newList);

                                              }}

                                              onFocus={(e) => {

                                                const rect = e.currentTarget.getBoundingClientRect();

                                                const clickEvent = {

                                                  currentTarget: e.currentTarget,

                                                  clientX: rect.left,

                                                  clientY: rect.top

                                                } as unknown as React.MouseEvent;

                                                

                                                openDayPopover(clickEvent, row.day, (val) => {

                                                  const newList = [...selectedNode.data.parameters.calendarPatternMonthlyRows];

                                                  newList[idx] = { ...newList[idx], day: val };

                                                  updateSelectedNodeParameter('calendarPatternMonthlyRows', newList);

                                                });

                                              }}

                                              className="bg-transparent border-none text-cyber-text text-xs focus:ring-0 focus:outline-none w-10 p-0.5 font-bold font-mono text-center cursor-pointer"

                                            />

                                            <button

                                              onClick={(e) => openDayPopover(e, row.day, (val) => {

                                                const newList = [...selectedNode.data.parameters.calendarPatternMonthlyRows];

                                                newList[idx] = { ...newList[idx], day: val };

                                                updateSelectedNodeParameter('calendarPatternMonthlyRows', newList);

                                              })}

                                              className="p-1 rounded hover:bg-cyber-dark text-cyber-neon hover:text-cyber-neon-dim transition-all cursor-pointer bg-transparent border-none"

                                              title="Choose Day"

                                            >

                                              <Plus className="w-3.5 h-3.5" />

                                            </button>

                                          </div>

                                        </td>

                                        <td className="p-1">

                                          <div className="flex items-center space-x-1">

                                            <input

                                              type="text"

                                              placeholder="09:00 AM"

                                              value={format24toAmPmString(row.time)}

                                              onChange={(e) => {

                                                const newList = [...selectedNode.data.parameters.calendarPatternMonthlyRows];

                                                newList[idx] = { ...newList[idx], time: parseAmPmStringTo24(e.target.value) };

                                                updateSelectedNodeParameter('calendarPatternMonthlyRows', newList);

                                              }}

                                              className="bg-transparent border-none text-cyber-text text-xs focus:ring-0 focus:outline-none w-full font-mono p-0.5"

                                            />

                                            <button

                                              onClick={(e) => openClockPicker(

                                                e,

                                                row.time,

                                                (val) => {

                                                  const newList = [...selectedNode.data.parameters.calendarPatternMonthlyRows];

                                                  newList[idx] = { ...newList[idx], time: val };

                                                  updateSelectedNodeParameter('calendarPatternMonthlyRows', newList);

                                                }

                                              )}

                                              className="p-1 rounded hover:bg-cyber-dark text-cyber-neon hover:text-cyber-neon-dim transition-all cursor-pointer bg-transparent border-none"

                                              title="Open Clock Picker"

                                            >

                                              <Clock className="w-3.5 h-3.5" />

                                            </button>

                                          </div>

                                        </td>

                                        <td className="p-2 text-center">

                                          <button

                                            onClick={() => {

                                              const newList = selectedNode.data.parameters.calendarPatternMonthlyRows.filter((_: any, i: number) => i !== idx);

                                              updateSelectedNodeParameter('calendarPatternMonthlyRows', newList);

                                            }}

                                            className="text-cyber-muted hover:text-red-400 p-0.5 rounded hover:bg-cyber-dark transition-all"

                                            title="Delete pattern row"

                                          >

                                            <Trash2 className="w-3.5 h-3.5" />

                                          </button>

                                        </td>

                                      </tr>

                                    ))}

                                  </tbody>

                                </table>

                              )}

                            </div>

                          </div>

                        )}

                      </div>

                    )}

                  </div>
      )}
    </>
  );
}
