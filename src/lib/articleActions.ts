import { ImageIdeaSet } from "@/lib/types";

// تابع جدید: فقط تصاویر را آپلود می‌کند و یک مپ از کلید -> آدرس URL تحویل می‌دهد
export const uploadArticleImages = async (
  imageAssets: Record<string, ImageIdeaSet>
): Promise<Record<string, string>> => {
  const mediaMap: Record<string, string> = {};

  for (const key of Object.keys(imageAssets)) {
    const asset = imageAssets[key];
    if (asset.file) {
      const formData = new FormData();
      const renamedFile = new File([asset.file], asset.fileName || asset.file.name, {
        type: asset.file.type
      });
      formData.append("file", renamedFile);
      formData.append("title", asset.altText || "تصویر مقاله");
      formData.append("alt_text", asset.altText || "تصویر مقاله");

      const uploadRes = await fetch("/api/wordpress/media", { method: "POST", body: formData });
      const uploadData = await uploadRes.json();

      console.log(`Debug HTML Upload [${key}]:`, uploadData);

      if (uploadData.url) {
        mediaMap[key] = uploadData.url;
      }
    }
  }
  return mediaMap;
};

// تابع جدید: انتشار ساختار نهایی تولید شده توسط هوش مصنوعی بر پایه HTML سفارشی
export const handleFinalHtmlPublish = async (
  articleData: any,
  htmlContent: string,
  setPublishing: (val: boolean) => void,
  setPublished: (val: string) => void
) => {
  if (!articleData || !htmlContent) return;
  setPublishing(true);
  try {
    const res = await fetch("/api/wordpress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: articleData.h1,
        content: htmlContent, // کد نهایی HTML دریافت شده از AI
        slug: articleData.slug,
        excerpt: articleData.meta_description,
        meta: {
          rank_math_title: articleData.meta_title || articleData.h1,
          rank_math_description: articleData.meta_description,
          rank_math_focus_keyword: articleData.focus_keyword,
        }
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "خطا در انتشار مقاله HTML");

    setPublished(data.link);
    alert("🚀 مقاله سفارشی شما با موفقیت همراه با کدهای RankMath منتشر شد!");
  } catch (err: any) {
    console.error("Publishing error:", err);
    alert(`❌ خطا: ${err.message}`);
  } finally {
    setPublishing(false);
  }
};

// تابع قبلی شما برای انتشار گوتنبرگ (دست‌نخورده باقی می‌ماند)
export const handleFinalPublish = async (
  articleData: any,
  imageAssets: Record<string, ImageIdeaSet>,
  setPublishing: (val: boolean) => void,
  setPublished: (val: string) => void
) => {
  if (!articleData) return;
  setPublishing(true);
  try {
    const mediaMap = await uploadArticleImages(imageAssets);

    const createImageBlock = (key: string) => {
      const url = mediaMap[key];
      const alt = imageAssets[key]?.altText || "تصویر مقاله";
      if (!url) return "";
      return `\n<figure class="wp-block-image aligncenter size-large">\n<img src="${url}" alt="${alt}" />\n</figure>\n`;
    };

    let html = `<p><strong>کلمه کلیدی هدف:</strong> ${articleData.focus_keyword}</p>`;
    if (mediaMap["h1"]) html += createImageBlock("h1");
    html += `<p>${articleData.intro}</p>`;
    if (mediaMap["intro"]) html += createImageBlock("intro");

    articleData.sections?.forEach((sec: any) => {
      html += `<h2>${sec.h2}</h2><p>${sec.content}</p>`;
      if (mediaMap[sec.id]) html += createImageBlock(sec.id);
    });

    if (articleData.faq?.length > 0) {
      html += `<h2>سوالات متداول</h2>`;
      articleData.faq.forEach((item: any) => {
        html += `<h3>${item.question}</h3><p>${item.answer}</p>`;
      });
    }

    html += `<h2>جمع‌بندی</h2><p>${articleData.conclusion}</p>`;
    if (mediaMap["conclusion"]) html += createImageBlock("conclusion");

    if (articleData.cta) {
      html += `\n<div style="padding:24px; background:#f4f4f4; border-radius:16px; border: 1px solid #ddd;">\n<h4>${articleData.cta.text}</h4>\n<a href="${articleData.cta.target_url}" style="font-weight:bold; color:#0073aa;">${articleData.cta.anchor_text}</a>\n</div>`;
    }

    const res = await fetch("/api/wordpress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: articleData.h1,
        content: html,
        slug: articleData.slug,
        excerpt: articleData.meta_description,
        meta: {
          rank_math_title: articleData.meta_title || articleData.h1,
          rank_math_description: articleData.meta_description,
          rank_math_focus_keyword: articleData.focus_keyword,
        }
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
