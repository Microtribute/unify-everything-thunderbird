// function to hide the email folder in the given main window (if it is a normal main window)
function hideAccounts(window, enforceRebuild) {
   if (window.type != "normal")
      return;

   // hide email folders for the given window
   messenger.microtribute.hideAccounts(window.id, enforceRebuild);
}

// register a event listener for newly opened windows, to
// automatically call hideAccounts() for them
messenger.windows.onCreated.addListener(hideAccounts);


// run thru all already opened main windows (type = normal) and hide email folders
// this will take care of all windows already open while the add-on is being installed or
// activated during the runtime of Thunderbird.
async function init() {
   let windows = await messenger.windows.getAll({ windowTypes: ["normal"] });
   for (let window of windows) {
      hideAccounts(window, true);
   }

   // register a event listener for newly opened windows, to
   // automatically call hideAccounts() for them
   messenger.windows.onCreated.addListener((window) => hideAccounts(window, false));
}


async function waitForLoad() {
   let onCreate = new Promise((resolve, reject) => {
      function listener() {
         browser.windows.onCreated.removeListener(listener);
         resolve(true);
      }

      browser.windows.onCreated.addListener(listener);
   });

   let windows = await browser.windows.getAll({ windowTypes: ["normal"] });

   if (windows.length > 0) {
      return false;
   } else {
      return onCreate;
   }
}

// self-executing async "main" function
(async () => {
   await waitForLoad();
   init();
})()
