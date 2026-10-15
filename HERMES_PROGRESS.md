# Tiến độ tiếp tục dự án

## Phạm vi
Hoàn thiện pipeline local original/review → MP4 ngang 1920×1080, ảnh theo scene, không chữ chèn, SRT riêng; không approve/upload thay người dùng. Giữ job cũ, không đổi model pipeline, không reset lịch sử call.

## Baseline thực thi
- `node --test`: exit 0, 16/16 pass.
- `node src/cli.mjs doctor`: exit 0; ba model pipeline có trong `/models`; FFmpeg/FFprobe/Chrome có. Doctor tổng thể `ok:false` (phiên bản Hyperframes mới và các thành phần tùy chọn/Docker thiếu); không cài thêm khi renderer hiện tại đủ dùng.
- Workspace không có Git, không có AGENTS.md trong các thư mục tổ tiên.
- Original checkpoint 5/8 attempts, một chương, lỗi HTTP 401 cũ. Chưa resume để tránh lãng phí budget.
- Đã đọc CLI, narrative, gateway, core, media và image-video: thiếu bridge; image-first xoay ảnh toàn cục, chưa ràng buộc ảnh/scene.
- Chương 1 có lỗi tên Bà Mạnh/Bà Mận và ngôn từ lạc ngữ cảnh; cần bản biên tập có provenance, không sửa âm thầm checkpoint cũ.

## Kế hoạch kiểm chứng
1. Kiểm tra writer bằng probe độc lập có log, không chỉnh server hay credentials; gọi hai reviewer đúng model qua request streaming tường minh.
2. Thêm `src/narrative-video.mjs` và CLI `render-narrative`, test trước tại `test/narrative-video.test.mjs`: giữ speaker/source/scene, kiểm tra assets trước TTS, khóa/resume/input fingerprint.
3. Sửa `src/image-video.mjs` để hỗ trợ ảnh scene cụ thể và giữ tương thích bản cũ; regression test trước.
4. Hoàn tất narrative original nếu writer dùng được; nghiên cứu nguồn nội dung tập phim thật cho review. Không giả nguồn hay gọi catalog là recap.
5. Dựng job mới, ffprobe/decode/audio/SRT/frame QA, chạy lại tests, review độc lập và cập nhật README/status.

## Lệnh kiểm thử
`node --test`; `node src/cli.mjs render-narrative <new-id> <narrative-id> <asset-map.json>`; chạy lại cùng lệnh để kiểm tra resume không gọi agent/TTS/render.

## Mốc đã thực thi
- Thêm `src/narrative-video.mjs`, CLI render-narrative và map ảnh theo scene; test RED→GREEN cho bridge, resume/input thay đổi và binding ảnh.
- Original source mới `story-editorial-002`, review source `review-editorial-002`: host biên tập rõ provenance, không gọi pipeline LLM. Source cũ giữ nguyên.
- Hai MP4 thật `story-film-002` (187.634s), `review-film-002` (191.8s), 1920×1080 H.264/AAC. Chi tiết `research/pilot-qa.json`.
- `node --test`: exit0, 20/20. `node scripts/qa-pilots.mjs`: exit0, cả hai pass codec/duration/decode/SRT/hash; rerun không đổi bytes/mtime video, HTML, audio/cues và không tăng agentCalls.
- Đã xử lý các phát hiện từ 2 subagent reviewer:
  1. Fix `src/delivery.mjs`: nguồn dạng object không có `url` được định dạng `id (locator)`, tránh bị biến thành `[object Object]`.
  2. Bổ sung 2 test tự động: kiểm tra định dạng source trong `delivery.test.mjs`, kiểm tra `format: 'portrait'` trong `image-video.test.mjs`, và kiểm tra validation `scope: 'episode'` / non-PNG header trong `narrative-video.test.mjs`.
  3. Bắt lỗi `ENOENT` rõ ràng khi file asset đã copy bị xóa lúc resume trong `narrative-video.mjs`.
- Xem contact sheet 12 frame/job đầu, trước/sau ranh giới scene, cuối: không thấy chữ chèn/khung đen; original vector còn đơn giản, review ảnh biểu tượng không phải footage.
- `qa-decode.log`: không black >=1s hoặc silence>=2s; chỉ QA kỹ thuật, chưa nghe phát âm.
- Writer probe stream/nonstream HTTP200; resume thật thất bại `Gateway returned no text; finish reason: length`, checkpoint tăng đúng lên6/8. Không retry thêm vì còn2 lượt không đủ3 stage còn lại.
- Nguồn review: Exa→Jina→yt-dlp; loại kết quả bản1994. Bản2010 không caption track; video_analyze không hỗ trợ provider. Đã đọc khung hình timestamp trực tiếp và đối chiếu recap; gói evidence trong research/TAM-QUOC-EP01-EVIDENCE.md.
- Review requests đúng model lưu research/reviewer-initial.json và reviewer-final.json: Sonnet401 thiếu credential Kiro; Ultra HTTP200 nhưng body timeout180s. Hai reviewer runtime độc lập đã hoàn thành thẩm định mã nguồn và QA artifact mà không gán nhãn sai cho cặp Sonnet/Nemotron.
- Browser playback QA qua browser_exec và Chrome DevTools bị chặn vì không có CDP9222. Computer-use list_apps hoạt động; không giành focus desktop. Kiểm chứng media bằng ffmpeg và frame thực, không tuyên bố playback UI pass.
- README/status đã cập nhật lệnh chạy, giới hạn8calls local và provenance/QA.

## Chưa hoàn tất
Đánh giá nghe phát âm của người dùng, khôi phục pipeline LLM original 6/8 attempts. Chưa approve/upload. Không tuyên bố toàn bộ kênh hay autonomous pipeline đã hoàn tất.
