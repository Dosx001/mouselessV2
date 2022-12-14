interface HotKey {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
}

const callBridge = (action: string, href = "") => {
  browser.runtime.sendMessage({
    action: action,
    href: href,
  });
};

const bridge = {
  changeTabLeft: () => {
    callBridge("changeTabLeft");
  },
  changeTabRight: () => {
    callBridge("changeTabRight");
  },
  moveTabLeft: () => {
    callBridge("moveTabLeft");
  },
  moveTabRight: () => {
    callBridge("moveTabRight");
  },
  openTab: (href: string) => {
    callBridge("openTab", href);
  },
  setClipboard: (txt: string) => {
    navigator.clipboard.writeText(txt);
  },
};

let enabled = false;
let blacklisted = false;

browser.runtime.onMessage.addListener((obj) => {
  switch (obj.action) {
    case "enable":
      enabled = true;
      break;
    case "disable":
      enabled = false;
      break;
    default:
      console.error("Unknown action: " + obj.action);
  }
});

const conf = {
  blacklist: "",
  scroll_speed: 0.3,
  scroll_speed_fast: 1.1,
  scroll_friction: 0.8,
  chars: ";alskdjfiwoe",
  timer: 0,
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
  location_change_check_timeout: 2000,
};

const keys = {
  scroll_up: { key: "" },
  scroll_down: { key: "" },
  scroll_up_fast: { key: "" },
  scroll_down_fast: { key: "" },
  blobs_show: { key: "" },
  blobs_hide: { key: "" },
  blobs_click: { key: "" },
  blobs_click_new_tab: { key: "" },
  blobs_click_clipboard: { key: "" },
  blobs_focus: { key: "" },
  blobs_backspace: { key: "" },
  elem_deselect: { key: "" },
  change_tab_left: { key: "" },
  change_tab_right: { key: "" },
  move_tab_left: { key: "" },
  move_tab_right: { key: "" },
  history_back: { key: "" },
  history_forward: { key: "" },
};

