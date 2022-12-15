const presets = {
  conf: {
    chars: ";alskdjfiwoe",
    blacklist: "",
    timer: 0,
  },
  keys: {
    scroll_up: "<Alt>k",
    scroll_down: "<Alt>j",
    scroll_up_fast: "<Alt><Shift>K",
    scroll_down_fast: "<Alt><Shift>J",
    blobs_show: ";",
    blobs_hide: "Escape",
    blobs_click: "Enter",
    blobs_click_new_tab: "<Control>Enter",
    blobs_click_clipboard: "<Shift>Enter",
    blobs_click_paste: "<Alt>p",
    blobs_focus: "Tab",
    blobs_backspace: "Backspace",
    elem_deselect: "Escape",
    change_tab_left: "<Alt><Shift>P",
    change_tab_right: "<Alt><Shift>N",
    move_tab_left: "<Alt>p",
    move_tab_right: "<Alt>n",
    duplicate_tab: "<Alt>u",
    history_back: "<Alt>h",
    history_forward: "<Alt>l",
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
