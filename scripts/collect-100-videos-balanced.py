import json
import subprocess
import sys
from pathlib import Path

YT_DLP = r"C:\Users\vandu\.agent-reach-venv\Scripts\yt-dlp.exe"
OUTPUT_DIR = Path(r"C:\Users\vandu\Documents\Utube+AI\research")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
JSON_FILE = OUTPUT_DIR / "100-video-systems-workflow.json"
MD_FILE = OUTPUT_DIR / "100-VIDEOS-SYSTEMS-AND-WORKFLOWS.md"

groups = {
    "1. Hệ thống Pipeline & Tự động hóa Code (Python, Remotion, FFmpeg, ComfyUI)": [
        "AI video generation pipeline python",
        "automated youtube video pipeline github",
        "remotion automated video generation",
        "text to video pipeline ffmpeg python",
        "comfyui automated video generation api"
    ],
    "2. Hệ thống Kênh Faceless & Tự động xuất bản (Autonomous Channels)": [
        "hệ thống tự động làm video bằng AI",
        "cách làm kênh youtube bằng AI tự động",
        "faceless youtube automation ai workflow",
        "tự động hóa sản xuất video youtube",
        "AI faceless channel step by step tutorial"
    ],
    "3. Quy trình làm video Kể chuyện, Hoạt hình & Review phim bằng AI": [
        "quy trình làm video review phim bằng AI",
        "cách tạo video kể chuyện bằng AI",
        "hướng dẫn làm video hoạt hình bằng AI",
        "AI storytelling video workflow tutorial",
        "làm phim hoạt hình 3D bằng AI"
    ],
    "4. Công cụ, Kỹ thuật Prompt & Tính nhất quán nhân vật (Consistency & Tools)": [
        "character consistency AI video workflow",
        "cách dùng AI làm video chuyên nghiệp",
        "Kling AI Minimax AI video tutorial",
        "cách làm video tiktok shorts bằng AI tự động",
        "Midjourney Consistent Characters video workflow"
    ]
}

final_100 = []
seen_ids = set()

for group_name, query_list in groups.items():
    group_items = []
    print(f"\n=== Thu thập cho nhóm: {group_name} ===")
    for q in query_list:
        if len(group_items) >= 25:
            break
        print(f"  -> Query: '{q}'...")
        cmd = [
            YT_DLP,
            "--dump-json",
            "--skip-download",
            "--flat-playlist",
            f"ytsearch10:{q}"
        ]
        try:
            res = subprocess.run(cmd, capture_output=True, text=True, check=True, timeout=120)
            lines = [l.strip() for l in res.stdout.strip().split("\n") if l.strip()]
            for line in lines:
                try:
                    data = json.loads(line)
                    vid_id = data.get("id")
                    if not vid_id or vid_id in seen_ids:
                        continue
                    title = data.get("title", "").strip()
                    if not title:
                        continue
                    url = data.get("url") or f"https://www.youtube.com/watch?v={vid_id}"
                    channel = data.get("uploader") or data.get("channel") or "Unknown"
                    duration = data.get("duration_string") or str(data.get("duration", "N/A"))
                    views = data.get("view_count") or 0
                    
                    seen_ids.add(vid_id)
                    group_items.append({
                        "id": vid_id,
                        "title": title,
                        "url": url,
                        "channel": channel,
                        "duration": duration,
                        "views": views,
                        "query": q,
                        "category": group_name
                    })
                    if len(group_items) >= 25:
                        break
                except Exception:
                    pass
        except Exception as e:
            print(f"     Lỗi: {e}")
    
    print(f"  => Nhóm '{group_name}' thu được {len(group_items)} video.")
    final_100.extend(group_items[:25])

assert len(final_100) == 100, f"Expected 100 videos, got {len(final_100)}"
assert len(set(x["id"] for x in final_100)) == 100, "IDs must be unique"

with open(JSON_FILE, "w", encoding="utf-8") as f:
    json.dump(final_100, f, ensure_ascii=False, indent=2)

md_lines = [
    "# Danh mục 100 Video: Hệ thống & Cách thức làm Video bằng AI",
    "",
    "Tài liệu phân loại và đối chiếu 100 video thực tế (kèm URL, thời lượng, lượt xem, kênh phát hành) chuyên sâu về cấu trúc hệ thống tự động hóa (Pipeline) và các phương pháp, quy trình sản xuất video từ AI.",
    "",
    "## Mục lục các nhóm chuyên đề",
    "",
    "- [1. Hệ thống Pipeline & Tự động hóa Code (Python, Remotion, FFmpeg, ComfyUI)](#1-hệ-thống-pipeline--tự-động-hóa-code-python-remotion-ffmpeg-comfyui-25-video)",
    "- [2. Hệ thống Kênh Faceless & Tự động xuất bản (Autonomous Channels)](#2-hệ-thống-kênh-faceless--tự-động-xuất-bản-autonomous-channels-25-video)",
    "- [3. Quy trình làm video Kể chuyện, Hoạt hình & Review phim bằng AI](#3-quy-trình-làm-video-kể-chuyện-hoạt-hình--review-phim-bằng-ai-25-video)",
    "- [4. Công cụ, Kỹ thuật Prompt & Tính nhất quán nhân vật (Consistency & Tools)](#4-công-cụ-kỹ-thuật-prompt--tính-nhất-quán-nhân-vật-consistency--tools-25-video)",
    "",
    "---",
    ""
]

curr_cat = None
stt = 1
for v in final_100:
    if v["category"] != curr_cat:
        curr_cat = v["category"]
        md_lines.append(f"\n## {curr_cat} (25 video)\n")
        md_lines.append("| STT | Tên Video | Kênh | Thời lượng | Lượt xem | Link |")
        md_lines.append("|---|---|---|---|---|---|")
    clean_title = v['title'].replace('|', '-').replace('\n', ' ')
    md_lines.append(f"| {stt} | {clean_title} | {v['channel']} | {v['duration']} | {v['views']:,} | [Xem Video]({v['url']}) |")
    stt += 1

with open(MD_FILE, "w", encoding="utf-8") as f:
    f.write("\n".join(md_lines))

print(f"\nThành công! Đã lưu 100 video chuẩn xác vào {JSON_FILE} và {MD_FILE}.")
