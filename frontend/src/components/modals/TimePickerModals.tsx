import React, { useState, useEffect } from 'react';

export interface TimePickerModalsProps {
  isClockOpen: boolean;
  setIsClockOpen: React.Dispatch<React.SetStateAction<boolean>>;
  clockTimeValue: string;
  setClockTimeValue: React.Dispatch<React.SetStateAction<string>>;
  clockPosition: { top: number; left: number } | null;
  clockOnSaveCallback: ((time: string) => void) | null;

  isDayPopoverOpen: boolean;
  setIsDayPopoverOpen: React.Dispatch<React.SetStateAction<boolean>>;
  dayPopoverValue: number;
  setDayPopoverValue: React.Dispatch<React.SetStateAction<number>>;
  dayPopoverPosition: { top: number; left: number } | null;
  dayPopoverOnSaveCallback: ((day: number) => void) | null;
}

export default function TimePickerModals({
  isClockOpen,
  setIsClockOpen,
  clockTimeValue,
  setClockTimeValue,
  clockPosition,
  clockOnSaveCallback,
  isDayPopoverOpen,
  setIsDayPopoverOpen,
  dayPopoverValue,
  setDayPopoverValue,
  dayPopoverPosition,
  dayPopoverOnSaveCallback,
}: TimePickerModalsProps) {
  const [clockActiveTab, setClockActiveTab] = useState<'hour' | 'minute'>('hour');
  const [isDraggingClock, setIsDraggingClock] = useState(false);
  const [clockDragAngle, setClockDragAngle] = useState<number | null>(null);

  useEffect(() => {
    if (isClockOpen) {
      setClockActiveTab('hour');
    }
  }, [isClockOpen]);

  const convert24to12 = (time24: string): { hour12: number; minute: number; amPm: 'AM' | 'PM' } => {
    const [hStr, mStr] = (time24 || "09:00").split(':');
    const h24 = parseInt(hStr) || 0;
    const minute = parseInt(mStr) || 0;
    const amPm = h24 >= 12 ? 'PM' : 'AM';
    let hour12 = h24 % 12;
    if (hour12 === 0) hour12 = 12;
    return { hour12, minute, amPm };
  };

  const convert12to24 = (hour12: number, minute: number, amPm: 'AM' | 'PM'): string => {
    let h24 = hour12 % 12;
    if (amPm === 'PM') {
      h24 += 12;
    }
    return `${String(h24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  };

  const handleClockInteraction = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const dx = px - 110;
    const dy = py - 110;
    let angle = Math.atan2(dy, dx) + Math.PI / 2; // 0 is top
    if (angle < 0) angle += 2 * Math.PI;

    setClockDragAngle(angle);

    const { hour12, minute, amPm } = convert24to12(clockTimeValue);

    if (clockActiveTab === 'hour') {
      let hr = Math.round((angle / (2 * Math.PI)) * 12) % 12;
      if (hr === 0) hr = 12;
      setClockTimeValue(convert12to24(hr, minute, amPm));
    } else {
      const min = Math.round((angle / (2 * Math.PI)) * 60) % 60;
      setClockTimeValue(convert12to24(hour12, min, amPm));
    }
  };

  const handleClockRelease = () => {
    if (!isDraggingClock) return;
    setIsDraggingClock(false);
    setClockDragAngle(null);
    if (clockActiveTab === 'hour') {
      setTimeout(() => setClockActiveTab('minute'), 250);
    }
  };

  return (
    <>

      {/* Premium Neon Clock Picker Modal (Image 4/Sleep Clock Style) */}

      {isClockOpen && (() => {

        const { hour12, minute, amPm } = convert24to12(clockTimeValue);

        const currentAngle = clockDragAngle !== null 

          ? clockDragAngle 

          : (clockActiveTab === 'hour'

              ? ((hour12 % 12) / 12) * 2 * Math.PI

              : (minute / 60) * 2 * Math.PI);



        const getProximity = (numAngle: number) => {

          let diff = Math.abs(numAngle - currentAngle) % (2 * Math.PI);

          if (diff > Math.PI) {

            diff = 2 * Math.PI - diff;

          }

          const maxDiff = Math.PI / 4;

          return Math.max(0, 1 - diff / maxDiff);

        };

        

        return (

          <>

            {/* Click away backdrop */}

            <div className="fixed inset-0 z-[9998] bg-transparent" onClick={() => setIsClockOpen(false)} />

            

            {/* Positioned Popover */}

            <div

              style={{

                position: 'fixed',

                top: `${clockPosition?.top || 100}px`,

                left: `${clockPosition?.left || 100}px`,

                zIndex: 9999

              }}

              className="bg-cyber-panel border border-cyber-neon rounded-2xl w-80 p-5 space-y-6 select-none animate-fadeIn"

            >

              

              {/* Modal Header */}

              <div className="text-center space-y-1">

                <h3 className="text-xs font-bold text-cyber-muted uppercase tracking-wider">Set Schedule Time</h3>

                

                {/* Large Time Display / Keyboard inputs + AM/PM Selector */}

                <div className="flex items-center justify-center space-x-3 pt-2">

                  <div className="flex items-center space-x-1.5">

                    <input

                      type="text"

                      maxLength={2}

                      value={String(hour12).padStart(2, '0')}

                      onChange={(e) => {

                        const hr = Math.max(1, Math.min(12, parseInt(e.target.value.replace(/\D/g, '')) || 1));

                        setClockTimeValue(convert12to24(hr, minute, amPm));

                      }}

                      onFocus={() => setClockActiveTab('hour')}

                      className="w-12 text-2xl font-bold font-mono text-center bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none rounded-lg text-cyber-text p-1"

                      placeholder="09"

                    />

                    <span className="text-xl font-bold text-cyber-muted font-mono">:</span>

                    <input

                      type="text"

                      maxLength={2}

                      value={String(minute).padStart(2, '0')}

                      onChange={(e) => {

                        const min = Math.max(0, Math.min(59, parseInt(e.target.value.replace(/\D/g, '')) || 0));

                        setClockTimeValue(convert12to24(hour12, min, amPm));

                      }}

                      onFocus={() => setClockActiveTab('minute')}

                      className="w-12 text-2xl font-bold font-mono text-center bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none rounded-lg text-cyber-text p-1"

                      placeholder="00"

                    />

                  </div>



                  {/* AM/PM switcher */}

                  <div className="flex bg-cyber-dark border border-cyber-border rounded-lg p-0.5">

                    <button

                      onClick={() => setClockTimeValue(convert12to24(hour12, minute, 'AM'))}

                      className={`px-2.5 py-1 text-[9px] font-bold rounded transition-all cursor-pointer ${

                        amPm === 'AM' ? 'bg-cyber-neon text-cyber-dark font-black' : 'text-cyber-muted hover:text-cyber-text'

                      }`}

                    >

                      AM

                    </button>

                    <button

                      onClick={() => setClockTimeValue(convert12to24(hour12, minute, 'PM'))}

                      className={`px-2.5 py-1 text-[9px] font-bold rounded transition-all cursor-pointer ${

                        amPm === 'PM' ? 'bg-cyber-neon text-cyber-dark font-black' : 'text-cyber-muted hover:text-cyber-text'

                      }`}

                    >

                      PM

                    </button>

                  </div>

                </div>



                {/* Tab Selector (Hour vs Minute) */}

                <div className="flex justify-center space-x-4 pt-2">

                  <button

                    onClick={() => setClockActiveTab('hour')}

                    className={`text-[10px] font-bold uppercase tracking-wider pb-1 border-b-2 transition-all cursor-pointer ${

                      clockActiveTab === 'hour' ? 'text-cyber-neon border-cyber-neon' : 'text-cyber-muted border-transparent hover:text-cyber-text'

                    }`}

                  >

                    Hours

                  </button>

                  <button

                    onClick={() => setClockActiveTab('minute')}

                    className={`text-[10px] font-bold uppercase tracking-wider pb-1 border-b-2 transition-all cursor-pointer ${

                      clockActiveTab === 'minute' ? 'text-cyber-neon border-cyber-neon' : 'text-cyber-muted border-transparent hover:text-cyber-text'

                    }`}

                  >

                    Minutes

                  </button>

                </div>

              </div>



              {/* Circular Clock Face */}

              <div className="flex justify-center select-none relative">

                <svg

                  width="220"

                  height="220"

                  className="cursor-pointer overflow-visible"

                  onMouseDown={(e) => {

                    setIsDraggingClock(true);

                    handleClockInteraction(e);

                  }}

                  onMouseMove={(e) => {

                    if (isDraggingClock) {

                      handleClockInteraction(e);

                    }

                  }}

                  onMouseUp={handleClockRelease}

                  onMouseLeave={handleClockRelease}

                >

                  {/* Dial background circle */}

                  <circle cx="110" cy="110" r="95" fill="#121216" stroke="#2A2A35" strokeWidth="2.5" />

                  <circle cx="110" cy="110" r="70" fill="transparent" stroke="#2a2a35" strokeWidth="1" strokeDasharray="3,3" />



                  {/* Draw clock hand */}

                  {(() => {

                    const angle = clockDragAngle !== null

                      ? clockDragAngle - Math.PI / 2

                      : (clockActiveTab === 'hour'

                        ? (hour12 / 12) * 2 * Math.PI - Math.PI / 2

                        : (minute / 60) * 2 * Math.PI - Math.PI / 2);



                    const handRadius = 75;

                    const hx = 110 + handRadius * Math.cos(angle);

                    const hy = 110 + handRadius * Math.sin(angle);



                    return (

                      <>

                        {/* Radial hand line */}

                        <line x1="110" y1="110" x2={hx} y2={hy} stroke="#D4FF3A" strokeWidth="2" />

                        {/* Glowing pointer circle */}

                        <circle cx={hx} cy={hy} r="14" fill="#D4FF3A" opacity="0.25" />

                        <circle cx={hx} cy={hy} r="4" fill="#D4FF3A" />

                        <circle cx="110" cy="110" r="4.5" fill="#D4FF3A" />

                      </>

                    );

                  })()}



                  {/* Render Hour numbers (1 to 12) or Minute numbers (0 to 55) */}

                  {clockActiveTab === 'hour' ? (

                    // Draw 12 hours around the clock dial

                    [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((hr) => {

                      const angle = (hr / 12) * 2 * Math.PI - Math.PI / 2;

                      const numAngle = ((hr % 12) / 12) * 2 * Math.PI;

                      const prox = getProximity(numAngle);

                      

                      const radius = 75 + 5 * prox;

                      const tx = 110 + radius * Math.cos(angle);

                      const ty = 110 + radius * Math.sin(angle);

                      const isSelected = hour12 === hr;



                      return (

                        <text

                          key={hr}

                          x={tx}

                          y={ty + 4}

                          textAnchor="middle"

                          style={{

                            transform: `scale(${1 + 0.25 * prox})`,

                            transformOrigin: `${tx}px ${ty}px`

                          }}

                          className={`text-[10px] font-mono font-bold select-none cursor-pointer transition-all ${

                            isSelected ? 'fill-cyber-neon' : 'fill-cyber-muted hover:fill-cyber-text'

                          }`}

                        >

                          {hr}

                        </text>

                      );

                    })

                  ) : (

                    // Draw minutes around the clock dial (0, 5, 10, ..., 55)

                    [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((min) => {

                      const angle = (min / 60) * 2 * Math.PI - Math.PI / 2;

                      const numAngle = (min / 60) * 2 * Math.PI;

                      const prox = getProximity(numAngle);

                      

                      const radius = 75 + 5 * prox;

                      const tx = 110 + radius * Math.cos(angle);

                      const ty = 110 + radius * Math.sin(angle);

                      const isSelected = minute === min;



                      return (

                        <text

                          key={min}

                          x={tx}

                          y={ty + 4}

                          textAnchor="middle"

                          style={{

                            transform: `scale(${1 + 0.25 * prox})`,

                            transformOrigin: `${tx}px ${ty}px`

                          }}

                          className={`text-[10px] font-mono font-bold select-none cursor-pointer transition-all ${

                            isSelected ? 'fill-cyber-neon' : 'fill-cyber-muted hover:fill-cyber-text'

                          }`}

                        >

                          {String(min).padStart(2, '0')}

                        </text>

                      );

                    })

                  )}

                </svg>

              </div>



              {/* Modal Actions */}

              <div className="flex items-center space-x-3 pt-2">

                <button

                  onClick={() => setIsClockOpen(false)}

                  className="flex-1 py-2 rounded-xl bg-cyber-dark hover:bg-cyber-panel border border-cyber-border text-cyber-muted hover:text-cyber-text text-xs font-bold transition-all cursor-pointer text-center"

                >

                  Cancel

                </button>

                <button

                  onClick={() => {

                    if (clockOnSaveCallback) {

                      clockOnSaveCallback(clockTimeValue);

                    }

                    setIsClockOpen(false);

                  }}

                  className="flex-1 py-2 rounded-xl bg-cyber-neon hover:shadow-neon-glow text-cyber-dark text-xs font-bold transition-all cursor-pointer text-center"

                >

                  Confirm

                </button>

              </div>



            </div>

          </>

        );

      })()}



      {/* Day of Month Selector Popover (Grid 1-33) */}

      {isDayPopoverOpen && (

        <>

          {/* Click away backdrop */}

          <div className="fixed inset-0 z-[9998] bg-transparent" onClick={() => setIsDayPopoverOpen(false)} />

          

          {/* Positioned Popover */}

          <div

            style={{

              position: 'fixed',

              top: `${dayPopoverPosition?.top || 100}px`,

              left: `${dayPopoverPosition?.left || 100}px`,

              zIndex: 9999

            }}

            className="bg-cyber-panel border border-cyber-neon rounded-2xl w-60 p-4 space-y-4 select-none animate-fadeIn"

          >

            <div className="text-center">

              <h3 className="text-[10px] font-bold text-cyber-muted uppercase tracking-wider">Select Day of Month</h3>

            </div>



            {/* Grid of numbers 1 to 33 */}

            <div className="grid grid-cols-6 gap-1.5 justify-items-center">

              {Array.from({ length: 33 }, (_, i) => i + 1).map((d) => {

                const isSelected = dayPopoverValue === d;

                return (

                  <button

                    key={d}

                    onClick={() => {

                      setDayPopoverValue(d);

                      if (dayPopoverOnSaveCallback) {

                        dayPopoverOnSaveCallback(d);

                      }

                      setIsDayPopoverOpen(false);

                    }}

                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold border transition-all cursor-pointer ${

                      isSelected

                        ? 'bg-cyber-neon text-cyber-dark border-cyber-neon shadow-neon-glow'

                        : 'bg-cyber-dark border-cyber-border text-cyber-text hover:border-cyber-neon hover:text-cyber-neon'

                    }`}

                  >

                    {d}

                  </button>

                );

              })}

            </div>



            <div className="flex justify-end pt-1">

              <button

                onClick={() => setIsDayPopoverOpen(false)}

                className="w-full py-1.5 rounded-lg bg-cyber-dark hover:bg-cyber-panel border border-cyber-border text-cyber-muted hover:text-cyber-text text-[10px] font-bold transition-all cursor-pointer text-center"

              >

                Cancel

              </button>

            </div>



          </div>

        </>

      )}
    </>
  );
}
