import React, { useState } from 'react';
import {
  Info,
  Play,
  FileSpreadsheet,
  Zap,
  Trash2,
  Bot,
  Database,
  Plus,
  Layers,
  Copy,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export interface BigDataInspectorSectionProps {
  selectedNode: any;
  updateSelectedNodeParameter: (field: string, value: any) => void;
  handleDrillDownContainer: (containerNode: any) => void;
  isSelectedPolarsConverterNode: boolean;
  isSelectedDuckDbNode: boolean;
  isSelectedBigDataAnalystNode: boolean;
  isSelectedBigDataContainerNode: boolean;
  backendUrl?: string;
}

export const BigDataInspectorSection: React.FC<BigDataInspectorSectionProps> = ({
  selectedNode,
  updateSelectedNodeParameter,
  handleDrillDownContainer,
  isSelectedPolarsConverterNode,
  isSelectedDuckDbNode,
  isSelectedBigDataAnalystNode,
  isSelectedBigDataContainerNode,
  backendUrl,
}) => {
  const BACKEND_URL = backendUrl || import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

  // Big Data & Analytics local inspector states
  const [isConvertingParquet, setIsConvertingParquet] = useState(false);
  const [conversionStatusMsg, setConversionStatusMsg] = useState<string | null>(null);
  const [isExecutingDuckDb, setIsExecutingDuckDb] = useState(false);
  const [duckdbQueryResult, setDuckdbQueryResult] = useState<any>(null);
  const [duckdbQueryError, setDuckdbQueryError] = useState<string | null>(null);
  const [isGeneratingTeam, setIsGeneratingTeam] = useState(false);
  const [activeBigDataTab, setActiveBigDataTab] = useState<'auto' | 'manual'>('auto');
  const [duckdbViewMode, setDuckdbViewMode] = useState<'table' | 'json'>('table');

  const handleConvertParquetClick = async () => {

    if (!selectedNode) return;

    setIsConvertingParquet(true);

    setConversionStatusMsg('Converting Excel/CSV files to Parquet via Polars (Rust)...');

    try {

      const params = selectedNode.data.parameters || {};

      const res = await fetch(`${BACKEND_URL}/api/analytics/convert-parquet`, {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({

          source_type: params.sourceType || 'upload',

          file_paths: params.sourceFiles || [],

          file_pattern: params.filePattern || '*.xlsx, *.csv',

          sheet_name: params.sheetName || 'Sheet1',

          compression: params.compression || 'snappy',

          chunk_size: params.chunkSize || 50000,

          auto_type_inference: params.autoTypeInference !== false,

          null_handling: params.nullHandling || 'keep',

          output_dir: params.outputParquetPath || './workflow_inputs/parquet_cache'

        })

      });

      const data = await res.json();

      if (data.status === 'success') {

        const rowCount = data.results?.reduce((sum: number, r: any) => sum + (r.rows || 0), 0) || 0;

        setConversionStatusMsg(`Converted ${data.results?.length || 0} file(s) successfully (${rowCount.toLocaleString()} rows).`);

        updateSelectedNodeParameter('convertedFiles', data.results || []);

        updateSelectedNodeParameter('catalog', data.catalog || {});

      } else {

        setConversionStatusMsg(`Conversion Failed: ${data.message || 'Error occurred'}`);

      }

    } catch (err: any) {

      setConversionStatusMsg(`Network Error: ${err.message || 'Failed to call converter'}`);

    } finally {

      setIsConvertingParquet(false);

    }

  };



  const handleExecuteDuckDbQueryClick = async () => {

    if (!selectedNode) return;

    setIsExecutingDuckDb(true);

    setDuckdbQueryError(null);

    try {

      const params = selectedNode.data.parameters || {};

      let timeoutSec = 10;

      if (typeof params.statementTimeout === 'string') {

        const parsed = parseInt(params.statementTimeout.replace(/[^0-9]/g, ''), 10);

        if (!isNaN(parsed) && parsed > 0) timeoutSec = parsed;

      }

      const res = await fetch(`${BACKEND_URL}/api/analytics/duckdb-query`, {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({

          query: params.sqlQuery || "SELECT * FROM read_parquet('workflow_inputs/parquet_cache/*.parquet') LIMIT 10",

          timeout: timeoutSec,

          max_rows: Number(params.maxResultRows) || 100

        })

      });

      const data = await res.json();

      if (data.status === 'success') {

        setDuckdbQueryResult(data);

        updateSelectedNodeParameter('queryResults', data.data);

        updateSelectedNodeParameter('executionTimeMs', data.execution_time_ms);

      } else {

        setDuckdbQueryError(data.message || 'DuckDB execution failed');

        setDuckdbQueryResult(null);

      }

    } catch (err: any) {

      setDuckdbQueryError(err.message || 'Execution error');

      setDuckdbQueryResult(null);

    } finally {

      setIsExecutingDuckDb(false);

    }

  };



  const handleAutoGenerateTeamClick = async () => {

    if (!selectedNode) return;

    setIsGeneratingTeam(true);

    try {

      const params = selectedNode.data.parameters || {};

      const res = await fetch(`${BACKEND_URL}/api/analytics/auto-team-planner`, {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({

          objective: params.businessObjective || 'วิเคราะห์ยอดขายและผลประกอบการ หาแนวโน้มสำคัญและจุดผิดปกติ (Anomalies)',

          catalog: params.catalog || {}

        })

      });

      const data = await res.json();

      if (data.status === 'success' && Array.isArray(data.team)) {

        updateSelectedNodeParameter('team', data.team);

        updateSelectedNodeParameter('teamRationale', data.rationale);

      }

    } catch (err) {

      console.error('Failed to auto plan team:', err);

    } finally {

      setIsGeneratingTeam(false);

    }

  };



  if (!isSelectedPolarsConverterNode && !isSelectedDuckDbNode && !isSelectedBigDataAnalystNode && !isSelectedBigDataContainerNode) {
    return null;
  }

  return (
    <>
                {/* 1. Polars Parquet Converter Inspector */}

                {isSelectedPolarsConverterNode && (

                  <div className="space-y-4 pt-3 border-t border-cyber-border">

                    <div className="p-3 bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent rounded-xl border border-amber-500/30">

                      <div className="flex items-center space-x-2">

                        <Zap className="w-4 h-4 text-amber-400" />

                        <span className="text-xs font-bold text-amber-300">⚡ Polars (Rust Engine) Converter</span>

                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-[9px] text-amber-300 font-mono font-bold">Fast SIMD</span>

                      </div>

                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">

                        อ่าน Excel (.xlsx, .xls) และ CSV ขนาดใหญ่หลายไฟล์คู่ขนาน แปลงและบีบอัดเป็น Parquet ความเร็วสูงพิเศษ

                      </p>

                    </div>



                    {/* Source Type Selector */}

                    <div className="space-y-1.5">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        Input Source Mode

                      </label>

                      <select

                        value={selectedNode.data.parameters?.sourceType || 'upload'}

                        onChange={(e) => updateSelectedNodeParameter('sourceType', e.target.value)}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-amber-400 focus:outline-none py-2 px-3 rounded-lg text-cyber-text"

                      >

                        <option value="upload">Direct File Upload (Excel / CSV Files)</option>

                        <option value="local_dir">Local Directory Path</option>

                        <option value="upstream">Upstream Node Data Pipeline</option>

                      </select>

                    </div>



                    {/* Direct File Upload Dropzone */}

                    {selectedNode.data.parameters?.sourceType === 'upload' && (

                      <div className="space-y-2">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          Upload Excel / CSV Files

                        </label>

                        <div className="relative border-2 border-dashed border-amber-500/40 hover:border-amber-400 rounded-xl p-4 bg-amber-500/5 transition-all text-center group cursor-pointer">

                          <input

                            type="file"

                            multiple

                            accept=".xlsx,.xls,.csv"

                            onChange={async (e) => {

                              const files = e.target.files;

                              if (!files || files.length === 0) return;

                              const formData = new FormData();

                              Array.from(files).forEach((f) => formData.append('files', f));

                              formData.append('compression', selectedNode.data.parameters?.compression || 'snappy');

                              formData.append('chunk_size', String(selectedNode.data.parameters?.chunkSize || 50000));

                              setIsConvertingParquet(true);

                              setConversionStatusMsg(`Uploading & converting ${files.length} file(s) with Polars...`);

                              try {

                                const res = await fetch(`${BACKEND_URL}/api/analytics/convert-parquet`, {

                                  method: 'POST',

                                  body: formData,

                                });

                                const data = await res.json();

                                if (data.status === 'success') {

                                  const totalRows = (data.results || []).reduce((acc: number, cur: any) => acc + (cur.rows || 0), 0);

                                  setConversionStatusMsg(`Converted ${data.results?.length || 0} file(s) successfully (${totalRows.toLocaleString()} rows).`);

                                  updateSelectedNodeParameter('convertedFiles', data.results || []);

                                  updateSelectedNodeParameter('catalog', data.catalog || {});

                                } else {

                                  setConversionStatusMsg(`Error: ${data.message || 'Upload conversion failed'}`);

                                }

                              } catch (err: any) {

                                setConversionStatusMsg(`Upload Error: ${err.message}`);

                              } finally {

                                setIsConvertingParquet(false);

                              }

                            }}

                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"

                          />

                          <FileSpreadsheet className="w-8 h-8 mx-auto text-amber-400 mb-1 group-hover:scale-110 transition-transform" />

                          <p className="text-xs font-semibold text-slate-300">คลิกหรือลากไฟล์ Excel / CSV มาวางที่นี่</p>

                          <p className="text-[10px] text-slate-400 mt-0.5">รองรับ .xlsx, .xls, .csv ขนาดใหญ่หลายไฟล์พร้อมกัน</p>

                        </div>

                      </div>

                    )}



                    {/* File Pattern & Sheet Name */}

                    <div className="grid grid-cols-2 gap-2">

                      <div className="space-y-1">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          File Pattern

                        </label>

                        <input

                          type="text"

                          value={selectedNode.data.parameters?.filePattern || '*.xlsx, *.csv'}

                          onChange={(e) => updateSelectedNodeParameter('filePattern', e.target.value)}

                          className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-amber-400 py-2 px-2.5 rounded-lg text-cyber-text font-mono"

                          placeholder="*.xlsx, *.csv"

                        />

                      </div>

                      <div className="space-y-1">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          Sheet Selector

                        </label>

                        <input

                          type="text"

                          value={selectedNode.data.parameters?.sheetName || 'Sheet1'}

                          onChange={(e) => updateSelectedNodeParameter('sheetName', e.target.value)}

                          className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-amber-400 py-2 px-2.5 rounded-lg text-cyber-text font-mono"

                          placeholder="Sheet1"

                        />

                      </div>

                    </div>



                    {/* Compression & Chunk Size */}

                    <div className="grid grid-cols-2 gap-2">

                      <div className="space-y-1">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          Compression

                        </label>

                        <select

                          value={selectedNode.data.parameters?.compression || 'snappy'}

                          onChange={(e) => updateSelectedNodeParameter('compression', e.target.value)}

                          className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-amber-400 py-2 px-2 rounded-lg text-cyber-text"

                        >

                          <option value="snappy">Snappy (เร็วสุด)</option>

                          <option value="zstd">ZSTD (เล็กสุด)</option>

                          <option value="gzip">GZIP (มาตรฐาน)</option>

                        </select>

                      </div>

                      <div className="space-y-1">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          Chunk Size (Rows)

                        </label>

                        <input

                          type="number"

                          value={selectedNode.data.parameters?.chunkSize || 50000}

                          onChange={(e) => updateSelectedNodeParameter('chunkSize', Number(e.target.value))}

                          className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-amber-400 py-2 px-2.5 rounded-lg text-cyber-text font-mono"

                          step={10000}

                        />

                      </div>

                    </div>



                    {/* Output Parquet Path */}

                    <div className="space-y-1.5">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        Output Parquet Cache Directory

                      </label>

                      <input

                        type="text"

                        value={selectedNode.data.parameters?.outputParquetPath || './workflow_inputs/parquet_cache'}

                        onChange={(e) => updateSelectedNodeParameter('outputParquetPath', e.target.value)}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-amber-400 py-2 px-3 rounded-lg text-cyber-text font-mono"

                      />

                    </div>



                    {/* Action Convert Button */}

                    <button

                      onClick={handleConvertParquetClick}

                      disabled={isConvertingParquet}

                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"

                    >

                      {isConvertingParquet ? (

                        <>

                          <div className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />

                          <span>Converting with Polars...</span>

                        </>

                      ) : (

                        <>

                          <Zap className="w-3.5 h-3.5 fill-slate-900" />

                          <span>Run Parquet Conversion</span>

                        </>

                      )}

                    </button>



                    {conversionStatusMsg && (

                      <div className="p-2.5 rounded-lg bg-cyber-dark border border-cyber-border text-[11px] text-amber-300 font-mono">

                        {conversionStatusMsg}

                      </div>

                    )}



                    {/* Converted Files List & Schema Details */}

                    {Array.isArray(selectedNode.data.parameters?.convertedFiles) && selectedNode.data.parameters.convertedFiles.length > 0 && (

                      <div className="space-y-2 pt-2 border-t border-cyber-border">

                        <div className="flex items-center justify-between">

                          <label className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">

                            Converted Parquet Catalog ({selectedNode.data.parameters.convertedFiles.length} files)

                          </label>

                        </div>

                        <div className="space-y-1.5 max-h-48 overflow-y-auto">

                          {selectedNode.data.parameters.convertedFiles.map((f: any, idx: number) => (

                            <div key={idx} className="p-2 rounded bg-cyber-dark border border-cyber-border text-xs flex flex-col space-y-1">

                              <div className="flex items-center justify-between">

                                <span className="font-semibold text-slate-200 truncate" title={f.original_file || f.name}>

                                  {f.original_file || f.name || `Dataset #${idx + 1}`}

                                </span>

                                <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono">

                                  {(f.rows || 0).toLocaleString()} rows

                                </span>

                              </div>

                              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">

                                <span className="truncate max-w-[180px]">{f.parquet_path}</span>

                                <span>{f.columns || (f.column_details ? f.column_details.length : 0)} cols</span>

                              </div>

                            </div>

                          ))}

                        </div>

                      </div>

                    )}

                  </div>

                )}



                {/* 2. DuckDB Virtual Lake Inspector */}

                {isSelectedDuckDbNode && (

                  <div className="space-y-4 pt-3 border-t border-cyber-border">

                    <div className="p-3 bg-gradient-to-r from-yellow-500/10 via-amber-500/5 to-transparent rounded-xl border border-yellow-500/30">

                      <div className="flex items-center space-x-2">

                        <Database className="w-4 h-4 text-yellow-400" />

                        <span className="text-xs font-bold text-yellow-300">🦆 DuckDB Virtual Data Lake</span>

                        <span className="px-1.5 py-0.5 rounded bg-yellow-500/20 text-[9px] text-yellow-300 font-mono font-bold">In-Memory OLAP</span>

                      </div>

                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">

                        Vectorized SQL Engine สำหรับ Query ไฟล์ Parquet หลายไฟล์พร้อมกัน ทำ Wildcard Union และ Multi-File JOIN ทันทีในหน่วยความจำ

                      </p>

                    </div>



                    {/* Execution Mode */}

                    <div className="space-y-1.5">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        Execution Mode

                      </label>

                      <select

                        value={selectedNode.data.parameters?.executionMode || 'agent_driven'}

                        onChange={(e) => updateSelectedNodeParameter('executionMode', e.target.value)}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-yellow-400 focus:outline-none py-2 px-3 rounded-lg text-cyber-text"

                      >

                        <option value="agent_driven">AI Agent Driven (อัตโนมัติ)</option>

                        <option value="custom_sql">Custom SQL Query (เขียนคำสั่งเอง)</option>

                        <option value="auto_union">Auto-Union All Parquet Files (รวมทุกไฟล์)</option>

                      </select>

                    </div>



                    {/* Safe Guards: Timeout & Row limit */}

                    <div className="grid grid-cols-2 gap-2">

                      <div className="space-y-1">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          Timeout Safeguard

                        </label>

                        <input

                          type="text"

                          value={selectedNode.data.parameters?.statementTimeout || '10s'}

                          onChange={(e) => updateSelectedNodeParameter('statementTimeout', e.target.value)}

                          className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-yellow-400 py-2 px-2.5 rounded-lg text-cyber-text font-mono"

                          placeholder="10s"

                        />

                      </div>

                      <div className="space-y-1">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          Max Result Rows

                        </label>

                        <input

                          type="number"

                          value={selectedNode.data.parameters?.maxResultRows || 100}

                          onChange={(e) => updateSelectedNodeParameter('maxResultRows', Number(e.target.value))}

                          className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-yellow-400 py-2 px-2.5 rounded-lg text-cyber-text font-mono"

                        />

                      </div>

                    </div>



                    {/* SQL Quick Templates */}

                    <div className="space-y-1">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        SQL Quick Templates

                      </label>

                      <div className="flex flex-wrap gap-1.5">

                        <button

                          type="button"

                          onClick={() => updateSelectedNodeParameter('sqlQuery', "SELECT * FROM read_parquet('workflow_inputs/parquet_cache/*.parquet') LIMIT 10;")}

                          className="px-2 py-1 rounded bg-cyber-dark border border-cyber-border hover:border-yellow-400 text-[10px] text-yellow-300 font-mono transition-colors"

                        >

                          Preview 10 Rows

                        </button>

                        <button

                          type="button"

                          onClick={() => updateSelectedNodeParameter('sqlQuery', "SELECT COUNT(*) AS total_records FROM read_parquet('workflow_inputs/parquet_cache/*.parquet');")}

                          className="px-2 py-1 rounded bg-cyber-dark border border-cyber-border hover:border-yellow-400 text-[10px] text-yellow-300 font-mono transition-colors"

                        >

                          COUNT Records

                        </button>

                        <button

                          type="button"

                          onClick={() => updateSelectedNodeParameter('sqlQuery', "DESCRIBE SELECT * FROM read_parquet('workflow_inputs/parquet_cache/*.parquet') LIMIT 1;")}

                          className="px-2 py-1 rounded bg-cyber-dark border border-cyber-border hover:border-yellow-400 text-[10px] text-yellow-300 font-mono transition-colors"

                        >

                          DESCRIBE Schema

                        </button>

                      </div>

                    </div>



                    {/* SQL Query Editor */}

                    <div className="space-y-1.5">

                      <div className="flex items-center justify-between">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          DuckDB SQL Editor

                        </label>

                        <span className="text-[9px] text-yellow-400 font-mono">read_parquet(...)</span>

                      </div>

                      <textarea

                        value={selectedNode.data.parameters?.sqlQuery || "SELECT * FROM read_parquet('workflow_inputs/parquet_cache/*.parquet') LIMIT 10"}

                        onChange={(e) => updateSelectedNodeParameter('sqlQuery', e.target.value)}

                        rows={4}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-yellow-400 py-2.5 px-3 rounded-lg text-cyber-text font-mono resize-y leading-relaxed"

                        placeholder="SELECT * FROM read_parquet(...) LIMIT 10;"

                      />

                    </div>



                    {/* Action Run Query Button */}

                    <button

                      onClick={handleExecuteDuckDbQueryClick}

                      disabled={isExecutingDuckDb}

                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-900 font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-yellow-500/20 transition-all cursor-pointer disabled:opacity-50"

                    >

                      {isExecutingDuckDb ? (

                        <>

                          <div className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />

                          <span>Running DuckDB Query...</span>

                        </>

                      ) : (

                        <>

                          <Play className="w-3.5 h-3.5 fill-slate-900" />

                          <span>Execute SQL Query Preview</span>

                        </>

                      )}

                    </button>



                    {duckdbQueryError && (

                      <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-500/40 text-[11px] text-red-300 font-mono">

                        Error: {duckdbQueryError}

                      </div>

                    )}



                    {/* Query Result Preview */}

                    {(duckdbQueryResult || selectedNode.data.parameters?.queryResults) && (

                      <div className="space-y-2 pt-2 border-t border-cyber-border">

                        <div className="flex items-center justify-between">

                          <div className="flex items-center space-x-2">

                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">

                              Results ({(duckdbQueryResult?.row_count ?? (selectedNode.data.parameters?.queryResults?.length || 0))} rows)

                            </span>

                            {(duckdbQueryResult?.execution_time_ms !== undefined || selectedNode.data.parameters?.executionTimeMs !== undefined) && (

                              <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[9px] font-mono">

                                ⚡ {(duckdbQueryResult?.execution_time_ms ?? selectedNode.data.parameters?.executionTimeMs)} ms

                              </span>

                            )}

                          </div>

                          <div className="flex items-center space-x-1">

                            <button

                              type="button"

                              onClick={() => setDuckdbViewMode('table')}

                              className={`px-2 py-0.5 rounded text-[9px] font-bold ${duckdbViewMode === 'table' ? 'bg-yellow-500 text-slate-950' : 'bg-cyber-dark text-slate-400'}`}

                            >

                              Table

                            </button>

                            <button

                              type="button"

                              onClick={() => setDuckdbViewMode('json')}

                              className={`px-2 py-0.5 rounded text-[9px] font-bold ${duckdbViewMode === 'json' ? 'bg-yellow-500 text-slate-950' : 'bg-cyber-dark text-slate-400'}`}

                            >

                              JSON

                            </button>

                          </div>

                        </div>



                        {duckdbViewMode === 'table' ? (

                          <div className="overflow-x-auto max-h-56 rounded border border-cyber-border bg-cyber-dark">

                            {(() => {

                              const rows = duckdbQueryResult?.data || selectedNode.data.parameters?.queryResults || [];

                              if (rows.length === 0) return <div className="p-3 text-xs text-slate-400 italic">No records returned.</div>;

                              const cols = duckdbQueryResult?.columns || Object.keys(rows[0] || {});

                              return (

                                <table className="w-full text-[11px] text-left">

                                  <thead className="bg-slate-900/90 text-yellow-300 font-mono border-b border-cyber-border sticky top-0">

                                    <tr>

                                      {cols.map((col: string, idx: number) => (

                                        <th key={idx} className="py-1.5 px-2.5 truncate max-w-[120px] font-bold">{col}</th>

                                      ))}

                                    </tr>

                                  </thead>

                                  <tbody className="divide-y divide-cyber-border/40 text-slate-300 font-mono">

                                    {rows.slice(0, 50).map((row: any, rIdx: number) => (

                                      <tr key={rIdx} className="hover:bg-yellow-500/5">

                                        {cols.map((col: string, cIdx: number) => (

                                          <td key={cIdx} className="py-1 px-2.5 truncate max-w-[140px] text-slate-300">

                                            {row[col] !== undefined && row[col] !== null ? String(row[col]) : <span className="text-slate-600">null</span>}

                                          </td>

                                        ))}

                                      </tr>

                                    ))}

                                  </tbody>

                                </table>

                              );

                            })()}

                          </div>

                        ) : (

                          <textarea

                            readOnly

                            rows={6}

                            value={JSON.stringify(duckdbQueryResult?.data || selectedNode.data.parameters?.queryResults || [], null, 2)}

                            className="w-full text-xs bg-cyber-dark border border-cyber-border py-2 px-3 rounded-lg text-cyber-text font-mono"

                          />

                        )}

                      </div>

                    )}

                  </div>

                )}



                {/* 3. Autonomous Big Data Analyst & Multi-Agent Container Inspector */}

                {(isSelectedBigDataAnalystNode || isSelectedBigDataContainerNode) && (

                  <div className="space-y-4 pt-3 border-t border-cyber-border">

                    <div className="p-3 bg-gradient-to-r from-sky-500/10 via-indigo-500/5 to-transparent rounded-xl border border-sky-500/30">

                      <div className="flex items-center space-x-2">

                        <Bot className="w-4 h-4 text-sky-400" />

                        <span className="text-xs font-bold text-sky-300">

                          {isSelectedBigDataContainerNode ? '📦 Multi-Agent Pipeline Container' : '🤖 Autonomous Big Data Analyst'}

                        </span>

                        <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-[9px] text-sky-300 font-mono font-bold">Multi-Agent</span>

                      </div>

                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">

                        ทำงานร่วมกันแบบ Orchestrated Multi-Agent Team: วางแผน (Planner) ➔ เขียน SQL & ตรวจสอบ (Critic) ➔ วิเคราะห์เฉพาะทาง (Specialist) ➔ สังเคราะห์ผล (Synthesizer)

                      </p>

                    </div>



                    {/* Input Dataset (Excel / CSV / Parquet) Source */}

                    <div className="space-y-2 p-3 bg-slate-900/40 rounded-xl border border-cyber-border">

                      <div className="flex items-center justify-between">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-sky-400 flex items-center space-x-1.5">

                          <FileSpreadsheet className="w-3.5 h-3.5" />

                          <span>Input Dataset (Excel / CSV)</span>

                        </label>

                        <select

                          value={selectedNode.data.parameters?.sourceType || 'upload'}

                          onChange={(e) => updateSelectedNodeParameter('sourceType', e.target.value)}

                          className="text-[10px] bg-cyber-dark border border-cyber-border focus:border-sky-400 rounded px-2 py-0.5 text-slate-300"

                        >

                          <option value="upload">Upload Files (Excel / CSV)</option>

                          <option value="local_dir">Local Directory Path</option>

                          <option value="upstream">Upstream Node (Pipeline)</option>

                        </select>

                      </div>



                      {/* 1. Direct Upload Dropzone */}

                      {(selectedNode.data.parameters?.sourceType || 'upload') === 'upload' && (

                        <div className="space-y-1.5">

                          <div className="relative border-2 border-dashed border-sky-500/40 hover:border-sky-400 rounded-xl p-3 bg-sky-500/5 transition-all text-center group cursor-pointer">

                            <input

                              type="file"

                              multiple

                              accept=".xlsx,.xls,.csv"

                              onChange={async (e) => {

                                const files = e.target.files;

                                if (!files || files.length === 0) return;

                                const formData = new FormData();

                                Array.from(files).forEach((f) => formData.append('files', f));

                                formData.append('compression', selectedNode.data.parameters?.compression || 'snappy');

                                formData.append('chunk_size', String(selectedNode.data.parameters?.chunkSize || 50000));

                                setIsConvertingParquet(true);

                                setConversionStatusMsg(`Ingesting & converting ${files.length} Excel file(s)...`);

                                try {

                                  const res = await fetch(`${BACKEND_URL}/api/analytics/convert-parquet`, {

                                    method: 'POST',

                                    body: formData,

                                  });

                                  const data = await res.json();

                                  if (data.status === 'success') {

                                    const totalRows = (data.results || []).reduce((acc: number, cur: any) => acc + (cur.rows || 0), 0);

                                    setConversionStatusMsg(`Ingested ${data.results?.length || 0} file(s) successfully (${totalRows.toLocaleString()} rows).`);

                                    updateSelectedNodeParameter('convertedFiles', data.results || []);

                                    updateSelectedNodeParameter('parquetFiles', (data.results || []).map((r: any) => r.parquet_path));

                                    updateSelectedNodeParameter('catalog', data.catalog || {});

                                  } else {

                                    setConversionStatusMsg(`Error: ${data.message || 'Upload conversion failed'}`);

                                  }

                                } catch (err: any) {

                                  setConversionStatusMsg(`Upload Error: ${err.message}`);

                                } finally {

                                  setIsConvertingParquet(false);

                                }

                              }}

                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"

                            />

                            <FileSpreadsheet className="w-6 h-6 mx-auto text-sky-400 mb-1 group-hover:scale-110 transition-transform" />

                            <p className="text-[11px] font-semibold text-slate-200">

                              {isConvertingParquet ? 'กำลังประมวลผลด้วย Polars...' : 'คลิกหรือลากไฟล์ Excel / CSV มาวางที่นี่'}

                            </p>

                            <p className="text-[9px] text-slate-400 mt-0.5">รองรับ .xlsx, .xls, .csv หลายไฟล์พร้อมกัน</p>

                          </div>

                        </div>

                      )}



                      {/* 2. Local Directory Path */}

                      {selectedNode.data.parameters?.sourceType === 'local_dir' && (

                        <div className="space-y-1.5">

                          <input

                            type="text"

                            value={selectedNode.data.parameters?.sourceFiles || ''}

                            onChange={(e) => updateSelectedNodeParameter('sourceFiles', e.target.value)}

                            placeholder="e.g. F:\_Work AI\data\sales_*.xlsx"

                            className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-sky-400 py-1.5 px-2.5 rounded-lg text-cyber-text font-mono"

                          />

                          <button

                            type="button"

                            onClick={handleConvertParquetClick}

                            disabled={isConvertingParquet}

                            className="w-full py-1.5 px-3 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-[10px] font-bold border border-sky-400/30 flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"

                          >

                            <span>⚡ Scan & Ingest with Polars</span>

                          </button>

                        </div>

                      )}



                      {/* 3. Upstream Pipeline Note */}

                      {selectedNode.data.parameters?.sourceType === 'upstream' && (

                        <div className="p-2 rounded bg-sky-950/30 border border-sky-500/20 text-[10px] text-slate-400 leading-tight">

                          🔗 รับข้อมูลอัตโนมัติจากโหนด <strong className="text-sky-300">Polars Parquet Converter</strong> หรือ <strong className="text-amber-300">DuckDB</strong> ต้นทางผ่านเส้นเชื่อมต่อ (Edge) บน Canvas

                        </div>

                      )}



                      {/* Conversion / Status Alert */}

                      {conversionStatusMsg && (

                        <div className="p-2 rounded bg-slate-900 border border-sky-500/40 text-[10px] text-sky-300 flex items-center space-x-2">

                          <Info className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />

                          <span className="truncate">{conversionStatusMsg}</span>

                        </div>

                      )}



                      {/* Active Ingested Files List */}

                      {Array.isArray(selectedNode.data.parameters?.convertedFiles) && selectedNode.data.parameters.convertedFiles.length > 0 && (

                        <div className="space-y-1 pt-1 border-t border-cyber-border/60">

                          <div className="flex items-center justify-between text-[9px] text-slate-400">

                            <span className="text-emerald-400 font-bold flex items-center space-x-1">

                              <CheckCircle2 className="w-3 h-3" />

                              <span>พร้อมวิเคราะห์ ({selectedNode.data.parameters.convertedFiles.length} ไฟล์)</span>

                            </span>

                            <span>{selectedNode.data.parameters.convertedFiles.reduce((acc: number, c: any) => acc + (c.rows || 0), 0).toLocaleString()} แถว</span>

                          </div>

                          <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">

                            {selectedNode.data.parameters.convertedFiles.map((f: any, fIdx: number) => (

                              <span key={fIdx} className="px-1.5 py-0.5 rounded bg-sky-500/10 border border-sky-400/30 text-[9px] text-sky-300 font-mono truncate max-w-full">

                                📊 {typeof f === 'string' ? f.split(/[\\/]/).pop() : (f.original || f.parquet_path || '').split(/[\\/]/).pop()} {f.rows ? `(${f.rows.toLocaleString()}r)` : ''}

                              </span>

                            ))}

                          </div>

                        </div>

                      )}

                    </div>



                    {/* Mode Toggle: Auto vs Manual */}

                    <div className="space-y-1.5">

                      <div className="flex items-center justify-between">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          Team Architecture Setup

                        </label>

                        <div className="flex items-center space-x-1 p-0.5 bg-cyber-dark rounded-lg border border-cyber-border">

                          <button

                            type="button"

                            onClick={() => {

                              setActiveBigDataTab('auto');

                              updateSelectedNodeParameter('mode', 'auto');

                            }}

                            className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${

                              (selectedNode.data.parameters?.mode || activeBigDataTab) === 'auto'

                                ? 'bg-sky-500 text-slate-950 shadow-sm'

                                : 'text-slate-400 hover:text-slate-200'

                            }`}

                          >

                            ⚡ Auto Mode

                          </button>

                          <button

                            type="button"

                            onClick={() => {

                              setActiveBigDataTab('manual');

                              updateSelectedNodeParameter('mode', 'manual');

                            }}

                            className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${

                              (selectedNode.data.parameters?.mode || activeBigDataTab) === 'manual'

                                ? 'bg-sky-500 text-slate-950 shadow-sm'

                                : 'text-slate-400 hover:text-slate-200'

                            }`}

                          >

                            🛠️ Manual Mode

                          </button>

                        </div>

                      </div>

                    </div>



                    {/* Business Objective Input */}

                    <div className="space-y-1.5">

                      <div className="flex items-center justify-between">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          Business Objective (โจทย์การวิเคราะห์)

                        </label>

                      </div>

                      <textarea

                        value={selectedNode.data.parameters?.businessObjective || 'วิเคราะห์ยอดขายและผลประกอบการ หาแนวโน้มสำคัญ ตรวจสอบความผิดปกติ (Anomalies) และจัดทำข้อเสนอแนะเชิงกลยุทธ์'}

                        onChange={(e) => updateSelectedNodeParameter('businessObjective', e.target.value)}

                        rows={3}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-sky-400 py-2.5 px-3 rounded-lg text-cyber-text resize-none leading-relaxed"

                        placeholder="ระบุสิ่งที่ต้องการให้ทีม AI ค้นหาและวิเคราะห์..."

                      />

                    </div>



                    {/* Auto Mode UI */}

                    {(selectedNode.data.parameters?.mode || activeBigDataTab) === 'auto' && (

                      <div className="space-y-2 p-3 rounded-xl bg-sky-950/20 border border-sky-500/20">

                        <div className="flex items-center justify-between">

                          <span className="text-[11px] font-semibold text-sky-300">AI Team Auto-Planner</span>

                          <span className="text-[9px] text-slate-400">Schema-Driven</span>

                        </div>

                        <p className="text-[10px] text-slate-400 leading-relaxed">

                          AI จะประเมิน Schema ของชุดข้อมูลร่วมกับโจทย์ธุรกิจ แล้วจัดทีมผู้เชี่ยวชาญเฉพาะทางให้โดยอัตโนมัติ

                        </p>

                        <button

                          type="button"

                          onClick={handleAutoGenerateTeamClick}

                          disabled={isGeneratingTeam}

                          className="w-full py-2 px-3 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-200 text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"

                        >

                          {isGeneratingTeam ? (

                            <>

                              <div className="w-3 h-3 border-2 border-sky-300 border-t-transparent rounded-full animate-spin" />

                              <span>Planning Optimal Team...</span>

                            </>

                          ) : (

                            <>

                              <Sparkles className="w-3.5 h-3.5 text-sky-300" />

                              <span>Auto-Compose Agent Team</span>

                            </>

                          )}

                        </button>

                        {selectedNode.data.parameters?.teamRationale && (

                          <p className="text-[10px] text-sky-300/80 italic font-mono pt-1">

                            Rationale: {selectedNode.data.parameters.teamRationale}

                          </p>

                        )}

                      </div>

                    )}



                    {/* Multi-Agent Team List (Active in both modes, editable in manual mode) */}

                    <div className="space-y-2">

                      <div className="flex items-center justify-between">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          Agent Specialists Team ({((selectedNode.data.parameters?.team || []).length)} Agents)

                        </label>

                        {(selectedNode.data.parameters?.mode || activeBigDataTab) === 'manual' && (

                          <button

                            type="button"

                            onClick={() => {

                              const currentTeam = Array.isArray(selectedNode.data.parameters?.team) ? [...selectedNode.data.parameters.team] : [];

                              const newAgentId = `agent_${Date.now()}`;

                              currentTeam.push({

                                id: newAgentId,

                                name: `Specialist ${currentTeam.length + 1}`,

                                role: 'วิเคราะห์ข้อมูลเชิงลึกและประเมินผลกระทบ',

                                model: 'gemini-2.5-flash',

                                persona: 'Data Domain Specialist'

                              });

                              updateSelectedNodeParameter('team', currentTeam);

                            }}

                            className="px-2 py-0.5 rounded bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-400/40 text-[9px] font-bold flex items-center space-x-1 cursor-pointer"

                          >

                            <Plus className="w-3 h-3" />

                            <span>Add Agent</span>

                          </button>

                        )}

                      </div>



                      <div className="space-y-2 max-h-64 overflow-y-auto">

                        {(selectedNode.data.parameters?.team || []).map((agent: any, idx: number) => (

                          <div key={agent.id || idx} className="p-2.5 rounded-xl bg-cyber-dark border border-cyber-border space-y-2">

                            <div className="flex items-center justify-between">

                              <div className="flex items-center space-x-2">

                                <div className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center text-[10px] font-bold">

                                  #{idx + 1}

                                </div>

                                {(selectedNode.data.parameters?.mode || activeBigDataTab) === 'manual' ? (

                                  <input

                                    type="text"

                                    value={agent.name || ''}

                                    onChange={(e) => {

                                      const newTeam = [...selectedNode.data.parameters.team];

                                      newTeam[idx] = { ...newTeam[idx], name: e.target.value };

                                      updateSelectedNodeParameter('team', newTeam);

                                    }}

                                    className="text-xs font-bold text-sky-300 bg-transparent border-b border-cyber-border focus:border-sky-400 focus:outline-none px-1"

                                  />

                                ) : (

                                  <span className="text-xs font-bold text-sky-300">{agent.name}</span>

                                )}

                              </div>

                              <div className="flex items-center space-x-1">

                                {(selectedNode.data.parameters?.mode || activeBigDataTab) === 'manual' && (

                                  <select

                                    value={agent.model || 'gemini-2.5-flash'}

                                    onChange={(e) => {

                                      const newTeam = [...selectedNode.data.parameters.team];

                                      newTeam[idx] = { ...newTeam[idx], model: e.target.value };

                                      updateSelectedNodeParameter('team', newTeam);

                                    }}

                                    className="text-[10px] bg-slate-900 border border-cyber-border rounded px-1.5 py-0.5 text-slate-300"

                                  >

                                    <option value="gemini-2.5-flash">2.5-flash</option>

                                    <option value="gemini-1.5-pro">1.5-pro</option>

                                    <option value="gemini-2.5-pro">2.5-pro</option>

                                  </select>

                                )}

                                {(selectedNode.data.parameters?.mode || activeBigDataTab) === 'manual' && (

                                  <button

                                    type="button"

                                    onClick={() => {

                                      const newTeam = selectedNode.data.parameters.team.filter((_: any, i: number) => i !== idx);

                                      updateSelectedNodeParameter('team', newTeam);

                                    }}

                                    className="p-1 hover:text-red-400 text-slate-500"

                                    title="Delete Agent"

                                  >

                                    <Trash2 className="w-3 h-3" />

                                  </button>

                                )}

                              </div>

                            </div>



                            {(selectedNode.data.parameters?.mode || activeBigDataTab) === 'manual' ? (

                              <div className="space-y-1">

                                <input

                                  type="text"

                                  value={agent.persona || ''}

                                  placeholder="Specialist Persona (เช่น Senior Risk & Compliance Lead)"

                                  onChange={(e) => {

                                    const newTeam = [...selectedNode.data.parameters.team];

                                    newTeam[idx] = { ...newTeam[idx], persona: e.target.value };

                                    updateSelectedNodeParameter('team', newTeam);

                                  }}

                                  className="w-full text-[10px] bg-slate-900/60 border border-cyber-border focus:border-sky-400 rounded px-2 py-1 text-slate-300"

                                />

                                <textarea

                                  rows={2}

                                  value={agent.role || ''}

                                  placeholder="หน้าที่และคำสั่ง (Agent Prompt / Task)"

                                  onChange={(e) => {

                                    const newTeam = [...selectedNode.data.parameters.team];

                                    newTeam[idx] = { ...newTeam[idx], role: e.target.value };

                                    updateSelectedNodeParameter('team', newTeam);

                                  }}

                                  className="w-full text-[10px] bg-slate-900/60 border border-cyber-border focus:border-sky-400 rounded px-2 py-1 text-slate-300 leading-tight"

                                />

                              </div>

                            ) : (

                              <div>

                                <p className="text-[10px] text-slate-400 font-medium">{agent.persona || agent.role}</p>

                                <p className="text-[9px] text-slate-500 mt-0.5 italic">{agent.role}</p>

                              </div>

                            )}

                          </div>

                        ))}

                      </div>

                    </div>



                    {/* Drill-Down Subflow Button (Hybrid Container Feature) */}

                    <button

                      type="button"

                      onClick={() => handleDrillDownContainer(selectedNode)}

                      className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-600/30 to-sky-600/30 hover:from-indigo-600/50 hover:to-sky-600/50 border border-indigo-400/40 text-sky-200 text-xs font-bold flex items-center justify-center space-x-2 shadow-sm transition-all cursor-pointer"

                    >

                      <Layers className="w-3.5 h-3.5 text-sky-300" />

                      <span>🔍 Open Subflow Architecture (ขยายโครงสร้าง Pipeline)</span>

                    </button>



                    {/* Final Analysis Report */}

                    {selectedNode.data.parameters?.finalReport && (

                      <div className="space-y-1.5 pt-2 border-t border-cyber-border">

                        <div className="flex items-center justify-between">

                          <label className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">

                            Executive Insights Report

                          </label>

                          <button

                            type="button"

                            onClick={() => navigator.clipboard.writeText(selectedNode.data.parameters.finalReport)}

                            className="text-[9px] text-sky-300 hover:text-sky-200 flex items-center space-x-1"

                          >

                            <Copy className="w-3 h-3" />

                            <span>Copy Report</span>

                          </button>

                        </div>

                        <div className="p-3 rounded-xl bg-cyber-dark border border-cyber-border text-xs text-slate-200 whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed">

                          {selectedNode.data.parameters.finalReport}

                        </div>

                      </div>

                    )}

                  </div>

                )}


    </>
  );
};

export default BigDataInspectorSection;
