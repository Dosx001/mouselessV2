const presets = {
  conf: {
    chars: ";alskdjfiwoe",
    blacklist: "",
  },
  keys: {
    blobs_click: "Enter",
    blobs_focus: "Tab",
    blobs_hide: "Escape",
    blobs_show: ";",
    change_tab_left: "<Alt><Shift>P",
    change_tab_right: "<Alt><Shift>N",
    clipboard_copy: "<Shift>Enter",
    clipboard_paste: "<Alt>p",
    duplicate_tab: "<Alt>u",
    elem_deselect: "Escape",
    history_back: "<Alt>h",
    history_forward: "<Alt>l",
    move_tab_left: "<Alt>p",
    move_tab_right: "<Alt>n",
    new_tab: "<Control>Enter",
    new_window: "<Alt>w",
    private_window: "<Alt><Shift>W",
    scroll_bottom: "<Alt><Shift>G",
    scroll_down: "<Alt>j",
    scroll_down_fast: "<Alt><Shift>J",
    scroll_top: "<Alt>g",
    scroll_up: "<Alt>k",
    scroll_up_fast: "<Alt><Shift>K",
  },
};

const forEachOption = (
  fn: (section: string, name: string, el: HTMLInputElement) => void
) => {
  document.querySelectorAll<HTMLInputElement>(".current").forEach((el) => {
    const [section, name] = el.getAttribute("data-value")!.split(".");
    fn(section as string, name, el);
  });
};

// Save options
document.querySelector<HTMLFormElement>("form")!.onsubmit = (ev) => {
  ev.preventDefault();
  forEachOption((section: string, name: string, el: HTMLInputElement) => {
    (presets as any)[section][name] = el.value;
  });
  browser.storage.sync.set(presets);
};

// Load options
document.addEventListener("DOMContentLoaded", async () => {
  const vals = await browser.storage.sync.get(["keys", "conf"]);
  forEachOption((section: string, name: string, el: HTMLInputElement) => {
    const sec = vals[section] || {};
    el.value = sec[name] ?? (presets as any)[section][name];
  });
});
