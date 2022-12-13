const presets: {
  [key: string]: { [key: string]: string | number };
} = {
  conf: {
    chars: ";alskdjfir",
    blacklist: "",
    timer: 0,
  },
  keys: {
    scroll_up: "k",
    scroll_down: "l",
    scroll_up_fast: "<Shift>_",
    scroll_down_fast: "<Shift>+",
    blobs_show: "h",
    blobs_hide: "Escape",
    blobs_click: "Enter",
    blobs_click_new_tab: "<Shift>Enter",
    blobs_click_clipboard: "<Control>Enter",
    blobs_focus: "Tab",
    blobs_backspace: "Backspace",
    elem_deselect: "Escape",
    change_tab_left: "j",
    change_tab_right: ";",
    move_tab_left: "<Shift>J",
    move_tab_right: "<Shift>:",
    history_back: "<Control>j",
    history_forward: "<Control>;",
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
    presets[section][name] = el.value;
  });
  browser.storage.sync.set(presets);
};

// Load options
document.addEventListener("DOMContentLoaded", async () => {
  const vals = await browser.storage.sync.get(["keys", "conf"]);
  forEachOption((section: string, name: string, el: HTMLInputElement) => {
    const sec = vals[section] || {};
    el.value = sec[name] ?? presets[section][name];
  });
});
