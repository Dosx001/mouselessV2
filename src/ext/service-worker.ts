const getIndex = async (sender: chrome.runtime.MessageSender, off: number) => {
  const tabCount = (await chrome.tabs.query({ currentWindow: true })).length;
  const idx = sender.tab!.index! + off;
  return idx === -1 ? tabCount - 1 : tabCount === idx ? 0 : idx;
};

const loadCss = (tab: chrome.tabs.Tab) => {
  const id = setInterval(() => {
    if (tab.url)
      chrome.tabs
        .insertCSS(tab.id!, { file: "ext/styles.css" })
        .finally(() => clearInterval(id));
  }, 250);
};

chrome.tabs.query({}).then((tabs) => {
  for (const tab of tabs) loadCss(tab);
});

chrome.tabs.onUpdated.addListener((tabId, info, tab) => loadCss(tab));

chrome.runtime.onMessage.addListener(async (message, sender) => {
  switch (message.action) {
    case "css":
      loadCss(sender.tab!);
      break;
    case "changeTabLeft": {
      const query = { currentWindow: true, index: await getIndex(sender, -1) };
      chrome.tabs.update((await chrome.tabs.query(query))[0].id!, {
        active: true,
      });
      break;
    }
    case "changeTabRight": {
      const query = { currentWindow: true, index: await getIndex(sender, 1) };
      chrome.tabs.update((await chrome.tabs.query(query))[0].id!, {
        active: true,
      });
      break;
    }
    case "moveTabLeft":
      chrome.tabs.move(sender.tab!.id!, { index: await getIndex(sender, -1) });
      break;
    case "moveTabRight":
      chrome.tabs.move(sender.tab!.id!, { index: await getIndex(sender, 1) });
      break;
    case "openTabActive":
      chrome.tabs.create({ active: true, url: message.href });
      break;
    case "openTab":
      chrome.tabs.create({ active: false, url: message.href });
      break;
    case "duplicateTab":
      chrome.tabs.duplicate(
        (await chrome.tabs.query({ active: true, currentWindow: true }))[0].id!,
      );
      break;
    case "newWindow":
      chrome.windows.create({ url: message.href });
      break;
    case "privateWindow":
      chrome.windows.create({ url: message.href, incognito: true });
      break;
  }
});
