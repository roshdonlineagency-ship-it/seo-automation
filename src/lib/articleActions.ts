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

    // ۱. آپلود فایل‌ها و دریافت URL
    for (const key of Object.keys(imageAssets)) {
      const asset = imageAssets[key];
      if (asset.file) {
        const formData = new FormData();
        formData.append("file", asset.file);
        formData.append("title", asset.altText || "تصویر مقاله");
        formData.append("alt_text", asset.altText || "تصویر مقاله");

        const uploadRes = await fetch("/api/wordpress/media", { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        
        console.log(`Debug Upload [${key}]:`, uploadData);
        
        if (uploadData.url) {
          mediaMap[key] = uploadData.url;
        }
      }
    }

    // ۲. تابع ساخت بلاک استاندارد گوتنبرگ (این بخش کلید حل مشکل است)
    const createImageBlock = (key: string) => {
      const url = mediaMap[key];
      const alt = imageAssets[key]?.altText || "تصویر مقاله";
      if (!url) return "";
      
      // ساختار کامنت گوتنبرگ (وردپرس این را به بلاک تصویر تبدیل می‌کند)
      return `
        <figure class="wp-block-image aligncenter size-large">
          <img src="${url}" alt="${alt}" />
        </figure>
        `;
    };

    // ۳. ساخت محتوای نهایی HTML
    let html = `<p><strong>کلمه کلیدی هدف:</strong> ${articleData.focus_keyword}</p>`;
    
    // درج هدر
    if (mediaMap["h1"]) html += createImageBlock("h1");
    
    // درج اینترو
    html += `<p>${articleData.intro}</p>`;
    if (mediaMap["intro"]) html += createImageBlock("intro");

    // درج سکشن‌ها
    articleData.sections?.forEach((sec: any) => {
      html += `<h2>${sec.h2}</h2><p>${sec.content}</p>`;
      if (mediaMap[sec.id]) {
        html += createImageBlock(sec.id);
      }
    });

    // درج سوالات متداول
    if (articleData.faq?.length > 0) {
      html += `<h2>سوالات متداول</h2>`;
      articleData.faq.forEach((item: any) => {
        html += `<h3>${item.question}</h3><p>${item.answer}</p>`;
      });
    }

    // درج نتیجه‌گیری
    html += `<h2>جمع‌بندی</h2><p>${articleData.conclusion}</p>`;
    if (mediaMap["conclusion"]) html += createImageBlock("conclusion");

    // درج CTA
    if (articleData.cta) {
      html += `
        <div style="padding:24px; background:#f4f4f4; border-radius:16px; border: 1px solid #ddd;">
          <h4>${articleData.cta.text}</h4>
          <a href="${articleData.cta.target_url}" style="font-weight:bold; color:#0073aa;">${articleData.cta.anchor_text}</a>
        </div>`;
    }

    // ۴. ارسال نهایی به وردپرس
    const res = await fetch("/api/wordpress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: articleData.h1,
        content: html, // HTML شامل تگ‌های کامنت گوتنبرگ
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
