# Kết quả triển khai

## Cập nhật tiếp tục — 14/10/2026

- CLI `render-narrative` nối cả original/review tới TTS → ảnh từng scene → MP4; giữ speaker/source/kind trong narrative và script ở manifest; không ghi đè nguồn. Bridge kiểm tra mapping/nguồn/quyền ảnh và fingerprint, có checkpoint cho bước chuẩn bị, resume không tái tạo media.
- `jobs/story-film-002/video.mp4`: 187.634s, 1920×1080, H.264/AAC, 6 cảnh, 44 cue SRT. Minh họa vector nguyên bản, không phải diffusion.
- `jobs/review-film-002/video.mp4`: 191.8s, 1920×1080, H.264/AAC, 6 cảnh, 33 cue SRT. Review chặng dâng đao tập1 bản2010; ghi chú khung hình timestamp + recap thứ cấp tại research/TAM-QUOC-EP01-EVIDENCE.md. Không xem/nghe toàn tập; không dùng footage phim.
- Hai kịch bản do Hermes host biên tập, không qua pipeline ba model (`agentCalls=0`). Original lấy bible của checkpoint cũ, sửa tên Bà Mận và viết lại continuity; giữ checkpoint cũ.
- Writer Super probe HTTP200; resume checkpoint cũ thất bại do output hết token không có content, attempts6/8. Không đổi model/credential/counter.
- `node --test`: 18/18 pass; `node scripts/qa-pilots.mjs`: cả hai pass decode/codec/duration/SRT/hash và rerun media bytes+mtime không đổi. QA chi tiết: research/pilot-qa.json, từng job/qa.json và qa-contact.png.
- Audio mean/peak original -19.3/-3.6dB; review -19.7/-2.3dB. Không phát hiện black>=1s hoặc silence>=2s ở ngưỡng -45dB. Chưa nghe đánh giá phát âm; vẫn stage review, chưa approve/upload.
- Contact sheets đã xem: không chữ chèn hoặc khung trống; vector original còn đơn giản/biểu tượng, không hoạt hình nhân vật. Ảnh review không phải hình diễn viên thật.
- Hyperframes check chạy thành công nhưng còn lint/overflow do template và pan/zoom; không tuyên bố zero-warning.
- Reviewer yêu cầu: kr/claude-sonnet-4.5 HTTP401 thiếu credential Kiro; ollamacloud/nemotron-3-ultra HTTP200 nhưng timeout hai lần. Hai reviewer runtime bổ sung đang kiểm tra; chưa ghi nhận kết luận cuối.

## Lịch sử 13/10/2026

MVP worker local đã chạy từ đầu vào có nguồn đến MP4 thực tế. Ba model đã trả kết quả qua OmniRoute: `grok-cli/grok-4.7`, `ollamacloud/nemotron-3-super` (thay Ultra theo lựa chọn người dùng), `agy/gemini-3.8-flash-tiered`.

- Video: `jobs/video-001/video.mp4`, 44.534 giây, 1080×1920, H.264 + AAC, 2.23 MB.
- Brief/kịch bản/thiết kế: agent tạo thật, lưu trong `job.json`. Builder trả thiết kế khai báo; template dựng nằm trong code, không thực thi code tùy ý từ model.
- TTS: gTTS tiếng Việt, caption theo câu đo bằng ffprobe. Edge TTS thử nghiệm gặp NoAudioReceived; backend hiện dùng gTTS.
- Hyperframes check: 0 lỗi lint, 0 lỗi runtime, 0 vấn đề layout trên 9 mẫu, 30/30 contrast checks đạt. Còn 14 cảnh báo cấu trúc scene và metadata timeline; không phải chế độ strict/zero-warning.
- Render: drawelement/hardware GPU, 39.2 giây render; kiểm tra nhiều frame ở 3/15/26/39 giây.
- Audio: mean -19.7 dB, peak -2.8 dB; có audio giải mã được. Chưa đánh giá giọng/phát âm bằng nghe thủ công.
- Tests: 6/6 đạt, gồm lock, state, đường dẫn, schema/escaping, hash approval và resume upload đã hoàn tất mà không tạo session trùng.
- Rerun job đã hoàn tất không gọi LLM hoặc tạo lại asset/render.

Đã tạo key gateway tên AI YouTube MVP bằng API OmniRoute local; key ở storage OmniRoute, không in hoặc sao chép vào project. Kết nối đọc database read-only.

