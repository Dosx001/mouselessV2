const presets = {
  conf: {
    blacklist: "",
    chars: ";alskdjfiwoe",
  },
  keys: {
    attach_tab: "<Alt><Shift>D",
    blobs_click: "Enter",
    blobs_focus: "Tab",
    blobs_show: ";",
    change_tab_left: "<Alt>p",
    change_tab_right: "<Alt>n",
    clipboard_copy: "<Shift>Enter",
    clipboard_paste: "<Alt>p",
    detach_tab: "<Alt>d",
    duplicate_tab: "<Alt>u",
    elem_deselect: "Escape",
    history_back: "<Alt>h",
    history_forward: "<Alt>l",
    middle_click: "<Alt>Enter",
    move_tab_left: "<Alt><Shift>P",
    move_tab_right: "<Alt><Shift>N",
    new_tab: "<Ctrl>Enter",
    new_window: "<Alt>w",
    private_window: "<Alt><Shift>W",
    reload: "<Ctrl>;",
    scroll_bottom: "<Alt><Shift>G",
    scroll_down: "<Alt>j",
    scroll_down_fast: "<Alt><Shift>J",
    scroll_left: "<Alt><Shift>H",
    scroll_right: "<Alt><Shift>L",
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
