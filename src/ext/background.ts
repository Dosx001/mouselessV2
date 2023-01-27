const getCurrTabOffset = async (off: number) => {
  const tab = (
    await browser.tabs.query({ active: true, currentWindow: true })
  )[0];
  const tabCount = (await browser.tabs.query({ currentWindow: true })).length;
  let idx = tab.index + off;
  if (idx < 0) idx = tabCount - 1;
  else if (idx >= tabCount) idx = 0;
  return { tabId: tab.id!, index: idx! };
};

const file = { file: "ext/styles.css" };
browser.tabs.query({}).then((res) => {
  for (const tab of res) browser.tabs.insertCSS(tab.id!, file);
});

browser.tabs.onUpdated.addListener((_, info) => {
  if (info.url) browser.tabs.insertCSS(file);
});

browser.runtime.onMessage.addListener(async (msg, sender) => {
  switch (msg.action) {
    case "css":
      browser.tabs.insertCSS(file);
      break;
    case "changeTabLeft": {
      const loc = await getCurrTabOffset(-1);
      browser.tabs.update(
        (await browser.tabs.query({ currentWindow: true, index: loc.index }))[0]
          .id!,
        { active: true }
      );
      break;
    }
    case "changeTabRight": {
      const loc = await getCurrTabOffset(1);
      browser.tabs.update(
        (await browser.tabs.query({ currentWindow: true, index: loc.index }))[0]
          .id!,
        { active: true }
      );
      break;
    }
    case "moveTabLeft": {
      const loc = await getCurrTabOffset(-1);
      browser.tabs.move(sender.tab!.id!, { index: loc.index });
      break;
    }
    case "moveTabRight": {
      const loc = await getCurrTabOffset(1);
      browser.tabs.move(sender.tab!.id!, { index: loc.index });
      break;
    }
    case "openTab":
      browser.tabs.create({ url: msg.href });
      break;
    case "duplicateTab":
      browser.tabs.duplicate(
        (await browser.tabs.query({ active: true, currentWindow: true }))[0].id!
      );
      break;
    case "newWindow":
      browser.windows.create({ url: msg.href });
      break;
    case "privateWindow":
      browser.windows.create({ url: msg.href, incognito: true });
      break;
  }
});