browser.storage.sync.get(["keys", "conf"]).then((obj) => {
  // Get keys
  const defaultKeys = {
    scroll_up: "<Alt>k",
    scroll_down: "<Alt>j",
    scroll_up_fast: "<Alt><Shift>K",
    scroll_down_fast: "<Alt><Shift>J",
    blobs_show: ";",
    blobs_hide: "Escape",
    blobs_click: "Enter",
    blobs_click_new_tab: "<Control>Enter",
    blobs_click_clipboard: "<Shift>Enter",
    blobs_focus: "Tab",
    blobs_backspace: "Backspace",
    elem_deselect: "Escape",
    change_tab_left: "<Alt>p",
    change_tab_right: "<Alt>n",
    move_tab_left: "<Alt><Shift>P",
    move_tab_right: "<Alt><Shift>N",
    history_back: "<Alt>h",
    history_forward: "<Alt>l",
  };
  Object.entries((obj.keys as typeof defaultKeys) ?? defaultKeys).forEach(
    ([key, value]) => {
      interpretKey(key, value);
    }
  );
  // Get conf
  Object.entries((obj.conf as typeof conf) ?? conf).forEach(([key, value]) => {
    (conf as any)[key] = value;
  });
  for (let link of conf.blacklist.split("\n")) {
    link = link.trim();
    if (link.length && new RegExp(link).test(location.href)) {
      blacklisted = true;
      break;
    }
  }
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
  while (0 < n) {
    str += conf.chars[n % base];
    n = Math.floor(n / base);
  }
  return str;
};

const getElemPos = (el: HTMLElement) => {
  let curtop = 0;
  let curleft = 0;
  do {
    curtop += el.offsetTop;
    curleft += el.offsetLeft;
  } while ((el = el.offsetParent as HTMLElement));
  return { top: curtop, left: curleft };
};

const blobList = {
  blobs: new Map(),
  container: document.createElement("div"),
  overview: document.createElement("div"),
  visible: false,
  needLoadBlobs: true,
  currentKey: "",
  createContainer: () => {
    blobList.container.style.cssText = [
      "pointer-events: none",
      "display: none",
      "position: absolute;",
      "top: 0px",
      "left: 0px",
      "z-index: 2147483647",
      "box-sizing: content-box",
      "",
    ].join(" !important;");
    document.body.appendChild(blobList.container);
  },
  createOverview: () => {
    blobList.overview.style.cssText = [
      "position: fixed",
      "top: 0px",
      "left: 0px",
      "background-color: white",
      "border-bottom: 2px solid black",
      "border-right: 2px solid black",
      "color: black",
      "font: 12px sans-serif",
      "padding: 3px",
      "height: 15px",
      "line-height: 15px",
      "z-index: 2147483647",
      "box-sizing: content-box",
      "",
    ].join(" !important;");
    blobList.container.appendChild(blobList.overview);
  },
  init: () => {
    if (!onWebPage) return;
    blobList.createContainer();
    window.onscroll = () => {
      blobList.needLoadBlobs = true;
    };
  },
  loadBlobs: () => {
    if (!onWebPage) return;
    const linkElems = document.querySelectorAll<HTMLElement>(
      "a, button, input, select, textarea, summary, [role='button'], [tabindex='0']"
    );
    //Remove old container contents
    blobList.container.innerText = "";
    blobList.createOverview();
    //Remove old blobs
    blobList.blobs.clear();
    let nRealBlobs = 0;
    for (let i = 0; i < linkElems.length; i++) {
      const linkElem = linkElems[i];
      //We don't want hidden elements
      if (
        linkElem === undefined ||
        linkElem.style.display === "none" ||
        linkElem.style.visibility === "hidden"
      )
        continue;
      //Get element's absolute position
      const pos = getElemPos(linkElem);
      //Lots of things which don't really exist have an X and Y value of 0
      if (pos.top === 0 && pos.left === 0) continue;
      //We don't need to get things far above our current scroll position
      if (pos.top < window.scrollY - 100) continue;
      //We don't need things below our scroll position either
      if (pos.top - 100 > window.scrollY + window.innerHeight) continue;
      //Create the blob's key
      const key = createKey(nRealBlobs);
      nRealBlobs += 1;
      const blobElem = document.createElement("div");
      blobElem.innerText = key.toUpperCase();
      blobElem.style.cssText = [
        "position: absolute",
        "background-color: yellow",
        "border: 1px solid black",
        "border-radius: 10px",
        "padding-left: 3px",
        "padding-right: 3px",
        "color: black",
        "font: 12px sans-serif",
        "top: " + pos.top + "px",
        "left: " + pos.left + "px",
        "line-height: 13px",
        "font-size: 12px",
        "",
      ].join(" !important;");
      blobList.container.appendChild(blobElem);
      blobList.blobs.set(key, {
        blobElem: blobElem,
        linkElem: linkElem,
      });
    }
  },
  showBlobs: () => {
    blobList.visible = true;
    blobList.container.style.display = "block";
  },
  hideBlobs: () => {
    blobList.currentKey = "";
    blobList.visible = false;
    blobList.container.style.display = "none";
  },
  click: () => {
    if (!blobList.visible) return;
    const blob = blobList.blobs.get(blobList.currentKey);
    if (!blob) return;
    if (
      blob.linkElem.tagName === "A" &&
      blob.linkElem.href &&
      blob.linkElem.href.indexOf("javascript") != 0
    ) {
      blobList.hideBlobs();
      blob.linkElem.focus();
      location.href = blob.linkElem.href;
    } else {
      blobList.hideBlobs();
      blob.linkElem.click();
      blob.linkElem.focus();
    }
  },
  clickNewTab: () => {
    if (!blobList.visible) return;
    const blob = blobList.blobs.get(blobList.currentKey);
    if (!blob) return;
    blobList.hideBlobs();
    if (blob.linkElem.tagName === "A" && blob.linkElem.href) {
      bridge.openTab(blob.linkElem.href);
    } else {
      blob.linkElem.click();
      blob.linkElem.focus();
    }
  },
  clickClipboard: () => {
    if (!blobList.visible) return;
    const blob = blobList.blobs.get(blobList.currentKey);
    if (!blob) return;
    if (!blob.linkElem.href) return;
    bridge.setClipboard(blob.linkElem.href);
    blobList.hideBlobs();
  },
  focus: () => {
    if (!blobList.visible) return;
    const blob = blobList.blobs.get(blobList.currentKey);
    if (!blob) return;
    blobList.hideBlobs();
    blob.linkElem.focus();
  },
  appendKey: (c: string) => {
    blobList.currentKey += c;
    blobList.overview.innerText = blobList.currentKey;
  },
  backspace: () => {
    blobList.currentKey = blobList.currentKey.substring(
      0,
      blobList.currentKey.length - 1
    );
    blobList.overview.innerText = blobList.currentKey;
  },
};
blobList.init();

//Reload blobs whenever the URL changes
let currentUrl = location.href;
setInterval(() => {
  if (currentUrl !== location.href) {
    blobList.loadBlobs();
  }
  currentUrl = location.href;
}, conf.location_change_check_timeout);

const isValidElem = (el: HTMLButtonElement) => {
  switch (el.tagName.toLowerCase()) {
    case "textarea":
    case "select":
    case "canvas":
      return false;
    case "input":
      if (conf.input_whitelist.indexOf(el.type.toLowerCase()) === -1)
        return false;
  }
  return el.contentEditable.toLowerCase() !== "true";
};

window.addEventListener(
  "keydown",
  function(evt) {
    if (!enabled || blacklisted) return;
    if (/about:.+/.test(location.href)) return;
    const active = document.activeElement as HTMLButtonElement;
    //We don't want to do anything if the user is typing in an input field,
    //unless the key is to deselect an input field
    if (!isValidElem(active)) {
      keys.scroll_up;
      if (isMatch(keys.elem_deselect, evt)) {
        active.blur();
        setTimeout(() => active.blur(), 50); // In case something tries to refocus
        blobList.hideBlobs();
      }
      return;
    }
    //User is typing a key to a blob
    if (blobList.visible) {
      evt.preventDefault();
      evt.stopPropagation();
      //Hide blobs if appropriate
      //Escape key always hides blobs if visible
      if (evt.code === "Escape" || isMatch(keys.blobs_hide, evt)) {
        blobList.hideBlobs();
        return;
      }
      //Backspace if appropriate
      if (isMatch(keys.blobs_backspace, evt)) {
        blobList.backspace();
        //Stop auto-submit timeout
        if (timer) {
          clearTimeout(timer);
          timer = 0;
        }
        return;
      }
      const c = evt.key;
      if (conf.chars.indexOf(c) !== -1) {
        blobList.appendKey(c);
        //Reset auto-submit timeout
        if (timer) {
          clearTimeout(timer);
        }
        if (0 < conf.timer) {
          timer = this.setTimeout(blobList.click, conf.timer);
        }
        return false;
      }
    }
    //Handle other key presses
    //Deselect element
    if (onWebPage) {
      if (blobList.visible) {
        if (isMatch(keys.blobs_hide, evt)) {
          blobList.hideBlobs();
        } else if (isMatch(keys.blobs_click, evt)) {
          blobList.click();
        } else if (isMatch(keys.blobs_click_new_tab, evt)) {
          blobList.clickNewTab();
        } else if (isMatch(keys.blobs_click_clipboard, evt)) {
          blobList.clickClipboard();
        } else if (isMatch(keys.blobs_focus, evt)) {
          blobList.focus();
        }
      } else {
        if (isMatch(keys.blobs_show, evt)) {
          blobList.loadBlobs();
          blobList.needLoadBlobs = false;
          blobList.showBlobs();
        } else if (isMatch(keys.elem_deselect, evt)) {
          blobList.hideBlobs();
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
        } else if (isMatch(keys.history_forward, evt)) {
          history.forward();
        } else if (isMatch(keys.change_tab_left, evt)) {
          bridge.changeTabLeft();
        } else if (isMatch(keys.change_tab_right, evt)) {
          bridge.changeTabRight();
        } else if (isMatch(keys.move_tab_left, evt)) {
          bridge.moveTabLeft();
        } else if (isMatch(keys.move_tab_right, evt)) {
          bridge.moveTabRight();
        } else {
          //We don't want to stop the event from propagating
          return true;
        }
      }
    }
    evt.preventDefault();
    evt.stopPropagation();
    return false;
  },
  true
);

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

let timer = 0;
