
const $ = (id) => document.getElementById(id);

const form = $("listingForm");
let currentDraft = null;

function getSavedDrafts() {
  try {
    const data = JSON.parse(
      localStorage.getItem("hustlekitDrafts") || "[]"
    );
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function storeDrafts(drafts) {
  localStorage.setItem(
    "hustlekitDrafts",
    JSON.stringify(drafts)
  );
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

function uniqueTags(items) {
  return [...new Set(
    items
      .map(item => item.trim().replace(/^#/, ""))
      .filter(Boolean)
      .map(item => item.toLowerCase())
  )].slice(0, 13);
}

function generateListing(data) {
  const name = data.name;
  const details = data.details;
  const keywords = data.keywords;
  const platform = data.platform;
  const category = data.category;

  const intros = {
    warm: `Meet your new favorite find: ${name}!`,
    premium: `${name} brings a thoughtful touch to ${category}.`,
    playful: `Say hello to ${name} — your next favorite find!`,
    minimal: `${name}: a simple, thoughtful choice.`
  };

  const title = [name, ...keywords.slice(0, 3)]
    .join(" | ")
    .slice(0, 140);

  const description =
`${intros[data.tone]}

Discover ${name}, a product designed for people who appreciate quality and thoughtful details.

PRODUCT DETAILS
${details || "Add verified materials, dimensions, and product features before publishing."}

WHY YOU'LL LOVE IT
• A product-focused choice for everyday use
• A thoughtful option for personal use or gifting
• Clear details to help you make an informed choice

SEARCH KEYWORDS
${keywords.length ? keywords.join(", ") : "Add relevant keywords for your product."}

Please verify all materials, features, sizes, and other claims before publishing.

Find it on ${platform}.`;

  const categoryTags = {
    "Home & Living": [
      "home decor", "cozy home", "home accessory"
    ],
    "Fashion & Accessories": [
      "fashion gift", "everyday style", "style accessory"
    ],
    "Art & Handmade": [
      "handmade item", "artisan made", "unique creation"
    ],
    "Beauty & Wellness": [
      "self care", "wellness gift", "daily ritual"
    ],
    "Digital Product": [
      "digital download", "creative resource", "instant access"
    ],
    "Other": [
      "unique find", "small business", "thoughtful gift"
    ]
  };

  const nameWords = name
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(word => word.length > 2);

  const tags = uniqueTags([
    ...keywords,
    ...nameWords,
    ...(categoryTags[category] || []),
    platform.toLowerCase()
  ]);

  return {
    id: Date.now().toString(),
    name,
    category,
    platform,
    details,
    keywords,
    tone: data.tone,
    title,
    description,
    tags
  };
}

function displayListing(draft) {
  currentDraft = draft;

  $("emptyState").hidden = true;
  $("results").hidden = false;
  $("status").textContent = "DRAFT READY";

  $("resultTitle").value = draft.title;
  $("resultDescription").value = draft.description;

  const tagContainer = $("resultTags");
  tagContainer.replaceChildren();

  draft.tags.forEach(tag => {
    const element = document.createElement("span");
    element.className = "tag";
    element.textContent = tag;
    tagContainer.appendChild(element);
  });
}

function getCurrentDraft() {
  if (!currentDraft) return null;

  return {
    ...currentDraft,
    title: $("resultTitle").value,
    description: $("resultDescription").value,
    tags: [...$("resultTags").querySelectorAll(".tag")]
      .map(tag => tag.textContent)
  };
}

// Generate a listing
form.addEventListener("submit", event => {
  event.preventDefault();

  const name = $("productName").value.trim();

  if (!name) {
    showToast("Please enter a product name.");
    return;
  }

  const keywords = $("keywords").value
    .split(",")
    .map(word => word.trim())
    .filter(Boolean);

  const draft = generateListing({
    name,
    category: $("category").value,
    platform: $("platform").value,
    details: $("details").value.trim(),
    keywords,
    tone: $("tone").value
  });

  displayListing(draft);
  showToast("Your listing draft is ready!");
});

// Copy individual sections
document.querySelectorAll("[data-copy]").forEach(button => {
  button.addEventListener("click", async () => {
    const text = $(button.dataset.copy).value;
    await copyText(text);
  });
});

// Copy everything
$("copyAllBtn").addEventListener("click", async () => {
  const draft = getCurrentDraft();

  if (!draft) return;

  const content =
`TITLE
${draft.title}

DESCRIPTION
${draft.description}

TAGS
${draft.tags.join(", ")}`;

  await copyText(content);
});

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast("Copied to clipboard!");
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    document.body.appendChild(area);
    area.select();

    const success = document.execCommand("copy");
    area.remove();

    showToast(
      success ? "Copied to clipboard!" : "Copy failed. Select the text manually."
    );
  }
}

// Save current draft
$("saveBtn").addEventListener("click", () => {
  const draft = getCurrentDraft();

  if (!draft) return;

  const drafts = getSavedDrafts();
  const existingIndex = drafts.findIndex(
    item => item.id === draft.id
  );

  if (existingIndex >= 0) {
    drafts[existingIndex] = draft;
  } else {
    drafts.unshift(draft);
  }

  storeDrafts(drafts);
  renderSavedDrafts();
  showToast("Draft saved successfully!");
});

// Display saved drafts
function renderSavedDrafts() {
  const container = $("savedDrafts");
  const drafts = getSavedDrafts();

  container.replaceChildren();

  if (drafts.length === 0) {
    const message = document.createElement("p");
    message.className = "muted";
    message.textContent = "Your saved drafts will appear here.";
    container.appendChild(message);
    return;
  }

  drafts.forEach(draft => {
    const item = document.createElement("article");
    item.className = "saved-item";

    const title = document.createElement("h3");
    title.textContent = draft.name;

    const description = document.createElement("p");
    description.textContent =
      draft.description.slice(0, 140) + "...";

    const openButton = document.createElement("button");
    openButton.className = "small-btn";
    openButton.textContent = "Open";

    openButton.addEventListener("click", () => {
      $("productName").value = draft.name;
      $("category").value = draft.category;
      $("platform").value = draft.platform;
      $("details").value = draft.details;
      $("keywords").value = draft.keywords.join(", ");
      $("tone").value = draft.tone;

      displayListing(draft);

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

      showToast("Draft opened.");
    });

    const deleteButton = document.createElement("button");
    deleteButton.className = "small-btn";
    deleteButton.textContent = "Delete";

    deleteButton.addEventListener("click", () => {
      const updated = getSavedDrafts().filter(
        entry => entry.id !== draft.id
      );

      storeDrafts(updated);
      renderSavedDrafts();
      showToast("Draft deleted.");
    });

    item.append(
      title,
      description,
      openButton,
      deleteButton
    );

    container.appendChild(item);
  });
}

// Clear saved drafts
$("clearSaved").addEventListener("click", () => {
  if (getSavedDrafts().length === 0) {
    showToast("There are no saved drafts.");
    return;
  }

  if (confirm("Delete all saved drafts?")) {
    storeDrafts([]);
    renderSavedDrafts();
    showToast("All drafts deleted.");
  }
});

// Load saved drafts on startup
renderSavedDrafts();
