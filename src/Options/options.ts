type Options = {
    compact_cards: boolean;
    dark_mode: boolean;
};

// Defaults used when no user preference is stored yet
const DEFAULTS: Options = {
    compact_cards: false,
    dark_mode: false,
};

// Map option keys to DOM element ids
const KEY_TO_ID: Record<keyof Options, string> = {
    compact_cards: "compact-cards",
    dark_mode: "dark-mode",
};

function setStoreLink() {
    const storeUrl =
        "https://chromewebstore.google.com/detail/asu-professorview/kniajfafepienoohdheheofabfclpgnl";

    // Implement Firefox logic later
    
    document.querySelectorAll<HTMLAnchorElement>("a.store-link").forEach((a) => {
        a.href = storeUrl;
    });
}

function setCheckboxDom(id: string, checked: boolean) {
    const el = document.getElementById(id);
    if (!el) return;
    if (checked) {
        el.classList.add("checked");
    } else {
        el.classList.remove("checked");
    }
}

function loadOptions(): Promise<Options> {
    return new Promise((resolve) => {
        // Using chrome.storage.sync with defaults fallback
        chrome.storage.sync.get(DEFAULTS, (result) => {
            // Result is a partial that always contains the provided defaults
            resolve({
                compact_cards: Boolean(result.compact_cards),
                dark_mode: Boolean(result.dark_mode),
            });
        });
    });
}

function saveOptions(update: Partial<Options>): Promise<void> {
    return new Promise((resolve) => {
        chrome.storage.sync.set(update, () => resolve());
    });
}

function bindCheckbox(key: keyof Options) {
    const id = KEY_TO_ID[key];
    const el = document.getElementById(id);
    if (!el) return;

    el.addEventListener("click", async () => {
        const next = !el.classList.contains("checked");
        setCheckboxDom(id, next);
        await saveOptions({ [key]: next });
    });
}

async function initOptionsPage() {
    setStoreLink();

    // Load saved values and reflect in UI
    const opts = await loadOptions();
    setCheckboxDom(KEY_TO_ID.compact_cards, opts.compact_cards);
    setCheckboxDom(KEY_TO_ID.dark_mode, opts.dark_mode);

    // Bind interactions
    bindCheckbox("compact_cards");
    bindCheckbox("dark_mode");
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initOptionsPage);
} else {
    initOptionsPage();
}