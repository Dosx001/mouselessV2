import browser from "webextension-polyfill"

const getIndex = async (
  sender: browser.runtime.MessageSender,
  off: number
) => {
  const tabCount = (await browser.tabs.query({ currentWindow: true })).length;
  const idx = sender.tab!.index! + off;
  return idx === -1 ? tabCount - 1 : tabCount === idx ? 0 : idx;
};

const file = "content.css";

browser.tabs.query({}).then((tabs) => {
  for (const tab of tabs) {
    if (tab.url === undefined) continue;
    browser.scripting
      .insertCSS({ files: [file], target: { tabId: tab.id! } })
      .catch((err) => console.log("error: " + err + " In " + new URL(tab.url!).hostname));
  }
});

browser.tabs.onUpdated.addListener((tabId, info, tab) => {
  if (tab.url === undefined) return;
  browser.scripting
    .insertCSS({ files: [file], target: { tabId: tabId } })
    .catch((err) => console.log("error: " + err + " In " + new URL(tab.url!).hostname));
});

browser.runtime.onMessage.addListener(async (message, sender) => {
  switch (message.action) {
    case "css":
      if (sender.tab!.url === undefined) break;
      browser.scripting
        .insertCSS({
          files: [file],
          target: { tabId: sender.tab!.id! },
        })
        .catch((err) => console.log("error: " + err));
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
      browser.tabs.create({ active: true, url: message.href });
      break;
    case "openTab":
      browser.tabs.create({ active: false, url: message.href });
      break;
    case "duplicateTab":
      browser.tabs.duplicate(
        (await browser.tabs.query({ active: true, currentWindow: true }))[0].id!
      );
      break;
    case "newWindow":
      browser.windows.create({ url: message.href });
      break;
    case "privateWindow":
      browser.windows.create({ url: message.href, incognito: true });
      break;
  }
});

