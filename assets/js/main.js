// Global site config stored in localStorage
const STORAGE_KEYS = {
  CONTENT: "as_content",
  THEME: "as_theme",
  LAYOUT: "as_layout",
  SEO: "as_seo",
  IMAGE_ALT: "as_image_alt",
  POSTS: "as_posts"
};

const SiteCMS = {
  getJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  setJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  getPosts() {
    return this.getJSON(STORAGE_KEYS.POSTS, []);
  },
  savePosts(posts) {
    this.setJSON(STORAGE_KEYS.POSTS, posts);
  },

  getSeo() {
    return this.getJSON(STORAGE_KEYS.SEO, {});
  },
  getContent() {
    return this.getJSON(STORAGE_KEYS.CONTENT, {});
  },
  getImageAlt() {
    return this.getJSON(STORAGE_KEYS.IMAGE_ALT, {});
  },

  // Apply stored SEO for this page
  applySeo(pageId) {
    const seoMap = this.getSeo();
    const seo = seoMap[pageId];
    if (!seo) return;
    if (seo.title) document.title = seo.title;
    const descTag = document.querySelector('meta[name="description"]');
    if (seo.description) {
      if (descTag) descTag.setAttribute("content", seo.description);
      else {
        const m = document.createElement("meta");
        m.name = "description";
        m.content = seo.description;
        document.head.appendChild(m);
      }
    }
    const keyTag = document.querySelector('meta[name="keywords"]');
    if (seo.keywords) {
      if (keyTag) keyTag.setAttribute("content", seo.keywords);
      else {
        const m = document.createElement("meta");
        m.name = "keywords";
        m.content = seo.keywords;
        document.head.appendChild(m);
      }
    }
  },

  // Apply image alt text from dashboard
  applyAltText() {
    const altMap = this.getImageAlt();
    Object.entries(altMap).forEach(([id, alt]) => {
      const el = document.querySelector(`[data-alt-id="${id}"], #${id}`);
      if (el && alt) el.setAttribute("alt", alt);
    });
  },

  // Render posts list/detail on posts.html
  renderPostsPage() {
    const posts = this.getPosts().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("slug");

    const listView = document.getElementById("postsListView");
    const detailView = document.getElementById("postDetailView");

    if (slug) {
      const post = posts.find(p => p.slug === slug);
      if (!post) {
        if (detailView) {
          detailView.classList.remove("hidden");
          detailView.innerHTML = `<p>Post not found.</p>`;
        }
        return;
      }
      if (listView) listView.classList.add("hidden");
      if (detailView) {
        detailView.classList.remove("hidden");
        document.getElementById("postBanner").src = post.banner || "assets/images/profile.jpg";
        document.getElementById("postBanner").alt = post.seo?.imageAlt || post.title;
        document.getElementById("postTitle").textContent = post.title;
        document.getElementById("postAuthor").textContent = post.author || "Dr. Apurvanand Sahay";
        document.getElementById("postDate").textContent = post.date || "";
        document.getElementById("postCategory").textContent = post.category || "";
        document.getElementById("postContent").innerHTML = post.content || "";
        const tagsWrap = document.getElementById("postTags");
        tagsWrap.innerHTML = "";
        (post.tags || []).forEach(t => {
          const s = document.createElement("span");
          s.textContent = t.trim();
          tagsWrap.appendChild(s);
        });

        // Post-level SEO
        if (post.seo) {
          if (post.seo.title) document.title = post.seo.title;
          const descTag = document.querySelector('meta[name="description"]');
          if (post.seo.description && descTag) descTag.setAttribute("content", post.seo.description);
          const keyTag = document.querySelector('meta[name="keywords"]');
          if (post.seo.keywords && keyTag) keyTag.setAttribute("content", post.seo.keywords);
        }

        // Share handlers
        document.querySelectorAll(".share-btn").forEach(btn => {
          btn.addEventListener("click", () => {
            const url = window.location.href;
            let shareUrl = "";
            const text = encodeURIComponent(post.title);
            if (btn.dataset.platform === "linkedin") {
              shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
            } else if (btn.dataset.platform === "twitter") {
              shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${text}`;
            } else if (btn.dataset.platform === "facebook") {
              shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
            }
            if (shareUrl) window.open(shareUrl, "_blank", "noopener");
          });
        });
      }
    } else {
      // List view
      if (detailView) detailView.classList.add("hidden");
      if (!listView) return;
      if (posts.length === 0) {
        listView.innerHTML = `<p class="muted">No posts yet. Add your first post from the dashboard.</p>`;
        return;
      }
      listView.innerHTML = "";
      posts.forEach(p => {
        const card = document.createElement("article");
        card.className = "post-card";
        card.innerHTML = `
          <h2 class="post-card-title">${p.title}</h2>
          <p class="post-card-meta">${p.date || ""} · ${p.category || ""}</p>
          <p class="muted">${(p.content || "").replace(/<[^>]*>/g, "").slice(0, 140)}...</p>
        `;
        card.addEventListener("click", () => {
          const url = new URL(window.location.href);
          url.searchParams.set("slug", p.slug);
          window.location.href = url.toString();
        });
        listView.appendChild(card);
      });
    }
  }
};

// Make available globally
window.SiteCMS = SiteCMS;

// Shared UI behaviour
document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const root = document.documentElement;

  // Theme & layout from storage
  const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || root.getAttribute("data-theme") || "light";
  root.setAttribute("data-theme", savedTheme);

  const savedLayout = localStorage.getItem(STORAGE_KEYS.LAYOUT);
  if (savedLayout) {
    body.classList.remove("layout-wide", "layout-boxed");
    body.classList.add(savedLayout);
  }

  const themeConfig = SiteCMS.getJSON("as_theme_config", {});
  if (themeConfig.primaryColor) {
    root.style.setProperty("--color-primary", themeConfig.primaryColor);
  }
  if (themeConfig.fontFamily === "serif") {
    root.style.setProperty("--font-base", "var(--font-serif)");
  } else if (themeConfig.fontFamily === "mono") {
    root.style.setProperty("--font-base", "var(--font-mono)");
  } else {
    root.style.setProperty("--font-base", "var(--font-sans)");
  }

  // Theme toggle button
  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    const updateIcon = () => {
      themeToggle.textContent = root.getAttribute("data-theme") === "dark" ? "🌙" : "☀️";
    };
    updateIcon();
    themeToggle.addEventListener("click", () => {
      const current = root.getAttribute("data-theme") || "light";
      const next = current === "light" ? "dark" : "light";
      root.setAttribute("data-theme", next);
      localStorage.setItem(STORAGE_KEYS.THEME, next);
      updateIcon();
    });
  }

  // Back to top
  const backToTop = document.getElementById("backToTop");
  if (backToTop) {
    window.addEventListener("scroll", () => {
      backToTop.style.display = window.scrollY > 280 ? "flex" : "none";
    });
    backToTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // Year
  const yearSpan = document.getElementById("year");
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();

  // Mobile nav
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      navLinks.classList.toggle("show");
    });
  }

  // Apply SEO for static pages based on filename
  const pageId = (location.pathname.split("/").pop() || "index.html").replace(".html", "") || "index";
  SiteCMS.applySeo(pageId);

  // Alt text from dashboard
  SiteCMS.applyAltText();

  // Content snippets on home page
  const content = SiteCMS.getContent();
  if (pageId === "index") {
    if (content.heroTagline) {
      const tag = document.querySelector(".tagline");
      if (tag) tag.textContent = content.heroTagline;
    }
    if (content.homeOverview) {
      const overviewParagraph = document.querySelector(".section .two-col p");
      if (overviewParagraph) overviewParagraph.textContent = content.homeOverview;
    }
  }
});