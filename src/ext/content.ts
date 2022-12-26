interface HotKey {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
}

const sendMessage = (action: string, href = "") => {
  browser.runtime.sendMessage({
    action: action,
    href: href,
  });
};

let blacklisted = false;

const conf = {
  blacklist: "",
  scroll_speed: 0.3,
  scroll_speed_fast: 1.1,
  scroll_friction: 0.8,
  chars: ";alskdjfiwoe",
  input_whitelist: [
    "checkbox",
    "radio",
    "hidden",
    "submit",
    "reset",
    "button",
    "file",
    "image",
  ],
};

const keys = {
  blobs_click: { key: "" },
  blobs_focus: { key: "" },
  blobs_show: { key: "" },
  change_tab_left: { key: "" },
  change_tab_right: { key: "" },
  clipboard_copy: { key: "" },
  clipboard_paste: { key: "" },
  duplicate_tab: { key: "" },
  elem_deselect: { key: "" },
  history_back: { key: "" },
  history_forward: { key: "" },
  move_tab_left: { key: "" },
  move_tab_right: { key: "" },
  new_tab: { key: "" },
  new_window: { key: "" },
  private_window: { key: "" },
  scroll_bottom: { key: "" },
  scroll_down: { key: "" },
  scroll_down_fast: { key: "" },
  scroll_top: { key: "" },
  scroll_up: { key: "" },
  scroll_up_fast: { key: "" },
};

const bindKeys = () =>
  browser.storage.sync.get(["keys", "conf"]).then((obj) => {
    // Get keys
    const defaultKeys = {
      blobs_click: "Enter",
      blobs_focus: "Tab",
      blobs_show: ";",
      change_tab_left: "<Alt>p",
      change_tab_right: "<Alt>n",
      clipboard_copy: "<Shift>Enter",
      clipboard_paste: "<Alt>p",
      duplicate_tab: "<Alt>u",
      elem_deselect: "Escape",
      history_back: "<Alt>h",
      history_forward: "<Alt>l",
      move_tab_left: "<Alt><Shift>P",
      move_tab_right: "<Alt><Shift>N",
      new_tab: "<Control>Enter",
      new_window: "<Alt>w",
      private_window: "<Alt><Shift>W",
      scroll_bottom: "<Alt><Shift>G",
      scroll_down: "<Alt>j",
      scroll_down_fast: "<Alt><Shift>J",
      scroll_top: "<Alt>g",
      scroll_up: "<Alt>k",
      scroll_up_fast: "<Alt><Shift>K",
    };
    Object.entries((obj.keys as typeof defaultKeys) ?? defaultKeys).forEach(
      ([key, value]) => {
        interpretKey(key, value);
      }
    );
    // Get conf
    Object.entries((obj.conf as typeof conf) ?? conf).forEach(
      ([key, value]) => {
        (conf as any)[key] = value;
      }
    );
    for (let link of conf.blacklist.split("\n")) {
      link = link.trim();
      if (link.length && new RegExp(link).test(location.href)) {
        blacklisted = true;
        break;
      }
    }
  });
bindKeys();
browser.runtime.onMessage.addListener(() => {
  bindKeys();
});

const interpretKey = (name: string, hotkey: string) => {
  const key: HotKey = { key: hotkey.replace(/<.*?>/g, "").trim() };
  hotkey.match(/<[a-zA-Z]+>/g)?.forEach((mod) => {
    switch (mod.substring(1, mod.length - 1).toLowerCase()) {
      case "control":
        key.ctrlKey = true;
        break;
      case "shift":
        key.shiftKey = true;
        break;
      case "alt":
        key.altKey = true;
        break;
      case "meta":
        key.metaKey = true;
        break;
      default:
        console.error("Unknown modifier:", mod);
    }
  });
  (keys as any)[name] = key;
};

const isMatch = (k: HotKey, evt: KeyboardEvent) =>
  k.key === evt.key &&
  !!k.ctrlKey === evt.ctrlKey &&
  !!k.shiftKey === evt.shiftKey &&
  !!k.altKey === evt.altKey &&
  !!k.metaKey === evt.metaKey;

//There's a lot we don't want to do if we're not on an actual webpage, but on
//the "speed dial"-ish pages.
const onWebPage = document.body !== undefined;

const createKey = (n: number) => {
  if (n === 0) return conf.chars[0];
  let str = "";
  const base = conf.chars.length;
  for (let i = n; 0 < i; i = Math.floor(i / base)) {
    str += conf.chars[i % base];
  }
  return str;
};

