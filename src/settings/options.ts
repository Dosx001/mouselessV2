const presets = {
  qwerty_us: {
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
  },
  qwerty_no: {
    conf: {
      chars: "øalskdjfir",
      blacklist: "",
      timer: 0,
    },
    keys: {
      scroll_up: "k",
      scroll_down: "l",
      scroll_up_fast: "<Shift>?",
      scroll_down_fast: "<Shift>`",
      blobs_show: "h",
      blobs_hide: "Escape",
      blobs_click: "Enter",
      blobs_click_new_tab: "<Shift>Enter",
      blobs_click_clipboard: "<Control>Enter",
      blobs_focus: "Tab",
      blobs_backspace: "Backspace",
      elem_deselect: "Escape",
      change_tab_left: "j",
      change_tab_right: "ø",
      move_tab_left: "<Shift>J",
      move_tab_right: "<Shift>ø",
      history_back: "<Control>j",
      history_forward: "<Control>ø",
    },
  },
  azerty: {
    conf: {
      chars: "mqlskdjfir",
      blacklist: "",
      timer: 0,
    },
    keys: {
      scroll_up: "k",
      scroll_down: "l",
      scroll_up_fast: "<Shift>°",
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
      change_tab_right: "m",
      move_tab_left: "<Shift>J",
      move_tab_right: "<Shift>M",
      history_back: "<Control>j",
      history_forward: "<Control>m",
    },
  },
  dvorak: {
    conf: {
      chars: "sanotehucp",
      blacklist: "",
      timer: 0,
    },
    keys: {
      scroll_up: "t",
      scroll_down: "n",
      scroll_up_fast: "<Shift>{",
      scroll_down_fast: "<Shift>}",
      blobs_show: "d",
      blobs_hide: "Escape",
      blobs_click: "Enter",
      blobs_click_new_tab: "<Shift>Enter",
      blobs_click_clipboard: "<Control>Enter",
      blobs_focus: "Tab",
      blobs_backspace: "Backspace",
      elem_deselect: "Escape",
      change_tab_left: "h",
      change_tab_right: "s",
      move_tab_left: "<Shift>H",
      move_tab_right: "<Shift>S",
      history_back: "<Control>h",
      history_forward: "<Control>s",
    },
  },
  colemak: {
    conf: {
      chars: "oairesntup",
      blacklist: "",
      timer: 0,
    },
    keys: {
      scroll_up: "e",
      scroll_down: "i",
      scroll_up_fast: "<Shift>{",
      scroll_down_fast: "<Shift>}",
      blobs_show: "h",
      blobs_hide: "Escape",
      blobs_click: "Enter",
      blobs_click_new_tab: "<Shift>Enter",
      blobs_click_clipboard: "<Control>Enter",
      blobs_focus: "Tab",
      blobs_backspace: "Backspace",
      elem_deselect: "Escape",
      change_tab_left: "n",
      change_tab_right: "o",
      move_tab_left: "<Shift>N",
      move_tab_right: "<Shift>O",
      history_back: "<Control>n",
      history_forward: "<Control>o",
    },
  },
  numeric_links: {
    conf: {
      chars: "123456789",
      blacklist: "",
      timer: 0,
    },
    keys: {
      scroll_up: " ",
      scroll_down: " ",
      scroll_up_fast: " ",
      scroll_down_fast: " ",
      blobs_show: "h",
      blobs_hide: "h",
      blobs_click: "Enter",
      blobs_click_new_tab: "<Shift>Enter",
      blobs_click_clipboard: "<Control>Enter",
      blobs_focus: "Tab",
      blobs_backspace: "Backspace",
      elem_deselect: " ",
      change_tab_left: " ",
      change_tab_right: " ",
      move_tab_left: " ",
      move_tab_right: " ",
      history_back: " ",
      history_forward: " ",
    },
  },
};

const defaultPreset = presets.qwerty_us;

const forEachOption = (
  fn: (section: string, name: string, el: HTMLSelectElement) => void
) => {
  const opts = document.querySelectorAll<HTMLElement>("form .option");
  for (const i in opts) {
    if (!Object.prototype.hasOwnProperty.call(opts, i)) continue;
    const [section, name] = opts[i].getAttribute("name")!.split(".");
    const el = opts[i].querySelector<HTMLSelectElement>(".current")!;
    fn(section, name, el);
  }
};

// Select preset
document.querySelector<HTMLSelectElement>("select")!.onchange = (ev) => {
  const el = ev.target as HTMLSelectElement;
  if (!el.value) return;
  const preset = el.value as keyof typeof presets;
  forEachOption((section: string, name: string, el: HTMLSelectElement) => {
    el.value = presets[preset][section][name];
  });
};

// Save options
document.querySelector<HTMLFormElement>("form")!.onsubmit = (ev) => {
  ev.preventDefault();
  const vals: { [key: string]: { [key: string]: string } } = {};
  forEachOption((section: string, name: string, el: HTMLSelectElement) => {
    vals[section] = vals[section] || {};
    vals[section][name] = el.value;
  });
  browser.storage.local.set(vals);
};

// Load options
document.addEventListener("DOMContentLoaded", async () => {
  const vals = await browser.storage.local.get(["keys", "conf"]);
  forEachOption((section: string, name: string, el: HTMLSelectElement) => {
    const sec = vals[section] || {};
    el.value = sec[name] ?? defaultPreset[section][name];
  });
});
