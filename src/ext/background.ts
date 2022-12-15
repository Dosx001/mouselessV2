let ENABLED = false;

const sendTabEnabled = async (id: number, noretry: boolean) => {
  const obj = { action: ENABLED ? "enable" : "disable" };
  browser.tabs.sendMessage(id, obj).catch((err) => {
    if (noretry) {
      console.error(
        "Send enabled/disabled message to tab " + id + ":",
        err.message
      );
    } else {
      console.log(
        "Failed to send enabled/disabled message to tab " +
        id +
        ", retrying once."
      );
      setTimeout(() => sendTabEnabled(id, true), 100);
    }
  });
};

const toggle = async () => {
  ENABLED = !ENABLED;
  const name = "assets/" + (ENABLED ? "icon" : "icon-off");
  const title = ENABLED ? "Turn off Mouseless" : "Turn on Mouseless";
  browser.browserAction.setIcon({
    path: name + "-48.png",
  });
  browser.browserAction.setTitle({ title });
  const tabs = await browser.tabs.query({});
  for (const i in tabs) sendTabEnabled(tabs[i].id!, false);
};
toggle();
browser.browserAction.onClicked.addListener(toggle);

browser.tabs.onUpdated.addListener((id, evt) => {
  if (evt.status === "complete") sendTabEnabled(id, false);
});

const getCurrTabOffset = async (off: number) => {
  const win = await browser.windows.getCurrent();
  const tab = (await browser.tabs.query({ active: true, windowId: win.id }))[0];
  const tabCount = (await browser.tabs.query({ windowId: win.id })).length;
  let idx = tab.index + off;
  if (idx < 0) idx = tabCount - 1;
  else if (idx >= tabCount) idx = 0;
  return { tabId: tab.id!, winId: win.id!, index: idx! };
};

browser.runtime.onMessage.addListener(async (msg) => {
  switch (msg.action) {
    case "changeTabLeft": {
      const loc = await getCurrTabOffset(-1);
      browser.tabs.update(
        (await browser.tabs.query({ windowId: loc.winId, index: loc.index }))[0]
          .id!,
        { active: true }
      );
      break;
    }
    case "changeTabRight": {
      const loc = await getCurrTabOffset(1);
      browser.tabs.update(
        (await browser.tabs.query({ windowId: loc.winId, index: loc.index }))[0]
          .id!,
        { active: true }
      );
      break;
    }
    case "moveTabLeft": {
      const loc = await getCurrTabOffset(-1);
      browser.tabs.move(loc.tabId, { index: loc.index });
      break;
    }
    case "moveTabRight": {
      const loc = await getCurrTabOffset(1);
      browser.tabs.move(loc.tabId, { index: loc.index });
      break;
    }
    case "openTab":
      browser.tabs.create({ url: msg.href });
      break;
    case "duplicateTab": {
      browser.tabs.duplicate(
        (
          await browser.tabs.query({
            active: true,
            windowId: browser.windows.WINDOW_ID_CURRENT,
          })
        )[0].id!
      );
      break;
    }
    case "newWindow": {
      browser.windows.create({ url: msg.href });
      break;
    }
    case "privateWindow": {
      browser.windows.create({ url: msg.href, incognito: true });
      break;
    }
  }
});
