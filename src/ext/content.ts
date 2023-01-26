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

const bindKeys = () =>
  browser.storage.sync.get(["keys", "conf"]).then((obj) => {
    // Get keys
    Object.entries((obj.keys as typeof keys) ?? keys).forEach(
      ([name, hotkey]) => {
        let sum = 0;
        hotkey.match(/<[a-zA-Z]+>/g)?.forEach((mod) => {
          switch (mod.substring(1, mod.length - 1).toLowerCase()) {
            case "shift":
              sum++;
              break;
            case "control":
              sum += 2;
              break;
            case "alt":
              sum += 4;
              break;
            case "meta":
              sum += 8;
              break;
          }
        });
        (keys as any)[name] = `${hotkey.replace(/<.*?>/g, "").trim()}${sum}`;
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
browser.storage.onChanged.addListener(bindKeys);

const interpretKey = (ev: KeyboardEvent) => {
  let sum = 0;
  if (ev.shiftKey) sum++;
  if (ev.ctrlKey) sum += 2;
  if (ev.altKey) sum += 4;
  if (ev.metaKey) sum += 8;
  return `${ev.key}${sum}`;
};

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
  blobs: new Map<string, HTMLElement>(),
  container: document.createElement("div"),
  overview: document.createElement("input"),
  init: () => {
    blobList.overview.type = "text";
    blobList.overview.className = "mlv2Overview";
    blobList.overview.oninput = (ev) => {
      (ev.target as HTMLElement).style.width = `${(ev.target as HTMLInputElement).value.length + 1
        }ch !important`;
    };
    blobList.overview.onkeydown = (ev) => {
      switch (interpretKey(ev)) {
        case keys.blobs_click:
          blobList.click();
          break;
        case keys.blobs_focus:
          blobList.focus();
          break;
        case keys.clipboard_copy:
          blobList.clipboardCopy();
          break;
        case keys.clipboard_paste:
          blobList.clipboardPaste();
          break;
        case keys.new_tab:
          blobList.clickNewTab();
          break;
        case keys.new_window:
          blobList.newWindow();
          break;
        case keys.private_window:
          blobList.privateWindow();
          break;
        default:
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
        blobList.blobs.set(key, linkElem);
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
      ["comments", "body"].includes(blob.getAttribute("data-click-id")!)
    ) {
      location.href = (blob as HTMLAnchorElement).href;
    } else {
      blobList.hideBlobs();
      blob.tagName === "INPUT" &&
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
        ].includes((blob as HTMLInputElement).type)
        ? blob.focus()
        : blob.click();
    }
  },
  clickNewTab: () => {
    const blob = blobList.blobs.get(blobList.overview.value);
    if (!blob) return;
    blobList.hideBlobs();
    const link = (blob as HTMLAnchorElement).href;
    blob.tagName === "A" && link
      ? sendMessage("openTab", link)
      : blobList.click();
  },
  clipboardCopy: () => {
    const blob = blobList.blobs.get(blobList.overview.value);
    if (!blob) return;
    const link = (blob as HTMLAnchorElement).href;
    if (!link) return;
    navigator.clipboard.writeText(link);
    blobList.hideBlobs();
  },
  clipboardPaste: async () => {
    const blob = blobList.blobs.get(blobList.overview.value);
    if (!blob) return;
    (blob as HTMLInputElement).value += await navigator.clipboard.readText();
    blob.focus();
    blobList.hideBlobs();
  },
  newWindow: () => {
    const blob = blobList.blobs.get(blobList.overview.value);
    if (!blob) return;
    blobList.hideBlobs();
    const link = (blob as HTMLAnchorElement).href;
    if (blob.tagName === "A" && link) sendMessage("newWindow", link);
  },
  privateWindow: () => {
    const blob = blobList.blobs.get(blobList.overview.value);
    if (!blob) return;
    blobList.hideBlobs();
    const link = (blob as HTMLAnchorElement).href;
    if (blob.tagName === "A" && link) sendMessage("privateWindow", link);
  },
  focus: () => {
    const blob = blobList.blobs.get(blobList.overview.value);
    if (!blob) return;
    blobList.hideBlobs();
    blob.focus();
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

window.onkeydown = (ev) => {
  if (blacklisted) return;
  const active = document.activeElement as HTMLInputElement;
  const hotkey = interpretKey(ev);
  //We don't want to do anything if the user is typing in an input field,
  //unless the key is to deselect an input field
  if (isValidElem(active)) {
    if (hotkey === keys.elem_deselect) active.blur();
    return;
  }
  switch (hotkey) {
    case keys.blobs_show:
      blobList.loadBlobs();
      break;
    case keys.elem_deselect:
      active.blur();
      break;
    case keys.scroll_up:
      scroller.start(-conf.scroll_speed);
      break;
    case keys.scroll_down:
      scroller.start(conf.scroll_speed);
      break;
    case keys.scroll_up_fast:
      scroller.start(-conf.scroll_speed_fast);
      break;
    case keys.scroll_down_fast:
      scroller.start(conf.scroll_speed_fast);
      break;
    case keys.scroll_top:
      window.scroll(0, 0);
      break;
    case keys.scroll_bottom:
      window.scroll(0, (window as any).scrollMaxY);
      break;
    case keys.history_forward:
      history.forward();
      break;
    case keys.history_back:
      history.back();
      break;
    case keys.change_tab_left:
      sendMessage("changeTabLeft");
      break;
    case keys.change_tab_right:
      sendMessage("changeTabRight");
      break;
    case keys.move_tab_left:
      sendMessage("moveTabLeft");
      break;
    case keys.move_tab_right:
      sendMessage("moveTabRight");
      break;
    case keys.duplicate_tab:
      sendMessage("duplicateTab");
      break;
    default:
      return;
  }
  ev.preventDefault();
};

window.onkeyup = (ev) => {
  switch (interpretKey(ev)) {
    case keys.scroll_up:
    case keys.scroll_down:
    case keys.scroll_up_fast:
    case keys.scroll_down_fast:
      scroller.acceleration = 0;
  }
};

const scroller = {
  raf: 0,
  acceleration: 0,
  velocity: 0,
  startTime: 0,
  endTime: 0,
  start: (acceleration: number) => {
    scroller.acceleration = acceleration;
    if (location.host === "developer.mozilla.org") scroller.acceleration *= 15;
    if (scroller.raf === 0) scroller.update();
  },
  update: () => {
    const tdiff = scroller.endTime - scroller.startTime;
    if (tdiff < 100) {
      scroller.velocity += scroller.acceleration;
      window.scrollBy(0, scroller.velocity * tdiff);
      scroller.velocity *= conf.scroll_friction;
    }
    if (tdiff < 100 && -0.1 < scroller.velocity && scroller.velocity < 0.1) {
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