const blobList = {
  blobs: new Map<string, { blobElem: HTMLDivElement; linkElem: HTMLElement }>(),
  container: document.createElement("div"),
  overview: document.createElement("input"),
  init: () => {
    if (!onWebPage) return;
    blobList.overview.type = "text";
    blobList.overview.className = "mlv2Overview";
    blobList.overview.oninput = (ev) => {
      (ev.target as HTMLElement).style.width = `${(ev.target as HTMLInputElement).value.length + 1
        }ch !important`;
    };
    blobList.overview.onkeydown = (ev) => {
      if (isMatch(keys.blobs_click, ev)) {
        blobList.click();
      } else if (isMatch(keys.new_tab, ev)) {
        blobList.clickNewTab();
      } else if (isMatch(keys.clipboard_copy, ev)) {
        blobList.clipboardCopy();
      } else if (isMatch(keys.clipboard_paste, ev)) {
        blobList.clipboardPaste();
      } else if (isMatch(keys.blobs_focus, ev)) {
        blobList.focus();
      } else if (isMatch(keys.new_window, ev)) {
        blobList.newWindow();
      } else if (isMatch(keys.private_window, ev)) {
        blobList.privateWindow();
      } else {
        return;
      }
      ev.preventDefault();
    };
    blobList.overview.onblur = () => {
      blobList.hideBlobs();
    };
    blobList.container.className = "mlv2Container";
    document.body.append(blobList.container);
  },
  loadBlobs: () => {
    if (!onWebPage) return;
    const linkElems = document.querySelectorAll<HTMLElement>(
      "a, button, input, select, textarea, summary, [role='button'], [tabindex='0']"
    );
    //Remove old container contents
    blobList.container.replaceChildren(blobList.overview);
    blobList.container.style.display = "block";
    blobList.overview.focus();
    let count = 0;
    for (let i = 0; i < linkElems.length; i++) {
      const linkElem = linkElems[i];
      if (
        linkElem === undefined ||
        linkElem.style.display === "none" ||
        linkElem.style.visibility === "hidden"
      )
        continue;
      const rect = linkElem.getBoundingClientRect();
      if (rect.top === 0 && rect.left === 0) continue;
      if (
        0 <= rect.top &&
        0 <= rect.left &&
        rect.bottom <=
        (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <=
        (window.innerWidth || document.documentElement.clientWidth)
      ) {
        const key = createKey(count++);
        const blobElem = document.createElement("div");
        blobElem.innerText = key.toUpperCase();
        blobElem.className = "mlv2Blob";
        blobElem.style.top = `${rect.top}px`;
        blobElem.style.left = `${rect.left}px`;
        blobList.container.append(blobElem);
        blobList.blobs.set(key, {
          blobElem: blobElem,
          linkElem: linkElem,
        });
      }
    }
  },
  hideBlobs: () => {
    blobList.overview.value = "";
    blobList.overview.blur();
    blobList.container.style.display = "none";
    blobList.blobs.clear();
  },
  click: () => {
    const blob = blobList.blobs.get(blobList.overview.value);
    if (!blob) return;
    if (
      location.host === "www.reddit.com" &&
      ["comments", "body"].includes(
        blob.linkElem.getAttribute("data-click-id")!
      )
    ) {
      location.href = (blob.linkElem as HTMLAnchorElement).href;
    } else {
      blobList.hideBlobs();
      blob.linkElem.tagName === "INPUT" &&
        ![
          "button",
          "checkbox",
          "color",
          "file",
          "hidden",
          "image",
          "radio",
          "reset",
          "submit",
        ].includes((blob.linkElem as HTMLInputElement).type)
        ? blob.linkElem.focus()
        : blob.linkElem.click();
    }
  },
  clickNewTab: () => {
    const blob = blobList.blobs.get(blobList.overview.value);
    if (!blob) return;
    blobList.hideBlobs();
    const link = (blob.linkElem as HTMLAnchorElement).href;
    blob.linkElem.tagName === "A" && link
      ? sendMessage("openTab", link)
      : blobList.click();
  },
  clipboardCopy: () => {
    const blob = blobList.blobs.get(blobList.overview.value);
    if (!blob) return;
    const link = (blob.linkElem as HTMLAnchorElement).href;
    if (!link) return;
    navigator.clipboard.writeText(link);
    blobList.hideBlobs();
  },
  clipboardPaste: async () => {
    const blob = blobList.blobs.get(blobList.overview.value);
    if (!blob) return;
    (blob.linkElem as HTMLInputElement).value +=
      await navigator.clipboard.readText();
    blob.linkElem.focus();
    blobList.hideBlobs();
  },
  newWindow: () => {
    const blob = blobList.blobs.get(blobList.overview.value);
    if (!blob) return;
    blobList.hideBlobs();
    const link = (blob.linkElem as HTMLAnchorElement).href;
    if (blob.linkElem.tagName === "A" && link) sendMessage("newWindow", link);
  },
  privateWindow: () => {
    const blob = blobList.blobs.get(blobList.overview.value);
    if (!blob) return;
    blobList.hideBlobs();
    const link = (blob.linkElem as HTMLAnchorElement).href;
    if (blob.linkElem.tagName === "A" && link)
      sendMessage("privateWindow", link);
  },
  focus: () => {
    const blob = blobList.blobs.get(blobList.overview.value);
    if (!blob) return;
    blobList.hideBlobs();
    blob.linkElem.focus();
  },
};
blobList.init();

const isValidElem = (el: HTMLInputElement) => {
  switch (el.tagName) {
    case "TEXTAREA":
    case "SELECT":
    case "CANVAS":
      return true;
    case "INPUT":
      if (conf.input_whitelist.indexOf(el.type.toLowerCase()) === -1)
        return true;
  }
  return el.contentEditable.toLowerCase() === "true";
};

window.onkeydown = (evt) => {
  if (blacklisted) return;
  const active = document.activeElement as HTMLInputElement;
  //We don't want to do anything if the user is typing in an input field,
  //unless the key is to deselect an input field
  if (isValidElem(active)) {
    if (isMatch(keys.elem_deselect, evt)) {
      active.blur();
    }
    return;
  }
  if (onWebPage) {
    if (isMatch(keys.blobs_show, evt)) {
      blobList.loadBlobs();
    } else if (isMatch(keys.elem_deselect, evt)) {
      active.blur();
    } else if (isMatch(keys.scroll_up, evt)) {
      scroller.start(-conf.scroll_speed);
    } else if (isMatch(keys.scroll_down, evt)) {
      scroller.start(conf.scroll_speed);
    } else if (isMatch(keys.scroll_up_fast, evt)) {
      scroller.start(-conf.scroll_speed_fast);
    } else if (isMatch(keys.scroll_down_fast, evt)) {
      scroller.start(conf.scroll_speed_fast);
    } else if (isMatch(keys.history_back, evt)) {
      history.back();
    } else if (isMatch(keys.scroll_top, evt)) {
      window.scroll(0, 0);
    } else if (isMatch(keys.scroll_bottom, evt)) {
      window.scroll(0, (window as any).scrollMaxY);
    } else if (isMatch(keys.history_forward, evt)) {
      history.forward();
    } else if (isMatch(keys.change_tab_left, evt)) {
      sendMessage("changeTabLeft");
    } else if (isMatch(keys.change_tab_right, evt)) {
      sendMessage("changeTabRight");
    } else if (isMatch(keys.move_tab_left, evt)) {
      sendMessage("moveTabLeft");
    } else if (isMatch(keys.move_tab_right, evt)) {
      sendMessage("moveTabRight");
    } else if (isMatch(keys.duplicate_tab, evt)) {
      sendMessage("duplicateTab");
    } else {
      return;
    }
    evt.preventDefault();
  }
};

window.onkeyup = (evt) => {
  if (
    isMatch(keys.scroll_up, evt) ||
    isMatch(keys.scroll_down, evt) ||
    isMatch(keys.scroll_up_fast, evt) ||
    isMatch(keys.scroll_down_fast, evt)
  ) {
    scroller.stop();
  }
};

const scroller = {
  raf: 0,
  acceleration: 0,
  velocity: 0,
  startDate: 0,
  endDate: 0,
  startTime: 0,
  endTime: 0,
  start: (acceleration: number) => {
    scroller.acceleration = acceleration;
    if (location.host === "developer.mozilla.org") scroller.acceleration *= 15;
    if (scroller.raf === 0) scroller.update();
  },
  stop: () => {
    scroller.acceleration = 0;
  },
  update: () => {
    const tdiff = scroller.endTime - scroller.startTime;
    if (tdiff < 100) {
      scroller.velocity += scroller.acceleration;
      window.scrollBy(0, scroller.velocity * tdiff);
      scroller.velocity *= conf.scroll_friction;
    }
    if (tdiff < 100 && scroller.velocity > -0.1 && scroller.velocity < 0.1) {
      scroller.velocity = 0;
      cancelAnimationFrame(scroller.raf);
      scroller.raf = 0;
    } else {
      scroller.startTime = scroller.endTime;
      scroller.endTime = new Date().getTime();
      scroller.raf = requestAnimationFrame(scroller.update);
    }
  },
};
