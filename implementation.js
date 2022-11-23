var { ExtensionCommon } = ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");
var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");

var microtribute = class extends ExtensionCommon.ExtensionAPI {
   getAPI(context) {
      let self = this;
      context.callOnClose(this);

      // keep track of windows manipulated by this API
      this.manipulatedWindows = [];

      return {
         microtribute: {
            async hideAccounts(windowId, enforceRebuild) {
               if (!windowId)
                  return false;

               //get the real window belonging to the WebExtebsion window ID
               let requestedWindow = context.extension.windowManager.get(windowId, context).window;

               if (!requestedWindow)
                  return false;

               function manipulate() {
                  const map = this.window.gFolderTreeView._rowMap;

                  if (map[0]._name !== "Unified Folders") {
                     return;
                  }

                  const filteredFolders = map.filter(i => i._folder && (
                     i._folder.hostname === "smart mailboxes" ||
                     i._folder.flags === 2052
                  ));

                  // Remove subfolders
                  filteredFolders.forEach(i => {
                     if (i._children && Array.isArray(i._children)) {
                        i._children.length = 0;
                     }
                  });

                  map.length = 0;
                  map.push(...filteredFolders);
               }

               let callback = manipulate.bind(requestedWindow);

               requestedWindow.addEventListener("mapRebuild", callback);

               self.manipulatedWindows.push({ requestedWindow, callback });

               // Enforce rebuild if installed.
               if (enforceRebuild) {
                  requestedWindow.gFolderTreeView._rebuild();
               }

            }
         }
      };
   }


   close() {
      // This is called when the API shuts down. This API could be invoked multiple times in different contexts
      // and we therefore need to cleanup actions done by this API here.
      for (let manipulated of this.manipulatedWindows) {
         manipulated.requestedWindow.removeEventListener("mapRebuild", manipulated.callback);
         manipulated.requestedWindow.gFolderTreeView._rebuild();
      }
   }

   onShutdown(isAppShutdown) {
      // This is called when the add-on or Thunderbird itself is shutting down.
      if (isAppShutdown) {
         return;
      }
      Services.obs.notifyObservers(null, "startupcache-invalidate", null);
   }
};
