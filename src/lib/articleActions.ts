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
      if (asset.file) {
        const formData = new FormData();
        formData.append("file", asset.file);
        formData.append("title", asset.altText || "تصویر مقاله");
        formData.append("alt_text", asset.altText || "تصویر مقاله");

        const uploadRes = await fetch("/api/wordpress/media", { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        
        if (uploadData.url) {
          mediaMap[key] = uploadData.url;
        }
      }
    }

    // ۲. ساخت بدنه HTML (همان کدی که نوشته بودید)
    let html = `<p><strong>کلمه کلیدی هدف:</strong> ${articleData.focus_keyword}</p>`;
    if (mediaMap["h1"]) html += `<p style="text-align:center;"><img src="${mediaMap["h1"]}" alt="${imageAssets["h1"]?.altText}" /></p>`;

    html += `<p>${articleData.intro}</p>`;
    if (mediaMap["intro"]) html += `<p style="text-align:center;"><img src="${mediaMap["intro"]}" alt="${imageAssets["intro"]?.altText}" /></p>`;

    articleData.sections?.forEach((sec: any) => {
      html += `<h2>${sec.h2}</h2><p>${sec.content}</p>`;
      if (mediaMap[sec.id]) html += `<p style="text-align:center;"><img src="${mediaMap[sec.id]}" alt="${imageAssets[sec.id]?.altText}" /></p>`;
    });

    if (articleData.faq?.length > 0) {
      html += `<h2>سوالات متداول</h2>`;
      articleData.faq.forEach((item: any) => {
        html += `<h3>${item.question}</h3><p>${item.answer}</p>`;
      });
    }

    html += `<h2>جمع‌بندی</h2><p>${articleData.conclusion}</p>`;
    if (mediaMap["conclusion"]) html += `<p style="text-align:center;"><img src="${mediaMap["conclusion"]}" alt="${imageAssets["conclusion"]?.altText}" /></p>`;

    if (articleData.cta) {
      html += `<div style="padding:24px; background:#1a1a1a; color:#ffffff; border-radius:16px;">
                <h4>${articleData.cta.text}</h4>
                <a href="${articleData.cta.target_url}">${articleData.cta.anchor_text}</a>
              </div>`;
    }

    // ۳. مرحله گم‌شده: ارسال مقاله به وردپرس
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
    console.error(err);
    alert(`❌ خطا: ${err.message}`);
  } finally {
    setPublishing(false); // این دستور دکمه را از حالت لودینگ خارج می‌کند
  }
};
