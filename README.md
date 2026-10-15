# AI YouTube — MVP local

Ba agent qua OmniRoute → kịch bản → giọng Việt → Hyperframes → MP4 → duyệt hash → YouTube private upload.

## Nhánh truyện gốc và review phim

```powershell
./run.ps1 plan-story story-pilot-001 examples/original-story.json
./run.ps1 plan-story film-review-001 examples/review-input.example.json
```

`plan-story` tạo story bible/outline bằng Grok, kịch bản theo chương có speaker ID bằng Nemotron và storyboard bằng Gemini. Lưu checkpoint vào `narrative.json`, đọc kịch bản tại `script.md`, shot list tại `storyboard.json`. Dùng `render-narrative` bên dưới để nối narrative sang renderer hiện có. Target duration là brief; thời lượng nghiệm thu phải lấy từ audio/MP4 thực.

Mode `original` sáng tác từ premise riêng. Mode `review` bắt buộc có source text thật; file review mẫu chưa điền sẽ bị từ chối trước khi gọi agent. Mỗi dòng review được phân loại summary/commentary và phải tham chiếu source ID hợp lệ. Việc có source ID không tự chứng minh nội dung đúng; vẫn cần duyệt với nguồn.

## Render narrative thành MP4

```powershell
./run.ps1 render-narrative story-film-002 story-editorial-002 examples/original-assets.json
./run.ps1 render-narrative review-film-002 review-editorial-002 examples/review-assets.json
node scripts/qa-pilots.mjs
```

Hai job trên đã có video thật; chạy lại đúng input chỉ kiểm tra/resume, không gọi LLM hoặc tạo lại audio/render. Input/source/asset thay đổi phải dùng job ID mới. Không chạy `plan-story` trên các bản editorial hoặc job video.

- Narrative nguồn phải ở stage `plan_review`, có bible/script ba chương/storyboard hợp lệ. Hai pilot mới là **host biên tập**, `agentCalls=0`; không giả là output ba model pipeline. Original giữ bible từ job cũ, viết lại chương và sửa continuity. Checkpoint cũ giữ nguyên (6/8 attempts; lỗi cuối hết token).
- Asset map: `{ "shots": [{ "sceneId": "c1s1", "file": "assets/.../scene.png", "provenance": { "origin": "Nguồn ảnh", "rights": "Quyền sử dụng" } }] }`. Một PNG mỗi scene, đường dẫn tương đối nằm trong project, không URL/đường dẫn thoát thư mục. Kiểm tra mapping/provenance trước TTS; ảnh sao chép vào job và gắn SHA-256.
- Review cần nguồn nội dung tập (`scope: "episode"`, `locator` là timestamp hoặc heading xác định) và source ID hợp lệ từng dòng. Trường này không tự chứng minh claim đúng: xem `research/TAM-QUOC-EP01-EVIDENCE.md` và đối chiếu nguồn.
- Delivery gồm MP4, SRT riêng, script.md, narrative.json (speaker/kind/source IDs), storyboard.json, asset-provenance.json, job.json và qa.json. TTS hiện là **một giọng**, không giả giọng riêng từng nhân vật.
- Original dùng minh họa vector nguyên bản; review dùng ảnh AI cổ trang nguyên bản có sẵn, biểu tượng chứ không tái tạo cảnh/diễn viên phim. Không chèn tiêu đề/bảng/phụ đề vào video.
- Nghiệm thu kỹ thuật: codec/duration/SRT/hash, decode toàn video, contact sheet đầu/cuối và ranh giới scene, chạy lại kiểm tra bytes/mtime media không đổi. Nghe đánh giá phát âm vẫn cần người dùng; chưa approve/upload.

## Chạy

Để render kịch bản đã biên tập thành tập ngang 16:9:

```powershell
./run.ps1 render-script tam-quoc-pilot-01 examples/tam-quoc-episode-01.json
```

File spec chứa script, design, format và provenance. Lệnh không gọi LLM; dùng khi đã có kịch bản được kiểm tra hoặc gateway lỗi. Job lưu nguồn tạo kịch bản, không báo là agent-generated. Ngoài MP4/preview, pipeline xuất `script.md` và `subtitles.srt`.

Theo lựa chọn hình ảnh thay cho chữ, `design.visualMode: image-first` dùng ảnh local toàn màn hình với pan/zoom; không render tiêu đề, bảng hoặc caption lên hình. Giữ audio và xuất SRT riêng. Bản mẫu `tam-quoc-images-01` dùng bốn minh họa nguyên bản tại `assets/tam-quoc`, không dùng ảnh cắt từ phim. `revise` sao chép cả ảnh khi tạo phiên bản mới.

