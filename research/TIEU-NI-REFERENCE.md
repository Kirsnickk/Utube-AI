# Tham chiếu kênh Tiểu Ni Review

Ngày khảo sát: 13/10/2026. Kênh chính thức: https://www.youtube.com/@TieuNiReview . Channel ID xác nhận từ metadata YouTube: UCcUP2FDvrJSg-WYXUziHBOw.

## Bằng chứng đã đọc

- Lấy metadata và 12 video hiển thị đầu tiên từ trang /videos của đúng handle; lưu tại `tieu-ni-channel.json`.
- Đọc đoạn transcript mở đầu của [video mẫu](https://www.youtube.com/watch?v=E87vPVUc5-w), dài 1:33:48. Nội dung mở bằng tình huống nhân vật xuyên không vào hoàn cảnh nghèo khó, rồi triển khai xung đột và đối thoại nhân vật.
- Chưa xem/nghe trọn video, chưa kiểm tra khung hình trực tiếp. Chưa kết luận video dùng animation, cảnh phim thật, loại giọng AI hoặc công cụ sản xuất nào. Không dùng kênh trùng tên từ kết quả tìm kiếm làm nguồn.

## Quan sát có thể xác nhận

- Tiêu đề của nhóm 12 video tập trung xuyên không, cổ đại, nhân vật nữ, gia đình nghèo, vật tư/không gian đặc biệt và hành trình đổi đời.
- Thời lượng nhóm mẫu từ 1:07:46 đến 3:55:21; đây là video dài, không lấy Shorts 45 giây làm định dạng đích.
- Có tiêu đề P2/P4 cho nội dung nhiều phần.
- Transcript mẫu có nhiều thoại trực tiếp, hỏi đáp và diễn biến hành động. Tên “Review” không đủ chứng minh tất cả video là narration tóm tắt/phê bình.

## Hướng điều chỉnh hệ thống — đề xuất, chưa thực thi

```text
Brief câu chuyện / tư liệu có quyền sử dụng
 → story bible hoặc hồ sơ nhân vật/nguồn
 → outline theo chương
 → kịch bản từng cảnh và thoại có speaker ID
 → storyboard và shot list
 → audio từng cảnh + phụ đề
 → minh họa/clip theo lựa chọn nguồn
 → render từng chương có checkpoint
 → kiểm tra continuity, lời thoại, hình/âm
 → ghép MP4 dài và thumbnail
```

### Vai trò ba agent

- Grok: cấu trúc truyện, arc, story bible và kiểm tra continuity giữa chương.
- Nemotron Super: viết/tái cấu trúc cảnh và thoại từ brief/nguồn được cung cấp; ghi speaker ID, cảm xúc và thông tin nhân vật.
- Gemini: storyboard/shot list, prompt hình hoặc chọn clip từ asset manifest; thiết kế thumbnail và dựng cảnh qua tool.

LLM không thay thế model sinh ảnh/clip hay TTS đa giọng. OmniRoute hiện đã xác nhận ba model chat, chưa xác nhận provider image/video/audio tương ứng.

### Các phần MVP có thể giữ

OmniRoute adapters, job lock, manifest/checkpoint, fingerprint cache TTS, FFmpeg/FFprobe, artifact output và tests.

### Các phần phải mở rộng

- Schema hiện tại chỉ 2–8 cảnh, lời dẫn ngắn; cần chapter/scenes/speakers và continuity state.
- Template diagram/audio/checklist hiện dành cho explainer; cần scene ảnh/clip/storyboard.
- Cần asset provenance, character reference và kiểm soát tính nhất quán nhân vật.
- Có thể cần TTS đa giọng nếu chọn hướng đối thoại; chưa chọn giọng trước khi chốt format.
- Render theo chương giúp sửa/tiếp tục mà không render lại cả video hàng giờ.

## Quyết định đang chờ người dùng

1. Truyện gốc xuyên không minh họa AI.
2. Lồng tiếng từ phim/hoạt hình có quyền sử dụng.
3. Tóm tắt/bình luận từ nguồn có quyền sử dụng.

Không sao chép kịch bản/nhân vật/tình tiết cụ thể của video mẫu vào ví dụ mới. Nếu chọn truyện gốc, đề xuất làm pilot 3–5 phút để nghiệm thu chất lượng nhân vật/giọng/nhịp, rồi tăng thời lượng theo chương. Pilot là đề xuất triển khai, không phải thời lượng quan sát của kênh.