Chưa upload thật: chưa có OAuth YouTube client/refresh token. Uploader là private, kiểm tra hash đã duyệt và dùng resumable session; đã kiểm thử mô phỏng nhưng chưa thử trên kênh thực tế. Không có scheduler, tự publish, dashboard hoặc analytics trong bản MVP.

Chạy video mới: `./run.ps1 run video-002 examples/topic.json`.
Xem hướng dẫn và cấu hình tại README.md.

## Nâng cấp từ nghiên cứu repo — template v2

- Bản đã kiểm tra: `jobs/video-003/video.mp4`, tiếp nối job gốc qua lệnh revise; không gọi agent/TTS thêm.
- Module scene: process, audio waveform, checklist, title. Bản mẫu dùng ba loại đầu; waveform đo từ audio thực.
- Hyperframes check: 0 lỗi/0 warning runtime, 0 lỗi layout, 66/66 contrast checks đạt. Còn 14 warning cấu trúc composition, không tuyên bố strict pass.
- 9/9 tests đạt; thêm kiểm tra thiết kế không tin cậy, timing tương thích và fingerprint cache.
- Đã kiểm tra frame các cảnh của template v2 và metadata MP4; TTS/word-level caption vẫn chưa nâng cấp bằng VieNeu/faster-whisper.

## Hai chế độ narrative đã chọn

- `plan-story` hỗ trợ original và review, với checkpoint bible/chapter/storyboard, source ID cho review và kiểm tra speaker/scene.
- 12/12 tests đạt. Review nguồn catalog được chuẩn bị cho Thủy Hử 2011 và Tam Quốc 2010; chưa sinh recap từng tập.
- Pilot original “Tiếng Guồng Mùa Hạn”: có story bible và chương đầu; chưa hoàn tất kịch bản/storyboard, chưa có MP4 narrative. Lần chạy tiếp gặp HTTP 401 từ agent writer qua Ollama Cloud; không đổi sang model khác để che lỗi.
- OmniRoute không còn công bố `agy/gemini-3.8-flash-tiered`; config local dùng cùng dòng `agy/gemini-3.8-flash-high` đang công bố. Chưa thực thi stage storyboard của pilot này.

## Tập thử Tam Quốc

- Đầu ra: `jobs/tam-quoc-pilot-01/video.mp4`, 184.6 giây (khoảng 3:05), 1920×1080, H.264/AAC, khoảng 8.4 MB.
- Kịch bản biên tập bởi Codex, thông tin phiên bản từ catalog iQIYI và phần bình luận riêng. Phạm vi: giới thiệu series/góc nhìn review, chưa recap một tập phim. Không dùng footage phim.
- OmniRoute writer vẫn HTTP 401, nên dùng nhánh `render-script` và ghi provenance chính xác. Không tuyên bố bộ phim thử này do đủ ba agent sinh.
- 7 cảnh, gTTS tiếng Việt, caption theo câu; có script.md và subtitles.srt. Template ngang mới có thể render kịch bản chuẩn bị sẵn.
- Hyperframes: 0 lỗi/0 warning runtime, 0 vấn đề layout trên 9 mẫu, 57/57 contrast checks đạt; 43 cảnh báo cấu trúc/metadata lint, không strict pass.
- Đã xem khung hình đầu/giữa/cuối; audio giải mã được, mean -19.6 dB, peak -3.5 dB. Chưa xác nhận phát âm bằng nghe thủ công.
- 14/14 tests đạt, gồm subtitle timing và contract canvas ngang. Chưa upload YouTube.

## Bản sửa ưu tiên hình ảnh

- Người dùng yêu cầu hình ảnh thay cho chữ. Bản mới `jobs/tam-quoc-images-01/video.mp4`: toàn màn hình là ảnh minh họa AI, pan/zoom nhẹ và giọng đọc cũ; không tiêu đề, bảng hoặc phụ đề chèn trong MP4.
- 4 ảnh được tạo bằng built-in ImageGen, lưu trong `assets/tam-quoc`; prompt đầy đủ tại PROMPTS.md. Cảnh hư cấu mang không khí cổ trang, không phải footage/still của bản phim 2010.
- 184.6 giây, 1920×1080, video/audio stream hợp lệ. Render 2m07s. SRT vẫn được xuất riêng.
- 16/16 tests đạt; template có 0 text element; đã xem frame 3/35/85 giây. Hyperframes check đạt, có thông báo ảnh overflow do pan/zoom và clipping chủ đích, không phải zero-finding strict pass.
- Bản cũ và toàn bộ ảnh gốc giữ nguyên. Chưa upload.
