const getIndex = async (sender: browser.runtime.MessageSender, off: number) => {
  const tabCount = (await browser.tabs.query({ currentWindow: true })).length;
  const idx = sender.tab!.index + off;
  return idx === -1 ? tabCount - 1 : tabCount === idx ? 0 : idx;
};

const file = { file: "ext/styles.css" };
browser.tabs.query({}).then((tabs) => {
  for (const tab of tabs) browser.tabs.insertCSS(tab.id!, file);
});

browser.tabs.onUpdated.addListener((_, info) => {
  if (info.url) browser.tabs.insertCSS(file);
});

browser.tabs.onCreated.addListener((tab) => {
  const id = setInterval(() => {
    if (tab.url)
      browser.tabs.insertCSS(tab.id!, file).then(() => clearInterval(id));
  }, 250);
});

browser.runtime.onMessage.addListener(async (msg, sender) => {
  switch (msg.action) {
    case "css":
      browser.tabs.insertCSS(file);
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
    case "moveTabLeft":
      browser.tabs.move(sender.tab!.id!, { index: await getIndex(sender, -1) });
      break;
    case "moveTabRight":
      browser.tabs.move(sender.tab!.id!, { index: await getIndex(sender, 1) });
      break;
    case "openTabActive":
      browser.tabs.create({ url: msg.href });
      break;
    case "openTab":
      browser.tabs.create({ active: false, url: msg.href });
      break;
    case "duplicateTab":
      browser.tabs.duplicate(
        (await browser.tabs.query({ active: true, currentWindow: true }))[0]
          .id!,
        { active: false },
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
