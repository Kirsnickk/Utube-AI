# Repo để học và nâng cấp AI Video MVP

Nghiên cứu ngày 13/10/2026: 3 truy vấn Exa, 24 kết quả ứng viên; đối chiếu README của các repo chọn và GitHub tree cho bốn pipeline. Đây là đánh giá độ phù hợp kiến trúc, chưa chạy/audit các repo ngoài dự án. Không dùng số sao hoặc cam kết doanh thu làm bằng chứng chất lượng.

## Ưu tiên học

| Repo | Học gì | Áp dụng vào MVP |
|---|---|---|
| [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes) | Composition, timing, agent skills, lint/check/render | Nâng template, cảnh có đồ họa riêng, scene module và preview |
| [harry0703/MoneyPrinterTurbo](https://github.com/harry0703/MoneyPrinterTurbo) | Tách dịch vụ LLM, footage, subtitle, state, artifact và task orchestration | Tách `cli.mjs`/`media.mjs` thành các service và thêm asset provider |
| [gyoridavid/short-video-maker](https://github.com/gyoridavid/short-video-maker) | Scene-based Shorts, REST/MCP, Pexels, TTS, Whisper và Remotion | Đóng worker thành API, học schema scene và giới hạn concurrency |
| [pnnbao97/VieNeu-TTS](https://github.com/pnnbao97/VieNeu-TTS) | SDK/voice tiếng Việt chạy local | Thử thay gTTS; đo chất lượng, thời gian và tài nguyên trên máy thật |
| [SYSTRAN/faster-whisper](https://github.com/SYSTRAN/faster-whisper) | Transcript/timestamp từ audio và CPU/GPU inference | Phụ đề chi tiết hơn, kiểm tra lời nói so với script |
| [taskforcesh/bullmq](https://github.com/taskforcesh/bullmq) | Queue, workers, retries/backoff, delayed jobs, parent-child jobs | Thay file lock khi cần nhiều worker hoặc schedule; thêm backend queue có persistence |
| [NesDevr/video-factory](https://github.com/NesDevr/video-factory) | Pipeline nhiều agent, checkpoint, review gates, replay fixtures và cost traces | Học stage runner, lưu phản hồi QA và chỉ sinh lại stage lỗi |
| [Gaurav1112/video-money-maker](https://github.com/Gaurav1112/video-money-maker) | Remotion components, SQLite queue, Express API, n8n publish, nhiều định dạng | Học thư viện scene cho explainer và API điều phối |
| [remotion-dev/remotion](https://github.com/remotion-dev/remotion) | Renderer React, composition, captions và batch render | Phương án engine thay thế nếu chọn React; không cần đổi engine MVP ngay |
| [n8n-io/n8n](https://github.com/n8n-io/n8n) | Workflow UI, triggers, HTTP, integrations và approval | Điều phối worker qua HTTP sau khi pipeline ổn định |

## File đã đối chiếu trên GitHub để bắt đầu đọc

### MoneyPrinterTurbo

- [app/services/task.py](https://github.com/harry0703/MoneyPrinterTurbo/blob/main/app/services/task.py): xem cách task gọi các dịch vụ và xử lý đầu ra.
- [app/services/state.py](https://github.com/harry0703/MoneyPrinterTurbo/blob/main/app/services/state.py): xem mô hình trạng thái.
- [app/services/task_artifacts.py](https://github.com/harry0703/MoneyPrinterTurbo/blob/main/app/services/task_artifacts.py): học cách quản lý artifact.
- [app/services/material.py](https://github.com/harry0703/MoneyPrinterTurbo/blob/main/app/services/material.py) và [material_cache.py](https://github.com/harry0703/MoneyPrinterTurbo/blob/main/app/services/material_cache.py): sourcing/caching media.
- [app/services/subtitle.py](https://github.com/harry0703/MoneyPrinterTurbo/blob/main/app/services/subtitle.py): phụ đề.

Các điểm trên là hướng đọc theo đường dẫn/module; chưa phân tích toàn bộ implementation từng file.

### Video Factory — ví dụ cá nhân, cần đánh giá trước khi dùng

- [factory.py](https://github.com/NesDevr/video-factory/blob/main/factory.py): điểm vào CLI/stage.
- [core/render_sections.py](https://github.com/NesDevr/video-factory/blob/main/core/render_sections.py): render từng section.
- [NarrationSubtitle.tsx](https://github.com/NesDevr/video-factory/blob/main/rendering/remotion/src/components/NarrationSubtitle.tsx): cách trình bày caption.
- [SectionComposition.tsx](https://github.com/NesDevr/video-factory/blob/main/rendering/remotion/src/components/SectionComposition.tsx): composition theo section.

README ghi rõ là personal project. Lệnh clone trong README trỏ một tên repo khác; khi học phải dùng URL thực tế ở bảng. Không coi các review gate của LLM là chứng nhận tính đúng đắn hay chất lượng.

### Short Video Maker

- [ShortCreator.test.ts](https://github.com/gyoridavid/short-video-maker/blob/main/src/short-creator/ShortCreator.test.ts): bắt đầu từ các tình huống kiểm thử để hiểu contract.
- [Pexels.test.ts](https://github.com/gyoridavid/short-video-maker/blob/main/src/short-creator/libraries/Pexels.test.ts): sourcing footage.

README ghi giới hạn voiceover tiếng Anh với kokoro-js. Không đưa nguyên pipeline này vào kênh tiếng Việt khi chưa thay TTS/STT tương ứng.

### Video Money Maker — ví dụ tích hợp, chưa xác nhận production

- [n8n/daily-publish.json](https://github.com/Gaurav1112/video-money-maker/blob/main/n8n/daily-publish.json): workflow publish.
- [config/topic-queue.json](https://github.com/Gaurav1112/video-money-maker/blob/main/config/topic-queue.json): tổ chức topic queue.
- [scripts/__tests__/channel-dedup.test.ts](https://github.com/Gaurav1112/video-money-maker/blob/main/scripts/__tests__/channel-dedup.test.ts): học yêu cầu chống trùng ở mức kênh.

README còn URL clone placeholder và khẳng định chi phí bằng 0; không dùng các mô tả này để dự toán hệ thống của bạn. Các file workflow tồn tại không chứng minh mọi credential/provider vẫn hoạt động.

## Lưu ý license và phạm vi

- Hyperframes: README/repo ghi Apache 2.0.
- Short Video Maker, BullMQ, faster-whisper, Video Factory: repo ghi MIT.
- VieNeu: repo ghi Apache 2.0; kiểm tra riêng model checkpoint và quyền dùng giọng mẫu.
- Remotion: [license riêng](https://www.remotion.dev/license), có trường hợp cần company license.
- n8n: Sustainable Use License/Enterprise License, fair-code; không gọi là MIT hoặc Apache.
- MoneyPrinterTurbo và các dependency/stock/TTS: đọc license tương ứng trước khi sao chép hoặc đưa vào sản phẩm.

## Thứ tự học để cải thiện sản phẩm hiện tại

1. **Hyperframes:** đổi card chữ hiện tại thành 3–5 loại scene: diagram, comparison, chart, code, takeaway. Nghiệm thu bằng preview/video thật.
2. **VieNeu-TTS + faster-whisper:** thử giọng Việt tốt hơn và caption chi tiết hơn. So sánh với gTTS đang chạy, đo tốc độ và phát âm.
3. **MoneyPrinterTurbo + Short Video Maker:** học service boundaries và adapter asset. Giữ giao diện OmniRoute hiện tại.
4. **Video Factory:** thêm checkpoint theo stage, replay test fixtures, review feedback và giới hạn retry.
5. **BullMQ:** chỉ thêm khi cần nhiều worker, lịch chạy và quản lý queue; nếu một worker local thì chưa cần Redis.
6. **n8n:** thêm giao diện điều phối sau khi worker có REST API và cơ chế auth.

Đây là lộ trình đề xuất. Chưa clone, cài đặt hay tích hợp repo mới trong lượt nghiên cứu này.
