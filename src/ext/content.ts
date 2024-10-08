import { conf, keys } from "mappings";
import "./styles.scss";

let blacklisted = false;

const bindKeys = async () => {
  const sync = await browser.storage.sync.get();
  for (const name of Object.keys(keys)) {
    const hotkey = sync.keys?.[name] ?? keys[name as keyof typeof keys];
    let sum = 0;
    for (const mod of hotkey.match(/<[a-zA-Z]+>/g) ?? []) {
      switch (mod.substring(1, mod.length - 1).toLowerCase()) {
        case "shift":
          sum++;
          break;
        case "ctrl":
          sum += 2;
          break;
        case "alt":
          sum += 4;
          break;
        case "meta":
          sum += 8;
          break;
      }
    }
    (keys as any)[name] = `${hotkey.replace(/<.*?>/g, "").trim()}${sum}`;
  }
  for (const [key, value] of Object.entries((sync.conf as typeof conf) ?? conf))
    (conf as any)[key] = value;
  for (let link of conf.blacklist.split("\n")) {
    link = link.trim();
    if (link.length && new RegExp(link).test(location.href)) {
      blacklisted = true;
      break;
    }
  }
};
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
      (ev.target as HTMLElement).style.width = `${
        (ev.target as HTMLInputElement).value.length + 1
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
          blobList.newTab(true);
          break;
        case keys.middle_click:
          blobList.newTab(false);
          break;
        case keys.new_window:
          blobList.newWindow(false);
          break;
        case keys.private_window:
          blobList.newWindow(true);
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
    document.querySelector(".mlv2Container")?.remove();
    document.body.append(blobList.container);
  },
  loadBlobs: () => {
    blobList.container.replaceChildren(blobList.overview);
    blobList.container.style.display = "block";
    blobList.overview.focus();
    let count = 0;
    for (const linkElem of document.querySelectorAll<HTMLElement>(
      `a, button, input, select, textarea, summary, [role='button']
      ${
        location.host === "www.youtube.com"
          ? ", yt-tab-shape, yt-chip-cloud-chip-renderer"
          : ""
      }`,
    )) {
      if (
        linkElem.style.display === "none" ||
        linkElem.style.visibility === "hidden"
      )
        continue;
      const rect = linkElem.getBoundingClientRect();
      if (rect.top === 0 && rect.left === 0) continue;
      if (
        0 <= rect.top &&
        0 <= rect.left &&
        rect.bottom <= (innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (innerWidth || document.documentElement.clientWidth)
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
    )
      location.href = (blob as HTMLAnchorElement).href;
    else {
      blobList.hideBlobs();
      blob.tagName === "TEXTAREA" ||
      (blob.tagName === "INPUT" &&
        ![
          "button",
          "textarea",
          "checkbox",
          "color",
          "file",
          "hidden",
          "image",
          "radio",
          "reset",
          "submit",
        ].includes((blob as HTMLInputElement).type))
        ? blob.focus()
        : blob.click();
    }
  },
  newTab: (active: boolean) => {
    const blob = blobList.blobs.get(blobList.overview.value);
    if (!blob) return;
    blobList.hideBlobs();
    const link = (blob as HTMLAnchorElement).href;
    blob.tagName === "A" && link
      ? browser.runtime.sendMessage({
          action: "newTab",
          active: active,
          url: link,
        })
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
  newWindow: (incognito: boolean) => {
    const blob = blobList.blobs.get(blobList.overview.value);
    if (!blob) return;
    blobList.hideBlobs();
    const link = (blob as HTMLAnchorElement).href;
    if (blob.tagName === "A" && link)
      browser.runtime.sendMessage({
        action: "newWindow",
        url: link,
        incognito: incognito,
      });
  },
  focus: () => {
    const blob = blobList.blobs.get(blobList.overview.value);
    if (!blob) return;
    blobList.hideBlobs();
    blob.focus();
  },
  scroll: (speed: number, top: boolean) => {
    window.scrollBy({
      behavior: "smooth",
      left: top ? 0 : speed,
      top: top ? speed : 0,
    });
  },
};
blobList.init();

const isValidElem = (el: HTMLElement) => {
  switch (el.tagName) {
    case "TEXTAREA":
    case "SELECT":
    case "CANVAS":
    case "INPUT":
      return true;
  }
  return el.contentEditable.toLowerCase() === "true";
};

function search(display: browser.search.Disposition) {
  const text = document.getSelection()!.toString();
  if (text)
    browser.runtime.sendMessage({
      action: "search",
      text: text,
      display: display,
    });
}

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
    case keys.history_forward:
      history.forward();
      break;
    case keys.history_back:
      history.back();
      break;
    case keys.scroll_up:
      blobList.scroll(-100, true);
      break;
    case keys.scroll_down:
      blobList.scroll(100, true);
      break;
    case keys.scroll_up_fast:
      blobList.scroll(-500, true);
      break;
    case keys.scroll_down_fast:
      blobList.scroll(500, true);
      break;
    case keys.scroll_left:
      blobList.scroll(-100, false);
      break;
    case keys.scroll_right:
      blobList.scroll(100, false);
      break;
    case keys.scroll_top:
      scroll(0, 0);
      break;
    case keys.scroll_bottom:
      scroll(0, (window as any).scrollMaxY);
      break;
    case keys.search:
      search("NEW_TAB");
      break;
    case keys.search_current:
      search("CURRENT_TAB");
      break;
    case keys.search_window:
      search("NEW_WINDOW");
      break;
    default:
      return;
  }
  ev.preventDefault();
};
