import { memo } from 'react';
import { NodeResizer, type NodeProps } from 'reactflow';

interface ContainerData {
  name: string;
  titleColor?: string;
}

const ContainerNode = ({ data, selected }: NodeProps<ContainerData>) => {
  return (
    <div
      className={`w-full h-full min-h-[120px] rounded-xl flex flex-col transition-all border-2 border-dashed ${
        selected
          ? 'border-zinc-900 dark:border-zinc-200 bg-zinc-100/60 dark:bg-zinc-900/60 ring-2 ring-zinc-400/20 shadow-md'
          : 'border-zinc-300 dark:border-zinc-700/80 bg-zinc-50/50 dark:bg-[#121215]/50 hover:border-zinc-400 dark:hover:border-zinc-600 shadow-xs'
      } relative`}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={200}
        minHeight={120}
        handleClassName="w-2.5 h-2.5 bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-100 rounded-sm"
        lineClassName="border-zinc-900 dark:border-zinc-100"
      />

      {/* Title Header */}
      <div className="px-3.5 py-2 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm rounded-t-xl select-none flex items-center justify-between">
        <h3
          className="text-[11px] font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 truncate pr-2"
          style={{ color: data?.titleColor }}
        >
          {data?.name || 'Group Container'}
        </h3>
        <span className="text-[9px] uppercase tracking-wider font-semibold text-zinc-400 dark:text-zinc-500 font-mono shrink-0">
          Container
        </span>
      </div>

      {/* Body content */}
      <div className="flex-1" />
    </div>
  );
};

export default memo(ContainerNode);
