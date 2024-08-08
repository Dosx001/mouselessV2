async function getIndex(tab: browser.tabs.Tab, off: number) {
  const tabCount = (await browser.tabs.query({ currentWindow: true })).length;
  const idx = tab.index + off;
  return idx === -1 ? tabCount - 1 : tabCount === idx ? 0 : idx;
}

const tabWin = new Map<number, number>();
browser.tabs.onRemoved.addListener((id) => tabWin.delete(id));

browser.commands.onCommand.addListener(async (cmd) => {
  const tab = (
    await browser.tabs.query({
      active: true,
      currentWindow: true,
    })
  )[0];
  switch (cmd) {
    case "duplicateTab":
      browser.tabs.duplicate(tab.id!, { active: false });
      break;
    case "changeTabLeft": {
      const query = {
        currentWindow: true,
        index: await getIndex(tab, 1),
      };
      browser.tabs.update((await browser.tabs.query(query))[0].id!, {
        active: true,
      });
      break;
    }
    case "changeTabRight": {
      const query = {
        currentWindow: true,
        index: await getIndex(tab, -1),
      };
      browser.tabs.update((await browser.tabs.query(query))[0].id!, {
        active: true,
      });
      break;
    }
    case "historyBack":
      browser.tabs.goBack(tab.id!);
      break;
    case "historyForward":
      browser.tabs.goForward(tab.id!);
      break;
    case "moveTabLeft":
      browser.tabs.move(tab.id!, {
        index: await getIndex(tab, 1),
      });
      break;
    case "moveTabRight":
      browser.tabs.move(tab.id!, {
        index: await getIndex(tab, -1),
      });
      break;
    case "tabAttach": {
      const winId = tabWin.get(tab.id!);
      if (winId) {
        browser.tabs.move(tab.id!, {
          windowId: winId,
          index: -1,
        });
        browser.tabs.update(tab.id!, { active: true });
        tabWin.delete(tab.id!);
      }
      break;
    }
    case "tabDetach": {
      await browser.windows.create({ tabId: tab.id });
      const blank = await browser.tabs.create({ url: "about:blank" });
      browser.tabs.remove(blank.id!);
      tabWin.set(tab.id!, tab.windowId!);
      break;
    }
  }
});

browser.runtime.onMessage.addListener(async (msg, sender) => {
  switch (msg.action) {
    case "openTabActive":
      browser.tabs.create({ url: msg.href, index: sender.tab!.index + 1 });
      break;
    case "openTab":
      browser.tabs.create({
        active: false,
        url: msg.href,
        index: sender.tab!.index + 1,
      });
      break;
    case "newWindow":
      browser.windows.create({ url: msg.href });
      break;
    case "privateWindow":
      browser.windows.create({ url: msg.href, incognito: true });
      break;
  }
});
