import React, { Component } from 'react';
import axios from 'axios';
import Switch from '@material-ui/core/Switch';
import { PROVINCES } from './constants';
import { getStorageData, setStorageData, addRuntimeMessageListener } from './utils';

import './App.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      active: true,
      data: [],
      lastUpdate: null,
      delay: 0,
      selectedProvince: null,
      alerts: [],
    };
  }

  async componentDidMount() {
    const storageData = await getStorageData();
    const state = {
      ...storageData,
      lastUpdate: new Date()
    };
    this.setState(state);

    addRuntimeMessageListener(this.onUpdate.bind(this));
  }

  onUpdate(request) {
    const state = {
      ...request,
      lastUpdate: new Date()
    };
    this.setState(state);
  }

  async onProvinceChange(event) {
    const selectedProvince = event.target.value;
    await setStorageData({ selectedProvince });
    this.setState({ selectedProvince });
  }

  async toggleActiveStatus(event) {
    const active = !this.state.active;
    await setStorageData({ active });
    this.setState({ active });
  }

  render() {
    return (
      <div className="App">
        <div className="App__Row App__Logo">
          <img src="/weather-icon.png" alt="SMN AR Logo"/>
        </div>

        <div className="App__Row">
          <span>
            <label>Activo</label>
          </span>
          <span className="align-right">
            <Switch
              className="Switch"
              color="primary"
              checked={this.state.active}
              onChange={this.toggleActiveStatus.bind(this)}
              value="active"
            />
          </span>
        </div>

        <div className="App__Row">
          <div>
            <label>Provincia</label>
          </div>
          <div>
            <select disabled={!this.state.active} value={this.state.selectedProvince} onChange={this.onProvinceChange.bind(this)}>
              {!this.state.selectedProvince &&
                <option value="-1">Seleccione una Provincia</option>
              }
              {PROVINCES.map((p, i) => (
                <option key={i} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
        {this.state.active && !!this.state.alerts.length &&
          <div className="App__Row App__AlertsContainer">
            <div className="App__AlertsContainer__Image">
              <img src="/warning.png" alt="SMN AR Alert Icon" />
            </div>
            <div className="App__AlertsContainer__AlertsQty">
              Existen {this.state.alerts.length} alertas para {this.state.selectedProvince}.
            </div>
            {this.state.lastUpdate &&
              <div className="App__AlertsContainer__LastUpdate">
                Última actualización: {this.state.lastUpdate.toLocaleString()}.
              </div>
            }
            <div className="App__AlertsContainer__MoreInfo">
              Para mayor información <a href="https://www.smn.gob.ar/smn_alertas/alertas" target="_blank">ingresa aquí</a>.
            </div>
          </div>
        }
      </div>
    );
  }
}

export default App;
