import os
import time
from typing import List, Dict, Any, Optional

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
                df = pl.read_excel(file_path, sheet_name=sheet_name) if sheet_name else pl.read_excel(file_path)
            elif ext in [".csv", ".tsv"]:
                df = pl.read_csv(file_path, ignore_errors=True)
            else:
                continue

            df.write_parquet(out_parquet_path, compression=compression)
            duration = round(time.time() - start_t, 3)

            row_count = df.height
            total_rows += row_count
            generated_files.append(out_parquet_path)

            col_details = []
            for col_name, dtype in zip(df.columns, df.dtypes):
                col_details.append({
                    "name": col_name,
                    "type": str(dtype),
                    "null_count": int(df[col_name].null_count())
                })

            file_size_kb = round(os.path.getsize(out_parquet_path) / 1024, 2)
            catalog.append({
                "table_name": base_name,
                "original_file": os.path.basename(file_path),
                "parquet_file": os.path.basename(out_parquet_path),
                "parquet_path": out_parquet_path,
                "rows": row_count,
                "columns": df.columns,
                "column_details": col_details,
                "size_kb": file_size_kb,
                "conversion_time_sec": duration
            })
        except Exception as e:
            catalog.append({
                "table_name": base_name,
                "original_file": os.path.basename(file_path),
                "status": "failed",
                "error": str(e)
            })

    return {
        "status": "success",
        "catalog": catalog,
        "total_rows": total_rows,
        "generated_files": generated_files
    }

def query_duckdb(query_str: str, default_parquet_path: Optional[str] = None) -> Dict[str, Any]:
    """
    Executes vectorized SQL query over Parquet files using DuckDB.
    """
    if duckdb is None:
        return {"status": "error", "message": "DuckDB is not installed"}

    con = duckdb.connect(database=":memory:")
    try:
        if default_parquet_path and os.path.exists(default_parquet_path):
            safe_path = default_parquet_path.replace("\\", "/")
            con.execute(f"CREATE VIEW current_table AS SELECT * FROM read_parquet('{safe_path}');")

        start_t = time.time()
        cursor = con.execute(query_str)
        columns = [desc[0] for desc in cursor.description] if cursor.description else []
        rows = cursor.fetchall()
        duration = round(time.time() - start_t, 4)

        clean_records = [dict(zip(columns, row)) for row in rows]

        return {
            "status": "success",
            "columns": columns,
            "rows": clean_records,
            "row_count": len(clean_records),
            "execution_time_sec": duration
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }
    finally:
        con.close()

def auto_team_planner(catalog: List[Dict[str, Any]], objective: str) -> Dict[str, Any]:
    """
    Analyzes schema metadata and objective to suggest a Multi-Agent Team.
    """
    all_cols = []
    for item in catalog:
        cols_source = item.get("columns", []) or item.get("column_details", [])
        for c in cols_source:
            col_name = c.get("name", "") if isinstance(c, dict) else str(c)
            if col_name:
                all_cols.append(col_name.lower())

    cols_str = " ".join(all_cols)
    obj_str = (objective or "").lower()

    is_finance = any(k in cols_str or k in obj_str for k in ["price", "cost", "revenue", "profit", "margin", "amount", "sales", "discount", "tax"])
    is_customer = any(k in cols_str or k in obj_str for k in ["customer", "client", "user", "churn", "segment", "age", "gender", "address", "city"])
    is_logistics = any(k in cols_str or k in obj_str for k in ["ship", "delivery", "inventory", "stock", "warehouse", "tracking", "route", "supplier"])

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

    if is_finance:
        suggested_agents.append({
            "id": "agent_finance",
            "role": "Financial & Margin Specialist",
            "type": "domain_specialist",
            "model": "gemini-1.5-pro",
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

    return {
        "status": "success",
        "objective": objective,
        "suggested_agents": suggested_agents
    }

