document.addEventListener("DOMContentLoaded", () => {
  if (!window.SiteCMS) return;

  const loginSection = document.getElementById("loginSection");
  const dashboardSection = document.getElementById("dashboardSection");

  const loginUser = document.getElementById("loginUser");
  const loginPass = document.getElementById("loginPass");
  const loginBtn = document.getElementById("loginBtn");
  const loginError = document.getElementById("loginError");

  const creds = JSON.parse(localStorage.getItem("as_creds") || '{"user":"admin","pass":"admin123"}');

  function showDashboard() {
    loginSection.classList.add("hidden");
    dashboardSection.classList.remove("hidden");
  }

  // Auto-login if token present
  if (localStorage.getItem("as_authed") === "true") {
    showDashboard();
  }

  loginBtn.addEventListener("click", () => {
    if (loginUser.value === creds.user && loginPass.value === creds.pass) {
      localStorage.setItem("as_authed", "true");
      loginError.textContent = "";
      showDashboard();
    } else {
      loginError.textContent = "Invalid username or password.";
    }
  });

  /* Tabs */
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabPanels = document.querySelectorAll(".tab-panel");

  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.tab;
      tabButtons.forEach(b => b.classList.remove("active"));
      tabPanels.forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(id).classList.add("active");
    });
  });

  /* Content tab */
  const heroTagline = document.getElementById("heroTagline");
  const homeOverview = document.getElementById("homeOverview");
  const saveContentBtn = document.getElementById("saveContentBtn");
  const contentSaveStatus = document.getElementById("contentSaveStatus");

  const existingContent = SiteCMS.getContent();
  heroTagline.value = existingContent.heroTagline || "";
  homeOverview.value = existingContent.homeOverview || "";

  saveContentBtn.addEventListener("click", () => {
    const obj = {
      heroTagline: heroTagline.value.trim(),
      homeOverview: homeOverview.value.trim()
    };
    SiteCMS.setJSON(STORAGE_KEYS.CONTENT, obj);
    contentSaveStatus.textContent = "Content saved. Refresh Home to preview.";
    setTimeout(() => (contentSaveStatus.textContent = ""), 2500);
  });

  /* Posts tab */
  const postsTableBody = document.querySelector("#postsTable tbody");
  const newPostBtn = document.getElementById("newPostBtn");
  const postFormWrapper = document.getElementById("postFormWrapper");
  const postFormTitle = document.getElementById("postFormTitle");
  const savePostBtn = document.getElementById("savePostBtn");
  const cancelPostBtn = document.getElementById("cancelPostBtn");
  const postSaveStatus = document.getElementById("postSaveStatus");

  const postTitleInput = document.getElementById("postTitleInput");
  const postSlugInput = document.getElementById("postSlugInput");
  const postCategoryInput = document.getElementById("postCategoryInput");
  const postTagsInput = document.getElementById("postTagsInput");
  const postBannerInput = document.getElementById("postBannerInput");
  const postContentInput = document.getElementById("postContentInput");
  const postSeoTitleInput = document.getElementById("postSeoTitleInput");
  const postSeoDescInput = document.getElementById("postSeoDescInput");
  const postSeoKeywordsInput = document.getElementById("postSeoKeywordsInput");

  let editingSlug = null;

  function refreshPostsTable() {
    const posts = SiteCMS.getPosts().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    postsTableBody.innerHTML = "";
    posts.forEach(p => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${p.title}</td>
        <td>${p.slug}</td>
        <td>${p.category || ""}</td>
        <td>${p.date || ""}</td>
        <td>
          <button class="btn ghost btn-sm" data-action="edit" data-slug="${p.slug}">Edit</button>
          <button class="btn danger btn-sm" data-action="delete" data-slug="${p.slug}">Delete</button>
        </td>
      `;
      postsTableBody.appendChild(tr);
    });
  }

  refreshPostsTable();

  newPostBtn.addEventListener("click", () => {
    editingSlug = null;
    postFormTitle.textContent = "New Post";
    postTitleInput.value = "";
    postSlugInput.value = "";
    postCategoryInput.value = "";
    postTagsInput.value = "";
    postBannerInput.value = "";
    postContentInput.value = "";
    postSeoTitleInput.value = "";
    postSeoDescInput.value = "";
    postSeoKeywordsInput.value = "";
    postFormWrapper.classList.remove("hidden");
  });

  cancelPostBtn.addEventListener("click", () => {
    postFormWrapper.classList.add("hidden");
  });

  savePostBtn.addEventListener("click", () => {
    const title = postTitleInput.value.trim();
    let slug = postSlugInput.value.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    if (!title || !slug) {
      postSaveStatus.textContent = "Title and slug are required.";
      return;
    }

    const posts = SiteCMS.getPosts();
    const existingIndex = posts.findIndex(p => p.slug === slug);

    const now = new Date();
    const data = {
      title,
      slug,
      category: postCategoryInput.value.trim(),
      tags: postTagsInput.value.split(",").map(s => s.trim()).filter(Boolean),
      banner: postBannerInput.value.trim(),
      content: postContentInput.value,
      author: "Dr. Apurvanand Sahay",
      date: now.toLocaleDateString(),
      createdAt: editingSlug ? (posts[existingIndex]?.createdAt || now.getTime()) : now.getTime(),
      seo: {
        title: postSeoTitleInput.value.trim(),
        description: postSeoDescInput.value.trim(),
        keywords: postSeoKeywordsInput.value.trim()
      }
    };

    if (editingSlug && existingIndex > -1) {
      posts[existingIndex] = data;
    } else if (!editingSlug && existingIndex > -1) {
      postSaveStatus.textContent = "Slug already exists. Please choose a different slug.";
      return;
    } else {
      posts.push(data);
    }

    SiteCMS.savePosts(posts);
    refreshPostsTable();
    postSaveStatus.textContent = "Post saved.";
    setTimeout(() => (postSaveStatus.textContent = ""), 2500);
    postFormWrapper.classList.add("hidden");
  });

  postsTableBody.addEventListener("click", e => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const slug = btn.dataset.slug;
    const posts = SiteCMS.getPosts();
    const idx = posts.findIndex(p => p.slug === slug);
    if (idx === -1) return;

    if (btn.dataset.action === "edit") {
      const p = posts[idx];
      editingSlug = slug;
      postFormTitle.textContent = "Edit Post";
      postTitleInput.value = p.title;
      postSlugInput.value = p.slug;
      postCategoryInput.value = p.category || "";
      postTagsInput.value = (p.tags || []).join(", ");
      postBannerInput.value = p.banner || "";
      postContentInput.value = p.content || "";
      postSeoTitleInput.value = p.seo?.title || "";
      postSeoDescInput.value = p.seo?.description || "";
      postSeoKeywordsInput.value = p.seo?.keywords || "";
      postFormWrapper.classList.remove("hidden");
    } else if (btn.dataset.action === "delete") {
      if (confirm("Delete this post?")) {
        posts.splice(idx, 1);
        SiteCMS.savePosts(posts);
        refreshPostsTable();
      }
    }
  });

  /* SEO tab */
  const seoPageSelect = document.getElementById("seoPageSelect");
  const seoTitleInput = document.getElementById("seoTitle");
  const seoDescInput = document.getElementById("seoDescription");
  const seoKeywordsInput = document.getElementById("seoKeywords");
  const saveSeoBtn = document.getElementById("saveSeoBtn");
  const seoSaveStatus = document.getElementById("seoSaveStatus");

  function loadSeoForSelected() {
    const map = SiteCMS.getSeo();
    const key = seoPageSelect.value;
    const seo = map[key] || {};
    seoTitleInput.value = seo.title || "";
    seoDescInput.value = seo.description || "";
    seoKeywordsInput.value = seo.keywords || "";
  }

  seoPageSelect.addEventListener("change", loadSeoForSelected);
  loadSeoForSelected();

  saveSeoBtn.addEventListener("click", () => {
    const map = SiteCMS.getSeo();
    const key = seoPageSelect.value;
    map[key] = {
      title: seoTitleInput.value.trim(),
      description: seoDescInput.value.trim(),
      keywords: seoKeywordsInput.value.trim()
    };
    SiteCMS.setJSON(STORAGE_KEYS.SEO, map);
    seoSaveStatus.textContent = "SEO settings saved.";
    setTimeout(() => (seoSaveStatus.textContent = ""), 2500);
  });

  // Sitemap generation
  const generateSitemapBtn = document.getElementById("generateSitemapBtn");
  const sitemapOutput = document.getElementById("sitemapOutput");

  generateSitemapBtn.addEventListener("click", () => {
    const baseUrl = prompt("Base URL for your site (e.g. https://apurvanand.dev)", window.location.origin) || window.location.origin;
    const pages = ["index.html", "about.html", "posts.html", "contact.html"];
    const posts = SiteCMS.getPosts();
    const now = new Date().toISOString().split("T")[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    pages.forEach(p => {
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl.replace(/\/+$/, "")}/${p}</loc>\n`;
      xml += `    <lastmod>${now}</lastmod>\n`;
      xml += `  </url>\n`;
    });
    posts.forEach(p => {
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl.replace(/\/+$/, "")}/posts.html?slug=${encodeURIComponent(p.slug)}</loc>\n`;
      xml += `    <lastmod>${now}</lastmod>\n`;
      xml += `  </url>\n`;
    });
    xml += `</urlset>\n`;

    sitemapOutput.value = xml;
  });

  /* Theme tab */
  const themeModeSelect = document.getElementById("themeModeSelect");
  const layoutSelect = document.getElementById("layoutSelect");
  const primaryColorInput = document.getElementById("primaryColorInput");
  const fontSelect = document.getElementById("fontSelect");
  const saveThemeBtn = document.getElementById("saveThemeBtn");
  const themeSaveStatus = document.getElementById("themeSaveStatus");

  const root = document.documentElement;
  const currentTheme = localStorage.getItem(STORAGE_KEYS.THEME) || root.getAttribute("data-theme") || "light";
  themeModeSelect.value = currentTheme;
  layoutSelect.value = localStorage.getItem(STORAGE_KEYS.LAYOUT) || "layout-wide";
  const themeCfg = SiteCMS.getJSON("as_theme_config", {});
  if (themeCfg.primaryColor) primaryColorInput.value = themeCfg.primaryColor;
  fontSelect.value = themeCfg.fontFamily || "system";

  saveThemeBtn.addEventListener("click", () => {
    const theme = themeModeSelect.value;
    const layout = layoutSelect.value;
    const primary = primaryColorInput.value;
    const fontFamily = fontSelect.value;

    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    localStorage.setItem(STORAGE_KEYS.LAYOUT, layout);
    SiteCMS.setJSON("as_theme_config", { primaryColor: primary, fontFamily });

    root.setAttribute("data-theme", theme);
    document.body.classList.remove("layout-wide", "layout-boxed");
    document.body.classList.add(layout);
    root.style.setProperty("--color-primary", primary);
    if (fontFamily === "serif") {
      root.style.setProperty("--font-base", "var(--font-serif)");
    } else if (fontFamily === "mono") {
      root.style.setProperty("--font-base", "var(--font-mono)");
    } else {
      root.style.setProperty("--font-base", "var(--font-sans)");
    }

    themeSaveStatus.textContent = "Theme & layout updated.";
    setTimeout(() => (themeSaveStatus.textContent = ""), 2500);
  });

  /* Images tab */
  const imageIdInput = document.getElementById("imageIdInput");
  const imageAltInput = document.getElementById("imageAltInput");
  const saveImageAltBtn = document.getElementById("saveImageAltBtn");
  const imageAltStatus = document.getElementById("imageAltStatus");
  const imageAltList = document.getElementById("imageAltList");

  function renderAltList() {
    const map = SiteCMS.getImageAlt();
    imageAltList.innerHTML = "";
    Object.entries(map).forEach(([id, alt]) => {
      const li = document.createElement("li");
      li.textContent = `${id}: ${alt}`;
      imageAltList.appendChild(li);
    });
  }

  renderAltList();

  saveImageAltBtn.addEventListener("click", () => {
    const id = imageIdInput.value.trim();
    const alt = imageAltInput.value.trim();
    if (!id || !alt) {
      imageAltStatus.textContent = "Image ID and alt text are required.";
      return;
    }
    const map = SiteCMS.getImageAlt();
    map[id] = alt;
    SiteCMS.setJSON(STORAGE_KEYS.IMAGE_ALT, map);
    renderAltList();
    imageAltStatus.textContent = "Alt text saved.";
    setTimeout(() => (imageAltStatus.textContent = ""), 2500);
  });

  /* Settings tab */
  const newUsername = document.getElementById("newUsername");
  const newPassword = document.getElementById("newPassword");
  const saveCredsBtn = document.getElementById("saveCredsBtn");
  const credsSaveStatus = document.getElementById("credsSaveStatus");
  const resetAllBtn = document.getElementById("resetAllBtn");

  newUsername.value = creds.user;
  newPassword.value = "";

  saveCredsBtn.addEventListener("click", () => {
    const user = newUsername.value.trim() || creds.user;
    const pass = newPassword.value.trim() || creds.pass;
    localStorage.setItem("as_creds", JSON.stringify({ user, pass }));
    credsSaveStatus.textContent = "Credentials updated.";
    setTimeout(() => (credsSaveStatus.textContent = ""), 2500);
  });

  resetAllBtn.addEventListener("click", () => {
    if (!confirm("Clear all stored data? This cannot be undone.")) return;
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    localStorage.removeItem("as_theme_config");
    alert("All data cleared from local storage. Reload the page.");
    location.reload();
  });
});