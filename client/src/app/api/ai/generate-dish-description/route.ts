import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { name, price, status, notes } = await req.json();

    if (!name) {
      return NextResponse.json(
        { message: "Thiếu tên món ăn" },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY as string);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
Bạn là đầu bếp/marketing của nhà hàng. Viết mô tả hấp dẫn cho món ăn bằng tiếng Việt.

Yêu cầu:
- 2–4 câu ngắn gọn, rõ ràng, giàu hình ảnh, không dùng emoji.
- Nêu hương vị, thành phần nổi bật (giả định hợp lý nếu thiếu), texture/kết cấu, cách chế biến.
- Có 1 câu “call-to-action” nhẹ ở cuối.
- Không dùng từ ngữ phóng đại quá đà (“ngon nhất thế giới”...).

Thông tin món:
- Tên: ${name}
- Giá (tham khảo): ${price ? `${price} VND` : "—"}
- Trạng thái: ${status || "—"}
- Ghi chú thêm: ${notes || "—"}

Xuất ra đúng phần mô tả, không tiền tố/hậu tố dư thừa.
    `.trim();

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    return NextResponse.json({ description: text });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Không thể tạo mô tả. Thử lại sau." },
      { status: 500 }
    );
  }
}
