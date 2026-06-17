// lib/articleActions.ts

export const handleFinalPublish = async (
  articleData: any,
  imageAssets: any,
  setPublishing: (val: boolean) => void,
  setPublished: (val: string) => void
) => {
  if (!articleData) return;
  setPublishing(true);

  try {
    const mediaMap: Record<string, string> = {};

    // ۱. آپلود فایل‌های فیزیکی
    for (const key of Object.keys(imageAssets)) {
      const asset = imageAssets[key];
      // فقط در صورتی فایل را آپلود کن که واقعاً فایل وجود داشته باشد
      if (asset.file) {
        const formData = new FormData();
        formData.append("file", asset.file);
        formData.append("title", asset.altText || "تصویر مقاله");
        formData.append("alt_text", asset.altText || "تصویر مقاله");

        const uploadRes = await fetch("/api/wordpress/media", { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        
        // لاگ برای دیباگ: آیا URL درستی از سمت سرور برمی‌گردد؟
        console.log(`Upload result for ${key}:`, uploadData);
        
        if (uploadData.url) {
          mediaMap[key] = uploadData.url;
        }
      }
    }

    // تابع کمکی برای ساخت تگ تصویر استاندارد وردپرس
    const createImageBlock = (key: string) => {
      const url = mediaMap[key];
      const alt = imageAssets[key]?.altText || "تصویر مقاله";
      if (!url) return "";
      
      // استفاده از کلاس wp-block-image برای شناسایی توسط گوتنبرگ
      return `
        <figure class="wp-block-image aligncenter size-large">
          <img src="${url}" alt="${alt}" />
        </figure>
      `;
    };

    // ۲. ساخت بدنه HTML
    let html = `<p><strong>کلمه کلیدی هدف:</strong> ${articleData.focus_keyword}</p>`;
    
    // هدر
    if (mediaMap["h1"]) html += createImageBlock("h1");
    html += `<p>${articleData.intro}</p>`;
    
    // اینترو
    if (mediaMap["intro"]) html += createImageBlock("intro");

    // سکشن‌ها
    articleData.sections?.forEach((sec: any) => {
      html += `<h2>${sec.h2}</h2><p>${sec.content}</p>`;
      // چک کردن اینکه آیا تصویری برای این سکشن خاص آپلود شده یا نه
      if (mediaMap[sec.id]) {
        html += createImageBlock(sec.id);
      }
    });

    // سوالات متداول
    if (articleData.faq?.length > 0) {
      html += `<h2>سوالات متداول</h2>`;
      articleData.faq.forEach((item: any) => {
        html += `<h3>${item.question}</h3><p>${item.answer}</p>`;
      });
    }

    // نتیجه‌گیری
    html += `<h2>جمع‌بندی</h2><p>${articleData.conclusion}</p>`;
    if (mediaMap["conclusion"]) html += createImageBlock("conclusion");

    // فراخوان اقدام (CTA)
    if (articleData.cta) {
      html += `
        <div style="padding:24px; background:#f4f4f4; border-radius:16px; border: 1px solid #ddd;">
          <h4>${articleData.cta.text}</h4>
          <a href="${articleData.cta.target_url}" style="font-weight:bold; color:#0073aa;">${articleData.cta.anchor_text}</a>
        </div>`;
    }

    // ۳. ارسال نهایی به وردپرس
    console.log("Final HTML payload being sent to WP...");
    
    const res = await fetch("/api/wordpress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: articleData.h1,
        content: html,
        slug: articleData.slug,
        excerpt: articleData.meta_description
      }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "خطا در انتشار مقاله");

    setPublished(data.link);
    alert("🚀 مقاله با موفقیت منتشر شد!");

  } catch (err: any) {
    console.error("Publishing error:", err);
    alert(`❌ خطا: ${err.message}`);
  } finally {
    setPublishing(false);
  }
};
