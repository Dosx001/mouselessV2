const getIndex = async (sender: browser.runtime.MessageSender, off: number) => {
  const tabCount = (await browser.tabs.query({ currentWindow: true })).length;
  const idx = sender.tab!.index + off;
  return idx === -1 ? tabCount - 1 : tabCount === idx ? 0 : idx;
};

const loadCss = (tab: browser.tabs.Tab) => {
  const id = setInterval(() => {
    if (tab.url)
      browser.tabs
        .insertCSS(tab.id!, { file: "ext/styles.css" })
        .finally(() => clearInterval(id));
  }, 250);
};

browser.tabs.query({}).then((tabs) => {
  for (const tab of tabs) loadCss(tab);
});

browser.tabs.onUpdated.addListener((_, __, tab) => loadCss(tab));

browser.tabs.onCreated.addListener(loadCss);

const tabWin = new Map<number, number>();
browser.tabs.onRemoved.addListener((id) => tabWin.delete(id));

browser.runtime.onMessage.addListener(async (msg, sender) => {
  switch (msg.action) {
    case "attachTab": {
      const winId = tabWin.get(sender.tab!.id!);
      if (winId) {
        browser.tabs.move(sender.tab!.id!, {
          windowId: winId!,
          index: -1,
        });
        browser.tabs.update(sender.tab!.id!, { active: true });
        tabWin.delete(sender.tab!.id!);
      }
      break;
    }
    case "css":
      loadCss(sender.tab!);
      break;
    case "changeTabLeft": {
      const query = { currentWindow: true, index: await getIndex(sender, -1) };
      browser.tabs.update((await browser.tabs.query(query))[0].id!, {
        active: true,
      });
      break;
    }
    case "changeTabRight": {
      const query = { currentWindow: true, index: await getIndex(sender, 1) };
      browser.tabs.update((await browser.tabs.query(query))[0].id!, {
        active: true,
      });
      break;
    }
    case "detachTab": {
      await browser.windows.create({ tabId: sender.tab!.id });
      const tab = await browser.tabs.create({ url: "about:blank" });
      browser.tabs.remove(tab.id!);
      tabWin.set(sender.tab!.id!, sender.tab!.windowId!);
      break;
    }
    case "moveTabLeft":
      browser.tabs.move(sender.tab!.id!, { index: await getIndex(sender, -1) });
      break;
    case "moveTabRight":
      browser.tabs.move(sender.tab!.id!, { index: await getIndex(sender, 1) });
      break;
    case "openTabActive":
      browser.tabs
        .create({ url: msg.href, index: sender.tab!.index + 1 })
        .then(loadCss);
      break;
    case "openTab":
      browser.tabs
        .create({
          active: false,
          url: msg.href,
          index: sender.tab!.index + 1,
        })
        .then(loadCss);
      break;
    case "duplicateTab":
      browser.tabs
        .duplicate(
          (await browser.tabs.query({ active: true, currentWindow: true }))[0]
            .id!,
          { active: false },
        )
        .then(loadCss);
      break;
    case "newWindow":
      browser.windows.create({ url: msg.href });
      break;
    case "privateWindow":
      browser.windows.create({ url: msg.href, incognito: true });
      break;
  }
});
