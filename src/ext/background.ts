let ENABLED = false;

async function sendTabEnabled(id: number, noretry: boolean) {
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
}

async function toggle() {
  ENABLED = !ENABLED;

  const name = "assets/" + (ENABLED ? "icon" : "icon-off");
  const title = ENABLED ? "Turn off Mouseless" : "Turn on Mouseless";

  browser.browserAction.setIcon({
    path: name + "-48.png",
  });

  browser.browserAction.setTitle({ title });

  const tabs = await browser.tabs.query({});
  for (const i in tabs) sendTabEnabled(tabs[i].id!, false);
}
toggle();

browser.browserAction.onClicked.addListener(toggle);

browser.tabs.onUpdated.addListener((id, evt) => {
  if (evt.status === "complete") sendTabEnabled(id, false);
});

async function getCurrTabOffset(off: number) {
  const win = await browser.windows.getCurrent();
  const tab = (await browser.tabs.query({ active: true, windowId: win.id }))[0];
  const tabCount = (await browser.tabs.query({ windowId: win.id })).length;

  let idx = tab.index + off;
  if (idx < 0) idx = tabCount - 1;
  else if (idx >= tabCount) idx = 0;

  return [tab, win, idx];
}

const brigdeBg = {
  changeTabLeft: async function() {
    const [_, win, index] = await getCurrTabOffset(-1);
    const ntab = (await browser.tabs.query({ windowId: win.id, index }))[0];
    browser.tabs.update(ntab.id!, { active: true });
  },
  changeTabRight: async function() {
    const [_, win, index] = await getCurrTabOffset(1);
    const ntab = (await browser.tabs.query({ windowId: win.id, index }))[0];
    browser.tabs.update(ntab.id!, { active: true });
  },

  moveTabLeft: async function() {
    const [tab, _, index] = await getCurrTabOffset(-1);
    browser.tabs.move(tab.id, { index });
  },
  moveTabRight: async function() {
    const [tab, _, index] = await getCurrTabOffset(1);
    browser.tabs.move(tab.id, { index });
  },

  openTab: function(href: string) {
    browser.tabs.create({
      url: href,
    });
  },
};

browser.runtime.onMessage.addListener((msg) => {
  const fn = brigdeBg[msg.action as keyof typeof brigdeBg];
  if (!fn) throw new Error("No such action: " + msg.action);
  fn.apply(null, msg.args);
});
