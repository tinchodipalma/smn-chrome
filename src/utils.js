/* global chrome */

export async function getStorageData(key = null) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(key, (data) => resolve(data));
  });
}

export async function setStorageData(data, callback = () => {}) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set(data, () => {
      callback(data);
      resolve(data);
    });
  });
}

export async function addRuntimeMessageListener(callback = () => {}) {
  chrome.runtime.onMessage.addListener(callback);
}
