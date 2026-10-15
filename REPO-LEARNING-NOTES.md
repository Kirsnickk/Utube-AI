# Áp dụng từ nghiên cứu repo — vòng 1

Đã đọc ba file nguồn để học cách tổ chức, không sao chép code vào dự án:

- [Video Factory / render_sections.py](https://github.com/NesDevr/video-factory/blob/main/core/render_sections.py): kiểu visual ánh xạ tới component và metadata/timing cho section. Áp dụng bằng module scene khai báo trong `src/scenes.mjs`, giữ Hyperframes làm engine.
- [MoneyPrinterTurbo / task_artifacts.py](https://github.com/harry0703/MoneyPrinterTurbo/blob/main/app/services/task_artifacts.py): manifest riêng cho task và ghi file nguyên tử. MVP đã có atomic JSON; bổ sung parent job, template version và fingerprint audio.
- [Short Video Maker / ShortCreator.test.ts](https://github.com/gyoridavid/short-video-maker/blob/main/src/short-creator/ShortCreator.test.ts): kiểm thử contract của dịch vụ media riêng. Áp dụng kiểm thử design không tin cậy, timing tương thích job cũ và cache narration/provider.

Thay đổi v2: scene process/audio/checklist/title; đồ thị waveform từ PCM giải mã của audio thực, không phải dữ liệu giả. `revise` tái dùng script/audio trong job mới, không ghi đè sản phẩm cũ, không tái dùng approval/upload session.

Chưa cài VieNeu/faster-whisper, BullMQ hoặc n8n trong vòng này. TTS và phụ đề vẫn gTTS theo câu. Những repo đó là các vòng nâng cấp tiếp theo, không phải tính năng đã có.
