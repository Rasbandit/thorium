import fs from "fs";
import path from "path";
import uuid from "uuid";
import mkdirp from "mkdirp";
import App from "../../app";
import * as Classes from "../classes";
import { pubsub } from "../helpers/subscriptionManager.js";

let assetDir = path.resolve("./assets/");
//if (electron.app) {
//  assetDir = path.resolve(electron.app.getPath("appData") + "/thorium/assets");
//}
//
// Ensure the asset folder exists
if (!fs.existsSync(assetDir)) {
  fs.mkdirSync(assetDir);
}

export const AssetsQueries = {
  asset(root, { assetKey, simulatorId = "default" }) {
    const container = App.assetContainers.find(obj => {
      return obj.fullPath === assetKey;
    });
    if (!container) return {};
    return (
      App.assetObjects.find(
        obj =>
          obj.containerId === container.id && obj.simulatorId === simulatorId
      ) ||
      App.assetObjects.find(
        obj => obj.containerId === container.id && obj.simulatorId === "default"
      )
    );
  },
  assets(root, { assetKeys, simulatorId = "default" }) {
    return assetKeys.map(key => {
      const returnObj = App.assetObjects.find(obj => {
        return obj.simulatorId === simulatorId && obj.fullPath === key;
      });
      if (returnObj) {
        return { assetKey: key, url: returnObj.url };
      }
      return {};
    });
  },
  assetFolders(root, { name, names }) {
    if (name) {
      return App.assetFolders.filter(f => {
        return f.name === name;
      });
    }
    if (names) {
      return App.assetFolders.filter(f => {
        return names.indexOf(f.name) > -1;
      });
    }
    return App.assetFolders;
  }
};

export const AssetsMutations = {
  addAssetFolder(root, { name, folderPath, fullPath }, context) {
    App.handleEvent({ name, folderPath, fullPath }, "addAssetFolder", context);
    return "";
  },
  removeAssetFolder(root, { id }, context) {
    App.handleEvent({ id }, "removeAssetFolder", context);
    return "";
  },
  addAssetContainer(root, { name, folderId, folderPath, fullPath }, context) {
    App.handleEvent(
      { name, folderId, folderPath, fullPath },
      "addAssetContainer",
      context
    );
    return "";
  },
  removeAssetContainer(root, { id }, context) {
    App.handleEvent({ id }, "removeAssetContainer", context);
    return "";
  },
  removeAssetObject(root, { id }, context) {
    App.handleEvent({ id }, "removeAssetObject", context);
    // Get the object
    //const obj = App.assetObjects.find((object) => object.id === id);
    //const extension = obj.url.substr(obj.url.lastIndexOf('.'));
    //fs.unlink(path.resolve(`${assetDir}/${(obj.fullPath.substr(1) + extension)}`), () => {});

    return "";
  },
  async uploadAsset(root, args, context) {
    let { files, simulatorId, containerId, folderPath: givenFolderPath } = args;
    let container = App.assetContainers.find(
      container => containerId === container.id
    );
    let folderPath = givenFolderPath,
      fullPath;
    if (container) {
      folderPath = container.folderPath;
      fullPath = container.fullPath;
    }
    files.forEach(file => {
      // First, check to see if there is a container
      let container = App.assetContainers.find(
        container => containerId === container.id
      );
      let clearContainer = false;
      if (!container) {
        //Lets make a container for this asset
        const name = file.originalname.replace(/(\..{3})/gi, "");
        const folder = App.assetFolders.find(f => f.fullPath === folderPath);
        const folderId = folder && folder.id;

        const containerFullPath = folderPath + "/" + name;
        const params = {
          name,
          folderId,
          folderPath,
          fullPath: containerFullPath
        };
        App.assetContainers.push(new Classes.AssetContainer(params));
        container = App.assetContainers.find(
          container => container.fullPath === containerFullPath
        );
        containerId = container.id;
        folderPath = container.folderPath;
        fullPath = container.fullPath;

        // Clear the container variable when we are done so it can be reused for future files
        clearContainer = true;
      }
      const extension = file.originalname.substr(
        file.originalname.lastIndexOf(".")
      );
      const key = `${fullPath.substr(1)}/${simulatorId + extension}`;
      const filepath = path.resolve(assetDir + "/" + key);
      console.log(filepath);
      const directorypath = filepath.substring(0, filepath.lastIndexOf("/"));
      mkdirp.sync(directorypath);

      //Move the file in
      const writeStream = fs.createWriteStream(filepath);
      const stream = fs.createReadStream(file.path).pipe(writeStream);
      stream.on("error", function(err) {
        throw new Error(err);
      });
      writeStream.on("error", function(err) {
        throw new Error(err);
      });
      stream.on("close", function() {
        // Delete the temp file
        fs.unlink(file.path, () => {});
      });
      // Add to the event store
      App.handleEvent(
        {
          id: uuid.v4(),
          containerPath: folderPath,
          containerId,
          fullPath: `${fullPath}/${simulatorId + extension}`,
          url: `/assets${fullPath}/${simulatorId + extension}`,
          simulatorId
        },
        "addAssetObject",
        context
      );
      if (clearContainer) {
        container = {};
        containerId = null;
      }
    });
    pubsub.publish("assetFolderChange", App.assetFolders);
    return "";
  }
};

export const AssetsSubscriptions = {
  assetFolderChange(rootValue) {
    return rootValue;
  }
};

export const AssetsTypes = {
  AssetFolder: {
    containers(rootValue) {
      return App.assetContainers.filter(container => {
        return container.folderId === rootValue.id;
      });
    }
  },
  AssetContainer: {
    objects(rootValue) {
      return App.assetObjects.filter(object => {
        return object.containerId === rootValue.id;
      });
    }
  }
};
