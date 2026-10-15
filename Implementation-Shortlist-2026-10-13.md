# Nguồn chọn để triển khai hệ thống ba agent

Ngày: 13/10/2026. Đây là shortlist triển khai và thứ tự học; chưa cài công cụ, gọi ba agent hay upload video. Đánh giá dựa trên transcript/nội dung được trích xuất và tài liệu chính thức, chưa kiểm thử workflow của tác giả. Model ID theo thông tin người dùng, chưa benchmark hoặc kiểm tra endpoint.

## Quyết định đề xuất

MVP: video giải thích tiếng Việt 30–60 giây, motion graphics, Hyperframes làm renderer; Grok lập brief/điều phối, Nemotron research/script, Gemini xây composition. TTS và media là dịch vụ riêng. Dùng worker local và manifest trước, thêm n8n khi pipeline một video chạy ổn định. Đây là lựa chọn thiết kế phù hợp hướng hai video gốc, không phải kết luận benchmark.

## Sáu nguồn video cốt lõi

| Thứ tự | Nguồn | Phần áp dụng | Đầu ra cần làm được |
|---|---|---|---|
| 1 | [HeyGen: Hyperframes Explained, Episode 1](https://www.youtube.com/watch?v=IDkycf5vfhI) | Hiểu code/asset/animation/render | Một project xuất MP4 |
| 2 | [HeyGen: Connect Hyperframes to Any AI Agent, Episode 2](https://www.youtube.com/watch?v=4iMWm0aOx8E) | Skills và kết nối coding agent | Gemini sử dụng đúng hướng dẫn engine trong môi trường có shell/filesystem |
| 3 | [Artificial Quotient: Hyperframes + Claude Code tutorial](https://www.youtube.com/watch?v=eOhomP4vees) | Ví dụ prompt → motion graphics | Chuyển ví dụ thành brief JSON và một composition của riêng bạn |
| 4 | [GenAI Unplugged: n8n faceless video workflow](https://www.youtube.com/watch?v=SjNAkOptNvs) | Topic → script → media → render → publish | Học ranh giới từng bước; thay dịch vụ render trong ví dụ bằng worker Hyperframes |
| 5 | [GenAI Unplugged: assemble, approve and publish](https://www.youtube.com/watch?v=lI3U5LCkZuA) | Lấy kết quả render, tải binary, duyệt và lưu Drive | Chỉ tiếp tục từ bản render đã thành công và quyết định duyệt rõ ràng |
| 6 | [Jay Peters: Stable YouTube Uploads with HTTP Requests](https://www.youtube.com/watch?v=hsR_Cer1E8o) | OAuth, HTTP upload, self-hosted n8n và file lớn | Upload private, lưu video ID và xử lý lỗi mạng |

Video #6 xuất bản năm 2025; các cấu hình binary storage và cách upload phải đối chiếu phiên bản n8n/API đang dùng. Trong mô tả tác giả có link `videos.update` được gọi là upload definition: endpoint tạo upload mới là `videos.insert`, theo tài liệu Google.

## Tài liệu chính thức cần đọc cạnh video

| Tài liệu | Quyết định triển khai |
|---|---|
| [Hyperframes README](https://github.com/heygen-com/hyperframes) | Đọc quickstart hiện hành, bắt đầu core skills, lint/preview/render theo engine |
| [VieNeu-TTS](https://github.com/pnnbao97/VieNeu-TTS) | Thử giọng Việt; kiểm tra checkpoint/license, đo phát âm và thời lượng thực tế |
| [faster-whisper](https://github.com/SYSTRAN/faster-whisper) | Timestamp phụ đề từ audio, kiểm tra lại từ tiếng Việt và tên riêng |
| [n8n YouTube node](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.youtube/) | Dùng node upload nếu đáp ứng; HTTP Request cho trường không được node hỗ trợ |
| [Google Upload a Video](https://developers.google.com/youtube/v3/guides/uploading_a_video) | Uploader OAuth; không đưa secrets vào prompt |
| [Google videos.insert](https://developers.google.com/youtube/v3/docs/videos/insert) | Metadata, privacy và AI disclosure; dự án chưa audit có thể bị ép private |
| [Google resumable uploads](https://developers.google.com/youtube/v3/guides/using_resumable_upload_protocol) | Lưu session và tiếp tục upload sau khi mạng gián đoạn |
| [YouTube monetization](https://support.google.com/youtube/answer/1311392) | Thiết kế mỗi video có nội dung nguyên bản và giá trị khác biệt |
| [YouTube AI disclosure](https://support.google.com/youtube/answer/14328491) | Đánh giá trường hợp phải khai báo, lưu quyết định vào metadata |

## Nguồn từ danh sách dán: chọn lại sau kiểm tra

- [Research to Upload — Aslam Speaks](https://www.youtube.com/watch?v=-CADaGVLmqY): hữu ích cho research đối thủ, ý tưởng, script, thumbnail và metadata. Phần trích xuất đã đọc chưa chứng minh có renderer/TTS hoàn chỉnh; không coi đây là nguồn duy nhất cho toàn pipeline.
- [Automatically Upload — Life of an AI Engineer](https://www.youtube.com/watch?v=7WcvRqPGfAU): nguồn bổ sung cho schedule và video có sẵn trong thư mục/Drive; không thay renderer.
- [Shorts and reels with n8n — University Of Backbencher's](https://www.youtube.com/watch?v=fSrYnNsh9ME): nội dung đọc được là video giới thiệu khóa học, không phải tutorial FFmpeg end-to-end như mô tả dán gợi ý. Không chọn làm nguồn triển khai chính.
- [n8n + HeyGen — Zen8n](https://www.youtube.com/watch?v=MVxUafQF7o8): để dành khi cần avatar. Trích đoạn dùng Wait theo số giây; timeout không tương đương quyết định duyệt. Khi triển khai phải nhận một sự kiện approve/reject thật và gắn với version script/video.

## Hợp đồng công việc cho ba agent

### Grok — brain

Đầu vào: topic, audience, format, style, budget và nguồn ban đầu. Đầu ra: `brief.json`, phân công, quyết định QA. Không tự bịa nguồn; không coi điểm tự chấm là dự báo viral. Chỉ duyệt version cụ thể của script/composition/render. Chuyển việc thực thi và trạng thái bền vững cho scheduler/worker.

### Nemotron — nội dung

Đầu vào: brief. Đầu ra: `research.md`, `script.json`, `claims.json`, `metadata.json`. Mỗi claim kiểm chứng được liên kết nguồn; script chia scene theo ý, không áp số ký tự thành số giây cứng. Dùng TTS để đo lại nhịp/thời lượng. Nếu môi trường thiếu web tool thì nhận nguồn đã fetch thay vì giả vờ đã nghiên cứu.

### Gemini/Antigravity — dựng

Đầu vào: brief, script đã chốt, voice WAV, timestamp, asset có provenance. Đầu ra: project Hyperframes, preview, MP4, `render-manifest.json`. Dùng tool render thật, đọc exit code và kiểm tra file; không chỉ viết code rồi báo video hoàn thành. Nếu agent không có shell/filesystem thì gửi composition cho worker thực thi.

CLI và API là hai giao diện khác nhau. Cần xác minh endpoint OmniRoute và cách gọi từng agent trước khi nối n8n. Không suy ra tên provider/model đủ chứng minh tương thích OpenAI hoặc tool calling.

## Chuỗi triển khai

```text
topic
 → Grok brief
 → Nemotron research + script
 → kiểm tra schema/claims
 → TTS + timestamp + asset manifest
 → Gemini composition
 → Hyperframes worker render
 → kiểm tra MP4 + xem/nghe preview
 → approve phiên bản cụ thể
 → YouTube private upload
 → kiểm tra xử lý và xem lại trên YouTube
 → xuất bản/lên lịch khi dự án và nội dung đủ điều kiện
```

Job store tối thiểu: `job_id`, `stage`, `script_version`, `render_hash`, `asset_ids`, `approved_version`, `media_task_ids`, `upload_session`, `youtube_id`, `retry_count`, `error`, `cost`. Giữ khóa job; không tạo upload mới khi retry mà chưa đối chiếu session/video ID.

## Thứ tự nghiệm thu

1. Một MP4 tiếng Việt 30–60 giây từ pipeline local, caption khớp audio, chữ không tràn khung.
2. Năm video cùng format nhưng nội dung khác biệt; ghi thời gian, chi phí và số lần sửa để đánh giá.
3. Chạy lại một job không sinh lại asset hợp lệ hoặc tạo bản đăng trùng.
4. Ngắt thử ở bước media/render và tiếp tục từ trạng thái đã lưu.
5. Upload private đúng kênh OAuth, lưu video ID và xác nhận video xử lý xong.
6. Thêm lịch chạy và n8n sau khi các bước trên đạt.

Nhánh mở rộng: [Remotion skills](https://www.remotion.dev/docs/ai/skills) nếu chọn engine React thay Hyperframes; [ComfyUI Wan 2.2](https://docs.comfy.org/tutorials/video/wan/wan2_2) nếu cần clip sinh AI; [HeyGen workflow](https://www.youtube.com/watch?v=9yx8Ja1gztI) nếu cần avatar. Không thêm cả ba vào MVP.
