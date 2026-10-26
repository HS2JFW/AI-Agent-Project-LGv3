import { memo } from 'react';

interface ContainerNodeProps {
  data: {
    name: string;
    titleColor?: string;
  };
}

const ContainerNode = ({ data }: ContainerNodeProps) => {
  return (
    <div className="w-full h-full min-h-[120px] bg-slate-100/50 border border-slate-300/70 rounded-2xl flex flex-col shadow-[0_4px_16px_rgba(30,60,110,0.04)] overflow-hidden pointer-events-none">
      {/* Title Header */}
      <div className="px-4 py-2 border-b border-slate-200/70 bg-white/80 backdrop-blur-sm select-none">
        <h3 
          className="text-[11px] font-black uppercase tracking-wider text-center text-slate-700" 
          style={{ color: data.titleColor || '#1A6AFF' }}
        >
          {data.name}
        </h3>
      </div>
      
      {/* Empty body content where relative child nodes sit */}
      <div className="flex-1" />
    </div>
  );
};

export default memo(ContainerNode);
