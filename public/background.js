'use strict';

const initialState = {
  active: true,
  data: [],
  delay: (30 * 60 * 1000),
  selectedProvince: null,
  alerts: [],
};

let callbackTimeout = null;

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set(initialState, () => {
    initApp();
  });
});

async function initApp() {
  startIteration();
  listenStorageChanges();
}

async function startIteration() {
  const storageData = await getStorageData();
  await fetchData(storageData);

  const { delay, active } = storageData;

  if (callbackTimeout) {
    clearTimeout(callbackTimeout);
  }

  if (active) {
    callbackTimeout = setTimeout(async () => {
      startIteration();
    }, delay);
  }
}

async function fetchData(storageData) {
  let data = [];

  try {
    const response = await fetch('https://ws.smn.gob.ar/alerts/');
    data = await response.json();
  } catch (e) { }

  await setStorageData({ data })
}

async function getStorageData(key = null) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(key, (data) => resolve(data));
  });
}

async function setStorageData(data, callback = () => { }) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set(data, () => {
      callback(data);
      resolve(data);
    });
  });
}

function getAlerts({ selectedProvince, data }) {
  let alerts = [];
  if (selectedProvince && data && data.length) {
    alerts = data.filter((alert) => {
      const zones = Object.values(alert.zones).join(' ').toLowerCase();
      return zones.indexOf(selectedProvince.toLowerCase()) >= 0 && alert.status.toLowerCase() !== 'cese';
    });
  }
  return alerts;
}

const STORAGE_KEY_LISTENERS = {
  active: toggleActivation,
  data: onDataChange,
  selectedProvince: onSelectedProvinceChange,
  alerts: onAlertsChange,
};

async function checkAlerts() {
  const storageData = await getStorageData(); 
  const prevAlerts = storageData.alerts;
  const alerts = getAlerts(storageData);
  let hasChanges = prevAlerts.length !== alerts.length;

  if (!hasChanges) {
    const newAlerts = alerts.map(v => v.idAlert);
    const changes = prevAlerts.filter(v => newAlerts.indexOf(v.idAlert) < 0);

    hasChanges = !!changes.length;
  }

  if (hasChanges) {
    await setStorageData({ alerts });
  }
}

function toggleActivation({ newValue }) {
  if (newValue) {
    startIteration();
  } else {
    if (callbackTimeout) {
      clearTimeout(callbackTimeout);
    }
  }
}

function onDataChange({ newValue, oldValue }) {
  let hasChanges = newValue.length !== oldValue.length;
  if (!hasChanges) {
    const newData = newValue.map(v => v.idAlert);
    const changes = oldValue.filter(v => newData.indexOf(v.idAlert) < 0);

    hasChanges = !!changes.length;
  }

  if (hasChanges) {
    checkAlerts();
  }
}

function onSelectedProvinceChange({ newValue }) {
  if (newValue) {
    checkAlerts();
  }
}

function onAlertsChange({ newValue }) {
  triggerPopupUpdate();

  if (newValue.length) {
    notifyAlerts();
  }
}

async function triggerPopupUpdate() {
  const storageData = await getStorageData();
  chrome.runtime.sendMessage(storageData);
}

async function notifyAlerts() {
  const storageData = await getStorageData(); 

  chrome.notifications.create(
    null,
    {
      type: 'basic',
      title: `Existen alertas para ${storageData.selectedProvince}`,
      message: 'Primary message to display',
      iconUrl: 'weather-icon.png'
    },
    () => { }
  );
}

function listenStorageChanges() {
  chrome.storage.onChanged.addListener((changes, namespace) => {
    for (let key in changes) {
      const keyListenerCallback = STORAGE_KEY_LISTENERS[key];
      if (keyListenerCallback) {
        keyListenerCallback(changes[key], namespace);
      }
    }
  });
}