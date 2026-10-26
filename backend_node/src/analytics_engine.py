#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Analytics Engine: Polars (Rust) + DuckDB + Multi-Agent Pipeline
Provides high-performance Excel/CSV to Parquet conversion, virtual SQL analytics,
and multi-agent role generation and synthesis.
"""

import os
import sys
import json
import glob
import time
import argparse
from typing import List, Dict, Any, Optional

# Ensure UTF-8 stdout on Windows
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

try:
    import polars as pl
except ImportError:
    pl = None

try:
    import duckdb
except ImportError:
    duckdb = None


def convert_files_to_parquet(
    file_paths: List[str],
    output_dir: str,
    compression: str = "snappy",
    sheet_name: Optional[str] = None
) -> Dict[str, Any]:
    """
    Converts single or multiple Excel/CSV files to Parquet using Polars (Rust).
    Returns metadata catalog: columns, types, row count, file sizes.
    """
    if pl is None:
        return {"status": "error", "message": "Polars is not installed"}

    os.makedirs(output_dir, exist_ok=True)
    catalog = []
    total_rows = 0
    generated_files = []

    for file_path in file_paths:
        if not os.path.exists(file_path):
            continue

        base_name = os.path.splitext(os.path.basename(file_path))[0]
        ext = os.path.splitext(file_path)[1].lower()
        out_parquet_path = os.path.join(output_dir, f"{base_name}.parquet")

        try:
            start_t = time.time()
            if ext in [".xlsx", ".xls", ".xlsm"]:
                if sheet_name:
                    df = pl.read_excel(file_path, sheet_name=sheet_name)
                else:
                    df = pl.read_excel(file_path)
            elif ext in [".csv", ".tsv"]:
                df = pl.read_csv(file_path, ignore_errors=True)
            else:
                continue

            # Write Parquet with compression
            df.write_parquet(out_parquet_path, compression=compression)
            elapsed = round(time.time() - start_t, 3)

            row_count = df.height
            total_rows += row_count
            generated_files.append(out_parquet_path)

            col_info = []
            for col_name, dtype in zip(df.columns, df.dtypes):
                col_info.append({
                    "name": col_name,
                    "type": str(dtype)
                })

            sample_rows = df.head(3).to_dicts()

            catalog.append({
                "source_file": file_path,
                "parquet_file": out_parquet_path,
                "file_name": os.path.basename(out_parquet_path),
                "row_count": row_count,
                "col_count": len(df.columns),
                "columns": col_info,
                "sample_data": sample_rows,
                "conversion_time_sec": elapsed
            })
        except Exception as e:
            catalog.append({
                "source_file": file_path,
                "status": "error",
                "error": str(e)
            })

    return {
        "status": "success",
        "total_files": len(generated_files),
        "total_rows": total_rows,
        "parquet_files": generated_files,
        "catalog": catalog
    }


def query_duckdb(
    parquet_files: List[str],
    sql_query: str,
    timeout_seconds: int = 10,
    max_rows: int = 200
) -> Dict[str, Any]:
    """
    Executes analytical SQL query on Parquet files using DuckDB.
    Uses interrupt timer to enforce statement timeout.
    """
    if duckdb is None:
        return {"status": "error", "message": "DuckDB is not installed"}

    import threading
    start_t = time.time()
    try:
        con = duckdb.connect(database=":memory:")
        
        # Safe query interruption timer
        timer = threading.Timer(timeout_seconds, lambda: con.interrupt())
        timer.start()

        try:
            # Register views for each parquet file so user can query by simple table name
            for p_file in parquet_files:
                if os.path.exists(p_file):
                    table_name = os.path.splitext(os.path.basename(p_file))[0]
                    clean_table_name = table_name.replace("-", "_").replace(" ", "_")
                    con.execute(f"CREATE OR REPLACE VIEW {clean_table_name} AS SELECT * FROM read_parquet('{p_file.replace(chr(92), '/')}')")

            # Run SQL
            res = con.execute(sql_query)
            # Use native Polars fetch - zero pandas dependency!
            df_res = res.pl()
        finally:
            timer.cancel()

        elapsed_ms = round((time.time() - start_t) * 1000, 2)
        total_matched = df_res.height
        
        # Limit rows
        df_limited = df_res.head(max_rows)
        records = df_limited.to_dicts()

        return {
            "status": "success",
            "execution_time_ms": elapsed_ms,
            "total_matched_rows": total_matched,
            "returned_rows": len(records),
            "columns": df_res.columns,
            "data": records
        }
    except Exception as e:
        elapsed_ms = round((time.time() - start_t) * 1000, 2)
        return {
            "status": "error",
            "execution_time_ms": elapsed_ms,
            "error": str(e)
        }


def auto_team_planner(catalog: List[Dict[str, Any]], objective: str) -> Dict[str, Any]:
    """
    Analyzes data catalog schema and user objective to synthesize the ideal Multi-Agent Team.
    """
    # Detect domain keywords from column names
    all_cols = []
    for item in catalog:
        cols_source = item.get("columns", []) or item.get("column_details", [])
        for c in cols_source:
            col_name = c.get("name", "") if isinstance(c, dict) else str(c)
            if col_name:
                all_cols.append(col_name.lower())

    cols_str = " ".join(all_cols)
    obj_str = (objective or "").lower()

    # Determine primary domain
    is_finance = any(k in cols_str or k in obj_str for k in ["price", "cost", "revenue", "profit", "margin", "amount", "sales", "discount", "tax"])
    is_customer = any(k in cols_str or k in obj_str for k in ["customer", "client", "user", "churn", "segment", "age", "gender", "address", "city"])
    is_logistics = any(k in cols_str or k in obj_str for k in ["ship", "delivery", "inventory", "stock", "warehouse", "tracking", "route", "supplier"])
    is_medical = any(k in cols_str or k in obj_str for k in ["patient", "diagnosis", "dosage", "drug", "hospital", "clinic", "treatment", "doctor"])

    suggested_agents = [
        {
            "id": "agent_planner",
            "role": "Planner & Orchestrator",
            "type": "planner",
            "model": "gemini-1.5-pro",
            "focus": "Task Decomposition & Analytical Framework",
            "systemPrompt": "คุณคือหัวหน้าทีมผู้วางแผนการวิเคราะห์ข้อมูล แตกโจทย์เป็นประเด็นย่อยและมอบหมายงานให้ผู้เชี่ยวชาญ",
            "isActive": True
        },
        {
            "id": "agent_sql_engineer",
            "role": "DuckDB SQL Engineer",
            "type": "sql_engineer",
            "model": "gemini-1.5-pro",
            "focus": "High-Precision Vectorized SQL Generation",
            "systemPrompt": "คุณคือวิศวกรข้อมูลผู้เชี่ยวชาญด้าน DuckDB SQL เขียนคำสั่งคิวรีข้อมูลที่แม่นยำ 100% ตาม Schema",
            "isActive": True
        },
        {
            "id": "agent_critic",
            "role": "Data Auditor & Critic",
            "type": "critic",
            "model": "gpt-4o",
            "focus": "Quality Assurance, Null Checks & Anomaly Detection",
            "systemPrompt": "คุณคือผู้ตรวจสอบความถูกต้องของข้อมูล ตรวจสอบผลลัพธ์ SQL ตรวจหาค่าผิดปกติและทักท้วงเมื่อพบข้อผิดพลาด",
            "isActive": True
        }
    ]

    # Add Domain Specialists based on detection
    if is_finance:
        suggested_agents.append({
            "id": "agent_finance",
            "role": "Financial & Margin Specialist",
            "type": "domain_specialist",
            "model": "claude-3-5-sonnet",
            "focus": "Gross Margin, Profitability, Cost Drivers, Run-Rate",
            "systemPrompt": "คุณคือนักวิเคราะห์การเงินระดับสูง วิเคราะห์โครงสร้างรายได้ กำไร อัตรากำไรขั้นต้น และจุดรั่วไหลของต้นทุน",
            "isActive": True
        })

    if is_customer or not is_finance:
        suggested_agents.append({
            "id": "agent_marketing",
            "role": "Customer & Market Behavior Analyst",
            "type": "domain_specialist",
            "model": "gemini-1.5-pro",
            "focus": "RFM Segmentation, Churn Risk, Basket Analysis, LTV",
            "systemPrompt": "คุณคือนักวิเคราะห์การตลาดและพฤติกรรมลูกค้า วิเคราะห์พฤติกรรมการซื้อซ้ำ กลุ่มลูกค้าชั้นดี และความเสี่ยงการสูญเสียลูกค้า",
            "isActive": True
        })

    if is_logistics:
        suggested_agents.append({
            "id": "agent_operations",
            "role": "Operations & Inventory Specialist",
            "type": "domain_specialist",
            "model": "gpt-4o",
            "focus": "Stock Turnover, Delivery SLA, Supply Bottlenecks",
            "systemPrompt": "คุณคือนักวิเคราะห์การปฏิบัติการและห่วงโซ่อุปทาน วิเคราะห์สินค้าค้างสต็อก ประสิทธิภาพการจัดส่ง และคอขวดของระบบ",
            "isActive": True
        })

    if is_medical:
        suggested_agents.append({
            "id": "agent_clinical",
            "role": "Clinical & Lab Data Specialist",
            "type": "domain_specialist",
            "model": "claude-3-5-sonnet",
            "focus": "Dosage Patterns, Clinical Outcomes, Safety Indicators",
            "systemPrompt": "คุณคือนักวิจัยและวิเคราะห์ข้อมูลทางการแพทย์และคลินิก ประเมินผลลัพธ์การรักษาและปัจจัยความปลอดภัย",
            "isActive": True
        })

    # Executive Synthesizer is always present
    suggested_agents.append({
        "id": "agent_synthesizer",
        "role": "Chief Strategy Officer (CSO)",
        "type": "synthesizer",
        "model": "gpt-4o",
        "focus": "Consolidation, 30-60-90 Days Action Plan & Chart Visualization",
        "systemPrompt": "คุณคือผู้บริหารฝ่ายกลยุทธ์ สังเคราะห์ทุกมุมมองจากผู้เชี่ยวชาญ ขจัดข้อขัดแย้ง และสร้างแผนปฏิบัติการ 30-60-90 วัน",
        "isActive": True
    })

    detected_domains = []
    if is_finance: detected_domains.append("Finance / Sales")
    if is_customer: detected_domains.append("Customer / Market")
    if is_logistics: detected_domains.append("Logistics / Inventory")
    if is_medical: detected_domains.append("Clinical / Health")
    if not detected_domains: detected_domains.append("General Tabular Data")

    return {
        "status": "success",
        "detected_domains": detected_domains,
        "suggested_agents": suggested_agents,
        "total_agents": len(suggested_agents)
    }


def main():
    parser = argparse.ArgumentParser(description="Analytics Engine CLI")
    parser.add_argument("--action", required=True, choices=["convert", "query", "auto_team"])
    parser.add_argument("--input_files", nargs="*", default=[])
    parser.add_argument("--output_dir", default="./temp_parquet")
    parser.add_argument("--sql", default="")
    parser.add_argument("--timeout", type=int, default=10)
    parser.add_argument("--max_rows", type=int, default=200)
    parser.add_argument("--catalog_json", default="")
    parser.add_argument("--objective", default="")

    args = parser.parse_args()

    if args.action == "convert":
        res = convert_files_to_parquet(args.input_files, args.output_dir)
        print(json.dumps(res, ensure_ascii=False))
    elif args.action == "query":
        res = query_duckdb(args.input_files, args.sql, args.timeout, args.max_rows)
        print(json.dumps(res, ensure_ascii=False))
    elif args.action == "auto_team":
        catalog = json.loads(args.catalog_json) if args.catalog_json else []
        res = auto_team_planner(catalog, args.objective)
        print(json.dumps(res, ensure_ascii=False))


if __name__ == "__main__":
    main()
