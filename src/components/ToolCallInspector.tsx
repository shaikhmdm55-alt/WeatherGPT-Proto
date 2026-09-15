import React, { useState } from 'react';
import { ToolCallRecord } from '../types';
import { Terminal, ChevronDown, ChevronUp, CheckCircle2, Cpu, Wrench } from 'lucide-react';

interface ToolCallInspectorProps {
  toolCalls: ToolCallRecord[];
}

export const ToolCallInspector: React.FC<ToolCallInspectorProps> = ({ toolCalls }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Autonomous Tool Execution Inspector (RAG Grounding)
              <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                {toolCalls.length} executed
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Functions called to enforce zero-hallucination meteorological truth
            </p>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded-lg border border-slate-700 transition"
        >
          <span>{expanded ? 'Collapse Log' : 'View Tool Payloads'}</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-2 mt-3">
        {toolCalls.map((tc) => (
          <div
            key={tc.id}
            className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono"
          >
            <Wrench className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-emerald-400 font-bold">{tc.toolName}</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">{tc.executionTimeMs}ms</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        ))}
      </div>

      {/* Expanded JSON Inspector */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
          {toolCalls.map((tc, idx) => (
            <div key={tc.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-white font-bold">{tc.toolName}</span>
                </div>
                <span className="text-[10px] text-slate-500">{tc.timestamp}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                <div>
                  <span className="text-[10px] uppercase text-slate-500 block mb-1">Parameters (Arguments):</span>
                  <pre className="bg-slate-900 p-2 rounded-lg text-amber-300 text-[11px] overflow-x-auto border border-slate-800">
                    {JSON.stringify(tc.parameters, null, 2)}
                  </pre>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-500 block mb-1">Return Ground-Truth Output:</span>
                  <pre className="bg-slate-900 p-2 rounded-lg text-emerald-300 text-[11px] overflow-x-auto border border-slate-800">
                    {JSON.stringify(tc.output, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
