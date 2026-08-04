import { memo } from 'react';

interface ContainerNodeProps {
  data: {
    name: string;
    titleColor?: string;
  };
}

const ContainerNode = ({ data }: ContainerNodeProps) => {
  return (
    <div className="w-full h-full min-h-[120px] bg-[#111218] bg-opacity-40 border border-[#5C5C70] rounded-2xl flex flex-col shadow-lg overflow-hidden pointer-events-none">
      {/* Title Header */}
      <div className="px-4 py-2 border-b border-cyber-border border-opacity-40 bg-[#0C0C0E] bg-opacity-70 select-none">
        <h3 
          className="text-[10px] font-extrabold uppercase tracking-widest text-center" 
          style={{ color: data.titleColor || '#D4FF3A' }}
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