```powershell
node src/cli.mjs doctor
node src/cli.mjs demo demo-001
node src/cli.mjs run video-001 examples/topic.json
node src/cli.mjs status video-001
node src/cli.mjs revise video-001 video-002
```

`demo` dùng kịch bản mẫu cố định, không gọi LLM. `run` gọi đúng model ID trong config và lưu các bước để tiếp tục cùng job ID. Giới hạn theo `maxAgentCallsPerJob` (config local hiện là 8; tính cả lần gọi thất bại); usage thực tế trả về được ghi trong manifest, chưa có bộ tính chi phí USD. Agent writer dùng facts/sources đầu vào, chưa có web research tự động. Builder tạo thiết kế khai báo (màu/nhãn), renderer dùng template code kiểm soát được.

Template v2 có scene process, audio waveform và checklist; waveform đo từ audio thực. Loại title cũng được hỗ trợ qua `design.scenes`. Các scene mới giữ timing caption/audio. `revise` tạo job mới từ script và audio của bản cũ, không gọi lại agent/TTS, rồi render với template mới. Job đích phải chưa tồn tại; bản cũ giữ nguyên. Template version và parent job lưu trong manifest.

Cache TTS được gắn fingerprint của narration/backend/voice; khi cache không khớp, sinh lại toàn bộ audio parts để tránh ghép nhầm lời dẫn cũ.

Config local được bỏ qua khi commit. API key OmniRoute đọc trực tiếp database local ở chế độ read-only, không sao chép vào file job; có thể ưu tiên biến `OMNIROUTE_API_KEY`. Không sửa database hoặc cấu hình server OmniRoute.

TTS mẫu hiện dùng `gTTS` tiếng Việt vì Edge TTS không trả audio ổn định trên máy này. Mỗi câu được sinh riêng, đo thời lượng bằng ffprobe rồi ghép lại; caption là từng câu, không phải word-level alignment. Backend `edge` có timestamp từ service nhưng chưa hoạt động ổn định. Cần mạng; đây là dịch vụ thử nghiệm, chưa phải hợp đồng TTS production. Có thể thay `scripts/tts.py` bằng VieNeu hoặc dịch vụ có license/SLA phù hợp.

Trên máy hiện tại dùng `./run.ps1 run video-002 examples/topic.json`. Máy mới có runtime Codex có thể cài lại với `./scripts/setup.ps1`. `scripts/connect-omniroute.mjs` đăng nhập bằng INITIAL_PASSWORD local nếu còn hợp lệ, tìm hoặc tạo key tên AI YouTube MVP; không in key/password. Gateway chỉ đọc key này từ storage, không ghi token vào project.

Đầu ra `jobs/<id>/`: `job.json`, voice từng scene, timestamp, HTML, log check/render, MP4 và preview. Khóa job ngăn hai worker; `unlock` chỉ cho phép khi PID cũ không tồn tại. Nếu sửa script hoặc template thủ công, tạo job ID mới; không sửa manifest để tái dùng cache cũ.

## Upload YouTube

Tạo Google OAuth client, bật YouTube Data API, lấy refresh token với scope `https://www.googleapis.com/auth/youtube.upload`. Đặt ba biến môi trường `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REFRESH_TOKEN`. Không dán credential vào chat hoặc commit.

Xem/nghe video rồi chạy:

```powershell
node src/cli.mjs approve video-001 --ai-disclosure-yes
node src/cli.mjs upload video-001
```

Chọn `--ai-disclosure-no` nếu nội dung không thuộc diện khai báo theo [tiêu chí YouTube](https://support.google.com/youtube/answer/14328491). Upload luôn private; không có tự publish/schedule ở MVP. Made-for-kids mặc định false trong code dành cho mẫu giải thích kỹ thuật người lớn; thay cấu hình uploader nếu đổi đối tượng. Dự án API chưa audit có thể bị giới hạn private. Upload lưu session resumable và video ID để truy vấn/tiếp tục, không mở session mới khi timeout. Sau upload cần kiểm tra xử lý và xem bản trên YouTube Studio.

## Kiểm tra

```powershell
node --test
```

Kiểm tra khóa job, ghi state, đường dẫn, schema, escaping. Pipeline chạy Hyperframes check rồi render, dùng ffprobe để xác nhận audio/video, 1080×1920 và duration. Chưa có scheduler, dashboard, tự sinh ảnh/clip, analytics hoặc OAuth login wizard; đây là MVP worker local.
