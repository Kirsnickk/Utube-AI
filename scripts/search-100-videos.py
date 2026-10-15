import json
import subprocess
import sys
from pathlib import Path

YT_DLP = r"C:\Users\vandu\.agent-reach-venv\Scripts\yt-dlp.exe"
OUTPUT_DIR = Path(r"C:\Users\vandu\Documents\Utube+AI\research")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
JSON_FILE = OUTPUT_DIR / "100-video-systems-workflow.json"
MD_FILE = OUTPUT_DIR / "100-VIDEOS-SYSTEMS-AND-WORKFLOWS.md"

queries = [
    # Nhóm 1: Hệ thống tự động & Code pipeline
    ("AI video generation pipeline python", "Hệ thống Pipeline & Code"),
    ("automated youtube video pipeline", "Hệ thống Pipeline & Code"),
    ("remotion automated video generation", "Hệ thống Pipeline & Code"),
    ("text to video pipeline ffmpeg python", "Hệ thống Pipeline & Code"),
    ("ComfyUI automated video generation workflow", "Hệ thống Pipeline & Code"),

    # Nhóm 2: Hệ thống kênh Faceless & Tự động xuất bản
    ("hệ thống tự động làm video bằng AI", "Kênh Faceless & Tự động xuất bản"),
    ("cách làm kênh youtube bằng AI tự động", "Kênh Faceless & Tự động xuất bản"),
    ("faceless youtube automation ai workflow", "Kênh Faceless & Tự động xuất bản"),
    ("tự động hóa sản xuất video youtube", "Kênh Faceless & Tự động xuất bản"),
    ("AI faceless channel step by step tutorial", "Kênh Faceless & Tự động xuất bản"),

    # Nhóm 3: Quy trình làm video Kể chuyện & Review phim
    ("hướng dẫn làm video bằng AI từ A đến Z", "Quy trình Kể chuyện & Review phim"),
    ("cách tạo video kể chuyện bằng AI", "Quy trình Kể chuyện & Review phim"),
    ("quy trình làm video review phim bằng AI", "Quy trình Kể chuyện & Review phim"),
    ("AI storytelling video workflow tutorial", "Quy trình Kể chuyện & Review phim"),
    ("tạo video hoạt hình bằng AI", "Quy trình Kể chuyện & Review phim"),

    # Nhóm 4: Công cụ, Kỹ thuật Prompt & Nhất quán nhân vật
    ("character consistency AI video workflow", "Công cụ & Tính nhất quán nhân vật"),
    ("cách làm video tiktok shorts bằng AI tự động", "Công cụ & Định dạng ngắn/Shorts"),
    ("làm video AI chuyên nghiệp quy trình", "Kỹ thuật sản xuất & Biên tập")
]

collected = {}

for query, default_category in queries:
    if len(collected) >= 120:
        break
    print(f"Fetching: '{query}'...")
    cmd = [
        YT_DLP,
        "--dump-json",
        "--skip-download",
        "--flat-playlist",
        f"ytsearch15:{query}"
    ]
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, check=True, timeout=120)
        lines = [line.strip() for line in res.stdout.strip().split("\n") if line.strip()]
        for line in lines:
            try:
                data = json.loads(line)
                vid_id = data.get("id")
                if not vid_id or vid_id in collected:
                    continue
                title = data.get("title", "").strip()
                if not title:
                    continue
                url = data.get("url") or f"https://www.youtube.com/watch?v={vid_id}"
                channel = data.get("uploader") or data.get("channel") or "Unknown"
                duration = data.get("duration_string") or str(data.get("duration", "N/A"))
                views = data.get("view_count") or 0
                
                collected[vid_id] = {
                    "id": vid_id,
                    "title": title,
                    "url": url,
                    "channel": channel,
                    "duration": duration,
                    "views": views,
                    "query": query,
                    "category": default_category
                }
                if len(collected) >= 120:
                    break
            except Exception as e:
                pass
    except Exception as err:
        print(f"Error fetching query '{query}': {err}")

print(f"Total unique fetched: {len(collected)}")

# Select exactly 100 videos
items = list(collected.values())[:100]
assert len(items) == 100, f"Expected 100 videos, got {len(items)}"

# Save JSON
with open(JSON_FILE, "w", encoding="utf-8") as f:
    json.dump(items, f, ensure_ascii=False, indent=2)
print(f"Saved 100 videos to {JSON_FILE}")

# Group by category
categorized = {}
for idx, v in enumerate(items, 1):
    cat = v["category"]
    categorized.setdefault(cat, []).append((idx, v))

# Generate Markdown
md_lines = [
    "# Danh mục 100 Video: Hệ thống & Cách thức làm Video bằng AI",
    "",
    f"Tổng hợp 100 video thực tế có đầy đủ URL, kênh, thời lượng và số lượt xem, phân tích cách thức xây dựng hệ thống tự động hóa (pipeline) và phương pháp sản xuất video.",
    "",
    "## Mục lục các nhóm chuyên đề",
    ""
]

for cat, v_list in categorized.items():
    md_lines.append(f"- **{cat}**: {len(v_list)} video")

md_lines.append("")

for cat, v_list in categorized.items():
    md_lines.append(f"## {cat} ({len(v_list)} video)\n")
    md_lines.append("| STT | Tên Video | Kênh | Thời lượng | Lượt xem | Link |")
    md_lines.append("|---|---|---|---|---|---|")
    for stt, v in v_list:
        clean_title = v['title'].replace('|', '-').replace('\n', ' ')
        md_lines.append(f"| {stt} | {clean_title} | {v['channel']} | {v['duration']} | {v['views']:,} | [Xem Video]({v['url']}) |")
    md_lines.append("")

with open(MD_FILE, "w", encoding="utf-8") as f:
    f.write("\n".join(md_lines))

print(f"Saved markdown report to {MD_FILE}")
