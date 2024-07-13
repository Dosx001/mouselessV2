import "./styles.scss";

const presets = {
  conf: {
    blacklist: "",
    chars: ";alskdjfiwoe",
  },
  keys: {
    blobs_click: "Enter",
    blobs_focus: "Tab",
    blobs_show: ";",
    clipboard_copy: "<Shift>Enter",
    clipboard_paste: "<Alt>p",
    elem_deselect: "Escape",
    history_back: "<Alt>h",
    history_forward: "<Alt>l",
    middle_click: "<Alt>Enter",
    new_tab: "<Ctrl>Enter",
    new_window: "<Alt>w",
    private_window: "<Alt><Shift>W",
    reload: "<Ctrl>;",
    scroll_bottom: "<Alt><Shift>G",
    scroll_down: "<Alt>j",
    scroll_down_fast: "<Alt><Shift>J",
    scroll_left: "<Alt>h",
    scroll_right: "<Alt>l",
    scroll_top: "<Alt>g",
    scroll_up: "<Alt>k",
    scroll_up_fast: "<Alt><Shift>K",
    search: "<Alt>s",
  },
};

browser.storage.sync.get().then((sync) => {
  for (const el of document.querySelectorAll("input, textarea")) {
    const [section, name] = el.getAttribute("data-value")!.split(".");
    (el as HTMLInputElement).value =
      (sync as any)[section]?.[name] ?? (presets as any)[section][name];
  }
});

document.querySelector("form")!.onsubmit = (ev) => {
  ev.preventDefault();
  for (const el of document.querySelectorAll("input, textarea")) {
    const [section, name] = el.getAttribute("data-value")!.split(".");
    (presets as any)[section][name] = (el as HTMLInputElement).value;
  }
  browser.storage.sync.set(presets);
};
