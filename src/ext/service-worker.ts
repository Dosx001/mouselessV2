const getIndex = async (sender: chrome.runtime.MessageSender, off: number) => {
  const tabCount = (await chrome.tabs.query({ currentWindow: true })).length;
  const idx = sender.tab!.index! + off;
  return idx === -1 ? tabCount - 1 : tabCount === idx ? 0 : idx;
};

const file = "index.css";

chrome.tabs.query({}).then((tabs) => {
  for (const tab of tabs) {
    if (tab.url === undefined) continue;
    chrome.scripting
      .insertCSS({ files: [file], target: { tabId: tab.id! } })
      .catch((err) =>
        console.log("error: " + err + " In " + new URL(tab.url!).hostname),
      );
  }
});

chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  if (tab.url === undefined) return;
  chrome.scripting
    .insertCSS({ files: [file], target: { tabId: tabId } })
    .catch((err) =>
      console.log("error: " + err + " In " + new URL(tab.url!).hostname),
    );
});

chrome.runtime.onMessage.addListener(async (message, sender) => {
  switch (message.action) {
    case "css":
      if (sender.tab!.url === undefined) break;
      chrome.scripting
        .insertCSS({
          files: [file],
          target: { tabId: sender.tab!.id! },
        })
        .catch((err) => console.log("error: " + err));
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
