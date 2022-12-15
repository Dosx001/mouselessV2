const getCurrTabOffset = async (off: number) => {
  const winId = browser.windows.WINDOW_ID_CURRENT;
  const tab = (await browser.tabs.query({ active: true, windowId: winId }))[0];
  const tabCount = (await browser.tabs.query({ windowId: winId })).length;
  let idx = tab.index + off;
  if (idx < 0) idx = tabCount - 1;
  else if (idx >= tabCount) idx = 0;
  return { tabId: tab.id!, winId: winId, index: idx! };
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
